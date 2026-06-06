import type {
  StatusLedgerActionSurface,
  StatusLedgerSurfaceV1,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { StatusDetailsDrawer } from './StatusDetailsDrawer.js';
import { StatusBuildPreparationPanel } from './StatusBuildPreparationPanel.js';
import { StatusCurrentStatePanel } from './StatusCurrentStatePanel.js';
import { StatusCurrentWorkPanel } from './StatusCurrentWorkPanel.js';
import { StatusIdentityDoctrinePanel } from './StatusIdentityDoctrinePanel.js';
import { StatusLedgerCard } from './StatusLedgerCard.js';
import { StatusLedgerHero } from './StatusLedgerHero.js';
import {
  StatusActionRows,
  StatusFactRows,
  StatusMilestoneTrack,
  StatusRequirementRows,
} from './StatusLedgerRows.js';
import { StatusMetricStrip } from './StatusMetricStrip.js';
import './StatusLedgerPage.scss';

const CARD_LABELS = {
  milestone: 'Milestone',
  cultivationBase: 'Cultivation Base',
  missionRequirements: 'Mission Requirements',
  bestImprovements: 'Best Improvements',
  safetyNet: 'Safety Net',
  identityDoctrine: 'Identity & Doctrine',
  currentWork: 'Current Work',
  buildPreparation: 'Build & Preparation',
  recentChanges: 'Recent Changes',
  details: 'How calculated',
  nextMajorGoal: 'Next Major Goal',
  mainBottleneck: 'Main Bottleneck',
} as const;

interface StatusLedgerPageProps {
  surface: StatusLedgerSurfaceV1;
  onAction: (action: StatusLedgerActionSurface) => void;
}

function MilestoneCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.milestone.title || CARD_LABELS.milestone}
      modifier="milestone"
      icon="taskComplete"
      subtitle={surface.milestone.readinessLabel}
      testId="status-ledger-card-milestone"
    >
      <p className={`statusLedgerCard__lead statusLedgerCard__lead--${surface.milestone.tone}`}>
        {surface.milestone.detail}
      </p>
      <StatusMilestoneTrack nodes={surface.milestone.nodes} />
      <StatusFactRows rows={surface.milestone.rows} onAction={onAction} compact />
    </StatusLedgerCard>
  );
}

function CultivationBaseCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.cultivationBase.title || CARD_LABELS.cultivationBase}
      modifier="cultivation-base"
      icon="inkSwirl"
      testId="status-ledger-card-cultivation-base"
    >
      <StatusFactRows rows={surface.cultivationBase.rows} onAction={onAction} />
    </StatusLedgerCard>
  );
}

function MissionRequirementsCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.missionRequirements.title || CARD_LABELS.missionRequirements}
      modifier="mission-requirements"
      icon="inkShield"
      testId="status-ledger-card-mission-requirements"
    >
      <StatusRequirementRows
        rows={surface.missionRequirements.rows}
        emptyState={surface.missionRequirements.emptyState}
        onAction={onAction}
      />
    </StatusLedgerCard>
  );
}

function BestImprovementsCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.bestImprovements.title || CARD_LABELS.bestImprovements}
      modifier="best-improvements"
      icon="inkSparkles"
      testId="status-ledger-card-best-improvements"
    >
      <StatusActionRows
        primary={surface.bestImprovements.primary}
        rows={surface.bestImprovements.rows}
        emptyState={surface.bestImprovements.emptyState}
        onAction={onAction}
      />
    </StatusLedgerCard>
  );
}

function SafetyNetCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.safetyNet.title || CARD_LABELS.safetyNet}
      modifier="safety-net"
      icon="inkHeart"
      testId="status-ledger-card-safety-net"
    >
      <StatusFactRows rows={surface.safetyNet.rows} onAction={onAction} />
      {surface.safetyNet.action ? (
        <StatusActionRows rows={[surface.safetyNet.action]} onAction={onAction} />
      ) : null}
    </StatusLedgerCard>
  );
}

function IdentityDoctrineCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.identityDoctrine.title || CARD_LABELS.identityDoctrine}
      modifier="identity-doctrine"
      icon="bookHeaven"
      subtitle={`${surface.identityDoctrine.spiritRoot.elementLabel} - ${surface.identityDoctrine.spiritRoot.gradeLabel}`}
      testId="status-ledger-card-identity-doctrine"
    >
      <StatusIdentityDoctrinePanel identity={surface.identityDoctrine} onAction={onAction} />
    </StatusLedgerCard>
  );
}

function CurrentWorkCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.currentWork.title || CARD_LABELS.currentWork}
      modifier="current-work"
      icon="hourglassProgress"
      testId="status-ledger-card-current-work"
    >
      <StatusCurrentWorkPanel currentWork={surface.currentWork} onAction={onAction} />
    </StatusLedgerCard>
  );
}

function BuildPreparationCard({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <StatusLedgerCard
      title={surface.buildPreparation.title || CARD_LABELS.buildPreparation}
      modifier="build-preparation"
      icon="jadeSword"
      testId="status-ledger-card-build-preparation"
    >
      <StatusBuildPreparationPanel buildPreparation={surface.buildPreparation} onAction={onAction} />
    </StatusLedgerCard>
  );
}

export function StatusLedgerPage({ surface, onAction }: StatusLedgerPageProps) {
  return (
    <div
      className="statusLedgerRoot"
      data-testid="status-ledger-root"
      data-surface-testid={surface.meta.rootTestId}
      data-schema-version={surface.meta.schemaVersion}
      data-content-loaded={surface.meta.contentLoaded}
      data-ledger-mode={surface.meta.mode}
    >
      <div className="statusLedgerCanvas">
        <StatusCurrentStatePanel surface={surface.currentState} onAction={onAction} />
        <StatusLedgerHero hero={surface.hero} onAction={onAction} />
        <StatusMetricStrip metrics={surface.metrics} />

        <main className="statusLedgerGrid" data-testid="status-ledger-grid" aria-label="Cultivator ledger">
          <MilestoneCard surface={surface} onAction={onAction} />
          <CultivationBaseCard surface={surface} onAction={onAction} />
          <MissionRequirementsCard surface={surface} onAction={onAction} />
          <BestImprovementsCard surface={surface} onAction={onAction} />
          <SafetyNetCard surface={surface} onAction={onAction} />
          <IdentityDoctrineCard surface={surface} onAction={onAction} />
          <CurrentWorkCard surface={surface} onAction={onAction} />
          <BuildPreparationCard surface={surface} onAction={onAction} />
        </main>

        <StatusDetailsDrawer
          details={surface.details}
          recentChanges={surface.recentChanges}
          onAction={onAction}
        />
      </div>
    </div>
  );
}
