import { useEffect, useState } from 'react';
import { SaveService } from '../../services/save/SaveService.js';
import { useContentStore } from '../../stores/contentStore.js';
import { getContentBaseUrl } from '../../content/index.js';
import { RewardService } from '../../services/rewards/index.js';
import { buildMegaRewardBundle } from '../../debug/buildMegaRewardBundle.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useRewardsLogStore } from '../../stores/rewardsLogStore.js';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
import { SystemStatusPanel } from '../SystemStatusPanel.js';
import { useTelemetryStore } from '../../stores/telemetryStore.js';
import { useErrorLogStore } from '../../stores/errorLogStore.js';
import { AudioDebugPanel } from '../../ui/debug/AudioDebugPanel.js';
import { StoryLogPanel } from '../../features/story/StoryLogPanel.js';
import { buildDiagnosticsBundle, type DiagnosticsBundleV1 } from '../../services/diagnostics/buildDiagnosticsBundle.js';
import {
  buildBalanceTelemetryCsvFiles,
  buildBalanceTelemetryExportEnvelope,
  serializeBalanceTelemetryExport,
  summarizeBalanceTelemetryReport,
} from '../../services/diagnostics/balanceTelemetryExport.js';
import {
  applySafeRepairs,
  runRuntimeValidation,
  type ValidationIssue,
} from '../../services/diagnostics/runValidation.js';
import './SettingsScreen.scss';

function downloadJson(filename: string, data: unknown) {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('[Diagnostics] Failed to download JSON', error);
  }
}

async function copyToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function formatDiagnosticsSummary(bundle: DiagnosticsBundleV1): string {
  const parts: string[] = [];
  parts.push(`Timestamp: ${new Date(bundle.createdAt).toISOString()}`);
  parts.push(`App: ${bundle.app.name} v${bundle.app.version} (${bundle.app.mode})`);
  parts.push(`Last save: ${bundle.save.lastSaveAt ? new Date(bundle.save.lastSaveAt).toISOString() : 'unknown'}`);
  const activity = bundle.status.activity as { type?: string } | null;
  parts.push(`Activity: ${activity?.type ?? 'none'}`);
  const combatLabel = bundle.status.combat?.inCombat
    ? `active (${bundle.status.combat.type ?? 'unknown'})`
    : 'idle';
  parts.push(`Combat: ${combatLabel}`);
  parts.push(`Telemetry: events=${bundle.telemetry.recentEvents.length} errors=${bundle.telemetry.recentErrors.length}`);
  parts.push(`Balance telemetry: events=${bundle.telemetry.recentBalanceEvents.length} capture=${bundle.telemetry.balanceCaptureEnabled ? 'on' : 'off'}`);
  parts.push(`Validation: ${bundle.validation.errorCount} errors, ${bundle.validation.warningCount} warnings`);
  if (bundle.errors && bundle.errors.length > 0) {
    parts.push(`Bundle warnings: ${bundle.errors.join('; ')}`);
  }
  return parts.join('\n');
}

export function SettingsScreen() {
  const showOfflineModal = useUIStore((state) => state.settings.showOfflineModal);
  const showCombatLog = useUIStore((state) => state.settings.showCombatLog);
  const showCombatMinibar = useUIStore((state) => state.settings.showCombatMinibar);
  const combatMinibarExpanded = useUIStore((state) => state.settings.combatMinibarExpanded);
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);
  const showSystemStatusPanel = useUIStore((state) => state.settings.showSystemStatusPanel);
  const storyMotionMode = useUIStore((state) => state.settings.storyMotionMode);
  const setSettings = useUIStore((state) => state.setSettings);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const addNotification = useUIStore((state) => state.addNotification);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const contentIsLoaded = useContentStore((state) => state.isLoaded);
  const contentIsLoading = useContentStore((state) => state.isLoading);
  const contentError = useContentStore((state) => state.error);
  const cities = useContentStore((state) => state.citiesSorted);
  const techniquesByPath = useContentStore((state) => state.techniquesByPath);
  const itemsCount = useContentStore((state) => Object.keys(state.maps.itemsById).length);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const techniquesCount = useContentStore((state) => Object.keys(state.maps.techniquesById).length);
  const pavilionsById = useContentStore((state) => state.maps.pavilionsById);
  const outskirtsCount = useContentStore((state) => Object.keys(state.maps.outskirtsById).length);
  const enemiesCount = useContentStore((state) => Object.keys(state.maps.enemiesById).length);
  const trialsCount = useContentStore((state) => Object.keys(state.maps.trialsById).length);
  const ruinsCount = useContentStore((state) => Object.keys(state.maps.ruinsById).length);
  const pavilionsCount = useContentStore((state) => Object.keys(state.maps.pavilionsById).length);
  const telemetryEvents = useTelemetryStore((state) => state.events);
  const clearTelemetry = useTelemetryStore((state) => state.clear);
  const balanceTelemetryEvents = useTelemetryStore((state) => state.balanceEvents);
  const clearBalanceTelemetry = useTelemetryStore((state) => state.clearBalanceEvents);
  const balanceCaptureEnabled = useTelemetryStore((state) => state.balanceCaptureEnabled);
  const setBalanceCaptureEnabled = useTelemetryStore((state) => state.setBalanceCaptureEnabled);
  const maxBalanceEvents = useTelemetryStore((state) => state.maxBalanceEvents);
  const errorEntries = useErrorLogStore((state) => state.errors);
  const clearErrors = useErrorLogStore((state) => state.clear);
  const isDev = import.meta.env.DEV;

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationRanAt, setValidationRanAt] = useState<number | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [repairNotes, setRepairNotes] = useState<string[]>([]);
  const [repairedCount, setRepairedCount] = useState<number | null>(null);

  const rewardLogEntries = useRewardsLogStore((state) => state.entries);
  const clearRewardLog = useRewardsLogStore((state) => state.clear);
  const unlockRandomTechnique = useManualSatchelStore((state) => state.unlockRandomTechnique);

  const toggleOfflineModal = () => setSettings({ showOfflineModal: !showOfflineModal });
  const toggleCombatLog = () => setSettings({ showCombatLog: !showCombatLog });
  const toggleCombatMinibar = () => setSettings({ showCombatMinibar: !showCombatMinibar });
  const toggleCombatMinibarExpanded = () =>
    setSettings({ combatMinibarExpanded: !combatMinibarExpanded });
  const togglePrestigeConfirm = () =>
    setSettings({ requirePrestigeConfirm: !requirePrestigeConfirm });
  const toggleSystemStatus = () => setSettings({ showSystemStatusPanel: !showSystemStatusPanel });
  const setStoryMotionMode = (mode: typeof storyMotionMode) => setSettings({ storyMotionMode: mode });

  const handleDeleteSave = () => {
    setShowDeleteModal(false);
    SaveService.deleteSaveAndHardReset();
  };

  const handleTestGrantRewards = () => {
    if (!import.meta.env.DEV) return;
    const confirmed = window.confirm('Grant large amounts of ALL rewards?');
    if (!confirmed) return;
    const bundle = buildMegaRewardBundle();
    const result = RewardService.grantRewards(bundle, 'debug:mega_grant');
    console.log('[Rewards] Test Grant Rewards result', result);
  };

  const handleUnlockRandomManual = () => {
    if (!contentIsLoaded) {
      addNotification('warning', 'Manuals are not available yet.', 3000);
      return;
    }
    const unlockedTechId = unlockRandomTechnique();
    if (!unlockedTechId) {
      addNotification('info', 'No eligible techniques to unlock right now.', 3000);
      return;
    }
    const techName = techniquesById[unlockedTechId]?.name ?? unlockedTechId;
    addNotification('success', `Insight gained — ${techName} mastered.`, 3000);
  };

  const handleCopyTelemetry = () => {
    const slice = telemetryEvents.slice(0, 30);
    const text = JSON.stringify(slice, null, 2);
    void copyToClipboard(text).catch((error) => {
      console.warn('[Diagnostics] Failed to copy telemetry', error);
    });
  };

  const handleCopyErrors = () => {
    const slice = errorEntries.slice(0, 30);
    const text = JSON.stringify(slice, null, 2);
    void copyToClipboard(text).catch((error) => {
      console.warn('[Diagnostics] Failed to copy errors', error);
    });
  };

  const buildBalanceEnvelope = () => buildBalanceTelemetryExportEnvelope({
    events: balanceTelemetryEvents.map((entry) => entry.payload),
    balanceCaptureEnabled,
    maxBalanceEvents,
    app: {
      name: 'cultivation-idle',
      version: import.meta.env?.VITE_APP_VERSION ?? 'unknown',
      mode: import.meta.env?.MODE ?? 'unknown',
    },
  });

  const handleDownloadBalanceTelemetry = () => {
    try {
      const envelope = buildBalanceEnvelope();
      downloadJson(`cultivation_balance_telemetry_${new Date(envelope.exportedAt).toISOString()}.json`, envelope);
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Failed to download balance telemetry: ${String(error)}`);
    }
  };

  const handleCopyBalanceSummary = () => {
    try {
      const summary = summarizeBalanceTelemetryReport(buildBalanceEnvelope().summary);
      void copyToClipboard(summary);
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Failed to copy balance summary: ${String(error)}`);
    }
  };

  const handleCopyBalanceEventsJson = () => {
    try {
      const text = serializeBalanceTelemetryExport(buildBalanceEnvelope());
      void copyToClipboard(text);
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Failed to copy balance telemetry JSON: ${String(error)}`);
    }
  };

  const handleDownloadBalanceCsv = () => {
    try {
      const csvMap = buildBalanceTelemetryCsvFiles(balanceTelemetryEvents.map((entry) => entry.payload));
      Object.entries(csvMap).forEach(([filename, csv]) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      });
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Failed to download balance CSV: ${String(error)}`);
    }
  };

  const handleDownloadDiagnostics = () => {
    try {
      const bundle = buildDiagnosticsBundle();
      downloadJson(`cultivation_diagnostics_${new Date(bundle.createdAt).toISOString()}.json`, bundle);
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Failed to build diagnostics: ${String(error)}`);
    }
  };

  const handleCopyQuickSummary = () => {
    try {
      const bundle = buildDiagnosticsBundle();
      const summary = formatDiagnosticsSummary(bundle);
      void copyToClipboard(summary).catch((error) => {
        console.warn('[Diagnostics] Failed to copy summary', error);
      });
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Failed to copy summary: ${String(error)}`);
    }
  };

  const handleRunValidation = () => {
    try {
      const issues = runRuntimeValidation();
      setValidationIssues(issues);
      setValidationRanAt(Date.now());
      setRepairedCount(null);
      setRepairNotes([]);
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Validation failed: ${String(error)}`);
    }
  };

  const handleApplyRepairs = () => {
    if (!window.confirm('Apply safe repairs to obvious issues?')) return;
    try {
      const result = applySafeRepairs(validationIssues);
      setRepairNotes(result.notes);
      setRepairedCount(result.repairedCount);
      const refreshed = runRuntimeValidation();
      setValidationIssues(refreshed);
      setValidationRanAt(Date.now());
      setDiagnosticsError(null);
    } catch (error) {
      setDiagnosticsError(`Repairs failed: ${String(error)}`);
    }
  };

  const handleGenerateTestError = () => {
    if (!window.confirm('Generate a test error to validate diagnostics?')) return;
    setTimeout(() => {
      throw new Error('Diagnostics test error');
    }, 0);
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
                  checked={showCombatMinibar}
                  onChange={toggleCombatMinibar}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Show combat minibar</div>
                  <p className={'settingsScreenOptionDescription'}>
                    Always display the compact combat overlay during fights and combat activities.
                  </p>
                </div>
              </label>

              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={combatMinibarExpanded}
                  onChange={toggleCombatMinibarExpanded}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Combat minibar expanded by default</div>
                  <p className={'settingsScreenOptionDescription'}>
                    Keep the minibar unfolded when it appears; collapse later if screen space is tight.
                  </p>
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

              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={showSystemStatusPanel}
                  onChange={toggleSystemStatus}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Show system status overlay (dev)</div>
                  <p className={'settingsScreenOptionDescription'}>
                    Display runtime diagnostics: activity, combat gating, saves, and queues.
                  </p>
                </div>
              </label>

              <label className={'settingsScreenOptionRow'}>
                <select
                  value={storyMotionMode}
                  onChange={(event) => setStoryMotionMode(event.target.value as typeof storyMotionMode)}
                  className={'settingsScreenSelect'}
                >
                  <option value="full">Story motion: full</option>
                  <option value="reduced">Story motion: reduced</option>
                  <option value="off">Story motion: off</option>
                </select>
                <div>
                  <div className={'settingsScreenOptionLabel'}>Story motion</div>
                  <p className={'settingsScreenOptionDescription'}>
                    Control parallax, shake, and moving particles in milestone story scenes.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <StoryLogPanel />
          </div>

          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <SystemStatusPanel />
          </div>

          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Rewards Debug</h2>
            <p className={'settingsScreenPanelSubtitle'}>Validate the central reward pipeline (currencies + items).</p>

            <div className={'settingsRewardsActions'}>
              <button
                onClick={handleTestGrantRewards}
                className={'button-standard settingsScreenDebugButton'}
                disabled={!contentIsLoaded || !import.meta.env.DEV}
              >
                Test Grant Rewards (Mega Bundle)
              </button>
              <button
                onClick={handleUnlockRandomManual}
                className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                disabled={!contentIsLoaded}
              >
                Unlock Random Technique (Studied)
              </button>
              <button
                onClick={clearRewardLog}
                className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                disabled={rewardLogEntries.length === 0}
              >
                Clear Reward Log
              </button>
            </div>

            <div className={'settingsRewardsLog'}>
              <div className={'settingsDebugLabel'}>Recent Grants</div>
              {rewardLogEntries.length === 0 ? (
                <div className={'settingsRewardsEmpty'}>No reward grants yet.</div>
              ) : (
                <div className={'settingsRewardsList'}>
                  {rewardLogEntries.slice(0, 6).map((entry) => (
                    <div key={entry.id} className={'settingsRewardsEntry'}>
                      <div className={'settingsRewardsEntryHeader'}>
                        <span className={'settingsRewardsEntryReason'}>{entry.reason}</span>
                        <span className={'settingsRewardsEntryTime'}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={'settingsRewardsEntrySummary'}>{entry.summary}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Diagnostics (Dev)</h2>
            <p className={'settingsScreenPanelSubtitle'}>Telemetry + error capture + diagnostics tools.</p>

            <div className={'settingsDiagnosticsActions'}>
              <button className={'button-standard settingsScreenDebugButton'} onClick={handleDownloadDiagnostics}>
                Download Diagnostics (.json)
              </button>
              <button className={'button-standard settingsScreenDebugButton'} onClick={handleCopyQuickSummary}>
                Copy Quick Summary
              </button>
            </div>

            <div className={'settingsDiagnosticsActions'}>
              <button className={'button-standard settingsScreenDebugButton'} onClick={handleRunValidation}>
                Run Validation
              </button>
              <button
                className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                onClick={handleApplyRepairs}
                disabled={validationIssues.length === 0}
              >
                Apply Safe Repairs
              </button>
            </div>

            {diagnosticsError ? <div className={'settingsDebugError'}>{diagnosticsError}</div> : null}

            <div className={'settingsDiagnosticsList'}>
              <div className={'settingsDiagnosticsRow'}>
                <div>
                  <div className={'settingsDebugLabel'}>Validation</div>
                  <div className={'settingsDiagnosticsMeta'}>
                    {validationRanAt ? `Last run: ${new Date(validationRanAt).toLocaleTimeString()}` : 'Not run yet'}
                  </div>
                </div>
                <div className={'settingsDiagnosticsMeta'}>
                  {validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'}
                </div>
              </div>

              {validationIssues.length === 0 ? (
                <div className={'settingsDiagnosticsEmpty'}>No validation issues detected yet.</div>
              ) : (
                <div className={'settingsDiagnosticsEntries'}>
                  {validationIssues.slice(0, 20).map((issue) => (
                    <div key={issue.id} className={'settingsDiagnosticsEntry settingsDiagnosticsIssue'}>
                      <div className={'settingsDiagnosticsRow'}>
                        <div>
                          <div className={'settingsDiagnosticsSeverity settingsDiagnosticsSeverity-' + issue.severity}>
                            {issue.severity.toUpperCase()}
                          </div>
                          <div className={'settingsDiagnosticsMeta'}>{issue.id}</div>
                        </div>
                        <div className={'settingsDiagnosticsSummary'}>{issue.message}</div>
                      </div>
                      {issue.hint ? <div className={'settingsDiagnosticsMeta'}>{issue.hint}</div> : null}
                    </div>
                  ))}
                </div>
              )}

              {repairedCount != null ? (
                <div className={'settingsDiagnosticsMeta'}>
                  Repairs applied: {repairedCount} {repairedCount === 1 ? 'change' : 'changes'}.
                  {repairNotes.length > 0 ? ` Notes: ${repairNotes.join('; ')}` : ''}
                </div>
              ) : null}
            </div>

            <div className={'settingsDiagnosticsList'}>
              <div className={'settingsDiagnosticsRow'}>
                <div>
                  <div className={'settingsDebugLabel'}>Balance Telemetry</div>
                  <div className={'settingsDiagnosticsMeta'}>
                    Showing {Math.min(10, balanceTelemetryEvents.length)} of {balanceTelemetryEvents.length} events
                  </div>
                </div>
                <div className={'settingsDiagnosticsActions'}>
                  <label className={'settingsScreenOptionRow'} style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={balanceCaptureEnabled}
                      onChange={(event) => setBalanceCaptureEnabled(event.target.checked)}
                      className={'settingsScreenCheckbox'}
                    />
                    <div>
                      <div className={'settingsScreenOptionLabel'}>Capture enabled</div>
                    </div>
                  </label>
                  <button
                    className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                    onClick={clearBalanceTelemetry}
                    disabled={balanceTelemetryEvents.length === 0}
                  >
                    Clear Balance Events
                  </button>
                  <button
                    className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                    onClick={handleCopyBalanceSummary}
                    disabled={balanceTelemetryEvents.length === 0}
                  >
                    Copy Balance Summary
                  </button>
                </div>
              </div>
              <div className={'settingsDiagnosticsActions'}>
                <button
                  className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                  onClick={handleDownloadBalanceTelemetry}
                  disabled={balanceTelemetryEvents.length === 0}
                >
                  Download Balance Telemetry (.json)
                </button>
                <button
                  className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                  onClick={handleDownloadBalanceCsv}
                  disabled={balanceTelemetryEvents.length === 0}
                >
                  Download Balance CSV
                </button>
                <button
                  className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                  onClick={handleCopyBalanceEventsJson}
                  disabled={balanceTelemetryEvents.length === 0}
                >
                  Copy Balance Events (JSON)
                </button>
              </div>
              {balanceTelemetryEvents.length > 0 ? (
                <div className={'settingsDiagnosticsEntries'}>
                  {balanceTelemetryEvents.slice(0, 10).map((entry) => (
                    <div key={entry.id} className={'settingsDiagnosticsEntry'}>
                      <div className={'settingsDiagnosticsRow'}>
                        <div>
                          <div className={'settingsDebugLabel'}>{entry.kind}</div>
                          <div className={'settingsDiagnosticsMeta'}>
                            {new Date(entry.ts).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className={'settingsDiagnosticsSummary'}>{entry.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={'settingsDiagnosticsEmpty'}>No balance telemetry events captured yet.</div>
              )}
            </div>

            <div className={'settingsDiagnosticsList'}>
              <div className={'settingsDiagnosticsRow'}>
                <div>
                  <div className={'settingsDebugLabel'}>Telemetry</div>
                  <div className={'settingsDiagnosticsMeta'}>
                    Showing {Math.min(15, telemetryEvents.length)} of {telemetryEvents.length} events
                  </div>
                </div>
                <div className={'settingsDiagnosticsActions'}>
                  <button
                    className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                    onClick={clearTelemetry}
                    disabled={telemetryEvents.length === 0}
                  >
                    Clear Events
                  </button>
                  <button
                    className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                    onClick={handleCopyTelemetry}
                    disabled={telemetryEvents.length === 0}
                  >
                    Copy Events (JSON)
                  </button>
                </div>
              </div>

              {telemetryEvents.length === 0 ? (
                <div className={'settingsDiagnosticsEmpty'}>No telemetry events captured yet.</div>
              ) : (
                <div className={'settingsDiagnosticsEntries'}>
                  {telemetryEvents.slice(0, 15).map((entry) => (
                    <div key={entry.id} className={'settingsDiagnosticsEntry'}>
                      <div className={'settingsDiagnosticsRow'}>
                        <div>
                          <div className={'settingsDebugLabel'}>{entry.type}</div>
                          <div className={'settingsDiagnosticsMeta'}>
                            {new Date(entry.ts).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className={'settingsDiagnosticsSummary'}>{entry.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={'settingsDiagnosticsList'}>
              <div className={'settingsDiagnosticsRow'}>
                <div>
                  <div className={'settingsDebugLabel'}>Errors</div>
                  <div className={'settingsDiagnosticsMeta'}>
                    Showing {Math.min(10, errorEntries.length)} of {errorEntries.length} errors
                  </div>
                </div>
                <div className={'settingsDiagnosticsActions'}>
                  <button
                    className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                    onClick={clearErrors}
                    disabled={errorEntries.length === 0}
                  >
                    Clear Errors
                  </button>
                  <button
                    className={'button-standard settingsScreenDebugButton settingsScreenDebugButtonSecondary'}
                    onClick={handleCopyErrors}
                    disabled={errorEntries.length === 0}
                  >
                    Copy Errors (JSON)
                  </button>
                </div>
              </div>

              {errorEntries.length === 0 ? (
                <div className={'settingsDiagnosticsEmpty'}>No captured errors.</div>
              ) : (
                <div className={'settingsDiagnosticsEntries'}>
                  {errorEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className={'settingsDiagnosticsEntry'}>
                      <div className={'settingsDiagnosticsRow'}>
                        <div>
                          <div className={'settingsDebugLabel'}>{entry.kind}</div>
                          <div className={'settingsDiagnosticsMeta'}>
                            {new Date(entry.ts).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className={'settingsDiagnosticsSummary'}>{entry.message}</div>
                      </div>
                      {entry.stack ? (
                        <div className={'settingsDiagnosticsCode'}>
                          {entry.stack.split('\n').slice(0, 2).join('\n')}
                        </div>
                      ) : null}
                      {entry.source ? (
                        <div className={'settingsDiagnosticsMeta'}>Source: {entry.source}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={'settingsDiagnosticsActions'}>
              <button className={'button-standard settingsScreenDebugButton'} onClick={handleGenerateTestError}>
                Generate Test Error
              </button>
            </div>
          </div>

          {isDev ? (
            <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
              <h2 className={'settingsScreenPanelTitle'}>Audio Debug (Dev)</h2>
              <p className={'settingsScreenPanelSubtitle'}>
                Trigger sound playback for any registered SoundId.
              </p>
              <AudioDebugPanel />
            </div>
          ) : null}

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
