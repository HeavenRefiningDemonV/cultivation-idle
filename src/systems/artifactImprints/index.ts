import type { ArtifactImprintFutureSpec } from './types.js';

export type { ArtifactImprintFutureSpec, ArtifactImprintRole } from './types.js';

export const ARTIFACT_IMPRINT_FUTURE_SPECS: readonly ArtifactImprintFutureSpec[] = Object.freeze([
  {
    imprintId: 'future_foundation_gate_jade',
    title: 'Foundation Gate Jade Imprint',
    phaseRealmId: 'foundation_establishment',
    sourceKind: 'gate_clear',
    role: 'gate_support',
    doctrineTags: ['trial', 'vessel'],
    attunementHint: 'Future-only: attunement would require a named gate clear and a matching doctrine route.',
    sourceLine: 'A clean gate clear could leave a named jade trace.',
    sinkLine: 'Future sink must support a concrete gate or cultivation route, not a generic stat bonus.',
    memoryLine: 'The first Foundation threshold left a jade memory in the vessel.',
    runtimeStatus: 'future_stub_only',
  },
]);
