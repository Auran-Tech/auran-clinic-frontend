# MVP 1 Deployment Runbook

This runbook covers the Auran Clinic staff web application only. The native/mobile clinic app is MVP 2.

## Deployment order

1. Back up the production SQL Server database.
2. Deploy the backend build.
3. Apply EF Core migrations.
4. Verify backend authentication and clinic-scoped API access.
5. Deploy the React production build.
6. Run the smoke-test checklist below.

Deploy the backend before the frontend whenever an API contract or database migration changes.

## Backend configuration

Required production values:

- `ConnectionStrings__DefaultConnection`
- `Jwt__SigningKey`
- JWT issuer/audience values when they differ from defaults
- `Cors__AllowedOrigins__0` (and additional indexed origins when needed)
- `FileStorage__Provider`
- `FileStorage__LocalRootPath` when using local storage
- `FileStorage__MaxFileSizeBytes`

Do not commit production secrets.

The current MVP provider stores private files under the configured local storage root. That directory must be on persistent storage and must not be exposed directly by the web server. File downloads must continue through authenticated API endpoints.

## Database migration

From the backend repository:

```bash
dotnet tool restore
dotnet ef database update \
  --project src/Auran.Clinic.Infrastructure/Auran.Clinic.Infrastructure.csproj \
  --startup-project src/Auran.Clinic.Api/Auran.Clinic.Api.csproj \
  --configuration Release
```

Then verify:

```bash
dotnet ef migrations has-pending-model-changes \
  --project src/Auran.Clinic.Infrastructure/Auran.Clinic.Infrastructure.csproj \
  --startup-project src/Auran.Clinic.Api/Auran.Clinic.Api.csproj \
  --configuration Release
```

The second command must report no pending model changes.

## Backend build

```bash
dotnet restore Auran.Clinic.sln
dotnet build Auran.Clinic.sln --configuration Release --no-restore -warnaserror
dotnet test tests/Auran.Clinic.UnitTests/Auran.Clinic.UnitTests.csproj --configuration Release
dotnet test tests/Auran.Clinic.IntegrationTests/Auran.Clinic.IntegrationTests.csproj --configuration Release
dotnet publish src/Auran.Clinic.Api/Auran.Clinic.Api.csproj --configuration Release --output ./artifacts/api
```

## Frontend configuration and build

Set:

```text
VITE_API_BASE_URL=https://<api-host>/api
```

Then:

```bash
npm ci
npm run build
npm test
```

Publish the generated Vite build output to the web host.

The web host must support SPA fallback to `index.html` for semantic routes such as `/patients/profile` and `/visits/workspace`.

## Smoke tests

After deployment verify:

- Login succeeds for a clinic user.
- Refresh-token rotation works after an expired access token.
- Logout returns the user to login and clears the local session.
- Sidebar items match effective permissions.
- Arabic/English toggle changes document language and RTL/LTR direction.
- Patient quick search opens Patients without putting search text or IDs in the URL.
- Create patient runs duplicate detection.
- Patient profile loads clinical profile, dynamic fields, measurements, and files.
- Queue check-in creates an active visit.
- Queue transitions follow configured workflow.
- Doctor workspace can save a draft and clinical orders.
- Patient and clinical-order attachments upload and download.
- Completing a visit closes the active queue entry through a configured final transition.
- Delayed documentation can be finalized after visit completion.
- Follow-up due categories use the clinic timezone.
- Reports and Dashboard show clinic-scoped data.
- Audit Log shows the actor name and recent operations.
- A user from one clinic cannot read or mutate another clinic's data.
- No internal entity GUID is present in application URLs.

## File storage backup

For the MVP Local provider, back up the configured upload root together with the database. Database records without the corresponding stored file are not sufficient for recovery.

When moving to object storage later, keep the `IFileStorage` contract and replace only the infrastructure provider.

## Rollback

If a release fails:

1. Stop traffic to the new application version.
2. Restore the previous backend/frontend artifacts.
3. If a migration is not backward compatible with the previous backend, restore the pre-deployment database backup instead of blindly running migration `Down()`.
4. Restore file storage from the matching backup if file metadata/storage changed.
5. Re-run the smoke tests before reopening traffic.
