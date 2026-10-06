# API Integration

Base URL: `VITE_API_BASE_URL`.

Standard response:
```ts
type BaseResponse<T> = { message: string; status: boolean; error?: string | null; data?: T | null };
```

Authentication:
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

Patients target:
- GET /patients?search=&page=&pageSize=
- POST /patients/details (identifier in request body; never in URL)
- POST /patients/duplicates
- POST /patients
- PUT /patients (identifier in request body)

Patient creation must repeat duplicate detection server-side even if the UI pre-checks. Clinic scope always comes from the authenticated session.


## Identifier URL rule

Internal entity identifiers must never appear in frontend routes, API route parameters, or API query strings.

Use:
- clean semantic frontend routes, e.g. `/patients/profile`;
- ephemeral application/session state to track the selected entity;
- request bodies for backend commands and entity lookups.

Identifiers remain internal implementation details and are still required for authorization and tenant-safe lookups.
