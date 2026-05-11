import { describe, expect, it } from 'vitest';
import { hashRow } from '@/lib/sheets/hash';

describe('hashRow (T-107)', () => {
  it('é determinístico — mesma entrada, mesma saída', () => {
    const a = hashRow('2024-01-03', 'Polo A', 'Vendedora X', 'Aluno Y', 'pos');
    const b = hashRow('2024-01-03', 'Polo A', 'Vendedora X', 'Aluno Y', 'pos');
    expect(a).toBe(b);
  });

  it('muda quando qualquer campo muda', () => {
    const base = hashRow('2024-01-03', 'Polo A', 'Vendedora X', 'Aluno Y', 'pos');
    expect(hashRow('2024-01-04', 'Polo A', 'Vendedora X', 'Aluno Y', 'pos')).not.toBe(base);
    expect(hashRow('2024-01-03', 'Polo B', 'Vendedora Z', 'Aluno W', 'pos')).not.toBe(base);
    expect(hashRow('2024-01-03', 'Polo A', 'Outra', 'Aluno Y', 'pos')).not.toBe(base);
  });

  it('aceita null/undefined sem crashar', () => {
    expect(hashRow('a', null, undefined, 'b')).toMatch(/^[a-f0-9]{12}$/);
  });

  it('saída tem 12 caracteres hex', () => {
    expect(hashRow('x')).toMatch(/^[a-f0-9]{12}$/);
  });
});
