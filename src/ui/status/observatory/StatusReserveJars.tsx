import type { CSSProperties } from 'react';
import type { StatusLedgerFactRow, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';

export interface StatusReserveJarsProps {
  jars: StatusObservatorySurfaceV1['buildPreparation']['reserveJars'];
  rows: StatusLedgerFactRow[];
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function jarFillFromText(value: string | null, tone: StatusLedgerTone): number {
  const raw = value ?? '';
  const percent = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent) return clamp(Number(percent[1]), 0, 100);

  const ratio = raw.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (ratio) {
    const current = Number(ratio[1]);
    const maximum = Math.max(1, Number(ratio[2]));
    return clamp((current / maximum) * 100, 0, 100);
  }

  if (tone === 'danger') return 18;
  if (tone === 'warning') return 36;
  if (tone === 'success' || tone === 'jade') return 78;
  if (tone === 'gold' || tone === 'info') return 58;
  return 42;
}

function jarKind(label: string): string {
  const normalized = label.toLowerCase();
  if (/merit/.test(normalized)) return 'merit-reserve';
  if (/spirit stone|stone/.test(normalized)) return 'spirit-stones';
  if (/medicine|pouch/.test(normalized)) return 'medicine-pouch';
  if (/fit/.test(normalized)) return 'pouch-fit';
  if (/heal|reserve/.test(normalized)) return 'healing-reserve';
  return 'reserve';
}

function toneLabel(tone: StatusLedgerTone): string {
  if (tone === 'danger') return 'Low';
  if (tone === 'warning') return 'Strained';
  if (tone === 'success' || tone === 'jade') return 'Healthy';
  if (tone === 'gold') return 'Sufficient';
  if (tone === 'muted') return 'Unknown';
  return 'Available';
}

function jarStyle(fill: number): CSSProperties {
  return { '--jar-fill': `${fill}%` } as CSSProperties;
}

/* W6-decorative Kai-ti label glyph keyed on the existing data-jar-kind; the jar
   label + value + state remain the truth. Unmapped kinds omit the glyph. */
const JAR_GLYPH: Record<string, string> = {
  'merit-reserve': '功',
  'spirit-stones': '石',
  'medicine-pouch': '藥',
  'pouch-fit': '契',
  'healing-reserve': '癒',
  reserve: '備',
};

export function StatusReserveJars({ jars, rows, onOpenDrawer }: StatusReserveJarsProps) {
  const exactRowCount = rows.length;

  return (
    <div
      className="statusReserveJars"
      data-testid="status-reserve-jars"
      data-s7-instrument="reserve-jars"
      data-reserve-count={jars.length}
      aria-label={`${jars.length} reserve jars. ${exactRowCount} exact build and reserve rows available.`}
    >
      <div className="statusReserveJars__shelf" aria-label="Physical reserve jar shelf">
        <svg
          className="statusReserveJars__plank"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable={false}
        >
          <rect x="0" y="0" width="100" height="100" fill="url(#plank)" />
        </svg>
        {jars.map((jar) => {
          const fill = jarFillFromText(jar.value, jar.tone);
          const state = toneLabel(jar.tone);
          const kind = jarKind(jar.label);

          return (
            <button
              key={jar.id}
              type="button"
              className="statusReserveJars__jar"
              data-tone={jar.tone}
              data-reserve-id={jar.id}
              data-jar-kind={kind}
              style={jarStyle(fill)}
              aria-label={`${jar.label}, ${state}, ${jar.value ?? jar.detail}. ${jar.detail}. Source ${jar.sourceLabel}. Opens exact reserve rows.`}
              onClick={() => onOpenDrawer?.({ kind: 'buildPreparation', sourceId: jar.id })}
            >
              <span className="statusReserveJars__glass" aria-hidden="true">
                <span className="statusReserveJars__liquid" />
                <svg
                  className="statusReserveJars__sheen"
                  viewBox="0 0 48 72"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable={false}
                >
                  <rect x="0" y="0" width="48" height="72" fill="url(#glass)" />
                </svg>
                <span className="statusReserveJars__shine" />
                {JAR_GLYPH[kind] ? <span className="statusReserveJars__glyph">{JAR_GLYPH[kind]}</span> : null}
                <svg
                  className="statusReserveJars__cork"
                  viewBox="0 0 48 16"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable={false}
                >
                  <rect x="13" y="0" width="22" height="5" rx="1.5" fill="url(#cork)" />
                  <path d="M15 5 L33 5 L31 14 L17 14 Z" fill="url(#cork)" />
                </svg>
              </span>
              <span className="statusReserveJars__label">{jar.label}</span>
              <strong>{jar.value ?? state}</strong>
              <small>{state}</small>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="statusReserveJars__ledgerTrigger"
        aria-haspopup="dialog"
        onClick={() => onOpenDrawer?.({ kind: 'buildPreparation' })}
      >
        <span>Reserve Ledger</span>
        <strong>{exactRowCount} exact rows</strong>
      </button>
    </div>
  );
}
