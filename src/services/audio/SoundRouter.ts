import { GameEvents } from '../events/GameEvents';
import { audio } from './index';
import { isSoundId } from './soundIds';

const CURRENCY_SOUND_INTERVAL_MS = 250;
const LARGE_CURRENCY_THRESHOLD = 100;
const SMALL_FRAGMENT_THRESHOLD = 3;

let initialized = false;

const playSound = (id: string) => {
  if (isSoundId(id)) {
    audio.play(id);
  }
};

const playSequence = (ids: Array<{ id: string; delayMs?: number }>) => {
  ids.forEach(({ id, delayMs }) => {
    if (!isSoundId(id)) return;
    if (!delayMs) {
      audio.play(id);
      return;
    }
    window.setTimeout(() => audio.play(id), delayMs);
  });
};

export function initSoundRouter() {
  if (initialized) return;
  initialized = true;

  let lastCurrencySoundAt = 0;

  GameEvents.on('pavilion/opened', () => {
    playSound('ui_building_enter');
    if (isSoundId('amb_building_manual_pavilion_loop')) {
      audio.startAmbience('amb_building_manual_pavilion_loop');
    }
  });

  GameEvents.on('pavilion/closed', () => {
    audio.stopAmbience({ fadeMs: 400 });
  });

  GameEvents.on('pavilion/refresh_confirmed', () => {
    playSequence([
      { id: 'ui_pavilion_refresh_confirm' },
      { id: 'ui_pavilion_stock_roll', delayMs: 150 },
      { id: 'ui_pavilion_stock_reveal', delayMs: 350 },
    ]);
  });

  GameEvents.on('pavilion/refresh_denied', () => {
    playSound('ui_pavilion_refresh_denied');
  });

  GameEvents.on('pavilion/buy_attempt', () => {
    playSound('ui_pavilion_buy_click');
  });

  GameEvents.on('pavilion/buy_success', () => {
    playSequence([
      { id: 'ui_pavilion_buy_success' },
      { id: 'ui_item_pickup', delayMs: 120 },
    ]);
  });

  GameEvents.on('pavilion/buy_failed', () => {
    playSound('ui_pavilion_buy_fail');
  });

  GameEvents.on('pavilion/pity_increment', () => {
    playSound('ui_pavilion_pity_increment');
  });

  GameEvents.on('pavilion/pity_major', () => {
    playSound('ui_pavilion_pity_major');
  });

  GameEvents.on('pavilion/guarantee_trigger', () => {
    playSound('ui_pavilion_guarantee_trigger');
  });

  GameEvents.on('satchel/opened', () => {
    playSound('ui_satchel_open');
  });

  GameEvents.on('satchel/closed', () => {
    playSound('ui_satchel_close');
  });

  GameEvents.on('manuals/studied', (event) => {
    const progress = event.payload.progress ?? 0;
    if (progress === 0) {
      playSequence([
        { id: 'sfx_study_start' },
        { id: 'ui_study_timer_start', delayMs: 100 },
      ]);
    } else if (progress >= 1) {
      playSequence([
        { id: 'ui_study_timer_complete' },
        { id: 'stg_technique_learned', delayMs: 140 },
      ]);
    }
  });

  GameEvents.on('manuals/focus_prompt', () => {
    playSound('ui_focus_prompt_appear');
  });

  GameEvents.on('manuals/focus_applied', () => {
    playSound('ui_focus_success');
  });

  GameEvents.on('manuals/focus_failed', () => {
    playSound('ui_focus_fail');
  });

  GameEvents.on('techniques/learned_modal_opened', () => {
    playSound('ui_learned_popup_open');
  });

  GameEvents.on('techniques/equip_now_clicked', () => {
    playSound('ui_equip_now_click');
  });

  GameEvents.on('ui/tab_changed', (event) => {
    if (event.payload.next === 'techniques') {
      playSound('ui_techlib_open');
    }
    if (event.payload.previous === 'techniques' && event.payload.next !== 'techniques') {
      playSound('ui_techlib_close');
    }
  });

  GameEvents.on('techniques/loadout_changed', () => {
    playSound('ui_loadout_switch');
  });

  GameEvents.on('techniques/slot_selected', () => {
    playSound('ui_slot_select');
  });

  GameEvents.on('techniques/slot_locked', () => {
    playSound('ui_slot_locked');
  });

  GameEvents.on('techniques/slot_unlocked', () => {
    playSound('ui_slot_unlock');
  });

  GameEvents.on('techniques/equip_failed', (event) => {
    if (event.payload.reason === 'locked') {
      playSound('ui_slot_locked');
    }
  });

  GameEvents.on('techniques/equip_changed', (event) => {
    if (event.payload.action === 'equip') {
      playSound('ui_tech_equip');
    } else if (event.payload.action === 'swap') {
      playSound('ui_tech_swap');
    } else {
      playSound('ui_tech_unequip');
    }
  });

  GameEvents.on('techniques/rank_upgrade_opened', () => {
    playSound('ui_rank_upgrade_open');
  });

  GameEvents.on('techniques/rank_upgrade_attempt', () => {
    playSound('ui_rank_upgrade_confirm');
  });

  GameEvents.on('techniques/rank_upgrade_success', () => {
    playSound('ui_rank_upgrade_success');
  });

  GameEvents.on('techniques/rank_upgrade_failed', () => {
    playSound('ui_rank_upgrade_fail');
  });

  GameEvents.on('techniques/trait_reroll_opened', () => {
    playSound('ui_trait_reroll_open');
  });

  GameEvents.on('techniques/trait_reroll_attempt', () => {
    playSequence([
      { id: 'ui_trait_reroll_confirm' },
      { id: 'ui_trait_reroll_spin', delayMs: 120 },
    ]);
  });

  GameEvents.on('techniques/trait_reroll_result', () => {
    playSound('ui_trait_reroll_result');
  });

  GameEvents.on('techniques/rune_socketed', () => {
    playSound('ui_rune_insert');
  });

  GameEvents.on('techniques/rune_unsocketed', () => {
    playSound('ui_rune_remove');
  });

  GameEvents.on('rewards/granted', (event) => {
    const now = Date.now();
    const currencies = event.payload.result.appliedCurrencies;
    const currencyTotal = Object.values(currencies)
      .map((value) => Number(value ?? 0))
      .reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);

    if (currencyTotal > 0 && now - lastCurrencySoundAt >= CURRENCY_SOUND_INTERVAL_MS) {
      lastCurrencySoundAt = now;
      playSound(currencyTotal >= LARGE_CURRENCY_THRESHOLD ? 'ui_currency_gain_large' : 'ui_currency_gain_small');
    }

    if ((event.payload.result.appliedItems ?? []).length > 0 || (event.payload.bundle.manuals ?? []).length > 0) {
      playSound('ui_item_pickup');
    }

    const fragmentQty = (event.payload.bundle.techniqueFragments ?? []).reduce((sum, fragment) => {
      const qty = Math.max(0, Math.floor(fragment?.qty ?? 0));
      return sum + qty;
    }, 0);

    if (fragmentQty > 0) {
      if (fragmentQty <= SMALL_FRAGMENT_THRESHOLD) {
        playSound('ui_currency_gain_small');
      } else {
        playSound('sfx_fragment_bundle');
      }
    }
  });

  GameEvents.on('rewards/spent', () => {
    playSound('ui_currency_spend');
  });
}
