# Live-stack browser smoke

This manually triggered workflow runs the frontend, published backend API, and SQL Server 2022 in one GitHub Actions job.

## Prerequisite

In the **frontend repository**, configure the Actions secret `E2E_BACKEND_READ_TOKEN` with **Contents: Read** permission for `Auran-Tech/auran-clinic-backend`. Use a fine-grained repository-scoped token, not a broadly privileged token. Never commit the token.

## Running

In the frontend repository open **Actions → Live Stack Browser Smoke → Run workflow** on the default branch. Check the `live-stack` job, including backend checkout, SQL migrations, API readiness and Playwright browser checks. Failure logs are uploaded as `live-stack-backend-logs` and `live-stack-playwright-results` when available.

The browser probe performs a real cross-origin fetch to the API and expects HTTP 401 on a protected endpoint, proving both CORS access and anonymous protection. It does **not** create a patient, authenticate a clinic user, or verify end-to-end clinical workflows. Those acceptance tests and Staging UAT remain release blockers.
