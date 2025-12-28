import type { CraftPromptState, CraftPromptStatus, CraftPromptType, PromptDef } from './craftingTypes';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sortByDueTime = (a: CraftPromptState, b: CraftPromptState) => a.dueAtMs - b.dueAtMs;

export function scheduleAssistedPrompts(
  defs: PromptDef[] | undefined,
  startedAtMs: number,
  endsAtMs: number,
): CraftPromptState[] {
  if (!defs || defs.length === 0) return [];
  const duration = Math.max(0, endsAtMs - startedAtMs);
  return defs
    .map((def, index) => {
      const clampedAt = clamp(def.atPct ?? 0, 0, 1);
      const windowMs = Math.max(0, Math.floor((def.windowSec ?? 0) * 1000));
      const dueAtMs = startedAtMs + duration * clampedAt;
      const expiresAtMs = dueAtMs + windowMs;
      return {
        id: def.id || `prompt_${index}`,
        type: def.type as CraftPromptType,
        dueAtMs,
        expiresAtMs,
        status: 'PENDING' as CraftPromptStatus,
        completedAtMs: null,
        bonus: def.bonus,
        ui: def.ui,
      } satisfies CraftPromptState;
    })
    .sort(sortByDueTime);
}

export function updatePromptStatuses(prompts: CraftPromptState[], now: number): CraftPromptState[] {
  return prompts.map((prompt) => {
    if (prompt.status === 'COMPLETED') return prompt;
    if (now >= prompt.expiresAtMs) {
      return { ...prompt, status: 'MISSED' };
    }
    if (now >= prompt.dueAtMs) {
      return { ...prompt, status: 'AVAILABLE' };
    }
    return { ...prompt, status: 'PENDING' };
  });
}

export function completePrompt(
  prompts: CraftPromptState[],
  promptId: string,
  now: number,
): { prompts: CraftPromptState[]; ok: boolean; reason?: string } {
  const updated = updatePromptStatuses(prompts, now);
  const target = updated.find((prompt) => prompt.id === promptId);
  if (!target) {
    return { prompts: updated, ok: false, reason: 'missing_prompt' };
  }
  if (target.status !== 'AVAILABLE') {
    return { prompts: updated, ok: false, reason: 'not_available' };
  }
  return {
    prompts: updated.map((prompt) =>
      prompt.id === promptId
        ? { ...prompt, status: 'COMPLETED' as CraftPromptStatus, completedAtMs: now }
        : prompt,
    ),
    ok: true,
  };
}

export function summarizePrompts(prompts: CraftPromptState[]): {
  total: number;
  completed: number;
  available: number;
} {
  const total = prompts.length;
  let completed = 0;
  let available = 0;
  prompts.forEach((prompt) => {
    if (prompt.status === 'COMPLETED') completed += 1;
    if (prompt.status === 'AVAILABLE') available += 1;
  });
  return { total, completed, available };
}

export function applyYieldBonuses(
  baseItems: Array<{ itemId: string; qty: number }>,
  prompts: CraftPromptState[],
): {
  items: Array<{ itemId: string; qty: number }>;
  bonusItems: Array<{ itemId: string; qty: number }>;
  completed: number;
  total: number;
} {
  const completedPrompts = prompts.filter((prompt) => prompt.status === 'COMPLETED');
  const totalYieldPct = completedPrompts.reduce((acc, prompt) => acc + (prompt.bonus?.yieldPct ?? 0), 0);
  if (totalYieldPct <= 0) {
    return { items: baseItems.map((entry) => ({ ...entry })), bonusItems: [], completed: completedPrompts.length, total: prompts.length };
  }

  const bonusItems: Array<{ itemId: string; qty: number }> = [];
  const items = baseItems.map((entry) => {
    const bonusQty = Math.floor(entry.qty * (totalYieldPct / 100));
    if (bonusQty > 0) {
      bonusItems.push({ itemId: entry.itemId, qty: bonusQty });
    }
    return { itemId: entry.itemId, qty: entry.qty + Math.max(0, bonusQty) };
  });

  return { items, bonusItems, completed: completedPrompts.length, total: prompts.length };
}
