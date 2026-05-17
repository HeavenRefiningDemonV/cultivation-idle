import type { AiProfile, CastingPolicy, TechniqueSlotType } from '../../types/index.js';
import { GameIcon } from '../../ui/icons/index.js';
import { SemanticTechniqueName } from '../../ui/techniques/SemanticTechniqueName.js';
import { VisualIdentityBadge } from '../../ui/techniques/VisualIdentityBadge.js';
import type {
  TechniquesExactAiProfileButtonSurface,
  TechniquesExactCastingPolicyButtonSurface,
  TechniquesExactFilterId,
  TechniquesExactOwnedTechniqueRowSurface,
  TechniquesExactSlotSurface,
  TechniquesExactSurfaceV1,
} from './techniquesExactTypes.js';
import './TechniquesExactScreen.scss';

export interface TechniquesExactScreenProps {
  surface: TechniquesExactSurfaceV1;
  onSelectLoadout?: (loadoutId: string) => void;
  onSelectAiProfile?: (profile: AiProfile) => void;
  onSelectCastingPolicy?: (policy: CastingPolicy) => void;
  onSelectOwnedTechnique?: (techId: string) => void;
  onSelectFilter?: (filterId: TechniquesExactFilterId) => void;
  onSelectSlot?: (slotKey: string, slotType: TechniqueSlotType, slotIndex: number) => void;
  onRequestEquip?: (slotType: TechniqueSlotType, slotIndex: number, techId: string | null) => void;
  onRequestUnequip?: (slotType: TechniqueSlotType, slotIndex: number) => void;
  onOpenDetails?: (techId: string | null) => void;
  onApplyLoadout?: () => void;
  onGoToManualPavilion?: () => void;
  onOpenAdvancedFilters?: () => void;
}

const icon = (iconId?: string, size = 18) => (
  <GameIcon icon={(iconId ?? 'inkSparkles') as never} size={size} decorative />
);

const actionDisabledTitle = (enabled: boolean, reason?: string) => (!enabled && reason ? reason : undefined);

export function TechniquesExactScreen({
  surface,
  onSelectLoadout,
  onSelectAiProfile,
  onSelectCastingPolicy,
  onSelectOwnedTechnique,
  onSelectFilter,
  onSelectSlot,
  onRequestEquip,
  onRequestUnequip,
  onOpenDetails,
  onApplyLoadout,
  onGoToManualPavilion,
  onOpenAdvancedFilters,
}: TechniquesExactScreenProps) {
  const selectedTechniqueId = surface.meta.selectedTechniqueId;

  return (
    <div
      className="techniquesExactPage"
      data-testid={surface.meta.rootTestId}
      data-mode={surface.meta.mode}
      data-source={surface.meta.source}
      data-selected-loadout-id={surface.meta.selectedLoadoutId}
      data-selected-technique-id={selectedTechniqueId ?? ''}
      data-selected-slot-key={surface.meta.selectedSlotKey ?? ''}
    >
      <header className="techniquesExactTop">
        <div className="techniquesExactTitleBlock">
          <h1>{surface.page.title}</h1>
          <p>{surface.page.subtitle}</p>
        </div>
        <section className="techniquesExactDiagnosis" aria-labelledby="techniques-exact-diagnosis-title">
          <span className="techniquesExactDiagnosis__seal" aria-hidden="true">診</span>
          <div className="techniquesExactDiagnosis__copy">
            <h2 id="techniques-exact-diagnosis-title">{surface.diagnosisBanner.title}</h2>
            <p>{surface.diagnosisBanner.primaryLine}</p>
            <div className="techniquesExactChips" aria-label="Diagnosis facts">
              {surface.diagnosisBanner.chips.map((chip) => (
                <span key={chip.id} className="techniquesExactChip" data-tone={chip.tone}>
                  <span>{chip.label}</span>
                  {chip.value ? <strong>{chip.value}</strong> : null}
                </span>
              ))}
            </div>
          </div>
        </section>
        <div className="techniquesExactTopBadges" aria-label="Current doctrine">
          <div className="techniquesExactPlaque">{surface.page.loadoutBadge}</div>
          <div className="techniquesExactAiSeal">{surface.page.aiSeal}</div>
        </div>
      </header>

      <aside className="techniquesExactLeftRail" aria-label="Technique doctrine controls">
        <h2>{surface.leftRail.title}</h2>
        <div className="techniquesExactLoadoutList">
          {surface.leftRail.loadouts.map((loadout) => (
            <button
              key={loadout.id}
              type="button"
              className="techniquesExactLoadoutRow"
              data-selected={loadout.selected}
              aria-pressed={loadout.selected}
              onClick={() => onSelectLoadout?.(loadout.id)}
            >
              <span className="techniquesExactLoadoutRow__seal" aria-hidden="true">{loadout.selected ? '◆' : '◇'}</span>
              <span>
                <strong>{loadout.label}</strong>
                <small>{loadout.subtitle}</small>
              </span>
              <span className="techniquesExactLoadoutRow__count">{loadout.equippedCountLabel}</span>
            </button>
          ))}
        </div>

        <section className="techniquesExactRailSection" aria-labelledby="techniques-exact-ai-title">
          <h3 id="techniques-exact-ai-title">{surface.leftRail.aiProfileTitle}</h3>
          <div className="techniquesExactAiGrid">
            {surface.leftRail.aiProfiles.map((profile) => (
              <AiButton key={profile.id} profile={profile} onSelect={onSelectAiProfile} />
            ))}
          </div>
          <p className="techniquesExactWarning" data-visible={Boolean(surface.leftRail.aiWarning)}>
            {surface.leftRail.aiWarning ?? 'AI profile is aligned with the current doctrine.'}
          </p>
        </section>

        <section className="techniquesExactRailSection" aria-labelledby="techniques-exact-casting-title">
          <h3 id="techniques-exact-casting-title">{surface.leftRail.castingPolicyTitle}</h3>
          <div className="techniquesExactCastingGrid">
            {surface.leftRail.castingPolicies.map((policy) => (
              <CastingButton key={policy.id} policy={policy} onSelect={onSelectCastingPolicy} />
            ))}
          </div>
          <p className="techniquesExactCastingHelper">{surface.leftRail.castingHelper}</p>
        </section>
      </aside>

      <main className="techniquesExactAltar" aria-label={surface.altar.title}>
        <div className="techniquesExactAltar__stage">
          <div className="techniquesExactAltar__ring" aria-hidden="true" />
          <div className="techniquesExactAltar__orb" data-tone={surface.altar.centerOrb.tone}>
            <span aria-hidden="true">{surface.altar.centerOrb.glyph}</span>
            <small>{surface.altar.centerOrb.label}</small>
          </div>
          <div className="techniquesExactSlotMap">
            {surface.altar.slots.map((slot) => (
              <TechniqueSlot
                key={slot.key}
                slot={slot}
                selectedTechniqueId={selectedTechniqueId}
                onSelectSlot={onSelectSlot}
                onRequestEquip={onRequestEquip}
                onRequestUnequip={onRequestUnequip}
              />
            ))}
          </div>
        </div>
        <section className="techniquesExactFormMetrics" aria-label="Current combat form metrics">
          <h2>{surface.altar.title}</h2>
          <div>
            {surface.altar.metrics.map((metric) => (
              <span key={metric.id}>{metric.value}</span>
            ))}
          </div>
          <p className="techniquesExactFeedback" data-tone={surface.altar.feedback.tone}>
            {surface.altar.feedback.message ?? 'Select a technique slip or altar slot to adjust the combat form.'}
          </p>
        </section>
      </main>

      <section className="techniquesExactLibrary" aria-labelledby="techniques-exact-library-title">
        <div className="techniquesExactLibrary__header">
          <h2 id="techniques-exact-library-title">{surface.ownedLibrary.title}</h2>
          <div className="techniquesExactFilterChips" role="tablist" aria-label="Technique filters">
            {surface.ownedLibrary.filterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="techniquesExactFilterChip"
                data-selected={chip.selected}
                data-tone={chip.tone}
                role="tab"
                aria-selected={Boolean(chip.selected)}
                onClick={() => onSelectFilter?.(chip.id as TechniquesExactFilterId)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="techniquesExactAdvancedFilterButton"
            disabled={!surface.ownedLibrary.advancedFilterButton.enabled}
            onClick={() => onOpenAdvancedFilters?.()}
          >
            {surface.ownedLibrary.advancedFilterButton.label}
          </button>
        </div>
        <div className="techniquesExactTechniqueRows" role="listbox" aria-label="Owned techniques">
          {surface.ownedLibrary.rows.map((row) => (
            <OwnedTechniqueRow
              key={row.id}
              row={row}
              onSelect={onSelectOwnedTechnique}
            />
          ))}
          {surface.ownedLibrary.emptyState ? (
            <div className="techniquesExactEmptyState">{surface.ownedLibrary.emptyState}</div>
          ) : null}
        </div>
      </section>

      <aside className="techniquesExactRightRail" aria-label="Technique inspection and readiness">
        <section
          className="techniquesExactInspector"
          aria-labelledby="techniques-exact-inspector-title"
          data-path={surface.inspector.visualIdentity?.cssAttrs.path ?? 'neutral'}
          data-role={surface.inspector.visualIdentity?.cssAttrs.role ?? 'neutral'}
          data-grade={surface.inspector.visualIdentity?.cssAttrs.grade ?? 'unknown'}
          data-rarity={surface.inspector.visualIdentity?.cssAttrs.rarity ?? 'unknown'}
          data-rarity-fx={surface.inspector.visualIdentity?.cssAttrs.rarityFx ?? 'none'}
        >
          <h2 id="techniques-exact-inspector-title">{surface.inspector.title}</h2>
          <div className="techniquesExactInspector__hero">
            <span className="techniquesExactInspector__icon" aria-hidden="true">{icon(surface.inspector.iconId, 36)}</span>
            <div>
              <strong>
                <SemanticTechniqueName
                  tokens={surface.inspector.visualIdentity?.nameTokens}
                  fallback={surface.inspector.selectedName ?? 'No Technique Selected'}
                />
              </strong>
              <span>{surface.inspector.stateStamp}</span>
              {surface.inspector.heroBadges && surface.inspector.heroBadges.length > 0 ? (
                <div className="techniquesExactInspector__badges" aria-label="Selected technique identity">
                  {surface.inspector.heroBadges.map((badge) => (
                    <VisualIdentityBadge key={badge.id} badge={badge} className="visualIdentityBadge--compact" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <dl className="techniquesExactFactList">
            {surface.inspector.rows.map((row) => (
              <div key={row.id} className="techniquesExactFactRow" data-tone={row.tone} data-row-kind={row.rowKind}>
                <dt>{row.label}</dt>
                <dd>
                  {row.badge ? <VisualIdentityBadge badge={row.badge} showSublabel /> : <span>{row.value}</span>}
                  {row.detail && !row.badge ? <small>{row.detail}</small> : null}
                </dd>
              </div>
            ))}
          </dl>
          <div className="techniquesExactRecommendation">
            <span>Recommended Action</span>
            <strong>{surface.inspector.recommendedAction}</strong>
          </div>
          <button
            type="button"
            className="techniquesExactSecondaryButton"
            disabled={!surface.inspector.openDetailsButton.enabled}
            title={actionDisabledTitle(surface.inspector.openDetailsButton.enabled, surface.inspector.openDetailsButton.reason)}
            onClick={() => onOpenDetails?.(surface.inspector.selectedTechniqueId)}
          >
            {surface.inspector.openDetailsButton.label}
          </button>
          <button
            type="button"
            className="techniquesExactManualButton"
            disabled={!surface.inspector.missingKnowledgeButton.enabled}
            title={actionDisabledTitle(surface.inspector.missingKnowledgeButton.enabled, surface.inspector.missingKnowledgeButton.reason)}
            onClick={() => onGoToManualPavilion?.()}
          >
            {surface.inspector.missingKnowledgeButton.label}
          </button>
        </section>

        <section className="techniquesExactReadiness" aria-labelledby="techniques-exact-readiness-title">
          <h2 id="techniques-exact-readiness-title">{surface.readinessImpact.title}</h2>
          <dl className="techniquesExactReadinessRows">
            {surface.readinessImpact.segments.map((segment) => (
              <div key={segment.id} data-status={segment.status} data-tone={segment.tone}>
                <dt>{segment.label}</dt>
                <dd>{segment.value}</dd>
              </div>
            ))}
          </dl>
          <div className="techniquesExactCtaRow">
            <button
              type="button"
              className="techniquesExactPrimaryButton"
              disabled={!surface.readinessImpact.applyLoadoutButton.enabled}
              onClick={() => onApplyLoadout?.()}
            >
              {surface.readinessImpact.applyLoadoutButton.label}
            </button>
            <button
              type="button"
              className="techniquesExactSecondaryButton"
              disabled={!surface.readinessImpact.goToManualPavilionButton.enabled}
              title={actionDisabledTitle(surface.readinessImpact.goToManualPavilionButton.enabled, surface.readinessImpact.goToManualPavilionButton.reason)}
              onClick={() => onGoToManualPavilion?.()}
            >
              {surface.readinessImpact.goToManualPavilionButton.label}
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}

function AiButton({
  profile,
  onSelect,
}: {
  profile: TechniquesExactAiProfileButtonSurface;
  onSelect?: (profile: AiProfile) => void;
}) {
  return (
    <button
      type="button"
      className="techniquesExactAiButton"
      data-selected={profile.selected}
      aria-pressed={profile.selected}
      title={profile.warning ?? profile.description}
      disabled={!profile.enabled}
      onClick={() => onSelect?.(profile.id)}
    >
      <span aria-hidden="true">{profile.id === 'balanced' ? '衡' : profile.id === 'survivor' ? '盾' : profile.id === 'burst' ? '破' : '穗'}</span>
      <strong>{profile.label}</strong>
    </button>
  );
}

function CastingButton({
  policy,
  onSelect,
}: {
  policy: TechniquesExactCastingPolicyButtonSurface;
  onSelect?: (policy: CastingPolicy) => void;
}) {
  return (
    <button
      type="button"
      className="techniquesExactCastingButton"
      data-selected={policy.selected}
      aria-pressed={policy.selected}
      title={`${policy.helper} ${policy.technicalMapping}`}
      disabled={!policy.enabled}
      onClick={() => onSelect?.(policy.underlyingPolicy)}
    >
      <span aria-hidden="true">{policy.underlyingPolicy === 'balanced' ? '旋' : policy.underlyingPolicy === 'aggressive' ? '序' : '掌'}</span>
      <strong>{policy.displayLabel}</strong>
    </button>
  );
}

function TechniqueSlot({
  slot,
  selectedTechniqueId,
  onSelectSlot,
  onRequestEquip,
  onRequestUnequip,
}: {
  slot: TechniquesExactSlotSurface;
  selectedTechniqueId: string | null;
  onSelectSlot?: (slotKey: string, slotType: TechniqueSlotType, slotIndex: number) => void;
  onRequestEquip?: (slotType: TechniqueSlotType, slotIndex: number, techId: string | null) => void;
  onRequestUnequip?: (slotType: TechniqueSlotType, slotIndex: number) => void;
}) {
  return (
    <div
      className="techniquesExactSlot"
      data-slot={slot.key}
      data-selected={slot.selected}
      data-unlocked={slot.isUnlocked}
      data-equipped={slot.equipped}
      data-slot-role={slot.displayRole ?? slot.slotType}
      data-role={slot.visualIdentity?.cssAttrs.role ?? 'neutral'}
      data-path={slot.visualIdentity?.cssAttrs.path ?? 'neutral'}
      data-grade={slot.visualIdentity?.cssAttrs.grade ?? 'unknown'}
      data-rarity={slot.visualIdentity?.cssAttrs.rarity ?? 'unknown'}
      data-rarity-fx={slot.visualIdentity?.cssAttrs.rarityFx ?? 'none'}
    >
      <button
        type="button"
        className="techniquesExactSlot__button"
        aria-pressed={slot.selected}
        aria-label={`${slot.label}: ${slot.techniqueName ?? slot.unlockLabel ?? 'Empty'}`}
        title={slot.disabledReason}
        onClick={() => onSelectSlot?.(slot.key, slot.slotType, slot.slotIndex)}
      >
        <span className="techniquesExactSlot__aura" aria-hidden="true" />
        <span className="techniquesExactSlot__label">{slot.label}</span>
        <span className="techniquesExactSlot__icon" aria-hidden="true">{icon(slot.iconId, 26)}</span>
        <strong>
          <SemanticTechniqueName
            tokens={slot.visualIdentity?.nameTokens}
            fallback={slot.techniqueName ?? slot.unlockLabel ?? 'Empty'}
          />
        </strong>
        <small>{slot.visualIdentity ? `${slot.visualIdentity.gradeLabel.replace(' Grade', '')} / ${slot.masteryLabel ?? slot.runeSocketLabel ?? 'fixed slot'}` : slot.masteryLabel ?? slot.runeSocketLabel ?? 'fixed slot'}</small>
      </button>
      <div className="techniquesExactSlot__actions">
        <button
          type="button"
          disabled={!slot.canEquipSelected || !selectedTechniqueId}
          title={!slot.canEquipSelected ? slot.disabledReason ?? 'Selected technique does not fit this slot.' : undefined}
          onClick={() => onRequestEquip?.(slot.slotType, slot.slotIndex, selectedTechniqueId)}
        >
          Equip
        </button>
        <button
          type="button"
          disabled={!slot.canUnequip}
          onClick={() => onRequestUnequip?.(slot.slotType, slot.slotIndex)}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function OwnedTechniqueRow({
  row,
  onSelect,
}: {
  row: TechniquesExactOwnedTechniqueRowSurface;
  onSelect?: (techId: string) => void;
}) {
  return (
    <button
      type="button"
      className="techniquesExactTechniqueRow"
      role="option"
      aria-selected={row.selected}
      data-selected={row.selected}
      data-equipped={row.equipped}
      data-recommended={row.recommended}
      data-path={row.visualIdentity.cssAttrs.path}
      data-role={row.visualIdentity.cssAttrs.role}
      data-grade={row.visualIdentity.cssAttrs.grade}
      data-rarity={row.visualIdentity.cssAttrs.rarity}
      data-rarity-fx={row.visualIdentity.cssAttrs.rarityFx}
      disabled={row.disabled}
      onClick={() => onSelect?.(row.id)}
    >
      <span className="techniquesExactTechniqueRow__icon" aria-hidden="true">{icon(row.typeLabel === 'Passive' ? 'inkShield' : 'inkBurst', 18)}</span>
      <strong>
        <SemanticTechniqueName tokens={row.visualIdentity.nameTokens} fallback={row.name} />
      </strong>
      <VisualIdentityBadge badge={row.badges.role} className="visualIdentityBadge--compact" compact />
      <VisualIdentityBadge badge={row.badges.grade} className="visualIdentityBadge--compact" compact />
      <VisualIdentityBadge badge={row.badges.rarity} className="visualIdentityBadge--compact" compact />
      <span>Rank {row.rankLabel}</span>
      <span className="techniquesExactMastery">
        <span style={{ width: `${row.masteryProgressPct}%` }} aria-hidden="true" />
        <em>{row.masteryLabel}</em>
      </span>
      <VisualIdentityBadge badge={row.badges.path} className="visualIdentityBadge--compact techniquesExactPathBadge" compact />
      <span className="techniquesExactRowTags">
        {row.familyTags.slice(0, 2).map((tag) => <small key={tag}>{tag}</small>)}
      </span>
      <span className="techniquesExactRowSeals" aria-label={`${row.equipped ? 'Equipped' : 'Not equipped'}${row.recommended ? ', recommended' : ''}`}>
        <i>{row.equipped ? '装' : ''}</i>
        <i>{row.recommended ? '推' : ''}</i>
      </span>
    </button>
  );
}
