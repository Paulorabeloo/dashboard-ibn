/*
 * Parse robusto de "Valor Mensalidade" e "Quantidade de parcelas".
 *
 * Aceita:
 *   - número JS direto:        89, 89.5
 *   - inteiro como string:     "89"
 *   - decimal BR:              "89,90", "1.299,90"
 *   - decimal US:              "89.90", "1,299.90"  (apenas se NÃO houver vírgula)
 *   - prefixo monetário:       "R$ 89,90", "R$1.299,90"
 *
 * Vazio/inválido → null.
 *
 * Heurística: se houver vírgula, tratar como separador decimal BR
 * (ponto vira milhar). Caso contrário, ponto é decimal padrão JS.
 *
 * Sanity check: valores absurdos (> 1.000.000) viram null para evitar
 * erros de digitação na Sheet poluírem médias e somatórios.
 */
const MAX_RAZOAVEL = 1_000_000;

export function parseNumber(input: unknown): number | null {
  if (input == null) return null;

  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }

  let s = String(input).trim();
  if (s === '') return null;

  // Remove R$, espaços, NBSPs.
  s = s.replace(/r\$/gi, '').replace(/[\s ]/g, '');

  if (s === '' || s === '-' || s === '+') return null;

  if (s.includes(',')) {
    // Formato BR: ponto = milhar, vírgula = decimal.
    s = s.replace(/\./g, '').replace(',', '.');
  }

  // Aceita até 1 ponto decimal e sinal opcional.
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return null;

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  // Sanity check: valores absurdos provavelmente são erro de digitação.
  if (Math.abs(n) > MAX_RAZOAVEL) return null;
  return n;
}
