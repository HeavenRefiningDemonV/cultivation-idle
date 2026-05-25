import type { ReactNode } from 'react';

import type {
  StatusDoctrineTileSurface,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { SafeStatusIcon, StatusLedgerRichText } from './StatusLedgerRows.js';

export function StatusDoctrineTile({
  tile,
  compact = false,
}: {
  tile: StatusDoctrineTileSurface;
  compact?: boolean;
}) {
  return (
    <article
      className={[
        'statusDoctrineTile',
        `statusDoctrineTile--${tile.tone}`,
        tile.accent ? `statusDoctrineTile--${tile.accent}` : '',
        compact ? 'statusDoctrineTile--compact' : '',
      ].filter(Boolean).join(' ')}
      title={`${tile.label}: ${tile.value}. ${tile.detail}`}
    >
      <span className="statusDoctrineTile__icon" aria-hidden="true">
        <SafeStatusIcon icon={tile.icon} size={compact ? 15 : 18} />
      </span>
      <span className="statusDoctrineTile__copy">
        <span className="statusDoctrineTile__label">{tile.label}</span>
        <strong><StatusLedgerRichText text={tile.value} compact /></strong>
        {!compact ? <small><StatusLedgerRichText text={tile.detail} /></small> : null}
      </span>
    </article>
  );
}

export function StatusDoctrineTileGrid({
  tiles,
  compact = false,
  children,
}: {
  tiles: StatusDoctrineTileSurface[];
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="statusDoctrineTileGrid">
      {tiles.map((tile) => (
        <StatusDoctrineTile key={tile.id} tile={tile} compact={compact} />
      ))}
      {children}
    </div>
  );
}
