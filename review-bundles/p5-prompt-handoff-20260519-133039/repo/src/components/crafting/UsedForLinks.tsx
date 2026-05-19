import classNames from 'classnames';
import { useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore.js';
import { getShellTabLabel } from '../../ui/text/playerFacingLabels.js';

interface UsedForLinksProps {
  usageText?: string;
  className?: string;
}

const buttonMatches = [
  {
    keywords: ['technique', 'Technique'],
    label: 'Go to Techniques',
    tab: 'techniques' as const,
  },
  {
    keywords: ['Combat', 'combat', 'Outskirts', 'Trial', 'Ruins'],
    label: `Go to ${getShellTabLabel('adventure')}`,
    tab: 'adventure' as const,
  },
  {
    keywords: ['Cultivation', 'cultivation', 'Qi', 'qi'],
    label: 'Go to Cultivation',
    tab: 'cultivation' as const,
  },
];

export function UsedForLinks({ usageText, className }: UsedForLinksProps) {
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const actions = useMemo(() => {
    if (!usageText) return [];
    return buttonMatches.filter((entry) =>
      entry.keywords.some((keyword) => usageText.toLowerCase().includes(keyword.toLowerCase())),
    );
  }, [usageText]);

  return (
    <div className={classNames('usedForLinks', className)}>
      <div className={'usedForHeader'}>
        <span className={'usedForLabel'}>Used for:</span>{' '}
        <span className={'usedForValue'}>{usageText || '—'}</span>
      </div>
      {actions.length > 0 && (
        <div className={'usedForActions'}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={'worldScreenModuleButton usedForButton'}
              onClick={() => setActiveTab(action.tab)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
