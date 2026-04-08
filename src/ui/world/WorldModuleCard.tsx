import type { ReactNode } from 'react';
import type { LiveWorldModuleKey } from '../../content/types.js';
import type { WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
import { BadgeSlot } from '../shell/BadgeSlot.js';
import { WorldRouteChip } from './WorldRouteChip.js';

export interface WorldModuleCardChip {
  kind: WorldRoutingChipKind;
  tone?: 'strong' | 'support' | 'neutral';
}

export function WorldModuleCard(props: {
  moduleKey: LiveWorldModuleKey;
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
  outputs: readonly string[];
  chips?: readonly WorldModuleCardChip[];
  active?: boolean;
  onOpen: (moduleKey: LiveWorldModuleKey) => void;
  openLabel: string;
  cta?: ReactNode;
}) {
  const { moduleKey, moduleName, roleTag, bestUsedWhen, outputs, chips = [], active = false, onOpen, openLabel, cta } = props;
  const visibleChips = chips.slice(0, 2);
  const chip1 = visibleChips[0] ?? null;
  const chip2 = visibleChips[1] ?? null;
  const hasChip1 = Boolean(chip1);
  const hasChip2 = Boolean(chip2);
  return (
    <article className={`worldModuleCard ${active ? 'worldModuleCard--active' : ''}`}>
      <div className="worldModuleCard__header">
        <div className="worldModuleCard__title">{moduleName}</div>
        <BadgeSlot preset="moduleMeta" className="worldModuleCard__stateSlot">
          {active ? <div className="worldModuleCard__activeBadge">Active</div> : null}
        </BadgeSlot>
      </div>
      <div className="worldModuleCard__tag">{roleTag}</div>
      <p className="worldModuleCard__when">{bestUsedWhen}</p>
      <ul className="worldModuleCard__outputs">
        {outputs.slice(0, 2).map((output) => (
          <li key={output}>{output}</li>
        ))}
      </ul>
      <div className="worldModuleCard__chips">
        <div className={`worldModuleCard__chipSlot ${hasChip1 ? '' : 'worldModuleCard__chipSlot--empty'}`}>
          {chip1 ? <WorldRouteChip key={chip1.kind} kind={chip1.kind} tone={chip1.tone} /> : null}
        </div>
        <div className={`worldModuleCard__chipSlot ${hasChip2 ? '' : 'worldModuleCard__chipSlot--empty'}`}>
          {chip2 ? <WorldRouteChip key={chip2.kind} kind={chip2.kind} tone={chip2.tone} /> : null}
        </div>
      </div>
      <div className="worldModuleCard__cta">
        {cta ?? (
          <button type="button" className="worldScreenModuleButton worldScreenModuleButton--subtle" onClick={() => onOpen(moduleKey)}>
            {openLabel}
          </button>
        )}
      </div>
    </article>
  );
}
