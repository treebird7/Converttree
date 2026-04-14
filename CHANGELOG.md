# Changelog

## [Unreleased]

### Added
- `Dockerfile` — Node 20 + Python 3 + pandoc + WeasyPrint for Railway deployment
- `railway.toml` — Railway build config with health check at `/api/health`
- `requirements.txt` — Python dependencies for the conversion pipeline
- `.dockerignore` — excludes `node_modules`, `dist`, `.env`, native build folders

### Fixed
- Replaced hardcoded `/usr/bin/python3.11` with `python3` in `server/routers.ts` so conversions work regardless of which Python version is installed
- Updated shebang in `server/conversion_utils.py` from `#!/usr/bin/python3.11` to `#!/usr/bin/env python3` for the same reason

## [1.0.0] - 2026-04-07

### Added
- Initial release — ConvertTree file converter app
- Supported formats: `.txt`, `.md`, `.docx`, `.pdf`, `.png`, `.jpg`, `.jpeg`
- Single-file and batch conversion modes
- Local conversion history (AsyncStorage)
- Settings: PDF quality, compression preferences
- Express + tRPC backend with Python conversion scripts (Pandoc, PyMuPDF, Pillow)
- Expo SDK 54 frontend with NativeWind styling
