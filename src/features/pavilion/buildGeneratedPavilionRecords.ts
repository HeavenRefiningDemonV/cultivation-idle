import type { PavilionRecord } from './pavilionTypes.js';
import { normalizePavilionCategoryId } from './pavilionContentTypes.js';

export interface BuildGeneratedPavilionRecordsResult {
  records: PavilionRecord[];
  generatedCounts: Record<string, number>;
  unresolvedLinks: string[];
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function titleCaseId(id: string): string {
  return id
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function makeRecord(args: {
  id: string;
  title: string;
  categoryLabel: string;
  plain: string;
  jade?: string;
  why?: string;
  sect?: string;
  how?: string;
  used?: string;
  unlock?: string;
  mistakes?: string[];
  sourceUse?: PavilionRecord['sourceUse'];
  tags?: string[];
  related?: string[];
  route?: string[];
  state?: PavilionRecord['state'];
  sourceFamily: string;
  sourceId: string;
  searchExtra?: string[];
  unresolved?: string[];
  quickRule?: string;
  whenToRead?: string;
  playerQuestion?: string;
  actionSteps?: string[];
  readinessChecks?: string[];
  bestSources?: string[];
  fallbackSources?: string[];
  numbersToWatch?: string[];
  diagnosis?: string[];
}): PavilionRecord {
  const tags = args.tags ?? [];
  const related = args.related ?? [];
  const route = args.route ?? [];
  const guidance = buildGeneratedRecordGuidance({ ...args, tags, route });
  return {
    id: args.id,
    title: args.title,
    categoryId: normalizePavilionCategoryId(args.categoryLabel),
    categoryLabel: args.categoryLabel,
    state: args.state ?? 'recorded',
    tags,
    plain: args.plain,
    why: args.why,
    sect: args.sect,
    how: args.how,
    used: args.used,
    mistakes: args.mistakes ?? [],
    unlock: args.unlock,
    jade: args.jade ?? args.plain,
    quickRule: args.quickRule ?? guidance.quickRule,
    whenToRead: args.whenToRead ?? guidance.whenToRead,
    playerQuestion: args.playerQuestion ?? guidance.playerQuestion,
    actionSteps: args.actionSteps ?? guidance.actionSteps,
    readinessChecks: args.readinessChecks ?? guidance.readinessChecks,
    bestSources: args.bestSources ?? guidance.bestSources,
    fallbackSources: args.fallbackSources ?? guidance.fallbackSources,
    numbersToWatch: args.numbersToWatch ?? guidance.numbersToWatch,
    diagnosis: args.diagnosis ?? guidance.diagnosis,
    related,
    route,
    implementation: 'Generated',
    sourceUse: args.sourceUse,
    searchText: [
      args.title,
      args.id,
      args.categoryLabel,
      args.plain,
      args.jade,
      args.why,
      args.sect,
      args.how,
      args.used,
      args.unlock,
      args.quickRule ?? guidance.quickRule,
      args.whenToRead ?? guidance.whenToRead,
      args.playerQuestion ?? guidance.playerQuestion,
      ...(args.actionSteps ?? guidance.actionSteps),
      ...(args.readinessChecks ?? guidance.readinessChecks),
      ...(args.bestSources ?? guidance.bestSources),
      ...(args.fallbackSources ?? guidance.fallbackSources),
      ...(args.numbersToWatch ?? guidance.numbersToWatch),
      ...(args.diagnosis ?? guidance.diagnosis),
      ...(args.mistakes ?? []),
      ...tags,
      ...related,
      ...route,
      ...(args.sourceUse ?? []).flatMap((block) => [block.label, block.value, block.routeLabel ?? '']),
      ...(args.searchExtra ?? []),
    ].join(' ').toLowerCase(),
    debug: {
      generated: true,
      sourceFamily: args.sourceFamily,
      sourceId: args.sourceId,
      unresolvedRelations: args.unresolved ?? [],
    },
  };
}

function pushCount(counts: Record<string, number>, family: string): void {
  counts[family] = (counts[family] ?? 0) + 1;
}


function routeActionText(route: readonly string[] | undefined): string {
  return route && route.length > 0 ? route.join(' or ') : 'use Pavilion search and related records';
}

function sourceUseText(sourceUse: PavilionRecord['sourceUse'] | undefined): string {
  return (sourceUse ?? [])
    .map((block) => `${block.label}: ${block.value}`)
    .filter(Boolean)
    .join('; ');
}

function buildGeneratedRecordGuidance(args: {
  title: string;
  categoryLabel: string;
  plain: string;
  how?: string;
  used?: string;
  route?: string[];
  sourceUse?: PavilionRecord['sourceUse'];
  sourceFamily: string;
  sourceId: string;
  tags?: string[];
}) {
  const routeText = routeActionText(args.route);
  const sourceText = sourceUseText(args.sourceUse);
  const base = {
    whenToRead: `Read this when ${args.title} appears in a requirement, reward, source list, shop, recipe, loadout, or milestone and you need the next action instead of a name.`,
    playerQuestion: `Where does ${args.title} come from, what uses it, and what should I do with it right now?`,
    actionSteps: [
      `Read the Source / Use Ledger before spending, selling, equipping, crafting, or farming for ${args.title}.`,
      `Follow ${routeText} if this record is relevant to the current milestone.`,
      `Check related records for the upstream source and downstream sink before committing resources.`,
      `Return to the current milestone and verify that the missing row, shortage, or build gap actually changed.`,
    ],
    readinessChecks: [
      'Best source is known or the record marks the source as unresolved.',
      'Used-for sink is known before the player sells, spends, or ignores the object.',
      'Route is available in the current city or clearly sealed/future.',
    ],
    bestSources: sourceText ? [sourceText] : [`Generated from ${args.sourceFamily}.${args.sourceId}.`],
    fallbackSources: [
      'If the best source is sealed, search the item, city, activity, or recipe name and follow the next available relation.',
      'If no source/use is resolved, keep a reserve and treat the record as content-audit debt rather than player error.',
    ],
    numbersToWatch: ['Owned count', 'Required count', 'Route availability', 'Current milestone relevance'],
    diagnosis: [
      'If the player cannot tell where this comes from, source resolution is insufficient.',
      'If the player cannot tell what consumes it, use/sink resolution is insufficient.',
    ],
  };

  switch (args.sourceFamily) {
    case 'items':
      return {
        ...base,
        quickRule: 'Item rule: source first, use second, sell safety last. Do not spend or sell until the record shows whether the next milestone needs it.',
        numbersToWatch: ['Owned count', 'Needed soon', 'Recipe input count', 'Gate/craft usage', 'Sell value'],
      };
    case 'techniques':
      return {
        ...base,
        quickRule: 'Technique rule: it only changes combat after it is learned, equipped, and selected by an AI profile that can use it.',
        actionSteps: [
          `Check whether ${args.title} is active, passive, or ultimate and what role it fills.`,
          'Equip it into the active loadout or it will not affect combat.',
          'Match the AI profile to the technique role so it fires at the right time.',
          'Use mastery, rank, traits, and runes only on techniques that solve a real fight problem.',
        ],
        numbersToWatch: ['Slot type', 'Cooldown', 'Resource cost', 'Mastery XP', 'Rank', 'Trait/rune sockets'],
      };
    case 'trials':
      return {
        ...base,
        quickRule: 'Trial rule: verify eligibility, prepare, attempt once seriously, then clear or safety-net into the breakthrough catalyst.',
        actionSteps: [
          'Check final substage and Qi cap before pressing Attempt Gate.',
          'Read the reward item and make sure it matches the breakthrough catalyst.',
          'Fix medicine, weapon floor, loadout, or technique gaps before repeat attempts.',
          'After clear or bypass, route to Cultivation for the breakthrough handoff.',
        ],
        numbersToWatch: ['Readiness score', 'Eligible failures', 'Fail-safe cost', 'Gate reward item', 'Guardian level'],
      };
    case 'cities':
      return {
        ...base,
        quickRule: 'City rule: a city is the toolkit for a realm tier; its modules should point to the gate, materials, manuals, medicine, forge, bounties, and expeditions for that tier.',
        numbersToWatch: ['Unlock realm', 'City index', 'Module list', 'Gate trial', 'Ruin', 'Pavilion pool'],
      };
    case 'ruins':
      return {
        ...base,
        quickRule: 'Ruins rule: use this route for targeted relief and chest rewards when broad Outskirts farming is not solving the shortage.',
        numbersToWatch: ['Room count', 'Final chest guarantees', 'Drop pool', 'Run completion', 'Material shortage'],
      };
    case 'outskirts':
      return {
        ...base,
        quickRule: 'Outskirts rule: broad gold and common-material income, plus safe build testing; switch to targeted routes when one item blocks progress.',
        numbersToWatch: ['Kills to boss', 'Gold income', 'Common material pool', 'Rare material pool', 'Tracked bounty overlap'],
      };
    case 'alchemy_recipes':
    case 'apothecaries':
      return {
        ...base,
        quickRule: 'Apothecary rule: medicine only matters if it is bought or crafted, loaded into the pouch, and configured before the fight.',
        numbersToWatch: ['Input count', 'Output quantity', 'Gold cost', 'Daily limit', 'Pouch count', 'Craft time'],
      };
    case 'forge_blueprints':
    case 'runes':
      return {
        ...base,
        quickRule: 'Forge rule: use ore and materials only when the result raises a visible weapon, armor, refine, temper, rune, or gear-floor need.',
        numbersToWatch: ['Input count', 'Gold cost', 'Refine cap', 'Temper chance', 'Output gear/tool', 'Craft time'],
      };
    case 'manual_pavilions':
      return {
        ...base,
        quickRule: 'Manual pool rule: buy for slot and role fit, then study and equip; the pool is useful only when it closes a build gap.',
        numbersToWatch: ['Visible stock', 'Path pool', 'Manual grade', 'Refresh cost', 'Duplicate conversion', 'Slot need'],
      };
    case 'enemies':
      return {
        ...base,
        quickRule: 'Enemy rule: use the record to learn where it appears, what it drops, and what kind of prep counters its threat.',
        numbersToWatch: ['Enemy level', 'Threat tags', 'Defeated count', 'Drop source', 'Damage taken'],
      };
    case 'prestige':
      return {
        ...base,
        quickRule: 'Prestige rule: a node is only player-trustworthy if its reset/retention effect is explicit and live in runtime.',
        numbersToWatch: ['AP cost', 'Purchased level', 'Effect per level', 'Runtime-applied status', 'Next-life impact'],
      };
    default:
      return {
        ...base,
        quickRule: 'Generated record rule: use this slip to connect source, use, route, and current milestone relevance.',
      };
  }
}

function itemName(content: any, itemId: string): string {
  const item = asArray(content.items).find((entry: any) => entry?.id === itemId);
  return item?.name ?? titleCaseId(itemId);
}

function itemExists(content: any, itemId: string): boolean {
  return asArray(content.items).some((entry: any) => entry?.id === itemId);
}

function collectItemUses(content: any, itemId: string): string[] {
  const uses: string[] = [];
  asArray(content.alchemy_recipes).forEach((recipe: any) => {
    if (recipe?.inputs && itemId in recipe.inputs) uses.push(`Alchemy recipe ${recipe.id}`);
    if (recipe?.outputs && itemId in recipe.outputs) uses.push(`Alchemy output ${recipe.id}`);
  });
  asArray(content.forge_blueprints).forEach((blueprint: any) => {
    if (blueprint?.inputs && itemId in blueprint.inputs) uses.push(`Forge blueprint ${blueprint.id}`);
    if (blueprint?.outputs && itemId in blueprint.outputs) uses.push(`Forge output ${blueprint.id}`);
  });
  asArray(content.talisman_recipes).forEach((recipe: any) => {
    if (recipe?.inputs && itemId in recipe.inputs) uses.push(`Talisman recipe ${recipe.id}`);
    if (recipe?.outputs && itemId in recipe.outputs) uses.push(`Talisman output ${recipe.id}`);
  });
  asArray(content.trials).forEach((trial: any) => {
    if (trial?.gateItemId === itemId) uses.push(`${trial.name ?? titleCaseId(trial.id)} reward`);
    if (trial?.requiredItemId === itemId) uses.push(`${trial.name ?? titleCaseId(trial.id)} requirement`);
  });
  return uses;
}

function collectBestSource(content: any, itemId: string): string {
  const shop = asArray(content.apothecary_shops).find((entry: any) => (
    asArray(entry?.stock).some((stock: any) => stock?.itemId === itemId)
  ));
  if (shop) return shop.name ?? 'Apothecary';
  const recipe = asArray(content.alchemy_recipes).find((entry: any) => entry?.outputs && itemId in entry.outputs);
  if (recipe) return 'Alchemy';
  const blueprint = asArray(content.forge_blueprints).find((entry: any) => entry?.outputs && itemId in entry.outputs);
  if (blueprint) return 'Forge';
  const ruin = asArray(content.ruins).find((entry: any) => (
    asArray(entry?.dropsPerRoom?.pool).some((drop: any) => drop?.itemId === itemId) ||
    asArray(entry?.finalChestDrops?.pool).some((drop: any) => drop?.itemId === itemId)
  ));
  if (ruin) return ruin.name ?? 'Ruins';
  return 'Unresolved source';
}

function auditRecipeRefs(content: any, family: string, id: string, refs: Record<string, number> | undefined, unresolved: string[]): void {
  Object.keys(refs ?? {}).forEach((itemId) => {
    if (!itemExists(content, itemId) && !itemId.startsWith('rune_')) {
      unresolved.push(`${family}.${id} references missing item ${itemId}`);
    }
  });
}

export function buildGeneratedPavilionRecords(args: { content: any | null | undefined }): BuildGeneratedPavilionRecordsResult {
  const content = args.content ?? {};
  const records: PavilionRecord[] = [];
  const generatedCounts: Record<string, number> = {};
  const unresolvedLinks: string[] = [];

  asArray(content.items).forEach((item: any) => {
    const id = String(item.id);
    const itemTitle = item.name ?? titleCaseId(id);
    const uses = collectItemUses(content, id);
    const bestSource = collectBestSource(content, id);
    const useLine = uses.join(', ') || 'No live sink recorded';
    const itemRoute = bestSource.includes('Apothecary') ? ['Route to Apothecary'] : bestSource.includes('Forge') ? ['Route to Forge'] : [];
    records.push(makeRecord({
      id: `item.${id}`,
      title: itemTitle,
      categoryLabel: 'Items',
      plain: uses.length > 0
        ? `{item|${itemTitle}} is used by ${useLine}. Confirm its {term|Best Source} before spending, selling, or farming for it.`
        : `{item|${itemTitle}} has no live sink recorded yet. Keep a reserve if the source is unclear, then treat extra copies as lower priority.`,
      why: uses.length > 0
        ? `This item matters because a live system consumes or awards it: ${useLine}.`
        : 'No live sink is currently recorded; the archive will not claim a requirement it cannot prove.',
      how: bestSource === 'Unresolved source'
        ? 'No authoritative source was resolved from live content.'
        : `{term|Best Source}: ${bestSource}.`,
      used: useLine,
      tags: ['item', item.category ?? 'unknown', uses.length === 0 ? 'safe to sell' : 'do not sell'],
      related: uses,
      route: itemRoute,
      sourceUse: [
        { id: `item-${id}-best-source`, label: 'Best Source', value: bestSource, kind: bestSource === 'Unresolved source' ? 'debug' : 'source', routeLabel: itemRoute[0] },
        { id: `item-${id}-used-for`, label: 'Used For', value: useLine, kind: uses.length > 0 ? 'usedFor' : 'debug' },
      ],
      sourceFamily: 'items',
      sourceId: id,
      searchExtra: [bestSource, ...uses, uses.length === 0 ? 'Safe to Sell' : 'Do Not Sell'],
      unresolved: bestSource === 'Unresolved source' ? [`No source resolved for item ${id}`] : [],
    }));
    pushCount(generatedCounts, 'items');
  });

  asArray(content.techniques).forEach((tech: any) => {
    const id = String(tech.id);
    const techniqueTitle = tech.name ?? titleCaseId(id);
    const pathLabel = tech.path ? titleCaseId(tech.path) : 'unknown';
    const typeLabel = tech.type ?? 'technique';
    records.push(makeRecord({
      id: `technique.${id}`,
      title: techniqueTitle,
      categoryLabel: 'Manuals',
      plain: `{term|${techniqueTitle}} is a ${pathLabel} path ${typeLabel}. It helps only after you learn it, equip it, and let the AI profile use its role.`,
      why: 'Technique records matter when a fight problem is really a loadout, mastery, cooldown, or AI-profile problem.',
      how: '{term|Best Source}: Manual Pavilion when a pool or manual source is available.',
      used: `${typeLabel} slot support for combat loadouts.`,
      tags: ['technique', `path ${tech.path ?? 'unknown'}`, tech.type ?? 'technique'],
      related: ['Manual Pavilion', 'Loadout'],
      route: ['Route to Techniques', 'Route to Manual Pavilion'],
      sourceUse: [
        { id: `tech-${id}-source`, label: 'Known From', value: 'Manual Pavilion', kind: 'source', routeLabel: 'Route to Manual Pavilion' },
        { id: `tech-${id}-used-for`, label: 'Used For', value: `${tech.path ?? 'unknown'} path loadout`, kind: 'usedFor', routeLabel: 'Route to Techniques' },
      ],
      sourceFamily: 'techniques',
      sourceId: id,
      searchExtra: [tech.path ? `Path: ${titleCaseId(tech.path)}` : ''],
    }));
    pushCount(generatedCounts, 'techniques');
  });

  asArray(content.cities).forEach((city: any) => {
    const id = String(city.id);
    records.push(makeRecord({
      id: `city.${id}`,
      title: city.name ?? titleCaseId(id),
      categoryLabel: 'Cities',
      plain: `${city.name ?? titleCaseId(id)} binds live modules: ${asArray(city.modules).join(', ')}.`,
      why: 'City records explain reachability and which gameplay modules can answer the current need.',
      how: city.unlockMajorRealm ? `Unlock realm: ${city.unlockMajorRealm}.` : 'Reachability is derived from city progression when available.',
      used: `Modules: ${asArray(city.modules).join(', ') || 'none listed'}.`,
      tags: ['city', 'activity'],
      related: asArray(city.modules).map((module) => titleCaseId(String(module))),
      route: ['Route to World'],
      sourceUse: [
        { id: `city-${id}-found-in`, label: 'Found In', value: 'World', kind: 'source', routeLabel: 'Route to World' },
        { id: `city-${id}-unlocks`, label: 'Unlocks', value: asArray(city.modules).join(', ') || 'No modules listed', kind: 'usedFor', routeLabel: 'Route to World' },
      ],
      sourceFamily: 'cities',
      sourceId: id,
      searchExtra: asArray(city.modules).map(String),
    }));
    pushCount(generatedCounts, 'cities');
  });

  asArray(content.trials).forEach((trial: any) => {
    const id = String(trial.id);
    const rewardName = trial.gateItemId ? itemName(content, trial.gateItemId) : 'Unresolved reward';
    records.push(makeRecord({
      id: `trial.${id}`,
      title: trial.name ?? titleCaseId(id),
      categoryLabel: 'Gate Trials',
      plain: `${trial.name ?? titleCaseId(id)} is a gate trial. Reward: ${rewardName}. Used for Foundation Breakthrough.`,
      why: 'Gate trial records combine authored advice with live trial reward and readiness truth.',
      how: 'Act from the current city Gate Trial module when the city exposes that building.',
      used: `${rewardName} / realm breakthrough handoff.`,
      unlock: trial.gatesToMajorRealm ? `Gates to ${trial.gatesToMajorRealm}.` : undefined,
      tags: ['trial', 'gate', 'milestone'],
      related: [rewardName, 'Foundation Breakthrough', 'Safety Net'],
      route: ['Route to Gate Trial', 'Route to Cultivation'],
      sourceUse: [
        { id: `trial-${id}-route`, label: 'Route', value: 'Gate Trial', kind: 'source', routeLabel: 'Route to Gate Trial' },
        { id: `trial-${id}-used-for`, label: 'Used For', value: 'Foundation Breakthrough', kind: 'usedFor', routeLabel: 'Route to Cultivation' },
        { id: `trial-${id}-reward`, label: 'Unlocks', value: rewardName, kind: trial.gateItemId ? 'usedFor' : 'debug' },
      ],
      sourceFamily: 'trials',
      sourceId: id,
      searchExtra: ['Foundation Breakthrough', trial.gateItemId ?? ''],
      unresolved: trial.gateItemId && !itemExists(content, trial.gateItemId) ? [`Missing gate item ${trial.gateItemId}`] : [],
    }));
    pushCount(generatedCounts, 'trials');
  });

  asArray(content.ruins).forEach((ruin: any) => {
    const id = String(ruin.id);
    const drops = [
      ...asArray(ruin?.dropsPerRoom?.pool),
      ...asArray(ruin?.dropsPerRoom?.guaranteed),
      ...asArray(ruin?.finalChestDrops?.pool),
      ...asArray(ruin?.finalChestDrops?.guaranteed),
    ];
    const unresolved = drops
      .filter((drop: any) => drop?.itemId && !itemExists(content, drop.itemId))
      .map((drop: any) => `ruin.${id} references missing item ${drop.itemId}`);
    unresolvedLinks.push(...unresolved);
    records.push(makeRecord({
      id: `ruin.${id}`,
      title: ruin.name ?? titleCaseId(id),
      categoryLabel: 'Activities',
      plain: `${ruin.name ?? titleCaseId(id)} supports preparation materials and chest rewards.`,
      why: 'Ruins can solve material droughts and support gate preparation when reachable.',
      how: 'Route through the city Ruins module when available.',
      used: drops.length > 0 ? `Drops: ${drops.map((drop: any) => itemName(content, drop.itemId)).filter(Boolean).join(', ')}.` : undefined,
      tags: ['ruins', 'activity', 'source'],
      related: drops.map((drop: any) => itemName(content, drop.itemId)).filter(Boolean),
      route: ['Route to Ruins'],
      sourceUse: [
        { id: `ruin-${id}-source`, label: 'Best Source', value: ruin.name ?? titleCaseId(id), kind: 'source', routeLabel: 'Route to Ruins' },
        { id: `ruin-${id}-found`, label: 'Found In', value: drops.map((drop: any) => itemName(content, drop.itemId)).filter(Boolean).join(', ') || 'No drops listed', kind: 'usedFor' },
      ],
      sourceFamily: 'ruins',
      sourceId: id,
      searchExtra: drops.map((drop: any) => String(drop.itemId ?? '')),
      unresolved,
    }));
    pushCount(generatedCounts, 'ruins');
  });

  asArray(content.enemies).forEach((enemy: any) => {
    const id = String(enemy.id);
    records.push(makeRecord({
      id: `enemy.${id}`,
      title: enemy.name ?? titleCaseId(id),
      categoryLabel: 'Bestiary',
      plain: `${enemy.name ?? titleCaseId(id)} is a live enemy record.`,
      why: 'Enemy records connect threats to activities, drops, and counter-prep when combat history is available.',
      tags: ['enemy', ...(enemy.tags ?? [])],
      sourceFamily: 'enemies',
      sourceId: id,
      state: 'rumored',
    }));
    pushCount(generatedCounts, 'enemies');
  });

  asArray(content.heart_laws).forEach((law: any) => {
    const id = String(law.id);
    records.push(makeRecord({
      id: `heartLaw.${id}`,
      title: law.name ?? titleCaseId(id),
      categoryLabel: 'Cultivation',
      plain: `${law.name ?? titleCaseId(id)} is a Heart Law doctrine that shapes cultivation rhythm.`,
      why: 'Heart Laws frame cultivation rhythm, path doctrine, and current-life identity.',
      how: 'Review or select Heart Law direction from cultivation-facing screens when available.',
      used: 'Current-life doctrine and cultivation pacing.',
      tags: ['heart law', law.archetype ?? '', law.tier ?? ''].filter(Boolean),
      related: ['Current Life', 'Path Resonance'],
      route: ['Route to Cultivation'],
      sourceUse: [
        { id: `heart-law-${id}-route`, label: 'Route', value: 'Cultivation', kind: 'source', routeLabel: 'Route to Cultivation' },
        { id: `heart-law-${id}-used-for`, label: 'Used For', value: 'Current Life doctrine', kind: 'usedFor' },
      ],
      sourceFamily: 'heart_laws',
      sourceId: id,
      searchExtra: [law.archetype ?? '', 'Path Heaven'],
    }));
    pushCount(generatedCounts, 'heart_laws');
  });

  asArray(content.alchemy_recipes).forEach((recipe: any) => {
    const id = String(recipe.id);
    auditRecipeRefs(content, 'alchemy_recipe', id, recipe.inputs, unresolvedLinks);
    auditRecipeRefs(content, 'alchemy_recipe', id, recipe.outputs, unresolvedLinks);
    const inputs = Object.keys(recipe.inputs ?? {});
    const outputs = Object.keys(recipe.outputs ?? {});
    records.push(makeRecord({
      id: `recipe.alchemy.${id}`,
      title: titleCaseId(id),
      categoryLabel: 'Crafting',
      plain: `${titleCaseId(id)} converts ingredients into medicine or reagents through Apothecary crafting.`,
      why: outputs.length > 0 ? `Output supports: ${outputs.map((itemId) => itemName(content, itemId)).join(', ')}.` : undefined,
      how: `Inputs: ${inputs.map((itemId) => itemName(content, itemId)).join(', ') || 'none listed'}.`,
      used: outputs.map((itemId) => itemName(content, itemId)).join(', '),
      unlock: recipe.unlocksAtCityId ? `Unlocked at ${titleCaseId(recipe.unlocksAtCityId)}.` : undefined,
      tags: ['alchemy recipe', 'crafting', 'source'],
      related: [...inputs, ...outputs].map((itemId) => itemName(content, itemId)),
      route: ['Route to Apothecary'],
      sourceUse: [
        { id: `alchemy-${id}-station`, label: 'Best Source', value: 'Apothecary', kind: 'source', routeLabel: 'Route to Apothecary' },
        { id: `alchemy-${id}-inputs`, label: 'Consumed By', value: inputs.map((itemId) => itemName(content, itemId)).join(', ') || 'No inputs listed', kind: 'requirement' },
        { id: `alchemy-${id}-outputs`, label: 'Unlocks', value: outputs.map((itemId) => itemName(content, itemId)).join(', ') || 'No outputs listed', kind: 'usedFor' },
      ],
      sourceFamily: 'alchemy_recipes',
      sourceId: id,
      searchExtra: [...inputs, ...outputs, 'Apothecary'],
    }));
    pushCount(generatedCounts, 'alchemy_recipes');
  });

  asArray(content.forge_blueprints).forEach((blueprint: any) => {
    const id = String(blueprint.id);
    auditRecipeRefs(content, 'forge_blueprint', id, blueprint.inputs, unresolvedLinks);
    auditRecipeRefs(content, 'forge_blueprint', id, blueprint.outputs, unresolvedLinks);
    const inputs = Object.keys(blueprint.inputs ?? {});
    const outputs = Object.keys(blueprint.outputs ?? {});
    records.push(makeRecord({
      id: `recipe.forge.${id}`,
      title: titleCaseId(id),
      categoryLabel: 'Crafting',
      plain: `${titleCaseId(id)} is a Forge blueprint for preparation and equipment pressure.`,
      why: 'Forge records show the material path into weapon, armor, or tool floor improvements.',
      how: `Inputs: ${inputs.map((itemId) => itemName(content, itemId)).join(', ') || 'none listed'}.`,
      used: outputs.map((itemId) => itemName(content, itemId)).join(', '),
      unlock: blueprint.unlocksAtCityId ? `Unlocked at ${titleCaseId(blueprint.unlocksAtCityId)}.` : undefined,
      tags: ['forge blueprint', 'crafting', 'forge'],
      related: [...inputs, ...outputs].map((itemId) => itemName(content, itemId)),
      route: ['Route to Forge'],
      sourceUse: [
        { id: `forge-${id}-station`, label: 'Best Source', value: 'Forge', kind: 'source', routeLabel: 'Route to Forge' },
        { id: `forge-${id}-inputs`, label: 'Consumed By', value: inputs.map((itemId) => itemName(content, itemId)).join(', ') || 'No inputs listed', kind: 'requirement' },
        { id: `forge-${id}-outputs`, label: 'Unlocks', value: outputs.map((itemId) => itemName(content, itemId)).join(', ') || 'No outputs listed', kind: 'usedFor' },
      ],
      sourceFamily: 'forge_blueprints',
      sourceId: id,
      searchExtra: [...inputs, ...outputs, 'Forge'],
    }));
    pushCount(generatedCounts, 'forge_blueprints');
  });

  asArray(content.runes).forEach((rune: any) => {
    const id = String(rune.id);
    records.push(makeRecord({
      id: `rune.${id}`,
      title: titleCaseId(id),
      categoryLabel: 'Crafting',
      plain: `${titleCaseId(id)} is a rune record for socket and forge routing.`,
      how: 'Rune source details are resolved from live crafting/content references when present.',
      used: 'Socket and buildcraft support.',
      tags: ['rune', 'forge'],
      route: ['Route to Forge'],
      sourceUse: [
        { id: `rune-${id}-source`, label: 'Known From', value: 'Forge / rune content', kind: 'source', routeLabel: 'Route to Forge' },
        { id: `rune-${id}-used-for`, label: 'Used For', value: 'Technique or equipment socketing', kind: 'usedFor' },
      ],
      sourceFamily: 'runes',
      sourceId: id,
    }));
    pushCount(generatedCounts, 'runes');
  });

  asArray(content.talisman_recipes).forEach((recipe: any) => {
    const id = String(recipe.id);
    auditRecipeRefs(content, 'talisman_recipe', id, recipe.inputs, unresolvedLinks);
    auditRecipeRefs(content, 'talisman_recipe', id, recipe.outputs, unresolvedLinks);
    const inputs = Object.keys(recipe.inputs ?? {});
    const outputs = Object.keys(recipe.outputs ?? {});
    records.push(makeRecord({
      id: `talisman.${id}`,
      title: titleCaseId(id),
      categoryLabel: 'Crafting',
      plain: `${titleCaseId(id)} is a talisman recipe. If unreachable, the archive keeps it marked as future support.`,
      why: 'Talisman records are preserved as sealed/future when runtime support is not yet reachable.',
      how: inputs.length > 0 ? `Inputs: ${inputs.map((itemId) => itemName(content, itemId)).join(', ')}.` : undefined,
      used: outputs.length > 0 ? outputs.map((itemId) => itemName(content, itemId)).join(', ') : undefined,
      tags: ['talisman recipe', 'crafting', 'future'],
      related: [...inputs, ...outputs].map((itemId) => itemName(content, itemId)),
      sourceFamily: 'talisman_recipes',
      sourceId: id,
      state: 'sealed',
      route: [],
      sourceUse: [
        { id: `talisman-${id}-status`, label: 'Known From', value: 'Talisman content pack', kind: 'debug' },
        { id: `talisman-${id}-outputs`, label: 'Unlocks', value: outputs.map((itemId) => itemName(content, itemId)).join(', ') || 'No output listed', kind: 'usedFor' },
      ],
      searchExtra: [...inputs, ...outputs],
    }));
    pushCount(generatedCounts, 'talisman_recipes');
  });

  asArray(content.bounties?.templates).forEach((bounty: any) => {
    const id = String(bounty.id);
    records.push(makeRecord({
      id: `bounty.${id}`,
      title: bounty.name ?? titleCaseId(id),
      categoryLabel: 'Bounties',
      plain: bounty.desc ?? `${bounty.name ?? titleCaseId(id)} is a bounty template.`,
      why: 'Bounties turn combat or crafting objectives into Merit and support rewards.',
      how: 'Open the Bounty Board when the current city exposes it.',
      tags: ['bounty', bounty.kind ?? 'activity'],
      route: ['Route to Bounty Board'],
      sourceUse: [
        { id: `bounty-${id}-route`, label: 'Route', value: 'Bounty Board', kind: 'source', routeLabel: 'Route to Bounty Board' },
        { id: `bounty-${id}-used-for`, label: 'Used For', value: 'Merit and activity objectives', kind: 'usedFor' },
      ],
      sourceFamily: 'bounties',
      sourceId: id,
    }));
    pushCount(generatedCounts, 'bounties');
  });

  asArray(content.expeditions?.types).forEach((expedition: any) => {
    const id = String(expedition.id);
    records.push(makeRecord({
      id: `expedition.${id}`,
      title: expedition.name ?? titleCaseId(id),
      categoryLabel: 'Bounties',
      plain: expedition.description ?? `${expedition.name ?? titleCaseId(id)} is an expedition route for offline support materials.`,
      why: 'Expeditions solve material needs without assigning offline progress to combat.',
      how: 'Open Expeditions when the current city exposes the route.',
      tags: ['expedition', 'offline', ...(expedition.yieldTags ?? [])],
      route: ['Route to Expeditions'],
      sourceUse: [
        { id: `expedition-${id}-route`, label: 'Route', value: 'Expeditions', kind: 'source', routeLabel: 'Route to Expeditions' },
        { id: `expedition-${id}-used-for`, label: 'Used For', value: asArray(expedition.yieldTags).join(', ') || 'Support materials', kind: 'usedFor' },
      ],
      sourceFamily: 'expeditions',
      sourceId: id,
    }));
    pushCount(generatedCounts, 'expeditions');
  });

  asArray(content.prestige_store?.upgrades).forEach((upgrade: any) => {
    const id = String(upgrade.id);
    records.push(makeRecord({
      id: `prestige.${id}`,
      title: upgrade.name ?? titleCaseId(id),
      categoryLabel: 'Reincarnation',
      plain: upgrade.description ?? `${upgrade.name ?? titleCaseId(id)} is a prestige upgrade record.`,
      why: 'Prestige records distinguish retained account progress from current-life progress.',
      how: 'Open Prestige to inspect purchase state and costs.',
      used: upgrade.effectText ?? upgrade.type ?? 'Prestige upgrade effect.',
      unlock: Array.isArray(upgrade.costs) ? `Cost ladder: ${upgrade.costs.join(', ')}.` : undefined,
      tags: ['prestige', 'reincarnation', upgrade.type ?? 'upgrade'],
      route: ['Route to Prestige'],
      sourceUse: [
        { id: `prestige-${id}-route`, label: 'Route', value: 'Prestige', kind: 'source', routeLabel: 'Route to Prestige' },
        { id: `prestige-${id}-used-for`, label: 'Used For', value: upgrade.type ?? 'Prestige upgrade', kind: 'usedFor' },
      ],
      sourceFamily: 'prestige',
      sourceId: id,
      state: 'rumored',
    }));
    pushCount(generatedCounts, 'prestige');
  });

  asArray(content.pavilions).forEach((pavilion: any) => {
    const id = String(pavilion.id);
    records.push(makeRecord({
      id: `manualPool.${id}`,
      title: titleCaseId(id),
      categoryLabel: 'Manuals',
      plain: `${titleCaseId(id)} is a Manual Pavilion pool for technique acquisition.`,
      why: 'Manual Pavilion pools connect paths to the manuals and techniques they can produce.',
      how: 'Open Manual Pavilion from the current city when the module exists.',
      used: Object.values(pavilion.poolByPath ?? {}).flat().map(String).join(', '),
      tags: ['manual pavilion', 'manuals', 'source'],
      route: ['Route to Manual Pavilion'],
      sourceUse: [
        { id: `manual-pool-${id}-route`, label: 'Best Source', value: 'Manual Pavilion', kind: 'source', routeLabel: 'Route to Manual Pavilion' },
        { id: `manual-pool-${id}-used-for`, label: 'Unlocks', value: Object.values(pavilion.poolByPath ?? {}).flat().map(String).join(', ') || 'No pool entries listed', kind: 'usedFor' },
      ],
      sourceFamily: 'manual_pavilions',
      sourceId: id,
      searchExtra: Object.values(pavilion.poolByPath ?? {}).flat().map(String),
    }));
    pushCount(generatedCounts, 'manual_pavilions');
  });

  asArray(content.apothecary_shops).forEach((shop: any) => {
    const id = String(shop.id);
    const stocked = asArray(shop.stock).map((stock: any) => itemName(content, stock.itemId));
    records.push(makeRecord({
      id: `apothecary.${id}`,
      title: shop.name ?? titleCaseId(id),
      categoryLabel: 'Activities',
      plain: `${shop.name ?? titleCaseId(id)} stocks medicine and preparation items: ${stocked.join(', ')}.`,
      why: 'Apothecaries are the archive-favored route for medicine weak or gate preparation notes.',
      how: 'Open Apothecary from the current city when available.',
      used: stocked.join(', '),
      tags: ['apothecary', 'source', 'medicine'],
      related: stocked,
      route: ['Route to Apothecary'],
      sourceUse: [
        { id: `apothecary-${id}-route`, label: 'Best Source', value: shop.name ?? titleCaseId(id), kind: 'source', routeLabel: 'Route to Apothecary' },
        { id: `apothecary-${id}-used-for`, label: 'Unlocks', value: stocked.join(', ') || 'No stock listed', kind: 'usedFor' },
      ],
      sourceFamily: 'apothecaries',
      sourceId: id,
      searchExtra: stocked,
    }));
    pushCount(generatedCounts, 'apothecaries');
  });

  asArray(content.outskirts).forEach((outskirts: any) => {
    const id = String(outskirts.id);
    const mats = Object.values(outskirts.matPools ?? {}).flat().map(String);
    records.push(makeRecord({
      id: `outskirts.${id}`,
      title: outskirts.name ?? titleCaseId(id),
      categoryLabel: 'Activities',
      plain: `${outskirts.name ?? titleCaseId(id)} is an Outskirts encounter source for baseline combat and materials.`,
      why: 'Outskirts records expose baseline encounter sources without changing combat ownership.',
      how: 'Route to World and use the city Outskirts activity when available.',
      used: mats.map((itemId) => itemName(content, itemId)).join(', '),
      tags: ['outskirts', 'combat', 'source'],
      related: mats.map((itemId) => itemName(content, itemId)),
      route: ['Route to World'],
      sourceUse: [
        { id: `outskirts-${id}-route`, label: 'Best Source', value: outskirts.name ?? titleCaseId(id), kind: 'source', routeLabel: 'Route to World' },
        { id: `outskirts-${id}-used-for`, label: 'Found In', value: mats.map((itemId) => itemName(content, itemId)).join(', ') || 'No material pool listed', kind: 'usedFor' },
      ],
      sourceFamily: 'outskirts',
      sourceId: id,
      searchExtra: mats,
    }));
    pushCount(generatedCounts, 'outskirts');
  });

  records.forEach((record) => unresolvedLinks.push(...record.debug.unresolvedRelations));

  return {
    records,
    generatedCounts,
    unresolvedLinks: Array.from(new Set(unresolvedLinks)).sort(),
  };
}
