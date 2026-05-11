import { describe, expect, it } from 'vitest';
import { CICLOS, getCiclo, getCicloAtivo, getCicloPorData } from '@/lib/cycles';

describe('cycles (T-108)', () => {
  it('CICLOS está ordenado e tem cicloAnteriorId apontando para id existente', () => {
    expect(CICLOS.length).toBeGreaterThan(0);
    const ids = new Set(CICLOS.map((c) => c.id));
    for (const c of CICLOS) {
      if (c.cicloAnteriorId !== null) {
        expect(ids.has(c.cicloAnteriorId)).toBe(true);
      }
      expect(c.inicio.getTime()).toBeLessThan(c.fim.getTime());
    }
  });

  it('getCicloPorData retorna ciclo cuja janela contém a data', () => {
    const c = getCicloPorData(new Date(2026, 2, 15)); // 15/mar/2026
    expect(c?.id).toBe('2026.1');
  });

  it('getCicloPorData retorna null para data fora de qualquer janela', () => {
    const c = getCicloPorData(new Date(2010, 0, 1));
    expect(c).toBeNull();
  });

  it('getCicloPorData inclui o limite inicial e final da janela', () => {
    const ciclo = CICLOS.find((c) => c.id === '2025.1');
    if (!ciclo) throw new Error('ciclo 2025.1 ausente');
    expect(getCicloPorData(ciclo.inicio)?.id).toBe('2025.1');
    expect(getCicloPorData(ciclo.fim)?.id).toBe('2025.1');
  });

  it('getCicloAtivo usa relógio injetado', () => {
    expect(getCicloAtivo(new Date(2024, 0, 15))?.id).toBe('2024.1');
    expect(getCicloAtivo(new Date(2024, 9, 31))?.id).toBe('2024.2');
    expect(getCicloAtivo(new Date(2026, 2, 15))?.id).toBe('2026.1');
  });

  it('getCiclo busca por id', () => {
    expect(getCiclo('2025.2')?.id).toBe('2025.2');
    expect(getCiclo('inexistente')).toBeNull();
  });
});
