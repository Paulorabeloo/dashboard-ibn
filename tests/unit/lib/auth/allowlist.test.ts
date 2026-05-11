import { describe, expect, it } from 'vitest';

import { isAllowedEmail, maskEmail, parseAllowlist } from '@/lib/auth/allowlist';

describe('parseAllowlist (SR-001)', () => {
  it('parseia CSV simples', () => {
    const set = parseAllowlist('a@x.com,b@y.com');
    expect(set.has('a@x.com')).toBe(true);
    expect(set.has('b@y.com')).toBe(true);
    expect(set.size).toBe(2);
  });

  it('é case-insensitive (normaliza para lower)', () => {
    const set = parseAllowlist('A@X.COM');
    expect(set.has('a@x.com')).toBe(true);
    expect(set.has('A@X.COM')).toBe(false);
  });

  it('ignora espaços extras e entradas vazias', () => {
    const set = parseAllowlist('  a@x.com , ,b@y.com  , ');
    expect(set.size).toBe(2);
  });

  it('null / undefined / vazio viram set vazio (fail-closed)', () => {
    expect(parseAllowlist(null).size).toBe(0);
    expect(parseAllowlist(undefined).size).toBe(0);
    expect(parseAllowlist('').size).toBe(0);
  });
});

describe('isAllowedEmail (SR-001)', () => {
  const allow = parseAllowlist('user@example.com,outro@example.com.br');

  it('aceita email exato (case-insensitive)', () => {
    expect(isAllowedEmail('user@example.com', allow)).toBe(true);
    expect(isAllowedEmail('User@Example.Com', allow)).toBe(true);
    expect(isAllowedEmail('  user@example.com  ', allow)).toBe(true);
  });

  it('rejeita e-mail fora da lista', () => {
    expect(isAllowedEmail('intruso@example.com', allow)).toBe(false);
  });

  it('rejeita null / undefined / vazio', () => {
    expect(isAllowedEmail(null, allow)).toBe(false);
    expect(isAllowedEmail(undefined, allow)).toBe(false);
    expect(isAllowedEmail('', allow)).toBe(false);
  });

  it('FAIL-CLOSED: allowlist vazia rejeita qualquer e-mail', () => {
    const empty = parseAllowlist('');
    expect(isAllowedEmail('admin@example.com', empty)).toBe(false);
    expect(isAllowedEmail('qualquerum@example.com', empty)).toBe(false);
  });
});

describe('maskEmail', () => {
  it('mascara local part preservando domínio', () => {
    expect(maskEmail('joao.silva@example.com.br')).toBe('j***@example.com.br');
    expect(maskEmail('a@x.com')).toBe('*@x.com');
  });

  it('lida com null / vazio', () => {
    expect(maskEmail(null)).toBe('');
    expect(maskEmail('')).toBe('');
    expect(maskEmail('semarroba')).toBe('***');
  });
});
