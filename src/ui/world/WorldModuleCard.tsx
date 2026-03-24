import type { ReactNode } from 'react';
import type { LiveWorldModuleKey } from '../../content/types.js';
import type { WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
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
  return (
    <article className={`worldModuleCard ${active ? 'worldModuleCard--active' : ''}`}>
      <div className="worldModuleCard__header">
        <div className="worldModuleCard__title">{moduleName}</div>
        {active ? <div className="worldModuleCard__activeBadge">Active</div> : null}
      </div>
      <div className="worldModuleCard__tag">{roleTag}</div>
      <p className="worldModuleCard__when">{bestUsedWhen}</p>
      <ul className="worldModuleCard__outputs">
        {outputs.slice(0, 2).map((output) => (
          <li key={output}>{output}</li>
        ))}
      </ul>
      {chips.length > 0 ? (
        <div className="worldModuleCard__chips">
          {chips.slice(0, 2).map((chip) => <WorldRouteChip key={chip.kind} kind={chip.kind} tone={chip.tone} />)}
        </div>
      ) : null}
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
