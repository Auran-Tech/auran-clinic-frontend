# MVP 1 Release Checklist

MVP 1 is the responsive React web application for clinic staff. Native/mobile is explicitly MVP 2.

## Automated release gates

- [ ] Frontend CI succeeds: install, production build, tests.
- [ ] Backend CI succeeds: warnings-as-errors build.
- [ ] EF migrations apply to a clean SQL Server.
- [ ] EF reports no pending model changes.
- [ ] Backend unit tests succeed.
- [ ] Backend integration tests succeed.
- [ ] Backend publish succeeds.

## Security and tenancy

- [ ] Unauthenticated tenant queries fail closed.
- [ ] Clinic scope comes only from the authenticated context.
- [ ] Cross-clinic reads/writes are rejected.
- [ ] Permission policies are enforced in the API.
- [ ] React route guards and navigation reflect effective permissions.
- [ ] Protected Super User behavior remains server-controlled.
- [ ] Refresh token rotation and logout are verified.
- [ ] Upload size/type restrictions are verified.
- [ ] Stored files are private and are not publicly addressable.
- [ ] Internal GUIDs do not appear in route or query-string URLs.

## Clinical workflows

- [ ] Patient duplicate detection verified.
- [ ] Patient clinical profile verified.
- [ ] Dynamic profile configuration and values verified.
- [ ] Clinical measurement configuration and recording verified.
- [ ] Queue check-in and configured transitions verified.
- [ ] Concurrency conflict behavior verified for queue and clinical documentation.
- [ ] Multi-doctor visit sessions verified.
- [ ] Clinical draft save verified.
- [ ] Clinical orders/prescription sections verified.
- [ ] Patient and order attachments verified.
- [ ] Visit completion and delayed documentation verified.
- [ ] Follow-up Today / Upcoming / Overdue / Completed states verified.

## Administration and reporting

- [ ] Employee create/status/role assignment verified.
- [ ] Static role/permission catalog verified.
- [ ] Clinic settings save/reload verified.
- [ ] Workflow configuration save/reload verified.
- [ ] Clinical order configuration save/reload verified.
- [ ] Dynamic field configuration save/reload verified.
- [ ] Dashboard data verified against source records.
- [ ] Operational reports verified for a known date range.
- [ ] Audit events verified for important mutations.

## UX and localization

- [ ] English UI pass completed.
- [ ] Arabic UI pass completed.
- [ ] RTL layout pass completed.
- [ ] LTR layout pass completed.
- [ ] IDs, phone numbers, dates and codes remain LTR where appropriate.
- [ ] Desktop responsive pass completed.
- [ ] Tablet responsive pass completed.
- [ ] Mobile-width responsive web pass completed.
- [ ] Keyboard/focus behavior checked on forms, modals and navigation.
- [ ] Loading, empty, error, forbidden and disabled states checked.
- [ ] No dead controls remain in the production shell.

## Release decision

- [ ] Production environment variables are present.
- [ ] Database backup completed.
- [ ] Local file-storage backup/persistence path verified.
- [ ] Backend deployed and migrated first.
- [ ] Frontend deployed with the correct `VITE_API_BASE_URL`.
- [ ] Production smoke tests completed.
- [ ] Rollback artifacts and database backup are available.
