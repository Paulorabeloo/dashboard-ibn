import { getCicloPorData } from '@/lib/cycles';
import { normalizePolo } from '@/lib/polos/aliases';
import type {
  DashboardData,
  Matricula,
  Polo,
  ValePix,
  Vendedora,
} from '@/types/domain';

import { parseFamilia, parseOrigem, parseSubFamilia } from './enums';
import { hashRow } from './hash';
import { parseDate } from './parseDate';
import { parseNumber } from './parseNumber';
import type { RawRow } from './schema';
import { sanitizeText } from './sanitize';

/*
 * T-110 — Normalizer.
 *
 * Recebe linhas brutas validadas pelo Zod (`RawRow[]`), aplica a cadeia
 * de helpers e produz `DashboardData` denormalizado pronto para
 * agregação. Funciona em memória — não toca rede nem cache.
 *
 * Linhas sem `Carimbo de data/hora` são descartadas (provavelmente
 * teste/lixo deixado pelo formulário). O resto é tolerante: campos
 * faltantes viram null/'desconhecido'/'outro' conforme cada parser.
 */

const SCHEMA_VERSION = 1;

const slugifyName = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface NormalizeOptions {
  /** Relógio injetável (default: agora). */
  readonly now?: Date;
}

export interface NormalizeResult extends DashboardData {
  /** Quantas linhas foram descartadas por falta de carimbo. */
  readonly droppedCount: number;
}

export function normalize(
  rows: ReadonlyArray<RawRow>,
  options: NormalizeOptions = {},
): NormalizeResult {
  const now = options.now ?? new Date();

  const matriculas: Matricula[] = [];
  const polosMap = new Map<string, Polo>();
  const vendedorasMap = new Map<string, Vendedora>();
  const vendedoraPoloCount = new Map<string, Map<string, number>>();
  let droppedCount = 0;

  for (const row of rows) {
    const date = parseDate(row.carimbo);
    if (!date) {
      droppedCount += 1;
      continue;
    }

    const poloRaw = sanitizeText(row.polo ?? '');
    const polo = normalizePolo(poloRaw);

    const comercialClean = sanitizeText(row.comercial ?? '');
    const vendedoraId = comercialClean ? slugifyName(comercialClean) : 'desconhecido';

    const alunoNome = sanitizeText(row.alunoNome ?? '');

    const familia = parseFamilia(row.familia);
    const subFamilia = parseSubFamilia(row.subFamilia);
    const origem = parseOrigem(row.origem);

    const valorMensalidade = parseNumber(row.valorMensalidade);
    const parcelasRaw = parseNumber(row.quantidadeParcelas);
    const quantidadeParcelas =
      parcelasRaw != null && parcelasRaw > 0 ? Math.round(parcelasRaw) : null;

    const indicadoPorClean = sanitizeText(row.indicadoPor ?? '');
    const valePix: ValePix | null = indicadoPorClean
      ? {
          indicadoPor: indicadoPorClean,
          valor: valorMensalidade,
          quantidade: quantidadeParcelas ?? 1,
        }
      : null;

    const ciclo = getCicloPorData(date);

    const id = hashRow(
      date.toISOString(),
      polo.id,
      vendedoraId,
      alunoNome,
      familia,
      subFamilia,
    );

    const matricula: Matricula = {
      id,
      dataMatricula: date,
      cicloId: ciclo?.id ?? 'desconhecido',
      poloId: polo.id,
      poloRaw,
      vendedoraId,
      vendedoraNome: comercialClean,
      alunoNome,
      familia,
      subFamilia,
      origem,
      bolsaConvenio: sanitizeText(row.bolsaConvenio ?? '') || null,
      valorMensalidade,
      quantidadeParcelas,
      valePix,
    };
    matriculas.push(matricula);

    // Polo (acumula aliases observados)
    const existingPolo = polosMap.get(polo.id);
    if (!existingPolo) {
      polosMap.set(polo.id, {
        id: polo.id,
        nomeCanonico: polo.nomeCanonico,
        aliases: poloRaw && poloRaw !== polo.nomeCanonico ? [poloRaw] : [],
      });
    } else if (poloRaw && poloRaw !== polo.nomeCanonico && !existingPolo.aliases.includes(poloRaw)) {
      existingPolo.aliases.push(poloRaw);
    }

    // Vendedora (acumula contagem por polo para inferir poloPrincipal)
    if (vendedoraId !== 'desconhecido') {
      if (!vendedorasMap.has(vendedoraId)) {
        vendedorasMap.set(vendedoraId, {
          id: vendedoraId,
          nome: comercialClean,
          poloPrincipalId: null,
        });
      }
      let counts = vendedoraPoloCount.get(vendedoraId);
      if (!counts) {
        counts = new Map();
        vendedoraPoloCount.set(vendedoraId, counts);
      }
      counts.set(polo.id, (counts.get(polo.id) ?? 0) + 1);
    }
  }

  // Atribui poloPrincipalId à vendedora pelo polo de maior frequência.
  for (const [vendId, counts] of vendedoraPoloCount) {
    let maxPolo: string | null = null;
    let maxCount = 0;
    for (const [poloId, c] of counts) {
      if (c > maxCount) {
        maxCount = c;
        maxPolo = poloId;
      }
    }
    const v = vendedorasMap.get(vendId);
    if (v) v.poloPrincipalId = maxPolo;
  }

  return {
    matriculas,
    polos: Array.from(polosMap.values()),
    vendedoras: Array.from(vendedorasMap.values()),
    cachedAt: now.toISOString(),
    schemaVersion: SCHEMA_VERSION,
    droppedCount,
  };
}
