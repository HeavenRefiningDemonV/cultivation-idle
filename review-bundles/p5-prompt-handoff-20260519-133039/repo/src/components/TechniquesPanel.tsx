import { useEffect, useMemo, type ChangeEvent } from 'react';
import type { TechniqueDef } from '../content/index.js';
import { useCombatStore } from '../stores/combatStore.js';
import { useContentStore } from '../stores/contentStore.js';
import { useInventoryStore } from '../stores/inventoryStore.js';
import {
  MASTERY_XP_SCALE,
  masteryLevelFromXp,
  masteryMilestones,
  useTechCollectionStore,
} from '../stores/techCollectionStore.js';
import { useTechniqueStore, type AiProfile } from '../stores/techniqueStore.js';

const aiProfiles: AiProfile[] = ['balanced', 'survivor', 'burst', 'farmer'];

function getDisplayName(def: TechniqueDef | undefined, techId: string) {
  if (def?.name) return def.name;
  return `Unknown technique (${techId})`;
}

function isPassive(def: TechniqueDef | undefined) {
  if (!def) return false;
  if (def.type === 'passive') return true;
  return def.tags?.some((tag) => tag.toLowerCase() === 'passive') ?? false;
}

function isUltimate(def: TechniqueDef | undefined) {
  return def?.type === 'ultimate';
}

function describeTags(def: TechniqueDef | undefined) {
  return def?.tags?.join(', ') ?? '—';
}

function describeResourceCost(def: TechniqueDef | undefined) {
  if (!def || def.resourceCost === undefined) return null;
  const model = def.resourceModel?.toLowerCase() ?? 'none';
  if (model.includes('heaven') || model.includes('qi')) {
    return `Cost: ${def.resourceCost}% MaxQi`;
  }
  if (model.includes('martial') || model.includes('intent')) {
    return `Cost: ${def.resourceCost} Intent`;
  }
  return null;
}

function getRankLabel(rank: number) {
  const labels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  if (rank <= 0) return 'I';
  return labels[Math.min(rank, 10) - 1] ?? 'X';
}

function getMasteryProgress(xp: number) {
  const level = masteryLevelFromXp(xp);
  const levelStart = Math.pow(level - 1, 2) * MASTERY_XP_SCALE;
  const levelEnd = Math.pow(level, 2) * MASTERY_XP_SCALE;
  const span = levelEnd - levelStart || 1;
  const progress = (xp - levelStart) / span;
  return {
    level,
    progress: Math.min(1, Math.max(0, progress)),
    levelStart,
    levelEnd,
  };
}

export function TechniquesPanel() {
  const { loadouts, selectedLoadoutId, setSelectedLoadout, setAiProfile, equipTechnique } =
    useTechniqueStore();
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const ensureTraits = useTechCollectionStore((state) => state.ensureTraits);
  const rerollTraits = useTechCollectionStore((state) => state.rerollTraits);
  const getEffectiveTraitSlots = useTechCollectionStore((state) => state.getEffectiveTraitSlots);
  const getEffectiveRuneSlots = useTechCollectionStore((state) => state.getEffectiveRuneSlots);
  const getTraitDisplay = useTechCollectionStore((state) => state.getTraitDisplay);
  const ensureRunes = useTechCollectionStore((state) => state.ensureRunes);
  const socketRune = useTechCollectionStore((state) => state.socketRune);
  const unsocketRune = useTechCollectionStore((state) => state.unsocketRune);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const runesById = useContentStore((state) => state.maps.runesById);
  const fragments = useTechCollectionStore((state) => state.fragments);
  const upgradeRank = useTechCollectionStore((state) => state.upgradeRank);
  const getRankCap = useTechCollectionStore((state) => state.getRankCap);
  const getRankUpgradeCost = useTechCollectionStore((state) => state.getRankUpgradeCost);
  const items = useInventoryStore((state) => state.items);
  const inCombat = useCombatStore((state) => state.inCombat);
  const techniqueCooldowns = useCombatStore((state) => state.techniqueCooldowns);
  const combatResources = useCombatStore((state) => state.combatResources);
  const combatShield = useCombatStore((state) => state.combatShield);
  const combatBuffs = useCombatStore((state) => state.combatBuffs);
  const techniqueLog = useCombatStore((state) => state.techniqueLog);

  const selectedLoadout = useMemo(() => {
    return loadouts.find((loadout) => loadout.id === selectedLoadoutId);
  }, [loadouts, selectedLoadoutId]);

  const unlockedList = useMemo(() => {
    return Object.entries(unlockedTechs)
      .filter(([, meta]) => meta?.unlocked)
      .map(([techId, meta]) => ({
        id: techId,
        def: techniquesById[techId],
        masteryXp: meta?.masteryXp ?? 0,
        rank: meta?.rank ?? 1,
        runes: meta?.runes ?? [],
        lastCastAt: meta?.lastCastAt ?? null,
      }))
      .sort((a, b) => getDisplayName(a.def, a.id).localeCompare(getDisplayName(b.def, b.id)));
  }, [techniquesById, unlockedTechs]);

  const activeCandidates = unlockedList.filter((entry) => !isPassive(entry.def) && !isUltimate(entry.def));
  const passiveCandidates = unlockedList.filter((entry) => isPassive(entry.def));
  const ultimateCandidates = unlockedList.filter((entry) => isUltimate(entry.def));

  const handleLoadoutChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLoadout(event.target.value);
  };

  const handleAiProfileChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedLoadout) return;
    setAiProfile(selectedLoadout.id, event.target.value as AiProfile);
  };

  const handleEquip = (slotType: 'active' | 'passive' | 'ultimate', index: number) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      equipTechnique(slotType, index, event.target.value);
    };

  const activeSlots = selectedLoadout?.slots.active ?? ['', ''];
  const passiveSlots = selectedLoadout?.slots.passive ?? [''];
  const ultimateSlot = selectedLoadout?.slots.ultimate ?? null;
  const now = Date.now();
  const recentTechniqueLog = useMemo(() => {
    return [...techniqueLog].slice(-10).reverse();
  }, [techniqueLog]);

  const lastCastInfo = useMemo(() => {
    const entries = unlockedList
      .filter((entry) => entry.lastCastAt)
      .sort((a, b) => (b.lastCastAt ?? 0) - (a.lastCastAt ?? 0));
    const latest = entries[0];
    if (!latest || !latest.lastCastAt) return null;
    return {
      techId: latest.id,
      name: getDisplayName(latest.def, latest.id),
      at: latest.lastCastAt,
    };
  }, [unlockedList]);

  const availableRuneItems = useMemo(() => {
    const runeIds = Object.keys(runesById);
    if (runeIds.length === 0) return [];
    return runeIds
      .map((runeId) => ({
        id: runeId,
        name: itemsById[runeId]?.name ?? runeId,
        qty: items[runeId] ?? 0,
      }))
      .filter((entry) => entry.qty > 0);
  }, [items, itemsById, runesById]);

  const runeConfigAvailable = useMemo(() => Object.keys(runesById).length > 0, [runesById]);

  const techniqueCards = useMemo(() => {
    return unlockedList.map((entry) => {
      const mastery = getMasteryProgress(entry.masteryXp);
      const milestones = masteryMilestones(mastery.level);
      const flags = [
        milestones.at25 ? '25' : null,
        milestones.at50 ? '50' : null,
        milestones.at75 ? '75' : null,
        milestones.at100 ? '100' : null,
      ].filter(Boolean);
      const rankCap = getRankCap(entry.id);
      const nextRank = entry.rank + 1;
      const cost = getRankUpgradeCost(nextRank);
      const fragmentCount = fragments[entry.id] ?? 0;
      const runeDustCount = items['mat_rune_dust'] ?? 0;
      const soulInkCount = cost ? (items[cost.soulInkItemId] ?? 0) : 0;
      const traitSlots = getEffectiveTraitSlots(entry.id);
      const traits = getTraitDisplay(entry.id);
      const rerollInkId = 'reagent_soul_ink_t0';
      const rerollInkName = itemsById[rerollInkId]?.name ?? 'Soul Ink';
      const rerollInkQty = items[rerollInkId] ?? 0;
      const canReroll = traitSlots > 0 && rerollInkQty >= 1;
      const runeSlots = getEffectiveRuneSlots(entry.id);
      const runeSlotsArray = Array.from({ length: runeSlots }, (_, idx) => entry.runes?.[idx] ?? null);
      const canUpgrade =
        cost &&
        entry.rank < rankCap &&
        fragmentCount >= cost.fragmentsRequired &&
        runeDustCount >= cost.runeDustRequired &&
        soulInkCount >= cost.soulInkRequired;
      let disabledReason = '';
      if (entry.rank >= rankCap) disabledReason = 'Rank cap reached.';
      else if (!cost) disabledReason = 'Upgrade unavailable.';
      else if (fragmentCount < cost.fragmentsRequired) disabledReason = 'Not enough fragments.';
      else if (runeDustCount < cost.runeDustRequired) disabledReason = 'Not enough rune dust.';
      else if (soulInkCount < cost.soulInkRequired) disabledReason = 'Not enough soul ink.';

      return {
        ...entry,
        mastery,
        milestoneFlags: flags,
        rankCap,
        cost,
        fragmentCount,
        runeDustCount,
        soulInkCount,
        traitSlots,
        traits,
        rerollInkName,
        rerollInkQty,
        canReroll,
        runeSlots,
        runeSlotsArray,
        canUpgrade,
        disabledReason,
      };
    });
  }, [
    fragments,
    getEffectiveRuneSlots,
    getEffectiveTraitSlots,
    getRankCap,
    getRankUpgradeCost,
    getTraitDisplay,
    items,
    itemsById,
    unlockedList,
  ]);

  useEffect(() => {
    Object.keys(unlockedTechs).forEach((techId) => {
      ensureTraits(techId);
      ensureRunes(techId);
    });
  }, [ensureRunes, ensureTraits, unlockedTechs]);

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>Techniques</div>
        <div className={'worldScreenPlaceholderKey'}>techniquesPanel</div>
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>
          Last cast:{' '}
          {lastCastInfo
            ? `${lastCastInfo.name} @ ${new Date(lastCastInfo.at).toLocaleTimeString()}`
            : '—'}
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          <label>
            Loadout:{' '}
            <select value={selectedLoadoutId} onChange={handleLoadoutChange}>
              {loadouts.map((loadout) => (
                <option key={loadout.id} value={loadout.id}>
                  {loadout.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          <label>
            AI Profile:{' '}
            <select value={selectedLoadout?.aiProfile ?? 'balanced'} onChange={handleAiProfileChange}>
              {aiProfiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          AI: {(selectedLoadout?.aiProfile ?? 'balanced').toUpperCase()}
        </div>
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Active Slots</div>
        {activeSlots.map((techId, index) => {
          const def = techId ? techniquesById[techId] : undefined;
          const cooldownReadyAt = techId ? techniqueCooldowns[techId] : undefined;
          const remainingSec =
            inCombat && cooldownReadyAt ? Math.max(0, (cooldownReadyAt - now) / 1000) : 0;
          const cooldownText = !techId
            ? ''
            : !inCombat || remainingSec <= 0
              ? 'Ready'
              : `CD: ${remainingSec.toFixed(1)}s`;
          const costText = describeResourceCost(def);

          return (
            <div key={`active-${index}`} className={'worldScreenPlaceholderLine'}>
              Slot {index + 1}:{' '}
              <select value={techId} onChange={handleEquip('active', index)}>
                <option value="">(Empty)</option>
                {activeCandidates.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {getDisplayName(entry.def, entry.id)}
                  </option>
                ))}
              </select>
              {techId && (
                <div>
                  {getDisplayName(def, techId)} • {cooldownText}
                  {costText ? ` • ${costText}` : ''}
                </div>
              )}
            </div>
          );
        })}

        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Passive Slot</div>
        <div className={'worldScreenPlaceholderLine'}>
          <select value={passiveSlots[0]} onChange={handleEquip('passive', 0)}>
            <option value="">(Empty)</option>
            {passiveCandidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {getDisplayName(entry.def, entry.id)}
              </option>
            ))}
          </select>
          {passiveSlots[0] && (
            <div>{getDisplayName(techniquesById[passiveSlots[0]], passiveSlots[0])}</div>
          )}
        </div>

        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Ultimate</div>
        <div className={'worldScreenPlaceholderLine'}>
          <select value={ultimateSlot ?? ''} onChange={handleEquip('ultimate', 0)} disabled={ultimateCandidates.length === 0}>
            <option value="">{ultimateCandidates.length === 0 ? 'Coming later' : '(Empty)'}</option>
            {ultimateCandidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {getDisplayName(entry.def, entry.id)}
              </option>
            ))}
          </select>
          {ultimateSlot && (
            <div>{getDisplayName(techniquesById[ultimateSlot], ultimateSlot)}</div>
          )}
        </div>
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Combat runtime</div>
        {!inCombat && <div className={'worldScreenPlaceholderLine'}>Not in combat.</div>}
        {inCombat && (
          <>
            <div className={'worldScreenPlaceholderLine'}>
              Resources: Qi {combatResources.qi.toFixed(1)} / {combatResources.maxQi.toFixed(0)} •
              Intent {combatResources.intent.toFixed(1)} / {combatResources.maxIntent.toFixed(0)}
            </div>
            <div className={'worldScreenPlaceholderLine'}>
              Shield:{' '}
              {combatShield && combatShield.amount > 0
                ? `${combatShield.amount.toFixed(0)}${combatShield.expiresAt ? ` (${Math.max(0, (combatShield.expiresAt - now) / 1000).toFixed(0)}s)` : ''}`
                : 'None'}
            </div>
            <div className={'worldScreenPlaceholderLine'}>
              Buffs: {combatBuffs.length === 0 ? 'None' : ''}
            </div>
            {combatBuffs.map((buff) => (
              <div key={buff.id} className={'worldScreenPlaceholderLine'}>
                {buff.stat} {buff.mode === 'pct' ? `${Math.round(buff.value * 100)}%` : buff.value} •{' '}
                {Math.max(0, (buff.endsAt - now) / 1000).toFixed(0)}s
              </div>
            ))}
            <div className={'worldScreenPlaceholderLine'}>Recent casts</div>
            {recentTechniqueLog.length === 0 && (
              <div className={'worldScreenPlaceholderLine'}>No casts yet.</div>
            )}
            {recentTechniqueLog.map((entry, index) => (
              <div key={`${entry.at}-${index}`} className={'worldScreenPlaceholderLine'}>
                {new Date(entry.at).toLocaleTimeString()} • {entry.kind.toUpperCase()} • {entry.message}
              </div>
            ))}
          </>
        )}
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Unlocked techniques</div>
        {techniqueCards.length === 0 && (
          <div className={'worldScreenPlaceholderLine'}>
            Buy manuals to study techniques and equip them for combat.
          </div>
        )}
        {techniqueCards.map((entry) => (
          <div key={entry.id} id={`tech-card-${entry.id}`} className={'worldScreenPlaceholderLine'}>
            <div>{getDisplayName(entry.def, entry.id)}</div>
            <div>
              Type: {entry.def?.type ?? '—'} • Tags: {describeTags(entry.def)}
              {entry.def?.cooldownSec ? ` • Cooldown: ${entry.def.cooldownSec}s` : ''}
              {describeResourceCost(entry.def) ? ` • ${describeResourceCost(entry.def)}` : ''}
            </div>
            <div>
              Mastery: L{entry.mastery.level} (XP {Math.floor(entry.masteryXp)}){' '}
              {entry.milestoneFlags.length > 0 ? ` • Milestones: ${entry.milestoneFlags.join('/')}` : ''}
            </div>
            <div style={{ background: '#1f2937', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div
                style={{
                  background: '#22c55e',
                  width: `${Math.round(entry.mastery.progress * 100)}%`,
                  height: '100%',
                }}
              />
            </div>
            <div>
              Rank: {getRankLabel(entry.rank)} / {getRankLabel(entry.rankCap)}
            </div>
            <div>
              Rank cost:{' '}
              {entry.cost
                ? `${entry.cost.fragmentsRequired} fragments • ${entry.cost.runeDustRequired} Rune Dust • ${entry.cost.soulInkRequired} ${itemsById[entry.cost.soulInkItemId]?.name ?? entry.cost.soulInkItemId}`
                : '—'}
            </div>
            <button
              className={'worldScreenModuleButton'}
              onClick={() => upgradeRank(entry.id)}
              disabled={!entry.canUpgrade}
            >
              Upgrade Rank
            </button>
            {!entry.canUpgrade && entry.disabledReason && (
              <div className={'worldScreenInlineError'}>{entry.disabledReason}</div>
            )}
            <div>
              Traits ({entry.traits.length}/{entry.traitSlots})
            </div>
            {entry.traits.length === 0 && <div>No traits yet.</div>}
            {entry.traits.map((trait) => (
              <div key={`${entry.id}-${trait}`}>{trait}</div>
            ))}
            <button
              className={'worldScreenModuleButton'}
              onClick={() => rerollTraits(entry.id)}
              disabled={!entry.canReroll}
            >
              Reroll Traits (cost: 1 {entry.rerollInkName})
            </button>
            {!entry.canReroll && entry.traitSlots > 0 && (
              <div className={'worldScreenInlineError'}>Not enough soul ink.</div>
            )}
            <div>
              Runes ({entry.runes?.filter(Boolean).length ?? 0}/{entry.runeSlots})
            </div>
            {!runeConfigAvailable && <div>Runes not available (missing runes config).</div>}
            {runeConfigAvailable && entry.runeSlots === 0 && <div>No rune sockets unlocked.</div>}
            {runeConfigAvailable && entry.runeSlots > 0 && (
              <div>
                {entry.runeSlotsArray.map((runeId, slotIndex) => (
                  <div key={`${entry.id}-rune-${slotIndex}`}>
                    Slot {slotIndex + 1}:{' '}
                    {runeId ? (
                      <>
                        {itemsById[runeId]?.name ?? runeId}{' '}
                        <button
                          className={'worldScreenModuleButton'}
                          onClick={() => unsocketRune(entry.id, slotIndex)}
                        >
                          Unsocket
                        </button>
                      </>
                    ) : (
                      <>
                        Empty{' '}
                        {availableRuneItems.length > 0 ? (
                          <select
                            onChange={(event) => {
                              const value = event.target.value;
                              if (value) socketRune(entry.id, slotIndex, value);
                              event.currentTarget.value = '';
                            }}
                          >
                            <option value="">Socket rune...</option>
                            {availableRuneItems.map((rune) => (
                              <option key={rune.id} value={rune.id}>
                                {itemsById[rune.id]?.name ?? rune.id} ({rune.qty})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>No runes in inventory.</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechniquesPanel;
