# UI FX Settings Bridge (Packet A.3)

## Purpose
Packet A.3 connects the Packet A.2 FX contracts to real user settings without mounting FX in the app shell.

## uiFx settings shape
```ts
uiFx: {
  enabled: boolean;
  quality: 'auto' | 'high' | 'medium' | 'low';
  allowAtmosphere: boolean;
  allowHeroFx: boolean;
}
```

Defaults:
- `enabled: true`
- `quality: 'auto'`
- `allowAtmosphere: true`
- `allowHeroFx: true`

## Persistence strategy
- Persistence is intentionally bounded to `uiFx` only.
- Storage key: `ui.fx.settings.v1`.
- Storage transport: `window.localStorage` when available.
- Invalid JSON and invalid values sanitize back to safe defaults.
- No save-schema migration/version bump is required for A.3.

## Reduced motion precedence
- System reduced motion is observed via `matchMedia('(prefers-reduced-motion: reduce)')`.
- Reduced motion always clamps continuous FX behavior.
- Dev-only QA override (`system | force-on | force-off`) can preview outcomes without persisting override state.

## Store-agnostic provider boundary
- `src/ui/fx/**` remains store-agnostic.
- `FxQualityProvider` accepts plain props only.
- Zustand coupling is isolated to `src/app/fx/useUiFxSettings.ts`.

## Bridge location
- Pure mapping: `src/app/fx/buildUiFxProviderProps.ts`
- Storage boundary: `src/app/fx/uiFxSettingsStorage.ts`
- Store-coupled hook: `src/app/fx/useUiFxSettings.ts`

## Handoff
- **A.4:** finalize global FX layer/z policy.
- **A.7:** mount `FxQualityProvider` in app runtime and connect live screen stages.
