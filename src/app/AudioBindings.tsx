import { useEffect } from 'react';
import { audio } from '../services/audio.js';
import { useUIStore, type UIState } from '../stores/uiStore.js';
import { isSoundId } from '../services/audio/soundIds.js';
import type { UINotification } from '../stores/uiStore.js';
import { initSoundRouter } from '../services/audio/SoundRouter.js';
import { initAmbienceManager } from '../services/audio/AmbienceManager.js';

const selectActiveTab = (state: UIState) => state.activeTab;
const selectNotifications = (state: UIState) => state.notifications;
const selectAnyModalOpen = (state: UIState) =>
  state.showPrestigeModal ||
  state.showPerkSelectionModal ||
  state.showOfflineProgressModal ||
  state.showManualSatchelModal ||
  state.showTechniqueLearnedModal ||
  state.showWorldBuildingModal;

const toastSoundByType: Record<UINotification['type'], string> = {
  info: 'ui_toast_info',
  success: 'ui_toast_success',
  warning: 'ui_toast_warning',
  error: 'ui_toast_critical',
};

const isDisabledButton = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  if (element instanceof HTMLButtonElement && element.disabled) return true;
  return element.getAttribute('aria-disabled') === 'true';
};

const resolveClickTarget = (target: Element | null): HTMLElement | null => {
  if (!target || !(target instanceof Element)) return null;
  return target.closest('button, [role="button"]');
};

const resolveSoundOverride = (target: Element | null): string | null => {
  if (!target || !(target instanceof Element)) return null;
  const overrideElement = target.closest('[data-sfx-id], [data-sfx]');
  if (!overrideElement || !(overrideElement instanceof HTMLElement)) return null;
  return overrideElement.dataset.sfxId ?? overrideElement.dataset.sfx ?? null;
};

export function AudioBindings() {
  useEffect(() => {
    audio.init();
    initSoundRouter();
    const stopAmbience = initAmbienceManager();
    const clickOptions: AddEventListenerOptions = { capture: true };

    const unsubscribeTab = useUIStore.subscribe(selectActiveTab, (tab, previous) => {
      if (previous && tab !== previous) {
        audio.play('ui_tab_switch');
      }
    });

    const unsubscribeNotifications = useUIStore.subscribe(selectNotifications, (nextNotifications, prevNotifications) => {
      const prevIds = new Set(prevNotifications.map((toast) => toast.id));
      nextNotifications
        .filter((toast) => !prevIds.has(toast.id))
        .forEach((toast) => {
          const soundId = toastSoundByType[toast.type];
          if (isSoundId(soundId)) {
            audio.play(soundId);
          }
        });
    });

    const unsubscribeModals = useUIStore.subscribe(selectAnyModalOpen, (isOpen, wasOpen) => {
      if (wasOpen === undefined) return;
      if (!wasOpen && isOpen) {
        audio.play('ui_modal_open');
      } else if (wasOpen && !isOpen) {
        audio.play('ui_modal_close');
      }
    });

    const handleDropdownOpen = () => {
      audio.play('ui_dropdown_open');
    };

    const handleDropdownSelect = () => {
      audio.play('ui_dropdown_select');
    };

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const buttonTarget = resolveClickTarget(target);
      if (!buttonTarget || isDisabledButton(buttonTarget)) return;

      const override = resolveSoundOverride(target);
      if (override && isSoundId(override)) {
        audio.play(override);
        return;
      }

      audio.play('ui_click_primary');
    };

    document.addEventListener('click', handleGlobalClick, clickOptions);
    document.addEventListener('ui:dropdown_open', handleDropdownOpen as EventListener);
    document.addEventListener('ui:dropdown_select', handleDropdownSelect as EventListener);

    return () => {
      unsubscribeTab();
      unsubscribeNotifications();
      unsubscribeModals();
      stopAmbience();
      document.removeEventListener('click', handleGlobalClick, clickOptions);
      document.removeEventListener('ui:dropdown_open', handleDropdownOpen as EventListener);
      document.removeEventListener('ui:dropdown_select', handleDropdownSelect as EventListener);
    };
  }, []);

  return null;
}
