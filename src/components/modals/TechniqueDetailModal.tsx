import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useId, useMemo, useEffect, useRef, useState, useCallback } from 'react';
import type { TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useGameStore } from '../../stores/gameStore';
import {
  masteryLevelFromXp,
  normalizeGrade,
  normalizeRarity,
  rankMultiplier,
  useTechCollectionStore,
} from '../../stores/techCollectionStore';
import { useTechniqueStore, type SlotType } from '../../stores/techniqueStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { normalizeTechniqueEffects, summarizeEffects } from '../../systems/techniques/effects';
import { RankUpgradeRitualModal } from './RankUpgradeRitualModal';
import { TraitRerollModal } from './TraitRerollModal';
import { GameEvents } from '../../services/events/GameEvents';
import { getPathIcon, getTierIcon, getTypeIcon, resolveTechniqueType } from '../../features/manuals/manualIconMap';
import './TechniqueDetailModal.scss';

export interface TechniqueDetailModalProps {
  open: boolean;
  techniqueId: string | null;
  selectedSlot: { type: SlotType; index: number };
  onSelectSlot: (slot: { type: SlotType; index: number }) => void;
  initialAction?: 'upgradeRank' | 'rerollTraits' | null;
  onInitialActionHandled?: () => void;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

type ActionMessageScope = 'equip' | 'upgrade' | 'runes' | 'traits';

type ActionMessage = {
  type: 'error' | 'info' | 'success';
  text: string;
  scope: ActionMessageScope;
} | null;

const SOUL_INK_REROLL_ITEM_ID = 'reagent_soul_ink_t0';
const RUNE_DUST_ITEM_ID = 'mat_rune_dust';

const resolveTechnique = (
  techniquesById: Record<string, TechniqueDef>,
  techniqueId: string | null,
): TechniqueDef | null => {
  if (!techniqueId) return null;
  return techniquesById[techniqueId] ?? null;
};

const techniqueType = (technique: { type?: string; tags?: string[] } | undefined): SlotType => {
  if (!technique) return 'active';
  if (technique.type === 'ultimate') return 'ultimate';
  if (technique.type === 'passive' || technique.tags?.includes('passive')) return 'passive';
  return 'active';
};

const slotLabel = (slot: { type: SlotType; index: number }) => {
  if (slot.type === 'ultimate') return 'Ultimate';
  return `${slot.type === 'active' ? 'Active' : 'Passive'} ${slot.index + 1}`;
};

const rarityLabel = (value?: string) => {
  const safe = value ?? 'common';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};

const gradeLabel = (value?: string) => {
  const safe = value ?? 'mortal';
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};

export function TechniqueDetailModal({
  open,
  techniqueId,
  selectedSlot,
  onSelectSlot,
  initialAction,
  onInitialActionHandled,
  onClose,
  initialFocusRef,
}: TechniqueDetailModalProps) {
  const titleId = useId();
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showTraitModal, setShowTraitModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const previousRankModal = useRef(false);
  const previousTraitModal = useRef(false);

  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const runesById = useContentStore((state) => state.maps.runesById);
  const heavenBonus = useContentStore(
    (state) => state.raw?.economy?.manualSystem?.grades?.heaven?.mastery75PotencyBonus,
  );
  const realmIndex = useGameStore((state) => state.realm.index);
  const loadouts = useTechniqueStore((state) => state.loadouts);
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const equipTechnique = useTechniqueStore((state) => state.equipTechnique);
  const getSlotProgressionSnapshot = useTechniqueStore((state) => state.getSlotProgressionSnapshot);
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const toggleFavorite = useTechCollectionStore((state) => state.toggleFavorite);
  const getTraitSlotBreakdown = useTechCollectionStore((state) => state.getTraitSlotBreakdown);
  const getEffectiveTraitSlots = useTechCollectionStore((state) => state.getEffectiveTraitSlots);
  const ensureTraits = useTechCollectionStore((state) => state.ensureTraits);
  const getTraitDefinition = useTechCollectionStore((state) => state.getTraitDefinition);
  const getTraitRollRangeLabel = useTechCollectionStore((state) => state.getTraitRollRangeLabel);
  const getTraitQualityPct = useTechCollectionStore((state) => state.getTraitQualityPct);
  const getEffectiveRuneSlots = useTechCollectionStore((state) => state.getEffectiveRuneSlots);
  const ensureRunes = useTechCollectionStore((state) => state.ensureRunes);
  const socketRune = useTechCollectionStore((state) => state.socketRune);
  const unsocketRune = useTechCollectionStore((state) => state.unsocketRune);
  const getNextRankCost = useTechCollectionStore((state) => state.getNextRankCost);
  const getRankCap = useTechCollectionStore((state) => state.getRankCap);
  const fragments = useTechCollectionStore((state) => state.fragments);
  const getMasteryCooldownReductionPct = useTechCollectionStore((state) => state.getMasteryCooldownReductionPct);
  const getMasteryCostReductionPct = useTechCollectionStore((state) => state.getMasteryCostReductionPct);
  const getNextMasteryMilestoneHelper = useTechCollectionStore((state) => state.getNextMasteryMilestone);
  const getMasteryMilestoneEffectsHelper = useTechCollectionStore((state) => state.getMasteryMilestoneEffects);
  const inventoryItems = useInventoryStore((state) => state.items);

  const technique = useMemo(
    () => resolveTechnique(techniquesById, techniqueId),
    [techniqueId, techniquesById],
  );

  useEffect(() => {
    if (!techniqueId) return;
    ensureTraits(techniqueId);
    ensureRunes(techniqueId);
  }, [ensureRunes, ensureTraits, techniqueId]);

  const handleScroll = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowTopShadow(scrollTop > 4);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 4);
  }, []);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, open, techniqueId]);

  useEffect(() => {
    const el = scrollBodyRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!techniqueId) return;
    if (!previousRankModal.current && showRankModal) {
      GameEvents.emit({ type: 'techniques/rank_upgrade_opened', payload: { techniqueId } });
    }
    previousRankModal.current = showRankModal;
  }, [techniqueId, showRankModal]);

  useEffect(() => {
    if (!techniqueId) return;
    if (!previousTraitModal.current && showTraitModal) {
      GameEvents.emit({ type: 'techniques/trait_reroll_opened', payload: { techniqueId } });
    }
    previousTraitModal.current = showTraitModal;
  }, [techniqueId, showTraitModal]);

  useEffect(() => {
    if (!open || !initialAction) return;
    if (initialAction === 'upgradeRank') {
      setShowRankModal(true);
    }
    if (initialAction === 'rerollTraits') {
      setShowTraitModal(true);
    }
    onInitialActionHandled?.();
  }, [initialAction, onInitialActionHandled, open]);

  const displayName = technique?.name ?? techniqueId ?? 'Technique';
  const typeKey = resolveTechniqueType(technique ?? undefined);
  const tierKey = normalizeGrade(technique?.tier);
  const pathKey = technique?.path ?? 'unknown';
  const tierIcon = getTierIcon(tierKey);
  const pathIcon = getPathIcon(pathKey);
  const typeIcon = getTypeIcon(typeKey);
  const isMissing = !technique;

  const selectedLoadout = useMemo(
    () => loadouts.find((l) => l.id === selectedLoadoutId) ?? loadouts[0],
    [loadouts, selectedLoadoutId],
  );

  const progression = useMemo(
    () => getSlotProgressionSnapshot(realmIndex),
    [getSlotProgressionSnapshot, realmIndex],
  );

  const selectedEntry = techniqueId ? unlockedTechs[techniqueId] : undefined;
  const masteryLevel = masteryLevelFromXp(selectedEntry?.masteryXp ?? 0);
  const masteryCdr = techniqueId ? getMasteryCooldownReductionPct(techniqueId) : 0;
  const masteryCostReduction = techniqueId ? getMasteryCostReductionPct(techniqueId) : 0;
  const masteryMilestoneEffects = getMasteryMilestoneEffectsHelper(masteryLevel);
  const nextMilestoneDetail = getNextMasteryMilestoneHelper(masteryLevel);
  const rankCapSelected = techniqueId ? getRankCap(techniqueId) : 0;
  const nextRankInfo = techniqueId ? getNextRankCost(techniqueId) : null;
  const fragmentsOwnedSelected = techniqueId ? fragments[techniqueId] ?? 0 : 0;
  const traitInfoSelected = techniqueId
    ? getTraitSlotBreakdown(techniqueId)
    : { raritySlots: 0, gradeCap: 0, effectiveSlots: 0, rarity: 'common', grade: 'mortal' as const };
  const selectedTraits = selectedEntry?.traits ?? [];
  const rerollItemName = itemsById[SOUL_INK_REROLL_ITEM_ID]?.name ?? 'Soul Ink';
  const runeSlots = techniqueId ? getEffectiveRuneSlots(techniqueId) : 0;
  const runeDisplay = useMemo(
    () => Array.from({ length: runeSlots }, (_, idx) => selectedEntry?.runes?.[idx] ?? null),
    [runeSlots, selectedEntry?.runes],
  );
  const [runeSelections, setRuneSelections] = useState<Record<number, string>>({});

  useEffect(() => {
    setRuneSelections({});
  }, [techniqueId]);

  const primaryEffects = useMemo(
    () => (technique ? normalizeTechniqueEffects(technique, { includeSecondary: false }) : []),
    [technique],
  );
  const secondaryEffects = useMemo(
    () =>
      technique
        ? normalizeTechniqueEffects(technique, { includeSecondary: true }).filter((effect) => effect.source === 'secondary')
        : [],
    [technique],
  );

  const availableRunes = useMemo(() => {
    return Object.keys(runesById).map((id) => ({
      id,
      name: itemsById[id]?.name ?? id,
      qty: inventoryItems[id] ?? 0,
    }));
  }, [inventoryItems, itemsById, runesById]);

  const selectedType = techniqueType(technique ?? undefined);
  const selectedRank = selectedEntry?.rank ?? 1;
  const selectedRarity = normalizeRarity(selectedEntry?.rarity ?? technique?.rarity);
  const selectedGrade = normalizeGrade(selectedEntry?.manualGrade ?? technique?.tier);
  const summaryEffectLines = summarizeEffects(primaryEffects);
  const summaryLine = summaryEffectLines[0]
    ? summaryEffectLines[0]
    : typeof technique?.effect === 'string'
      ? technique.effect
      : `${selectedType === 'ultimate' ? 'Ultimate' : selectedType === 'passive' ? 'Passive' : 'Active'} technique${
          technique?.role ? ` focused on ${technique.role}` : ''
        }.`;

  const equippedSlot = useMemo(() => {
    if (!techniqueId || !selectedLoadout) return null;
    const activeIndex = selectedLoadout.slots.active.findIndex((id) => id === techniqueId);
    if (activeIndex >= 0) return { type: 'active' as const, index: activeIndex };
    const passiveIndex = selectedLoadout.slots.passive.findIndex((id) => id === techniqueId);
    if (passiveIndex >= 0) return { type: 'passive' as const, index: passiveIndex };
    if (selectedLoadout.slots.ultimate === techniqueId) return { type: 'ultimate' as const, index: 0 };
    return null;
  }, [selectedLoadout, techniqueId]);

  const handleEquip = useCallback(
    (slot: { type: SlotType; index: number }, action: 'equip' | 'unequip') => {
      if (!techniqueId || !selectedLoadout) return;
      const techId = action === 'equip' ? techniqueId : '';
      const result = equipTechnique(slot.type, slot.index, techId, selectedLoadout.id);
      if (result.ok) {
        setActionMessage({
          type: 'success',
          scope: 'equip',
          text:
            action === 'equip'
              ? `Equipped in ${slotLabel(slot)} on ${selectedLoadout.name}.`
              : `Unequipped from ${slotLabel(slot)}.`,
        });
      } else {
        const unlockText = result.unlockAt ? ` Unlocks at: ${result.unlockAt.realmName}.` : '';
        setActionMessage({
          type: 'error',
          scope: 'equip',
          text: `${result.message}${unlockText}`,
        });
      }
    },
    [equipTechnique, selectedLoadout, techniqueId],
  );

  const handleFavoriteToggle = useCallback(() => {
    if (!techniqueId) return;
    const willFavorite = !(selectedEntry?.favorite ?? false);
    toggleFavorite(techniqueId);
    setActionMessage({
      type: 'info',
      scope: 'equip',
      text: willFavorite ? 'Added to favorites.' : 'Removed from favorites.',
    });
  }, [selectedEntry?.favorite, techniqueId, toggleFavorite]);

  const handleSocketRune = useCallback(
    (slotIndex: number) => {
      if (!techniqueId) return;
      const selection = runeSelections[slotIndex] ?? availableRunes.find((entry) => entry.qty > 0)?.id;
      if (!selection) {
        setActionMessage({ type: 'error', scope: 'runes', text: 'No runes available to socket.' });
        return;
      }

      const result = socketRune(techniqueId, slotIndex, selection);
      if (result.ok) {
        setActionMessage({ type: 'success', scope: 'runes', text: `Socketed rune into slot ${slotIndex + 1}.` });
      } else {
        setActionMessage({ type: 'error', scope: 'runes', text: result.reason ?? 'Unable to socket rune.' });
      }
    },
    [availableRunes, runeSelections, socketRune, techniqueId],
  );

  const handleUnsocketRune = useCallback(
    (slotIndex: number) => {
      if (!techniqueId) return;
      const result = unsocketRune(techniqueId, slotIndex);
      if (result.ok) {
        setActionMessage({ type: 'info', scope: 'runes', text: `Removed rune from slot ${slotIndex + 1}.` });
      } else {
        setActionMessage({ type: 'error', scope: 'runes', text: result.reason ?? 'Unable to remove rune.' });
      }
    },
    [techniqueId, unsocketRune],
  );

  const handleUpgradeRank = useCallback(() => {
    setShowRankModal(true);
    setActionMessage({ type: 'info', scope: 'upgrade', text: 'Rank upgrade ritual opened.' });
  }, []);

  const handleRerollTraits = useCallback(() => {
    setShowTraitModal(true);
    setActionMessage({ type: 'info', scope: 'traits', text: 'Sub-Insight reroll ritual opened.' });
  }, []);

  useEffect(() => {
    if (!open) return;
    setActionMessage(null);
  }, [open, techniqueId]);

  const nextRankCost = nextRankInfo?.cost;
  const rankUpgradeDisabledReason = !nextRankInfo
    ? 'Rank cap reached for current grade.'
    : fragmentsOwnedSelected < (nextRankCost?.fragmentsRequired ?? 0)
      ? 'Not enough fragments.'
      : (inventoryItems[RUNE_DUST_ITEM_ID] ?? 0) < (nextRankCost?.runeDustRequired ?? 0)
        ? 'Not enough rune dust.'
        : (inventoryItems[nextRankCost?.soulInkItemId ?? ''] ?? 0) < (nextRankCost?.soulInkRequired ?? 0)
          ? 'Not enough soul ink.'
          : null;

  const rerollDisabledReason = !techniqueId
    ? 'Technique unavailable.'
    : getEffectiveTraitSlots(techniqueId) <= 0
      ? 'No trait slots available.'
      : (inventoryItems[SOUL_INK_REROLL_ITEM_ID] ?? 0) <= 0
        ? 'Need Soul Ink to reroll traits.'
        : null;

  const rankPowerDeltaPct = selectedEntry && nextRankInfo
    ? (rankMultiplier(nextRankInfo.nextRank) / rankMultiplier(selectedEntry.rank ?? 1) - 1) * 100
    : 10;

  const equipSlots = useMemo(() => {
    if (!selectedLoadout) return [];
    const slots: Array<{ type: SlotType; index: number }> = [];
    const activeCount = progression.displayed.active;
    const passiveCount = progression.displayed.passive;

    for (let idx = 0; idx < activeCount; idx += 1) {
      slots.push({ type: 'active', index: idx });
    }

    for (let idx = 0; idx < passiveCount; idx += 1) {
      slots.push({ type: 'passive', index: idx });
    }

    slots.push({ type: 'ultimate', index: 0 });
    return slots;
  }, [progression.displayed.active, progression.displayed.passive, selectedLoadout]);

  const actionMessageFor = (scope: ActionMessageScope) =>
    actionMessage && actionMessage.scope === scope ? actionMessage : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="techniqueDetailModal"
      initialFocus={initialFocusRef}
    >
      <DialogBackdrop className="techniqueDetailModalOverlay" />
      <div className="techniqueDetailModalPosition">
        <DialogPanel className="techniqueDetailModalPanel" aria-labelledby={titleId}>
          <header className="techniqueDetailModalHeader">
            <div className="techniqueDetailModalHeaderMain">
              <DialogTitle id={titleId} className="techniqueDetailModalTitle">
                {displayName}
              </DialogTitle>
              <div className="techniqueDetailModalMeta" aria-label="Technique metadata">
                <span className="techniqueDetailModalMetaIcon" role="img" aria-label={tierIcon.label} title={tierIcon.label}>
                  {tierIcon.icon}
                </span>
                <span className="techniqueDetailModalMetaIcon" role="img" aria-label={pathIcon.label} title={pathIcon.label}>
                  {pathIcon.icon}
                </span>
                <span className="techniqueDetailModalMetaIcon" role="img" aria-label={typeIcon.label} title={typeIcon.label}>
                  {typeIcon.icon}
                </span>
              </div>
            </div>
            <button
              ref={initialFocusRef}
              type="button"
              className="techniqueDetailModalClose"
              onClick={onClose}
            >
              Close
            </button>
          </header>

          <div className={`techniqueDetailModalScrollShadow techniqueDetailModalScrollShadow--top ${showTopShadow ? 'is-visible' : ''}`} />
          <div
            className={`techniqueDetailModalScrollShadow techniqueDetailModalScrollShadow--bottom ${showBottomShadow ? 'is-visible' : ''}`}
          />

          <div className="techniqueDetailModalBody" ref={scrollBodyRef}>
            {isMissing && (
              <div className="techniqueDetailModalMissing">Technique data not found.</div>
            )}
            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Overview</h4>
              <p className="techniqueDetailModalSummary">{summaryLine}</p>
              <div className="techniqueDetailModalChips">
                <span className={`techniqueDetailModalChip type-${selectedType}`}>{
                  selectedType === 'ultimate' ? 'Ultimate' : selectedType === 'passive' ? 'Passive' : 'Active'
                }</span>
                <span className={`techniqueDetailModalChip rarity-${selectedRarity}`}>{rarityLabel(selectedRarity)}</span>
                <span className={`techniqueDetailModalChip grade-${selectedGrade}`}>{gradeLabel(selectedGrade)}</span>
                {technique?.path && <span className="techniqueDetailModalChip">{technique.path}</span>}
                {technique?.role && <span className="techniqueDetailModalChip">{technique.role}</span>}
                <span className="techniqueDetailModalChip">Rank {selectedRank}</span>
              </div>
              <div className="techniqueDetailModalMetaLine">
                {equippedSlot ? `Equipped in slot: ${slotLabel(equippedSlot)}` : 'Not equipped in this loadout.'}
              </div>
            </section>

            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Combat / Effect Breakdown</h4>
              {primaryEffects.length ? (
                <ul className="techniqueDetailModalEffectList">
                  {summarizeEffects(primaryEffects).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>{typeof technique?.effect === 'string' ? technique.effect : 'No effect description available.'}</p>
              )}
              <div className="techniqueDetailModalDivider" />
              <div className="techniqueDetailModalEffectMeta">
                <div>Cooldown: {technique?.cooldownSec ? `${technique.cooldownSec}s` : '—'}</div>
                <div>
                  Cost: {technique?.resourceCost ? `${technique.resourceCost}` : '—'}
                  {technique?.resourceModel ? ` (${technique.resourceModel})` : ''}
                </div>
                <div>Tags: {technique?.tags?.length ? technique.tags.join(', ') : '—'}</div>
              </div>
              <div className="techniqueDetailModalSubsection">
                <div className="techniqueDetailModalSubheading">Secondary / Mastery Bonus</div>
                {masteryLevel >= 75 ? (
                  secondaryEffects.length ? (
                    <ul className="techniqueDetailModalEffectList">
                      {summarizeEffects(secondaryEffects).map((line) => (
                        <li key={line}>
                          <em>(Secondary)</em> {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No secondary effects defined.</p>
                  )
                ) : (
                  <p>Secondary effect locked until Mastery 75.</p>
                )}
                {selectedGrade === 'heaven' && masteryLevel >= 75 && (
                  <div className="techniqueDetailModalHint">
                    Heaven bonus: Secondary potency +{(((heavenBonus as number | undefined) ?? 0.25) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </section>

            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Progression / Upgrade</h4>
              <div className="techniqueDetailModalProgressGrid">
                <div className="techniqueDetailModalProgressCard">
                  <div className="techniqueDetailModalProgressHeader">
                    <span>Mastery Track</span>
                    {masteryMilestoneEffects.cosmeticTitle && masteryLevel >= 100 && (
                      <span className="techniqueDetailModalHint">Title: {masteryMilestoneEffects.cosmeticTitle}</span>
                    )}
                  </div>
                  <div className="techniqueDetailModalProgressBar">
                    <div
                      className="techniqueDetailModalProgressFill"
                      style={{ width: `${Math.min(100, Math.max(0, masteryLevel))}%` }}
                    />
                    {[25, 50, 75, 100].map((mark) => (
                      <div
                        key={mark}
                        className={`techniqueDetailModalProgressTick ${masteryLevel >= mark ? 'is-reached' : ''}`}
                        style={{ left: `${mark}%` }}
                      />
                    ))}
                  </div>
                  <div className="techniqueDetailModalProgressLabel">
                    Mastery {masteryLevel}/100 · Cooldown reduction: {(masteryCdr * 100).toFixed(1)}% · Cost reduction:
                    {(masteryCostReduction * 100).toFixed(1)}%
                  </div>
                  {nextMilestoneDetail && (
                    <div className="techniqueDetailModalHint">Next unlock: {nextMilestoneDetail.effectsSummary.join(', ')}</div>
                  )}
                </div>

                <div className="techniqueDetailModalProgressCard">
                  <div className="techniqueDetailModalProgressHeader">
                    <span>Rank Progress</span>
                    <span className="techniqueDetailModalHint">Cap: {rankCapSelected}</span>
                  </div>
                  <div className="techniqueDetailModalRankRow">
                    <div className="techniqueDetailModalRankPips">
                      {Array.from({ length: rankCapSelected || 1 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`techniqueDetailModalRankPip ${idx < (selectedEntry?.rank ?? 1) ? 'is-filled' : ''}`}
                        />
                      ))}
                    </div>
                    {nextRankInfo ? (
                      <div className="techniqueDetailModalHint">
                        Next rank ({nextRankInfo.nextRank}): {nextRankInfo.cost.fragmentsRequired} fragments ·
                        {nextRankInfo.cost.runeDustRequired} rune dust · {nextRankInfo.cost.soulInkRequired} soul ink
                      </div>
                    ) : (
                      <div className="techniqueDetailModalHint">Rank cap reached for current grade.</div>
                    )}
                  </div>
                  <div className="techniqueDetailModalHint">
                    Fragments owned: {fragmentsOwnedSelected}/{nextRankInfo?.cost.fragmentsRequired ?? '—'}
                  </div>
                  <div className="techniqueDetailModalRankActions">
                    <div className="techniqueDetailModalHint">
                      {nextRankInfo
                        ? `Power increase on upgrade: +${rankPowerDeltaPct.toFixed(0)}%`
                        : 'Rank cap reached: no further power at this grade.'}
                    </div>
                    <button
                      className="techniqueDetailModalSecondaryButton"
                      onClick={handleUpgradeRank}
                      disabled={Boolean(rankUpgradeDisabledReason) || isMissing}
                      title={rankUpgradeDisabledReason ?? undefined}
                      type="button"
                    >
                      Upgrade Rank
                    </button>
                  </div>
                  {rankUpgradeDisabledReason && (
                    <div className="techniqueDetailModalHint">{rankUpgradeDisabledReason}</div>
                  )}
                  {actionMessageFor('upgrade') && (
                    <div className={`techniqueDetailModalActionMessage is-${actionMessageFor('upgrade')?.type}`}>
                      {actionMessageFor('upgrade')?.text}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Equip / Loadout</h4>
              <div className="techniqueDetailModalSlotList">
                {equipSlots.map((slot) => {
                  const isUnlocked =
                    slot.type === 'ultimate'
                      ? progression.unlocked.ultimate
                      : slot.index < (slot.type === 'active' ? progression.unlocked.active : progression.unlocked.passive);
                  const requirement =
                    slot.type === 'ultimate'
                      ? progression.unlockRequirements.ultimate
                      : progression.unlockRequirements[slot.type][slot.index];
                  const techId =
                    slot.type === 'ultimate'
                      ? selectedLoadout?.slots.ultimate
                      : selectedLoadout?.slots[slot.type]?.[slot.index];
                  const techName = techId ? techniquesById[techId]?.name ?? techId : null;
                  const isEquippedHere = techId === techniqueId && Boolean(techniqueId);
                  const buttonLabel = isEquippedHere ? 'Unequip' : techId ? 'Swap Here' : 'Equip Here';
                  const isSelected = selectedSlot.type === slot.type && selectedSlot.index === slot.index;
                  return (
                    <div
                      key={`${slot.type}-${slot.index}`}
                      className={`techniqueDetailModalSlotRow ${isSelected ? 'is-selected' : ''} ${isUnlocked ? '' : 'is-locked'}`}
                    >
                      <button
                        type="button"
                        className="techniqueDetailModalSlotSelect"
                        onClick={() => onSelectSlot(slot)}
                        disabled={!isUnlocked}
                      >
                        <div className="techniqueDetailModalSlotLabel">{slotLabel(slot)}</div>
                        <div className="techniqueDetailModalSlotValue">
                          {isUnlocked ? techName ?? '(Empty)' : '(Locked)'}
                        </div>
                        {!isUnlocked && requirement?.realmName && (
                          <div className="techniqueDetailModalSlotHint">Unlocks at: {requirement.realmName}</div>
                        )}
                      </button>
                      <button
                        type="button"
                        className="techniqueDetailModalPrimaryButton"
                        onClick={() => handleEquip(slot, isEquippedHere ? 'unequip' : 'equip')}
                        disabled={!isUnlocked || isMissing || !techniqueId || !selectedLoadout}
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="techniqueDetailModalActionRow">
                <button
                  className="techniqueDetailModalSecondaryButton"
                  onClick={handleFavoriteToggle}
                  disabled={isMissing || !techniqueId}
                  type="button"
                >
                  {selectedEntry?.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
              </div>
              {actionMessageFor('equip') && (
                <div className={`techniqueDetailModalActionMessage is-${actionMessageFor('equip')?.type}`}>
                  {actionMessageFor('equip')?.text}
                </div>
              )}
            </section>

            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Sub-Insights (Traits)</h4>
              <div className="techniqueDetailModalHint">
                Trait slots = min(Rarity {traitInfoSelected.raritySlots}, Grade cap {traitInfoSelected.gradeCap}) →
                {traitInfoSelected.effectiveSlots}
              </div>
              {traitInfoSelected.effectiveSlots === 0 && <p>No Sub-Insight slots available for this technique.</p>}
              {selectedTraits.length === 0 && traitInfoSelected.effectiveSlots > 0 && (
                <p>No traits yet. Re-scribe to discover fresh insights.</p>
              )}
              {selectedTraits.map((trait, idx) => {
                const def = getTraitDefinition(trait.id);
                const range = getTraitRollRangeLabel(trait.id);
                const quality = getTraitQualityPct(trait);
                const label = def?.name || def?.label || trait.id;
                const valuePct = trait.value ?? trait.valuePct ?? 0;
                return (
                  <div key={`${trait.id}-${idx}`} className="techniqueDetailModalTraitRow">
                    <div className="techniqueDetailModalTraitMain">
                      <div className="techniqueDetailModalTraitName">{label}</div>
                      <div className="techniqueDetailModalTraitValue">{(valuePct * 100).toFixed(1)}%</div>
                    </div>
                    <div className="techniqueDetailModalTraitQuality">
                      <div className="techniqueDetailModalTraitRange">{range}</div>
                      <div className="techniqueDetailModalTraitQualityBar">
                        <div className="techniqueDetailModalTraitQualityFill" style={{ width: `${quality * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="techniqueDetailModalActionRow">
                <div className="techniqueDetailModalHint">
                  Reroll: 1× {rerollItemName}. Lock 1 trait: +1× {rerollItemName} (choose in ritual).
                </div>
                <button
                  className="techniqueDetailModalPrimaryButton"
                  onClick={handleRerollTraits}
                  disabled={Boolean(rerollDisabledReason) || isMissing}
                  title={rerollDisabledReason ?? undefined}
                  type="button"
                >
                  Reroll Sub-Insights
                </button>
              </div>
              {rerollDisabledReason && (
                <div className="techniqueDetailModalHint">{rerollDisabledReason}</div>
              )}
              {actionMessageFor('traits') && (
                <div className={`techniqueDetailModalActionMessage is-${actionMessageFor('traits')?.type}`}>
                  {actionMessageFor('traits')?.text}
                </div>
              )}
            </section>

            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Runes</h4>
              <div className="techniqueDetailModalRuneSockets">
                {runeDisplay.map((runeId, idx) => (
                  <div key={`rune-${idx}`} className="techniqueDetailModalRuneRow">
                    <div className="techniqueDetailModalRuneSlotLabel">Socket {idx + 1}</div>
                    <div className={`techniqueDetailModalRunePill ${runeId ? 'is-filled' : ''}`}>
                      {runeId ? itemsById[runeId]?.name ?? runeId : 'Empty'}
                    </div>
                    <select
                      value={runeSelections[idx] ?? ''}
                      onChange={(e) => setRuneSelections((prev) => ({ ...prev, [idx]: e.target.value }))}
                      disabled={isMissing}
                    >
                      <option value="">Select Rune</option>
                      {availableRunes.map((rune) => (
                        <option key={rune.id} value={rune.id} disabled={rune.qty <= 0}>
                          {rune.name} ({rune.qty})
                        </option>
                      ))}
                    </select>
                    <button
                      className="techniqueDetailModalSecondaryButton"
                      onClick={() => handleSocketRune(idx)}
                      disabled={isMissing}
                      type="button"
                    >
                      Socket
                    </button>
                    {runeId && (
                      <button
                        className="techniqueDetailModalLinkButton"
                        onClick={() => handleUnsocketRune(idx)}
                        disabled={isMissing}
                        type="button"
                      >
                        Unsocket
                      </button>
                    )}
                  </div>
                ))}
                {runeSlots === 0 && <div className="techniqueDetailModalHint">No rune sockets for this grade.</div>}
              </div>
              {actionMessageFor('runes') && (
                <div className={`techniqueDetailModalActionMessage is-${actionMessageFor('runes')?.type}`}>
                  {actionMessageFor('runes')?.text}
                </div>
              )}
            </section>
          </div>
        </DialogPanel>
      </div>

      {showRankModal && techniqueId && (
        <RankUpgradeRitualModal techId={techniqueId} onClose={() => setShowRankModal(false)} />
      )}
      {showTraitModal && techniqueId && (
        <TraitRerollModal techId={techniqueId} onClose={() => setShowTraitModal(false)} />
      )}
    </Dialog>
  );
}

export default TechniqueDetailModal;
