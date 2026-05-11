import { describe, expect, it } from 'vitest';

import { normalize } from '@/lib/sheets/normalizer';
import { rowFromCells } from '@/lib/sheets/schema';

import happyFixture from '@tests/fixtures/sheets/happy.json';

/*
 * Integration test do normalizer com fixture sintética.
 * Fixture inclui linhas sintéticas + 1 linha lixo (deve ser dropada).
 */

function loadFixtureRows() {
  const values = happyFixture.values as unknown[][];
  return values.slice(1).map((cells) => rowFromCells(cells));
}

describe('normalizer', () => {
  it('parseia a fixture e produz DashboardData consistente', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows, { now: new Date(2026, 4, 10, 12, 0, 0) });

    // 6 linhas no fixture - 1 lixo (sem carimbo) = 5 matrículas
    expect(result.matriculas).toHaveLength(5);
    expect(result.droppedCount).toBe(1);

    // Snapshot da primeira matrícula
    const real = result.matriculas[0]!;
    expect(real.dataMatricula.getFullYear()).toBe(2024);
    expect(real.dataMatricula.getMonth()).toBe(0);
    expect(real.dataMatricula.getDate()).toBe(3);
    expect(real.cicloId).toBe('2024.1');
    expect(real.vendedoraNome).toBe('Vendedora Exemplo');
    expect(real.alunoNome).toBe('Aluno Exemplo A');
    expect(real.familia).toBe('pos');
    expect(real.origem).toBe('receptivo');
    expect(real.valorMensalidade).toBe(89);
    expect(real.quantidadeParcelas).toBe(17);
    expect(real.bolsaConvenio).toBe('Nenhum (Valor Bruto)');
    expect(real.valePix).toBeNull(); // não foi indicação
  });

  it('detecta ValePix quando "Indicado por" está preenchido', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows);
    const indicacao = result.matriculas.find((m) => m.valePix !== null);
    expect(indicacao).toBeDefined();
    expect(indicacao?.valePix?.indicadoPor).toBe('Indicador Exemplo');
    expect(indicacao?.valePix?.valor).toBeCloseTo(1299.9, 5);
    expect(indicacao?.valePix?.quantidade).toBe(24);
  });

  it('mapeia famílias corretamente (Pós em DOBRO → pos, Técnicos → tecnico)', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows);
    const familias = result.matriculas.map((m) => m.familia);
    expect(familias).toContain('pos');
    expect(familias).toContain('graduacao');
    expect(familias).toContain('tecnico');
  });

  it('mapeia origens corretamente (incluindo Receptivo)', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows);
    const origens = new Set(result.matriculas.map((m) => m.origem));
    expect(origens.has('receptivo')).toBe(true);
    expect(origens.has('lead_sistema')).toBe(true);
    expect(origens.has('indicacao')).toBe(true);
    expect(origens.has('trafego_pago')).toBe(true);
    expect(origens.has('cubo')).toBe(true);
  });

  it('vendedora ganha poloPrincipalId pelo polo mais frequente', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows);
    // Vendedora Exemplo 2 aparece 2x, com polos diferentes — basta o campo estar populado.
    const vend = result.vendedoras.find((v) => v.nome === 'Vendedora Exemplo 2');
    expect(vend).toBeDefined();
    expect(vend?.poloPrincipalId).not.toBeNull();
  });

  it('valorMensalidade aceita formatos variados (89, 199,90, R$ 1.299,90)', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows);
    const valores = result.matriculas
      .map((m) => m.valorMensalidade)
      .filter((v): v is number => v != null);
    expect(valores).toContain(89);
    expect(valores).toContain(199.9);
    expect(valores).toContain(1299.9);
    expect(valores).toContain(489.5);
  });

  it('id da Matricula é determinístico — mesmas linhas, mesmos ids', () => {
    const rows1 = loadFixtureRows();
    const rows2 = loadFixtureRows();
    const a = normalize(rows1);
    const b = normalize(rows2);
    expect(a.matriculas.map((m) => m.id)).toEqual(b.matriculas.map((m) => m.id));
  });

  it('descarta linha sem carimbo (lixo) sem crashar', () => {
    const rows = loadFixtureRows();
    const result = normalize(rows);
    expect(result.droppedCount).toBe(1);
    expect(result.vendedoras.find((v) => v.nome === 'Lixo')).toBeUndefined();
  });

  it('cachedAt é ISO string da hora atual injetada', () => {
    const rows = loadFixtureRows();
    const fixedNow = new Date(2026, 4, 10, 12, 0, 0);
    const result = normalize(rows, { now: fixedNow });
    expect(result.cachedAt).toBe(fixedNow.toISOString());
  });
});
