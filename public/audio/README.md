# Audio Assets

Drop game audio files in this folder to make them available to the audio system.

## Naming
- Primary file name: `/public/audio/<soundId>.ogg`
- Optional variants: `/public/audio/<soundId>__1.ogg`, `/public/audio/<soundId>__2.ogg`, ...
- Fallback extensions supported: `.ogg`, `.mp3`, `.wav`

Example:
```
public/audio/ui_click_primary.ogg
public/audio/ui_click_primary__1.ogg
public/audio/ui_click_primary__2.mp3
```
