import 'server-only';

import { fetchRawSheet, makeSheetsClient } from '@/lib/sheets/adapter';
import { normalize } from '@/lib/sheets/normalizer';
import type { DashboardData } from '@/types/domain';

import { buildDevFallbackData } from './devFallback';
import { log } from '../log';

/*
 * T-111 — Repository.
 *
 * Cache server-side em memória do processo. Trocamos `unstable_cache`
 * porque (a) ele tem limite de 2MB e nosso payload (8k+ linhas) passa,
 * (b) ele serializa em JSON e perde os Date objects, exigindo revive
 * em cada read. Cache em memória resolve os dois.
 *
 * Trade-off vs `unstable_cache`:
 *   - Cache não é compartilhado entre instâncias serverless (cada cold
 *     start refaz o fetch). Aceitável para ~10 usuários: instâncias
 *     Vercel ficam quentes em uso normal.
 *   - Vercel Cron (T-501) não pré-aquece o cache de outras instâncias.
 *     Como a Sheet só lê, o pior caso é 1 fetch a mais por cold start.
 *   - revalidateTag não funciona — `forceRefresh()` simplesmente apaga
 *     a entry e a próxima chamada busca de novo.
 *
 * Single-flight: se vários requests pedirem dados ao mesmo tempo enquanto
 * o cache está vazio, todos esperam o mesmo fetch.
 */

export interface DashboardSnapshot extends DashboardData {
  /** True quando estamos servindo o último cache bom porque a Sheet falhou. */
  readonly stale: boolean;
  /** ISO da última leitura bem-sucedida da Sheet. */
  readonly lastSuccessAt: string;
}

interface RepoConfig {
  readonly saKeyB64: string;
  readonly sheetId: string;
  readonly range: string;
  readonly cacheTtlSeconds: number;
}

function readConfig(): RepoConfig {
  const saKeyB64 = process.env.GOOGLE_SA_KEY ?? '';
  const sheetId = process.env.SHEETS_ID ?? '';
  const range = process.env.SHEETS_RANGE ?? '';
  const cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS ?? '600') || 600;
  return { saKeyB64, sheetId, range, cacheTtlSeconds };
}

interface CacheEntry {
  readonly data: DashboardData;
  readonly cachedAtMs: number;
}

let cache: CacheEntry | null = null;
let inflight: Promise<DashboardData> | null = null;

/**
 * Pipeline puro adapter → normalizer.
 *
 * Fallback de dev: se `GOOGLE_SA_KEY` estiver vazia em desenvolvimento,
 * carrega dados sintéticos. Produção sempre tenta a Sheet real.
 */
export async function fetchAndNormalize(cfg: {
  saKeyB64: string;
  sheetId: string;
  range: string;
}): Promise<DashboardData> {
  if (!cfg.saKeyB64) {
    if (process.env.NODE_ENV === 'development') {
      log.warn('repo.dev_fallback.synthetic_data', {
        reason: 'GOOGLE_SA_KEY não configurada — usando dados sintéticos',
      });
      return buildDevFallbackData();
    }
    throw new Error('GOOGLE_SA_KEY ausente em produção');
  }

  const client = makeSheetsClient(cfg.saKeyB64);
  const { rows } = await fetchRawSheet(client, {
    sheetId: cfg.sheetId,
    range: cfg.range,
  });
  const result = normalize(rows);
  const { droppedCount: _drop, ...data } = result;
  return data;
}

async function getOrFetch(): Promise<DashboardData> {
  const cfg = readConfig();
  const ttlMs = cfg.cacheTtlSeconds * 1000;
  const now = Date.now();

  if (cache && now - cache.cachedAtMs < ttlMs) {
    return cache.data;
  }

  if (!inflight) {
    inflight = (async () => {
      const data = await fetchAndNormalize(cfg);
      cache = { data, cachedAtMs: Date.now() };
      log.info('repo.fetch.success', { count: data.matriculas.length });
      return data;
    })().finally(() => {
      inflight = null;
    });
  }

  return inflight;
}

/**
 * Ponto único de entrada para Server Components.
 * Em caso de falha, devolve o último snapshot bom marcado como stale.
 */
export async function getDashboardData(): Promise<DashboardSnapshot> {
  try {
    const data = await getOrFetch();
    return { ...data, stale: false, lastSuccessAt: data.cachedAt };
  } catch (err) {
    if (cache) {
      log.warn('repo.fetch.failed.serving_stale', {
        message: err instanceof Error ? err.message : String(err),
      });
      return {
        ...cache.data,
        stale: true,
        lastSuccessAt: cache.data.cachedAt,
      };
    }
    log.error('repo.fetch.failed.no_fallback', {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Força revalidate manual (RF-17). Próximo `getDashboardData()` busca
 * fresh da Sheet.
 */
export async function forceRefresh(): Promise<{ ok: true }> {
  cache = null;
  log.info('repo.refresh.manual');
  return { ok: true };
}

/** Apenas para teste. Limpa o cache em memória entre testes. */
export function __resetForTests(): void {
  cache = null;
  inflight = null;
}
