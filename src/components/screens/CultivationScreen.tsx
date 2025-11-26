import { images } from '../../assets/images';
import { useGameStore } from '../../stores/gameStore';
import { formatNumber } from '../../utils/numbers';
import './CultivationScreen.css';

export function CultivationScreen() {
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const realm = useGameStore((state) => state.realm);
  const breakthrough = useGameStore((state) => state.breakthrough);

  return (
    <div className="cultivate-root">
      <div
        className="cultivate-bg"
        style={{ backgroundImage: `url(${images.cultivation.background})` }}
      >
        <div className="cultivate-figure-frame">
          <img
            src={images.cultivation.figure}
            alt="Cultivator"
            className="cultivate-figure-image"
          />
        </div>

        <button
          type="button"
          className="cultivate-breakthrough-bar"
          style={{ backgroundImage: `url(${images.ui.barLong})` }}
          onClick={breakthrough}
        >
          <span className="cultivate-breakthrough-label">Attempt Breakthrough</span>
        </button>

        <div className="cultivate-hud">
          <div className="cultivate-hud-line">
            Qi: {formatNumber(qi)} ({formatNumber(qiPerSecond)}/s)
          </div>
          <div className="cultivate-hud-line">
            Realm: {realm?.name} Substage {realm?.substage ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
