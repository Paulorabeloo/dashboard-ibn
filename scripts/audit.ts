/*
 * scripts/audit.ts — auditoria de qualidade dos dados.
 *
 * Lista todos os valores brutos das colunas que viram enum, pra
 * identificar parsers que estão deixando passar muitos como 'outro'.
 */
import { fetchRawSheet, makeSheetsClient } from '@/lib/sheets/adapter';
import { normalize } from '@/lib/sheets/normalizer';
import { rowFromCells, EXPECTED_HEADERS } from '@/lib/sheets/schema';

const saKeyB64 = process.env.GOOGLE_SA_KEY ?? '';
const sheetId = process.env.SHEETS_ID ?? '';
const range = process.env.SHEETS_RANGE ?? '';

async function main() {
  const client = makeSheetsClient(saKeyB64);
  const { rows } = await fetchRawSheet(client, { sheetId, range });
  const result = normalize(rows);

  // 1. Validar contagens consistentes
  console.log('=== Validação de contagens ===');
  console.log(`Total matrículas: ${result.matriculas.length}`);
  console.log(`Linhas dropadas (sem carimbo): ${result.droppedCount}`);
  console.log(`Polos únicos: ${result.polos.length}`);
  console.log(`Vendedoras únicas: ${result.vendedoras.length}`);
  console.log('');

  // 2. Valores brutos por enum
  console.log('=== Origens brutas (Sheet) → enum ===');
  const origensBrutas = new Map<string, { count: number; mapped: string }>();
  for (const row of rows) {
    const raw = row.origem ?? '';
    if (!raw) continue;
    const existing = origensBrutas.get(raw);
    if (existing) existing.count += 1;
    else origensBrutas.set(raw, { count: 1, mapped: '?' });
  }
  // Cruza com normalize: pega o origem normalizado de uma matrícula que tinha cada raw
  const sample = new Map<string, string>();
  for (const m of result.matriculas) {
    if (!sample.has(m.origem)) sample.set(m.origem, '');
  }
  // Mostra ordenado
  const sortedOrigens = Array.from(origensBrutas.entries()).sort((a, b) => b[1].count - a[1].count);
  for (const [raw, info] of sortedOrigens.slice(0, 30)) {
    console.log(`  ${info.count.toString().padStart(5)} "${raw}"`);
  }
  console.log(`  ... ${sortedOrigens.length} valores únicos no total`);
  console.log('');

  // 3. Famílias brutas
  console.log('=== Famílias brutas (Sheet) ===');
  const familiasBrutas = new Map<string, number>();
  for (const row of rows) {
    const raw = row.familia ?? '';
    if (!raw) continue;
    familiasBrutas.set(raw, (familiasBrutas.get(raw) ?? 0) + 1);
  }
  for (const [raw, n] of Array.from(familiasBrutas.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(5)} "${raw}"`);
  }
  console.log('');

  // 4. Sub-famílias / modalidades
  console.log('=== Sub-famílias brutas (Sheet) ===');
  const subBrutas = new Map<string, number>();
  for (const row of rows) {
    const raw = row.subFamilia ?? '';
    if (!raw) continue;
    subBrutas.set(raw, (subBrutas.get(raw) ?? 0) + 1);
  }
  for (const [raw, n] of Array.from(subBrutas.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${n.toString().padStart(5)} "${raw}"`);
  }
  console.log('');

  // 5. Polos brutos
  console.log('=== Polos brutos (Sheet) ===');
  const polosBrutos = new Map<string, number>();
  for (const row of rows) {
    const raw = row.polo ?? '';
    if (!raw) continue;
    polosBrutos.set(raw, (polosBrutos.get(raw) ?? 0) + 1);
  }
  for (const [raw, n] of Array.from(polosBrutos.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(5)} "${raw}"`);
  }
  console.log('');

  // 6. Distribuição de valorMensalidade
  const valores = result.matriculas
    .map((m) => m.valorMensalidade)
    .filter((v): v is number => v != null && v > 0);
  console.log('=== Valor Mensalidade ===');
  console.log(`  Total com valor: ${valores.length} / ${result.matriculas.length}`);
  if (valores.length > 0) {
    const sorted = [...valores].sort((a, b) => a - b);
    const min = sorted[0]!;
    const max = sorted[sorted.length - 1]!;
    const median = sorted[Math.floor(sorted.length / 2)]!;
    console.log(`  Min: ${min.toFixed(2)} · Mediana: ${median.toFixed(2)} · Max: ${max.toFixed(2)}`);
  }
  console.log('');

  // 7. Datas extremas
  const datas = result.matriculas.map((m) => m.dataMatricula.getTime()).sort((a, b) => a - b);
  if (datas.length > 0) {
    console.log('=== Datas ===');
    console.log(`  Primeira: ${new Date(datas[0]!).toLocaleDateString('pt-BR')}`);
    console.log(`  Última: ${new Date(datas[datas.length - 1]!).toLocaleDateString('pt-BR')}`);
  }
  console.log('');

  // 8. Cobertura de ciclos
  console.log('=== Cobertura por ciclo ===');
  const porCiclo = new Map<string, number>();
  for (const m of result.matriculas) porCiclo.set(m.cicloId, (porCiclo.get(m.cicloId) ?? 0) + 1);
  for (const [id, n] of Array.from(porCiclo.entries()).sort()) {
    console.log(`  ${id}: ${n.toLocaleString('pt-BR')}`);
  }
}

main().catch((err) => {
  console.error('Falhou:', err instanceof Error ? err.message : err);
  process.exit(1);
});
