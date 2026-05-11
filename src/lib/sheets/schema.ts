import { z } from 'zod';

/*
 * T-102 — Schema Zod da linha bruta da Sheet.
 *
 * Mapeia o array de células (A..Y) para um objeto opcional.
 * Toda coluna é optional: usuário disse "n sei até onde os consultores
 * preenchem aqui". Defesa: tratar tudo como pode-faltar.
 *
 * IMPORTANTE — DROPS DE PII (06-validation-deltas §2):
 *  Coluna I  — CPF do Aluno         → NÃO carregado para o domínio
 *  Coluna Q  — Celular do aluno     → NÃO carregado
 *  Coluna R  — E-mail do Aluno      → NÃO carregado
 *  Coluna T  — Bônus de Produtividade → fora da V1
 *  Coluna Y  — COMISSÃO PAGA        → fora da V1
 *  Coluna G  — Comprovante (link)   → ignorado (irrelevante p/ análise)
 */

// Cabeçalhos esperados (em ordem). Posições de drop ficam como string vazia
// para alinhamento com o array de células.
export const EXPECTED_HEADERS = [
  'Carimbo de data/hora', // 0
  'Comercial', // 1
  'Polo', // 2
  'Família de Produto', // 3
  'Sub Família de Produto', // 4
  'Valor Mensalidade', // 5
  'Comprovante de Pagamento da Matrícula', // 6 — ignorado
  'Nome do Aluno', // 7
  'CPF do Aluno', // 8 — DROP PII
  '', // 9 — coluna vazia observada na Sheet
  'Curso de Graduação', // 10
  'Ciclo de Ingresso', // 11
  'Curso de Pós graduação', // 12
  'Bolsa ou Convênio?', // 13
  'Quantidade de parcelas', // 14
  'Origem do Lead (Candidato)', // 15
  'Celular do aluno (com DDD)', // 16 — DROP PII
  'E-mail do Aluno', // 17 — DROP PII
  'Justificativa Matrícula 100% online', // 18
  'Bônus de Produtividade', // 19 — fora da V1
  'Modalidades de Ingresso', // 20
  'Indicado por', // 21
  'Matrícula realizada via', // 22
  'Indicação de:', // 23
  'COMISSÃO PAGA', // 24 — fora da V1
] as const;

const optStr = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => (v == null ? '' : String(v)))
  .optional();

export const RawRowSchema = z.object({
  carimbo: optStr,
  comercial: optStr,
  polo: optStr,
  familia: optStr,
  subFamilia: optStr,
  valorMensalidade: optStr,
  alunoNome: optStr,
  cursoGraduacao: optStr,
  cicloIngresso: optStr,
  cursoPos: optStr,
  bolsaConvenio: optStr,
  quantidadeParcelas: optStr,
  origem: optStr,
  justificativa100ead: optStr,
  modalidadeIngresso: optStr,
  indicadoPor: optStr,
  matriculaVia: optStr,
  indicacaoDe: optStr,
});

export type RawRow = z.infer<typeof RawRowSchema>;

/**
 * Converte uma linha (array de células) para o objeto RawRow,
 * descartando colunas de PII forte e colunas fora da V1.
 */
export function rowFromCells(cells: ReadonlyArray<unknown>): RawRow {
  return RawRowSchema.parse({
    carimbo: cells[0],
    comercial: cells[1],
    polo: cells[2],
    familia: cells[3],
    subFamilia: cells[4],
    valorMensalidade: cells[5],
    // cells[6] = comprovante (link drive) — ignorado
    alunoNome: cells[7],
    // cells[8] = CPF — DROP
    // cells[9] = empty col observada
    cursoGraduacao: cells[10],
    cicloIngresso: cells[11],
    cursoPos: cells[12],
    bolsaConvenio: cells[13],
    quantidadeParcelas: cells[14],
    origem: cells[15],
    // cells[16] = celular — DROP
    // cells[17] = email — DROP
    justificativa100ead: cells[18],
    // cells[19] = bonus — fora V1
    modalidadeIngresso: cells[20],
    indicadoPor: cells[21],
    matriculaVia: cells[22],
    indicacaoDe: cells[23],
    // cells[24] = comissao — fora V1
  });
}

export interface SchemaCheck {
  ok: boolean;
  missing: string[];
  extra: string[];
}

/**
 * Confere os cabeçalhos da linha 1 da Sheet contra o schema esperado.
 * Usado em integration / smoke para detectar drift.
 */
export function checkHeaders(headerRow: ReadonlyArray<unknown>): SchemaCheck {
  const got = headerRow.map((c) => String(c ?? '').trim());
  const required = EXPECTED_HEADERS.filter((h) => h !== '');
  const missing = required.filter((h) => !got.includes(h));
  const extra = got.filter((h) => h !== '' && !EXPECTED_HEADERS.includes(h as never));
  return { ok: missing.length === 0, missing, extra };
}
