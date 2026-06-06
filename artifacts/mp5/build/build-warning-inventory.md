# MP5 Build Warning Inventory

Generated: 2026-05-29T17:28:20.891Z

## Fixed In MP5
- Browserslist/caniuse-lite stale warning removed by `npx update-browserslist-db@latest`.
- `InsideDungeon.png` unresolved CSS asset warning fixed by correcting the SCSS relative path.

## Remaining Warning
- `BUNDLE-CHUNK-SIZE-MP5-001`: Vite reports chunks larger than 500 kB after minification. This is advisory bundle debt, not a critical asset/build failure. It remains unaccepted for GO because MP5 final decision is NO_GO.
