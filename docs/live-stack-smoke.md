# Live-stack browser smoke

This manually triggered workflow runs the frontend, published backend API, and SQL Server 2022 in one GitHub Actions job.

## Repository access

The backend repository is currently **public**, so the workflow checks it out with the job's standard GitHub token. No separate `E2E_BACKEND_READ_TOKEN` is required. If the backend later becomes private, configure appropriate least-privilege checkout credentials before running the workflow.

## Running

In the frontend repository open **Actions → Live Stack Browser Smoke → Run workflow** on the default branch. Check the `live-stack` job, including backend checkout, SQL migrations, API readiness and Playwright browser checks. Failure logs are uploaded as `live-stack-backend-logs` and `live-stack-playwright-results` when available.

The browser suite checks a real cross-origin fetch and protected-endpoint HTTP 401, then exercises clinic login, patient registration, doctor check-in and queue exit, specialty documentation configuration, finalized-record protection, platform clinic administration, and report exports against the hosted API and SQL Server. The suite uses disposable CI data and does not replace supervised clinical acceptance, a complete role and tenant matrix, or production-like Staging UAT.
