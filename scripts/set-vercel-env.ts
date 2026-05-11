/*
 * scripts/set-vercel-env.ts — setar env vars via API REST da Vercel.
 *
 * O CLI `vercel env add` via stdin não funciona no Windows (pipe quebra).
 * Esse script usa a API direto, mais confiável.
 *
 * Lê .env.local, e para cada var alvo manda PATCH/POST para a Vercel.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const TARGET_VARS = [
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'AUTH_ALLOWED_EMAILS',
  'AUTH_SECRET',
  'GOOGLE_SA_KEY',
  'SHEETS_ID',
  'SHEETS_RANGE',
  'CACHE_TTL_SECONDS',
  'LOG_LEVEL',
];

function readAuthToken(): string {
  // Tenta caminhos comuns no Windows
  const candidates = [
    path.join(homedir(), 'AppData', 'Roaming', 'xdg.data', 'com.vercel.cli', 'auth.json'),
    path.join(homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
    path.join(homedir(), '.config', 'vercel', 'auth.json'),
  ];
  for (const p of candidates) {
    try {
      const json = JSON.parse(readFileSync(p, 'utf-8'));
      if (json.token) return json.token as string;
    } catch {
      /* tenta próximo */
    }
  }
  throw new Error('Não encontrei token Vercel. Faça `vercel login` primeiro.');
}

function readProjectInfo(): { projectId: string; teamId: string } {
  const p = path.join(process.cwd(), '.vercel', 'project.json');
  const json = JSON.parse(readFileSync(p, 'utf-8'));
  return { projectId: json.projectId, teamId: json.orgId };
}

function parseEnv(envLocal: string): Map<string, string> {
  const map = new Map<string, string>();
  // Strip BOM se presente
  const cleaned = envLocal.replace(/^﻿/, '');
  for (const line of cleaned.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let value = m[2]!;
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    map.set(m[1]!, value);
  }
  return map;
}

async function setEnvVar(
  token: string,
  projectId: string,
  teamId: string,
  key: string,
  value: string,
): Promise<{ ok: boolean; reason?: string }> {
  const url = `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}&upsert=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production'],
    }),
  });
  if (res.ok) return { ok: true };
  const text = await res.text();
  return { ok: false, reason: `${res.status} ${text.slice(0, 200)}` };
}

async function main() {
  const token = readAuthToken();
  const { projectId, teamId } = readProjectInfo();
  const envMap = parseEnv(readFileSync('.env.local', 'utf-8'));

  console.log(`Projeto ${projectId} (team ${teamId})`);
  console.log('');

  for (const key of TARGET_VARS) {
    const value = envMap.get(key);
    if (!value) {
      console.log(`  skip ${key} (não encontrado em .env.local)`);
      continue;
    }
    const result = await setEnvVar(token, projectId, teamId, key, value);
    if (result.ok) {
      console.log(`  ok   ${key.padEnd(20)} length=${value.length}`);
    } else {
      console.log(`  FAIL ${key.padEnd(20)} ${result.reason}`);
    }
  }
}

main().catch((err) => {
  console.error('Erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
