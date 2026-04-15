import { useRuinsStore } from '../../../stores/ruinsStore.js';

export function RuinsCtaZone(props: {
  ruinId: string;
  runActive: boolean;
}) {
  const { ruinId, runActive } = props;
  const startRun = useRuinsStore((state) => state.startRun);
  const stopRun = useRuinsStore((state) => state.stopRun);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const setAutoRepeat = useRuinsStore((state) => state.setAutoRepeat);

  return (
    <section className="ruinsCtaZone" aria-label="Ruins controls">
      <button
        type="button"
        className={`button-standard ruinsCtaZone__primary ${runActive ? 'ruinsCtaZone__primary--stop' : 'ruinsCtaZone__primary--start'}`}
        onClick={() => {
          if (runActive) {
            stopRun();
            return;
          }
          startRun(ruinId);
        }}
      >
        {runActive ? 'Stop Ruins Run' : 'Start Ruins Run'}
      </button>

      <label className="ruinsCtaZone__toggle">
        <input
          type="checkbox"
          checked={autoRepeatDefault}
          onChange={(event) => setAutoRepeat(event.target.checked)}
        />
        Continue farming ruins
      </label>
    </section>
  );
}
