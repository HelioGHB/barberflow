# API

[Português (Brasil)](../pt-BR/api.md)

No business endpoints are implemented through BF-003. `/` serves the product introduction. Login, CRUD, availability and bookings do not exist yet.

Route Handlers will be added per feature with Zod validation, backend authorization and shop context derived from the session. Each implementation will document actual methods, paths, inputs, outputs, permissions and errors. Booking conflicts should return 409.

There is no final public API contract at this stage. The database diagnostic is a local command (`npm run db:check`), not a public endpoint.
