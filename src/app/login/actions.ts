'use server';

import {signIn} from '@/auth';

export async function signInWithGoogle(formData: FormData) {
  const raw = String(formData.get('callbackUrl') ?? '');
  const target = raw.startsWith('/admin') && !raw.startsWith('//') ? raw : '/admin';
  await signIn('google', {redirectTo: target});
}
