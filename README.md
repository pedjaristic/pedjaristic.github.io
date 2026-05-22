# Pedja Ristic — Portfolio

Static site. No build step. Native ES modules, Three.js vendored locally.

## Run locally

ES modules require an HTTP context (browsers block them over `file://`). Open a terminal in this folder and start a static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in any modern browser.

Alternatives:

- **VS Code:** install the *Live Server* extension, right-click `index.html` → *Open with Live Server*.
- **Node:** `npx serve` (no install needed).
- **Any static file server.**

## Edit

- All design tokens (colors, fonts, spacing, motion) live in [`css/tokens.css`](css/tokens.css). Change once, re-skin everywhere.
- Project data (titles, taglines, palettes, asset paths) lives in [`js/data.js`](js/data.js).
- Each `.js` file has one responsibility. Names are human-readable; classes follow a BEM convention.
- No bundler, no transpiler. What you see in the file is what runs in the browser.

## File map

```
index.html              SPA shell — depth gallery (home) + all project views via hash routing

assets/                 Hero videos, thumbs, supporting imagery
css/                    tokens, reset, global, status-bar, depth-gallery, project-page, transitions
js/                     app, project, engine, gallery, scroll, mood, intro, card-overlay,
                        navigation, status-bar, shaders, data, vendor/three.module.js
```

## Dependencies

- [Three.js](https://threejs.org/) r0.183.0 — vendored at [`js/vendor/three.module.js`](js/vendor/three.module.js).
- Fonts loaded from Google Fonts (`Inter`, `JetBrains Mono`) — internet required for typography. Swap to local fonts later if needed.

## License

All rights reserved. Portfolio content © Pedja Ristic.
