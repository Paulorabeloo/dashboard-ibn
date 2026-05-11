/*
 * T-101 — Smoke local.
 * Lê 1 célula da planilha usando a Service Account configurada.
 * Falha ruidosamente se faltar env var ou se o acesso não estiver concedido.
 *
 * Uso:
 *   pnpm run check:sheets
 *
 * Pré-requisitos:
 *   - GOOGLE_SA_KEY (base64 do JSON da Service Account)
 *   - SHEETS_ID
 *   - SHEETS_RANGE
 */
import { google } from 'googleapis';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Variável ${name} não definida. Confira .env.local.`);
  }
  return value;
}

async function main() {
  const saKeyB64 = requireEnv('GOOGLE_SA_KEY');
  const sheetId = requireEnv('SHEETS_ID');
  const sheetRange = requireEnv('SHEETS_RANGE');

  const credentials = JSON.parse(Buffer.from(saKeyB64, 'base64').toString('utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: sheetRange,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const rows = res.data.values ?? [];
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, rowCount: rows.length, firstRow: rows[0] ?? null }));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
