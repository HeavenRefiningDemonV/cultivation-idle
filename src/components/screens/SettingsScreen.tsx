import { useEffect, useState } from 'react';
import { deleteSaveAndHardReset } from '../../utils/saveload';
import { useContentStore } from '../../stores/contentStore';
import { getContentBaseUrl } from '../../content';
import { useUIStore } from '../../stores/uiStore';
import './SettingsScreen.scss';

export function SettingsScreen() {
  const showOfflineModal = useUIStore((state) => state.settings.showOfflineModal);
  const showCombatLog = useUIStore((state) => state.settings.showCombatLog);
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);
  const setSettings = useUIStore((state) => state.setSettings);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const contentIsLoaded = useContentStore((state) => state.isLoaded);
  const contentIsLoading = useContentStore((state) => state.isLoading);
  const contentError = useContentStore((state) => state.error);
  const cities = useContentStore((state) => state.citiesSorted);
  const techniquesByPath = useContentStore((state) => state.techniquesByPath);
  const itemsCount = useContentStore((state) => Object.keys(state.maps.itemsById).length);
  const techniquesCount = useContentStore((state) => Object.keys(state.maps.techniquesById).length);
  const pavilionsById = useContentStore((state) => state.maps.pavilionsById);
  const outskirtsCount = useContentStore((state) => Object.keys(state.maps.outskirtsById).length);
  const enemiesCount = useContentStore((state) => Object.keys(state.maps.enemiesById).length);
  const trialsCount = useContentStore((state) => Object.keys(state.maps.trialsById).length);
  const ruinsCount = useContentStore((state) => Object.keys(state.maps.ruinsById).length);
  const pavilionsCount = useContentStore((state) => Object.keys(state.maps.pavilionsById).length);

  const toggleOfflineModal = () => setSettings({ showOfflineModal: !showOfflineModal });
  const toggleCombatLog = () => setSettings({ showCombatLog: !showCombatLog });
  const togglePrestigeConfirm = () =>
    setSettings({ requirePrestigeConfirm: !requirePrestigeConfirm });

  const handleDeleteSave = () => {
    setShowDeleteModal(false);
    deleteSaveAndHardReset();
  };

  useEffect(() => {
    setHeaderTitles('Settings', 'Configure UI behavior and manage your save data.');
  }, [setHeaderTitles]);

  return (
    <div className={'settingsScreenRoot'}>
      <div className={'settingsScreenBackground'} />

      <div className={'settingsScreenContent'}>
        <div className={'settingsScreenGrid'}>
          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Gameplay &amp; UI</h2>
            <p className={'settingsScreenPanelSubtitle'}>Toggle interface elements and confirmations.</p>
            <div className={'settingsScreenOptionList'}>
              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={showOfflineModal}
                  onChange={toggleOfflineModal}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Show offline progress modal</div>
                  <p className={'settingsScreenOptionDescription'}>Display rewards earned while away when you return.</p>
                </div>
              </label>

              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={showCombatLog}
                  onChange={toggleCombatLog}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Show combat log</div>
                  <p className={'settingsScreenOptionDescription'}>Hide or reveal the detailed combat event log.</p>
                </div>
              </label>

              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={requirePrestigeConfirm}
                  onChange={togglePrestigeConfirm}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Require prestige confirmation</div>
                  <p className={'settingsScreenOptionDescription'}>Ask for confirmation before reincarnating.</p>
                </div>
              </label>
            </div>
          </div>

          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDanger'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Save Management</h2>
            <p className={'settingsScreenPanelSubtitle'}>
              Delete all progress and restart as if the game was freshly installed.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className={'button-standard settingsScreenDangerButton'}
            >
              Delete Save &amp; Hard Reset
            </button>
            <p className={'settingsScreenDangerNote'}>
              This will remove all saves, Ascension Points, upgrades, spirit roots, auras, and items. This action
              cannot be undone.
            </p>
          </div>

          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Content Debug</h2>
            <p className={'settingsScreenPanelSubtitle'}>
              Inspect loaded content pack counts and pavilion pools (Cities 1-5).
            </p>

            <div className={'settingsDebugRow'}>
              <div className={'settingsDebugLabel'}>Base URL</div>
              <div className={'settingsDebugValue'}>{getContentBaseUrl()}</div>
            </div>
            <div className={'settingsDebugRow'}>
              <div className={'settingsDebugLabel'}>Loaded</div>
              <div className={'settingsDebugValue'}>
                {contentIsLoaded ? 'Yes' : contentIsLoading ? 'Loading…' : 'No'}
              </div>
            </div>
            {contentError && <div className={'settingsDebugError'}>Error: {contentError}</div>}

            <div className={'settingsDebugGrid'}>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Cities</div>
                <div className={'settingsDebugValue'}>{cities.length}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Items</div>
                <div className={'settingsDebugValue'}>{itemsCount}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Techniques</div>
                <div className={'settingsDebugValue'}>{techniquesCount}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Heaven Path</div>
                <div className={'settingsDebugValue'}>{techniquesByPath.heaven.length}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Earth Path</div>
                <div className={'settingsDebugValue'}>{techniquesByPath.earth.length}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Martial Path</div>
                <div className={'settingsDebugValue'}>{techniquesByPath.martial.length}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Pavilions</div>
                <div className={'settingsDebugValue'}>{pavilionsCount}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Outskirts</div>
                <div className={'settingsDebugValue'}>{outskirtsCount}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Enemies</div>
                <div className={'settingsDebugValue'}>{enemiesCount}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Trials</div>
                <div className={'settingsDebugValue'}>{trialsCount}</div>
              </div>
              <div className={'settingsDebugItem'}>
                <div className={'settingsDebugLabel'}>Ruins</div>
                <div className={'settingsDebugValue'}>{ruinsCount}</div>
              </div>
            </div>

            <div className={'settingsDebugPools'}>
              <div className={'settingsDebugLabel'}>Pavilion Pools (Cities 1-5)</div>
              {cities
                .filter((city) => city.index <= 4)
                .map((city) => {
                  const pavilion = pavilionsById[city.refs.pavilionId];
                  const pools = pavilion?.poolByPath ?? { heaven: [], earth: [], martial: [] };
                  return (
                    <div key={city.id} className={'settingsDebugPoolRow'}>
                      <div className={'settingsDebugPoolCity'}>
                        City {city.index + 1}: {city.name}
                      </div>
                      <div className={'settingsDebugPoolCounts'}>
                        <span>H: {pools.heaven?.length ?? 0}</span>
                        <span>E: {pools.earth?.length ?? 0}</span>
                        <span>M: {pools.martial?.length ?? 0}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className={'settingsScreenModalOverlay'}>
          <div className={'settingsScreenModalCard'}>
            <h3 className={'settingsScreenModalTitle'}>Delete All Save Data?</h3>
            <p className={'settingsScreenModalText'}>
              This will delete all save data, including AP, upgrades, auras, items, and progress. This cannot be undone.
            </p>
            <div className={'settingsScreenModalActions'}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`${'button-standard'} ${'settingsScreenModalButton'} ${'settingsScreenModalCancel'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSave}
                className={`${'button-standard'} ${'settingsScreenModalButton'} ${'settingsScreenModalConfirm'}`}
              >
                Delete &amp; Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
