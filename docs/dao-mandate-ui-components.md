# Dao Mandate UI Components

## Scope

P3 creates pure UI components under `src/ui/daoMandate`. They render typed Dao Mandate data and do not read stores or mutate gameplay.

## Import Pattern

```ts
import { MandateSeal, RequirementLedger } from '../ui/daoMandate/index.js';
```

## Route Action Pattern

Screens and owners pass `onRouteAction`. Components never call route adapters directly and never infer a route target.
Route buttons use unique `aria-describedby` ids derived from both route id and React `useId()` output, so the same route can be rendered more than once without duplicate IDs.

## Component Map

- `MandateSeal`: compact local Mandate seal.
- `MandateChamberHero`: Status hero candidate for P4.
- `RequirementLedger`: bucketed requirement rows.
- `SourceRouteSlip`: source/sink provenance.
- `ReadinessLedger`: readiness score and evidence rows.
- `SafetyNetPlaque`: Safety Net route surface.
- `RecentOmensFeed`: compact guidance event feed.
- `JadeSlipHelp`: contextual teaching slip.
- `LocalMandateLensHeader`: module relation header.
- `BackgroundSupportStrip`: passive/background routes.
- `ReincarnationCounsel`: prestige counsel.

## Guardrails

No stores, no gameplay mutations, no screen cutover, no emoji, no blue dashboard palette, and no color-only state.

## P3.1 Hardening Notes

- Components are pure renderers. Callers must pass already-filtered Dao Mandate data plus callback props.
- Disabled, blocked, targetless, and unavailable route states keep visible reason text. The route reason slot reserves one compact meta-text line to avoid ledger/card jitter when state changes.
- Reduced motion disables hover transforms, stamp scale motion, and animations. Labels, seals, icons, focus rings, and state text remain visible.
- State is expressed through visible labels and registered icons, not color alone.
- Body/meta text uses contrast-checked ink, muted ink, jade text, cinnabar, gold text, and bronze text fallbacks on parchment.
- `DaoMandateComponentSpecimens` remains fixture/demo support only. It is not wired into production navigation.
- Production screen cutover is deferred to P4 and later packets.

## Deferred Integration

- Status and Cultivation cutover remains P4.
- World and exact-screen integration remains P5.
- Source/sink production module integration remains P6.
- Omens, Jade Slip persistence, failure coaching, and prestige coaching remain P7.
- Cleanup/decommission of old public labels remains P8.
