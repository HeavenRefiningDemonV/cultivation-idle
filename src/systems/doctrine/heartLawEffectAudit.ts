import type { HeartLawAffinityRules, HeartLawDef } from '../../content/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { buildHeartLawCatalogFromDefinitions } from './heartLawCatalog.js';
import { getHeartLawFamily } from './heartLawFamilyRegistry.js';
import { SUPPORTED_HEART_LAW_RAW_KEYS } from './heartLawEffectReaders.js';
import type { HeartLawAuditReport } from './heartLawTypes.js';

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pairCapKey(payload: Record<string, unknown>): string | null {
  const keys = Object.keys(payload).filter((key) => key !== 'note' && key !== 'cap');
  if (keys.length !== 1) {
    return null;
  }

  return keys[0] ?? null;
}

function collectPayloadKeys(
  payload: unknown,
  supportedKeys: Set<string>,
  derivedKeys: Set<string>,
  ignoredKeys: Set<string>,
): void {
  if (!isObjectLike(payload)) {
    return;
  }

  const pairedCapKey = pairCapKey(payload);

  Object.entries(payload).forEach(([rawKey, rawValue]) => {
    if (!SUPPORTED_HEART_LAW_RAW_KEYS.includes(rawKey)) {
      ignoredKeys.add(rawKey);
      return;
    }

    if (rawKey === 'cap') {
      if (pairedCapKey) {
        derivedKeys.add(`${pairedCapKey}.cap`);
      } else {
        ignoredKeys.add('cap');
      }
      return;
    }

    supportedKeys.add(rawKey);

    if (rawKey === 'note') {
      if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
        derivedKeys.add('note');
      }
      return;
    }

    if (!isObjectLike(rawValue)) {
      return;
    }

    switch (rawKey) {
      case 'cultivationCharge':
        ['cultivationCharge.resourceId', 'cultivationCharge.gainPerCultivateMinute', 'cultivationCharge.cap'].forEach((key) => derivedKeys.add(key));
        break;
      case 'combatOpenerBuff':
        ['combatOpenerBuff.durationSec', 'combatOpenerBuff.atkMult', 'combatOpenerBuff.atkMultPer10Charge', 'combatOpenerBuff.burnChanceAdd', 'combatOpenerBuff.burnStacksOnHit'].forEach((key) => {
          if (rawValue[key.split('.').at(-1) ?? ''] !== undefined) {
            derivedKeys.add(key);
          }
        });
        break;
      case 'combatFirstBossKillBonus':
        ['combatFirstBossKillBonus.type', 'combatFirstBossKillBonus.chance', 'combatFirstBossKillBonus.capPerHour'].forEach((key) => {
          if (rawValue[key.split('.').at(-1) ?? ''] !== undefined) {
            derivedKeys.add(key);
          }
        });
        break;
      case 'bossKillLantern':
        ['bossKillLantern.resourceId', 'bossKillLantern.gainPerBossKill', 'bossKillLantern.cap'].forEach((key) => derivedKeys.add(key));
        break;
      case 'voidWindow':
        ['voidWindow.everySec', 'voidWindow.durationSec', 'voidWindow.ignoreDefPct'].forEach((key) => derivedKeys.add(key));
        break;
      default:
        break;
    }
  });
}

function createEmptyAuditReport(): HeartLawAuditReport {
  return {
    supportedKeys: [],
    derivedKeys: [],
    ignoredKeys: [],
    budgetViolations: [],
    lawReports: [],
  };
}

export function auditHeartLawEffectsFromDefinitions(
  laws: readonly HeartLawDef[],
  affinityRules?: HeartLawAffinityRules | null,
): HeartLawAuditReport {
  const catalog = buildHeartLawCatalogFromDefinitions(laws, affinityRules);
  const supportedKeys = new Set<string>();
  const derivedKeys = new Set<string>();
  const ignoredKeys = new Set<string>();

  const lawReports = laws.map((law) => {
    const perLawSupported = new Set<string>();
    const perLawDerived = new Set<string>();
    const perLawIgnored = new Set<string>();

    collectPayloadKeys(law.signature, perLawSupported, perLawDerived, perLawIgnored);
    (law.chapters ?? []).forEach((chapter) => {
      collectPayloadKeys(chapter.effects, perLawSupported, perLawDerived, perLawIgnored);
    });

    perLawSupported.forEach((key) => supportedKeys.add(key));
    perLawDerived.forEach((key) => derivedKeys.add(key));
    perLawIgnored.forEach((key) => ignoredKeys.add(key));

    const family = getHeartLawFamily(law.id);
    if (!family) {
      throw new Error(`[HeartLawAudit] Missing explicit family registry entry for live heart law '${law.id}'.`);
    }

    return {
      lawId: law.id,
      family,
      supportedRawKeys: [...perLawSupported].sort((a, b) => a.localeCompare(b)),
      derivedNormalizedKeys: [...perLawDerived].sort((a, b) => a.localeCompare(b)),
      ignoredRawKeys: [...perLawIgnored].sort((a, b) => a.localeCompare(b)),
      spilloverBudgetPct: catalog[law.id]?.spilloverBudgetPct ?? 0,
      combatBudgetPct: catalog[law.id]?.combatBudgetPct ?? 0,
    };
  }).sort((a, b) => a.lawId.localeCompare(b.lawId));

  return {
    supportedKeys: [...supportedKeys].sort((a, b) => a.localeCompare(b)),
    derivedKeys: [...derivedKeys].sort((a, b) => a.localeCompare(b)),
    ignoredKeys: [...ignoredKeys].sort((a, b) => a.localeCompare(b)),
    budgetViolations: lawReports
       .filter((report) => report.spilloverBudgetPct > 40)
      .map((report) => ({ lawId: report.lawId, spilloverBudgetPct: report.spilloverBudgetPct, combatBudgetPct: report.combatBudgetPct }))
      .sort((a, b) => a.lawId.localeCompare(b.lawId)),
    lawReports,
  };
}

export function auditHeartLawEffects(): HeartLawAuditReport {
  const content = useContentStore.getState();
  if (!content.isLoaded || !content.raw) {
    return createEmptyAuditReport();
  }

  return auditHeartLawEffectsFromDefinitions(
    content.raw.heart_laws,
    content.raw.heart_law_affinity_rules,
  );
}
