export type ArtifactImprintRole =
  | 'gate_support'
  | 'cultivation_support'
  | 'economy_support'
  | 'memory_support';

export interface ArtifactImprintFutureSpec {
  imprintId: string;
  title: string;
  phaseRealmId: string;
  sourceKind: 'ruins_boss' | 'gate_clear' | 'breakthrough' | 'prestige_memory' | 'future';
  role: ArtifactImprintRole;
  doctrineTags: string[];
  attunementHint: string;
  sourceLine: string;
  sinkLine: string;
  memoryLine: string;
  runtimeStatus: 'future_stub_only';
}
