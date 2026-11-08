import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { del, list, put } from '@vercel/blob';
import { COLLECTION_EMAIL, COLLECTION_PASSWORD_HASH, COLLECTION_SECRET } from 'astro:env/server';
import { checkPassword } from './password';
import { storage } from './storage';

// Signing in to The Collection: Aliya types her email address and password, and stays signed in on that device for
// 14 days. The address is COLLECTION_EMAIL; the password is kept only scrambled, in COLLECTION_PASSWORD_HASH
// (scripts/collection-password.mjs makes a new one). Sessions are signed with COLLECTION_SECRET and tied to the
// current address and password, so changing either signs her out everywhere.
// Wrong tries are counted, so nobody can sit guessing: after 5 from one connection in 15 minutes, or 30 from anywhere
// in an hour, signing in pauses until the oldest of them has aged out.
// Forms that change anything are posted from the site itself: Astro refuses on-demand form posts from other sites
// (its `checkOrigin` check), and the session cookie isn't sent with them either (SameSite).
const SESSION_DAYS = 14;
const SESSION_COOKIE = 'collection_session';
const COOKIE_PATH = '/collection/admin';
const LIMITS = { perConnection: { tries: 5, minutes: 15 }, overall: { tries: 30, minutes: 60 } };

interface Session {
  email: string;
  expires: number;
  key: string;
}

export type SignInResult = 'ok' | 'wrong' | 'paused' | 'not-set-up';

const normalise = (email: string) => email.trim().toLowerCase();

export const isSetUp = () => Boolean(COLLECTION_SECRET && COLLECTION_EMAIL && COLLECTION_PASSWORD_HASH);

const sign = (text: string) => createHmac('sha256', COLLECTION_SECRET!).update(text).digest('base64url');

// Changes whenever the address or password does, which ends any session made before.
const currentKey = () => sign(`key ${normalise(COLLECTION_EMAIL!)} ${COLLECTION_PASSWORD_HASH}`).slice(0, 22);

function seal(session: Session) {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${body}.${sign(`session ${body}`)}`;
}

function unseal(value: string | undefined): Session | undefined {
  const [body, given] = (value ?? '').split('.');
  if (!body || !given || !isSetUp()) return;
  const expected = Buffer.from(sign(`session ${body}`));
  const actual = Buffer.from(given);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return;
  const session = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
  if (session.expires < Date.now() || session.key !== currentKey()) return;
  return session;
}

// The wrong tries from the last hour, recorded as "<connection>.<time>.<random>" in the store's private folder. The
// connection is a hash of the visitor's internet address, so the address itself isn't kept. Older records are cleared.
async function recentWrongTries() {
  const { token, data } = storage();
  const { blobs } = await list({ token, prefix: `${data}/wrong/` });
  const now = Date.now();
  const tries = blobs.map(({ pathname, url }) => {
    const [connection, time] = pathname.split('/').pop()!.split('.');
    return { connection, age: now - Number(time), url };
  });
  const old = tries.filter(({ age }) => age >= LIMITS.overall.minutes * 60_000).map(({ url }) => url);
  if (old.length) await del(old, { token }).catch((error) => console.error(error));
  return tries;
}

export async function signIn(email: string, password: string, address: string, cookies: AstroCookies): Promise<SignInResult> {
  if (!isSetUp()) return 'not-set-up';
  const connection = createHmac('sha256', COLLECTION_SECRET!).update(`connection ${address}`).digest('hex').slice(0, 16);
  const tries = await recentWrongTries();
  const within = (minutes: number) => tries.filter(({ age }) => age < minutes * 60_000);
  const { perConnection, overall } = LIMITS;
  if (
    within(perConnection.minutes).filter((attempt) => attempt.connection === connection).length >= perConnection.tries ||
    within(overall.minutes).length >= overall.tries
  ) {
    return 'paused';
  }

  const rightEmail = normalise(email) === normalise(COLLECTION_EMAIL!);
  const rightPassword = await checkPassword(password, COLLECTION_PASSWORD_HASH!);
  if (!rightEmail || !rightPassword) {
    const { token, data } = storage();
    await put(`${data}/wrong/${connection}.${Date.now()}.${randomBytes(4).toString('hex')}`, '1', {
      access: 'public',
      token,
      addRandomSuffix: false
    });
    return 'wrong';
  }

  cookies.set(SESSION_COOKIE, seal({ email: normalise(email), expires: Date.now() + SESSION_DAYS * 864e5, key: currentKey() }), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: SESSION_DAYS * 86400
  });
  return 'ok';
}

// The signed-in address, if there's a valid session.
export const signedIn = (cookies: AstroCookies) => unseal(cookies.get(SESSION_COOKIE)?.value)?.email;

export function signOut(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: COOKIE_PATH });
}
