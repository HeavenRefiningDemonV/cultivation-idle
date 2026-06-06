import assert from 'node:assert/strict';
import test from 'node:test';

import { useCityStore } from '../../src/stores/cityStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { performStatusRouteTarget } from '../../src/systems/ui/status/statusRouteActions.js';
import type {
  StatusLedgerActionSurface,
  StatusLedgerSurfaceV1,
} from '../../src/systems/ui/status/statusLedgerTypes.js';

type CurrentStateBlockState = 'healthy' | 'attention' | 'danger' | 'locked' | 'unknown';
type CauseSeverity = 'healthy' | 'info' | 'warning' | 'danger' | 'blocked';

interface CauseRowContract {
  id: string;
  severity: CauseSeverity;
  label: string;
  value: string;
  consequence: string;
  primaryFix: StatusLedgerActionSurface | null;
  detail: string;
}

interface CurrentStateBlockContract {
  id: string;
  title: string;
  valueLabel: string;
  state: CurrentStateBlockState;
  consequence: string;
  route: StatusLedgerActionSurface | null;
  detailRows: CauseRowContract[];
}

interface StatusCurrentStateContract {
  version: 'status-current-state-v1';
  rootTestId: 'status-current-state';
  blocks: {
    cultivation: CurrentStateBlockContract;
    daoHeart: CurrentStateBlockContract;
    spiritRoot: CurrentStateBlockContract & {
      observationRoute: 'status-root-observation';
    };
    training: CurrentStateBlockContract;
    buildPrep: CurrentStateBlockContract;
    activeWork: CurrentStateBlockContract;
  };
  nextBottleneck: {
    primary: StatusLedgerActionSurface;
    secondary: StatusLedgerActionSurface[];
    detailRows: CauseRowContract[];
  };
  sharedCauseRows: CauseRowContract[];
  buffDebuffRows: CauseRowContract[];
}

function currentStateFrom(ledger: StatusLedgerSurfaceV1): StatusCurrentStateContract {
  const maybeCurrentState = (ledger as unknown as { currentState?: StatusCurrentStateContract }).currentState;
  assert.ok(maybeCurrentState, 'Status Ledger should expose MP5 currentState.');
  return maybeCurrentState;
}

function expectBlock(block: CurrentStateBlockContract, label: string) {
  assert.equal(typeof block.id, 'string', `${label}.id should be stable.`);
  assert.equal(block.id.trim().length > 0, true, `${label}.id should be non-empty.`);
  assert.equal(typeof block.title, 'string', `${label}.title should be visible.`);
  assert.equal(block.title.trim().length > 0, true, `${label}.title should be non-empty.`);
  assert.equal(typeof block.valueLabel, 'string', `${label}.valueLabel should answer current value.`);
  assert.equal(block.valueLabel.trim().length > 0, true, `${label}.valueLabel should be non-empty.`);
  assert.match(block.state, /^(healthy|attention|danger|locked|unknown)$/);
  assert.equal(typeof block.consequence, 'string', `${label}.consequence should explain impact.`);
  assert.equal(block.consequence.trim().length > 0, true, `${label}.consequence should be non-empty.`);
  assert.ok(block.route, `${label}.route should route or explain availability.`);
  assert.equal(Array.isArray(block.detailRows), true, `${label}.detailRows should be an array.`);
  assert.ok(block.detailRows.length > 0, `${label}.detailRows should include How calculated rows.`);
}

test('Status Ledger exposes MP5 Current State blocks, cause rows, and route authority', () => {
  useCityStore.setState({
    currentCityId: 'city_pinewind_hamlet',
    unlockedCityIds: ['city_pinewind_hamlet'],
  });
  const ledger = buildStatusDashboardSurface(111).statusLedger;
  const currentState = currentStateFrom(ledger);

  assert.equal(currentState.version, 'status-current-state-v1');
  assert.equal(currentState.rootTestId, 'status-current-state');

  for (const key of ['cultivation', 'daoHeart', 'spiritRoot', 'training', 'buildPrep', 'activeWork'] as const) {
    expectBlock(currentState.blocks[key], key);
  }

  assert.equal(currentState.blocks.cultivation.route?.target.kind, 'tab');
  assert.equal(
    currentState.blocks.cultivation.route?.target.kind === 'tab'
      ? currentState.blocks.cultivation.route.target.tab
      : null,
    'cultivation',
  );
  assert.equal(currentState.blocks.daoHeart.route?.target.kind, 'dao_heart_sanctuary');
  assert.equal(currentState.blocks.spiritRoot.observationRoute, 'status-root-observation');
  assert.equal(currentState.blocks.spiritRoot.route?.target.kind, 'status_observation');
  assert.equal(currentState.blocks.training.route?.target.kind, 'world_module');
  assert.equal(
    currentState.blocks.training.route?.target.kind === 'world_module'
      ? currentState.blocks.training.route.target.moduleKey
      : null,
    'trainingHall',
  );

  assert.ok(currentState.nextBottleneck.primary, 'Next Bottleneck should expose one primary fix.');
  assert.ok(
    currentState.nextBottleneck.secondary.length <= 3,
    'Next Bottleneck should keep secondary fixes bounded.',
  );

  const sharedIds = new Set(currentState.sharedCauseRows.map((row) => row.id));
  assert.ok(sharedIds.has('heart_law_parity'), 'shared cause rows should include Heart Law parity.');
  assert.ok(sharedIds.has('root_law_fit'), 'shared cause rows should include root/law fit.');
  assert.ok(sharedIds.has('training_fatigue'), 'shared cause rows should include Training fatigue.');

  const heartLawParityValue = currentState.sharedCauseRows.find((row) => row.id === 'heart_law_parity')?.value;
  assert.ok(heartLawParityValue, 'Heart Law parity should expose a value.');
  assert.equal(
    currentState.blocks.daoHeart.detailRows.some((row) => row.id === 'heart_law_parity' && row.value === heartLawParityValue),
    true,
    'Dao Heart block should share the Heart Law parity value.',
  );
  assert.equal(
    currentState.blocks.cultivation.detailRows.some((row) => row.id === 'heart_law_parity' && row.value === heartLawParityValue),
    true,
    'Cultivation block should share the Heart Law parity value.',
  );

  const trainingCopy = [
    currentState.blocks.training.valueLabel,
    currentState.blocks.training.consequence,
    ...currentState.blocks.training.detailRows.flatMap((row) => [row.label, row.value, row.consequence, row.detail]),
  ].join(' ');
  assert.doesNotMatch(
    trainingCopy,
    /\b0\s*(failure|rating|stat|locked)\b/i,
    'Locked future Training stats should not render as zero failure rows.',
  );

  const priorityIds = currentState.buffDebuffRows.map((row) => row.id);
  assert.ok(
    priorityIds.indexOf('foreground_gain') === -1 ||
      priorityIds.indexOf('breakthrough_risk') === -1 ||
      priorityIds.indexOf('foreground_gain') < priorityIds.indexOf('breakthrough_risk'),
    'Foreground gain rows should keep higher display priority than breakthrough risk rows.',
  );
});

test('Status route authority can open Dao Heart Sanctuary from outside Cultivation', () => {
  useUIStore.setState({
    activeTab: 'status',
    daoHeartModalOpen: false,
    daoHeartModalInitialTab: 'heartLaw',
  } as Partial<ReturnType<typeof useUIStore.getState>>);

  const result = performStatusRouteTarget({
    kind: 'dao_heart_sanctuary',
    tab: 'sanctuary',
  } as unknown as Parameters<typeof performStatusRouteTarget>[0]);

  const ui = useUIStore.getState() as ReturnType<typeof useUIStore.getState> & {
    daoHeartModalOpen?: boolean;
    daoHeartModalInitialTab?: string;
  };

  assert.equal(result.performed, true);
  assert.equal(ui.activeTab, 'cultivation');
  assert.equal(ui.daoHeartModalOpen, true);
  assert.equal(ui.daoHeartModalInitialTab, 'sanctuary');
});
