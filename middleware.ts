import { auth } from '@/auth';

/*
 * T-202 — Middleware Edge.
 *
 * Camada de defesa em profundidade sobre o callback `signIn` do Auth.js:
 *   - rejeita request sem cookie de sessão para qualquer rota protegida;
 *   - libera explicitamente rotas públicas (login, callbacks Auth, health, cron).
 *
 * O callback `signIn` em `src/auth.ts` já garante que apenas e-mails na
 * allowlist receberam um cookie em primeiro lugar. Aqui apenas validamos
 * a presença do cookie.
 */

const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  '/login',
  '/api/health',
  '/api/cron/revalidate',
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth/')) {
    return;
  }

  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return Response.redirect(loginUrl);
  }

  return;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)'],
};
