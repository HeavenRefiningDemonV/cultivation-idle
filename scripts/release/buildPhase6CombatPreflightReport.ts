import fs from 'node:fs';
import path from 'node:path';
import { getWorldModuleCardDefinition } from '../../src/systems/world/moduleCardRegistry.js';
import {
  OUTSKIRTS_BEST_USED_WHEN,
  OUTSKIRTS_BOUNDARY_LINE,
  OUTSKIRTS_ROLE_TAG,
  RUINS_BEST_USED_WHEN,
  RUINS_GOLD_SECONDARY_LINE,
  RUINS_ROLE_TAG,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { PHASE6_COMBAT_CAPTURE_SLOT_FILES, PHASE6_COMBAT_SURFACE_IDS } from '../../src/dev/phase6CombatAudit/phase6CombatSurfaceIds.js';
import { PHASE6_COMBAT_EVIDENCE_TARGETS } from '../../src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.js';

const PRE_FLIGHT_ROOT = 'docs/release/qa/ui-cutover/phase-6-combat-preflight';

type DriftCategory =
  | 'copy_parity_drift'
  | 'duplicate_truth_surface'
  | 'missing_truth_surface'
  | 'routing_ambiguity'
  | 'owner_ambiguity'
  | 'screenshot_gap';

interface SurfaceInventory {
  surfaceId: (typeof PHASE6_COMBAT_SURFACE_IDS)[number];
  screenTitle: string;
  roleTag: string | null;
  bestUsedWhen: string | null;
  boundaryLine: string | null;
  runCompassCompact: string;
  scenicOwnerDescription: string;
  sidePanelTruthSurfaces: string[];
  primaryCta: string;
  trackedBountyLine: string;
  aiPostureHint: string;
  deterministicAnchorVisibility: string;
  pityVisibility: string;
  minimumChecklistVisibility: string;
  recommendedChecklistVisibility: string;
  failSafeVisibility: string;
  diagnosisVisibility: string;
  adjacentRouteCues: string;
}

interface DriftFinding {
  surfaceId: (typeof PHASE6_COMBAT_SURFACE_IDS)[number];
  category: DriftCategory;
  summary: string;
  details: string;
}

interface PreflightReport {
  schemaVersion: 'phase-6-combat-preflight.v1';
  generatedAt: string;
  packetObjective: string;
  whyNow: string;
  dependencies: string[];
  fileTouchpoints: string[];
  preserveEnhanceDefer: {
    preserve: string[];
    enhance: string[];
    defer: string[];
  };
  noGoList: string[];
  ownershipMap: Record<string, string[]>;
  visibleTruthSurfaceInventory: SurfaceInventory[];
  parityTable: Array<{
    surfaceId: string;
    worldRoleTag: string;
    worldBestUsedWhen: string;
    panelRoleOrLead: string;
    panelBoundaryLine: string | null;
    worldCtaLabel: string;
    panelCtaLabel: string;
    staleOrContradictoryTerms: string | null;
    parityStatus: 'aligned' | 'drift';
  }>;
  duplicateConflictInventory: DriftFinding[];
  mustPreserve: Record<string, string[]>;
  screenshotCoverage: Array<{
    surfaceId: string;
    folder: string;
    requiredSlots: string[];
    presentSlots: string[];
    missingSlots: string[];
  }>;
  ownerFileMatrix: Array<{ surfaceId: string; files: string[] }>;
  recommendedNextPackets: string[];
}

function parseArgs(argv: string[]) {
  const json = argv.includes('--json');
  const write = argv.includes('--write');
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const rootDir = rootArg ? path.resolve(rootArg.slice('--root='.length)) : process.cwd();
  return { json, write, rootDir };
}

function computeCoverage(rootDir: string) {
  return PHASE6_COMBAT_EVIDENCE_TARGETS.map((target) => {
    const folder = path.resolve(rootDir, target.evidenceFolder);
    const presentSlots = PHASE6_COMBAT_CAPTURE_SLOT_FILES.filter((slot) => fs.existsSync(path.join(folder, slot)));
    return {
      surfaceId: target.id,
      folder: target.evidenceFolder,
      requiredSlots: [...PHASE6_COMBAT_CAPTURE_SLOT_FILES],
      presentSlots,
      missingSlots: PHASE6_COMBAT_CAPTURE_SLOT_FILES.filter((slot) => !presentSlots.includes(slot)),
    };
  });
}

export function buildPhase6CombatPreflightReport(rootDir: string): PreflightReport {
  const outskirtsWorld = getWorldModuleCardDefinition('outskirts');
  const ruinsWorld = getWorldModuleCardDefinition('ruins');
  const gateWorld = getWorldModuleCardDefinition('gateTrial');

  const visibleTruthSurfaceInventory: SurfaceInventory[] = [
    {
      surfaceId: 'outskirts',
      screenTitle: 'Outskirts',
      roleTag: OUTSKIRTS_ROLE_TAG,
      bestUsedWhen: OUTSKIRTS_BEST_USED_WHEN,
      boundaryLine: OUTSKIRTS_BOUNDARY_LINE,
      runCompassCompact: 'Present in summary column above OutskirtsSummaryCard',
      scenicOwnerDescription: 'Inside-dungeon WorldBuildingModal shell with InkCombatShell combat stage owner',
      sidePanelTruthSurfaces: ['OutskirtsSummaryCard', 'TrackedBountyProgressLine', 'Combat options block', 'Combat log excerpt'],
      primaryCta: 'Start / Stop',
      trackedBountyLine: 'Present when tracked bounty kind is OUTSKIRTS_KILL or OUTSKIRTS_BOSS_KILL',
      aiPostureHint: 'Present as OutskirtsSummaryCard hint line when posture fit emits warning/recommendation',
      deterministicAnchorVisibility: 'Not applicable for outskirts lane',
      pityVisibility: 'Not applicable for outskirts lane',
      minimumChecklistVisibility: 'Not applicable',
      recommendedChecklistVisibility: 'Not applicable',
      failSafeVisibility: 'Not applicable',
      diagnosisVisibility: 'Not applicable',
      adjacentRouteCues: 'RunCompassCompact action line + tracked bounty destination continuity',
    },
    {
      surfaceId: 'ruins',
      screenTitle: 'Ruins',
      roleTag: RUINS_ROLE_TAG,
      bestUsedWhen: RUINS_BEST_USED_WHEN,
      boundaryLine: RUINS_GOLD_SECONDARY_LINE,
      runCompassCompact: 'Present in summary column above RuinsSummaryCard',
      scenicOwnerDescription: 'Inside-dungeon WorldBuildingModal shell with RuinsSummaryCard + RuinsProgress split owner',
      sidePanelTruthSurfaces: ['RuinsSummaryCard', 'RuinsProgress room track', 'Ruins pity rail', 'TrackedBountyProgressLine'],
      primaryCta: 'Start / Stop (RuinsProgress controls)',
      trackedBountyLine: 'Present when tracked bounty kind is RUINS_ROOM_CLEAR or RUINS_RUN_CLEAR',
      aiPostureHint: 'No dedicated AI hint line in current ruins panel',
      deterministicAnchorVisibility: 'Explicit final chest anchor line in summary card',
      pityVisibility: 'Explicit rare pity line and progress bar in RuinsProgress',
      minimumChecklistVisibility: 'Not applicable',
      recommendedChecklistVisibility: 'Not applicable',
      failSafeVisibility: 'Not applicable',
      diagnosisVisibility: 'Not applicable',
      adjacentRouteCues: 'RunCompass action continuity + tracked bounty routing line',
    },
    {
      surfaceId: 'gate-trial',
      screenTitle: 'Gate Trial',
      roleTag: null,
      bestUsedWhen: null,
      boundaryLine: null,
      runCompassCompact: 'Not rendered in current gate panel; readiness card/checklists are primary truth block',
      scenicOwnerDescription: 'Inside-dungeon WorldBuildingModal shell with GateTrial InkCombatShell owner and readiness/diagnosis side stack',
      sidePanelTruthSurfaces: ['GateTrialAttemptCluster', 'GateTrialReadinessCard', 'GateTrialChecklist (minimum/recommended)', 'GateTrialSafetyNetCard', 'GateTrialTopFixes/PostFailureDiagnosisPanel'],
      primaryCta: 'Attempt cluster primary action (Challenge / Break Through), optional Stop / Buy Safety Net',
      trackedBountyLine: 'No tracked bounty line in gate panel',
      aiPostureHint: 'Indirect via top fixes and combat options section; no dedicated posture hint row',
      deterministicAnchorVisibility: 'Gate reward label shown in readiness card',
      pityVisibility: 'No pity system in gate panel',
      minimumChecklistVisibility: 'Visible in GateTrialChecklist "Minimum Floor"',
      recommendedChecklistVisibility: 'Visible in GateTrialChecklist "Recommended Floor"',
      failSafeVisibility: 'Visible in GateTrialSafetyNetCard and attempt controls',
      diagnosisVisibility: 'Visible through GateTrialTopFixes/PostFailureDiagnosisPanel integration',
      adjacentRouteCues: 'Top fixes can route to prep systems through action handlers',
    },
  ];

  const parityTable = [
    {
      surfaceId: 'outskirts',
      worldRoleTag: outskirtsWorld.roleTag,
      worldBestUsedWhen: outskirtsWorld.bestUsedWhen,
      panelRoleOrLead: OUTSKIRTS_ROLE_TAG,
      panelBoundaryLine: OUTSKIRTS_BOUNDARY_LINE,
      worldCtaLabel: outskirtsWorld.ctaLabel,
      panelCtaLabel: 'Start',
      staleOrContradictoryTerms: null,
      parityStatus: outskirtsWorld.roleTag === OUTSKIRTS_ROLE_TAG && outskirtsWorld.bestUsedWhen === OUTSKIRTS_BEST_USED_WHEN ? 'aligned' : 'drift',
    },
    {
      surfaceId: 'ruins',
      worldRoleTag: ruinsWorld.roleTag,
      worldBestUsedWhen: ruinsWorld.bestUsedWhen,
      panelRoleOrLead: RUINS_ROLE_TAG,
      panelBoundaryLine: RUINS_GOLD_SECONDARY_LINE,
      worldCtaLabel: ruinsWorld.ctaLabel,
      panelCtaLabel: 'Start',
      staleOrContradictoryTerms: null,
      parityStatus: ruinsWorld.roleTag === RUINS_ROLE_TAG && ruinsWorld.bestUsedWhen === RUINS_BEST_USED_WHEN ? 'aligned' : 'drift',
    },
    {
      surfaceId: 'gate-trial',
      worldRoleTag: gateWorld.roleTag,
      worldBestUsedWhen: gateWorld.bestUsedWhen,
      panelRoleOrLead: 'Gate state + readiness detail (no explicit role tag)',
      panelBoundaryLine: null,
      worldCtaLabel: gateWorld.ctaLabel,
      panelCtaLabel: 'Challenge Trial / Break Through (state-driven)',
      staleOrContradictoryTerms: 'World card uses static role tag while panel leads with stateful readiness + diagnosis language.',
      parityStatus: 'drift',
    },
  ] as const;

  const screenshotCoverage = computeCoverage(rootDir);

  const duplicateConflictInventory: DriftFinding[] = [
    {
      surfaceId: 'gate-trial',
      category: 'copy_parity_drift',
      summary: 'World card role-tag/best-used copy does not appear as a stable role block inside panel.',
      details: 'Panel prioritizes readiness, checklists, fail-safe, and diagnosis truth clusters instead of repeating world card role tagline.',
    },
    {
      surfaceId: 'outskirts',
      category: 'duplicate_truth_surface',
      summary: 'Combat options appear in multiple places (shell controls and summary/context).',
      details: 'Audit-only note for future shell convergence packet; preserve current redundancy for now.',
    },
    {
      surfaceId: 'gate-trial',
      category: 'routing_ambiguity',
      summary: 'Top-fix action handlers can route to different systems without explicit route map in panel copy.',
      details: 'Routing remains functional but implicit; document before handoff normalization packet.',
    },
    ...screenshotCoverage
      .flatMap((entry) => entry.missingSlots.map((slot) => ({ entry, slot })))
      .map(({ entry, slot }) => ({
        surfaceId: entry.surfaceId as (typeof PHASE6_COMBAT_SURFACE_IDS)[number],
        category: 'screenshot_gap' as const,
        summary: `Missing required screenshot slot ${slot}.`,
        details: `Capture slot ${slot} is missing in ${entry.folder}.`,
      })),
  ];

  return {
    schemaVersion: 'phase-6-combat-preflight.v1',
    generatedAt: new Date().toISOString(),
    packetObjective: 'Freeze pre-redesign combat-trio truth (Outskirts/Ruins/Gate Trial) with deterministic screenshots and parity/conflict audit artifacts.',
    whyNow: 'Phase 6 visual packets depend on a preserve-first baseline that prevents role/copy/routing drift from being masked by shell work.',
    dependencies: [
      'phase0CoreAudit capture + validation pipeline patterns',
      'sectionCAudit harness lifecycle patterns',
      'existing world module routing + world building modal ownership',
    ],
    fileTouchpoints: [
      'src/dev/phase6CombatAudit/*',
      'scripts/release/capturePhase6CombatEvidence.ts',
      'scripts/release/validatePhase6CombatEvidence.ts',
      'scripts/release/buildPhase6CombatPreflightReport.ts',
      'docs/release/qa/ui-cutover/phase-6-combat-preflight/*',
      'src/components/GameLayout.tsx',
    ],
    preserveEnhanceDefer: {
      preserve: [
        'Current combat-path scenic owners and panel truth blocks',
        'World shell routing into Outskirts, Ruins, and Gate Trial',
        'Current CTA/action semantics and readiness logic',
      ],
      enhance: [
        'Deterministic screenshot harness coverage and evidence validation',
        'Audit-level parity/conflict reporting for world-to-panel copy and ownership',
      ],
      defer: [
        'P6.0B shared combat-shell convergence',
        'P6.0C world-to-combat handoff normalization',
        '6.1/6.2/6.3 per-surface visual refinement',
      ],
    },
    noGoList: [
      'No redesign/restyle of combat trio surfaces',
      'No reward/balance/readiness rule mutation',
      'No world module ordering changes',
      'No shell refactor crossing packet scope',
    ],
    ownershipMap: {
      outskirts: [
        'src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx',
        'src/ui/world/OutskirtsSummaryCard.tsx',
        'src/ui/world/TrackedBountyProgressLine.tsx',
        'src/ui/status/RunCompassCompact.tsx',
        'src/components/screens/world/buildings/CombatStyles.scss',
      ],
      ruins: [
        'src/components/screens/world/buildings/RuinsBuildingPanel.tsx',
        'src/ui/world/RuinsSummaryCard.tsx',
        'src/features/ruins/ui/RuinsProgress.tsx',
        'src/ui/world/TrackedBountyProgressLine.tsx',
        'src/ui/status/RunCompassCompact.tsx',
        'src/components/screens/world/buildings/CombatStyles.scss',
      ],
      'gate-trial': [
        'src/components/screens/world/buildings/GateTrialBuildingPanel.tsx',
        'src/ui/trials/GateTrialReadinessCard.tsx',
        'src/ui/trials/GateTrialChecklist.tsx',
        'src/ui/trials/GateTrialSafetyNetCard.tsx',
        'src/ui/trials/GateTrialTopFixes.tsx',
        'src/ui/status/PostFailureDiagnosisPanel.tsx',
        'src/components/screens/world/buildings/CombatStyles.scss',
      ],
    },
    visibleTruthSurfaceInventory,
    parityTable: parityTable.map((entry) => ({ ...entry })),
    duplicateConflictInventory,
    mustPreserve: {
      outskirts: ['HP bars + active enemy in interaction state', 'Outskirts role/best-used/boundary copy lines', 'Tracked bounty and AI hint affordances'],
      ruins: ['Ruins lead-material + anchor + pity truth set', 'Run state + auto-repeat truth and room track', 'Gold-secondary boundary framing'],
      'gate-trial': ['Readiness card + minimum/recommended checklists', 'Fail-safe progress and support reserve lines', 'Post-failure diagnosis + top fixes integration'],
    },
    screenshotCoverage,
    ownerFileMatrix: Object.entries({
      outskirts: ['moduleCardRegistry.ts', 'OutskirtsBuildingPanel.tsx', 'OutskirtsSummaryCard.tsx', 'TrackedBountyProgressLine.tsx'],
      ruins: ['moduleCardRegistry.ts', 'RuinsBuildingPanel.tsx', 'RuinsSummaryCard.tsx', 'RuinsProgress.tsx'],
      'gate-trial': ['moduleCardRegistry.ts', 'GateTrialBuildingPanel.tsx', 'GateTrialReadinessCard.tsx', 'GateTrialTopFixes.tsx'],
    }).map(([surfaceId, files]) => ({
      surfaceId,
      files,
    })),
    recommendedNextPackets: [
      'P6.0B shared combat-shell convergence',
      'P6.0C World-to-combat handoff normalization',
      '6.1 Outskirts',
      '6.2 Ruins',
      '6.3 Gate Trial',
    ],
  };
}

function toMarkdown(report: PreflightReport): string {
  const lines: string[] = [];
  lines.push('# Phase 6 Combat Preflight Report');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Packet objective: ${report.packetObjective}`);
  lines.push(`- Why now: ${report.whyNow}`);
  lines.push('');
  lines.push('## Dependencies');
  report.dependencies.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## File touchpoints');
  report.fileTouchpoints.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Preserve / enhance / defer summary');
  lines.push('### Preserve');
  report.preserveEnhanceDefer.preserve.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('### Enhance');
  report.preserveEnhanceDefer.enhance.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('### Defer');
  report.preserveEnhanceDefer.defer.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## No-go list');
  report.noGoList.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  lines.push('## Summary of detected parity conflicts');
  report.duplicateConflictInventory.forEach((entry) => lines.push(`- [${entry.category}] ${entry.surfaceId}: ${entry.summary} (${entry.details})`));
  lines.push('');
  lines.push('## Summary of screenshot coverage');
  report.screenshotCoverage.forEach((entry) => {
    lines.push(`- ${entry.surfaceId}: ${entry.presentSlots.length}/${entry.requiredSlots.length} present`);
    if (entry.missingSlots.length > 0) {
      lines.push(`  - Missing: ${entry.missingSlots.join(', ')}`);
    }
  });
  lines.push('');
  lines.push('## World-to-panel copy parity table');
  lines.push('| Surface | World roleTag | World bestUsedWhen | Panel role/lead | Boundary | World CTA | Panel CTA | Status |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  report.parityTable.forEach((entry) => {
    lines.push(`| ${entry.surfaceId} | ${entry.worldRoleTag} | ${entry.worldBestUsedWhen} | ${entry.panelRoleOrLead} | ${entry.panelBoundaryLine ?? '—'} | ${entry.worldCtaLabel} | ${entry.panelCtaLabel} | ${entry.parityStatus} |`);
  });
  lines.push('');
  lines.push('## Owner-file matrix');
  report.ownerFileMatrix.forEach((entry) => {
    lines.push(`### ${entry.surfaceId}`);
    entry.files.forEach((file) => lines.push(`- ${file}`));
  });
  lines.push('');
  lines.push('## Recommended next packets');
  report.recommendedNextPackets.forEach((entry) => lines.push(`- ${entry}`));
  lines.push('');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { json, write, rootDir } = parseArgs(process.argv.slice(2));
  const report = buildPhase6CombatPreflightReport(rootDir);
  if (write) {
    const root = path.resolve(rootDir, PRE_FLIGHT_ROOT);
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'phase6CombatPreflightReport.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(root, 'phase6CombatPreflightReport.md'), `${toMarkdown(report)}\n`);
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(toMarkdown(report));
  }
}
