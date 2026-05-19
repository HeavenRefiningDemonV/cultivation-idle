let previewEnabledForTests: boolean | null = null;

export function isTribulationPressurePreviewEnabled(): boolean {
  return previewEnabledForTests === true;
}

export function setTribulationPressurePreviewEnabledForTests(enabled: boolean): void {
  previewEnabledForTests = enabled;
}

export function resetTribulationPressurePreviewFlagForTests(): void {
  previewEnabledForTests = null;
}
