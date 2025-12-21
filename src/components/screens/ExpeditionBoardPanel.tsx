import { useEffect, useMemo, useState } from 'react';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useExpeditionStore } from '../../stores/expeditionStore';

function formatDurationLabel(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  return `${pad(minutes)}:${pad(secs)}`;
}

function formatRemaining(ms: number): string {
  return formatDurationLabel(Math.ceil(ms / 1000));
}

export function ExpeditionBoardPanel() {
  const currentCityId = useCityStore((state) => state.currentCityId);
  const cityMap = useContentStore((state) => state.maps.citiesById);
  const expeditions = useContentStore((state) => state.raw?.expeditions);
  const slots = useExpeditionStore((state) => state.slots);
  const activeRuns = useExpeditionStore((state) => state.active);
  const start = useExpeditionStore((state) => state.start);
  const claim = useExpeditionStore((state) => state.claim);

  const [now, setNow] = useState(() => Date.now());
  const [selectedTypeBySlot, setSelectedTypeBySlot] = useState<Record<number, string>>({});
  const [selectedDurationBySlot, setSelectedDurationBySlot] = useState<Record<number, string>>({});

  const cityIndex = useMemo(() => {
    if (!currentCityId) return null;
    return cityMap[currentCityId]?.index ?? null;
  }, [cityMap, currentCityId]);

  const durations = expeditions?.durations ?? [];
  const types = expeditions?.types ?? [];

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (types.length === 0) return;
    setSelectedTypeBySlot((prev) => {
      const next = { ...prev };
      for (let idx = 0; idx < slots; idx += 1) {
        if (!next[idx]) next[idx] = types[0].id;
      }
      return next;
    });
  }, [slots, types]);

  useEffect(() => {
    if (durations.length === 0) return;
    setSelectedDurationBySlot((prev) => {
      const next = { ...prev };
      for (let idx = 0; idx < slots; idx += 1) {
        if (!next[idx]) next[idx] = durations[0].id;
      }
      return next;
    });
  }, [durations, slots]);

  if (!currentCityId || cityIndex == null) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No city selected</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Select a city to view expeditions.</div>
      </div>
    );
  }

  if (!expeditions || types.length === 0 || durations.length === 0) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Expeditions unavailable</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Expedition content is missing or empty.</div>
      </div>
    );
  }

  return (
    <div className={'expeditionBoardPanel'}>
      <div className={'expeditionBoardHeader'}>
        <div>
          <div className={'expeditionBoardTitle'}>Expedition Board</div>
          <div className={'expeditionBoardSubtitle'}>Slots: {slots}</div>
        </div>
      </div>

      <div className={'expeditionBoardSlots'}>
        {Array.from({ length: slots }).map((_, slotIndex) => {
          const run = activeRuns.find((entry) => entry.slotIndex === slotIndex) ?? null;
          if (!run) {
            const selectedType = selectedTypeBySlot[slotIndex] ?? types[0].id;
            const selectedDuration = selectedDurationBySlot[slotIndex] ?? durations[0].id;
            return (
              <div key={slotIndex} className={'expeditionBoardCard'}>
                <div className={'expeditionBoardCardHeader'}>
                  <div className={'expeditionBoardCardTitle'}>Slot {slotIndex + 1}</div>
                  <div className={'expeditionBoardCardStatus'}>Idle</div>
                </div>
                <div className={'expeditionBoardCardBody'}>
                  <label className={'expeditionBoardField'}>
                    <span>Type</span>
                    <select
                      value={selectedType}
                      onChange={(event) =>
                        setSelectedTypeBySlot((prev) => ({ ...prev, [slotIndex]: event.target.value }))
                      }
                    >
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={'expeditionBoardField'}>
                    <span>Duration</span>
                    <select
                      value={selectedDuration}
                      onChange={(event) =>
                        setSelectedDurationBySlot((prev) => ({ ...prev, [slotIndex]: event.target.value }))
                      }
                    >
                      {durations.map((duration) => (
                        <option key={duration.id} value={duration.id}>
                          {duration.label} ({formatDurationLabel(duration.seconds)})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={'expeditionBoardCardActions'}>
                  <button
                    className={'worldScreenModuleButton'}
                    onClick={() => start(slotIndex, selectedType, selectedDuration, currentCityId, cityIndex)}
                  >
                    Start Expedition
                  </button>
                </div>
              </div>
            );
          }

          const typeName = types.find((entry) => entry.id === run.expeditionTypeId)?.name ?? run.expeditionTypeId;
          const durationLabel =
            durations.find((entry) => entry.id === run.durationId)?.label ?? run.durationId;
          const remainingMs = Math.max(0, run.endsAt - now);
          const isComplete = run.status === 'complete' || remainingMs <= 0;

          return (
            <div key={slotIndex} className={'expeditionBoardCard'}>
              <div className={'expeditionBoardCardHeader'}>
                <div className={'expeditionBoardCardTitle'}>Slot {slotIndex + 1}</div>
                <div className={'expeditionBoardCardStatus'}>{isComplete ? 'Complete' : 'Running'}</div>
              </div>
              <div className={'expeditionBoardCardBody'}>
                <div>
                  <strong>Type:</strong> {typeName}
                </div>
                <div>
                  <strong>Duration:</strong> {durationLabel}
                </div>
                <div>
                  <strong>Time:</strong> {isComplete ? 'Complete' : `${formatRemaining(remainingMs)} remaining`}
                </div>
              </div>
              <div className={'expeditionBoardCardActions'}>
                <button
                  className={'worldScreenModuleButton'}
                  onClick={() => claim(slotIndex)}
                  disabled={!isComplete}
                >
                  {isComplete ? 'Claim Rewards' : 'In Progress'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
