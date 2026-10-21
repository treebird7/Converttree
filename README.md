# ConvertTree

> **Transform freely** — convert documents and images between formats, privately, on the go.

ConvertTree is a React Native (Expo) mobile app that converts between document and image formats. Files are processed on-device or on a lightweight Express server and deleted immediately after conversion — no storage, no accounts required.

---

## Supported Conversions

| From | To |
|------|----|
| `.txt` | `.md`, `.docx`, `.pdf` |
| `.md` | `.txt`, `.docx`, `.pdf` |
| `.docx` | `.txt`, `.md`, `.pdf` |
| `.pdf` | `.txt`, `.md`, `.docx`, `.zip` (one PNG per page) |
| `.png` / `.jpg` | `.pdf` |

Powered by [Pandoc](https://pandoc.org/), [PyMuPDF](https://pymupdf.readthedocs.io/), and [Pillow](https://pillow.readthedocs.io/).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native + Expo (SDK 54) |
| Styling | NativeWind (Tailwind) |
| Navigation | Expo Router (file-based) |
| API | tRPC + Express.js |
| File ops | expo-document-picker, expo-file-system, expo-sharing |
| Conversion | Pandoc, PyMuPDF, Pillow, python-docx |
| Persistence | AsyncStorage (history + settings) |

---

## Features

- **Single-file conversion** — pick any supported file, choose output format, download or share the result
- **PDF page images** — export every PDF page as a PNG inside a ZIP archive
- **Batch conversion** — convert multiple files at once with a Pro subscription
- **Quick shortcuts** — one-tap "Convert to PDF / Word / Markdown / Text" from the home screen
- **Conversion history** — persisted locally; browse, re-download, or clear
- **Settings** — PDF quality, image compression, preserve formatting toggle, auto-download
- **Privacy first** — files are deleted from the server immediately after conversion; history lives only on your device
- **Dark mode** — full support
- **iOS + Android + Web** — single codebase

### Free and Pro access

Standard single-file conversions are available without an account for files up to 10 MB, with a modest hourly usage limit. Pro access is intended for batch conversion, files up to 50 MB, high-quality or multi-page image output, and any future conversion that uses an external metered service. There are no accounts and no billing integration yet, so every request is on the free tier and Pro features are currently unavailable. The tier is decided in one place, `server/context.ts`.

---

## Project Structure

```
app/
  (tabs)/
    index.tsx              ← Home screen
    format-selection.tsx   ← Pick output format
    conversion-progress.tsx
    conversion-result.tsx
    batch-conversion.tsx
    history.tsx
    settings.tsx
components/               ← Shared UI components
lib/                      ← Contexts (conversion, batch, history, settings)
server/                   ← Express + tRPC backend
  index.ts                ← HTTP server entry (health check, CORS, tRPC mount)
  routers.ts              ← API routes (conversion endpoints)
  context.ts              ← Per-request context, incl. the entitlement tier
  env.ts                  ← Validated server environment
shared/entitlements.ts    ← Free/Pro limits shared by client and server
  conversion_utils.py     ← Python conversion scripts
assets/images/            ← App icon, splash
design.md                 ← Design decisions + color palette
```

---

## Getting Started

### Prerequisites

- Node.js 18+, pnpm
- Python 3 with `pandoc`, `pymupdf`, `python-docx`, `Pillow`, `reportlab`
- Expo CLI

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev          # Starts both server + Expo (web on :8081)
pnpm ios          # iOS simulator
pnpm android      # Android emulator
```

### Test

```bash
pnpm test         # unit + conversion tests via Vitest (conversion tests need python3, pandoc and requirements.txt)
```

---

## Design

Tribal Integration aesthetic — warm terracotta, olive green, and natural browns against earthy dark backgrounds. Organic, Amazigh-inspired geometry. Wabi-sabi imperfection over corporate polish.

Primary color: `#0a7ea4` (Ocean Blue)
Brand feel: friendly, direct, privacy-respecting.

Full palette and layout principles in [design.md](design.md).

---

## Environment Variables

The server requires these environment variables at startup:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | Reserved signing key — server refuses to start if missing (nothing signs with it yet) |
| `PORT` | No | Listen port (default `3000`) |
| `FRONTEND_URL` | No | Extra browser origin allowed by CORS |
| `NODE_ENV` | No | Set to `production` in prod deployments |

The Expo client reads `EXPO_PUBLIC_API_BASE_URL` (the API server's base URL); empty means same-origin.

For local development, create a `.env` file in the project root:

```bash
JWT_SECRET=your-secret-here
```

For Railway or other platforms, set these in the platform's environment variable UI. `JWT_SECRET` must be set before the server will start.

---

## Privacy

Files are uploaded only for the duration of a conversion request. The server deletes temp files immediately after responding. No user accounts, no cloud storage, no analytics. Conversion history is stored only in `AsyncStorage` on the user's device.
