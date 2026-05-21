# Master Implementation Plan: IHatePDF

This is the master implementation plan for building **IHatePDF**—the premier local-first, zero-server, privacy-focused clone of iLovePDF. This plan acts as the structural bridge for the terminal CLI agents (`codex` and `gemini`) running in the workspace to construct a production-ready application.

---

## 📋 Overview
"IHatePDF" solves the core friction points of standard PDF utility websites (data privacy concerns, internet upload waiting times, strict limits, aggressive paywalls, and display advertisements) by moving the entire application and execution layer directly to the client's browser using Next.js/Vite, WebAssembly, Web Workers, IndexedDB, and Tesseract.js.

### Core Metrics & Success Criteria
1.  **Zero Server Upload Latency:** Files are read and processed locally.
2.  **100% Client-Side Privacy:** No document data is ever sent to external servers.
3.  **Core Web Vitals:** Initial visual load under **1.2s** (lazy-loaded WASM/workers).
4.  **Offline Execution:** PWA-compliant interface functional in 100% offline modes.
5.  **Premium Aesthetics:** Modern dark/light glassmorphism layouts with micro-animations.

---

## 🛠️ Tech Stack & Design Token Overview
*   **Frontend Core:** React 19 + TypeScript + Vite SPA.
*   **Styles & Tokens:** Tailwind CSS v4 CSS-first design system config + Radix/Shadcn UI base primitives.
*   **PDF Manipulation:** Pure JS binary stream operations via `pdf-lib`.
*   **PDF Previews:** Mozilla's `pdfjs-dist` compiled worker layer.
*   **OCR Engine:** `tesseract.js` worker thread with dynamic IndexedDB caching.
*   **Local Databases:** Zustand reactive stores + Promise-based IndexedDB layers.

For complete specs, view:
*   [Technical Stack Specification (tech_stack.md)](file:///d:/College%20Projects/IHatePDF/tech_stack.md)
*   [Data Schema Specification (Schema.md)](file:///d:/College%20Projects/IHatePDF/Schema.md)

---

## 🤖 Living Development Status
The development pipeline is split between our two active background terminal agents:
1.  **Codex CLI:** Manages background execution, Web Worker pools, PDF/WASM integrations, IndexedDB caches, and security runs.
2.  **Gemini CLI:** Manages responsive page structures, interactive UI canvases, configuration sidebars, achievements tracking, and donation modal interfaces.

The task backlog is managed inside a living status file. Agents MUST lock tasks to `[/]` before starting and mark them `[x]` upon verified completion.
*   [CLI Rules & Quality Playbook (Rule.md)](file:///d:/College%20Projects/IHatePDF/Rule.md)
*   [Living Task Board (ProcessStatus/task.md)](file:///d:/College%20Projects/IHatePDF/ProcessStatus/task.md)

---

## 🔍 Verification & Hardening Plan

Before releasing the final build, the master verification scripts must be executed. A task or release is NOT complete until all validation checks return positive results:

```bash
# 1. Run full verification suite (Security, UX, Accessibility, Playwright, Lighthouse)
python .agent/scripts/verify_all.py . --url http://localhost:4173

# 2. Run core developer audit
python .agent/scripts/checklist.py .
```

### Verification Gate checklist
- [ ] No purple or violet color hexes utilized in style files (Strict Brand Guideline).
- [ ] Responsive grid and masonry components audited down to 320px screen widths.
- [ ] Total initial load bundle size is under 2.5MB (excluding lazy-loaded WASM packages).
- [ ] Playwright E2E browser tests successfully perform local merge, split, compress, and OCR tasks without error.

---

## ✅ PHASE X COMPLETE
- Lint: [Pending]
- Security: [Pending]
- Build: [Pending]
- Date: [Pending]
