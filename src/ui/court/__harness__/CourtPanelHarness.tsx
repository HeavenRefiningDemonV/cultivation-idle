import { CourtDefs } from '../CourtDefs';
import { CourtPanel } from '../CourtPanel';
import { CourtChip, CourtRootChip } from '../courtChips';
import { CourtWaxSeal, CourtMedallion, CourtFlame } from '../courtSeals';

/**
 * W1 throwaway harness (Appendix E: panel.harness). Renders the Court panel
 * material + every shared primitive (banner jade/cinn, tag, watermark, rollers,
 * wax seals, medallion, flame, all chip + root-chip variants) on the artifact's
 * dark stage ground, for the W1 Playwright parity screenshot vs an artifact panel
 * header. NOT shipped — removed at W13 cutover.
 */
export function CourtPanelHarness() {
  return (
    <div
      data-testid="court-panel-harness"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        gap: 24,
        padding: 40,
        background:
          'radial-gradient(60% 50% at 50% 0%, var(--court-stage-glow), transparent 70%), linear-gradient(160deg, var(--court-stage-hi), var(--court-stage-mid) 60%, var(--court-stage-lo))',
      }}
    >
      <CourtDefs />

      {/* Lintel-style panel: cinnabar tag + watermark + scroll-rod rollers */}
      <CourtPanel
        ariaLabel="Harness Lintel"
        tag="锤炼堂"
        watermark="堂"
        watermarkRight={64}
        rollers
        contentPadding="0 18px"
        banner={
          <span>
            THE TEMPERING COURT · <b>Weapon Intent</b>
          </span>
        }
        bannerVariant="cinn"
        className="harnessPanel harnessPanel--lintel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 116, paddingLeft: 86, width: 900 }}>
          <span
            style={{
              font: '700 9.5px var(--court-serif)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--court-ink-45)',
            }}
          >
            TRAINING HALL · MARTIAL PATH
          </span>
          <CourtWaxSeal chars="武" size={34} rotation={-6} />
        </div>
      </CourtPanel>

      {/* Room-style panel: jade banner + watermark; shows chips / seals / medallion / flame */}
      <CourtPanel
        ariaLabel="Harness Room"
        banner="THE ROOM · Marrow Furnace"
        watermark="气"
        className="harnessPanel harnessPanel--room"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 320, width: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <CourtChip tone="jade">▸ Weapon Intent</CourtChip>
            <CourtChip tone="gold">滿 capped</CourtChip>
            <CourtChip tone="cinn">! bottleneck</CourtChip>
            <CourtChip tone="ink">No Path</CourtChip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <CourtRootChip grade="heavenly">Heavenly</CourtRootChip>
            <CourtRootChip grade="true">True</CourtRootChip>
            <CourtRootChip grade="earthly">Earthly</CourtRootChip>
            <CourtRootChip grade="mortal">Mortal</CourtRootChip>
            <CourtRootChip grade="chaos">Chaos</CourtRootChip>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            <CourtWaxSeal chars="封" size={26} rotation={-8} />
            <CourtWaxSeal chars="炼" size={60} jade />
            <CourtWaxSeal chars="歸" size={40} jade rotation={-6} />
            <CourtMedallion glyph="靜" />
            <CourtMedallion glyph="極" ink />
            <CourtFlame height={4} lit />
            <CourtFlame height={2} />
          </div>
        </div>
      </CourtPanel>
    </div>
  );
}
