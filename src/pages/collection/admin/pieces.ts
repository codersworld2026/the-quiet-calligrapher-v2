import type { APIRoute } from 'astro';
import { signedIn } from '../../../collection/auth';
import { isCategory } from '../../../collection/categories';
import { changePieces, deletePhoto, listPieces } from '../../../collection/pieces';

export const prerender = false;

// The buttons on Aliya's page for a photo already in The Collection: save its category and caption, or delete it.
// Each is a plain form, so they work before the page's script has loaded.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!signedIn(cookies)) return redirect('/collection/admin?notice=signed-out', 303);

  const form = await request.formData();
  const id = String(form.get('id') ?? '');
  const action = String(form.get('action') ?? '');

  if (action === 'delete') {
    const piece = (await listPieces()).find((piece) => piece.id === id);
    if (!piece) return redirect('/collection/admin?notice=missing', 303);
    await changePieces((pieces) => pieces.filter((piece) => piece.id !== id));
    await deletePhoto(piece.photo);
    return redirect('/collection/admin?notice=deleted', 303);
  }

  let found = false;
  if (action === 'save') {
    await changePieces((pieces) =>
      pieces.map((piece) => {
        if (piece.id !== id) return piece;
        found = true;
        const category = form.get('category');
        return {
          ...piece,
          category: isCategory(category) ? category : piece.category,
          caption: String(form.get('caption') ?? '').trim().slice(0, 300)
        };
      })
    );
  }
  return redirect(`/collection/admin?notice=${found ? 'saved' : 'missing'}#photo-${id}`, 303);
};
