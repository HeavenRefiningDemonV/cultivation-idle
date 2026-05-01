import React from 'react';
import type { RuinsTargetedMaterialsCardSurface } from '../types.js';
import { RUINS_EXACT_ASSETS } from '../ruinsExactAssetRegistry.js';

export function RuinsTargetedMaterialsCard({ card, onToggleAutoRepeat }: { card: RuinsTargetedMaterialsCardSurface; onToggleAutoRepeat?: () => void }) {
  return React.createElement('section', { className: 'ruinsTargetedMaterialsCard', 'data-testid': 'ruins-exact-targeted-materials-card', 'aria-label': 'Targeted Materials' },
    React.createElement('h3', { className: 'ruinsTargetedMaterialsCard__title', 'data-testid': 'ruins-exact-targeted-materials-title' }, card.title),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__divider' }),
    React.createElement('h4', { className: 'ruinsTargetedMaterialsCard__sectionTitle' }, card.leadMaterialsTitle),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__leadMaterials', 'data-testid': 'ruins-exact-lead-materials' },
      ...card.leadMaterials.map((mat) => React.createElement('article', { key: mat.id, className: `ruinsTargetedMaterialsCard__tile ruinsTargetedMaterialsCard__tile--${mat.tone}`, 'data-testid': 'ruins-exact-lead-material-tile' },
        React.createElement('img', { src: RUINS_EXACT_ASSETS.icons.targetedMaterials[mat.iconKey], alt: '', 'aria-hidden': 'true', className: 'ruinsTargetedMaterialsCard__tileIcon' }),
        React.createElement('span', { className: 'ruinsTargetedMaterialsCard__tileLabel' }, mat.label),
      )),
    ),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__divider' }),
    React.createElement('h4', { className: 'ruinsTargetedMaterialsCard__sectionTitle' }, card.guaranteedAnchorTitle),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__anchor', 'data-testid': 'ruins-exact-guaranteed-anchor', 'aria-label': `Guaranteed Anchor: ${card.guaranteedAnchor.label} from ${card.guaranteedAnchor.sourceLabel}` },
      React.createElement('span', { className: 'ruinsTargetedMaterialsCard__anchorIconWrap' }, React.createElement('img', { src: RUINS_EXACT_ASSETS.icons.targetedMaterials.anchorChest, alt: '', 'aria-hidden': 'true', className: 'ruinsTargetedMaterialsCard__anchorIcon' })),
      React.createElement('span', { className: 'ruinsTargetedMaterialsCard__anchorCopy' }, React.createElement('strong', null, card.guaranteedAnchor.label), React.createElement('small', null, card.guaranteedAnchor.sourceLabel)),
    ),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__divider' }),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__row', 'data-testid': 'ruins-exact-rare-pity' }, React.createElement('span', null, card.rarePity.label), React.createElement('strong', null, card.rarePity.valueText)),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__pityDots', 'aria-label': `${card.rarePity.label}: ${card.rarePity.valueText}` }, ...Array.from({ length: card.rarePity.dots.total }).map((_, i) => React.createElement('span', { key: i, className: `ruinsTargetedMaterialsCard__pityDot${i < card.rarePity.dots.filled ? ' is-filled' : ''}`, 'data-testid': 'ruins-exact-rare-pity-dot' }))),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__divider' }),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__row', 'data-testid': 'ruins-exact-auto-repeat' }, React.createElement('span', null, card.autoRepeat.label), React.createElement('button', { type: 'button', className: 'ruinsTargetedMaterialsCard__toggle', 'aria-pressed': card.autoRepeat.enabled, disabled: !onToggleAutoRepeat, onClick: onToggleAutoRepeat }, card.autoRepeat.valueText)),
    React.createElement('p', { className: 'ruinsTargetedMaterialsCard__helper' }, card.autoRepeat.helperText),
    React.createElement('div', { className: 'ruinsTargetedMaterialsCard__divider' }),
    React.createElement('p', { className: 'ruinsTargetedMaterialsCard__footer', 'data-testid': 'ruins-exact-targeted-materials-footer' }, card.footer),
    React.createElement('span', { className: 'ruinsTargetedMaterialsCard__seal', 'aria-hidden': 'true' }),
  );
}
