import { Fragment, type ReactNode } from 'react';

import { GameIcon, ICONS, type IconId } from '../../icons/index.js';
import type {
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerMilestoneNode,
  StatusLedgerRequirementRow,
  StatusLedgerTone,
} from '../../../systems/ui/status/statusLedgerTypes.js';

function safeIconId(icon: IconId | null | undefined): IconId {
  return icon && Object.hasOwn(ICONS, icon) ? icon : 'recordSlip';
}

const STATUS_HIGHLIGHT_TOKEN_PATTERN =
  /\b(Safety Net|Heart Law|Spirit Root|Cultivation Base|Mission Requirements|Qi Condensation|Foundation Establishment|Qi|Foundation|Gate|Apothecary|Healing|Pouch|Forge|Weapon|Refine|Temper|Rune|Rank|Mastery|Technique|Techniques|Loadout|Doctrine|Bounty|Expedition|Prestige|Path|Focus|Breath|Stability|Merit|Spirit Stones|City|Pinewind Hamlet|Manual Pavilion|Outskirts|Ruins|Fire|Water|Wood|Metal|Earth)\b/g;

const STATUS_DISPLAY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bBAD\b/g, 'Bad'],
  [/\bBLOCKED\b/g, 'Blocked'],
  [/\bAPOTHECARY\b/g, 'Apothecary'],
  [/\bTECHNIQUES\b/g, 'Techniques'],
  [/\bCULTIVATION\b/g, 'Cultivation'],
  [/\bREADINESS\b/g, 'Readiness'],
  [/\bCURRENT WORK\b/g, 'Current Work'],
  [/\bHEART LAW\b/g, 'Heart Law'],
];

export function SafeStatusIcon({ icon, size = 18 }: { icon?: IconId | null; size?: number }) {
  return <GameIcon icon={safeIconId(icon)} size={size} />;
}

function statusToneLabel(tone: StatusLedgerTone): string {
  if (tone === 'danger') return 'Blocked';
  if (tone === 'warning') return 'Needs work';
  if (tone === 'gold') return 'Important';
  if (tone === 'success' || tone === 'jade') return 'Met';
  if (tone === 'muted') return 'Idle';
  return 'Info';
}

function normalizeShortDisplay(value: string | null | undefined): string | null {
  if (!value) return null;

  return STATUS_DISPLAY_REPLACEMENTS.reduce(
    (output, [pattern, replacement]) => output.replace(pattern, replacement),
    value.replace(/\s+/g, ' ').trim(),
  );
}

function statusRichClassName(term: string): string {
  const lower = term.toLowerCase();

  if (lower === 'qi' || lower === 'foundation' || lower === 'gate' || lower === 'heart law') {
    return 'statusLedgerRich--cultivation';
  }

  if (lower === 'fire') return 'statusLedgerRich--element-fire';
  if (lower === 'water') return 'statusLedgerRich--element-water';
  if (lower === 'wood') return 'statusLedgerRich--element-wood';
  if (lower === 'metal') return 'statusLedgerRich--element-metal';
  if (lower === 'earth') return 'statusLedgerRich--element-earth';

  if (lower === 'apothecary' || lower === 'healing' || lower === 'pouch' || lower === 'merit' || lower === 'spirit stones') {
    return 'statusLedgerRich--preparation';
  }

  if (lower === 'forge' || lower === 'weapon' || lower === 'refine' || lower === 'temper' || lower === 'rune') {
    return 'statusLedgerRich--forge';
  }

  if (
    lower === 'technique' ||
    lower === 'techniques' ||
    lower === 'loadout' ||
    lower === 'doctrine' ||
    lower === 'spirit root' ||
    lower === 'path' ||
    lower === 'focus' ||
    lower === 'breath' ||
    lower === 'mastery' ||
    lower === 'rank'
  ) {
    return 'statusLedgerRich--doctrine';
  }

  return 'statusLedgerRich--support';
}

export function StatusLedgerRichText({ text, compact = false }: { text: string; compact?: boolean }) {
  const normalized = normalizeShortDisplay(text) ?? '';
  const matches = Array.from(normalized.matchAll(STATUS_HIGHLIGHT_TOKEN_PATTERN));

  if (matches.length === 0) return <>{normalized}</>;

  let cursor = 0;

  return (
    <>
      {matches.map((match, index) => {
        const value = match[0];
        const start = match.index ?? 0;
        const before = normalized.slice(cursor, start);
        cursor = start + value.length;

        return (
          <Fragment key={`${value}-${start}-${index}`}>
            {before}
            <span className={`statusLedgerRich ${statusRichClassName(value)} ${compact ? 'statusLedgerRich--compact' : ''}`}>
              {value}
            </span>
          </Fragment>
        );
      })}
      {normalized.slice(cursor)}
    </>
  );
}

function StatusChip({
  children,
  kind,
  tone,
  title,
}: {
  children: ReactNode;
  kind: 'value' | 'gap' | 'priority' | 'source' | 'module' | 'route' | 'disabled';
  tone?: StatusLedgerTone;
  title?: string | null;
}) {
  return (
    <span
      className={[
        'statusLedgerChip',
        `statusLedgerChip--${kind}`,
        tone ? `statusLedgerChip--${tone}` : '',
      ].filter(Boolean).join(' ')}
      title={title ?? (typeof children === 'string' ? children : undefined)}
    >
      {children}
    </span>
  );
}

function StatusInlineChips({ children }: { children: ReactNode }) {
  return <span className="statusLedgerInlineChips">{children}</span>;
}

export function StatusRowSeal({
  tone,
  icon,
  size = 16,
}: {
  tone: StatusLedgerTone;
  icon?: IconId | null;
  size?: number;
}) {
  const label = statusToneLabel(tone);

  return (
    <span className={`statusLedgerRowSeal statusLedgerRowSeal--${tone}`} aria-label={label} title={label}>
      <SafeStatusIcon icon={icon} size={size} />
    </span>
  );
}

export function StatusToneBadge({ tone, label }: { tone: StatusLedgerTone; label?: string }) {
  return (
    <span
      className={`statusLedgerToneBadge statusLedgerToneBadge--${tone}`}
      aria-label={label ?? tone}
      title={label ?? tone}
    />
  );
}

export function StatusActionButton({
  action,
  onAction,
  compact = false,
}: {
  action: StatusLedgerActionSurface;
  onAction: (action: StatusLedgerActionSurface) => void;
  compact?: boolean;
}) {
  const disabledTitle = action.disabled ? action.disabledReason ?? action.detail : action.detail;
  return (
    <button
      type="button"
      className={[
        'statusLedgerActionButton',
        action.primary ? 'statusLedgerActionButton--primary' : '',
        compact ? 'statusLedgerActionButton--compact' : '',
      ].filter(Boolean).join(' ')}
      disabled={action.disabled}
      aria-disabled={action.disabled ? 'true' : undefined}
      title={disabledTitle}
      onClick={() => {
        if (!action.disabled) onAction(action);
      }}
    >
      {action.label}
    </button>
  );
}

function RowShell({
  id,
  tone,
  icon,
  children,
  action,
  onAction,
  compact,
  title,
}: {
  id: string;
  tone: StatusLedgerTone;
  icon: IconId;
  children: ReactNode;
  action?: StatusLedgerActionSurface | null;
  onAction: (action: StatusLedgerActionSurface) => void;
  compact?: boolean;
  title?: string;
}) {
  return (
    <article
      key={id}
      className={[
        'statusLedgerRow',
        `statusLedgerRow--${tone}`,
        compact ? 'statusLedgerRow--compact' : '',
      ].filter(Boolean).join(' ')}
      role="listitem"
      title={title}
    >
      <StatusRowSeal tone={tone} icon={icon} size={compact ? 14 : 16} />
      {children}
      {action ? <StatusActionButton action={action} onAction={onAction} compact /> : null}
    </article>
  );
}

export function StatusFactRows({
  rows,
  onAction,
  compact = false,
}: {
  rows: StatusLedgerFactRow[];
  onAction: (action: StatusLedgerActionSurface) => void;
  compact?: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <div className={`statusLedgerRows ${compact ? 'statusLedgerRows--compact' : ''}`} role="list">
      {rows.map((row) => {
        const label = normalizeShortDisplay(row.label) ?? row.label;
        const value = normalizeShortDisplay(row.value);
        const detail = normalizeShortDisplay(row.detail);
        const sourceLabel = normalizeShortDisplay(row.sourceLabel);

        return (
          <RowShell
            key={row.id}
            id={row.id}
            tone={row.tone}
            icon={row.icon}
            action={row.action}
            onAction={onAction}
            compact={compact}
            title={[label, value, detail].filter(Boolean).join(' - ')}
          >
            <span className="statusLedgerRow__copy">
              <span className="statusLedgerRow__topline">
                <span className="statusLedgerRow__label"><StatusLedgerRichText text={label} compact /></span>
                {value ? (
                  <StatusChip kind="value" tone={row.tone}>{value}</StatusChip>
                ) : null}
              </span>
              {detail ? (
                <span className="statusLedgerRow__detail" title={detail}>
                  <StatusLedgerRichText text={detail} />
                </span>
              ) : null}
              {!compact && sourceLabel ? (
                <StatusInlineChips>
                  <StatusChip kind="source">{sourceLabel}</StatusChip>
                </StatusInlineChips>
              ) : null}
            </span>
          </RowShell>
        );
      })}
    </div>
  );
}

export function StatusEmptyRow({
  row,
  onAction,
}: {
  row: StatusLedgerFactRow | null;
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  return row ? <StatusFactRows rows={[row]} onAction={onAction} /> : null;
}

export function StatusRequirementRows({
  rows,
  emptyState,
  onAction,
}: {
  rows: StatusLedgerRequirementRow[];
  emptyState: StatusLedgerFactRow | null;
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  if (rows.length === 0) return <StatusEmptyRow row={emptyState} onAction={onAction} />;

  return (
    <div className="statusLedgerRequirements" role="list">
      {rows.map((row) => {
        const label = normalizeShortDisplay(row.label) ?? row.label;
        const value = normalizeShortDisplay(row.value);
        const gap = normalizeShortDisplay(row.gapLabel);
        const priority = normalizeShortDisplay(row.priorityLabel);
        const source = normalizeShortDisplay(row.sourceModuleLabel);
        const detail = normalizeShortDisplay(row.detail);

        return (
          <article
            key={row.id}
            className={`statusLedgerRequirement statusLedgerRequirement--${row.tone}`}
            role="listitem"
            title={[label, priority, value, gap, source, detail].filter(Boolean).join(' - ')}
          >
            <StatusRowSeal tone={row.tone} icon={row.icon} size={16} />
            <span className="statusLedgerRequirement__copy">
              <span className="statusLedgerRequirement__topline">
                <span className="statusLedgerRequirement__label"><StatusLedgerRichText text={label} compact /></span>
                {priority ? <StatusChip kind="priority" tone={row.tone}>{priority}</StatusChip> : null}
              </span>
              <StatusInlineChips>
                {value ? <StatusChip kind="value" tone={row.tone}>{value}</StatusChip> : null}
                {gap && gap !== value ? <StatusChip kind="gap" tone={row.tone}>{gap}</StatusChip> : null}
                {source ? <StatusChip kind="module">{source}</StatusChip> : null}
              </StatusInlineChips>
              {detail ? (
                <span className="statusLedgerRequirement__detail" title={detail}>
                  <StatusLedgerRichText text={detail} />
                </span>
              ) : null}
            </span>
            {row.action ? <StatusActionButton action={row.action} onAction={onAction} compact /> : null}
          </article>
        );
      })}
    </div>
  );
}

export function StatusActionRows({
  rows,
  primary,
  emptyState,
  onAction,
}: {
  rows: StatusLedgerActionSurface[];
  primary?: StatusLedgerActionSurface | null;
  emptyState?: StatusLedgerFactRow | null;
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  const secondaryRows = primary ? rows.filter((row) => row.id !== primary.id) : rows;

  if (!primary && secondaryRows.length === 0) {
    return emptyState ? <StatusFactRows rows={[emptyState]} onAction={onAction} /> : null;
  }

  return (
    <div className="statusLedgerActionRows" role="list">
      {primary ? (
        <article className={`statusLedgerActionRow statusLedgerActionRow--primary statusLedgerActionRow--${primary.tone}`} role="listitem">
          <StatusRowSeal tone={primary.tone} icon="taskComplete" size={16} />
          <span className="statusLedgerActionRow__copy">
            <span className="statusLedgerActionRow__topline">
              <span className="statusLedgerActionRow__label"><StatusLedgerRichText text={primary.label} compact /></span>
              <StatusChip kind="route" tone={primary.tone}>{primary.destinationLabel}</StatusChip>
            </span>
            <span className="statusLedgerActionRow__detail" title={primary.detail}>
              <StatusLedgerRichText text={primary.detail} />
            </span>
            {primary.disabled && primary.disabledReason ? (
              <StatusChip kind="disabled" tone="danger">{primary.disabledReason}</StatusChip>
            ) : null}
          </span>
          <StatusActionButton action={primary} onAction={onAction} />
        </article>
      ) : null}

      {secondaryRows.map((action) => (
        <article key={action.id} className={`statusLedgerActionRow statusLedgerActionRow--${action.tone}`} role="listitem">
          <StatusRowSeal tone={action.tone} icon="inkChevronUp" size={14} />
          <span className="statusLedgerActionRow__copy">
            <span className="statusLedgerActionRow__topline">
              <span className="statusLedgerActionRow__label"><StatusLedgerRichText text={action.label} compact /></span>
              <StatusChip kind="route" tone={action.tone}>{action.destinationLabel}</StatusChip>
            </span>
            <span className="statusLedgerActionRow__detail" title={action.detail}>
              <StatusLedgerRichText text={action.detail} />
            </span>
            {action.disabled && action.disabledReason ? (
              <StatusChip kind="disabled" tone="danger">{action.disabledReason}</StatusChip>
            ) : null}
          </span>
          <StatusActionButton action={action} onAction={onAction} compact />
        </article>
      ))}
    </div>
  );
}

export function StatusMilestoneTrack({ nodes }: { nodes: StatusLedgerMilestoneNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <ol className="statusLedgerMilestoneTrack" aria-label="Milestone path">
      {nodes.map((node) => (
        <li key={node.id} className={`statusLedgerMilestoneNode statusLedgerMilestoneNode--${node.state}`}>
          <span className="statusLedgerMilestoneNode__dot" aria-hidden="true">
            <SafeStatusIcon icon={node.icon} size={14} />
          </span>
          <span className="statusLedgerMilestoneNode__copy">
            <span>{node.label}</span>
            <small>{node.detail}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
