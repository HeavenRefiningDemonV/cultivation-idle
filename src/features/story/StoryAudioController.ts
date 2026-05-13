export class StoryAudioController {
  prepare(): void {
    return undefined;
  }

  playSlide(): void {
    return undefined;
  }

  playUiCue(): void {
    return undefined;
  }

  stopAll(): void {
    return undefined;
  }
}

export function useStoryAudioController() {
  return {
    playSlideCue: () => undefined,
    stop: () => undefined,
    fadeOut: () => undefined,
  };
}
