import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {resolveRole, type Role} from '@/lib/roles';

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      /** Hint only. Server code must re-check with requireAdmin(). */
      role?: Role;
    };
  }
}

export const {handlers, auth, signIn, signOut} = NextAuth({
  providers: [Google],
  session: {strategy: 'jwt', maxAge: 60 * 60 * 24 * 7},
  pages: {signIn: '/login', error: '/login'},
  callbacks: {
    async signIn({account, profile}) {
      if (account?.provider !== 'google') return false;
      if (!profile?.email || profile.email_verified !== true) return false;
      return (await resolveRole(profile.email)) !== null;
    },
    async jwt({token, profile}) {
      if (profile?.email) {
        token.email = profile.email.toLowerCase();
        token.role = (await resolveRole(profile.email)) ?? undefined;
      }
      return token;
    },
    async session({session, token}) {
      if (token.email) session.user.email = token.email;
      session.user.role = token.role as Role | undefined;
      return session;
    },
  },
});
