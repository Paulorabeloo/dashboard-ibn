import { google } from 'googleapis';

import { DashboardException } from '@/lib/errors';
import { log } from '@/lib/log';

import { type RawRow, type SchemaCheck, checkHeaders, rowFromCells } from './schema';

/*
 * T-109 — Adapter para Google Sheets API v4.
 *
 * Único ponto que conhece o schema bruto da planilha. Recebe um
 * SheetsClient injetado para permitir teste sem rede.
 *
 * Erros do Google são convertidos em DashboardException estruturadas.
 * Cabeçalhos são checados — schema mismatch é log de warn (não falha
 * a request, deixa para a UI sinalizar).
 */

export interface SheetsValuesGetParams {
  spreadsheetId: string;
  range: string;
  valueRenderOption?: 'UNFORMATTED_VALUE' | 'FORMATTED_VALUE' | 'FORMULA';
  dateTimeRenderOption?: 'FORMATTED_STRING' | 'SERIAL_NUMBER';
}

export interface SheetsClient {
  spreadsheets: {
    values: {
      get(params: SheetsValuesGetParams): Promise<{
        data: { values?: ReadonlyArray<ReadonlyArray<unknown>> | null };
      }>;
    };
  };
}

export interface FetchOptions {
  readonly sheetId: string;
  readonly range: string;
}

export interface FetchResult {
  readonly rows: RawRow[];
  readonly headerCheck: SchemaCheck;
  readonly fetchedAt: Date;
}

/**
 * Cria um SheetsClient real a partir da Service Account em base64.
 * Usado em produção; testes injetam um stub direto.
 */
export function makeSheetsClient(saKeyB64: string): SheetsClient {
  if (!saKeyB64) {
    throw new Error('GOOGLE_SA_KEY ausente — não é possível criar SheetsClient');
  }
  const credentials = JSON.parse(Buffer.from(saKeyB64, 'base64').toString('utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth }) as unknown as SheetsClient;
}

/**
 * Lê o range configurado, valida cabeçalhos e devolve linhas tipadas.
 */
export async function fetchRawSheet(
  client: SheetsClient,
  opts: FetchOptions,
): Promise<FetchResult> {
  let response: Awaited<ReturnType<SheetsClient['spreadsheets']['values']['get']>>;
  try {
    response = await client.spreadsheets.values.get({
      spreadsheetId: opts.sheetId,
      range: opts.range,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });
  } catch (err) {
    log.error('sheets.fetch.failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    throw new DashboardException({ kind: 'sheets_unavailable' });
  }

  const values = response.data.values ?? [];
  const fetchedAt = new Date();

  if (values.length === 0) {
    return {
      rows: [],
      headerCheck: { ok: false, missing: [], extra: [] },
      fetchedAt,
    };
  }

  const headerCheck = checkHeaders(values[0] ?? []);
  if (!headerCheck.ok) {
    log.warn('sheets.schema_mismatch', {
      missing: headerCheck.missing,
      extra: headerCheck.extra,
    });
  }

  const rows: RawRow[] = [];
  for (const cells of values.slice(1)) {
    try {
      rows.push(rowFromCells(cells));
    } catch (err) {
      // Linha individual com erro de schema é descartada — não derruba
      // o batch inteiro. Log para investigação.
      log.warn('sheets.row.invalid', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { rows, headerCheck, fetchedAt };
}
