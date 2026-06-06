import { useMemo } from 'react';
import type { DaoHeartPracticeDef } from '../../content/types.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import { getCanonicalCultivationStageNumber } from '../../systems/progression/cultivationStageIndex.js';
import { getSpiritRootPairKey } from '../../systems/spiritRoots/index.js';
import { buildDaoHeartSanctuarySurface } from './buildDaoHeartSanctuarySurface.js';
import { useDaoHeartSanctuaryActionController } from './useDaoHeartSanctuaryActionController.js';
import './DaoHeartSanctuaryView.scss';

const EMPTY_DAO_HEART_PRACTICES = Object.freeze([]) as DaoHeartPracticeDef[];

export function DaoHeartSanctuaryView() {
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const levelById = useCultivationStore((state) => state.heartLawLevelById);
  const xpById = useCultivationStore((state) => state.heartLawXpById);
  const verseMasteryByLawId = useCultivationStore((state) => state.verseMasteryByLawId);
  const clarity = useCultivationStore((state) => state.daoHeartClarity);
  const turbulence = useCultivationStore((state) => state.turbulence);
  const activePracticeId = useCultivationStore((state) => state.activeDaoHeartPracticeId);
  const rootResonanceByPair = useCultivationStore((state) => state.rootResonanceByPair);
  const heartLawVersion = useCultivationStore((state) => state.heartLawVersion);
  const practices = useContentStore((state) => state.raw?.dao_heart_practices.practices ?? EMPTY_DAO_HEART_PRACTICES);
  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const realm = useGameStore((state) => state.realm);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const foregroundActivityType = useActivityStore((state) => state.active?.type ?? null);
  const { prefersReducedMotion } = useFxQuality();
  const controller = useDaoHeartSanctuaryActionController();
  const cultivationEffectiveStage = getCanonicalCultivationStageNumber({
    realmIndex: realm.index,
    substage: realm.substage,
  });
  const currentRootResonance = spiritRoot && selectedHeartLawId
    ? rootResonanceByPair[getSpiritRootPairKey(spiritRoot.element, selectedHeartLawId)] ?? 0
    : 0;

  const surface = useMemo(() => buildDaoHeartSanctuarySurface({
    selectedHeartLawId,
    heartLaw: selectedHeartLawId ? heartLawsById[selectedHeartLawId] ?? null : null,
    practices,
    levelById,
    xpById,
    verseMasteryByLawId,
    clarity,
    turbulence,
    activePracticeId,
    cultivationEffectiveStage,
    spiritRoot,
    currentRootResonance,
    foregroundActivityType,
    prefersReducedMotion,
  }), [
    selectedHeartLawId,
    heartLawsById,
    practices,
    levelById,
    xpById,
    verseMasteryByLawId,
    clarity,
    turbulence,
    activePracticeId,
    cultivationEffectiveStage,
    spiritRoot,
    currentRootResonance,
    foregroundActivityType,
    heartLawVersion,
    prefersReducedMotion,
  ]);
  const moteCount = Math.min(surface.visual.fxBudget.activeParticles, surface.visual.fxBudget.maxParticles);
  const selectedBottomPractice = surface.practices.find((practice) => practice.id === surface.bottomActions.selectedPracticeId) ?? null;

  return (
    <div
      className="daoHeartSanctuary"
      data-ui="dao-heart-sanctuary"
      data-motion-mode={surface.visual.motionMode}
      data-turbulence-band={surface.visual.turbulenceBand}
      data-seal-state={surface.visual.sealState}
      data-clarity-state={surface.visual.clarityState}
      data-fx-particle-budget={surface.visual.fxBudget.maxParticles}
      data-screenshot-states={surface.visual.screenshotStates.join(' ')}
    >
      {moteCount > 0 ? (
        <div className="daoHeartSanctuary__vfxMotes" data-testid="dao-heart-sanctuary-vfx-motes" aria-hidden="true">
          {Array.from({ length: moteCount }, (_, index) => (
            <span key={index} data-testid="dao-heart-sanctuary-vfx-mote" />
          ))}
        </div>
      ) : null}

      <header className="daoHeartSanctuary__identity">
        <div className="daoHeartSanctuary__identityCopy">
          <div className="daoHeartSanctuary__eyebrow">Dao Heart Sanctuary</div>
          <h3>{surface.identity.heartLawName}</h3>
          <p>{surface.header.pathIdentity} - {surface.centerMandala.scrollText}</p>
        </div>
        <dl className="daoHeartSanctuary__headerMetrics">
          <div><dt>Level</dt><dd>{surface.progression.level}</dd></div>
          <div><dt>Chapter</dt><dd>{surface.identity.chapter}</dd></div>
          <div><dt>Qi Speed</dt><dd>{surface.header.qiSpeedImpact}</dd></div>
          <div><dt>Breakthrough Risk</dt><dd>{surface.header.breakthroughRiskImpact}</dd></div>
          <div><dt>Root Fit</dt><dd>{surface.header.rootResonance}</dd></div>
          <div><dt>Current Bonus</dt><dd>{surface.header.currentBonus}</dd></div>
        </dl>
      </header>

      <div className="daoHeartSanctuary__layout">
        <section className="daoHeartSanctuary__practiceRail" aria-label="Dao Heart practices">
          {surface.practices.map((practice) => (
            <button
              key={practice.id}
              type="button"
              className={`daoHeartSanctuary__practice uiNoShift ${practice.active ? 'daoHeartSanctuary__practice--active' : ''}`}
              disabled={practice.disabled}
              onClick={() => controller.startPractice(practice.id)}
            >
              <span>{practice.label}</span>
              <small>{practice.outputs.bestUse}</small>
              <em>{practice.disabledReason ?? (practice.offlineAllowed ? 'Offline eligible' : 'Active only')}</em>
              <i>
                XP {practice.outputs.heartLawXpMultiplierLabel} / Verse {practice.outputs.verseMultiplierLabel} / Root {practice.outputs.rootMultiplierLabel} / Turb {practice.outputs.turbulencePerMinuteLabel}
              </i>
            </button>
          ))}
        </section>

        <section className="daoHeartSanctuary__mandala" aria-label="Heart Law mandala">
          <div className="daoHeartSanctuary__ring" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <ol className="daoHeartSanctuary__chapterNodes" aria-label="Heart Law chapters">
            {surface.centerMandala.chapterNodes.map((node) => (
              <li key={node.id} data-state={node.state}>
                <span>{node.label}</span>
                <small>{node.detail}</small>
              </li>
            ))}
          </ol>
          <div className="daoHeartSanctuary__scroll">
            <strong>Verse Ring</strong>
            <span>{surface.centerMandala.verseRing.masteryLabel}</span>
            <small>{surface.centerMandala.verseRing.detail}</small>
          </div>
          <div className="daoHeartSanctuary__seal" data-state={surface.centerMandala.nextSeal.state}>
            <strong>{surface.centerMandala.nextSeal.label}</strong>
            <span>{surface.centerMandala.nextSeal.detail}</span>
          </div>
          <div className="daoHeartSanctuary__mandalaReadout">
            <span>{surface.centerMandala.rootResonanceLine}</span>
            <span>{surface.centerMandala.turbulenceCracks}</span>
            {surface.centerMandala.overlevelHaze ? <span>{surface.centerMandala.overlevelHaze}</span> : null}
          </div>
        </section>

        <aside className="daoHeartSanctuary__riskRail" aria-label="Dao Heart causes and branch state">
          {surface.rightRail.causeRows.map((row) => (
            <div key={row.id} className={`daoHeartSanctuary__metric daoHeartSanctuary__metric--${row.severity}`}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
              <small>{row.detail}</small>
              {row.actionLabel ? <em>{row.actionLabel}</em> : null}
            </div>
          ))}
          <div className={`daoHeartSanctuary__metric daoHeartSanctuary__metric--${surface.rootFit.tier === 'opposed' ? 'danger' : surface.rootFit.tier === 'strained' ? 'warning' : 'good'}`}>
            <span>Root Route</span>
            <strong>{surface.rootFit.label}</strong>
            <small>{surface.rootFit.summary}</small>
            <em>{surface.rootFit.heartLawXpLabel} Heart Law XP / {surface.rootFit.expressionCapLabel}</em>
          </div>
          {surface.rootVariantHint ? (
            <div className="daoHeartSanctuary__branchBox">
              <span>Variant Hint</span>
              <strong>{surface.rootVariantHint.label}</strong>
              <small>{surface.rootVariantHint.detail}</small>
            </div>
          ) : null}
          {surface.branchChoices.map((choice) => (
            <div key={choice.id} className="daoHeartSanctuary__branchBox" data-state={choice.state}>
              <span>{choice.label}</span>
              <small>{choice.detail}</small>
            </div>
          ))}
        </aside>
      </div>

      <footer className="daoHeartSanctuary__actions">
        <div className="daoHeartSanctuary__forecastStrip" aria-label="Selected practice forecasts">
          {surface.bottomActions.forecastWindows.map((forecast) => (
            <div key={forecast.minutes}>
              <strong>{forecast.label}</strong>
              <span>{forecast.summary}</span>
            </div>
          ))}
        </div>
        <div className="daoHeartSanctuary__actionButtons">
          <button
            type="button"
            className="uiNoShift"
            onClick={() => {
              if (surface.bottomActions.selectedPracticeId) {
                controller.startPractice(surface.bottomActions.selectedPracticeId);
              }
            }}
            disabled={!surface.bottomActions.selectedPracticeId || Boolean(selectedBottomPractice?.disabled)}
          >
            {surface.bottomActions.startLabel}
          </button>
          <button type="button" className="uiNoShift" onClick={controller.openSpiritRootObservation}>
            {surface.bottomActions.observeSpiritRoot.label}
          </button>
          <button type="button" className="uiNoShift" onClick={controller.stopPractice} disabled={!surface.bottomActions.canStop}>
            Stop practice
          </button>
          <p>{surface.bottomActions.offlineEligibilityText}</p>
          {surface.bottomActions.foregroundConflictText ? <p>{surface.bottomActions.foregroundConflictText}</p> : null}
        </div>
      </footer>
    </div>
  );
}
