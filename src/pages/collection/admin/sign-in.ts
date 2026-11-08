import type { APIRoute } from 'astro';
import { signIn, type SignInResult } from '../../../collection/auth';

export const prerender = false;

// Checks Aliya's email address and password, then sends her to her page, or back to the form with what went wrong.
export const POST: APIRoute = async (context) => {
  const { request, cookies, redirect } = context;
  const form = await request.formData();
  const email = String(form.get('email') ?? '').slice(0, 254);
  const password = String(form.get('password') ?? '').slice(0, 200);
  // Read inside `try`: Astro throws when the visitor's address isn't known (Vercel normally supplies it). Without
  // it, every such visitor shares one count of wrong tries.
  let address = 'unknown';
  try {
    address = context.clientAddress;
  } catch {
    // Keep 'unknown'.
  }

  let result: SignInResult | 'unavailable';
  try {
    result = await signIn(email, password, address, cookies);
  } catch (error) {
    console.error(error);
    result = 'unavailable';
  }
  return redirect(result === 'ok' ? '/collection/admin' : `/collection/admin?notice=${result}`, 303);
};
