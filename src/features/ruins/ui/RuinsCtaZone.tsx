import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { deriveRuinsActionState } from './deriveRuinsActionState.js';

export function RuinsCtaZone(props: {
  ruinId: string;
  runActive: boolean;
}) {
  const { ruinId, runActive } = props;
  const startRun = useRuinsStore((state) => state.startRun);
  const stopRun = useRuinsStore((state) => state.stopRun);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const setAutoRepeat = useRuinsStore((state) => state.setAutoRepeat);
  const actionState = deriveRuinsActionState({ runActive });

  return (
    <section className="ruinsCtaZone" aria-label="Ruins controls">
      <button
        type="button"
        className={`button-standard ruinsCtaZone__primary ruinsCtaZone__primary--${actionState.primaryActionTone}`}
        onClick={() => {
          if (runActive) {
            stopRun();
            return;
          }
          startRun(ruinId);
        }}
      >
        {actionState.primaryActionLabel}
      </button>

      <div className="ruinsCtaZone__secondary">
        <label className="ruinsCtaZone__toggle">
          <input
            type="checkbox"
            checked={autoRepeatDefault}
            onChange={(event) => setAutoRepeat(event.target.checked)}
          />
          Continue farming ruins
        </label>
        <div className="ruinsCtaZone__stateLine">{runActive ? 'Run active now.' : 'Run idle — ready to start.'}</div>
      </div>
    </section>
  );
}
