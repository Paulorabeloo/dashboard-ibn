import { describe, expect, it } from 'vitest';

import {
  applyFilter,
  filterToSearchParams,
  parseFilterFromSearchParams,
} from '@/lib/filters';
import type { Matricula } from '@/types/domain';

const NOW = new Date(2026, 2, 15, 12, 0, 0); // 15/mar/2026 → ciclo ativo 2026.1

function fakeMat(over: Partial<Matricula> = {}): Matricula {
  return {
    id: over.id ?? 'fake',
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

describe('parseFilterFromSearchParams (T-301)', () => {
  it('default: ciclo ativo agora, sem polo/familia, dataFim cap em now', () => {
    const f = parseFilterFromSearchParams(new URLSearchParams(), { now: NOW });
    expect(f.cicloId).toBe('2026.1');
    expect(f.poloIds).toEqual([]);
    expect(f.familias).toEqual([]);
    expect(f.dataInicio.getMonth()).toBe(0); // janeiro
    // dataFim capa em "now" para tornar comparação "mesmo ponto" justa
    // (em vez de comparar com ciclo anterior cheio).
    expect(f.dataFim.getTime()).toBe(NOW.getTime());
  });

  it('mes filter narrows to that month and intersects com ciclo', () => {
    const f = parseFilterFromSearchParams(
      new URLSearchParams('mes=2026-03'),
      { now: NOW },
    );
    expect(f.mes).toBe('2026-03');
    expect(f.dataInicio.getDate()).toBe(1);
    expect(f.dataInicio.getMonth()).toBe(2); // março
    expect(f.dataFim.getMonth()).toBe(2);
  });

  it('ciclo=all sem overrides usa janela total dos ciclos conhecidos', () => {
    const f = parseFilterFromSearchParams(new URLSearchParams('ciclo=all'), { now: NOW });
    expect(f.cicloId).toBe('all');
    // Janela total cobre 2023 → 2026
    expect(f.dataInicio.getFullYear()).toBeLessThanOrEqual(2024);
  });

  it('ciclo desconhecido cai no default (ciclo ativo)', () => {
    const f = parseFilterFromSearchParams(new URLSearchParams('ciclo=9999.9'), { now: NOW });
    expect(f.cicloId).toBe('2026.1');
  });

  it('polo multi (CSV) e familia multi (CSV)', () => {
    const f = parseFilterFromSearchParams(
      new URLSearchParams('polo=polo-a,polo-d&familia=graduacao,pos'),
      { now: NOW },
    );
    expect(f.poloIds).toEqual(['polo-a', 'polo-d']);
    expect(f.familias).toEqual(['graduacao', 'pos']);
  });

  it('familias inválidas são descartadas', () => {
    const f = parseFilterFromSearchParams(
      new URLSearchParams('familia=graduacao,wat,pos,xpto'),
      { now: NOW },
    );
    expect(f.familias).toEqual(['graduacao', 'pos']);
  });

  it('overrides de "de" e "ate" prevalecem sobre o ciclo', () => {
    const f = parseFilterFromSearchParams(
      new URLSearchParams('ciclo=2026.1&de=2026-03-01&ate=2026-03-15'),
      { now: NOW },
    );
    expect(f.dataInicio.getDate()).toBe(1);
    expect(f.dataFim.getDate()).toBe(15);
  });

  it('aceita Record (Next searchParams) além de URLSearchParams', () => {
    const f = parseFilterFromSearchParams(
      { ciclo: '2025.1', polo: 'polo-a' },
      { now: NOW },
    );
    expect(f.cicloId).toBe('2025.1');
    expect(f.poloIds).toEqual(['polo-a']);
  });
});

describe('applyFilter', () => {
  const base = parseFilterFromSearchParams(new URLSearchParams(), { now: NOW });

  it('passa só matriculas dentro da janela do ciclo', () => {
    const dentro = fakeMat({ dataMatricula: new Date(2026, 2, 10) });
    const fora = fakeMat({ id: 'fora', dataMatricula: new Date(2025, 0, 10) });
    expect(applyFilter([dentro, fora], base)).toHaveLength(1);
  });

  it('multi-polo: passa apenas se polo está na lista', () => {
    const filtro = { ...base, poloIds: ['polo-d'] };
    const a = fakeMat({ poloId: 'polo-a' });
    const b = fakeMat({ id: 'b', poloId: 'polo-d' });
    expect(applyFilter([a, b], filtro).map((m) => m.id)).toEqual(['b']);
  });

  it('multi-familia: passa apenas se familia está na lista', () => {
    const filtro = { ...base, familias: ['pos' as const] };
    const a = fakeMat({ familia: 'graduacao' });
    const b = fakeMat({ id: 'b', familia: 'pos' });
    expect(applyFilter([a, b], filtro).map((m) => m.id)).toEqual(['b']);
  });

  it('lista vazia em poloIds/familias = sem filtro (passa tudo)', () => {
    const a = fakeMat({ poloId: 'polo-a' });
    const b = fakeMat({ id: 'b', poloId: 'polo-d', familia: 'pos' });
    expect(applyFilter([a, b], base)).toHaveLength(2);
  });
});

describe('filterToSearchParams', () => {
  it('serializa de volta o estado essencial', () => {
    const f = parseFilterFromSearchParams(
      new URLSearchParams('ciclo=2026.1&polo=polo-a,polo-d&familia=pos'),
      { now: NOW },
    );
    const sp = filterToSearchParams(f);
    expect(sp.get('ciclo')).toBe('2026.1');
    expect(sp.get('polo')).toBe('polo-a,polo-d');
    expect(sp.get('familia')).toBe('pos');
  });
});
