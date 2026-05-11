import { describe, expect, it } from 'vitest';
import { parseNumber } from '@/lib/sheets/parseNumber';

describe('parseNumber (Valor Mensalidade)', () => {
  it('parseia inteiro como na linha real ("89")', () => {
    expect(parseNumber('89')).toBe(89);
    expect(parseNumber(89)).toBe(89);
  });

  it('parseia decimal BR com vírgula', () => {
    expect(parseNumber('89,90')).toBeCloseTo(89.9, 5);
    expect(parseNumber('1.299,90')).toBeCloseTo(1299.9, 5);
  });

  it('parseia decimal US com ponto (sem vírgula)', () => {
    expect(parseNumber('89.90')).toBeCloseTo(89.9, 5);
  });

  it('aceita prefixo R$ com ou sem espaço', () => {
    expect(parseNumber('R$ 89,90')).toBeCloseTo(89.9, 5);
    expect(parseNumber('R$1.299,90')).toBeCloseTo(1299.9, 5);
  });

  it('null, undefined, vazio e lixo viram null', () => {
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber('-')).toBeNull();
    expect(parseNumber('R$')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber(NaN)).toBeNull();
    expect(parseNumber(Infinity)).toBeNull();
  });

  it('aceita zero e negativo', () => {
    expect(parseNumber('0')).toBe(0);
    expect(parseNumber('-89,90')).toBeCloseTo(-89.9, 5);
  });
});
