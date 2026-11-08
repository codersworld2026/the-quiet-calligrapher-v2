// Makes the scrambled form of a password for The Collection, to store as COLLECTION_PASSWORD_HASH in Vercel (and in
// .env.local for local testing). The password itself is never stored.
//   printf '%s' 'the password' | node scripts/collection-password.mjs
// Changing the stored value signs Aliya out everywhere; she then signs in with the new password.
import { hashPassword } from '../src/collection/password.ts';

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, '');

if (!password) {
  console.error('No password given.');
  process.exit(1);
}
if (password.length < 10) console.error('Warning: under 10 characters. A longer password is much harder to guess.');
console.log(await hashPassword(password));
