import type {
  PanoplyExactSurfaceV1,
  VaultExactSurfaceV1,
} from '../../../systems/ui/equipment/equipmentExactTypes.js';
import type { PanoplyActions } from '../../../features/equipment/panoply/usePanoplyActionController.js';
import { PanoplyFigureScene } from './PanoplyFigureScene.js';

/**
 * M.III.3 EQ-PORT — the render-only Panoply/Vault screen shell. Props ONLY (surfaces + actions); NO store
 * import, NO gameplay recomputation. Every value traces to a surface field produced upstream by the
 * builder/seam.
 *
 * NOTE (Phase 3 skeleton): this renders the REAL surface data in a legible structural form so `?panoply=live`
 * is real from the first mount. The 1:1 artifact paint (chrome, figure scene, ribbon medallions, bond gauge,
 * compass, vault grid, VFX) replaces these internals in Phases 4–5 — the props contract stays stable.
 */
export interface PanoplyVaultScreenProps {
  panoply: PanoplyExactSurfaceV1;
  vault: VaultExactSurfaceV1;
  activeSurface: 'panoply' | 'vault';
  actions: PanoplyActions;
}

export function PanoplyVaultScreen({ panoply, vault, activeSurface, actions }: PanoplyVaultScreenProps) {
  const detail = activeSurface === 'panoply' ? panoply.selectedDetail : vault.selectedDetail;
  const state = activeSurface === 'panoply' ? panoply.visualState : vault.visualState;

  return (
    <div className="panoplyRoot" data-path={panoply.pathLean} data-state={state} data-surface={activeSurface}>
      <div className="panoplyRoot__toggle" role="tablist" aria-label="Equipment surface">
        <button
          type="button"
          role="tab"
          aria-selected={activeSurface === 'panoply'}
          className={activeSurface === 'panoply' ? 'is-active' : undefined}
          onClick={() => actions.onSetSurface('panoply')}
        >
          法宝阁 · Panoply
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSurface === 'vault'}
          className={activeSurface === 'vault' ? 'is-active' : undefined}
          onClick={() => actions.onSetSurface('vault')}
        >
          须弥戒 · Vault
        </button>
      </div>

      <div className="panoplyRoot__body">
        {activeSurface === 'panoply' ? (
          <section className="panoplyRoot__panoply" data-testid="panoply-surface">
            <header>
              <span className="panoplyRoot__pathLean">{panoply.pathLean}</span>
              <span className="panoplyRoot__gearPower">战力 {panoply.gearPower ?? 0}</span>
            </header>
            <PanoplyFigureScene
              panoply={panoply}
              focusId={actions.selectedInstanceId}
              onSlotClick={actions.onOpenModal}
            />
            {panoply.bond ? (
              <div className="panoplyRoot__bond">BOND {panoply.bond.level} / {panoply.bond.max ?? '—'}</div>
            ) : null}
            {panoply.setBonuses.map((band) => (
              <div key={band.setId} className="panoplyRoot__setband">
                {band.name} · {band.held}/{band.total} · {band.activeTier ?? 'held'}
              </div>
            ))}
            <div className="panoplyRoot__totals">
              {(['offense', 'defense', 'utility'] as const).map((grp) =>
                panoply.totals[grp].map((row) => (
                  <span key={`${grp}-${row.channel}`} data-tone={row.tone}>
                    {row.label} {row.addText}
                  </span>
                )),
              )}
            </div>
          </section>
        ) : (
          <section className="panoplyRoot__vault" data-testid="vault-surface">
            <header className="panoplyRoot__census">
              须弥 {vault.counts.total} ·{' '}
              {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map((r) => (
                <span key={r}>{r}:{vault.counts.byRarity[r]} </span>
              ))}
            </header>
            <div className="panoplyRoot__filters">
              {(['all', 'weapon', 'armor', 'accessory'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={vault.filter.slot === f ? 'is-active' : undefined}
                  onClick={() => actions.onFilter({ slot: f })}
                >
                  {f}
                </button>
              ))}
            </div>
            <ul className="panoplyRoot__slips">
              {vault.slips.map((slip) => (
                <li key={slip.instanceId} data-equipped={slip.isEquipped} data-new={slip.isNew}>
                  <button type="button" onClick={() => actions.onSelect(slip.instanceId)}>
                    <span>{slip.name}</span>
                    <span>{slip.rarityLabel}</span>
                    <span>{slip.tierMark}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <aside className="panoplyRoot__rail" data-testid="detail-rail">
          {detail && detail.identity ? (
            <div>
              <h2>{detail.identity.name}</h2>
              {detail.identity.nameCjk ? <p>{detail.identity.nameCjk}</p> : null}
              <p>{detail.identity.rarityLabel}{detail.identity.rarityBand ? ` · ${detail.identity.rarityBand}` : ''}</p>
              <ul>
                {detail.affixes.map((affix, i) => (
                  <li key={`${affix.name}-${i}`} data-kind={affix.kind}>
                    {affix.name} {affix.value}
                  </li>
                ))}
              </ul>
              <div className="panoplyRoot__railActions">
                {detail.actions.map((act) => (
                  <button
                    key={act.route}
                    type="button"
                    disabled={!act.enabled}
                    title={act.disabledReason}
                    onClick={() => actions.onAction(act.route)}
                  >
                    {act.verb}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="panoplyRoot__railEmpty">{detail?.emptyLegend ?? 'Select a treasure to inspect it in full.'}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
