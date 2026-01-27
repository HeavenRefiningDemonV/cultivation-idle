# Icon usage guidelines

- **Never use emoji as UI icons.** They are inconsistent across platforms and break layout predictability.
- **Use `<GameIcon icon="..." />`** for all UI iconography. The registry keeps sizing, scale, and alignment consistent.
- **Need a new icon?**
  - Add a PNG to `src/assets/icons/` and register it in `iconRegistry.ts`, **or**
  - Add a monochrome SVG to `InkIcon.tsx` and register it as an `IconId`.

If you see emoji icons in the UI, replace them with the appropriate `IconId` and update the mapping in `emojiReplacements.ts`.
