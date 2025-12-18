import type { LifePath } from '../types';
import type { PavilionPoolEntry, TechniqueDef } from '../content';
import { useContentStore } from '../stores/contentStore';

export interface ResolvedPoolEntry {
  techId: string;
  entry: PavilionPoolEntry;
  technique?: TechniqueDef;
}

export function resolveTechniqueId(rawId: string, path?: LifePath | null): string | null {
  const content = useContentStore.getState();
  const techniques = content.maps.techniquesById || {};

  if (techniques[rawId]) return rawId;

  const candidates: string[] = [];
  if (path) {
    candidates.push(`tech_${path}_${rawId}`);
  }
  candidates.push(rawId);

  for (const id of candidates) {
    if (techniques[id]) return id;
  }

  const suffixMatch = Object.keys(techniques).find(
    (id) => id.endsWith(`_${rawId}`) && (!path || techniques[id]?.path === path),
  );
  if (suffixMatch) return suffixMatch;

  return null;
}

export function resolvePavilionPool(
  entries: PavilionPoolEntry[],
  path?: LifePath | null,
): ResolvedPoolEntry[] {
  const content = useContentStore.getState();
  const resolved: ResolvedPoolEntry[] = [];

  entries.forEach((entry) => {
    const rawId = typeof entry === 'string' ? entry : entry.techId;
    const techId = resolveTechniqueId(rawId, path);
    if (!techId) {
      console.warn('[Pavilion] Unable to resolve technique id from entry', rawId, 'for path', path);
      return;
    }
    resolved.push({ techId, entry, technique: content.maps.techniquesById[techId] });
  });

  return resolved;
}
