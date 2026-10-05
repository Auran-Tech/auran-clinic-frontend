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
- GET /patients/{id}
- POST /patients/duplicates
- POST /patients
- PUT /patients/{id}

Patient creation must repeat duplicate detection server-side even if the UI pre-checks. Clinic scope always comes from the authenticated session.
