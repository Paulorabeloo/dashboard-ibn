import { describe, expect, it } from 'vitest';
import { parseFamilia, parseOrigem, parseSubFamilia } from '@/lib/sheets/enums';

describe('parseFamilia (T-105)', () => {
  it('reconhece variações de Pós (incluindo "Pós em DOBRO" da Sheet real)', () => {
    expect(parseFamilia('Pós em DOBRO')).toBe('pos');
    expect(parseFamilia('Pós Graduação')).toBe('pos');
    expect(parseFamilia('PÓS GRADUAÇÃO')).toBe('pos');
    expect(parseFamilia('pos')).toBe('pos');
  });

  it('reconhece graduação', () => {
    expect(parseFamilia('Graduação')).toBe('graduacao');
    expect(parseFamilia('GRADUACAO')).toBe('graduacao');
  });

  it('reconhece técnicos', () => {
    expect(parseFamilia('Técnicos')).toBe('tecnico');
    expect(parseFamilia('Técnico')).toBe('tecnico');
  });

  it('valor desconhecido vira "outro"', () => {
    expect(parseFamilia('')).toBe('outro');
    expect(parseFamilia(null)).toBe('outro');
    expect(parseFamilia('Curso Livre')).toBe('outro');
  });
});

describe('parseSubFamilia (T-105)', () => {
  it('reconhece 100% Online / EAD', () => {
    expect(parseSubFamilia('100% Online (EAD)')).toBe('100ead');
    expect(parseSubFamilia('100% Online')).toBe('100ead');
    expect(parseSubFamilia('EAD')).toBe('100ead');
  });

  it('reconhece Semi Presencial', () => {
    expect(parseSubFamilia('Semi Presencial')).toBe('semi');
    expect(parseSubFamilia('Semi Presencial (EAD + PRÁTICO)')).toBe('semi');
  });

  it('Premium / Híbrido Lab', () => {
    expect(parseSubFamilia('Premium (Híbrido Lab)')).toBe('premium');
    expect(parseSubFamilia('Premium / Hibrido Lab (Enfermagem, Engenharia)')).toBe('premium');
  });

  it('vazio / desconhecido → outro', () => {
    expect(parseSubFamilia('')).toBe('outro');
    expect(parseSubFamilia('Outros')).toBe('outro');
  });
});

describe('parseOrigem (T-105)', () => {
  it('reconhece Receptivo (visto na Sheet real)', () => {
    expect(parseOrigem('Receptivo [aluno iniciou o contato]')).toBe('receptivo');
    expect(parseOrigem('Receptivo')).toBe('receptivo');
  });

  it('reconhece categorias do PDF do Looker', () => {
    expect(parseOrigem('Lead do Sistema')).toBe('lead_sistema');
    expect(parseOrigem('Disparos')).toBe('disparos');
    expect(parseOrigem('Indicação')).toBe('indicacao');
    expect(parseOrigem('Tráfego Pago')).toBe('trafego_pago');
    expect(parseOrigem('CUBO')).toBe('cubo');
  });

  it('valor desconhecido → outro', () => {
    expect(parseOrigem('')).toBe('outro');
    expect(parseOrigem(null)).toBe('outro');
    expect(parseOrigem('Indicação amigo')).toBe('indicacao'); // contém "indicacao"
  });
});
