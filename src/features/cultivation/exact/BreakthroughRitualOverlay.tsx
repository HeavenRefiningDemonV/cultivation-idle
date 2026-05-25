import type { BreakthroughRitualSurfaceV1 } from '../../breakthroughRitual/index.js';
import './BreakthroughRitualOverlay.scss';

export interface BreakthroughRitualOverlayProps {
  surface: BreakthroughRitualSurfaceV1;
  onClose: () => void;
  onRoute?: () => void;
}

export function BreakthroughRitualOverlay({ surface, onClose, onRoute }: BreakthroughRitualOverlayProps) {
  const proofItemSpent = surface.proofItemSpent;
  const unlockCascade = surface.unlockCascade;
  const doctrineEcho = surface.doctrineEcho;
  const lifeMemoryLine = surface.lifeMemoryLine;
  return (
    <div className="breakthroughRitualOverlay" role="dialog" aria-modal="true" aria-label="Breakthrough ritual">
      <button type="button" className="breakthroughRitualOverlay__scrim" aria-label="Close breakthrough ritual" onClick={onClose} />
      <section className={`breakthroughRitualPanel breakthroughRitualPanel--${surface.mode}`} data-testid="breakthrough-ritual-overlay">
        <header className="breakthroughRitualPanel__header">
          <span className="breakthroughRitualPanel__eyebrow">{surface.mode === 'preview' ? 'Threshold Preview' : 'Breakthrough Recorded'}</span>
          <h2>{surface.toRealm.name}</h2>
          <p>{surface.fromRealm.name} stage {surface.fromRealm.substage} to {surface.toRealm.name} stage {surface.toRealm.substage}</p>
        </header>

        <div className="breakthroughRitualPanel__grid">
          <section>
            <h3>Threshold Seal</h3>
            <p>{proofItemSpent ? `${proofItemSpent.name} x${proofItemSpent.qty}` : 'No gate item consumed for this substage.'}</p>
            <p>Qi spent: {surface.qi.spentLabel}</p>
            {surface.stabilityDelta ? <p>{surface.stabilityDelta.explanation}</p> : <p>Breath remains stable.</p>}
          </section>

          <section>
            <h3>Transformation</h3>
            {surface.statDelta.length > 0 ? (
              <ul>
                {surface.statDelta.map((delta) => (
                  <li key={delta.id}>{delta.label}: {delta.before} to {delta.after} ({delta.delta})</li>
                ))}
              </ul>
            ) : <p>Stat delta is conservative for this crossing.</p>}
          </section>

          <section>
            <h3>Unlock Cascade</h3>
            <ul>
              {unlockCascade.map((unlock) => (
                <li key={unlock.id}>
                  <strong>{unlock.title}</strong>
                  <span>{unlock.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Doctrine Echo</h3>
            <p>{doctrineEcho?.line ?? 'Doctrine settled quietly around the new vessel.'}</p>
            <strong>{lifeMemoryLine}</strong>
          </section>
        </div>

        <footer className="breakthroughRitualPanel__actions">
          {surface.nextMilestone?.target ? (
            <button type="button" className="breakthroughRitualPanel__primary" onClick={onRoute}>
              {surface.nextMilestone.primaryRouteLabel}
            </button>
          ) : null}
          <button type="button" onClick={onClose}>
            Continue Cultivating
          </button>
        </footer>
      </section>
    </div>
  );
}
