import type { ReactNode } from 'react';

import type { IconId } from '../../icons/index.js';
import { SafeStatusIcon } from './StatusLedgerRows.js';

interface StatusLedgerCardProps {
  title: string;
  modifier: string;
  icon?: IconId;
  children: ReactNode;
  className?: string;
  subtitle?: string | null;
  testId?: string;
}

export function StatusLedgerCard({
  title,
  modifier,
  icon = 'recordSlip',
  children,
  className,
  subtitle = null,
  testId,
}: StatusLedgerCardProps) {
  return (
    <section
      className={[
        'statusLedgerCard',
        `statusLedgerCard--${modifier}`,
        className ?? '',
      ].filter(Boolean).join(' ')}
      data-testid={testId ?? `status-ledger-card-${modifier}`}
      aria-label={title}
    >
      <header className="statusLedgerCard__heading">
        <span className="statusLedgerCard__icon" aria-hidden="true">
          <SafeStatusIcon icon={icon} size={18} />
        </span>
        <span className="statusLedgerCard__titleBlock">
          <h2>{title}</h2>
          {subtitle ? <span>{subtitle}</span> : null}
        </span>
      </header>
      <div className="statusLedgerCard__body">{children}</div>
    </section>
  );
}

