/*
 * T-106 — Sanitização defensiva de strings vindas da Sheet.
 *
 * React por default escapa HTML, então XSS via {string} é mitigado pelo
 * runtime. Esta função cobre 3 frentes adicionais:
 *
 *  1. **Formula injection** — célula com `=`, `+`, `-`, `@`, `\t` ou `\r`
 *     é prefixada com apóstrofo. Mitigação preventiva caso o conteúdo
 *     vá para CSV/XLSX/clipboard no futuro.
 *  2. **Caracteres de controle** — removidos (preserva quebras de linha
 *     legítimas \n e tab \t).
 *  3. **Limite de tamanho** — corta em 500 chars para evitar payloads
 *     absurdos travarem render/log.
 */

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

// Range de caracteres de controle ASCII (0x00–0x08, 0x0B, 0x0C, 0x0E–0x1F,
// 0x7F). Preserva \t (0x09) e \n (0x0A). Construído via `new RegExp` com
// escapes \\u em string literal para evitar que os caracteres de controle
// fiquem inline no source — o que confunde editores e tooling.
const CONTROL_CHARS = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]',
  'g',
);

const MAX_LEN = 500;

export function sanitizeText(input: unknown): string {
  if (input == null) return '';
  let s = String(input).replace(CONTROL_CHARS, '').trim();
  if (s === '') return '';
  if (FORMULA_PREFIX.test(s)) s = `'${s}`;
  if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN);
  return s;
}
