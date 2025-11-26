import type { ReactNode } from 'react';
import { images } from '../../assets/images';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import type { GameTab } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import './SidebarLayout.css';

export type SidebarLayoutProps = {
    activeTab: GameTab;
    onSelectTab: (tab: GameTab) => void;
    children: ReactNode;
};

type SidebarButtonProps = {
    label: string;
    tabId: GameTab;
    isActive: boolean;
    onClick: () => void;
};

function SidebarButton({ label, tabId, isActive, onClick }: SidebarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-tab-id={tabId}
            aria-pressed={isActive}
            className={`sidebar-btn ${isActive ? 'sidebar-btn-active' : ''} font-cinzel text-lg tracking-wide text-ink-paper`}
            style={{
                backgroundImage: `url(${images.ui.block})`,
            }}
        >
            <span className="sidebar-btn-arrow sidebar-btn-arrow-left">◀</span>
            <span
                className={`sidebar-btn-label ${isActive ? 'font-semibold text-qi-glow' : 'drop-shadow'
                    }`}
            >
                {label}
            </span>
            <span className="sidebar-btn-arrow sidebar-btn-arrow-right">▶</span>
        </button>
    );
}

const TABS: { id: GameTab; label: string }[] = [
    { id: 'cultivation', label: 'Cultivate' },
    { id: 'status', label: 'Status' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'dungeon', label: 'Dungeon' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'techniques', label: 'Techniques' },
    { id: 'settings', label: 'Settings' },
];

export function SidebarLayout({ activeTab, onSelectTab, children }: SidebarLayoutProps) {
    const qi = useGameStore((state) => state.qi);
    const qiPerSecond = useGameStore((state) => state.qiPerSecond);
    const realm = useGameStore((state) => state.realm);
    const totalAuras = useGameStore((state) => state.totalAuras);
    const showPrestige = useUIStore((state) => state.showPrestige);

    return (
        <div className="flex h-full pt-20 text-ink-paper">
            <aside className="w-64 bg-ink-dark/80 border-r-2 border-ink-darkest backdrop-blur-sm flex flex-col">
                <div className="p-4 space-y-4">
                    <div className="bg-ink-darkest/70 border border-ink-medium rounded-lg p-3">
                        <div className="text-xs text-ink-light uppercase tracking-wide">Qi</div>
                        <div className="text-qi-glow font-mono text-lg">{formatNumber(qi)}</div>
                        <div className="text-xs text-ink-light">{formatNumber(qiPerSecond)}/s</div>
                        <div className="mt-2 text-xs text-ink-light">Realm</div>
                        <div className="text-sm font-semibold text-gold-accent">
                            {realm?.name}
                            {realm ? (
                                <span className="ml-1 text-ink-light">• Substage {realm.substage + 1}</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {TABS.map((tab) => (
                            <SidebarButton
                                key={tab.id}
                                tabId={tab.id}
                                label={tab.label}
                                isActive={activeTab === tab.id}
                                onClick={() => onSelectTab(tab.id)}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-4 border-t-2 border-ink-dark">
                    <div className="text-center text-sm text-gold-accent mb-3 font-mono">
                        Auras:{' '}
                        <span className="font-bold text-gold-bright">{formatNumber(totalAuras)}</span>
                    </div>
                    <button
                        onClick={showPrestige}
                        className="w-full py-3 px-4 bg-breakthrough-red hover:bg-breakthrough-pink border-2 border-breakthrough-pink text-ink-white font-cinzel text-lg transition-all shadow-breakthrough"
                        style={{
                            backgroundImage: `url(${images.ui.block})`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                    >
                        Rebirth
                    </button>
                </div>
            </aside>

            <div className="flex-1 h-full overflow-y-auto p-4">{children}</div>
        </div>
    );
}

export { SidebarButton };
