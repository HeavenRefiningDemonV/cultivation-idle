import { useCallback } from 'react';
import { images } from '../../assets/images';
import { useGameStore } from '../../stores/gameStore';
import { formatNumber } from '../../utils/numbers';
import './CultivationScreen.css';

// These types should exist in your types module.
// If names differ, import/adjust them accordingly.
type FocusMode = 'balanced' | 'body' | 'spirit';

export function CultivationScreen() {
    const qi = useGameStore((state) => state.qi);
    const qiPerSecond = useGameStore((state) => state.qiPerSecond);
    const realm = useGameStore((state) => state.realm);

    // Typed accessors: no `any`
    const focusMode = useGameStore((state) => state.focusMode as FocusMode);
    const setFocusMode = useGameStore(
        (state) => state.setFocusMode as (mode: FocusMode) => void,
    );
    const breakthrough = useGameStore(
        (state) => state.breakthrough as () => void,
    );

    const handleBreakthrough = useCallback(() => {
        if (typeof breakthrough === 'function') {
            breakthrough();
        }
    }, [breakthrough]);

    return (
        <div className="cultivation-root">
            {/* BACKGROUND */}
            <div className="cultivation-bg-layer">
                <img
                    src={images.cultivation.background}
                    alt=""
                    className="cultivation-bg-image"
                />
            </div>

            {/* MAIN GRID: center art + right info panel */}
            <div className="cultivation-main-grid">
                <div className="cultivation-center">
                    <img
                        src={images.cultivation.figure}
                        alt="Cultivator"
                        className="cultivation-figure"
                    />
                </div>

                <div className="cultivation-info-panel">
                    <header className="cultivation-info-header">
                        <div className="cultivation-title font-cinzel">
                            Cultivation Chamber
                        </div>
                        <div className="cultivation-subtitle">
                            Meditate and gather Qi to advance your cultivation.
                        </div>
                    </header>

                    {/* Qi + Realm cards */}
                    <section className="cultivation-info-stats">
                        <div className="cultivation-stat-card">
                            <div className="stat-label">Current Qi</div>
                            <div className="stat-value font-mono text-qi-glow">
                                {formatNumber(qi)}
                            </div>
                            <div className="stat-subvalue">
                                {formatNumber(qiPerSecond)}/s
                            </div>
                        </div>

                        <div className="cultivation-stat-card">
                            <div className="stat-label">Realm</div>
                            <div className="stat-value text-gold-accent">
                                {realm?.name ?? 'Unknown'}
                            </div>
                            {realm ? (
                                <div className="stat-subvalue">
                                    Substage {realm.substage + 1}
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {/* Focus buttons */}
                    <section className="cultivation-focus-section">
                        <div className="section-title font-cinzel">
                            Cultivation Focus
                        </div>
                        <div className="focus-buttons">
                            {renderFocusButton(
                                'balanced',
                                'Balanced',
                                'Steady growth of body and spirit.',
                            )}
                            {renderFocusButton(
                                'body',
                                'Body',
                                'Emphasize physical resilience and attack.',
                            )}
                            {renderFocusButton(
                                'spirit',
                                'Spirit',
                                'Emphasize Qi gain and spiritual stats.',
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Simple breakthrough CTA – uses `breakthrough` if it exists */}
            <div className="cultivation-breakthrough-row">
                <div className="cultivation-breakthrough-card">
                    <div className="cultivation-breakthrough-header">
                        <div>
                            <div className="section-title font-cinzel">Breakthrough</div>
                            <div className="cultivation-breakthrough-requirement">
                                Accumulate Qi and attempt to advance your realm.
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="focus-button cultivation-breakthrough-button focus-button-active"
                        onClick={handleBreakthrough}
                    >
                        ✨ Attempt Breakthrough ✨
                    </button>
                </div>
            </div>
        </div>
    );

    function renderFocusButton(
        id: FocusMode,
        label: string,
        description: string,
    ) {
        const isActive = focusMode === id;

        return (
            <button
                key={id}
                type="button"
                className={
                    isActive ? 'focus-button focus-button-active' : 'focus-button'
                }
                onClick={() => setFocusMode(id)}
            >
                <div className="focus-label">{label}</div>
                <div className="focus-description">{description}</div>
            </button>
        );
    }
}
