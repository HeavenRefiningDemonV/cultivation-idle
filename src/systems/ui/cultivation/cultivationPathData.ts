import type { CultivationPath } from '../../../types/index.js';

/**
 * M.II.3 — the static per-path data model for the Seat of Becoming, ported verbatim from the
 * artifact's `PATHS` map (cultivation-seat.html). This is CONTENT (D5-owned: glyphs, names,
 * verses, per-realm names/zh/meridian, fantasy lines, tribulation/heart-devil flavor, treasure
 * lead) — NOT gameplay computation. The builder reads it to skin the realm names and the scene.
 *
 * Accent casts are NOT here (R-7 / §15): the per-path accent is a token reference applied as CSS
 * vars at paint (M.II.3 SCSS), never a hex literal in a data file. This module carries only the
 * path's semantic identity + the realm/fantasy script.
 */

export interface PathRealmDef {
  /** path-skinned realm name (D5 Part 7), e.g. "Cloud-Terrace Founding" */
  name: string;
  zh: string;
  /** the meridian this realm opens (mirrors the M.II.1 drip roster) */
  meridian: string;
  /** the per-realm fantasy line (Appendix A beat) */
  fantasy: string;
}

export type StageNameScheme = 'heavens' | 'forgings' | 'edges';

export interface CultivationPathDef {
  id: CultivationPath;
  glyph: string; // 天 / 地 / 武
  name: string; // "HEAVEN"
  roomSub: string; // "Path of the Heavens · 觀天"
  verb: string; // "Contemplate" / "Refine" / "Forge"
  counter: string; // stage-counter noun: "Heaven" / "Forging" / "Edge"
  peak: string; // "Empyrean" / "Adamant" / "Peerless"
  verse: string;
  inscribe: string; // the vertical watermark column
  mech: { label: string; short: string; glyph: string; scroll: 'premonition' | 'beastlore' | 'weaponbond' };
  signatureMeridianId: string; // a member of the M.II.1 drip roster
  accentTokenId: string; // 'path.heaven.accent' — token id, never hex
  glyphId: string; // 'glyph.heaven'
  stageNameScheme: StageNameScheme;
  treasuresLead: 'jing' | 'qi' | 'shen';
  /** the 7 authored realm rungs (slot 7 capstone is sealed in the live 6-realm slice) */
  realms: PathRealmDef[];
  tribName: string;
  heartDevil: string;
}

export const CULTIVATION_PATH_DATA: Record<CultivationPath, CultivationPathDef> = {
  heaven: {
    id: 'heaven',
    glyph: '天',
    name: 'HEAVEN',
    roomSub: 'Path of the Heavens · 觀天',
    verb: 'Contemplate',
    counter: 'Heaven',
    peak: 'Empyrean',
    verse: 'The sky does not strive, yet nothing escapes its measure.',
    inscribe: '觀天衍道',
    mech: { label: "Premonition · Heaven's Eye", short: 'PREMONITION', glyph: '目', scroll: 'premonition' },
    signatureMeridianId: 'heaven_void_gaze',
    accentTokenId: 'path.heaven.accent',
    glyphId: 'glyph.heaven',
    stageNameScheme: 'heavens',
    treasuresLead: 'shen',
    realms: [
      { name: 'Mist-Gathering', zh: '聚雾', meridian: 'Spirit Sense', fantasy: 'the world becomes legible' },
      { name: 'Cloud-Terrace Founding', zh: '云台', meridian: 'Mind Eye', fantasy: 'weaknesses become visible' },
      { name: 'Still-Mirror Core', zh: '明镜结', meridian: 'Soul Clarity', fantasy: 'the mind steadies' },
      { name: 'Cloudborne Soul', zh: '云魂', meridian: 'Heart of Dao', fantasy: 'the heart becomes unshakeable' },
      { name: 'Void-Severed Spirit', zh: '裂虚', meridian: 'Void Gaze', fantasy: 'the cultivator sees the crack in anything' },
      { name: 'Heaven-Mandate Trial', zh: '天命', meridian: 'Heavenly Mandate', fantasy: 'perception becomes authority' },
      { name: 'Ascend Beyond', zh: '登霄', meridian: 'Mandate of the Firmament', fantasy: 'comprehension becomes a weapon' },
    ],
    tribName: 'the heart-tribulation, fought as a duel of comprehension',
    heartDevil: 'obsession — the madness of gazing too long into the void',
  },
  earth: {
    id: 'earth',
    glyph: '地',
    name: 'EARTH',
    roomSub: 'Path of the Body · 煉體',
    verb: 'Refine',
    counter: 'Forging',
    peak: 'Adamant',
    verse: 'Let heaven send its tribulations; the mountain does not move.',
    inscribe: '煉體成山',
    mech: { label: 'Beast Lore · Body Tempering', short: 'BEAST LORE', glyph: '獸', scroll: 'beastlore' },
    signatureMeridianId: 'earth_iron_skin',
    accentTokenId: 'path.earth.accent',
    glyphId: 'glyph.earth',
    stageNameScheme: 'forgings',
    treasuresLead: 'jing',
    realms: [
      { name: 'Flesh-Tempering', zh: '淬体', meridian: 'Body Temper', fantasy: 'the flesh begins to harden' },
      { name: 'Iron-Bone Foundation', zh: '铁骨', meridian: 'Bone Forging', fantasy: 'the frame becomes iron' },
      { name: 'Marrow-Forged Core', zh: '锻髓结', meridian: 'Marrow Essence', fantasy: 'the marrow becomes a vessel' },
      { name: 'Deep-Root Spirit', zh: '深根', meridian: 'Root Depth', fantasy: 'the cultivator becomes immovable' },
      { name: 'Iron-Body Severing', zh: '金身斩', meridian: 'Iron Skin', fantasy: 'the body negates chip damage' },
      { name: 'Mountain-Bearing Trial', zh: '负山', meridian: 'Mountain Stance', fantasy: 'the wall strikes back' },
      { name: 'Sovereign Body Ascendant', zh: '后土飞升', meridian: 'Unmoving Sovereign', fantasy: 'the body becomes a treasure' },
    ],
    tribName: 'the body-tribulation — surviving the unsurvivable',
    heartDevil: 'yielding — the temptation to despair under endless pressure',
  },
  martial: {
    id: 'martial',
    glyph: '武',
    name: 'MARTIAL',
    roomSub: 'Path of the Blade · 鑄道',
    verb: 'Forge',
    counter: 'Edge',
    peak: 'Peerless',
    verse: 'Heaven set no edge to my name, so I forged one.',
    inscribe: '鑄道為鋒',
    mech: { label: 'Weapon-Bond · Arms-Mastery', short: 'WEAPON-BOND', glyph: '劍', scroll: 'weaponbond' },
    signatureMeridianId: 'martial_sword_heart',
    accentTokenId: 'path.martial.accent',
    glyphId: 'glyph.martial',
    stageNameScheme: 'edges',
    treasuresLead: 'jing',
    realms: [
      { name: 'Edge-Whetting', zh: '砺锋', meridian: 'Weapon Intent', fantasy: 'the bond with the blade begins' },
      { name: 'Blade-Forging Foundation', zh: '锻刃', meridian: 'Flowing Step', fantasy: 'the cultivator learns to close' },
      { name: 'Sword-Heart Core', zh: '剑心结', meridian: 'Battle Rhythm', fantasy: 'the tempo builds' },
      { name: 'Slaying Soul', zh: '戮魂', meridian: 'Killing Intent', fantasy: 'the kill window opens' },
      { name: 'Heaven-Severing', zh: '斩天', meridian: 'Sword Heart', fantasy: 'the true edge — crits cut past defense' },
      { name: 'Heaven-Defying Trial', zh: '逆天', meridian: 'Unbroken Momentum', fantasy: 'the snowball that cannot be stopped' },
      { name: 'Asura Ascendant', zh: '修罗飞升', meridian: 'Martial Dao · Asura', fantasy: 'the sundering edge that parts heaven and earth' },
    ],
    tribName: 'a duel of blades — the heart held against the killing intent that would consume it',
    heartDevil: 'hesitation — the fear of death, the mercy that gets you killed',
  },
};

/** The six canonical D2 emphasis-able axes + Balanced (R-1: NO "Body" spoke — Body is Tier-0). */
export interface FocusAxisDef {
  // §6 Option B (owner-chosen): the artifact's seven axes verbatim — Body 體 is the fifth spoke (it
  // maps to the live 'body' FocusMode, so it is a real emphasis, not fabricated). No Balanced spoke.
  id: 'qiPool' | 'qiPurity' | 'spiritualSense' | 'soulStrength' | 'body' | 'meridian' | 'dao';
  label: string;
  glyph: string;
  effect: string;
  lean: string;
}

/** M.II.3 Wave 5 — static mechanic-scroll content (D5-authored), realm-gated by the builder. */
export interface BeastEssenceDef { name: string; glyph: string; trait: string }
export const BEAST_ESSENCES: readonly BeastEssenceDef[] = [
  { name: 'Iron-Hide Boar', glyph: '獸', trait: 'endurance — a deeper vitality pool' },
  { name: 'Storm-Sinew Ape', glyph: '力', trait: 'force — heavier strikes' },
  { name: 'Deep-Root Tortoise', glyph: '甲', trait: 'defense — chip-damage negation' },
  { name: 'Marrow-Wyrm', glyph: '髓', trait: 'vitality — faster recovery' },
  { name: 'Stone-Lung Rhino', glyph: '岩', trait: 'poise — stagger resistance' },
  { name: 'Thunder-Vein Serpent', glyph: '雷', trait: 'tempo — quicker tempering' },
  { name: 'Sovereign Qilin', glyph: '麒', trait: 'dominion — a true-body trait' },
];

export interface WeaponArtDef { name: string; detail: string }
export const WEAPON_ARTS: readonly WeaponArtDef[] = [
  { name: 'Whetting Draw', detail: 'an opening strike that builds intent' },
  { name: 'Flowing Step', detail: 'close distance, gain tempo' },
  { name: 'Tide-Turn', detail: 'convert a block into a counter' },
  { name: 'Killing Window', detail: 'a critical strike that cuts past defense' },
  { name: 'Heaven-Sever', detail: 'the finisher — sunders armor and ward' },
];

export interface PremonitionOmenDef { label: string; value: string; detail: string; tone: 'jade' | 'gold' | 'cinnabar' | 'neutral' }
export const PREMONITION_FORTUNE_OMENS: readonly PremonitionOmenDef[] = [
  { label: 'Cultivation wind', value: 'favorable', detail: 'an auspicious day — idle gains run warm', tone: 'jade' },
  { label: 'A technique to seek', value: 'foreseen', detail: 'a worthy art may be found in the World today', tone: 'jade' },
];
export const PREMONITION_RISK_OMENS: readonly PremonitionOmenDef[] = [
  { label: 'Danger on the road', value: 'faint', detail: 'a minor ill omen — ward before long expeditions', tone: 'gold' },
];

export const MARTIAL_BONDED_WEAPON = { name: 'Cinnabar-Vein Sabre', grade: 'natal grade' } as const;

export const CANONICAL_FOCUS_AXES: readonly FocusAxisDef[] = [
  // §6 Option B — the artifact's seven axes, in its order (Body is the fifth spoke; no Balanced).
  { id: 'qiPool', label: 'Qi Pool', glyph: '氣', effect: 'raises maximum banked qi — the depth of the reserve', lean: 'a deeper reserve' },
  { id: 'qiPurity', label: 'Qi Purity', glyph: '純', effect: 'lifts qi purity — a calmer, safer crossing', lean: 'a serene crossing' },
  { id: 'spiritualSense', label: 'Spiritual Sense', glyph: '識', effect: 'sharpens spiritual sense — perception, foresight, control', lean: 'sharper foresight' },
  { id: 'soulStrength', label: 'Soul Strength', glyph: '魂', effect: 'builds soul strength — pressure, will, resistance', lean: 'soul-pressure' },
  { id: 'body', label: 'Body', glyph: '體', effect: 'tempers the body — vitality and survivability', lean: 'a sturdier body' },
  { id: 'meridian', label: 'Meridian', glyph: '脈', effect: 'widens the meridians — throughput and technique power', lean: 'wider meridians' },
  { id: 'dao', label: 'Dao', glyph: '道', effect: 'quickens comprehension — faster learning of the Dao', lean: 'swifter comprehension' },
];
