import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// Aliya's password is kept only scrambled, as "scrypt:N:r:p:salt:key" with the salt and key in base64url. Checking a
// password takes about a tenth of a second: nothing when she signs in, but a crawl for anyone trying to guess it.
// No dollar signs, because .env files would read them as variables.
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_BYTES = 32;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, bytes: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, bytes, { N: n, r, p, maxmem: 256 * n * r }, (error, key) =>
      error ? reject(error) : resolve(key)
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEY_BYTES);
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join(':');
}

export async function checkPassword(password: string, stored: string) {
  const [scheme, n, r, p, salt, key] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64url');
  const actual = await derive(password, Buffer.from(salt, 'base64url'), Number(n), Number(r), Number(p), expected.length);
  return timingSafeEqual(expected, actual);
}
