import type { CSSProperties } from 'react';
import type { StatusLedgerFactRow, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusReserveJars } from './StatusReserveJars.js';

export interface StatusBuildPreparationScalesProps {
  surface: StatusObservatorySurfaceV1['buildPreparation'];
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

type SupportState = 'stable' | 'info' | 'warning' | 'danger' | 'muted';

function toneToSupportState(tone: StatusLedgerTone): SupportState {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning' || tone === 'gold') return 'warning';
  if (tone === 'muted') return 'muted';
  if (tone === 'success' || tone === 'jade') return 'stable';
  return 'info';
}

function scaleState(surface: StatusObservatorySurfaceV1['buildPreparation']): SupportState {
  if (surface.scales.lowStateRows.some((row) => row.tone === 'danger')) return 'danger';
  if (surface.scales.lowStateRows.length > 0) return 'warning';
  const buildState = toneToSupportState(surface.scales.build.tone);
  const prepState = toneToSupportState(surface.scales.preparation.tone);
  if (buildState === 'danger' || prepState === 'danger') return 'danger';
  if (buildState === 'warning' || prepState === 'warning') return 'warning';
  if (buildState === 'muted' && prepState === 'muted') return 'muted';
  if (buildState === 'stable' && prepState === 'stable') return 'stable';
  return 'info';
}

function scaleTilt(surface: StatusObservatorySurfaceV1['buildPreparation']): number {
  const lowRows = surface.scales.lowStateRows;
  const dangerCount = lowRows.filter((row) => row.tone === 'danger').length;
  if (dangerCount > 0) return -8;
  if (lowRows.length > 0) return -4;
  return 0;
}

function uniqueWeightRows(surface: StatusObservatorySurfaceV1['buildPreparation']): StatusLedgerFactRow[] {
  const byId = new Map<string, StatusLedgerFactRow>();
  for (const row of [...surface.scales.lowStateRows, ...surface.rows]) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return [...byId.values()].slice(0, 6);
}

function styleForScale(surface: StatusObservatorySurfaceV1['buildPreparation']): CSSProperties {
  return { '--scale-tilt': `${scaleTilt(surface)}deg` } as CSSProperties;
}

function stateStamp(state: SupportState): string {
  if (state === 'danger') return 'Floor broken';
  if (state === 'warning') return 'Needs support';
  if (state === 'muted') return 'Source dim';
  if (state === 'stable') return 'Balanced';
  return 'Measured';
}

export function StatusBuildPreparationScales({ surface, onOpenDrawer }: StatusBuildPreparationScalesProps) {
  const state = scaleState(surface);
  const weights = uniqueWeightRows(surface);
  const firstLowRow = surface.scales.lowStateRows[0] ?? null;
  const tilt = scaleTilt(surface);
  const heavyPan = tilt < 0 ? 'build' : tilt > 0 ? 'prep' : 'none';

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryPreparation statusBuildPreparationScales"
      data-testid="status-ledger-build-preparation"
      data-surface-testid={surface.rootTestId}
      data-s7-instrument="build-preparation-scales"
      data-scale-state={state}
      style={styleForScale(surface)}
      aria-label={`Build and Preparation Scales. ${stateStamp(state)}. ${surface.rows.length} exact rows available.`}
    >
      <div className="statusObservatoryInstrument__header statusBuildPreparationScales__header">
        <span className="statusObservatoryInstrument__sigil" aria-hidden="true" />
        <div>
          <h2>{surface.scales.title}</h2>
          <p>{surface.scales.fulcrumLabel}</p>
        </div>
        <span className="statusBuildPreparationScales__stamp" data-scale-state={state}>
          {stateStamp(state)}
        </span>
      </div>

      <div className="statusBuildPreparationScales__apparatus" aria-label="Readiness comparison scale">
        <svg
          className="statusBuildPreparationScales__rig"
          viewBox="0 0 200 200"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable={false}
        >
          <ellipse cx="100" cy="184" rx="44" ry="8" fill="url(#brass)" />
          <ellipse className="statusBuildPreparationScales__rigShadow" cx="100" cy="182" rx="26" ry="4" />
          <rect x="96" y="58" width="8" height="126" fill="url(#brassH)" />
          <circle cx="100" cy="58" r="7" fill="url(#goldRad)" />
          <g className="statusBuildPreparationScales__rigArm">
            <line x1="38" y1="58" x2="162" y2="58" stroke="url(#brassH)" strokeWidth="6" strokeLinecap="round" />
            <line className="statusBuildPreparationScales__rigCord" x1="40" y1="58" x2="32" y2="96" />
            <line className="statusBuildPreparationScales__rigCord" x1="40" y1="58" x2="48" y2="96" />
            <path d="M22 96 Q40 118 58 96 Z" fill="url(#brass)" />
            <ellipse cx="40" cy="96" rx="18" ry="3.4" fill="url(#brass)" />
            <line className="statusBuildPreparationScales__rigCord" x1="160" y1="58" x2="152" y2="96" />
            <line className="statusBuildPreparationScales__rigCord" x1="160" y1="58" x2="168" y2="96" />
            <path d="M142 96 Q160 118 178 96 Z" fill="url(#brass)" />
            <ellipse cx="160" cy="96" rx="18" ry="3.4" fill="url(#brass)" />
            {heavyPan === 'build' ? (
              <>
                <ellipse cx="40" cy="100" rx="11" ry="4" fill="url(#goldRad)" />
                <ellipse cx="40" cy="93.5" rx="9" ry="3.4" fill="url(#goldRad)" />
              </>
            ) : null}
            {heavyPan === 'prep' ? (
              <>
                <ellipse cx="160" cy="100" rx="11" ry="4" fill="url(#goldRad)" />
                <ellipse cx="160" cy="93.5" rx="9" ry="3.4" fill="url(#goldRad)" />
              </>
            ) : null}
          </g>
        </svg>
        <div className="statusBuildPreparationScales__beam" aria-hidden="true">
          <span />
        </div>

        <div className="statusBuildPreparationScales__pan statusBuildPreparationScales__pan--build" data-tone={surface.scales.build.tone}>
          <span>{surface.scales.build.title}</span>
          <strong>{surface.scales.build.headline}</strong>
          <small>{surface.scales.build.tiles.length} seals</small>
        </div>

        <div className="statusBuildPreparationScales__fulcrum">
          <span>{surface.scales.fulcrumLabel}</span>
          <strong>{surface.scales.title}</strong>
        </div>

        <div className="statusBuildPreparationScales__pan statusBuildPreparationScales__pan--prep" data-tone={surface.scales.preparation.tone}>
          <span>{surface.scales.preparation.title}</span>
          <strong>{surface.scales.preparation.headline}</strong>
          <small>{surface.scales.preparation.tiles.length} seals</small>
        </div>
      </div>

      <div className="statusBuildPreparationScales__weights" aria-label="Top readiness tablets">
        {weights.map((row) => (
          <button
            key={row.id}
            type="button"
            className="statusBuildPreparationScales__weight"
            data-tone={row.tone}
            aria-label={`${row.label}: ${row.value ?? row.detail}. ${row.detail}. Opens Build and Preparation ledger.`}
            onClick={() => onOpenDrawer?.({ kind: 'buildPreparation', sourceId: row.id })}
          >
            <span>{row.label}</span>
            <strong>{row.value ?? row.detail}</strong>
          </button>
        ))}
      </div>

      {firstLowRow ? (
        <button
          type="button"
          className="statusBuildPreparationScales__warning"
          data-tone={firstLowRow.tone}
          aria-label={`${firstLowRow.label}. ${firstLowRow.detail}. Opens exact Build and Preparation ledger.`}
          onClick={() => onOpenDrawer?.({ kind: 'buildPreparation', sourceId: firstLowRow.id })}
        >
          <span>Main Gap</span>
          <strong>{firstLowRow.label}</strong>
          <small>{firstLowRow.value ?? firstLowRow.detail}</small>
        </button>
      ) : null}

      <StatusReserveJars
        jars={surface.reserveJars}
        rows={surface.rows}
        onOpenDrawer={onOpenDrawer}
      />

      <button
        type="button"
        className="statusBuildPreparationScales__openLedger"
        aria-haspopup="dialog"
        onClick={() => onOpenDrawer?.({ kind: 'buildPreparation' })}
      >
        <span>Open Build / Prep Ledger</span>
        <strong>{surface.rows.length} exact rows</strong>
      </button>
    </section>
  );
}
