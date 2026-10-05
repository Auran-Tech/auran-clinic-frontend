# Frontend Architecture

React + TypeScript + Vite. Feature-oriented modules.

- app: composition and routing
- components: shared UI
- features: business features and API hooks
- lib: infrastructure
- styles: design tokens and responsive rules

TanStack Query owns server state. Local React state owns ephemeral UI state. Do not add global state without a concrete need.

All HTTP calls use the shared client. Authentication refresh is centralized. Frontend permission checks are UX only; backend authorization is authoritative.

The approved prototype is the visual reference. Do not port its standalone JavaScript file-for-file. Native/mobile implementation is MVP 2.


## Navigation identifiers

Production URLs must remain semantic and must not expose internal database identifiers. Feature navigation stores the currently selected entity in short-lived application/session state and uses clean routes such as `/patients/profile`.
