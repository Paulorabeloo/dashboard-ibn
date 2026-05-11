import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardException } from '@/lib/errors';
import { fetchRawSheet, type SheetsClient } from '@/lib/sheets/adapter';

import happyFixture from '@tests/fixtures/sheets/happy.json';

/*
 * T-109 — Integration test do adapter.
 * Cliente Sheets é injetado (stub) — sem rede.
 */

function stubClient(values: unknown): SheetsClient {
  return {
    spreadsheets: {
      values: {
        get: vi.fn().mockResolvedValue({ data: { values } }),
      },
    },
  };
}

function rejectingClient(error: Error): SheetsClient {
  return {
    spreadsheets: {
      values: {
        get: vi.fn().mockRejectedValue(error),
      },
    },
  };
}

const OPTS = { sheetId: 'fake-id', range: 'Sheet1!A:Y' };

describe('fetchRawSheet (T-109)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lê fixture happy e devolve linhas + headerCheck.ok=true', async () => {
    const client = stubClient(happyFixture.values);
    const result = await fetchRawSheet(client, OPTS);

    // 6 linhas no fixture - 1 header = 5 rows + 1 lixo (todas passam pelo Zod)
    expect(result.rows).toHaveLength(6);
    expect(result.headerCheck.ok).toBe(true);
    expect(result.fetchedAt).toBeInstanceOf(Date);
  });

  it('headerCheck.ok = false quando coluna obrigatória falta', async () => {
    const broken = [
      ['Carimbo de data/hora', 'Comercial'], // só 2 colunas, faltam o resto
      ['10/05/2026 10:00:00', 'Vendedora Exemplo'],
    ];
    const client = stubClient(broken);
    const result = await fetchRawSheet(client, OPTS);
    expect(result.headerCheck.ok).toBe(false);
    expect(result.headerCheck.missing.length).toBeGreaterThan(0);
  });

  it('lança DashboardException kind=sheets_unavailable em erro de rede', async () => {
    const client = rejectingClient(new Error('ECONNRESET'));
    await expect(fetchRawSheet(client, OPTS)).rejects.toBeInstanceOf(DashboardException);
    try {
      await fetchRawSheet(client, OPTS);
    } catch (err) {
      expect((err as DashboardException).cause.kind).toBe('sheets_unavailable');
    }
  });

  it('values vazio devolve resultado vazio sem crashar', async () => {
    const client = stubClient([]);
    const result = await fetchRawSheet(client, OPTS);
    expect(result.rows).toEqual([]);
    expect(result.headerCheck.ok).toBe(false);
  });

  it('chama spreadsheets.values.get com renderOptions corretos', async () => {
    const client = stubClient(happyFixture.values);
    await fetchRawSheet(client, OPTS);
    expect(client.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: 'fake-id',
      range: 'Sheet1!A:Y',
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });
  });
});
