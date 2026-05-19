import { useMemo } from 'react';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { formatNumber } from '../../utils/numbers.js';
import type { CombatEvent } from '../../types/index.js';

const MAX_ENTRIES = 6;

function prettifyStatusId(statusId: string | undefined): string {
  if (!statusId) return 'status';
  const withoutPrefix = statusId.replace(/^buff:/, '').replace(/^status:/, '');
  return withoutPrefix.replace(/[_-]/g, ' ');
}

function formatTechniqueEvent(
  event: CombatEvent,
  techniqueName: string,
): { id: string; at: number; text: string; isCrit?: boolean } | null {
  switch (event.type) {
    case 'HIT': {
      if (!event.techniqueId) return null;
      const amount = formatNumber(event.amount);
      const critText = event.isCrit ? ' crit' : '';
      const kindText = event.kind === 'boss_ultimate' ? ' (Boss Ultimate)' : '';
      return {
        id: event.id,
        at: event.at,
        text: `${techniqueName}${critText} for ${amount}${kindText}`,
        isCrit: event.isCrit,
      };
    }
    case 'SKILL_CAST': {
      return {
        id: event.id,
        at: event.at,
        text: `${techniqueName} cast`,
      };
    }
    case 'STATUS_APPLIED': {
      if (!event.techniqueId) return null;
      const statusLabel = prettifyStatusId(event.statusId);
      const refreshed = event.refreshed ? 'refreshed' : 'applied';
      return {
        id: event.id,
        at: event.at,
        text: `${techniqueName} ${refreshed} (${statusLabel})`,
      };
    }
    case 'HEAL': {
      if (!event.techniqueId) return null;
      return {
        id: event.id,
        at: event.at,
        text: `${techniqueName} heal +${formatNumber(event.amount)}`,
      };
    }
    case 'SHIELD_GAINED': {
      if (!event.techniqueId) return null;
      return {
        id: event.id,
        at: event.at,
        text: `${techniqueName} shield +${formatNumber(event.amount)}`,
      };
    }
    default:
      return null;
  }
}

export function RecentTechniqueActivations() {
  const events = useCombatStore((state) => state.events);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);

  const entries = useMemo(() => {
    const techniqueEvents = events.filter((event) => {
      if (event.type === 'SKILL_CAST') return true;
      if (event.type === 'HIT') return Boolean(event.techniqueId);
      if (event.type === 'STATUS_APPLIED') return Boolean(event.techniqueId);
      if (event.type === 'HEAL') return Boolean(event.techniqueId);
      if (event.type === 'SHIELD_GAINED') return Boolean(event.techniqueId);
      return false;
    });

    const sliced = techniqueEvents.slice(-MAX_ENTRIES).reverse();

    return sliced
      .map((event) => {
        const techniqueId = 'techniqueId' in event ? event.techniqueId : undefined;
        const techName = techniqueId ? techniquesById[techniqueId]?.name ?? techniqueId : 'Technique';
        return formatTechniqueEvent(event, techName);
      })
      .filter((entry): entry is { id: string; at: number; text: string; isCrit?: boolean } => Boolean(entry));
  }, [events, techniquesById]);

  if (entries.length === 0) {
    return (
      <div className="recentTechniqueActivations">
        <div className="recentTechniqueActivationsHeader">Recent Technique Activations</div>
        <div className="recentTechniqueActivationsEmpty">No casts yet. Enter combat to see techniques fire.</div>
      </div>
    );
  }

  return (
    <div className="recentTechniqueActivations">
      <div className="recentTechniqueActivationsHeader">Recent Technique Activations</div>
      <div className="recentTechniqueActivationsList">
        {entries.map((entry) => (
          <div key={entry.id} className="recentTechniqueActivationsItem">
            <span className={`recentTechniqueActivationsText ${entry.isCrit ? 'recentTechniqueActivationsText--crit' : ''}`}>
              {entry.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
