import { expect, test } from '@playwright/test';

/*
 * Smoke E2E — Sprint 2.
 * Auth ativo: `/` redireciona para `/login`. `/api/health` segue público.
 * Cenários reais de OAuth (login + dashboard com dado mockado) entram
 * a partir de Playwright fixtures de auth no Sprint 3+.
 */

test('GET / sem sessão redireciona para /login', async ({ page }) => {
  const response = await page.goto('/');
  // Pode chegar em /login após redirect.
  await expect(page).toHaveURL(/\/login/);
  expect(response?.ok()).toBe(true);
});

test('login page mostra CTA "Entrar com Google"', async ({ page }) => {
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: /Entrar com Google/i }),
  ).toBeVisible();
});

test('GET /api/health retorna 200 ok (rota pública)', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
});
