import { normalize } from '@/lib/sheets/normalizer';
import { rowFromCells } from '@/lib/sheets/schema';
import type { DashboardData } from '@/types/domain';

/*
 * Fallback determinístico para desenvolvimento local quando ainda não
 * configuramos a Service Account do Google Sheets.
 *
 * Produz ~250 matrículas sintéticas distribuídas pelos ciclos
 * 2024.1 → 2026.1, com formato igual ao que viria da Sheet real.
 * Determinístico (PRNG seedado) para que reloads não embaralhem o UI.
 */

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POLOS = [
  'Polo A',
  'Polo B',
  'Polo C',
  'Polo D',
  'Polo E',
  'Polo F',
];
const VENDEDORAS = Array.from({ length: 10 }, (_, i) => `Vendedora ${i + 1}`);
const FAMILIAS_RAW = ['Pós-graduação', 'Pós em DOBRO', 'Graduação', 'Técnicos'];
const SUB_FAMILIAS = ['100% Online (EAD)', 'Semi Presencial', 'Premium (Híbrido Lab)'];
const ORIGENS = [
  'Lead do Sistema',
  'Disparos',
  'Indicação',
  'Tráfego Pago',
  'CUBO',
  'Receptivo [aluno iniciou o contato]',
];
const BOLSAS = [
  'Voucher Pós Graduação',
  'Bolsa Gestor',
  'Convênio Pague Fácil',
  'Nenhum (Valor Bruto)',
];
const VALORES = [89, 149.9, 199.9, 489.5, 899, 1299.9, 2499];
const PARCELAS = [12, 17, 24, 36, 48];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function pickFrom<T>(arr: ReadonlyArray<T>, rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

export function buildDevFallbackData(): DashboardData {
  const rand = makePrng(42);
  const startTs = new Date(2024, 0, 1).getTime();
  const endTs = Date.now();

  const N = 250;
  const rows = [];

  for (let i = 0; i < N; i++) {
    const ts = startTs + rand() * (endTs - startTs);
    const d = new Date(ts);
    const carimbo = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    const familiaRaw = pickFrom(FAMILIAS_RAW, rand);
    const isPos = familiaRaw.toLowerCase().includes('pós');
    const isTec = familiaRaw.toLowerCase().includes('técnico');
    const cells: ReadonlyArray<unknown> = [
      carimbo,
      pickFrom(VENDEDORAS, rand),
      pickFrom(POLOS, rand),
      familiaRaw,
      isTec ? '' : pickFrom(SUB_FAMILIAS, rand),
      pickFrom(VALORES, rand),
      '',
      `Aluno Sintético ${i + 1}`,
      '00000000000',
      '',
      isPos || isTec ? '' : `Curso Grad ${(i % 5) + 1}`,
      isPos ? 'PÓS GRADUAÇÃO' : isTec ? 'TÉCNICO' : `2025.${(i % 2) + 1}`,
      isPos ? `Curso Pós ${(i % 4) + 1}` : '',
      pickFrom(BOLSAS, rand),
      pickFrom(PARCELAS, rand),
      pickFrom(ORIGENS, rand),
      '00 00000-0000',
      `aluno${i + 1}@example.com`,
      '',
      '',
      'Não Aplicável [Matrícula Normal]',
      rand() < 0.15 ? `Indicador ${i % 7}` : '',
      '',
      '',
      '',
    ];
    rows.push(rowFromCells(cells));
  }

  const result = normalize(rows);
  const { droppedCount: _drop, ...data } = result;
  return data;
}
