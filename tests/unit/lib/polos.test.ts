import { describe, expect, it } from 'vitest';
import { __test__, normalizePolo } from '@/lib/polos/aliases';

describe('polos / normalizePolo', () => {
  it('preserva polo bruto quando não há alias mapeado, gerando id slug', () => {
    const r = normalizePolo('Polo Exemplo I');
    expect(r.nomeCanonico).toBe('Polo Exemplo I');
    expect(r.id).toBe('polo-exemplo-i');
  });

  it('aceita variações com acento, case e espaços extras', () => {
    const r1 = normalizePolo('  araçatuba  ');
    const r2 = normalizePolo('ARAÇATUBA');
    // Sem alias mapeado: nomeCanonico vira o bruto trimmed.
    expect(r1.nomeCanonico).toBe('araçatuba');
    expect(r2.nomeCanonico).toBe('ARAÇATUBA');
    // Mas o id (slug) é estável entre variações.
    expect(r1.id).toBe(r2.id);
  });

  it('strings vazias / null / undefined viram "Desconhecido"', () => {
    expect(normalizePolo('').id).toBe('desconhecido');
    expect(normalizePolo(null).id).toBe('desconhecido');
    expect(normalizePolo(undefined).id).toBe('desconhecido');
    expect(normalizePolo('   ').id).toBe('desconhecido');
  });

  it('slugify remove diacríticos e caracteres especiais', () => {
    expect(__test__.slugify("Município D'Oeste")).toBe('municipio-d-oeste');
    expect(__test__.slugify('Cidade Acentuação')).toBe('cidade-acentuacao');
  });
});
