# Screenshot Index

Screenshots are stored in `audit/campaign_truth_audit/screenshots/`. Raw visible text and browser logs are stored under `audit/campaign_truth_audit/raw/`.

| ID | Path | Viewport | Screen/state | Setup/save state | Visible issues | Console errors? |
|---|---|---|---|---|---|---|
| SS-001 | screenshots/SS-001-initial-existing-state-1365x768.png | 1365x768 | Existing local save | In-app browser existing storage | Offline and migration dialogs on load | No page errors; migration warnings visible |
| SS-002 | screenshots/SS-002-fresh-first-screen-1365x768.png | 1365x768 | Fresh first screen | Clean Playwright context | Cultivation visible before identity completed | No page errors; dev warnings |
| SS-016 | screenshots/SS-016-life-start-path-selection.png | 1365x768 | Life Start path selection | Fresh save after intro skip | Qi over cap and Breakthrough Ready with No Path selected | No page errors |
| SS-033 | screenshots/SS-033-after-heaven-path-select.png | 1365x768 | After path select | Fresh save, Heaven selected | Heart Law still not selected; wizard overlays live cultivation | No page errors |
| SS-053 | screenshots/SS-053-heart-law-initial.png | 1365x768 | Heart Law step | Fresh save, Heaven selected | Next requires card interaction despite selected-looking card | No page errors |
| SS-056 | screenshots/SS-056-after-next-at-bottom.png | 1365x768 | Breath step | Fresh save after Heart Law Next | Heart Law remained hidden until final Finish; breath confirmation step starts | No page errors |
| SS-087 | screenshots/SS-087-breath-finish-visible.png | 1365x768 | Breath Finish visible | Fresh save path and Heart Law chosen | Finish button only visible after scrolling lower in wizard | No page errors |
| SS-088 | screenshots/SS-088-after-life-start-finish.png | 1365x768 | Life-start finished | Fresh save completed path/Heart Law/breath | Notification confirms life begins; core state now coherent | No page errors |
| SS-089 | screenshots/SS-089-usable-status.png | 1365x768 | Status ledger | Fresh completed life-start | Status V3 ledger visible and concrete | No page errors |
| SS-090 | screenshots/SS-090-usable-cultivation.png | 1365x768 | Cultivation attempt | Fresh completed life-start | Automation stayed near Status/ledger state; nav capture fragile | No page errors |
| SS-091 | screenshots/SS-091-usable-world.png | 1365x768 | World attempt | Fresh completed life-start | Raw text still mostly Status ledger, indicating tab traversal fragility in audit run | No page errors |
| SS-092 | screenshots/SS-092-usable-inventory.png | 1365x768 | Inventory attempt | Fresh completed life-start | Raw text still mostly Status ledger | No page errors |
| SS-093 | screenshots/SS-093-usable-techniques.png | 1365x768 | Techniques attempt | Fresh completed life-start | Raw text still mostly Status ledger | No page errors |
| SS-094 | screenshots/SS-094-usable-records.png | 1365x768 | Records attempt | Fresh completed life-start | Raw text still mostly Status ledger | No page errors |
| SS-095 | screenshots/SS-095-usable-prestige.png | 1365x768 | Prestige attempt | Fresh completed life-start | Raw text still mostly Status ledger | No page errors |
| SS-096 | screenshots/SS-096-usable-settings.png | 1365x768 | Settings attempt | Fresh completed life-start | Raw text still mostly Status ledger | No page errors |

## Browser log highlights

- Fresh load emitted normal Vite and React dev messages.
- Content validation logs were warnings in browser console for technique counts and pavilion pool sizes.
- Several clicks reported `audio/ui_click_primary.ogg net::ERR_ABORTED`; this appears to be aborted click audio loading, not a page crash.
- No page-level runtime exception was observed during the captured fresh-save flow.
