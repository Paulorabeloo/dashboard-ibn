import { describe, expect, it } from 'vitest';
import { parseDate } from '@/lib/sheets/parseDate';

describe('parseDate (T-103)', () => {
  it('parseia o formato do Carimbo da Sheet (DD/MM/YYYY HH:MM:SS)', () => {
    const d = parseDate('03/01/2024 10:30:53');
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(0); // janeiro
    expect(d?.getDate()).toBe(3);
    expect(d?.getHours()).toBe(10);
    expect(d?.getMinutes()).toBe(30);
    expect(d?.getSeconds()).toBe(53);
  });

  it('parseia data BR sem hora', () => {
    const d = parseDate('15/03/2026');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(2);
    expect(d?.getDate()).toBe(15);
    expect(d?.getHours()).toBe(0);
  });

  it('parseia ISO 8601', () => {
    const d = parseDate('2026-03-15');
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(2026);
  });

  it('rejeita dia/mês inválidos sem virar próximo mês', () => {
    // 31/02 não vira 03/03 — JS coage por default, parseDate não.
    expect(parseDate('31/02/2024')).toBeNull();
    expect(parseDate('00/01/2024')).toBeNull();
    expect(parseDate('15/13/2024')).toBeNull();
  });

  it('null, undefined, vazio e texto livre viram null', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('   ')).toBeNull();
    expect(parseDate('quando der')).toBeNull();
    expect(parseDate('15-Mar-2025')).toBeNull(); // formato não suportado
  });

  it('aceita instância de Date pré-existente', () => {
    const ref = new Date(2025, 5, 1);
    expect(parseDate(ref)?.getTime()).toBe(ref.getTime());
  });
});
