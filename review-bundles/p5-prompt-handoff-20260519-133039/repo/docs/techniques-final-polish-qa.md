# Techniques Pass 5D — Final Polish QA Checklist

## Setup
- Launch the app and open the **Techniques** screen.
- Ensure you have at least one learned technique, and at least one slot locked.

## Manual QA Steps

### 1) Detail modal keyboard access
- Focus a technique spine with the keyboard and open the detail modal (Enter/Space).
- Press **Esc** to close.
- Verify focus returns to the previously focused element.

### 2) Filter drawer placement and behavior
- Click the **Filters** trigger in the Owned Techniques header.
- Confirm the drawer opens without shifting layout.
- Close the drawer and confirm no layout jump.

### 3) Inner Palace slot stability
- Resize the window (wide → narrow → wide).
- Confirm slot positions remain in a stable circular layout.
- Verify labels do not overlap or clip.

### 4) Equip/unequip VFX feedback
- Select a technique spine and equip it into a compatible slot.
- Confirm the slot flashes softly and the altar core emits a gentle pulse.
- Unequip a slot and confirm the unequip flash plays.

### 5) Rank upgrade / trait reroll feedback
- Open **Rank Upgrade** from the detail modal.
- Confirm action feedback uses a subtle pulse (not a harsh flash).
- Open **Trait Reroll** and confirm messaging is readable and visually consistent.

### 6) Reduced motion compliance
- Enable **prefers-reduced-motion** in the OS/browser.
- Verify the following are disabled:
  - Stage background rotation / breathing gradients
  - Altar core pulse animations
  - Modal open animations

### 7) Scroll and overlay behavior
- Scroll the center list and right panel.
- Confirm scrollbars do not compress the altar.
- Confirm overlays do not block background scrolling unexpectedly.

## Visual Expectations
- Spines remain the primary shelf visual (no card covers).
- Tier/Path/Type icons are visible on each spine.
- VFX remains subtle (opacity ~0.06–0.18).
