import { useMemo } from 'react';
import { STUDY_MASTERY_PER_MINUTE_BASE } from '../../content/tuning/cultivationTuning.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import './StudyModeWidget.scss';

interface StudyOption {
  id: string;
  name: string;
  rarity?: string;
  grade?: string;
}

function toTitleCase(value: string | undefined): string {
  if (!value) return 'Unknown';
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StudyModeWidget() {
  const studyEnabled = useCultivationStore((state) => state.studyEnabled);
  const studyTechniqueId = useCultivationStore((state) => state.studyTechniqueId);
  const setStudyEnabled = useCultivationStore((state) => state.setStudyEnabled);
  const setStudyTechniqueId = useCultivationStore((state) => state.setStudyTechniqueId);

  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);

  const options: StudyOption[] = useMemo(() => {
    return Object.entries(unlockedTechs)
      .filter(([, meta]) => meta.unlocked)
      .map(([id, meta]) => {
        const def = techniquesById[id];
        return {
          id,
          name: def?.name ?? id,
          rarity: meta.rarity ?? def?.rarity,
          grade: meta.manualGrade ?? def?.tier,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [techniquesById, unlockedTechs]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === studyTechniqueId) ?? null,
    [options, studyTechniqueId],
  );

  const techniqueHelpId = 'study-technique-help';
  const techniqueSelectId = 'study-technique-select';
  const hasOptions = options.length > 0;
  const hasSelectedTechnique = Boolean(studyTechniqueId && selectedOption);
  const masteryRateLine = `Mastery rate: +${STUDY_MASTERY_PER_MINUTE_BASE.toFixed(1)} / min while cultivating.`;
  const stateLabel = !studyEnabled ? 'Dormant' : hasSelectedTechnique ? 'Active Study' : 'Awaiting Technique';

  const helperText = !studyEnabled
    ? 'Study is disabled. Enable Study Mode to resume mastery while cultivating.'
    : !hasOptions
      ? 'No unlocked techniques are available yet. Learn a technique to begin studying.'
      : hasSelectedTechnique
        ? 'Selected technique gains steady mastery only while cultivating.'
        : 'Pick one unlocked technique to begin steady mastery gains while cultivating.';

  return (
    <div className="daoHeartStudySurface cultivationPanel studyWidget" data-ui="dao-heart-study">
      <header className="daoHeartStudySurface__overview" aria-label="Study mode overview">
        <div className="daoHeartStudyHeading">
          <p className="daoHeartStudyEyebrow">Disciplined Reading</p>
          <h3 className="daoHeartStudyTitle">Study Mode</h3>
          <p className="daoHeartStudyPurpose">Sustain one technique reading while cultivating to build steady practical mastery.</p>
        </div>
        <label className="studyToggle" htmlFor="study-mode-toggle">
          <input
            id="study-mode-toggle"
            type="checkbox"
            checked={studyEnabled}
            onChange={(e) => setStudyEnabled(e.target.checked)}
          />
          <span>{studyEnabled ? 'On' : 'Off'}</span>
        </label>
      </header>

      <section className="daoHeartStudySurface__state" aria-live="polite">
        <div className={`daoHeartStudyStateBadge daoHeartStudyStateBadge--${studyEnabled ? 'enabled' : 'disabled'}`}>
          {stateLabel}
        </div>
        <p className="daoHeartStudyStateLine">{masteryRateLine}</p>
        <p className="daoHeartStudyStateLine">Mastery accrues only during cultivation activity.</p>
      </section>

      <section className="daoHeartStudyTechniqueSummary" aria-label="Selected study technique summary" aria-live="polite">
        <p className="daoHeartStudySummaryLabel">Selected Technique</p>
        {hasSelectedTechnique && selectedOption ? (
          <>
            <h4 className="daoHeartStudyTechniqueName">{selectedOption.name}</h4>
            <p className="daoHeartStudyTechniqueMeta">
              Grade: {toTitleCase(selectedOption.grade)} • Rarity: {toTitleCase(selectedOption.rarity)}
            </p>
            <p className="daoHeartStudyTechniqueNote">Steady mastery is applied to this technique while cultivation is active.</p>
          </>
        ) : (
          <>
            <h4 className="daoHeartStudyTechniqueName daoHeartStudyTechniqueName--empty">No technique selected</h4>
            <p className="daoHeartStudyTechniqueMeta">
              {hasOptions
                ? 'Choose one unlocked technique to anchor your reading discipline.'
                : 'Unlock a technique first, then return to begin guided study.'}
            </p>
            <p className="daoHeartStudyTechniqueNote">{masteryRateLine}</p>
          </>
        )}
      </section>

      <section className="daoHeartStudySurface__controls" aria-label="Study mode controls">
        <div className="studyControlRow">
          <label className="studyControlLabel" htmlFor={techniqueSelectId}>Technique</label>
          <select
            id={techniqueSelectId}
            className="studySelect"
            value={studyTechniqueId ?? ''}
            onChange={(e) => setStudyTechniqueId(e.target.value || null)}
            disabled={!studyEnabled || !hasOptions}
            aria-describedby={techniqueHelpId}
          >
            <option value="">None</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.grade ? ` • ${toTitleCase(option.grade)}` : ''}
                {option.rarity ? ` • ${toTitleCase(option.rarity)}` : ''}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="daoHeartStudySurface__notes" aria-live="polite">
        <p id={techniqueHelpId} className="studyHelperText">{helperText}</p>
      </section>
    </div>
  );
}
