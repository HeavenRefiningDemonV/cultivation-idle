import { memo } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatorySurfaceV1,
  StatusObservatoryVisualState,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { deepEqualProps } from './fx/memoProps.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { ObservatoryDiscMedallion, type ObservatoryDiscVariant } from './ObservatoryDiscMedallion.js';

/* W6-decorative chrome — the data-visual-state attribute, the __stamp text, and the
   goal block remain the truth; this far-right wax chop is a redundant state signal. */
const LIFE_DECREE_SEAL: Record<string, { chars: string; variant: 'cinnabar' | 'jade' }> = {
  blocked: { chars: '順遂', variant: 'cinnabar' },
  healthy: { chars: '順遂', variant: 'jade' },
  postFailure: { chars: '敗', variant: 'cinnabar' },
  prestigePressure: { chars: '轉生', variant: 'cinnabar' },
  contentCap: { chars: '待續', variant: 'jade' },
  unknown: { chars: '順遂', variant: 'cinnabar' },
};

function lifeDecreeSeal(visualState: string): { chars: string; variant: 'cinnabar' | 'jade' } {
  return LIFE_DECREE_SEAL[visualState] ?? LIFE_DECREE_SEAL.unknown;
}

/* W6-decorative gold-disc glyphs keyed on data-decree-field; the tile label is the
   truth. Only the seven element tiles map; goal/gap/action tiles render no medallion. */
const DECREE_TILE_GLYPH: Record<string, string> = {
  'realm-stage': '界',
  city: '城',
  path: '道',
  'heart-law': '法',
  'spirit-root': '根',
  focus: '衡',
  breath: '息',
};

interface StatusLifeDecreeScrollProps {
  surface: StatusObservatorySurfaceV1['lifeDecree'];
  visualState: StatusObservatoryVisualState;
  currentPath: StatusObservatorySurfaceV1['meta']['currentPath'];
  onAction?: (action: StatusLedgerActionSurface) => void;
}

interface DecreeTileProps {
  field: string;
  label: string;
  value: string | null;
  detail?: string | null;
  tone?: string | null;
  testId?: string;
  /** Artifact goal-row lead glyph: ▲ Next Goal / ! Main Bottleneck / ↗ route. */
  leadGlyph?: string | null;
}

function DecreeTile({ field, label, value, detail, tone, testId, leadGlyph }: DecreeTileProps) {
  const glyph = DECREE_TILE_GLYPH[field] ?? null;
  const medallionVariant: ObservatoryDiscVariant = tone === 'danger' ? 'cinnabar' : 'gold';
  return (
    <div className="statusLifeDecree__tile" data-testid={testId} data-decree-field={field} data-tone={tone ?? 'neutral'}>
      {glyph ? (
        <ObservatoryDiscMedallion glyph={glyph} variant={medallionVariant} className="statusLifeDecree__medallion" />
      ) : null}
      {leadGlyph ? (
        <span className="statusLifeDecree__goalGlyph" aria-hidden="true">{leadGlyph}</span>
      ) : null}
      <span className="statusLifeDecree__tileText">
        <span className="statusLifeDecree__label">{label}</span>
        <strong className="statusLifeDecree__value">{value ?? 'Unavailable'}</strong>
        {detail ? <small className="statusLifeDecree__detail">{detail}</small> : null}
      </span>
    </div>
  );
}

function DecreeAction({
  action,
  onAction,
}: {
  action: StatusLedgerActionSurface | null;
  onAction?: (action: StatusLedgerActionSurface) => void;
}) {
  if (!action) {
    return (
      <div className="statusLifeDecree__tile statusLifeDecree__route" data-decree-field="primary-action" data-tone="muted">
        <span className="statusLifeDecree__label">Primary Action</span>
        <strong className="statusLifeDecree__value">No action available</strong>
      </div>
    );
  }

  const disabled = action.disabled || !onAction;
  const title = action.disabled ? action.disabledReason ?? action.detail : action.detail;

  return (
    <div className="statusLifeDecree__tile statusLifeDecree__route" data-decree-field="primary-action" data-tone={action.tone}>
      <span className="statusLifeDecree__goalGlyph" aria-hidden="true">↗</span>
      <span className="statusLifeDecree__label">Primary Action</span>
      <button
        type="button"
        className="statusObservatoryAction"
        data-tone={action.tone}
        disabled={disabled}
        aria-disabled={disabled ? 'true' : undefined}
        title={title}
        onClick={() => {
          if (!action.disabled && onAction) onAction(action);
        }}
      >
        <strong>{action.label}</strong>
        <small>{action.destinationLabel}</small>
      </button>
      {action.disabled && action.disabledReason ? (
        <small className="statusLifeDecree__detail">{action.disabledReason}</small>
      ) : null}
    </div>
  );
}

export const StatusLifeDecreeScroll = memo(StatusLifeDecreeScrollBase, deepEqualProps);

function StatusLifeDecreeScrollBase({
  surface,
  visualState,
  currentPath,
  onAction,
}: StatusLifeDecreeScrollProps) {
  const { hero } = surface;
  const seal = lifeDecreeSeal(visualState);

  return (
    <header
      className="statusObservatoryLifeDecree statusLifeDecree"
      data-testid="status-ledger-hero"
      data-surface-testid={surface.rootTestId}
      data-visual-state={visualState}
      data-current-path={currentPath ?? 'none'}
      aria-label={surface.title}
    >
      <svg
        className="statusLifeDecree__rollerCap statusLifeDecree__rollerCap--left"
        viewBox="0 0 10 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable={false}
      >
        <rect width="10" height="100" fill="url(#brassH)" />
      </svg>

      <svg
        className="statusLifeDecree__rollerCap statusLifeDecree__rollerCap--right"
        viewBox="0 0 10 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable={false}
      >
        <rect width="10" height="100" fill="url(#brassH)" />
      </svg>

      <span className="statusLifeDecree__verticalSeal" aria-hidden="true" />

      <div className="statusLifeDecree__main">
        <div className="statusLifeDecree__titleCopy">
          <div className="statusLifeDecree__titleHeading">
            {/* Artifact paints "Status: Living State Observatory" as the band title;
                surface.title ("Life Decree") remains the header aria-label. */}
            <h1>Status: Living State Observatory</h1>
            <InkWaxSeal
              className="statusLifeDecree__titleChop"
              chars="觀"
              size={26}
              rotation={-3}
              variant="cinnabar"
            />
          </div>
        </div>

        <div className="statusLifeDecree__chips">
          <DecreeTile
            field="realm-stage"
            label="Realm + Stage"
            value={hero.realmName}
            detail={hero.stageText}
            tone={hero.realmTone}
            testId="status-ledger-cultivation-base"
          />
          <DecreeTile field="city" label="City" value={hero.cityLabel} />
          <DecreeTile field="path" label="Path" value={hero.pathLabel} />
          <DecreeTile field="heart-law" label="Heart Law" value={hero.heartLawLabel} />
          <DecreeTile field="spirit-root" label="Spirit Root" value={hero.spiritRootLabel} tone={hero.spiritRoot.tone} />
          <DecreeTile field="focus" label="Focus" value={hero.focusLabel} />
          <DecreeTile field="breath" label="Breath" value={hero.breathLabel} />
        </div>
      </div>

      <div className="statusLifeDecree__goal" data-state={visualState}>
        <DecreeTile field="next-goal" label="Next Goal" value={hero.nextMajorGoalLabel} detail={hero.nextMajorGoalDetail} leadGlyph="▲" />
        <DecreeTile field="main-bottleneck" label="Main Bottleneck" value={hero.mainBottleneckLabel} detail={hero.mainBottleneckDetail} tone={hero.mainBottleneckTone} leadGlyph="!" />
        <DecreeAction action={hero.primaryAction} onAction={onAction} />
      </div>

      <InkWaxSeal
        className="statusLifeDecree__stateSeal"
        chars={seal.chars}
        size={44}
        rotation={-4}
        variant={seal.variant}
      />
    </header>
  );
}
