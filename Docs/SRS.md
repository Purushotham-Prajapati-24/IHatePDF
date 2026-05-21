# 3. Software Requirements Specification (SRS)

This is where the architecture changes radically. We are moving from a heavy Backend/Microservices model to a Thick Client / Static Edge Delivery model.

## A. System Overview & Architecture

There is no backend server handling files. Your infrastructure purely exists to serve the frontend application files (HTML, CSS, JS, WASM) to the user as fast as possible.

- **The Delivery Layer (CDN):** Cloudflare Pages, Vercel, or Netlify. When a user hits the URL, the CDN serves the static assets from the node geographically closest to them.
- **The Application Layer (Browser):** The user's browser downloads the React/Next.js application.
- **The Processing Layer (Web Workers & WASM):** When a file is dropped, the app loads a WebAssembly module into a Web Worker. The file is read into local RAM (as a Blob or ArrayBuffer), manipulated, and reconstructed as a downloadable link directly in the DOM.

## B. Tech Stack (100% Free & Open Source)

- **Frontend Framework:** Next.js (Static Export mode) or Vite + React.
- **Styling:** Tailwind CSS + Shadcn UI (for clean, accessible, modern components).
- **Core PDF Engine:** pdf-lib (Pure JavaScript, great for merging/splitting) and MuPDF compiled to WebAssembly (for heavier lifting/rendering).
- **State Management:** Zustand (lightweight, perfect for managing UI state and file blobs).
- **Hosting:** Cloudflare Pages (Generous free tier, practically infinite bandwidth for static sites).
- **Analytics (Privacy-Friendly):** Plausible Analytics or Umami (Self-hosted) to track usage without harvesting personal data, reinforcing your privacy angle.

## C. Edge Cases & Failure Handling (Crucial for Local Processing)

### Out of Memory (OOM) Crashes

Browsers limit how much RAM a single tab can use. If a user tries to merge 50 files totaling 2GB, the tab will crash.

- **Handling:** Implement file size checks before reading into memory. If `total_size > 500MB`, show a warning: "This is a massive task for a browser. Processing may fail depending on your device's memory. Proceed?"

### Mobile Limitations

Mobile browsers aggressively throttle background tasks.

- **Handling:** If `navigator.userAgent` detects a mobile device, disable heavy tasks like client-side OCR, or present a clear warning about battery/speed limitations.
