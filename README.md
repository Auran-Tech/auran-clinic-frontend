# Auran Clinic Frontend

Production web frontend for **Auran Clinic MVP 1**.

## Scope

MVP 1 is a responsive **web application only** for clinic staff. The native/mobile clinic app is planned for MVP 2 and is intentionally excluded from this repository.

## Stack

For the complete local Docker test stack, see the sibling backend repository's `docker-compose.yml` and Docker MVP 1 test stack instructions. The frontend image serves the app through Nginx on `http://127.0.0.1:4173`; Compose builds it against the local API at `http://127.0.0.1:5085/api` so the existing live-stack Playwright checks can run against Docker. Set `E2E_REUSE_EXISTING_SERVER=true` when running Playwright against the already running container.

### Synthetic local demo data

For a disposable local clinic, set `AURAN_DEMO_EMAIL` and `AURAN_DEMO_PASSWORD` to its administrator credentials, then run `node scripts/seed-local-demo.mjs --confirm-local`. The script accepts only a local HTTP API (`AURAN_DEMO_API_BASE` defaults to `http://127.0.0.1:5085/api`). It uses the real API to add 20 clearly named fictional patients, three demo doctors, current visits, follow-ups, and draft/pending documentation. It extends only a starter workflow made of demo status codes and preserves other workflows. Re-running it does not duplicate records. Do not use real patient details or run this against a shared clinic.

For the dashboard's seven-day chart, run `pwsh -File ../auran-clinic-backend/scripts/seed-dashboard-history.ps1 -ConfirmLocal` with the same environment variables. This adds 36 deterministic, completed historical visit fixtures directly to the local Docker SQL database. It requires the clinic timezone to be `Africa/Cairo`, checks the administrator identity, and refreshes its own rows on later runs. These rows are for dashboard/reporting display; use the API-created visits to test clinical workflows.

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- React Hook Form + Zod
- i18next / react-i18next
- Vitest + Testing Library

## Translations

Existing translated UI text is stored as JSON in `src/translations/<module>/en.json` and `ar.json`. Each module folder is an i18next namespace, registered in `src/translations/index.ts`. Components use explicit namespace keys such as `t('shell:signOut')` or `useTranslation('language')`. `src/i18next.d.ts` checks translation keys in TypeScript; JSON does not provide the same interpolation-value inference as `as const` TypeScript resources. Keep the English and Arabic keys aligned; `src/translations/translations.test.ts` checks that each registered module has matching, nonempty entries. Add a new module folder and register both language files when a screen is localized.

## Product principles

- Backend is the source of truth for authorization and tenant isolation.
- UI permissions improve UX but never replace API authorization.
- Arabic and English are first-class.
- RTL and LTR must work for every screen.
- Machine-readable values such as IDs, phone numbers and timestamps remain internally LTR while layout follows the active direction.
- The approved prototype in `Auran-Tech/auran-clinic-prototype` is the visual/interaction reference, not production code to copy file-for-file.
- No patient-facing flows in MVP 1.
- No mobile/native implementation in MVP 1.

## Initial delivery order

1. App foundation and design tokens
2. Authentication and session lifecycle
3. App shell and permission-aware navigation
4. Patients vertical slice
5. Queue
6. Visits and clinical workspace
7. Follow-ups
8. Employees / RBAC
9. Settings
10. Reports and audit

See `docs/` for architecture, MVP scope and API integration rules.
