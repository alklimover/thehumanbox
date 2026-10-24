import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Modal } from './Modal'
import { askConfirm } from '../../shared/confirm'
import { ToolSprite } from '../toolbar/ToolSprite'
import { useUIStore, useViewFlag } from '../../state/store'
import { startTour, isTourSupported } from '../tour/tour'
import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { useSimulationData } from '../../simulation/simulationData'
import { LOW_PERF } from '../../shared/perf'
import { readLowPerf, toggleLowPerf } from '../../shared/perf-mode'
import { PopulationLoadSlider } from '../../fork/PopulationLoad'
import { getDesktop } from '../../shared/desktop'
import type { DesktopBridge, DesktopSettings, SimStatus, UpdateCheckResult } from '../../shared/desktop'
import {
  getWorldSource,
  OWN_WORLD_ID,
  requestOwnWorldCheckpoint,
  requestOwnWorldRecovery,
  requestOwnWorldReset,
} from '../../simulation/worldSource'
import { deleteWorld, listRecoveryWorlds, loadWorld, type RecoveryWorld } from '../../simulation/wasmDb'
import { DESKTOP_PAUSE_WHEN_HIDDEN_EVENT } from '../../shared/desktopVisibility'
import { fmtNumber, t, tn, type MessageKey } from '../../i18n'
import { localeTag } from '../../i18n/locale'
import { LanguageSwitch } from './LanguageSwitch'
import { WorldsSection } from '../../fork/WorldsSection'
import { ModeSetting } from '../../fork/modes/ModeSetting'
import { WatchSection } from '../../fork/chronicle/WatchSection'

interface Props {
  onClose: () => void
}

function WorldSourceSection() {
  const source = getWorldSource()
  const [recoveries, setRecoveries] = useState<RecoveryWorld[]>([])
  const [storageMessage, setStorageMessage] = useState<string | null>(null)
  const [storageBusy, setStorageBusy] = useState(false)

  useEffect(() => {
    if (source !== 'wasm') return
    void listRecoveryWorlds(OWN_WORLD_ID)
      .then(setRecoveries)
      .catch((error) => setStorageMessage(t('settings.recovery.listFailed', { error: String(error) })))
  }, [source])

  async function exportSavedWorld(id: string, label: string) {
    setStorageBusy(true)
    setStorageMessage(null)
    try {
      if (id === OWN_WORLD_ID && !(await requestOwnWorldCheckpoint())) {
        throw new Error(t('settings.export.checkpointFailed'))
      }
      const saved = await loadWorld(id)
      if (!saved) throw new Error(t('settings.export.missing'))
      const bytes = new Uint8Array(saved.blob).buffer
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `thehumanbox-${label}-tick-${saved.tick}.world.save`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStorageMessage(t('settings.export.done', { tick: saved.tick }))
    } catch (error) {
      setStorageMessage(t('settings.export.failed', { error: errorText(error) }))
    } finally {
      setStorageBusy(false)
    }
  }

  async function confirmReset() {
    const confirmed = await askConfirm({
      title: t('settings.reset.title'),
      body: t('settings.reset.body'),
      confirmLabel: t('settings.reset.confirm'),
    })
    if (confirmed) requestOwnWorldReset()
  }

  return (
    <Section title={t('settings.play.title')}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="lang-btn active">{t('settings.play.browserWorld')}</span>
        {source === 'wasm' && (
          <>
            <button
              className="lang-btn"
              disabled={storageBusy}
              onClick={() => void exportSavedWorld(OWN_WORLD_ID, 'my-world')}
            >
              {t('settings.play.exportSave')}
            </button>
            <button className="lang-btn" disabled={storageBusy} onClick={confirmReset}>
              {t('settings.play.startNew')}
            </button>
          </>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--dialog-muted)', marginTop: 10, lineHeight: 1.6 }}>
        {t('settings.play.intro')}
      </div>
      {source === 'wasm' && recoveries.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('settings.recovery.title')}
          </div>
          <div style={{ fontSize: 10, color: '#666', margin: '5px 0 7px', lineHeight: 1.45 }}>
            {t('settings.recovery.intro')}
          </div>
          {recoveries.slice(0, 8).map((recovery) => (
            <div
              key={recovery.id}
              style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}
            >
              <span style={{ flex: 1, minWidth: 160, fontSize: 10, color: '#bfae90' }}>
                {t('settings.recovery.item', {
                  tick: recovery.tick,
                  date: new Date(recovery.savedAt).toLocaleString(localeTag()),
                  size: fmtNumber(recovery.bytes / 1024 / 1024, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    useGrouping: false,
                  }),
                })}
              </span>
              <button
                className="lang-btn"
                disabled={storageBusy}
                onClick={() => void exportSavedWorld(recovery.id, 'recovery')}
              >
                {t('settings.recovery.export')}
              </button>
              <button
                className="lang-btn"
                disabled={storageBusy}
                onClick={async () => {
                  const confirmed = await askConfirm({
                    title: t('settings.recovery.restoreTitle'),
                    body: t('settings.recovery.restoreBody', { tick: recovery.tick }),
                    confirmLabel: t('settings.recovery.restoreConfirm'),
                  })
                  if (confirmed) requestOwnWorldRecovery(recovery.id)
                }}
              >
                {t('settings.recovery.restore')}
              </button>
              <button
                className="lang-btn"
                disabled={storageBusy}
                onClick={async () => {
                  const confirmed = await askConfirm({
                    title: t('settings.recovery.deleteTitle'),
                    body: t('settings.recovery.deleteBody', { tick: recovery.tick }),
                    confirmLabel: t('settings.recovery.deleteConfirm'),
                    danger: true,
                  })
                  if (!confirmed) return
                  setStorageBusy(true)
                  try {
                    await deleteWorld(recovery.id)
                    setRecoveries((items) => items.filter((item) => item.id !== recovery.id))
                    setStorageMessage(t('settings.recovery.deleted'))
                  } catch (error) {
                    setStorageMessage(t('settings.recovery.deleteFailed', { error: errorText(error) }))
                  } finally {
                    setStorageBusy(false)
                  }
                }}
              >
                {t('settings.recovery.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
      {storageMessage && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#bfae90', lineHeight: 1.45 }}>{storageMessage}</div>
      )}
    </Section>
  )
}

const POPULATION_CAP_PRESETS: ReadonlyArray<readonly [number, MessageKey]> = [
  [350, 'settings.sim.preset.light'],
  [500, 'settings.sim.preset.recommended'],
  [1000, 'settings.sim.preset.ambitious'],
  [2000, 'settings.sim.preset.experimental'],
]

type TabId = 'world' | 'display' | 'access' | 'performance' | 'help' | 'simulation' | 'app'

const WEB_TABS: ReadonlyArray<{ id: TabId; label: MessageKey; icon: string }> = [
  { id: 'world', label: 'settings.tab.world', icon: '🗺️' },
  { id: 'display', label: 'settings.tab.display', icon: '☀️' },
  { id: 'access', label: 'settings.tab.access', icon: '✨' },
  { id: 'performance', label: 'settings.tab.performance', icon: '🐢' },
  { id: 'help', label: 'settings.tab.help', icon: '📖' },
]

const DESKTOP_TABS: ReadonlyArray<{ id: TabId; label: MessageKey; icon: string }> = [
  { id: 'simulation', label: 'settings.tab.simulation', icon: '⏱️' },
  { id: 'app', label: 'settings.tab.app', icon: '⚙️' },
]

/** Preferences that apply in both the web game and the desktop app. */
function DisplayTab() {
  const setViewFlag = useUIStore((s) => s.setViewFlag)
  const photoMode = useViewFlag('photoMode')
  const headlineTicker = useViewFlag('headlineTicker')
  const randomTour = useViewFlag('randomTour')
  return (
    <>
      <SettingRow title={t('settings.language.title')} desc={t('settings.language.desc')}>
        <LanguageSwitch />
      </SettingRow>
      <SettingRow title={t('settings.photo.title')} desc={t('settings.photo.desc')}>
        <Switch
          checked={!!photoMode}
          onChange={(v) => setViewFlag('photoMode', v)}
          label={t('settings.photo.title')}
        />
      </SettingRow>
      <SettingRow title={t('settings.ticker.title')} desc={t('settings.ticker.desc')}>
        <Switch
          checked={!!headlineTicker}
          onChange={(v) => setViewFlag('headlineTicker', v)}
          label={t('settings.ticker.title')}
        />
      </SettingRow>
      <SettingRow title={t('settings.follow.title')} desc={t('settings.follow.desc')}>
        <Switch
          checked={!!randomTour}
          onChange={(v) => setViewFlag('randomTour', v)}
          label={t('settings.follow.title')}
        />
      </SettingRow>
    </>
  )
}

function AccessibilityTab() {
  const setViewFlag = useUIStore((s) => s.setViewFlag)
  const colorBlind = useViewFlag('colorBlind')
  return (
    <SettingRow title={t('settings.colorBlind.title')} desc={t('settings.colorBlind.desc')}>
      <Switch
        checked={!!colorBlind}
        onChange={(v) => setViewFlag('colorBlind', v)}
        label={t('settings.colorBlind.title')}
      />
    </SettingRow>
  )
}

function PerformanceTab() {
  const chosen = readLowPerf()
  const automatic = LOW_PERF && !chosen
  return (
    <SettingRow
      title={t('settings.lowPerf.title')}
      desc={automatic ? t('settings.lowPerf.descAuto') : t('settings.lowPerf.desc')}
    >
      <Switch
        checked={LOW_PERF}
        onChange={() => toggleLowPerf()}
        label={t('settings.lowPerf.title')}
        disabled={automatic}
      />
    </SettingRow>
  )
}

function HelpTab({ onClose }: { onClose: () => void }) {
  const openAbout = useUIStore((s) => s.openAbout)
  const nerdStats = useUIStore((s) => s.nerdStats)
  const setNerdStats = useUIStore((s) => s.setNerdStats)
  const { playerWorldKind } = useSimulationData()
  const isMobile = useIsMobile()
  return (
    <>
      {!isMobile && isTourSupported() && (
        <SettingRow title={t('settings.tour.title')} desc={t('settings.tour.desc')}>
          <button
            className="lang-btn"
            onClick={() => {
              onClose()
              startTour(playerWorldKind)
            }}
          >
            {t('settings.tour.start')}
          </button>
        </SettingRow>
      )}
      <SettingRow title={t('settings.about.title')} desc={t('settings.about.desc')}>
        <button
          className="lang-btn"
          onClick={() => {
            onClose()
            openAbout()
          }}
        >
          {t('settings.about.open')}
        </button>
      </SettingRow>
      <SettingRow title={t('settings.nerdStats.title')} desc={t('settings.nerdStats.desc')}>
        <Switch checked={!!nerdStats} onChange={setNerdStats} label={t('settings.nerdStats.title')} />
      </SettingRow>
    </>
  )
}

export function DesktopSettingsModal({ onClose }: Props) {
  const desktop = getDesktop()
  const [tab, setTab] = useState<TabId>('world')
  const [settings, setSettings] = useState<DesktopSettings | null>(null)
  const [status, setStatus] = useState<SimStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    if (!desktop) return
    let cancelled = false
    setLoadError(null)
    desktop.settings
      .get()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded)
      })
      .catch((error) => {
        if (!cancelled) setLoadError(t('settings.loadFailed', { error: errorText(error) }))
      })
    // The status line is informational; failing to read it must not block the tab.
    desktop.sim
      .status()
      .then((next) => {
        if (!cancelled) setStatus(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [desktop, loadAttempt])

  const update = (patch: Partial<DesktopSettings>) => setSettings((s) => (s ? { ...s, ...patch } : s))

  async function save() {
    if (!settings || !desktop) return
    setBusy(true)
    setActionError(null)
    try {
      const saved = await desktop.settings.set(settings)
      setSettings(saved)
      window.dispatchEvent(
        new CustomEvent(DESKTOP_PAUSE_WHEN_HIDDEN_EVENT, { detail: saved.pauseWhenHidden }),
      )
      setSavedAt(Date.now())
      // Persisted already; only the OS login-item update can still fail.
      try {
        await desktop.app.applyAutoLaunch()
      } catch (error) {
        setActionError(t('settings.footer.launchFailed', { error: errorText(error) }))
      }
    } catch (error) {
      setSavedAt(null)
      setActionError(t('settings.footer.saveFailed', { error: errorText(error) }))
    } finally {
      setBusy(false)
    }
  }

  async function restart() {
    if (!settings || !desktop) return
    setBusy(true)
    setStatus(null)
    setActionError(null)
    try {
      let saved: DesktopSettings
      try {
        saved = await desktop.settings.set(settings)
      } catch (error) {
        setActionError(t('settings.footer.saveFailed', { error: errorText(error) }))
        return
      }
      window.dispatchEvent(
        new CustomEvent(DESKTOP_PAUSE_WHEN_HIDDEN_EVENT, { detail: saved.pauseWhenHidden }),
      )
      const next = await desktop.sim.restart()
      setStatus(next)
      setSavedAt(Date.now())
    } catch (error) {
      setSavedAt(null)
      setActionError(t('settings.sim.restartFailed', { error: errorText(error) }))
      // The restart may have left the sim stopped or still running; show the truth.
      desktop.sim
        .status()
        .then(setStatus)
        .catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  async function migrateSaveFolder(targetDir: string | null) {
    if (!desktop || !settings) return
    setActionError(null)
    const target = targetDir ?? t('settings.saveFolder.defaultTarget')
    const confirmed = await askConfirm({
      title: t('settings.saveFolder.confirmTitle'),
      body: t('settings.saveFolder.confirmBody', { target }),
      confirmLabel: t('settings.saveFolder.confirm'),
    })
    if (!confirmed) return
    setBusy(true)
    setSafetyMessage(t('settings.saveFolder.moving'))
    try {
      const result = await desktop.world.migrateDataRoot({ targetDir })
      setSettings(result.settings)
      setSafetyMessage(
        !result.migrated
          ? t('settings.saveFolder.alreadyActive')
          : result.previousFolderKept
            ? t('settings.saveFolder.moved', { folder: result.previousFolderKept })
            : t('settings.saveFolder.movedOldPlace'),
      )
    } catch (error) {
      setSafetyMessage(t('settings.saveFolder.moveFailed', { error: errorText(error) }))
    } finally {
      setBusy(false)
    }
  }

  // Fire-and-forget desktop tools. Their rejections used to escape as
  // unhandled promises and vanish; surface the failure instead.
  function runDesktopTool(failure: MessageKey, action: () => Promise<unknown>): void {
    setActionError(null)
    action().catch((error) => setActionError(t(failure, { error: errorText(error) })))
  }

  async function exportDesktopWorld() {
    if (!desktop) return
    setActionError(null)
    setSafetyMessage(t('settings.world.exporting'))
    try {
      const result = await desktop.world.exportActive()
      setSafetyMessage(
        result.exported
          ? t('settings.world.exported', { path: String(result.filePath) })
          : t('settings.world.exportCancelled'),
      )
    } catch (error) {
      setSafetyMessage(t('settings.export.failed', { error: errorText(error) }))
    }
  }

  async function resetDesktopWorld() {
    if (!desktop) return
    setActionError(null)
    setSafetyMessage(null)
    setBusy(true)
    try {
      const result = await desktop.world.resetLocal()
      setSafetyMessage(result.reset ? t('settings.world.newDone') : t('settings.world.newCancelled'))
    } catch (error) {
      setSafetyMessage(t('settings.world.newFailed', { error: errorText(error) }))
    } finally {
      setBusy(false)
    }
  }

  const tabs = desktop ? [...WEB_TABS.slice(0, 1), ...DESKTOP_TABS, ...WEB_TABS.slice(1)] : WEB_TABS
  const desktopTab = tab === 'simulation' || tab === 'app'
  const justSaved = savedAt && Date.now() - savedAt < 2500

  return (
    <Modal open onClose={onClose} className="settings-modal" title={t('settings.title')} hideTitle>
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('settings.heading')}</span>
        {desktop && (
          <span className="tree-modal-sub">
            v{desktop.appVersion} · {desktop.platform}
          </span>
        )}
        <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="settings-layout">
        <nav className="settings-tabs" aria-label={t('settings.tabsLabel')}>
          {tabs.map((item) => (
            <button
              key={item.id}
              className={clsx('settings-tab', tab === item.id && 'active')}
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              <ToolSprite icon={item.icon} size={16} />
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>
        <div className="settings-pane">
          {tab === 'world' && <ModeSetting />}
          {tab === 'world' &&
            (desktop ? (
              <Section title={t('settings.world.title')}>
                <SettingRow title={t('settings.world.exportTitle')} desc={t('settings.world.exportDesc')}>
                  <button className="lang-btn" onClick={() => void exportDesktopWorld()} disabled={busy}>
                    {t('settings.world.exportButton')}
                  </button>
                </SettingRow>
                {!desktop.forkWorlds && (
                  <SettingRow title={t('settings.world.newTitle')} desc={t('settings.world.newDesc')}>
                    <button
                      className="lang-btn danger"
                      onClick={() => void resetDesktopWorld()}
                      disabled={busy}
                    >
                      {t('settings.world.newButton')}
                    </button>
                  </SettingRow>
                )}
                {safetyMessage && <div className="settings-note">{safetyMessage}</div>}
                {desktop.forkWorlds && <WorldsSection desktop={desktop} />}
                <WatchSection />
              </Section>
            ) : (
              <WorldSourceSection />
            ))}
          {tab === 'display' && (
            <Section title={t('settings.display.title')}>
              <DisplayTab />
            </Section>
          )}
          {tab === 'access' && (
            <Section title={t('settings.access.title')}>
              <AccessibilityTab />
            </Section>
          )}
          {tab === 'performance' && (
            <Section title={t('settings.performance.title')}>
              <PerformanceTab />
            </Section>
          )}
          {tab === 'help' && (
            <Section title={t('settings.help.title')}>
              <HelpTab onClose={onClose} />
            </Section>
          )}

          {desktopTab && desktop && !settings && !loadError && (
            <div className="settings-note">{t('settings.loading')}</div>
          )}
          {desktopTab && desktop && !settings && loadError && (
            <div className="settings-note" role="alert">
              {loadError}{' '}
              <button className="lang-btn" onClick={() => setLoadAttempt((n) => n + 1)}>
                {t('settings.retry')}
              </button>
            </div>
          )}
          {desktopTab && desktop && settings && (
            <>
              {tab === 'simulation' && (
                <Section title={t('settings.sim.title')}>
                  <SettingRow
                    title={t('settings.sim.processTitle')}
                    desc={
                      status
                        ? status.running
                          ? t('settings.sim.running', { port: String(status.port) })
                          : t('settings.sim.stopped')
                        : t('settings.sim.native')
                    }
                  >
                    <button className="lang-btn" onClick={restart} disabled={busy}>
                      {busy ? t('settings.sim.restarting') : t('settings.sim.restart')}
                    </button>
                  </SettingRow>
                  {status?.error && <div className="settings-note error">{status.error}</div>}
                  <Field label={t('settings.sim.tickInterval', { ms: String(settings.tickMs) })}>
                    <input
                      type="range"
                      min={30}
                      max={2000}
                      step={10}
                      value={settings.tickMs}
                      onChange={(e) => update({ tickMs: parseInt(e.target.value, 10) })}
                      style={{ width: '100%' }}
                    />
                    <div className="settings-note">{t('settings.sim.tickNote')}</div>
                  </Field>
                  <Field label={tn('settings.sim.capacity', settings.populationCap)}>
                    <PopulationLoadSlider
                      desktop={desktop}
                      min={120}
                      max={5000}
                      step={20}
                      value={settings.populationCap}
                      onChange={(populationCap) => update({ populationCap })}
                      tickMs={settings.tickMs}
                    />
                    <div
                      className="desktop-cap-presets"
                      role="group"
                      aria-label={t('settings.sim.capacityPresets')}
                    >
                      {POPULATION_CAP_PRESETS.map(([cap, label]) => (
                        <button
                          key={cap}
                          type="button"
                          className={settings.populationCap === cap ? 'active' : ''}
                          onClick={() => update({ populationCap: cap })}
                        >
                          {fmtNumber(cap)} · {t(label)}
                        </button>
                      ))}
                    </div>
                    <div className="settings-note">{t('settings.sim.capacityNote')}</div>
                  </Field>
                </Section>
              )}
              {tab === 'app' && (
                <>
                  <Section title={t('settings.updates.title')}>
                    <SettingRow title={t('settings.updates.autoTitle')} desc={t('settings.updates.autoDesc')}>
                      <Switch
                        checked={settings.autoUpdate}
                        onChange={(v) => update({ autoUpdate: v })}
                        label={t('settings.updates.autoTitle')}
                      />
                    </SettingRow>
                    <UpdateCheckButton desktop={desktop} />
                  </Section>
                  <Section title={t('settings.startup.title')}>
                    <SettingRow
                      title={t('settings.startup.launchTitle')}
                      desc={t('settings.startup.launchDesc')}
                    >
                      <Switch
                        checked={settings.autoLaunch}
                        onChange={(v) => update({ autoLaunch: v })}
                        label={t('settings.startup.launchTitle')}
                      />
                    </SettingRow>
                    <SettingRow
                      title={t('settings.startup.hiddenTitle')}
                      desc={t('settings.startup.hiddenDesc')}
                    >
                      <Switch
                        checked={settings.startMinimized}
                        onChange={(v) => update({ startMinimized: v })}
                        label={t('settings.startup.hiddenTitle')}
                      />
                    </SettingRow>
                    <SettingRow
                      title={t('settings.startup.pauseTitle')}
                      desc={t('settings.startup.pauseDesc')}
                    >
                      <Switch
                        checked={settings.pauseWhenHidden}
                        onChange={(v) => update({ pauseWhenHidden: v })}
                        label={t('settings.startup.pauseTitle')}
                      />
                    </SettingRow>
                  </Section>
                  <Section title={t('settings.saveFolder.title')}>
                    <code className="settings-path">
                      {settings.saveLocationOverride ?? t('settings.saveFolder.default')}
                    </code>
                    <div className="settings-actions">
                      <button
                        className="lang-btn"
                        onClick={async () => {
                          setActionError(null)
                          setSafetyMessage(null)
                          let dir: string | null
                          try {
                            dir = await desktop.app.pickSaveDir()
                          } catch (error) {
                            setSafetyMessage(t('settings.saveFolder.pickFailed', { error: errorText(error) }))
                            return
                          }
                          if (dir) await migrateSaveFolder(dir)
                        }}
                        disabled={busy}
                      >
                        {t('settings.saveFolder.move')}
                      </button>
                      {settings.saveLocationOverride && (
                        <button
                          className="lang-btn"
                          onClick={() => void migrateSaveFolder(null)}
                          disabled={busy}
                        >
                          {t('settings.saveFolder.moveBack')}
                        </button>
                      )}
                    </div>
                    <div className="settings-note">{t('settings.saveFolder.note')}</div>
                    {safetyMessage && <div className="settings-note">{safetyMessage}</div>}
                  </Section>
                  <Section title={t('settings.tools.title')}>
                    <div className="settings-actions">
                      <button
                        className="lang-btn"
                        onClick={() =>
                          // captureScreenshot() resolves null instead of
                          // rejecting when the capture or its file write fails,
                          // so treat a null path as the failure too.
                          runDesktopTool('settings.tools.screenshotFailed', async () => {
                            if (!(await desktop.app.screenshot())) {
                              throw new Error(t('settings.tools.captureFailed'))
                            }
                          })
                        }
                      >
                        {t('settings.tools.screenshot')}
                      </button>
                      <button
                        className="lang-btn"
                        onClick={() =>
                          runDesktopTool('settings.tools.openWorldsFailed', () => desktop.app.openWorlds())
                        }
                      >
                        {t('settings.tools.openWorlds')}
                      </button>
                      <button
                        className="lang-btn"
                        onClick={() =>
                          runDesktopTool('settings.tools.openLogsFailed', () => desktop.app.openLogs())
                        }
                      >
                        {t('settings.tools.openLogs')}
                      </button>
                    </div>
                  </Section>
                </>
              )}
              <div className="settings-footer">
                <button className="lang-btn active" onClick={save} disabled={busy}>
                  {busy ? t('settings.footer.saving') : t('settings.footer.save')}
                </button>
                {justSaved && <span className="settings-saved">{t('settings.footer.saved')}</span>}
                {actionError && (
                  <span className="settings-note" role="alert">
                    {actionError}
                  </span>
                )}
                <span className="settings-note">{t('settings.footer.note')}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function updateCheckMessage(result: UpdateCheckResult | null): string {
  if (!result) return ''
  if (result.status === 'checking') return t('settings.updates.checking')
  if (result.status === 'available')
    return result.version
      ? t('settings.updates.availableVersion', { version: result.version })
      : t('settings.updates.available')
  if (result.status === 'downloaded')
    return result.version
      ? t('settings.updates.readyVersion', { version: result.version })
      : t('settings.updates.ready')
  if (result.status === 'up-to-date') return t('settings.updates.upToDate')
  if (result.status === 'unsupported') return result.message ?? t('settings.updates.unsupported')
  return result.message ?? t('settings.updates.failed')
}

function UpdateCheckButton({ desktop }: { desktop: DesktopBridge }) {
  const [result, setResult] = useState<UpdateCheckResult | null>(null)
  const [checking, setChecking] = useState(false)

  async function check() {
    setChecking(true)
    setResult({ status: 'checking' })
    try {
      setResult(await desktop.app.checkForUpdates())
    } catch (error) {
      // Without this the "checking..." message stayed up forever and the
      // rejection was dropped as an unhandled promise.
      setResult({ status: 'error', message: t('settings.updates.checkFailed', { error: errorText(error) }) })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
      <button className="lang-btn" onClick={check} disabled={checking}>
        {checking ? t('settings.updates.checking') : t('settings.updates.check')}
      </button>
      {result && (
        <span
          style={{
            color: result.status === 'error' ? '#e85040' : '#888',
            fontSize: 11,
          }}
        >
          {updateCheckMessage(result)}
        </span>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      {children}
    </section>
  )
}

function SettingRow({
  title,
  desc,
  beta,
  children,
}: {
  title: string
  desc: string
  beta?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-title">
          {title}
          {beta && <span className="settings-beta">{t('settings.beta')}</span>}
        </div>
        <div className="settings-row-desc">{desc}</div>
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
  onHover,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
  onHover?: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={clsx('px-switch', checked && 'on')}
      onClick={() => onChange(!checked)}
      onMouseEnter={onHover}
      onFocus={onHover}
    >
      <span className="px-switch-knob" />
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="settings-field">
      <div className="settings-field-label">{label}</div>
      {children}
    </div>
  )
}
