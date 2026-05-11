const PII_KEYS = new Set(['alunoNome', 'vendedoraNome', 'indicadoPor', 'email', 'cpf', 'celular']);

export function redactedClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactedClone) as unknown as T;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = PII_KEYS.has(k) ? '[REDACTED]' : redactedClone(v);
  }
  return result as T;
}
