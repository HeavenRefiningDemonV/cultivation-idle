import type { DriftCategory, DriftIssue } from '../../../src/systems/progression/diagnostics/index.js';
import type { RawProgressionContentLike, ProgressionContract } from '../../../src/systems/progression/contract/index.js';
import type { MigrationFixtureLike } from '../../../src/systems/progression/validation/index.js';
import type { ProgressionScenario } from '../../helpers/progression/index.js';

export type FixtureKind = 'fresh_save' | 'gate_edge' | 'prestige_ready' | 'cap_reached' | 'legacy_save';
export type FixtureSourceType = 'contract_derived' | 'handcrafted' | 'migrated_legacy' | 'save_snapshot' | 'scenario_projection';
export type FixtureValidationStatus = 'clean' | 'warning';
export type FixturePacketId = '0.3B' | '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6' | '1.7' | '1.8';
export type FixtureTag = 'baseline' | 'gate' | 'city' | 'prestige' | 'reset' | 'offline' | 'migration' | 'cap' | 'legacy' | 'path';

export interface FixtureAdapterAvailability {
  contractScenario: boolean;
  saveShape: boolean;
  migrationFixture: boolean;
}

export interface ProgressionFixtureMetadata {
  id: string;
  name: string;
  description: string;
  kind: FixtureKind;
  sourceType: FixtureSourceType;
  ownerPacket: FixturePacketId;
  intendedConsumerPackets: FixturePacketId[];
  isLegacy: boolean;
  expectedValidationStatus: FixtureValidationStatus;
  expectedIssueCategories: DriftCategory[];
  expectedWarningCategories: DriftCategory[];
  contractRealmIds: string[];
  transitionIds: string[];
  cityIds: string[];
  tags: FixtureTag[];
  adapterAvailability: FixtureAdapterAvailability;
  notes: string[];
}

export interface FixtureBuildContext {
  contract: ProgressionContract;
  rawContent: RawProgressionContentLike;
}

export interface FixtureBuildResult {
  scenario?: ProgressionScenario;
  saveShape?: Record<string, unknown>;
  migrationFixture?: MigrationFixtureLike;
  runtimeFileTextByPath?: Record<string, string>;
}

export interface ProgressionFixtureDefinition {
  metadata: ProgressionFixtureMetadata;
  build: (context: FixtureBuildContext) => Promise<FixtureBuildResult> | FixtureBuildResult;
}

export interface BuiltProgressionFixture {
  metadata: ProgressionFixtureMetadata;
  scenario: ProgressionScenario | null;
  saveShape: Record<string, unknown> | null;
  migrationFixture: MigrationFixtureLike | null;
  runtimeFileTextByPath: Record<string, string>;
  validationIssues: DriftIssue[];
}
