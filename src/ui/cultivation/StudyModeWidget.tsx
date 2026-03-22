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

  const masteryRateLabel = studyEnabled && studyTechniqueId
    ? `Mastery gain: +${STUDY_MASTERY_PER_MINUTE_BASE.toFixed(1)} / min (while cultivating)`
    : 'Enable Study Mode and pick a technique to begin.';

  return (
    <div className="cultivationPanel studyWidget">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Study Mode</div>
          <div className="panelSub">While cultivating, study one technique for slow, steady mastery.</div>
        </div>
        <label className="studyToggle">
          <input
            type="checkbox"
            checked={studyEnabled}
            onChange={(e) => setStudyEnabled(e.target.checked)}
          />
          <span>{studyEnabled ? 'On' : 'Off'}</span>
        </label>
      </div>

      <div className="studyControlRow">
        <div className="studyControlLabel">Technique</div>
        <select
          className="studySelect"
          value={studyTechniqueId ?? ''}
          onChange={(e) => setStudyTechniqueId(e.target.value || null)}
          disabled={!studyEnabled || options.length === 0}
        >
          <option value="">None</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
              {opt.grade ? ` • ${opt.grade}` : ''}
              {opt.rarity ? ` • ${opt.rarity}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="studyRate">
        {masteryRateLabel}
      </div>
      {!studyEnabled && <div className="inlineMessage inlineMessage--muted">Study mode is disabled. Enable to begin.</div>}
      {studyEnabled && !studyTechniqueId && options.length > 0 && (
        <div className="inlineMessage inlineMessage--muted">Choose a technique to study.</div>
      )}
      {options.length === 0 && (
        <div className="inlineMessage inlineMessage--muted">
          No techniques owned yet. Study becomes available after learning a technique.
        </div>
      )}
    </div>
  );
}
