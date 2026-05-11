import { createHash } from 'node:crypto';

/*
 * T-107 — Hash determinístico para Matricula.id.
 *
 * A Sheet não tem PK natural confiável, então geramos um id estável
 * a partir de campos-chave. Mesma combinação de campos = mesmo id.
 */
export function hashRow(...parts: ReadonlyArray<string | number | null | undefined>): string {
  const text = parts.map((p) => (p == null ? '' : String(p))).join('');
  return createHash('sha1').update(text, 'utf8').digest('hex').slice(0, 12);
}
