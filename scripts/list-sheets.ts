/*
 * scripts/list-sheets.ts — descobre nomes das abas da planilha.
 *
 * Use quando o `SHEETS_RANGE` der erro de "range invalid" — provavelmente
 * o nome da aba diverge do default. Roda:
 *
 *   pnpm run list:sheets
 *
 * Imprime cada aba com nome, gid e contagem de linhas. Atualize
 * SHEETS_RANGE no .env.local com o nome correto (entre aspas se tiver
 * espaços ou acentos).
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

  const credentials = JSON.parse(Buffer.from(saKeyB64, 'base64').toString('utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: 'properties.title,sheets.properties(sheetId,title,gridProperties)',
  });

  // eslint-disable-next-line no-console
  console.log(`Planilha: ${meta.data.properties?.title ?? '(sem título)'}`);
  // eslint-disable-next-line no-console
  console.log('---');
  for (const sheet of meta.data.sheets ?? []) {
    const p = sheet.properties;
    if (!p) continue;
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          title: p.title,
          sheetId: p.sheetId,
          rowCount: p.gridProperties?.rowCount ?? null,
          colCount: p.gridProperties?.columnCount ?? null,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
