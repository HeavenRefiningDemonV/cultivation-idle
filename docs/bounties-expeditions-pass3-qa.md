# Pass 3 QA Checklist — Bounties & Expeditions (DetailScrollModal)

Use this checklist to validate post-pass stability and ensure no regressions after moving detail flows into `DetailScrollModal`.

## Environment setup
- [ ] Run the game in a local dev build (or production build) with a fresh load.
- [ ] Ensure at least one city has active bounties and expedition routes.

## Bounties — core flows
- [ ] **Refresh works**: Click **Refresh** and confirm new bounty papers are generated with updated titles/progress targets.
- [ ] **Tracked bounty works**: Open a bounty → click **Track** → close. Confirm the tracked footer appears and reopens the same bounty.
- [ ] **Claim works + rewards granted**: Complete a bounty objective, open its detail modal, click **Claim Reward**, and confirm:
  - [ ] the claim button disables or shows a claimed state.
  - [ ] the rewards appear in inventory (Merit/Gold/Spirit Stones).

## Expeditions — core flows
- [ ] **Start works**: Open a route, select a duration + available slot, click **Send Expedition**, and confirm:
  - [ ] the modal closes (or stays open but slot shows “In progress” on stage).
  - [ ] the selected slot shows a running timer on the stage.
- [ ] **Claim works**: Wait for an expedition to complete, click **Claim** on the slot, and confirm:
  - [ ] the claim succeeds and the ceremony overlay appears.
  - [ ] rewards are granted as expected.
- [ ] **Ceremony overlay works**: In the ceremony overlay, verify:
  - [ ] rewards list is shown.
  - [ ] “Send Again” and “Go use materials” work.
  - [ ] **Close** returns to the expedition stage correctly.

## DetailScrollModal behavior (Bounties & Expeditions)
- [ ] **Background scroll lock**: Open a modal and attempt to scroll the background stage; it should remain fixed.
- [ ] **Focus trap**: Use `Tab` and `Shift+Tab` to ensure focus stays inside the modal.
- [ ] **Focus restore**: Close the modal and confirm focus returns to the route/bounty paper button that opened it.
- [ ] **ESC closes**: Press `Escape` and confirm the modal closes.
- [ ] **Overlay click closes**: Click outside the modal panel and confirm the modal closes (consistent with existing modal behavior).
- [ ] **No layout shift**: Opening/closing the modal should not cause noticeable layout shift due to scrollbar changes.
- [ ] **Reduced motion**: With `prefers-reduced-motion: reduce`, modal open/close should not animate.

## Visual checks
- [ ] **Stage remains clean**:
  - [ ] Bounty stage shows 3 pinned papers only (summary content).
  - [ ] Expedition stage shows 3 route papers, a small hint chip, and compact slots row (no planning slab).
- [ ] **Modal content**:
  - [ ] Bounty modal shows objective, progress bar, rules, rewards, and action buttons.
  - [ ] Expedition modal shows yields, rare finds, duration selection, slot picker, and send button.
