# IHatePDF Conversion Service

Self-hosted conversion boundary for high-fidelity document conversions.

## API

- `GET /health` returns `{ "ok": true, "engines": ... }` with readiness for LibreOffice, Chromium, Docling, and the PDF rasterizer.
- `POST /convert` accepts `multipart/form-data`:
  - `file`: uploaded source file
  - `metadata`: JSON with `tool`, `mode`, `sourceMimeType`, `targetMimeType`, `fileName`, and `options`

Responses include:

- converted file body
- `x-conversion-engine`
- `x-conversion-filename`
- `x-conversion-warnings`
- `x-conversion-duration-ms`
- `x-conversion-fallback-used`
- `x-conversion-page-count` when known

## Engines

- Office to PDF: LibreOffice headless
- HTML to PDF: headless Chromium print rendering
- PDF semantic exports: Docling command boundary
- PDF raster archive: `PDF_RASTERIZER_BIN` or `pdftoppm` with zipped JPG output

High-fidelity and editable calls do not fall back to browser conversion. If an engine is unavailable, the request fails and the frontend asks the user to choose Local-only explicitly.

Private regression fixtures can be placed in `conversion-service/fixtures/private/`; that folder is ignored by git.

## Run

```powershell
docker build -t ihatepdf-conversion-service .
docker run --rm -p 8787:8787 --network none ihatepdf-conversion-service
```

Then set the frontend:

```powershell
$env:VITE_CONVERSION_SERVICE_URL = "http://127.0.0.1:8787"
npm.cmd run dev
```

The service uses per-job temp directories and deletes them after each request. Production deployments should also enforce container CPU/memory limits, upload limits at the reverse proxy, and outbound network denial by default.
