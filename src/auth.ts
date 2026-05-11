import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { isAllowedEmail, parseAllowlist } from '@/lib/auth/allowlist';
import { hashEmail } from '@/lib/auth/audit';
import { log } from '@/lib/log';

/*
 * T-201 — Auth.js v5 config.
 *
 * Provider: Google. Gating: allowlist de e-mails (SR-001).
 * Variáveis env (auto-detectadas pelo Auth.js v5):
 *   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, AUTH_URL
 *
 * NÃO usamos `hd` (hosted domain) do Google — usuário confirmou que
 * gestores usam domínios diversos (Gmail, etc.). Allowlist explícita
 * é a única política aceita.
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, profile }) {
      const allowlist = parseAllowlist(process.env.AUTH_ALLOWED_EMAILS);
      const email = user?.email ?? profile?.email ?? null;
      const ok = isAllowedEmail(email, allowlist);

      log.info('auth.signin', {
        ok,
        reason: ok ? 'allowed' : allowlist.size === 0 ? 'allowlist_empty' : 'not_in_allowlist',
        emailHash: hashEmail(email),
      });

      return ok;
    },
    async session({ session, token }) {
      // Anexa o sub (id estável do Google) à sessão para audit.
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  trustHost: true,
});
