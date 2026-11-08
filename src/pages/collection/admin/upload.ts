import type { APIRoute } from 'astro';
import { signedIn } from '../../../collection/auth';
import { isCategory } from '../../../collection/categories';
import { changePieces, newPieceId, storePhoto } from '../../../collection/pieces';

export const prerender = false;

// Adds one photo. Aliya's page shrinks each photo to a JPEG of at most 2,400 pixels before sending it (which also
// drops the camera's location data), so anything bigger or not a JPEG didn't come from there.
const MAX_BYTES = 4 * 1024 * 1024;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!signedIn(cookies)) return Response.json({ error: 'Please sign in again.' }, { status: 401 });

  const form = await request.formData();
  const photo = form.get('photo');
  const category = form.get('category');
  const caption = String(form.get('caption') ?? '').trim().slice(0, 300);
  const width = Number(form.get('width'));
  const height = Number(form.get('height'));

  if (!(photo instanceof File) || photo.type !== 'image/jpeg' || photo.size > MAX_BYTES) {
    return Response.json({ error: 'That photo couldn’t be read. Please try another.' }, { status: 400 });
  }
  const start = new Uint8Array(await photo.slice(0, 3).arrayBuffer());
  if (start[0] !== 0xff || start[1] !== 0xd8 || start[2] !== 0xff) {
    return Response.json({ error: 'That photo couldn’t be read. Please try another.' }, { status: 400 });
  }
  if (!isCategory(category)) return Response.json({ error: 'Please choose a category.' }, { status: 400 });
  if (![width, height].every((side) => Number.isInteger(side) && side > 0 && side <= 2400)) {
    return Response.json({ error: 'That photo couldn’t be read. Please try another.' }, { status: 400 });
  }

  const url = await storePhoto(photo);
  await changePieces((pieces) => [
    { id: newPieceId(), category, caption, photo: url, width, height, added: new Date().toISOString() },
    ...pieces
  ]);
  return Response.json({ ok: true });
};
