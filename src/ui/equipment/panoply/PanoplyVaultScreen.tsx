import { useCallback, type MouseEvent } from 'react';
import './panoplyVault.scss';
import type {
  PanoplyExactSurfaceV1,
  VaultExactSurfaceV1,
  VaultSlotFilter,
} from '../../../systems/ui/equipment/equipmentExactTypes.js';
import type { PanoplyActions } from '../../../features/equipment/panoply/usePanoplyActionController.js';
import { PanoplyFigureScene } from './PanoplyFigureScene.js';
import { PANOPLY_SVG_DEFS } from './panoplySvgDefs.js';
import {
  chromeHTML, detailRailHTML, gearTotalsHTML, lowerStripHTML, ribbonPanoplyHTML, ribbonVaultHTML,
  setLinkBandHTML, vaultBodyHTML,
} from './panoplyInstrumentsHtml.js';

/**
 * M.III.3 EQ-PORT — the render-only Panoply/Vault stage, 1:1 with the artifact's `render()` structure (the
 * 2048×1152 stage · corner tag · ribbon panel · body grid · docked rail). Props ONLY; NO store import, NO
 * gameplay recompute — every value traces to a surface field. `PANOPLY_SVG_DEFS` is injected once at the
 * stage so both the figure scene AND the vault emblems resolve their `url(#)` refs. ONE delegated click
 * handler routes every intent (worn slot → modal, slip → select, filter → filter, rail action → onAction).
 */
export interface PanoplyVaultScreenProps {
  panoply: PanoplyExactSurfaceV1;
  vault: VaultExactSurfaceV1;
  activeSurface: 'panoply' | 'vault';
  actions: PanoplyActions;
}

const inject = (html: string) => ({ __html: html });

export function PanoplyVaultScreen({ panoply, vault, activeSurface, actions }: PanoplyVaultScreenProps) {
  const isVault = activeSurface === 'vault';
  const state = isVault ? vault.visualState : panoply.visualState;

  const onStageClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = (e.target as Element).closest('[data-instance-id],[data-slip-id],[data-vfilter],[data-route]');
      if (!el) return;
      const instId = el.getAttribute('data-instance-id');
      if (instId) { actions.onOpenModal(instId); return; }
      const slipId = el.getAttribute('data-slip-id');
      if (slipId) { actions.onSelect(slipId); return; }
      const vfilter = el.getAttribute('data-vfilter');
      if (vfilter) { actions.onFilter({ slot: vfilter as VaultSlotFilter }); return; }
      const route = el.getAttribute('data-route');
      if (route) {
        if ((el as HTMLButtonElement).disabled) return;
        const confirmMsg = el.getAttribute('data-confirm');
        if (confirmMsg && typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(confirmMsg)) return;
        actions.onAction(route);
      }
    },
    [actions],
  );

  return (
    <div
      className="stage panoplyRoot"
      data-path={panoply.pathLean}
      data-state={state}
      data-surface={activeSurface}
      onClick={onStageClick}
    >
      <div className="panoplyDefs" aria-hidden="true" dangerouslySetInnerHTML={inject(PANOPLY_SVG_DEFS)} />

      <div className="tag">
        {isVault ? <span>须<br />弥<br />戒</span> : <span>法<br />宝<br />阁</span>}
      </div>

      <div className="panoplySurfaceToggle" role="tablist" aria-label="Equipment surface">
        <button type="button" role="tab" aria-selected={!isVault} className={!isVault ? 'on' : undefined} onClick={() => actions.onSetSurface('panoply')}>法宝阁 Panoply</button>
        <button type="button" role="tab" aria-selected={isVault} className={isVault ? 'on' : undefined} onClick={() => actions.onSetSurface('vault')}>须弥戒 Vault</button>
      </div>

      <div className="panel ribbonPanel" style={{ overflow: 'visible' }}>
        <div className="chromeLayer" dangerouslySetInnerHTML={inject(chromeHTML(''))} />
        <div
          className="ribbon"
          dangerouslySetInnerHTML={inject(isVault ? ribbonVaultHTML(vault, panoply.pathLean) : ribbonPanoplyHTML(panoply))}
        />
      </div>

      <div className="bodyWrap">
        {isVault ? (
          <div className="body vault" data-testid="vault-surface">
            <div className="panel vaultpanel">
              <div className="chromeLayer" dangerouslySetInnerHTML={inject(chromeHTML('须弥戒 · THE SUMERU RING'))} />
              <div className="host" dangerouslySetInnerHTML={inject(vaultBodyHTML(vault))} />
            </div>
            <div className="railcol vaultrail">
              <div className="railHost" data-testid="detail-rail" dangerouslySetInnerHTML={inject(detailRailHTML(vault.selectedDetail))} />
            </div>
          </div>
        ) : (
          <div className="body panoply" data-testid="panoply-surface">
            <div className="panel figpanel">
              <div className="chromeLayer" dangerouslySetInnerHTML={inject(chromeHTML('法宝阁 · THE WORN TREASURES'))} />
              <div className="host">
                <PanoplyFigureScene panoply={panoply} focusId={actions.selectedInstanceId} />
                <div dangerouslySetInnerHTML={inject(setLinkBandHTML(panoply.setBonuses))} />
                <div className="strip" dangerouslySetInnerHTML={inject(lowerStripHTML())} />
              </div>
            </div>
            <div className="railcol">
              <div className="railHost" data-testid="detail-rail" dangerouslySetInnerHTML={inject(detailRailHTML(panoply.selectedDetail))} />
              <div dangerouslySetInnerHTML={inject(gearTotalsHTML(panoply.totals))} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
