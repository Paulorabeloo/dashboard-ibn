/*
 * Wrapper de log estruturado. Filtra PII antes de enviar para Vercel Logs
 * ou Sentry. Hook `beforeSend` real entra em T-504 (Sprint 5).
 */

const PII_KEYS = new Set([
  'alunoNome',
  'vendedoraNome',
  'indicadoPor',
  'email',
  'cpf',
  'celular',
  'phone',
]);

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function redactPII<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactPII) as unknown as T;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = PII_KEYS.has(k) ? '[REDACTED]' : redactPII(v);
  }
  return result as T;
}

function emit(level: LogLevel, message: string, ctx?: Record<string, unknown>) {
  const payload = {
    level,
    ts: new Date().toISOString(),
    msg: message,
    ...(ctx ? redactPII(ctx) : {}),
  };
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](JSON.stringify(payload));
}

export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
};
