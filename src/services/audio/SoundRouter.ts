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
  });

  GameEvents.on('pavilion/closed', () => {
    playSound('ui_click_secondary');
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

  GameEvents.on('apothecary/opened', () => {
    playSound('ui_apothecary_open');
  });

  GameEvents.on('apothecary/closed', () => {
    playSound('ui_apothecary_close');
  });

  GameEvents.on('apothecary/item_selected', () => {
    playSound('ui_apothecary_item_select');
  });

  GameEvents.on('apothecary/buy_success', () => {
    playSound('ui_apothecary_buy_success');
  });

  GameEvents.on('apothecary/buy_failed', () => {
    playSound('ui_apothecary_buy_fail');
  });

  GameEvents.on('apothecary/daily_limit_hit', () => {
    playSound('ui_apothecary_daily_limit_hit');
  });

  GameEvents.on('apothecary/bundle_buy', (event) => {
    playSound(event.payload.ok ? 'ui_apothecary_bundle_buy' : 'ui_apothecary_buy_fail');
  });

  GameEvents.on('pouch/opened', () => {
    playSound('ui_pouch_open');
  });

  GameEvents.on('pouch/closed', () => {
    playSound('ui_pouch_close');
  });

  GameEvents.on('pouch/slot_selected', () => {
    playSound('ui_pouch_slot_select');
  });

  GameEvents.on('pouch/equip', () => {
    playSound('ui_pouch_equip_item');
  });

  GameEvents.on('pouch/unequip', () => {
    playSound('ui_pouch_unequip_item');
  });

  GameEvents.on('pouch/auto_trigger', () => {
    playSound('sfx_pouch_auto_use_trigger');
  });

  GameEvents.on('pouch/out_of_charges', () => {
    playSound('sfx_pouch_out_of_charges');
  });

  GameEvents.on('pouch/low_charges_warning', () => {
    playSound('sfx_pouch_low_charges_warning');
  });

  GameEvents.on('crafting/opened', () => {
    playSound('ui_crafting_open');
  });

  GameEvents.on('crafting/closed', () => {
    playSound('ui_crafting_close');
  });

  GameEvents.on('crafting/recipe_selected', () => {
    playSound('ui_recipe_select');
  });

  GameEvents.on('crafting/recipe_locked', () => {
    playSound('ui_recipe_locked');
  });

  GameEvents.on('crafting/recipe_unlocked', () => {
    playSound('ui_recipe_unlock');
  });

  GameEvents.on('crafting/mode_selected', (event) => {
    const mode = event.payload.mode;
    if (mode === 'idle') playSound('ui_mode_idle_select');
    if (mode === 'assisted') playSound('ui_mode_assisted_select');
    if (mode === 'handsOn') playSound('ui_mode_handson_select');
  });

  GameEvents.on('crafting/queue_added', () => {
    playSound('ui_queue_add');
  });

  GameEvents.on('crafting/queue_completed', () => {
    playSound('ui_queue_complete');
  });

  GameEvents.on('crafting/session_started', () => {
    playSound('ui_queue_start');
  });

  GameEvents.on('crafting/session_aborted', () => {
    playSound('ui_queue_remove');
  });

  GameEvents.on('crafting/session_claimed', () => {
    playSound('ui_queue_complete');
  });

  GameEvents.on('crafting/session_completed', () => {
    playSound('ui_queue_complete');
  });

  GameEvents.on('crafting/session_backgrounded', () => {
    playSound('ui_queue_pause');
  });

  GameEvents.on('crafting/assist_prompt_available', () => {
    playSound('ui_assist_prompt_appear');
  });

  GameEvents.on('crafting/assist_prompt_completed', () => {
    playSound('ui_assist_prompt_success');
  });

  GameEvents.on('crafting/assist_prompt_failed', () => {
    playSound('ui_assist_prompt_fail');
  });

  GameEvents.on('crafting/assist_prompt_timeout', () => {
    playSound('ui_assist_prompt_timeout');
  });

  GameEvents.on('alchemy/flame_ignite', () => {
    playSound('sfx_alchemy_flame_ignite');
  });

  GameEvents.on('alchemy/flame_adjust', () => {
    playSound('sfx_alchemy_flame_adjust');
  });

  GameEvents.on('alchemy/flame_stable', (event) => {
    playSound(event.payload.ok ? 'sfx_alchemy_flame_stable' : 'sfx_alchemy_flame_surge');
  });

  GameEvents.on('alchemy/ingredient_added', (event) => {
    playSound(event.payload.ok ? 'sfx_alchemy_ingredient_add' : 'sfx_alchemy_step_miss');
  });

  GameEvents.on('alchemy/seal_attempt', (event) => {
    playSound('sfx_alchemy_seal');
    playSound(event.payload.ok ? 'sfx_alchemy_step_perfect' : 'sfx_alchemy_step_miss');
  });

  GameEvents.on('alchemy/pressure_release', () => {
    playSound('sfx_alchemy_pressure_release');
  });

  GameEvents.on('alchemy/result', (event) => {
    if (event.payload.grade === 'perfect') {
      playSound('sfx_alchemy_result_perfect');
    } else if (event.payload.grade === 'crude') {
      playSound('sfx_alchemy_result_crude');
    } else {
      playSound('sfx_alchemy_step_good');
    }
  });

  GameEvents.on('alchemy/byproduct_gain', () => {
    playSound('sfx_alchemy_byproduct_gain');
  });

  GameEvents.on('alchemy/mastery_gain', () => {
    playSound('sfx_alchemy_mastery_gain');
  });

  GameEvents.on('alchemy/mastery_milestone', () => {
    playSound('sfx_alchemy_mastery_milestone');
  });

  GameEvents.on('forge/furnace_ignite', () => {
    playSound('sfx_forge_furnace_ignite');
  });

  GameEvents.on('forge/bellows_pump', () => {
    playSound('sfx_forge_bellows_pump');
  });

  GameEvents.on('forge/metal_heat', () => {
    playSound('sfx_forge_metal_heat');
  });

  GameEvents.on('forge/hammer_strike', (event) => {
    playSound(event.payload.intensity === 'heavy' ? 'sfx_forge_hammer_heavy' : 'sfx_forge_hammer_light');
  });

  GameEvents.on('forge/hammer_complete', () => {
    playSound('sfx_forge_sparks_burst');
  });

  GameEvents.on('forge/quench', () => {
    playSound('sfx_forge_quench');
  });

  GameEvents.on('forge/temper', () => {
    playSound('sfx_forge_temper');
  });

  GameEvents.on('forge/grind', () => {
    playSound('sfx_forge_grind');
  });

  GameEvents.on('forge/refine_result', (event) => {
    playSound(event.payload.ok ? 'sfx_forge_refine_success' : 'sfx_forge_refine_fail');
  });

  GameEvents.on('forge/temper_result', (event) => {
    playSound(event.payload.ok ? 'sfx_forge_temper_proc' : 'sfx_forge_temper_no_proc');
  });

  GameEvents.on('forge/delta_panel_opened', () => {
    playSound('ui_forge_delta_open');
  });

  GameEvents.on('forge/delta_panel_closed', () => {
    playSound('ui_forge_delta_close');
  });

  GameEvents.on('forge/rune_engrave', () => {
    playSound('sfx_forge_rune_engrave');
  });

  GameEvents.on('forge/rune_fuse', () => {
    playSound('sfx_forge_rune_fuse');
  });

  GameEvents.on('forge/rune_craft_result', (event) => {
    playSound(event.payload.ok ? 'sfx_forge_rune_craft_success' : 'sfx_forge_rune_craft_fail');
  });

  GameEvents.on('forge/rune_dust_gain', () => {
    playSound('sfx_forge_rune_dust_gain');
  });

  GameEvents.on('talisman/craft_result', (event) => {
    playSound(event.payload.ok ? 'sfx_talisman_craft_success' : 'sfx_talisman_craft_fail');
  });

  GameEvents.on('talisman/paper_pickup', () => {
    playSound('sfx_talisman_paper_pickup');
  });

  GameEvents.on('talisman/brush_stroke', () => {
    playSound('sfx_talisman_brush_stroke');
  });

  GameEvents.on('talisman/ink_dip', () => {
    playSound('sfx_talisman_ink_dip');
  });

  GameEvents.on('talisman/seal_stamp', () => {
    playSound('sfx_talisman_seal_stamp');
  });

  GameEvents.on('talisman/activated', () => {
    playSequence([{ id: 'ui_talisman_equip' }, { id: 'sfx_talisman_trigger', delayMs: 120 }]);
  });

  GameEvents.on('talisman/expired', () => {
    playSequence([{ id: 'ui_talisman_unequip' }, { id: 'sfx_talisman_break', delayMs: 120 }]);
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
