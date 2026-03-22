import classNames from 'classnames';
import { useMemo, useState } from 'react';

import type { CraftPromptState } from '../../systems/crafting/craftingTypes.js';

interface AssistedPromptCardProps {
  prompt: CraftPromptState;
  now: number;
  onComplete: () => void;
}

export function AssistedPromptCard({ prompt, now, onComplete }: AssistedPromptCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const available = prompt.status === 'AVAILABLE';
  const remainingSec = useMemo(() => Math.max(0, Math.ceil((prompt.expiresAtMs - now) / 1000)), [now, prompt.expiresAtMs]);

  const title =
    prompt.ui?.title ?? (prompt.type === 'ADD_CATALYST' ? 'Add catalyst to the mix' : 'Stabilize the flame');
  const body =
    prompt.ui?.body ??
    (prompt.type === 'ADD_CATALYST'
      ? 'Drag the catalyst into the cauldron before the window closes for a small bonus.'
      : 'Click to stabilize within the window for a small bonus. Ignoring has no penalty.');

  const handleComplete = () => {
    if (!available) return;
    onComplete();
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    if (!available) return;
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    if (data && data !== prompt.id) return;
    setIsDragging(false);
    handleComplete();
  };

  const handleDragStart: React.DragEventHandler<HTMLDivElement> = (event) => {
    if (!available) return;
    event.dataTransfer?.setData('text/plain', prompt.id);
    setIsDragging(true);
  };

  const handleDragEnd: React.DragEventHandler<HTMLDivElement> = () => {
    setIsDragging(false);
  };

  return (
    <div className={'craftingPromptCard'}>
      <div className={'craftingPromptTitle'}>{title}</div>
      <div className={'craftingPromptBody'}>{body}</div>
      <div className={'craftingPromptCountdown'}>{remainingSec}s remaining</div>

      {prompt.type === 'ADD_CATALYST' ? (
        <div className={'catalystInteraction'}>
          <div
            className={classNames('catalystDragChip', { 'catalystDragChip--disabled': !available })}
            draggable={available}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            role="button"
            tabIndex={0}
            onClick={handleComplete}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleComplete();
              }
            }}
          >
            Catalyst
          </div>
          <div
            className={classNames('catalystDropZone', {
              'catalystDropZone--ready': available,
              'catalystDropZone--active': isDragging && available,
            })}
            onDragOver={(event) => {
              if (available) {
                event.preventDefault();
              }
            }}
            onDrop={handleDrop}
          >
            Drop into cauldron
          </div>
          <div className={'craftingPromptActions'}>
            <button
              className={`worldScreenModuleButton ${available ? 'worldScreenModuleButton--active' : ''}`}
              onClick={handleComplete}
              disabled={!available}
            >
              Add catalyst
            </button>
          </div>
        </div>
      ) : (
        <div className={'craftingPromptActions'}>
          <button
            className={`worldScreenModuleButton ${available ? 'worldScreenModuleButton--active' : ''}`}
            onClick={handleComplete}
            disabled={!available}
          >
            Stabilize
          </button>
        </div>
      )}
    </div>
  );
}
