import { test, expect, request } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'http://localhost:4173';
const SLUG = process.env.QA_TENANT_SLUG || 'qa-robot';

test('start-play returns capacity for the test tenant', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE}/api/start-play`, { data: { slug: SLUG } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(typeof body.available).toBe('number');
});

test('start-play rejects unknown slug with 404', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post(`${BASE}/api/start-play`, { data: { slug: 'does-not-exist-xyz' } });
  expect(res.status()).toBe(404);
});

test('cron endpoints are protected (401/403 without secret)', async () => {
  const ctx = await request.newContext();
  for (const path of ['/api/blog-cron', '/api/retention-cron']) {
    const res = await ctx.get(`${BASE}${path}`);
    expect([401, 403], `${path} should require auth`).toContain(res.status());
  }
});
