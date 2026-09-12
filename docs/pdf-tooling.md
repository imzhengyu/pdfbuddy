# PDF tooling per feature page

Date: 2026-09-12. Evidence: source call sites plus the production build in
`dist/` (gzip sizes measured at level 9).

The project shipped one library (pdf.js) for everything. That was wrong framing:
five of the six jobs here are *document writing* (no pixels involved), and only
thumbnails/preview/image-export need a **rasteriser**. The split below is what
each page actually needs, what it uses, and whether that is the suitable tool.

| Page / job | What it must do | Suitable tool | Used today | Verdict |
|---|---|---|---|---|
| **Merge** — combine files | copy pages between documents | pdf-lib (writer) | pdf-lib | correct |
| **Split** — export selected pages | extract ranges, one PDF each, zip when >1 | pdf-lib + jszip | pdf-lib + jszip | correct |
| **Split** — export as images | rasterise *the selected pages* | pdf.js | pdf.js | correct (fixed: it rasterised every page) |
| **Rotate** | rewrite page rotation | pdf-lib | pdf-lib | correct |
| **Rotate / Organize / Split** thumbnails | rasterise pages to small bitmaps | pdf.js | pdf.js | correct |
| **Organize** — reorder/delete | rebuild page order | pdf-lib | pdf-lib | correct |
| **Convert** — images → PDF | decode JPEG/PNG, embed | pdf-lib | pdf-lib (+ worker) | correct |
| **Validation / page count** | parse structure | pdf-lib | pdf-lib | correct |
| **Preview modal** (all views) | rasterise one page at a time | pdf.js | pdf.js | correct |
| **ZIP packaging** | build archives | jszip | jszip (lazy chunk) | correct |

## Why pdf-lib and pdf.js are both here

- **pdf-lib** (MIT) is the *writer*: merge, split, rotate, reorganize, embed
  images. It cannot rasterise a page, so it can never serve thumbnails, preview
  or image export.
- **pdf.js** (Apache-2.0) is the *rasteriser*. It is the only mature pure-JS
  renderer; alternatives are WASM engines.
- **jszip** (MIT) only ever runs for multi-file exports, behind a dynamic import.

## Measured payload per page (production build)

Every view pulls the shared `index` chunk (150.7 kB raw / 49.4 kB gzip) and
`vendor-pdf-lib` (425.2 kB raw / **178.1 kB gzip**). pdf.js is *not* pulled by
the views themselves: it is fetched on demand the first time something renders.

| Chunk | Raw | gzip | Fetched when |
|---|---|---|---|
| `index-*.js` | 150.7 kB | 49.4 kB | any page |
| `vendor-pdf-lib-*.js` | 425.2 kB | 178.1 kB | any page that edits a PDF |
| `pdf-*.js` (pdf.js, main graph) | 321.4 kB | 93.8 kB | first thumbnail / preview / image export |
| `pdf-*.js` (pdf.js, worker graph — a second copy) | 321.3 kB | 93.8 kB | worker image export |
| `pdfProcessor.worker-*.js` | 424.9 kB | 177.6 kB | Convert (images → PDF) and worker image export |
| `vendor-jszip-*.js` | 95.1 kB | 29.5 kB | exporting more than one file |

Two structural costs are visible here and are *not* library choices:

1. **pdf-lib is duplicated** in the worker bundle (workers cannot share chunks
   with the main graph), so the Convert page downloads ~178 kB gzip twice.
2. **pdf.js is emitted twice** for the same reason: once for the main graph,
   once for the worker graph.

Both disappear only if the work moves back to the main thread — which trades
bytes for UI blocking, which is the wrong trade on this hardware.

## If the rasteriser is ever swapped

Only the rendering rows above change; the writing rows stay pdf-lib forever.

| Option | License | Size (needs verification) | Note |
|---|---|---|---|
| pdf.js (current) | Apache-2.0 | 93.8 kB gzip | smallest mature option, pure JS |
| PDFium → WASM | BSD-3 | multi-MB | faster/higher fidelity, much larger download |
| MuPDF → WASM | AGPL-3.0 or commercial | multi-MB | best quality, copyleft or paid licence |

Swapping should be done behind a `pdfRenderer` adapter so the four call sites
(thumbnails, preview, image export, worker) change once, and so different pages
can use different engines if that ever proves worthwhile.
