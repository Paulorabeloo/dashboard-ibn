import { describe, expect, it } from 'vitest';

import { redactedClone } from './helpers/redact';

/*
 * T-002 — Sentinel test.
 * Garante que o pipeline de testes está funcional antes de qualquer
 * tarefa de negócio começar (Sprint 0).
 */
describe('sentinel', () => {
  it('vitest está rodando', () => {
    expect(1 + 1).toBe(2);
  });

  it('alias @/ resolve src/', async () => {
    const mod = await import('@/types/domain');
    expect(mod).toBeDefined();
  });

  it('helper de redação remove PII', () => {
    const input = { ok: true, alunoNome: 'Foo Bar', polo: 'Polo A' };
    expect(redactedClone(input)).toEqual({ ok: true, alunoNome: '[REDACTED]', polo: 'Polo A' });
  });
});
