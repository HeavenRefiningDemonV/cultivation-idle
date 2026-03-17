# Phase 0 Contract Test Matrix (Packets 0.1A–0.1C)

| Suite | Contract asserted | Current status | Future owner packet | Notes |
|---|---|---|---|---|
| `pathContract.test.ts` | New-life path choice must be the same path used by mechanical run systems. | expected-fail (wrapped) | Packet 0.2 | Current runtime keeps `lifePath` and `selectedPath` split. |
| `gateContract.test.ts` | First gate trial should be enterable without pre-owning reward item; trial reward item must match breakthrough consumption item. | expected-fail (wrapped) | Packet 0.3 | Captures gate entry contradiction + gate namespace mismatch. |
| `cityUnlocks.test.ts` | Legitimate realm transition should unlock the next city in runtime state. | expected-fail (wrapped) | Packet 0.5 | Runtime does not centrally consume content `unlockMajorRealm`. |
| `prestigeReset.test.ts` | Prestige should reset per-life state, preserve meta state, and avoid accidental hybrid persistence. | mixed: meta test green; per-life/hybrid expected-fail | Packet 0.6 | City/trial slices currently persist across prestige reset path. |
| `offlineContract.test.ts` | One authoritative offline entry path, coherent cap/rule surface, no split-brain/double apply. | mixed: coherent-rule test green; entry-path + no-double-apply expected-fail | Packet 0.7 (offline unification) | SaveService/OfflineCatchup and legacy systems/offline both remain visible. |

Status legend:
- **green**: contract currently satisfied
- **expected-fail**: intentional Phase 0 failing contract, wrapped to keep CI green
- **mixed**: suite contains both green and expected-fail contracts
