/*
 * T-103 — Parse robusto de data vinda da Sheet.
 *
 * Formatos suportados:
 *   - BR DD/MM/YYYY [HH:MM[:SS]]   (formato do "Carimbo de data/hora")
 *   - ISO 8601 YYYY-MM-DD[T...]
 *   - "" / null / undefined        → null
 *   - texto livre não-data         → null
 *
 * Datas são interpretadas em horário local (TZ do servidor). Para
 * Vercel, definir TZ=America/Sao_Paulo nas env vars de produção.
 */

const BR_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function isValidDate(d: Date): boolean {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export function parseDate(input: unknown): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return isValidDate(input) ? input : null;

  const raw = String(input).trim();
  if (raw === '') return null;

  const br = raw.match(BR_DATE);
  if (br) {
    const [, dd, mm, yyyy, hh = '0', mi = '0', ss = '0'] = br;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(mi),
      Number(ss),
    );
    if (
      isValidDate(d) &&
      d.getFullYear() === Number(yyyy) &&
      d.getMonth() === Number(mm) - 1 &&
      d.getDate() === Number(dd)
    ) {
      return d;
    }
    return null;
  }

  // ISO YYYY-MM-DD puro → tratar como horário local (não UTC).
  // `new Date("2026-03-01")` é UTC midnight, vira 28/02 em horário negativo.
  // Forma com hora (`2026-03-01T10:00:00Z`) vai para o fallback abaixo.
  const isoDateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, yyyy, mm, dd] = isoDateOnly;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (
      isValidDate(d) &&
      d.getFullYear() === Number(yyyy) &&
      d.getMonth() === Number(mm) - 1 &&
      d.getDate() === Number(dd)
    ) {
      return d;
    }
    return null;
  }

  // ISO 8601 com tempo/timezone — Date construtor faz o parse correto.
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const iso = new Date(raw);
    if (isValidDate(iso)) return iso;
  }

  return null;
}
