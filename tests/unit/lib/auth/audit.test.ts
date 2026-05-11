import { describe, expect, it } from 'vitest';

import { hashEmail } from '@/lib/auth/audit';

describe('hashEmail (T-205)', () => {
  it('é determinístico — mesma entrada, mesma saída', () => {
    expect(hashEmail('a@b.com')).toBe(hashEmail('a@b.com'));
  });

  it('é case-insensitive', () => {
    expect(hashEmail('A@B.com')).toBe(hashEmail('a@b.com'));
  });

  it('lida com whitespace', () => {
    expect(hashEmail('  a@b.com  ')).toBe(hashEmail('a@b.com'));
  });

  it('null / vazio → string vazia', () => {
    expect(hashEmail(null)).toBe('');
    expect(hashEmail(undefined)).toBe('');
    expect(hashEmail('')).toBe('');
  });

  it('saída tem 12 chars hex', () => {
    expect(hashEmail('a@b.com')).toMatch(/^[a-f0-9]{12}$/);
  });

  it('e-mails diferentes geram hashes diferentes', () => {
    expect(hashEmail('a@b.com')).not.toBe(hashEmail('c@d.com'));
  });
});
