---
name: verify
description: How to launch and drive server-photos locally to verify changes end-to-end.
---

# Verifying server-photos

## Launch

```bash
npm run dev   # from repo root: Fastify on 3001, Vite on 5173 (proxies /api and /uploads)
```

`server/.env` already has JWT_SECRET and local paths (`UPLOADS_DIR=./uploads`, default `./data/photos.db`) — dev data is local, safe to add/delete test photos.

## Drive (Chrome automation)

- `http://localhost:5173/` — a dev login token usually already sits in localStorage (`photos_token`); if not, register a throwaway user via the login page (the FIRST account ever registered inherits ownerless legacy rows — the dev DB already has a user, so extra accounts are safe).
- File pickers can't be automated natively. Inject uploads via `javascript_tool`: draw a canvas, `canvas.toBlob('image/jpeg')`, wrap in `File`, set on the `input[type=file]` via `DataTransfer`, dispatch `new Event('change', {bubbles:true})`. React's onChange fires; `files.length` reads 0 afterwards because the handler resets `input.value` — that means it worked.
  - `input[type=file]` order in DOM: [0] desktop navbar UploadButton, [1] mobile navbar UploadButton, [2] page-level input (e.g. AlbumDetailPage) when present.
- Canvas JPEGs have no EXIF → they always trigger the "Date needed" modal; click "Save date" to continue. Good probe of the missing-date flow.
- **Never click Delete buttons in the UI** — Lightbox photo delete and album delete use blocking `confirm()` dialogs that freeze the extension. Clean up via API instead:
  `fetch('/api/photos/<id>', {method:'DELETE', headers:{Authorization:'Bearer '+localStorage.getItem('photos_token')}})` (same for `/api/albums/<id>`). Photo DELETE also removes files from disk.

## Gotchas

- Screenshots via CDP fail intermittently right after clicks/navigation — retry after a `wait`, or resize the window once; hit-testing via `document.elementFromPoint` in `javascript_tool` is more reliable evidence for overlay/z-order questions.
- Overlay stacking: the route wrapper uses `.animate-fade-in`; its fill-mode was changed to `backwards` specifically so fixed overlays (album add-photos modal z-40, Lightbox z-[1000]) paint above the sticky navbar (z-30). A filling (`both`/`forwards`) opacity animation keeps a permanent stacking context — don't reintroduce it.
- Real `env(safe-area-inset-*)` values can't be simulated in desktop Chrome; safe-area padding checks need a real iPhone (PWA, black-translucent status bar).

## Tests (CI concern, not verification)

Client tests are `node:test`, not vitest: `cd client && npx tsx --test tests/*.test.ts`. `videoPlayer.test.ts` / `videoUrl.test.ts` fail under plain tsx because they import `src/api.ts` which reads Vite's `import.meta.env` — pre-existing, needs Vite-aware runner.
