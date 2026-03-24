import type { FailureFix } from '../../readiness/failureDiagnosisTypes.js';

export type GateTrialFixActionKind = 'open_cultivation' | 'open_techniques' | 'open_module' | 'attempt_gate' | 'buy_safety_net';

export interface GateTrialFixAction {
  kind: GateTrialFixActionKind;
  label: string;
  moduleKey?: string;
}

export function mapGateTrialFixToAction(fix: FailureFix): GateTrialFixAction {
  switch (fix.destination) {
    case 'cultivation':
      return { kind: 'open_cultivation', label: 'Open Cultivation' };
    case 'techniques':
      return { kind: 'open_techniques', label: 'Open Techniques' };
    case 'forge':
      return { kind: 'open_module', label: 'Open Forge', moduleKey: 'forge' };
    case 'apothecary':
    case 'medicine_pouch':
      return { kind: 'open_module', label: 'Open Apothecary', moduleKey: 'apothecary' };
    case 'trial':
      return fix.code === 'buy_fail_safe'
        ? { kind: 'buy_safety_net', label: 'Buy Safety Net' }
        : { kind: 'attempt_gate', label: 'Attempt Gate' };
    default:
      return { kind: 'open_techniques', label: 'Open Techniques' };
  }
}
