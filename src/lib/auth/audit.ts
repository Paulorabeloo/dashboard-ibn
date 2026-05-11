import { createHash } from 'node:crypto';

/*
 * T-205 — Hash de e-mail para logs de auditoria (RNF-12).
 * Permite correlacionar tentativas sem persistir PII.
 */
export function hashEmail(email: string | null | undefined): string {
  if (!email) return '';
  return createHash('sha256')
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex')
    .slice(0, 12);
}
