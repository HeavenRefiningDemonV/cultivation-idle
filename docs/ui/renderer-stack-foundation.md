\# UI Renderer Stack Foundation



\## Locked renderer decision

\- Readable UI stays in React DOM.

\- Framer Motion is the standard for new DOM motion.

\- PixiJS is the dedicated 2D FX layer for atmosphere and hero visuals.

\- `@pixi/react` is the React bridge for Pixi scenes.

\- `@pixi/particle-emitter` is deferred and not part of A.1.

\- No full-canvas UI.

\- No Pixi-rendered readable gameplay text.



\## Installed packages

\- pixi.js

\- @pixi/react



\## A.1 scope boundary

This packet only establishes dependency readiness and the renderer-stack decision.

It does not add:

\- `src/ui/fx/`

\- Pixi stage mounting

\- screen rewrites

\- atmosphere/VFX implementation

\- runtime Pixi usage in screen components



\## Verification completed

\- `npm install pixi.js @pixi/react`

\- `npm install`

\- `npm run ensure:vendor-links`

\- `npm run typecheck`

\- `npm run build`



\## Known repo issues outside A.1

\- Existing ESLint backlog unrelated to Pixi installation

\- `test:contracts` npm script needs cross-platform env handling on Windows

