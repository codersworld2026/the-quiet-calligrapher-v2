import type { APIRoute } from 'astro';
import { signOut } from '../../../collection/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  signOut(cookies);
  return redirect('/collection/admin?notice=signed-out', 303);
};
