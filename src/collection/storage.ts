import { createHmac } from 'node:crypto';
import { BLOB_READ_WRITE_TOKEN, COLLECTION_SECRET } from 'astro:env/server';

// Where The Collection keeps things in its Vercel Blob store. The store is public, so visitors' browsers can load
// photos from it, and anything in it can be read by anyone who knows its address. Photos get random names. The list of
// photos and the record of wrong sign-in tries go in a folder named after a hash of the secret, which can't be
// guessed, and the store can't be listed without its token.
export function storage() {
  if (!BLOB_READ_WRITE_TOKEN || !COLLECTION_SECRET) {
    throw new Error('The Collection needs BLOB_READ_WRITE_TOKEN and COLLECTION_SECRET.');
  }
  const folder = createHmac('sha256', COLLECTION_SECRET).update('collection data').digest('hex').slice(0, 32);
  return { token: BLOB_READ_WRITE_TOKEN, data: `collection/data/${folder}`, photos: 'collection/photos' };
}
