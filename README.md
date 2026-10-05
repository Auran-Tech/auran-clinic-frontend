# Auran Clinic Frontend

Production web frontend for **Auran Clinic MVP 1**.

## Scope

MVP 1 is a responsive **web application only** for clinic staff. The native/mobile clinic app is planned for MVP 2 and is intentionally excluded from this repository.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- React Hook Form + Zod
- i18next / react-i18next
- Vitest + Testing Library

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
