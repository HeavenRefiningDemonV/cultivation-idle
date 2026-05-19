export type TechniquePathTone = 'heaven' | 'earth' | 'martial' | 'neutral';

export type TechniqueRoleTone =
  | 'damage'
  | 'guard'
  | 'heal'
  | 'control'
  | 'mobility'
  | 'setup'
  | 'buff'
  | 'cleanse'
  | 'farm'
  | 'support'
  | 'ultimate'
  | 'neutral';

export type TechniqueGradeTone = 'mortal' | 'earth' | 'heaven' | 'mystic' | 'unknown';
export type TechniqueRarityTone = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unknown';
export type TechniqueRarityFx = 'none' | 'bronze-thread' | 'jade-glint' | 'cinnabar-embers' | 'celestial-corona';
export type VisualBadgeKind = 'grade' | 'rarity' | 'path' | 'role' | 'state' | 'fit';

export interface TechniqueNameToken {
  text: string;
  tone: TechniquePathTone | TechniqueRoleTone | TechniqueRarityTone | 'ink';
  emphasis: 'none' | 'soft' | 'strong';
  reason: 'path' | 'role' | 'rarity' | 'grade' | 'literal' | 'none';
}

export interface VisualBadgeSurface {
  id: string;
  label: string;
  shortLabel?: string;
  sublabel?: string;
  iconId?: string;
  tone: string;
  dataKey: string;
  ariaLabel: string;
  badgeKind: VisualBadgeKind;
}

export interface TechniqueVisualIdentity {
  pathKey: TechniquePathTone;
  pathLabel: string;
  pathDisplayLabel: string;
  pathIconId: string;
  pathTone: TechniquePathTone;

  roleKey: TechniqueRoleTone;
  roleLabel: string;
  roleDisplayLabel: string;
  roleIconId: string;
  roleTone: TechniqueRoleTone;

  gradeKey: TechniqueGradeTone;
  gradeLabel: string;
  gradeDisplayLabel: string;
  gradeMaterialLabel: string;
  gradeTone: TechniqueGradeTone;
  gradeIconId: string;

  rarityKey: TechniqueRarityTone;
  rarityLabel: string;
  rarityDisplayLabel: string;
  rarityProvenanceLabel: string;
  rarityTone: TechniqueRarityTone;
  rarityIconId: string;
  rarityFx: TechniqueRarityFx;

  nameTokens: TechniqueNameToken[];
  shortName: string;
  manualTitle: string;
  inspectorTitle: string;

  badges: {
    grade: VisualBadgeSurface;
    rarity: VisualBadgeSurface;
    path: VisualBadgeSurface;
    role: VisualBadgeSurface;
  };

  cssAttrs: {
    path: TechniquePathTone;
    role: TechniqueRoleTone;
    grade: TechniqueGradeTone;
    rarity: TechniqueRarityTone;
    rarityFx: TechniqueRarityFx;
  };
}

const GRADE_LABELS: Record<TechniqueGradeTone, { label: string; material: string; iconId: string }> = {
  mortal: { label: 'Mortal Grade', material: 'paper-bound foundation', iconId: 'recordSlip' },
  earth: { label: 'Earth Grade', material: 'jade-stamped body art', iconId: 'bookEarth' },
  heaven: { label: 'Heaven Grade', material: 'star-sealed doctrine', iconId: 'bookHeaven' },
  mystic: { label: 'Mystic Grade', material: 'void-ink transmission', iconId: 'dustPurple' },
  unknown: { label: 'Unknown Grade', material: 'unverified copy', iconId: 'recordSlip' },
};

const RARITY_LABELS: Record<TechniqueRarityTone, { label: string; provenance: string; iconId: string; fx: TechniqueRarityFx }> = {
  common: { label: 'Common', provenance: 'plain copy', iconId: 'recordSlip', fx: 'none' },
  uncommon: { label: 'Uncommon', provenance: 'bronze-noted copy', iconId: 'placeholderRingSmall', fx: 'bronze-thread' },
  rare: { label: 'Rare', provenance: 'jade-edged copy', iconId: 'bookEarth', fx: 'jade-glint' },
  epic: { label: 'Epic', provenance: 'cinnabar-sealed art', iconId: 'inkBurst', fx: 'cinnabar-embers' },
  legendary: { label: 'Legendary', provenance: 'celestial provenance', iconId: 'foundationPill', fx: 'celestial-corona' },
  unknown: { label: 'Unknown', provenance: 'unverified copy', iconId: 'recordSlip', fx: 'none' },
};

const PATH_LABELS: Record<TechniquePathTone, { label: string; display: string; iconId: string }> = {
  heaven: { label: 'Heaven Lineage', display: 'Heaven Lineage', iconId: 'bookHeaven' },
  earth: { label: 'Earth Lineage', display: 'Earth Lineage', iconId: 'bookEarth' },
  martial: { label: 'Martial Lineage', display: 'Martial Lineage', iconId: 'bookMartial' },
  neutral: { label: 'Unsorted Lineage', display: 'Unsorted Lineage', iconId: 'recordSlip' },
};

const ROLE_LABELS: Record<TechniqueRoleTone, { label: string; display: string; iconId: string }> = {
  damage: { label: 'Core Damage Art', display: 'Core Damage Art', iconId: 'jadeSword' },
  guard: { label: 'Guard Art', display: 'Guard Art', iconId: 'inkShield' },
  heal: { label: 'Healing Breath', display: 'Healing Breath', iconId: 'inkHeart' },
  control: { label: 'Control Seal', display: 'Control Seal', iconId: 'inkSwirl' },
  mobility: { label: 'Movement Step', display: 'Movement Step', iconId: 'inkSparkles' },
  setup: { label: 'Setup Verse', display: 'Setup Verse', iconId: 'recordSlip' },
  buff: { label: 'Empowerment Verse', display: 'Empowerment Verse', iconId: 'foundationPill' },
  cleanse: { label: 'Purification Method', display: 'Purification Method', iconId: 'inkSparkles' },
  farm: { label: 'Harvest Support', display: 'Harvest Support', iconId: 'herbBundle' },
  support: { label: 'Support Doctrine', display: 'Support Doctrine', iconId: 'inkShield' },
  ultimate: { label: 'Ultimate Art', display: 'Ultimate Art', iconId: 'inkBurst' },
  neutral: { label: 'General Doctrine', display: 'General Doctrine', iconId: 'recordSlip' },
};

const ROLE_SHORT_LABELS: Record<TechniqueRoleTone, string> = {
  damage: 'Damage',
  guard: 'Guard',
  heal: 'Heal',
  control: 'Control',
  mobility: 'Step',
  setup: 'Setup',
  buff: 'Buff',
  cleanse: 'Cleanse',
  farm: 'Farm',
  support: 'Support',
  ultimate: 'Ultimate',
  neutral: 'Doctrine',
};

const PATH_WORDS: Array<{ pattern: RegExp; tone: TechniquePathTone }> = [
  { pattern: /^(heaven|celestial|cloud|star|astral|moon|sky|wind|thunder|jade|cloudbind|cloudstep)$/i, tone: 'heaven' },
  { pattern: /^(earth|stone|stonebreaker|root|mountain|iron|body|guard|quiet|mending|bastion|turtle)$/i, tone: 'earth' },
  { pattern: /^(martial|palm|fist|killing|crane|tiger|blade|spear|rhythm|strike|splitter)$/i, tone: 'martial' },
];

const ROLE_WORDS: Array<{ pattern: RegExp; tone: TechniqueRoleTone }> = [
  { pattern: /^(splitter|breaker|stonebreaker|fist|palm|strike|killing|blade|needle)$/i, tone: 'damage' },
  { pattern: /^(guard|body|iron|root|quiet|shield|bastion)$/i, tone: 'guard' },
  { pattern: /^(heal|healing|mending|breath|restoration)$/i, tone: 'heal' },
  { pattern: /^(bind|binding|needle|astral|control|seal)$/i, tone: 'control' },
  { pattern: /^(cloud|cloudbind|cloudstep|step|wind|movement|gale)$/i, tone: 'mobility' },
  { pattern: /^(rhythm|pulse|mind|tranquil|focus|verse)$/i, tone: 'setup' },
];

function normalizeKey(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase().replace(/[_\s-]+/g, '');
}

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeTechniquePathTone(path?: string | null): TechniquePathTone {
  const key = normalizeKey(path);
  if (key === 'heaven') return 'heaven';
  if (key === 'earth') return 'earth';
  if (key === 'martial') return 'martial';
  return 'neutral';
}

export function normalizeTechniqueGradeTone(grade?: string | null): TechniqueGradeTone {
  const key = normalizeKey(grade);
  if (key === 'mortal') return 'mortal';
  if (key === 'earth') return 'earth';
  if (key === 'heaven') return 'heaven';
  if (key === 'mystic') return 'mystic';
  return 'unknown';
}

export function normalizeTechniqueRarityTone(rarity?: string | null): TechniqueRarityTone {
  const key = normalizeKey(rarity);
  if (key === 'common') return 'common';
  if (key === 'uncommon') return 'uncommon';
  if (key === 'rare') return 'rare';
  if (key === 'epic') return 'epic';
  if (key === 'legendary') return 'legendary';
  return 'unknown';
}

export function getRarityFx(rarity?: string | null): TechniqueRarityFx {
  return RARITY_LABELS[normalizeTechniqueRarityTone(rarity)].fx;
}

export function getGradeMaterialLabel(grade?: string | null): string {
  return GRADE_LABELS[normalizeTechniqueGradeTone(grade)].material;
}

export function getRarityProvenanceLabel(rarity?: string | null): string {
  return RARITY_LABELS[normalizeTechniqueRarityTone(rarity)].provenance;
}

export function getPathDisplayLabel(path?: string | null): string {
  return PATH_LABELS[normalizeTechniquePathTone(path)].display;
}

export function getRoleDisplayLabel(args: {
  role?: string | null;
  type?: string | null;
  families?: readonly string[] | null;
  supportFlags?: readonly string[] | null;
  tags?: readonly string[] | null;
}): string {
  return ROLE_LABELS[resolveRoleTone(args)].display;
}

function resolveRoleTone(args: {
  role?: string | null;
  type?: string | null;
  families?: readonly string[] | null;
  supportFlags?: readonly string[] | null;
  tags?: readonly string[] | null;
}): TechniqueRoleTone {
  const values = [
    args.role,
    args.type,
    ...(args.families ?? []),
    ...(args.supportFlags ?? []),
    ...(args.tags ?? []),
  ].map((value) => normalizeKey(value));

  if (values.includes('ultimate')) return 'ultimate';
  if (values.some((value) => ['coredamage', 'execute', 'aoe', 'offense', 'damage', 'strike'].includes(value))) return 'damage';
  if (values.some((value) => ['guard', 'defense', 'defensive', 'survival', 'shield'].includes(value))) return 'guard';
  if (values.some((value) => ['heal', 'healing', 'restoration', 'mending'].includes(value))) return 'heal';
  if (values.some((value) => ['control', 'bind', 'binding', 'seal'].includes(value))) return 'control';
  if (values.some((value) => ['mobility', 'movement', 'step', 'dodge'].includes(value))) return 'mobility';
  if (values.some((value) => ['setup', 'tempo', 'opener'].includes(value))) return 'setup';
  if (values.some((value) => ['buff', 'empowerment', 'strengthen'].includes(value))) return 'buff';
  if (values.some((value) => ['cleanse', 'purify', 'purification'].includes(value))) return 'cleanse';
  if (values.some((value) => ['farm', 'harvest', 'utility'].includes(value))) return 'farm';
  if (values.some((value) => ['support', 'passive'].includes(value))) return 'support';
  return 'neutral';
}

function toneForWord(word: string, fallbackRole: TechniqueRoleTone, fallbackPath: TechniquePathTone) {
  for (const entry of PATH_WORDS) {
    if (entry.pattern.test(word)) return { tone: entry.tone, reason: 'path' as const };
  }
  for (const entry of ROLE_WORDS) {
    if (entry.pattern.test(word)) return { tone: entry.tone, reason: 'role' as const };
  }
  if (fallbackPath !== 'neutral' && word.length >= 7) return { tone: fallbackPath, reason: 'path' as const };
  if (fallbackRole !== 'neutral' && word.length >= 7) return { tone: fallbackRole, reason: 'role' as const };
  return null;
}

export function tokenizeTechniqueName(args: {
  name: string;
  path?: string | null;
  families?: readonly string[] | null;
  role?: string | null;
  type?: string | null;
  supportFlags?: readonly string[] | null;
  maxHighlightedTokens?: number;
}): TechniqueNameToken[] {
  const name = args.name.replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
  const maxHighlighted = Math.max(0, args.maxHighlightedTokens ?? 2);
  const pathTone = normalizeTechniquePathTone(args.path);
  const roleTone = resolveRoleTone(args);
  let highlighted = 0;

  return name.split(/(\s+)/).filter((part) => part.length > 0).map((part) => {
    if (/^\s+$/.test(part)) {
      return { text: part, tone: 'ink', emphasis: 'none', reason: 'none' };
    }
    const normalized = part.replace(/^[^\w']+|[^\w']+$/g, '');
    const match = highlighted < maxHighlighted ? toneForWord(normalized, roleTone, pathTone) : null;
    if (!match) {
      return { text: part, tone: 'ink', emphasis: 'none', reason: 'none' };
    }
    highlighted += 1;
    return {
      text: part,
      tone: match.tone,
      emphasis: highlighted === 1 ? 'strong' : 'soft',
      reason: match.reason,
    };
  });
}

function buildShortName(name: string): string {
  const clean = name.replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
  if (clean.length <= 18) return clean;
  const words = clean.split(' ').filter(Boolean);
  const twoWords = words.slice(0, 2).join(' ');
  if (twoWords.length <= 18) return twoWords;
  const firstWord = words[0] ?? clean;
  if (firstWord.length <= 18) return firstWord;
  return `${firstWord.slice(0, 15)}...`;
}

function badge(args: {
  id: string;
  badgeKind: VisualBadgeKind;
  label: string;
  shortLabel?: string;
  sublabel?: string;
  iconId: string;
  tone: string;
  dataKey: string;
}): VisualBadgeSurface {
  return {
    ...args,
    ariaLabel: args.sublabel ? `${args.label}: ${args.sublabel}` : args.label,
  };
}

export function resolveTechniqueVisualIdentity(args: {
  techId: string;
  name: string;
  path?: string | null;
  type?: string | null;
  role?: string | null;
  tags?: readonly string[] | null;
  families?: readonly string[] | null;
  supportFlags?: readonly string[] | null;
  grade?: string | null;
  rarity?: string | null;
  selectedPath?: string | null;
}): TechniqueVisualIdentity {
  const pathKey = normalizeTechniquePathTone(args.path);
  const roleKey = resolveRoleTone(args);
  const gradeKey = normalizeTechniqueGradeTone(args.grade);
  const rarityKey = normalizeTechniqueRarityTone(args.rarity);
  const path = PATH_LABELS[pathKey];
  const role = ROLE_LABELS[roleKey];
  const grade = GRADE_LABELS[gradeKey];
  const rarity = RARITY_LABELS[rarityKey];
  const shortName = buildShortName(args.name);

  const identity: TechniqueVisualIdentity = {
    pathKey,
    pathLabel: path.label,
    pathDisplayLabel: path.display,
    pathIconId: path.iconId,
    pathTone: pathKey,
    roleKey,
    roleLabel: role.label,
    roleDisplayLabel: role.display,
    roleIconId: role.iconId,
    roleTone: roleKey,
    gradeKey,
    gradeLabel: grade.label,
    gradeDisplayLabel: grade.label,
    gradeMaterialLabel: grade.material,
    gradeTone: gradeKey,
    gradeIconId: grade.iconId,
    rarityKey,
    rarityLabel: rarity.label,
    rarityDisplayLabel: rarity.label,
    rarityProvenanceLabel: rarity.provenance,
    rarityTone: rarityKey,
    rarityIconId: rarity.iconId,
    rarityFx: rarity.fx,
    nameTokens: tokenizeTechniqueName({
      name: args.name,
      path: args.path,
      role: args.role,
      type: args.type,
      families: args.families,
      supportFlags: args.supportFlags,
      maxHighlightedTokens: 2,
    }),
    shortName,
    manualTitle: args.name,
    inspectorTitle: args.name,
    badges: {
      grade: badge({
        id: `${args.techId}-grade`,
        badgeKind: 'grade',
        label: grade.label,
        shortLabel: grade.label.replace(' Grade', ''),
        sublabel: grade.material,
        iconId: grade.iconId,
        tone: gradeKey,
        dataKey: gradeKey,
      }),
      rarity: badge({
        id: `${args.techId}-rarity`,
        badgeKind: 'rarity',
        label: rarity.label,
        shortLabel: rarity.label,
        sublabel: rarity.provenance,
        iconId: rarity.iconId,
        tone: rarityKey,
        dataKey: rarityKey,
      }),
      path: badge({
        id: `${args.techId}-path`,
        badgeKind: 'path',
        label: path.display,
        shortLabel: pathKey === 'neutral' ? 'Lineage' : path.display.replace(' Lineage', ''),
        iconId: path.iconId,
        tone: pathKey,
        dataKey: pathKey,
      }),
      role: badge({
        id: `${args.techId}-role`,
        badgeKind: 'role',
        label: role.display,
        shortLabel: ROLE_SHORT_LABELS[roleKey],
        iconId: role.iconId,
        tone: roleKey,
        dataKey: roleKey,
      }),
    },
    cssAttrs: {
      path: pathKey,
      role: roleKey,
      grade: gradeKey,
      rarity: rarityKey,
      rarityFx: rarity.fx,
    },
  };

  return identity;
}

export function displayRawLabel(value: string | null | undefined): string {
  return titleCase(value ?? 'unknown');
}
