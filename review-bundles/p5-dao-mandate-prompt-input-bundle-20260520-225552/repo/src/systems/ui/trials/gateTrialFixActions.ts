import type { FailureFix } from '../../readiness/failureDiagnosisTypes.js';

export type GateTrialFixActionKind =
  | 'open_cultivation'
  | 'open_techniques'
  | 'open_module'
  | 'open_apothecary_pouch'
  | 'attempt_gate'
  | 'buy_safety_net'
  | 'set_ai_profile_survivor'
  | 'enable_consumables';

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
      return { kind: 'open_module', label: 'Open Apothecary', moduleKey: 'apothecary' };
    case 'medicine_pouch':
      return { kind: 'open_apothecary_pouch', label: 'Open Pouch Setup' };
    case 'trial':
      if (fix.code === 'fix_ai_posture') {
        return { kind: 'set_ai_profile_survivor', label: 'Set AI: Survivor' };
      }
      if (fix.code === 'fix_casting_posture') {
        return { kind: 'open_techniques', label: 'Open Techniques' };
      }
      if (fix.code === 'configure_pouch') {
        return { kind: 'enable_consumables', label: 'Enable Consumables' };
      }
      return fix.code === 'buy_fail_safe'
        ? { kind: 'buy_safety_net', label: 'Buy Safety Net' }
        : { kind: 'attempt_gate', label: 'Attempt Gate' };
    default:
      return { kind: 'open_techniques', label: 'Open Techniques' };
  }
}
