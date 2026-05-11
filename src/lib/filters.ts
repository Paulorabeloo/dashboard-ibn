import { CICLOS, getCicloAtivo } from '@/lib/cycles';
import type { Familia, Matricula } from '@/types/domain';

import { parseDate } from './sheets/parseDate';

/*
 * T-301 — Estado de filtros via URL searchParams (RF-12, RF-13).
 *
 * Chaves:
 *   ciclo  — id do ciclo (ex: "2025.2") ou "all"
 *   polo   — múltiplos (CSV, ex: "polo-a,polo-b")
 *   familia — múltiplos ("graduacao,pos,tecnico")
 *   de     — ISO date (override do início do ciclo)
 *   ate    — ISO date (override do fim do ciclo)
 *
 * Default sem qualquer parâmetro: ciclo ativo agora, todos polos, todas
 * famílias, intervalo = ciclo ativo inteiro.
 */

const VALID_FAMILIAS: ReadonlySet<Familia> = new Set(['graduacao', 'pos', 'tecnico', 'outro']);

export interface Filter {
  /** Id do ciclo, ou "all" quando o usuário pediu todos. */
  readonly cicloId: string | 'all';
  readonly poloIds: ReadonlyArray<string>;
  readonly familias: ReadonlyArray<Familia>;
  /** Início efetivo do filtro de data (deriva de dia, mês, ciclo ou override). */
  readonly dataInicio: Date;
  /** Fim efetivo do filtro de data. */
  readonly dataFim: Date;
  /** YYYY-MM quando o usuário pediu um mês específico, null caso contrário. */
  readonly mes: string | null;
  /** YYYY-MM-DD quando o usuário pediu um dia específico, null caso contrário. */
  readonly dia: string | null;
}

export interface ParseFilterOptions {
  readonly now?: Date;
}

function readMulti(searchParams: URLSearchParams, key: string): string[] {
  const raw = searchParams.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseFilterFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  options: ParseFilterOptions = {},
): Filter {
  const sp =
    searchParams instanceof URLSearchParams
      ? searchParams
      : recordToSearchParams(searchParams);
  const now = options.now ?? new Date();

  const ciclo = sp.get('ciclo');
  let cicloId: string | 'all';
  if (ciclo === 'all') {
    cicloId = 'all';
  } else if (ciclo && CICLOS.some((c) => c.id === ciclo)) {
    cicloId = ciclo;
  } else {
    cicloId = getCicloAtivo(now)?.id ?? CICLOS[CICLOS.length - 1]!.id;
  }

  const familias = readMulti(sp, 'familia').filter((f): f is Familia =>
    VALID_FAMILIAS.has(f as Familia),
  );

  const poloIds = readMulti(sp, 'polo');

  const cicloRef = cicloId === 'all' ? null : CICLOS.find((c) => c.id === cicloId);

  const overrideDe = parseDate(sp.get('de'));
  const overrideAte = parseDate(sp.get('ate'));

  // Filtro por dia (YYYY-MM-DD) — prevalece sobre mês e ciclo.
  const diaParam = sp.get('dia');
  const dia = diaParam && /^\d{4}-\d{2}-\d{2}$/.test(diaParam) ? diaParam : null;
  let diaInicio: Date | null = null;
  let diaFim: Date | null = null;
  if (dia) {
    const [yStr, mStr, dStr] = dia.split('-');
    const y = Number(yStr);
    const m = Number(mStr) - 1;
    const d = Number(dStr);
    diaInicio = new Date(y, m, d, 0, 0, 0);
    diaFim = new Date(y, m, d, 23, 59, 59);
  }

  // Filtro por mês (YYYY-MM).
  const mesParam = sp.get('mes');
  const mes = mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : null;
  let mesInicio: Date | null = null;
  let mesFim: Date | null = null;
  if (mes) {
    const [yStr, mStr] = mes.split('-');
    const y = Number(yStr);
    const m = Number(mStr) - 1;
    mesInicio = new Date(y, m, 1);
    mesFim = new Date(y, m + 1, 0, 23, 59, 59); // último dia do mês
  }

  let dataInicio: Date;
  let dataFim: Date;
  if (diaInicio && diaFim) {
    // Dia explícito tem precedência sobre tudo (intersecta com ciclo se houver).
    if (cicloRef) {
      dataInicio = new Date(Math.max(diaInicio.getTime(), cicloRef.inicio.getTime()));
      dataFim = new Date(Math.min(diaFim.getTime(), cicloRef.fim.getTime()));
    } else {
      dataInicio = diaInicio;
      dataFim = diaFim;
    }
  } else if (mesInicio && mesFim) {
    // Mês explícito. Se houver ciclo, intersecta com a janela do ciclo.
    if (cicloRef) {
      dataInicio = new Date(Math.max(mesInicio.getTime(), cicloRef.inicio.getTime()));
      dataFim = new Date(Math.min(mesFim.getTime(), cicloRef.fim.getTime()));
    } else {
      dataInicio = mesInicio;
      dataFim = mesFim;
    }
  } else if (overrideDe && overrideAte) {
    dataInicio = overrideDe;
    dataFim = overrideAte;
  } else if (cicloRef) {
    dataInicio = overrideDe ?? cicloRef.inicio;
    // Cap em "agora" quando o ciclo ainda está em curso — comparação
    // "mesmo ponto" fica justa em vez de comparar com ciclo cheio.
    const cicloFimEffective =
      cicloRef.fim.getTime() > now.getTime() ? now : cicloRef.fim;
    dataFim = overrideAte ?? cicloFimEffective;
  } else {
    // ciclo=all sem overrides → usa toda a janela conhecida
    dataInicio = CICLOS[0]!.inicio;
    dataFim = CICLOS[CICLOS.length - 1]!.fim;
  }

  return { cicloId, poloIds, familias, dataInicio, dataFim, mes, dia };
}

function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(record)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      sp.set(k, v.join(','));
    } else {
      sp.set(k, v);
    }
  }
  return sp;
}

/**
 * Aplica o filtro a uma lista de matrículas. Função pura.
 * Filtros vazios em `poloIds`/`familias` significam "todos".
 */
export function applyFilter(
  matriculas: ReadonlyArray<Matricula>,
  filter: Filter,
): Matricula[] {
  const t0 = filter.dataInicio.getTime();
  const t1 = filter.dataFim.getTime();
  const polos = new Set(filter.poloIds);
  const familias = new Set(filter.familias);
  return matriculas.filter((m) => {
    const t = m.dataMatricula.getTime();
    if (t < t0 || t > t1) return false;
    if (polos.size > 0 && !polos.has(m.poloId)) return false;
    if (familias.size > 0 && !familias.has(m.familia)) return false;
    return true;
  });
}

/**
 * Serializa um filtro de volta para querystring (para botão "compartilhar
 * visão" e para limpar/setar valor preservando os outros).
 */
export function filterToSearchParams(filter: Filter): URLSearchParams {
  const sp = new URLSearchParams();
  if (filter.cicloId !== 'all') {
    sp.set('ciclo', filter.cicloId);
  } else {
    sp.set('ciclo', 'all');
  }
  if (filter.poloIds.length > 0) sp.set('polo', filter.poloIds.join(','));
  if (filter.familias.length > 0) sp.set('familia', filter.familias.join(','));
  if (filter.mes) sp.set('mes', filter.mes);
  if (filter.dia) sp.set('dia', filter.dia);
  return sp;
}

/**
 * Lista os meses (YYYY-MM) que têm pelo menos uma matrícula.
 * Usado para popular o select de mês.
 */
export function availableMonths(
  matriculas: ReadonlyArray<{ dataMatricula: Date }>,
): string[] {
  const set = new Set<string>();
  for (const m of matriculas) {
    const y = m.dataMatricula.getFullYear();
    const mo = String(m.dataMatricula.getMonth() + 1).padStart(2, '0');
    set.add(`${y}-${mo}`);
  }
  return Array.from(set).sort().reverse();
}
