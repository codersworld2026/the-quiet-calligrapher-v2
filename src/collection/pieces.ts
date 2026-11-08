import { randomUUID } from 'node:crypto';
import { BlobError, del, get, list, put } from '@vercel/blob';
import { storage } from './storage';

// One photo in The Collection. Its caption (which may be empty) is both the line visitors read under the photo and
// the text screen readers and search engines get in place of it.
export interface Piece {
  id: string;
  category: string;
  caption: string;
  // The photo's address in the Blob store, and its size in pixels.
  photo: string;
  width: number;
  height: number;
  // When it was added, as an ISO date.
  added: string;
}

// The photos are kept as one list, newest first. Each change saves the whole list as a new numbered version
// (pieces/0000000001.json and so on) rather than overwriting a file: the store shows a new file straight away, but can
// take a while to show an overwritten one everywhere. Readers take the highest number. Two saves can't both create the
// same number, so one that loses the race reads again and retries, and no change is lost. The last few versions are
// kept, in case one is ever needed again.
const VERSIONS_KEPT = 5;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isTaken = (error: unknown) => error instanceof BlobError && /already exists/.test(error.message);

async function versions() {
  const { token, data } = storage();
  const { blobs } = await list({ token, prefix: `${data}/pieces/` });
  return blobs
    .map(({ pathname, url }) => ({ url, pathname, number: Number(pathname.split('/').pop()!.replace('.json', '')) }))
    .sort((a, b) => a.number - b.number);
}

async function read() {
  const { token } = storage();
  const all = await versions();
  const latest = all.at(-1);
  if (!latest) return { pieces: [] as Piece[], number: 0, all };
  for (let attempt = 1; attempt <= 5; attempt++) {
    const result = await get(latest.pathname, { access: 'public', token, useCache: false });
    if (result?.statusCode === 200) {
      const { pieces } = (await new Response(result.stream).json()) as { pieces: Piece[] };
      return { pieces, number: latest.number, all };
    }
    await wait(200 * attempt);
  }
  throw new Error('The list of photos couldn’t be read. Please try again.');
}

export const listPieces = async () => (await read()).pieces;

export async function changePieces(change: (pieces: Piece[]) => Piece[]) {
  const { token, data } = storage();
  for (let attempt = 1; attempt <= 8; attempt++) {
    const { pieces, number, all } = await read();
    const next = number + 1;
    try {
      await put(`${data}/pieces/${String(next).padStart(10, '0')}.json`, JSON.stringify({ pieces: change(pieces) }), {
        access: 'public',
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 31536000
      });
    } catch (error) {
      if (!isTaken(error)) throw error;
      await wait(200 * attempt);
      continue;
    }
    const old = all.filter((version) => version.number <= next - VERSIONS_KEPT).map((version) => version.url);
    if (old.length) await del(old, { token }).catch((error) => console.error(error));
    return;
  }
  throw new Error('The list of photos couldn’t be saved. Please try again.');
}

// Photos are stored once and never changed, so browsers and Vercel may cache them for a year.
export async function storePhoto(photo: Blob) {
  const { token, photos } = storage();
  const { url } = await put(`${photos}/${randomUUID()}.jpg`, photo, {
    access: 'public',
    token,
    contentType: 'image/jpeg',
    cacheControlMaxAge: 31536000
  });
  return url;
}

export async function deletePhoto(url: string) {
  await del(url, { token: storage().token });
}

export const newPieceId = () => randomUUID();
