# MVP 1 integration and release gate

This checklist applies to **both** AURAN Clinic repositories. A successful CI run on a
stacked feature PR is not proof that the entire app is merged, deployable, or
safe for clinical use.

## Scope and implementation tracking

- Backend PR stack: https://github.com/Auran-Tech/auran-clinic-backend/pulls
- Frontend PR stack: https://github.com/Auran-Tech/auran-clinic-frontend/pulls
- Canonical product decisions: https://github.com/Auran-Tech/auran-clinic-prototype/pull/1
- Merge prerequisite branches bottom-up after review; never assume green CI on
  a feature head makes its dependent, unmerged PRs ready.
- Once integrated into main, run CI again against main for **both** repos.

## Automated checks

Backend:
1. Release build with warnings as errors.
2. SQL Server migration from an empty database; no pending EF model changes.
3. Unit and integration tests including platform/clinic identity and tenant isolation.
4. API publish.
5. Both `/health/live` and `/health/ready` operational.

Frontend:
1. TypeScript production build.
2. Lint and unit/component tests.
3. Confirm `VITE_API_BASE_URL` targets the deployed API.
4. Run the deployed HTTP smoke gate:

```bash
AURAN_FRONTEND_URL=https://clinic.example.com \
AURAN_API_URL=https://api.example.com \
node scripts/smoke-deployment.mjs
```

The API URL should be the origin (before `/api`), since health endpoints live
under `/health`. Run this only against an environment you control. Smoke checks
use no credentials and never exercise patient records.

## Required manual end-to-end clinic acceptance

On an isolated staging clinic with synthetic patient information:

1. Sign in as receptionist, search a patient, exercise duplicate detection,
   create the patient, and verify the saved record.
2. Check in the patient, move them through the configured live queue, and
   verify state changes across browser refreshes.
3. Sign in as the assigned doctor, open a visit, record a session, measurements,
   clinical order and permitted patient attachment.
4. Save a documentation draft, complete the visit, verify pending-documentation
   behavior and view the patient visit history.
5. Create a follow-up recommendation and verify lists/statuses.
6. Verify clinic Super User administration, user roles, workflow/config fields,
   dashboard, exports, and relevant audit entries.
7. Repeat critical actions as an unauthorized role and a different clinic.
   All cross-clinic reads/writes must fail; no data may leak.
8. Complete English, Arabic, LTR/RTL, tablet/mobile-width, keyboard and
   accessibility acceptance checks.

## Release decision

Do not mark MVP 1 release-ready until the two integrated main branches pass CI,
a fresh staging database is migrated, the deployment smoke gate passes, and
the authenticated end-to-end acceptance above is signed off. Confirm backups,
restore drills, file storage persistence, secrets, audit retention, and rollback.
Native/mobile, appointments and commercial subscriptions are deferred.
