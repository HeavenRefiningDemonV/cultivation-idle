# System Completeness Matrix

| System | Visible? | Content authored? | Runtime wired? | Reachable? | Has rewards? | Has sinks? | Has tests? | Resets correctly? | UI explains role? | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Life start | Yes | Yes | Yes | Yes | N/A | N/A | Partial | Prestige reset reopens in focused tests | Partial | Usable but first-run truth issue |
| Path selection | Yes | Yes | Yes | Yes | modifiers | N/A | Yes | Yes | Yes | Mostly fixed |
| Spirit root | Yes | Yes | Yes | Yes | modifiers | N/A | Partial | likely reset/reinit | Yes | Needs deeper save/prestige QA |
| Heart Law | Yes | Yes | Yes | Yes | modifiers | AP tier unlocks | Partial | likely reset/rederive | Partial | UX/confirmation friction |
| Cultivation / Qi | Yes | constants/runtime | Yes | Yes | Qi | breakthrough costs | Yes | Partial | Yes | Live before identity completion |
| Breakthrough | Yes | realm/gate contract | Yes | Partially | realm/city progress | Qi/gate items | Yes | Partial | Yes | Browser full path unverified |
| Focus modes | Yes | Yes | Yes | Yes | modifiers | N/A | Partial | Yes | Yes | Needs formula/browser proof |
| Manual Pavilion | Yes in nav/module | Yes | likely | Not browser-verified | manuals | gold/fragments | Partial | reset service calls hard reset | Unknown | Needs runtime smoke |
| Manual study | Yes | Yes | likely | Not browser-verified | techniques | time/resources | Partial | reset service hard reset | Unknown | Needs runtime smoke |
| Techniques/loadouts/AI | Yes | Yes | likely | Partial | combat power | slots/mastery | Partial | reset service hard reset | Status warns | Needs runtime smoke |
| Combat core | Yes | enemies/trials | Yes | Partial | rewards | prep resources | Yes | reset service resets combat | Partial | Needs live state QA |
| Outskirts | Authored/module | Yes | likely | Not browser-verified | gold/materials | prep loops | Partial | reset service hard reset | Unknown | Needs exact screen smoke |
| Gate Trials | Authored/module | Yes | Yes | Static/focused verified | gate items | prep/fail-safe | Partial failing | reset service hard reset | Yes | Lifecycle tests/browser state incomplete |
| Ruins | Authored/module | Yes | likely | Not browser-verified | support rewards | time/prep | Partial | reset service hard reset | Unknown | Needs reachability proof |
| Medicine pouch | Yes in Status | Yes | likely | Not browser-verified | survivability | pills/slots | Partial | reset service? | Partial | Needs combat proof |
| Apothecary/pills | Authored/module | Yes | likely | Not browser-verified | pills | herbs/gold | Partial | reset via stores | Status routes to it | Needs runtime smoke |
| Forge/equipment | Authored/module | Yes | likely | Not browser-verified | stats/readiness | materials/gold | Partial | reset service hard reset | Status recommends | Needs runtime smoke |
| Bounties/Merit | Authored/module | Yes | likely | Not browser-verified | merit/rewards | merit sinks | Partial | reset service hard reset | Partial | Needs runtime smoke |
| Expeditions | Authored/module | Yes | Yes | Not browser-verified | materials | slots/time | Offline report partial | active reset in prestige | Partial | Needs runtime smoke |
| Inventory/equipment | Yes | items authored | Yes | Yes | items | sinks | Partial | reset service resets | Unknown | Needs screen smoke |
| Shops | likely | content likely | likely | Not browser-verified | purchases | currencies | Unknown | reset unknown | Unknown | Needs audit |
| Offline catchup | Yes | tuning | Yes | Yes | Qi/queues/expeditions | time cap | Yes | Partial | Yes | One live path, legacy wrappers |
| Save/load | Yes | schema | Yes | Yes | N/A | N/A | Partial | migration warnings visible | Partial | Needs corrupted/active-state tests |
| Prestige/AP | Yes | 27 upgrades | Yes/partial | Route unverified | AP/effects | AP spend | Yes partial | focused reset pass | Partial | Timing unverified |
| City unlocks | Yes | 5 cities | Yes | Contract verified | modules | N/A | Yes | reset reinitializes city 1 | Partial | Route/cap mismatch remains |
| Notifications/toasts | Yes | N/A | Yes | Yes | feedback | N/A | Unknown | UI/session | Yes | Copy has encoding bullet issue |
| Settings | Yes | N/A | likely | Yes | N/A | N/A | Unknown | permanent | Unknown | Needs screen-specific QA |
| Records/run history | Yes | N/A | likely | Not verified | run history | N/A | Unknown | prestige-linked | Unknown | Needs smoke |
