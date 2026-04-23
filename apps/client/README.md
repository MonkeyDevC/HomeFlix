# HomeFlix Client

`apps/client` is the public VOD consumption surface.

In FASE 3 it owns:

- A Next.js TypeScript app shell.
- A technical status surface that calls `GET /api/v1/status`.
- A technical catalog probe that reads `ContentItem` and `Profile` contracts through the API.
- A technical Mux direct upload probe.
- Configuration for the API base URL.

It does not own editorial workflows, media processing truth, production authentication, final catalog browsing, playback, or fake Netflix-style screens in this phase.

## Commands

```bash
corepack pnpm --filter @homeflix/client dev
corepack pnpm --filter @homeflix/client build
corepack pnpm --filter @homeflix/client start
```

## Environment

```env
NEXT_PUBLIC_HOMEFLIX_API_BASE_URL=http://localhost:4000
```

`CLIENT_API_BASE_URL` is also documented at the workspace level for tooling, but browser-exposed Next.js runtime should use `NEXT_PUBLIC_HOMEFLIX_API_BASE_URL`.

## Boundary

The client consumes `apps/api`, never `apps/cms` directly.

During FASE 3, the client can read a basic catalog probe from the API and can still upload a selected video file directly to Mux using the upload URL returned by the API. That file must not be sent to Fastify as the primary binary upload route.

## Error states

The home page reports:

- invalid API URL configuration
- API unavailable
- unexpected API contract response
- catalog empty state
- catalog API unavailable
- missing API/Mux/PostgreSQL config during direct upload
- direct upload failure
