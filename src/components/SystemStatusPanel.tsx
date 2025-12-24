import { useEffect, useMemo, useState } from 'react';
import { useActivityStore } from '../stores/activityStore';
import { useProfessionStore } from '../stores/professionStore';
import { useExpeditionStore } from '../stores/expeditionStore';
import { useContentStore } from '../stores/contentStore';

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function SystemStatusPanel() {
  const activity = useActivityStore((state) => state.active);
  const alchemyQueue = useProfessionStore((state) => state.alchemyQueue);
  const talismanQueue = useProfessionStore((state) => state.talismanQueue);
  const forgeQueue = useProfessionStore((state) => state.forgeQueue);
  const expeditionSlots = useExpeditionStore((state) => state.slots);
  const expeditionActive = useExpeditionStore((state) => state.active);
  const contentIsLoaded = useContentStore((state) => state.isLoaded);
  const contentIsLoading = useContentStore((state) => state.isLoading);
  const contentError = useContentStore((state) => state.error);
  const contentMaps = useContentStore((state) => state.maps);
  const contentRaw = useContentStore((state) => state.raw);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  const activityLabel = useMemo(() => {
    if (!activity) return 'None';
    const parts: string[] = [activity.type];
    if (activity.cityId) parts.push(`city=${activity.cityId}`);
    if (activity.sourceId) parts.push(`source=${activity.sourceId}`);
    parts.push(`started=${new Date(activity.startedAt).toLocaleTimeString()}`);
    return parts.join(' • ');
  }, [activity]);

  const professionJobs = useMemo(() => {
    const jobs = [
      ...alchemyQueue.map((job) => ({
        type: 'Alchemy',
        id: job.id,
        label: job.recipeId,
        endsAt: job.endsAt,
      })),
      ...talismanQueue.map((job) => ({
        type: 'Talisman',
        id: job.id,
        label: job.recipeId,
        endsAt: job.endsAt,
      })),
      ...forgeQueue.map((job) => ({
        type: 'Forge',
        id: job.id,
        label: job.blueprintId,
        endsAt: job.endsAt,
      })),
    ];
    return jobs.sort((a, b) => a.endsAt - b.endsAt);
  }, [alchemyQueue, forgeQueue, talismanQueue]);

  const expeditionJobs = useMemo(() => {
    return expeditionActive.map((run) => ({
      id: `${run.cityId}:${run.expeditionTypeId}`,
      label: `${run.expeditionTypeId} (city=${run.cityId})`,
      endsAt: run.endsAt,
    }));
  }, [expeditionActive]);

  const contentCounts = useMemo(() => {
    const maps = contentMaps;
    return {
      cities: Object.keys(maps.citiesById ?? {}).length,
      items: Object.keys(maps.itemsById ?? {}).length,
      techniques: Object.keys(maps.techniquesById ?? {}).length,
      pavilions: Object.keys(maps.pavilionsById ?? {}).length,
      outskirts: Object.keys(maps.outskirtsById ?? {}).length,
      enemies: Object.keys(maps.enemiesById ?? {}).length,
      trials: Object.keys(maps.trialsById ?? {}).length,
      ruins: Object.keys(maps.ruinsById ?? {}).length,
      heartLaws: contentRaw?.heart_laws?.length ?? 0,
      prestigeUpgrades: contentRaw?.prestige_store?.upgrades?.length ?? 0,
    };
  }, [contentMaps, contentRaw]);

  return (
    <>
      <h2 className={'settingsScreenPanelTitle'}>System Status</h2>
      <div className={'settingsDebugRow'}>
        <div className={'settingsDebugLabel'}>Activity</div>
        <div className={'settingsDebugValue'}>{activityLabel}</div>
      </div>

      <div className={'settingsDebugRow'}>
        <div className={'settingsDebugLabel'}>Craft Queues</div>
        <div className={'settingsDebugValue'}>
          Alchemy: {alchemyQueue.length} • Talisman: {talismanQueue.length} • Forge: {forgeQueue.length}
        </div>
      </div>

      {professionJobs.length > 0 ? (
        <div className={'settingsDebugPools'}>
          {professionJobs.map((job) => (
            <div key={job.id} className={'settingsDebugPoolRow'}>
              <div className={'settingsDebugPoolCity'}>{job.type}</div>
              <div className={'settingsDebugPoolCounts'}>
                {job.label} • ends in {formatCountdown(job.endsAt - now)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={'settingsDebugRow'}>
          <div className={'settingsDebugLabel'}>Active Jobs</div>
          <div className={'settingsDebugValue'}>None</div>
        </div>
      )}

      <div className={'settingsDebugRow'}>
        <div className={'settingsDebugLabel'}>Expeditions</div>
        <div className={'settingsDebugValue'}>
          Slots: {expeditionSlots} • Active: {expeditionActive.length}
        </div>
      </div>

      {expeditionJobs.length > 0 ? (
        <div className={'settingsDebugPools'}>
          {expeditionJobs.map((run) => (
            <div key={run.id} className={'settingsDebugPoolRow'}>
              <div className={'settingsDebugPoolCity'}>Expedition</div>
              <div className={'settingsDebugPoolCounts'}>
                {run.label} • ends in {formatCountdown(run.endsAt - now)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={'settingsDebugRow'}>
          <div className={'settingsDebugLabel'}>Active Expeditions</div>
          <div className={'settingsDebugValue'}>None</div>
        </div>
      )}

      <div className={'settingsDebugRow'}>
        <div className={'settingsDebugLabel'}>Content</div>
        <div className={'settingsDebugValue'}>
          Loaded: {contentIsLoaded ? 'Yes' : 'No'} • Loading: {contentIsLoading ? 'Yes' : 'No'}
        </div>
      </div>
      {contentError && <div className={'settingsDebugError'}>Error: {contentError}</div>}
      <div className={'settingsDebugGrid'}>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Cities</div>
          <div className={'settingsDebugValue'}>{contentCounts.cities}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Items</div>
          <div className={'settingsDebugValue'}>{contentCounts.items}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Techniques</div>
          <div className={'settingsDebugValue'}>{contentCounts.techniques}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Pavilions</div>
          <div className={'settingsDebugValue'}>{contentCounts.pavilions}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Outskirts</div>
          <div className={'settingsDebugValue'}>{contentCounts.outskirts}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Enemies</div>
          <div className={'settingsDebugValue'}>{contentCounts.enemies}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Trials</div>
          <div className={'settingsDebugValue'}>{contentCounts.trials}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Ruins</div>
          <div className={'settingsDebugValue'}>{contentCounts.ruins}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Heart Laws</div>
          <div className={'settingsDebugValue'}>{contentCounts.heartLaws}</div>
        </div>
        <div className={'settingsDebugItem'}>
          <div className={'settingsDebugLabel'}>Prestige Upgrades</div>
          <div className={'settingsDebugValue'}>{contentCounts.prestigeUpgrades}</div>
        </div>
      </div>
    </>
  );
}
