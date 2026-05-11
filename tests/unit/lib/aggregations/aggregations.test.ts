import { describe, expect, it } from 'vitest';

import { mixFamilia } from '@/lib/aggregations/mixFamilia';
import { pace7d } from '@/lib/aggregations/pace7d';
import { topBottomPolos } from '@/lib/aggregations/topBottomPolos';
import { totalMatriculas } from '@/lib/aggregations/totalMatriculas';
import { type Filter, parseFilterFromSearchParams } from '@/lib/filters';
import type { DashboardData, Familia, Matricula } from '@/types/domain';

function mat(over: Partial<Matricula> = {}): Matricula {
  return {
    id: over.id ?? Math.random().toString(36).slice(2, 10),
    dataMatricula: over.dataMatricula ?? new Date(2026, 2, 1),
    cicloId: over.cicloId ?? '2026.1',
    poloId: over.poloId ?? 'polo-a',
    poloRaw: 'polo-a',
    vendedoraId: 'kx',
    vendedoraNome: 'K',
    alunoNome: 'A',
    familia: over.familia ?? 'graduacao',
    subFamilia: '100ead',
    origem: 'lead_sistema',
    bolsaConvenio: null,
    valorMensalidade: 100,
    quantidadeParcelas: 12,
    valePix: null,
    ...over,
  };
}

function buildData(matriculas: ReadonlyArray<Matricula>): DashboardData {
  const polosMap = new Map<string, { id: string; nomeCanonico: string; aliases: string[] }>();
  for (const m of matriculas) {
    if (!polosMap.has(m.poloId)) {
      polosMap.set(m.poloId, { id: m.poloId, nomeCanonico: m.poloRaw, aliases: [] });
    }
  }
  return {
    matriculas: [...matriculas],
    polos: Array.from(polosMap.values()),
    vendedoras: [],
    cachedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

const NOW = new Date(2026, 2, 15, 12, 0, 0);

const filterDefault: Filter = parseFilterFromSearchParams(new URLSearchParams(), { now: NOW });

describe('totalMatriculas (NS-1, T-302)', () => {
  it('conta matrículas dentro do filtro', () => {
    const data = buildData([
      mat({ dataMatricula: new Date(2026, 2, 1) }),
      mat({ dataMatricula: new Date(2026, 2, 5) }),
      mat({ dataMatricula: new Date(2026, 2, 10) }),
      mat({ id: 'x', dataMatricula: new Date(2025, 0, 5) }), // ciclo anterior
    ]);
    const r = totalMatriculas(data, filterDefault);
    expect(r.atual).toBe(3);
  });

  it('compara com mesmo ponto do ciclo anterior', () => {
    // Filter atual termina em 15/mar/2026 (offset = 73 dias do início 2026.1 em 01/jan).
    // Ciclo anterior 2025.1 começa 01/jan/2025; mesmo ponto = ~14/mar/2025.
    const data = buildData([
      mat({ id: 'a1', dataMatricula: new Date(2026, 0, 5) }),
      mat({ id: 'a2', dataMatricula: new Date(2026, 1, 1) }),
      mat({ id: 'a3', dataMatricula: new Date(2026, 2, 1) }),
      mat({ id: 'b1', dataMatricula: new Date(2025, 0, 10) }), // dentro do ponto equivalente
      mat({ id: 'b2', dataMatricula: new Date(2025, 1, 15) }), // dentro
      mat({ id: 'b3', dataMatricula: new Date(2025, 4, 30) }), // depois do ponto equivalente
    ]);
    const filter = parseFilterFromSearchParams(
      new URLSearchParams('ciclo=2026.1&de=2026-01-01&ate=2026-03-15'),
      { now: NOW },
    );
    const r = totalMatriculas(data, filter);
    expect(r.atual).toBe(3);
    expect(r.anterior).toBe(2);
    expect(r.deltaAbs).toBe(1);
    expect(r.deltaPct).toBeCloseTo(50, 1);
    expect(r.hasComparison).toBe(true);
  });

  it('hasComparison=false quando ciclo=all', () => {
    const data = buildData([mat({})]);
    const filter = parseFilterFromSearchParams(new URLSearchParams('ciclo=all'), { now: NOW });
    const r = totalMatriculas(data, filter);
    expect(r.hasComparison).toBe(false);
  });

  it('deltaPct = 0 quando anterior = 0 (sem divisão por zero)', () => {
    const data = buildData([mat({ dataMatricula: new Date(2026, 2, 1) })]);
    const r = totalMatriculas(data, filterDefault);
    expect(r.deltaPct).toBe(0);
    expect(r.atual).toBe(1);
  });
});

describe('pace7d (NS-2, T-303)', () => {
  it('conta últimos 7d e 7d anteriores', () => {
    // ref = 15/mar/2026. Janela atual: 8-15/mar. Anterior: 1-8/mar.
    const data = buildData([
      mat({ id: 'atual1', dataMatricula: new Date(2026, 2, 9) }),
      mat({ id: 'atual2', dataMatricula: new Date(2026, 2, 14) }),
      mat({ id: 'ant1', dataMatricula: new Date(2026, 2, 3) }),
      mat({ id: 'ant2', dataMatricula: new Date(2026, 2, 5) }),
      mat({ id: 'ant3', dataMatricula: new Date(2026, 2, 6) }),
      mat({ id: 'fora', dataMatricula: new Date(2026, 1, 1) }),
    ]);
    const r = pace7d(data, filterDefault, { now: NOW });
    expect(r.atual).toBe(2);
    expect(r.anterior).toBe(3);
    expect(r.mediaMovel).toBeCloseTo(2 / 7, 3);
    expect(r.tendencia).toBe('down'); // -33%
  });

  it('tendencia=flat dentro do threshold ±2%', () => {
    // 100 vs 100 = 0%
    const dates = (n: number, offsetDays: number) =>
      Array.from({ length: n }, (_, i) =>
        mat({ id: `${offsetDays}-${i}`, dataMatricula: new Date(NOW.getTime() - offsetDays * 86400000 - i * 100) }),
      );
    const data = buildData([...dates(100, 3), ...dates(100, 10)]);
    const r = pace7d(data, filterDefault, { now: NOW });
    expect(r.tendencia).toBe('flat');
  });

  it('tendencia=up quando anterior=0 e atual>0', () => {
    const data = buildData([
      mat({ id: 'a', dataMatricula: new Date(2026, 2, 14) }),
    ]);
    const r = pace7d(data, filterDefault, { now: NOW });
    expect(r.tendencia).toBe('up');
  });

  it('zero matrículas em ambas janelas → flat', () => {
    const data = buildData([]);
    const r = pace7d(data, filterDefault, { now: NOW });
    expect(r.tendencia).toBe('flat');
    expect(r.atual).toBe(0);
    expect(r.anterior).toBe(0);
  });
});

describe('mixFamilia (NS-3, T-304)', () => {
  it('soma dos pcts = 100 (com matrículas) ou 0 (sem)', () => {
    const data = buildData([
      mat({ id: 'a', dataMatricula: new Date(2026, 2, 1), familia: 'graduacao' }),
      mat({ id: 'b', dataMatricula: new Date(2026, 2, 1), familia: 'pos' }),
      mat({ id: 'c', dataMatricula: new Date(2026, 2, 1), familia: 'pos' }),
      mat({ id: 'd', dataMatricula: new Date(2026, 2, 1), familia: 'tecnico' }),
    ]);
    const mix = mixFamilia(data, filterDefault);
    const total = mix.reduce((s, e) => s + e.pct, 0);
    expect(total).toBeCloseTo(100, 5);
    const grad = mix.find((e) => e.familia === 'graduacao');
    expect(grad?.pct).toBeCloseTo(25, 1);
  });

  it('ordem é estável: graduacao, pos, tecnico, outro', () => {
    const data = buildData([mat({ familia: 'pos', dataMatricula: new Date(2026, 2, 1) })]);
    const mix = mixFamilia(data, filterDefault);
    const order: Familia[] = mix.map((e) => e.familia);
    expect(order).toEqual(['graduacao', 'pos', 'tecnico', 'outro']);
  });

  it('zero matrículas não crasha (pcts = 0)', () => {
    const data = buildData([]);
    const mix = mixFamilia(data, filterDefault);
    for (const e of mix) {
      expect(e.pct).toBe(0);
      expect(e.atual).toBe(0);
    }
  });
});

describe('topBottomPolos (NS-4, T-305)', () => {
  it('top = 3 polos com maior delta absoluto vs ciclo anterior', () => {
    const filter = parseFilterFromSearchParams(
      new URLSearchParams('ciclo=2026.1&de=2026-01-01&ate=2026-03-15'),
      { now: NOW },
    );
    // Atual: A=5, B=3, C=2, D=1
    const atualMats = [
      ...Array.from({ length: 5 }, (_, i) => mat({ id: `a${i}`, poloId: 'polo-a', dataMatricula: new Date(2026, 1, 1 + i) })),
      ...Array.from({ length: 3 }, (_, i) => mat({ id: `b${i}`, poloId: 'polo-b', dataMatricula: new Date(2026, 1, 1 + i) })),
      ...Array.from({ length: 2 }, (_, i) => mat({ id: `c${i}`, poloId: 'polo-c', dataMatricula: new Date(2026, 1, 1 + i) })),
      ...Array.from({ length: 1 }, (_, i) => mat({ id: `d${i}`, poloId: 'polo-d', dataMatricula: new Date(2026, 1, 1 + i) })),
    ];
    // Anterior: A=1, B=4, C=2, D=3
    const anteriorMats = [
      mat({ id: 'pa', poloId: 'polo-a', dataMatricula: new Date(2025, 1, 1) }),
      ...Array.from({ length: 4 }, (_, i) => mat({ id: `pb${i}`, poloId: 'polo-b', dataMatricula: new Date(2025, 1, 1 + i) })),
      ...Array.from({ length: 2 }, (_, i) => mat({ id: `pc${i}`, poloId: 'polo-c', dataMatricula: new Date(2025, 1, 1 + i) })),
      ...Array.from({ length: 3 }, (_, i) => mat({ id: `pd${i}`, poloId: 'polo-d', dataMatricula: new Date(2025, 1, 1 + i) })),
    ];
    // Deltas: A=+4, B=-1, C=0, D=-2 → top: A, C, B; bottom: D, B, C
    const data = buildData([...atualMats, ...anteriorMats]);
    const r = topBottomPolos(data, filter);
    expect(r.top.map((p) => p.polo.id)).toEqual(['polo-a', 'polo-c', 'polo-b']);
    expect(r.top[0]?.deltaAbs).toBe(4);
    expect(r.bottom[0]?.polo.id).toBe('polo-d'); // pior primeiro
    expect(r.bottom[0]?.deltaAbs).toBe(-2);
  });

  it('empate no delta resolve por ordem alfabética', () => {
    const data = buildData([
      mat({ id: 'a', poloId: 'polo-a', poloRaw: 'polo-a', dataMatricula: new Date(2026, 2, 1) }),
      mat({ id: 'b', poloId: 'polo-b', poloRaw: 'polo-b', dataMatricula: new Date(2026, 2, 1) }),
    ]);
    const r = topBottomPolos(data, filterDefault);
    // Ambos delta=+1 (sem ciclo anterior). Empate → ordem alfabética.
    expect(r.top[0]?.polo.nomeCanonico).toBe('polo-a');
    expect(r.top[1]?.polo.nomeCanonico).toBe('polo-b');
  });
});
