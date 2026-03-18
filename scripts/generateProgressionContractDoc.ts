import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  adaptProgressionAuthoredContent,
  buildProgressionContract,
  type RawProgressionContentLike,
} from '../src/systems/progression/contract/index.js';
import { DRIFT_OWNER_PACKET } from '../src/systems/progression/diagnostics/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const OUTPUT = path.resolve(process.cwd(), 'docs', 'progression-contract.md');

const FILES = {
  economy: 'economy.json',
  cities: 'cities.json',
  items: 'items.json',
  techniques: 'techniques.json',
  pavilions: 'pavilions.json',
  outskirts: 'outskirts.json',
  enemies: 'enemies.json',
  trials: 'trials.json',
  ruins: 'ruins.json',
  alchemy_recipes: 'alchemy_recipes.json',
  forge_blueprints: 'forge_blueprints.json',
  runes: 'runes.json',
  talisman_recipes: 'talisman_recipes.json',
  apothecary_shops: 'apothecary_shops.json',
  expeditions: 'expeditions.json',
  bounties: 'bounties.json',
  heart_laws: 'heart_laws.json',
  prestige_store: 'prestige_store.json',
};

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

const loadContract = async () => {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  const loaded = Object.fromEntries(entries) as unknown as RawProgressionContentLike;
  return buildProgressionContract(adaptProgressionAuthoredContent(loaded));
};


async function run(): Promise<void> {
  const contract = await loadContract();
  const transitionRows = contract.gateTransitions
    .map((transition) => {
      const nextCity = contract.cityUnlocks.find((city) => city.unlockOnRealmEntry === transition.toRealmId)?.cityId ?? 'content_cap';
      return `| ${transition.fromRealmId} | ${transition.toRealmId} | ${transition.trialId} | ${transition.gateItemId} | ${nextCity} |`;
    })
    .join('\n');

  const cityRows = contract.cityUnlocks.map((city) => `| ${city.cityId} | ${city.unlockOnRealmEntry} |`).join('\n');
  const deferredRows = contract.deferredSystems.map((system) => `| ${system} | deferred |`).join('\n');

  const diagnosticsRows = Object.entries(DRIFT_OWNER_PACKET)
    .map(([category, packet]) => `| ${category} | ${packet} |`)
    .join('\n');

  const markdown = `# Progression Contract (Section 0 / Packet 0.1)

> This document mirrors executable contract data generated from \`src/systems/progression/contract\`.
>
> Packet 0.1 defines infrastructure only; it does **not** apply gameplay behavior fixes yet.
>
> Later packets must consume the shared contract and must not recreate local progression truths.

## 1) Purpose of the progression contract

Provide one canonical, typed progression truth for semester-slice live content, gate transitions, city unlocks, deferred systems, offline behavior contract, and reset/prestige hook seams.

## 2) Semester slice summary

- Slice ID: ${contract.semesterSlice.id}
- Label: ${contract.semesterSlice.label}
- Live realms: ${contract.semesterSlice.liveMajorRealms.join(', ')}
- Live trials: ${contract.semesterSlice.liveTrialIds.join(', ')}
- Live cities: ${contract.semesterSlice.liveCityIds.join(', ')}

## 3) Live major realms table

| Realm ID | Index |
|---|---:|
${contract.semesterSlice.liveMajorRealms.map((realm) => `| ${realm} | ${contract.majorRealms[realm].index} |`).join('\n')}

## 4) Transition table

| From realm | To realm | Trial | Gate item | Next city unlock or cap |
|---|---|---|---|---|
${transitionRows}

## 5) City unlock table

| City ID | Unlock on realm entry |
|---|---|
${cityRows}

## 6) Content-cap definition

- Cap realm: ${contract.contentCap.realmId}
- Cap state: ${contract.contentCap.state}
- Expected in-slice behavior: no implied future city/gate unlock beyond this cap.

## 7) Deferred/live systems table

| System/module | Status |
|---|---|
${deferredRows}

## 8) Offline contract summary

- Pipeline ID: ${contract.offline.pipelineId}
- Applies to: ${contract.offline.appliesTo.join(', ')}
- Excludes: ${contract.offline.excludes.join(', ')}
- Max catch-up seconds: ${contract.offline.maxCatchupSeconds}
- Efficiency model: ${contract.offline.efficiencyModel}

## 9) Reset / prestige hook summary

- Path truth canonical field: ${contract.pathTruth.canonicalField}
- Path legacy aliases: ${contract.pathTruth.legacyAliases.join(', ')}
- Reset classifier buckets: per_life / permanent / hybrid / unknown
- Prestige classifier buckets: live / deferred / unknown (contract seam)
- Packet 1.6 runtime honesty overlay: visible_live / hidden_unsupported / deferred / unknown

## 10) Diagnostics categories and packet ownership

| Drift category | Owner packet |
|---|---|
${diagnosticsRows}

## 11) Test harness overview

- Scenario builders: \`tests/helpers/progression/\`
- Integration skeleton suites: \`tests/integration/\`
- Harness smoke test: \`tests/contracts/progressionHarnessSmoke.test.ts\`
- 0.1A diagnostics/report: \`npm run progression:report\`

## 12) Future packet ownership map

- **0.2**: save/alias migration activation using legacy scenario fixtures.
- **0.3**: validator expansion to enforce contract truth across all content surfaces.
- **1.1**: contract ingestion foundations in runtime adapters.
- **1.2**: path truth unification (life-start path as mechanical truth).
- **1.3**: gate entry/reward/consumption truth unification.
- **1.4**: gate flow hardening around trial-to-breakthrough lifecycle.
- **1.5**: city unlock timing unified to realm entry.
- **1.6**: prestige tree honesty pass, hidden/deferred prestige cleanup, and runtime-consumed effect alignment.
- **1.7**: prestige/reset orchestration and per-life/permanent/hybrid enforcement.
- **1.8**: offline pipeline unification to one contract pipeline.
`;

  await fs.writeFile(OUTPUT, markdown, 'utf8');
  console.log(`[ProgressionDoc] Wrote ${path.relative(process.cwd(), OUTPUT)}`);
}

run().catch((error) => {
  console.error('[ProgressionDoc] Failed');
  console.error(error);
  process.exit(1);
});
