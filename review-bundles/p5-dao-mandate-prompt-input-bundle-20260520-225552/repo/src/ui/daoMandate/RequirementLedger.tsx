import { useId } from 'react';
import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateRoute,
  DaoRequirementBucket,
  DaoRequirementLedger,
  DaoRequirementRow,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import {
  getDaoMandateMotionClassName,
  getDaoRequirementBucketLabel,
  getDaoRequirementStateLabel,
  sanitizeDomIdPart,
} from './daoMandateUiFormatters.js';
import './RequirementLedger.scss';

export interface RequirementLedgerProps {
  ledger: DaoRequirementLedger;
  title?: string;
  subtitle?: string;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'compact' | 'default' | 'dense';
  showEmptyBuckets?: boolean;
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

type BucketConfig = {
  bucket: DaoRequirementBucket;
  rows: (ledger: DaoRequirementLedger) => DaoRequirementRow[];
};

const BUCKETS: readonly BucketConfig[] = [
  { bucket: 'hard_gate', rows: (ledger) => ledger.hardGates },
  { bucket: 'readiness_floor', rows: (ledger) => ledger.readinessFloors },
  { bucket: 'support_reserve', rows: (ledger) => ledger.supportReserves },
  { bucket: 'source_route', rows: (ledger) => ledger.sourceRoutes },
  { bucket: 'optional_optimization', rows: (ledger) => ledger.optionalOptimizations },
  { bucket: 'recent_omen', rows: (ledger) => ledger.recentOmens },
];

function allRows(ledger: DaoRequirementLedger): DaoRequirementRow[] {
  return BUCKETS.flatMap((config) => config.rows(ledger));
}

function shouldShowLine(profile: DaoMandateGuidanceProfile, variant: RequirementLedgerProps['variant'], lineKind: 'source' | 'proof'): boolean {
  if (profile === 'sealed' || variant === 'compact') return false;
  if (lineKind === 'proof') return profile === 'jade';
  return profile === 'jade' || variant === 'default';
}

function RequirementLedgerRowView({
  row,
  profile,
  variant,
  motionMode,
  onRouteAction,
}: {
  row: DaoRequirementRow;
  profile: DaoMandateGuidanceProfile;
  variant: RequirementLedgerProps['variant'];
  motionMode: DaoMandateEffectiveMotionMode;
  onRouteAction?: DaoMandateRouteActionHandler;
}) {
  const route: DaoMandateRoute | null = row.route;

  return (
    <li
      className={classNames(
        'daoRequirementLedgerRow',
        `daoRequirementLedgerRow--${row.tone}`,
        `daoRequirementLedgerRow--state-${row.state}`,
      )}
    >
      <div className="daoRequirementLedgerRow__seal">
        <DaoMandateStatusSeal
          tone={row.tone}
          label={getDaoRequirementStateLabel(row.state)}
          state={row.state}
          compact
          motionMode={motionMode}
        />
      </div>
      <div className="daoRequirementLedgerRow__main">
        <strong className="daoRequirementLedgerRow__label">{row.label}</strong>
        <span className="daoRequirementLedgerRow__detail">{row.detail}</span>
        {shouldShowLine(profile, variant, 'source') && row.sourceLine ? (
          <span className="daoRequirementLedgerRow__source">{row.sourceLine}</span>
        ) : null}
        {shouldShowLine(profile, variant, 'proof') && row.proofLine ? (
          <span className="daoRequirementLedgerRow__proof">{row.proofLine}</span>
        ) : null}
      </div>
      <div className="daoRequirementLedgerRow__value">
        <span className="daoRequirementLedgerRow__valueLabel">Current</span>
        <span>{row.currentLabel ?? '-'}</span>
      </div>
      <div className="daoRequirementLedgerRow__value">
        <span className="daoRequirementLedgerRow__valueLabel">Target</span>
        <span>{row.targetLabel ?? '-'}</span>
      </div>
      <div className="daoRequirementLedgerRow__action">
        {route ? (
          <DaoMandateRouteButton
            route={route}
            onRouteAction={onRouteAction}
            variant="secondary"
            size="compact"
          />
        ) : (
          <span className="daoRequirementLedgerRow__reservedAction" aria-hidden="true" />
        )}
      </div>
    </li>
  );
}

export function RequirementLedger({
  ledger,
  title = 'Mandate Ledger',
  subtitle,
  profile = 'elder',
  variant = 'default',
  showEmptyBuckets = false,
  onRouteAction,
  motionMode = 'medium',
  className,
}: RequirementLedgerProps) {
  const reactId = useId();
  const titleId = `dao-requirement-ledger-${sanitizeDomIdPart(title)}-${sanitizeDomIdPart(reactId)}`;
  const rows = allRows(ledger);

  return (
    <section
      className={classNames(
        'daoRequirementLedger',
        `daoRequirementLedger--${variant}`,
        `daoRequirementLedger--profile-${profile}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-labelledby={titleId}
    >
      <header className="daoRequirementLedger__header">
        <div>
          <span className="daoRequirementLedger__eyebrow">Requirement record</span>
          <h3 id={titleId} className="daoRequirementLedger__title">{title}</h3>
        </div>
        {subtitle ? <p className="daoRequirementLedger__subtitle">{subtitle}</p> : null}
      </header>

      {rows.length === 0 ? (
        <div className="daoRequirementLedger__empty">No visible Mandate ledger rows.</div>
      ) : (
        <div className="daoRequirementLedger__buckets">
          {BUCKETS.map((config) => {
            const bucketRows = config.rows(ledger);
            if (bucketRows.length === 0 && (variant === 'compact' || !showEmptyBuckets)) return null;

            return (
              <section
                key={config.bucket}
                className={classNames('daoRequirementLedger__bucket', `daoRequirementLedger__bucket--${config.bucket}`)}
                aria-label={getDaoRequirementBucketLabel(config.bucket)}
              >
                <div className="daoRequirementLedger__bucketHeader">
                  <span>{getDaoRequirementBucketLabel(config.bucket)}</span>
                  <span>{bucketRows.length}</span>
                </div>
                {bucketRows.length > 0 ? (
                  <ul className="daoRequirementLedger__rows">
                    {bucketRows.map((row) => (
                      <RequirementLedgerRowView
                        key={row.id}
                        row={row}
                        profile={profile}
                        variant={variant}
                        motionMode={motionMode}
                        onRouteAction={onRouteAction}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="daoRequirementLedger__emptyBucket">No visible rows in this bucket.</div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
