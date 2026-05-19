import { contentUrl } from '../../content/index.js';
import { validatePavilionRecordsManifest, type PavilionRecordsManifest } from './pavilionContentTypes.js';

export async function loadPavilionManifest(): Promise<PavilionRecordsManifest> {
  const response = await fetch(contentUrl('pavilion_records.json'), {
    cache: import.meta.env.DEV ? 'no-store' : undefined,
  });
  if (!response.ok) {
    throw new Error(`[Pavilion] Failed to fetch pavilion_records.json (${response.status})`);
  }
  return validatePavilionRecordsManifest(await response.json());
}

