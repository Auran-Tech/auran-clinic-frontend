#!/usr/bin/env node
/**
 * Deployment smoke gate for the AURAN Clinic web/API pair.
 *
 * Required:
 *   AURAN_FRONTEND_URL=https://clinic.example.com
 *   AURAN_API_URL=https://api.example.com
 * Run: node scripts/smoke-deployment.mjs
 *
 * No credentials or patient data are used. This complements, but does not
 * replace, authenticated end-to-end clinic workflow and tenant isolation tests.
 */
const frontend = process.env.AURAN_FRONTEND_URL;
const api = process.env.AURAN_API_URL;
const timeoutMs = 10000;

if (!frontend || !api) {
  console.error('Set both AURAN_FRONTEND_URL and AURAN_API_URL.');
  process.exitCode = 2;
} else {
  const checks = [
    { label: 'Frontend shell', base: frontend, path: '/', expectHtml: true },
    { label: 'Backend liveness', base: api, path: '/health/live' },
    { label: 'Backend readiness (SQL Server)', base: api, path: '/health/ready' },
  ];

  let failed = false;
  for (const check of checks) {
    let url;
    try {
      url = new URL(check.path, check.base.endsWith('/') ? check.base : check.base + '/');
      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('Only HTTP(S) URLs are supported');
      }
      const response = await fetch(url, {
        // Do not silently treat an SSO/login redirect as a healthy deployment.
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: check.expectHtml ? 'text/html' : '*/*' },
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || (check.expectHtml && !contentType.includes('text/html'))) {
        throw new Error(`HTTP ${response.status}; content-type: ${contentType}`);
      }
      console.log(`PASS ${check.label}: HTTP ${response.status}`);
    } catch (error) {
      failed = true;
      console.error(`FAIL ${check.label}: ${error.message}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log('Deployment HTTP smoke checks passed. Authenticated clinical E2E/UAT is still required.');
  }
}
