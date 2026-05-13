import { S00_OPENING_CUTSCENE } from './storyData.js';
import { useStoryStore } from './storyStore.js';

export function StoryLogPanel() {
  const storyLog = useStoryStore((state) => state.storyLog);
  const startCutscene = useStoryStore((state) => state.startCutscene);
  const entry = storyLog.find((item) => item.id === S00_OPENING_CUTSCENE.id) ?? null;

  return (
    <section className="storyLogPanel" aria-labelledby="story-log-title">
      <h2 id="story-log-title" className="settingsScreenPanelTitle">Story Log</h2>
      <p className="settingsScreenPanelSubtitle">Replay milestone memories you have already seen.</p>

      {entry ? (
        <div className="storyLogPanel__entry">
          <div>
            <div className="storyLogPanel__title">S00 - The Night the Gate Refused Your Name</div>
            <p className="storyLogPanel__meta">
              First seen {new Date(entry.firstSeenAt).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            className="button-standard storyLogPanel__replay"
            onClick={() => startCutscene(S00_OPENING_CUTSCENE.id, { replay: true })}
          >
            Replay
          </button>
        </div>
      ) : (
        <div className="storyLogPanel__empty">No story milestones recorded yet.</div>
      )}
    </section>
  );
}
