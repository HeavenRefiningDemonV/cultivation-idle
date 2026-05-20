# Review Notes

Scope:
- Status cut over to Dao Mandate Chamber as the first guidance authority.
- Cultivation cut over to compact Threshold Mandate and Breakthrough Proof ledger.
- Route buttons use Dao Mandate route adapter.
- No gameplay owner, content JSON, reward, combat, trial, prestige, or art changes are included.

Validation from live checkout:
- npm run typecheck: pass
- npm run check:icons: pass
- P4 contracts: pass, 6/6
- Focused Status/Cultivation/Dao Mandate regression batch: pass, 47/47
- npm run validate:content: pass
- npm run build: pass, with existing bundle-size/runtime asset warnings
- Browser smoke: pass; Status/Cultivation loaded, route buttons clicked, Guidance Oath density changed, no console errors
- npm run test:contracts: fail due unrelated existing World/Gate/Ruins expectations, not P4 files

Old public labels checked absent from active Status/Cultivation:
- Run Compass
- Biggest Shortfall
- Best Next Actions
- Recent Changes
- Mission / Missions

Security/guardrail scan:
- No unsafe HTML rendering added.
- No new RewardService/combat/trial/prestige/content mutation path added from P4 UI.
- One existing breakthrough() call remains in cultivation action controller; P4 only added Dao Mandate route handling.
