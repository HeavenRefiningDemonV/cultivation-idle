import type { TrainingIntensityId } from '../../content/types.js';
import type {
  TrainingFutureStatReadOnlyRow,
  TrainingLockedRegimenReadOnlyRow,
  TrainingRegimenReadOnlyRow,
  TrainingStatReadOnlyRow,
  TrainingSupportMultiplierRow,
} from '../../systems/training/index.js';
import type { TrainingHallSurfaceV1 } from './trainingHallTypes.js';

export interface TrainingHallScreenProps {
  surface: TrainingHallSurfaceV1;
  onSelectRegimen?: (regimenId: string) => void;
  onSelectIntensity?: (intensityId: TrainingIntensityId) => void;
  onStartTraining?: (regimenId: string, intensityId: TrainingIntensityId) => void;
  onStopTraining?: () => void;
}

function StatLine({ row, label }: { row: TrainingStatReadOnlyRow; label: string }) {
  return (
    <div className={`trainingHallStatLine is-${row.capState}`}>
      <span className="trainingHallStatLineLabel">{label}</span>
      <strong>{row.displayName}</strong>
      <span>{row.rating} / {row.cap}</span>
      <span>{row.grade}</span>
    </div>
  );
}

function RegimenButton({
  regimen,
  selected,
  onSelect,
}: {
  regimen: TrainingRegimenReadOnlyRow;
  selected: boolean;
  onSelect?: (regimenId: string) => void;
}) {
  return (
    <button
      type="button"
      className={`trainingHallRegimen ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect?.(regimen.id)}
      data-regimen-id={regimen.id}
      data-path={regimen.path}
    >
      <span className="trainingHallRegimenName">{regimen.displayName}</span>
      <span className="trainingHallRegimenRoom">{regimen.roomLabel}</span>
      <span className="trainingHallRegimenMastery">Mastery {Math.round(regimen.masteryXp)} / {regimen.nextMasteryMilestone ?? 'cap'}</span>
    </button>
  );
}

function LockedRegimenSlip({ regimen }: { regimen: TrainingLockedRegimenReadOnlyRow }) {
  return (
    <div
      className="trainingHallRegimen is-locked"
      data-regimen-id={regimen.id}
      data-path={regimen.path}
      data-locked="true"
    >
      <span className="trainingHallRegimenName">{regimen.displayName}</span>
      <span className="trainingHallRegimenRoom">{regimen.primaryStat.displayName}</span>
      <span className="trainingHallRegimenMastery">{regimen.lockedReason}</span>
    </div>
  );
}

function FutureStatSilhouette({ row }: { row: TrainingFutureStatReadOnlyRow }) {
  return (
    <div className="trainingHallFutureStat" data-stat-id={row.statId} data-unlock-realm={row.unlockRealmIndex}>
      <div>
        <strong>{row.displayName}</strong>
        <span>{row.unlockRealmLabel}</span>
      </div>
      <p>{row.maxEffectSummary ?? row.lockedReason}</p>
    </div>
  );
}

function SupportRow({ row }: { row: TrainingSupportMultiplierRow }) {
  return (
    <div className={`trainingHallSupportRow is-${row.source}`} data-support-id={row.id}>
      <span>{row.label}</span>
      <strong>{row.valueLabel}</strong>
      <small>{row.detail}</small>
    </div>
  );
}

function PracticeStage({ surface }: { surface: TrainingHallSurfaceV1 }) {
  const regimen = surface.practiceStage.selectedRegimen;
  return (
    <section className={`trainingHallStage is-${surface.practiceStage.status}`}>
      <div className="trainingHallStageHeader">
        <p>{surface.practiceStage.statusLabel}</p>
        <h3>{regimen?.displayName ?? surface.pathRoom.title}</h3>
        <span>{regimen?.roomLabel ?? surface.pathRoom.pathLabel}</span>
      </div>
      <p className="trainingHallStageDetail">{surface.practiceStage.detail}</p>
      {regimen ? (
        <div className="trainingHallStageStats">
          <StatLine row={regimen.primaryStat} label="Primary" />
          <StatLine row={regimen.secondaryStat} label="Secondary" />
          <StatLine row={regimen.foundationStat} label="Foundation" />
          <div className="trainingHallCurrentForm">
            <span>Current Form</span>
            <strong>{regimen.displayName}</strong>
            <small>{regimen.lockedGameplayTrait ?? 'Mastery improves this drill without granting direct rewards.'}</small>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TrainingHallVfxMotes({ surface }: { surface: TrainingHallSurfaceV1 }) {
  const moteCount = Math.min(surface.visual.fxBudget.activeParticles, surface.visual.fxBudget.maxParticles);
  if (moteCount <= 0) return null;
  return (
    <div className="trainingHallVfxMotes" data-testid="training-hall-vfx-motes" aria-hidden="true">
      {Array.from({ length: moteCount }, (_, index) => (
        <span key={index} data-testid="training-hall-vfx-mote" />
      ))}
    </div>
  );
}

export function TrainingHallScreen({
  surface,
  onSelectRegimen,
  onSelectIntensity,
  onStartTraining,
  onStopTraining,
}: TrainingHallScreenProps) {
  const selectedRegimen = surface.practiceStage.selectedRegimen;
  const selectedIntensityId = surface.meta.selectedIntensityId ?? 'steady';

  return (
    <main
      className={`trainingHallPage is-${surface.practiceStage.status}`}
      data-testid={surface.meta.rootTestId}
      data-path={surface.meta.selectedPath ?? 'none'}
      data-reduced-motion={surface.meta.reducedMotion ? 'true' : 'false'}
      data-visual-state={surface.visual.activityState}
      data-motion-mode={surface.visual.motionMode}
      data-fx-particle-budget={surface.visual.fxBudget.maxParticles}
    >
      <TrainingHallVfxMotes surface={surface} />
      <header className="trainingHallHero">
        <div>
          <p className="trainingHallEyebrow">{surface.pathRoom.pathLabel}</p>
          <h2>{surface.page.title}</h2>
          <strong className="trainingHallRoomTitle">{surface.pathRoom.title}</strong>
          <p>{surface.page.subtitle}</p>
        </div>
        <div className="trainingHallFoundation">
          <span>{surface.pathRoom.foundation.label}</span>
          <strong>{surface.pathRoom.foundation.valueLabel}</strong>
          <small>Current Bottleneck: {surface.pathRoom.bottleneck?.displayName ?? 'None'}</small>
          <small>Next Unlock: {surface.pathRoom.nextUnlock ? `${surface.pathRoom.nextUnlock.displayName} at ${surface.pathRoom.nextUnlock.realmLabel}` : 'All path disciplines open'}</small>
        </div>
      </header>

      {surface.alerts.length > 0 ? (
        <div className="trainingHallAlerts" aria-live="polite">
          {surface.alerts.map((alert) => (
            <div key={alert.id} className={`trainingHallAlert is-${alert.tone}`}>
              <strong>{alert.label}</strong>
              <span>{alert.detail}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="trainingHallLayout">
        <aside className="trainingHallRail" aria-label={surface.regimenRail.title}>
          <h3>{surface.regimenRail.title}</h3>
          {surface.regimenRail.regimens.length > 0 ? (
            surface.regimenRail.regimens.map((regimen) => (
              <RegimenButton
                key={regimen.id}
                regimen={regimen}
                selected={regimen.id === surface.meta.selectedRegimenId}
                onSelect={onSelectRegimen}
              />
            ))
          ) : (
            <p className="trainingHallEmpty">Choose a path to see available regimens.</p>
          )}
          {surface.lockedRegimenRail.regimens.length > 0 ? (
            <div className="trainingHallLockedRail" aria-label={surface.lockedRegimenRail.title}>
              <h4>{surface.lockedRegimenRail.title}</h4>
              {surface.lockedRegimenRail.regimens.map((regimen) => (
                <LockedRegimenSlip key={regimen.id} regimen={regimen} />
              ))}
            </div>
          ) : null}
        </aside>

        <PracticeStage surface={surface} />

        <aside className="trainingHallStats" aria-label="Path stats">
          <h3>Path Foundation</h3>
          {surface.statRows.map((row) => (
            <div key={row.statId} className={`trainingHallPathStat is-${row.capState}`}>
              <div>
                <strong>{row.displayName}</strong>
                <span>{row.grade}</span>
              </div>
              <div className="trainingHallPathStatMeter" aria-hidden="true">
                <span style={{ width: `${row.capPct}%` }} />
              </div>
              <small>{row.rating} / {row.cap}</small>
            </div>
          ))}
          {surface.futureStats.length > 0 ? (
            <div className="trainingHallFutureStats" aria-label="Future path disciplines">
              <h4>Future Disciplines</h4>
              {surface.futureStats.map((row) => (
                <FutureStatSilhouette key={row.statId} row={row} />
              ))}
            </div>
          ) : null}
          <div className="trainingHallSupport" aria-label="Training support multipliers">
            <h4>Training Support</h4>
            {surface.supportRows.map((row) => (
              <SupportRow key={row.id} row={row} />
            ))}
          </div>
        </aside>
      </div>

      <footer className="trainingHallControls">
        <div className="trainingHallIntensity" aria-label={surface.intensityStrip.title}>
          {surface.intensityStrip.intensities.map((intensity) => (
            <button
              key={intensity.id}
              type="button"
              className={`trainingHallIntensityButton ${intensity.selected ? 'is-selected' : ''}`}
              onClick={() => onSelectIntensity?.(intensity.id)}
            >
              <span>{intensity.label}</span>
              <small>{intensity.xpMultiplierLabel} / {intensity.fatigueLabel}</small>
            </button>
          ))}
        </div>
        <div className="trainingHallActions">
          <button
            type="button"
            className="trainingHallActionButton is-primary"
            disabled={!surface.actionBar.startButton.enabled || !selectedRegimen}
            title={surface.actionBar.startButton.disabledReason ?? surface.actionBar.startButton.label}
            onClick={() => {
              if (!selectedRegimen) return;
              onStartTraining?.(selectedRegimen.id, selectedIntensityId);
            }}
          >
            {surface.actionBar.startButton.label}
          </button>
          <button
            type="button"
            className="trainingHallActionButton"
            disabled={!surface.actionBar.stopButton.enabled}
            title={surface.actionBar.stopButton.disabledReason ?? surface.actionBar.stopButton.label}
            onClick={() => onStopTraining?.()}
          >
            {surface.actionBar.stopButton.label}
          </button>
          {surface.actionBar.startButton.disabledReason ? (
            <small className="trainingHallActionHint">
              {surface.actionBar.startButton.disabledReason}
            </small>
          ) : null}
        </div>
      </footer>
    </main>
  );
}
