import type { ReactNode } from 'react';
import type { LiveWorldModuleKey } from '../../content/types.js';
import type { WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
import { OverlaySwash, SelectionHalo, useNoLayoutShiftState } from '../chrome/index.js';
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
  previewed?: boolean;
  recommended?: boolean;
  onPreview?: (moduleKey: LiveWorldModuleKey | null) => void;
  onOpen: (moduleKey: LiveWorldModuleKey) => void;
  openLabel: string;
  cta?: ReactNode;
}) {
  const {
    moduleKey,
    moduleName,
    roleTag,
    bestUsedWhen,
    outputs,
    chips = [],
    active = false,
    previewed = false,
    recommended = false,
    onPreview,
    onOpen,
    openLabel,
    cta,
  } = props;

  const noShift = useNoLayoutShiftState({
    selected: active || previewed,
    active,
    recommended,
    reserveBadgeSlot: true,
    reserveActionSlot: true,
  });

  return (
    <article
      className={`worldModuleCard ${noShift.guardClassName} ${active ? 'worldModuleCard--active' : ''} ${previewed ? 'worldModuleCard--previewed' : ''} ${recommended ? 'worldModuleCard--recommended' : ''}`}
      {...noShift.dataAttrs}
      onMouseEnter={() => onPreview?.(moduleKey)}
      onMouseLeave={() => onPreview?.(null)}
      onFocus={() => onPreview?.(moduleKey)}
      onBlur={() => onPreview?.(null)}
    >
      <OverlaySwash active={recommended} tone="recommendation" variant="blockFancy" placement="fill" className="worldModuleCard__swash" />
      <SelectionHalo active={active || previewed} tone={previewed ? 'recommendation' : 'default'} variant="panel" inset="tight" className="worldModuleCard__halo" />
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
