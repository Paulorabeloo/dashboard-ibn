/*
 * SR-001 / T-201 — Allowlist de e-mails autorizados.
 *
 * Lista vem da env `AUTH_ALLOWED_EMAILS` em CSV. Comparação é
 * case-insensitive. Fail-closed: lista vazia ⇒ ninguém entra.
 *
 * Aplicado em duas camadas (defesa em profundidade):
 *   1. Callback `signIn` no Auth.js (rejeita o OAuth callback).
 *   2. Middleware Edge (rejeita requests sem sessão válida).
 */

export function parseAllowlist(envValue: string | null | undefined): ReadonlySet<string> {
  if (!envValue) return new Set<string>();
  return new Set(
    envValue
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}

export function isAllowedEmail(
  email: string | null | undefined,
  allowlist: ReadonlySet<string>,
): boolean {
  if (!email || allowlist.size === 0) return false;
  return allowlist.has(email.trim().toLowerCase());
}

/** Mascara um e-mail para exibição: `j***@dominio.com`. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}
