# Changelog

## [Unreleased]

### Added
- `Dockerfile` — Node 20 + Python 3 + pandoc + WeasyPrint for Railway deployment
- `railway.toml` — Railway build config with health check at `/api/health`
- `requirements.txt` — Python dependencies for the conversion pipeline
- `.dockerignore` — excludes `node_modules`, `dist`, `.env`, native build folders
- Free/Pro entitlement boundary with a `free` default and Pro-gated batch conversion
- Subscription-tier database migration and entitlement regression tests
- PDF-to-image output now returns a ZIP archive containing one PNG per page

### Removed
- The Manus platform layer the app was scaffolded from: its OAuth sign-in, session cookies, iframe runtime, storage proxy and LLM/voice/image/notification helpers, the template server guide, and the `VITE_*`/`OAUTH_*`/`OWNER_*`/`BUILT_IN_FORGE_*` environment variables. The server, tRPC setup, request context and environment validation are now the app's own tracked modules, so a fresh clone typechecks, tests and builds.
- Sign-in: the app has no accounts. Every request is on the free tier until a way to prove Pro is chosen (`server/context.ts`).

### Fixed
- Replaced hardcoded `/usr/bin/python3.11` with `python3` in `server/routers.ts` so conversions work regardless of which Python version is installed
- Updated shebang in `server/conversion_utils.py` from `#!/usr/bin/python3.11` to `#!/usr/bin/env python3` for the same reason
- Standard unauthenticated conversions are available without an account, with free-tier size and hourly limits
- Added server-side per-IP throttling and batch entitlement enforcement

## [1.0.0] - 2026-04-07

### Added
- Initial release — ConvertTree file converter app
- Supported formats: `.txt`, `.md`, `.docx`, `.pdf`, `.png`, `.jpg`, `.jpeg`
- Single-file and batch conversion modes
- Local conversion history (AsyncStorage)
- Settings: PDF quality, compression preferences
- Express + tRPC backend with Python conversion scripts (Pandoc, PyMuPDF, Pillow)
- Expo SDK 54 frontend with NativeWind styling
