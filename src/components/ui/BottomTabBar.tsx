import { images } from '../../assets/images';

export type BottomTabBarProps = {
  activeTab: string;
  onSelectTab: (tab: string) => void;
};

type TabButtonProps = {
  tabId: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function TabButton({ tabId, label, isActive, onClick }: TabButtonProps) {
  const background = images.ui.block;

  return (
    <button
      key={tabId}
      onClick={onClick}
      className={`flex-1 h-12 px-4 font-cinzel text-sm tracking-wide transition-all duration-200 rounded-md border ${
        isActive
          ? 'bg-amber-200/80 border-amber-400 text-ink-dark drop-shadow'
          : 'bg-amber-100/60 border-amber-200 text-ink-dark hover:bg-amber-200/70'
      }`}
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {label}
    </button>
  );
}

const BOTTOM_TABS = [
  { id: 'status', label: 'Status' },
  { id: 'cultivation', label: 'Cultivate' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'dungeon', label: 'Dungeon' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'prestige', label: 'Prestige' },
];

export function BottomTabBar({ activeTab, onSelectTab }: BottomTabBarProps) {
  return (
    <div className="w-full bg-ink-dark/60 border-t-2 border-ink-darkest backdrop-blur-sm p-2 flex gap-2">
      {BOTTOM_TABS.map((tab) => (
        <TabButton
          key={tab.id}
          tabId={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onSelectTab(tab.id)}
        />
      ))}
    </div>
  );
}

export { TabButton };
