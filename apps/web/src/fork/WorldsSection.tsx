// Fork: the player's worlds as save slots, in the desktop settings' world tab.
// The list and every operation live in the desktop shell
// (apps/desktop/main/fork-worlds.ts); opening or creating a world restarts the
// simulation and reloads this page, so success needs no message here.
import { useCallback, useEffect, useState } from 'react'
import { ft, ftn } from './i18n'
import type { DesktopBridge, WorldSlot } from '../shared/desktop'
import { PopulationLoadSlider } from './PopulationLoad'
import { worldFacts, worldTitle } from './worlds-text'
import { ROLE_ICONS, ROLES, useModeStore, type Role } from './modes/role'
import { ToolSprite } from '../ui/toolbar/ToolSprite'

type Worlds = NonNullable<DesktopBridge['forkWorlds']>

const CAP_MIN = 120
const CAP_MAX = 5000

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function WorldsSection({ desktop }: { desktop: DesktopBridge }) {
  const api = desktop.forkWorlds as Worlds
  const [list, setList] = useState<WorldSlot[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<{ hash: string; name: string } | null>(null)
  const [trashing, setTrashing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [seed, setSeed] = useState('')
  const [cap, setCap] = useState<number | null>(null)
  const [tickMs, setTickMs] = useState(100)
  // A new world is played the way this one is, unless the player picks the other.
  const [role, setRole] = useState<Role>(() => useModeStore.getState().role ?? 'observer')

  const run = useCallback(async (label: string | null, action: () => Promise<unknown>) => {
    setBusy(label ?? '')
    setMessage(label)
    try {
      await action()
      if (label) setMessage(null)
    } catch (error) {
      setMessage(ft('worlds.failed', { error: errorText(error) }))
    } finally {
      setBusy(null)
    }
  }, [])

  useEffect(() => {
    void run(null, async () => setList(await api.list()))
    desktop.settings
      .get()
      .then((s) => {
        setCap(s.populationCap)
        setTickMs(s.tickMs)
      })
      .catch(() => setCap(500))
  }, [api, desktop, run])

  return (
    <section className="settings-section fork-worlds">
      <h3 className="settings-section-title">{ft('worlds.title')}</h3>
      <div className="settings-note">{ft('worlds.note')}</div>
      {list === null && <div className="settings-note">{ft('worlds.loading')}</div>}
      {list?.length === 0 && <div className="settings-note">{ft('worlds.empty')}</div>}
      <ul className="fork-worlds-list">
        {list?.map((w) => (
          <li key={w.hash} className={'fork-worlds-row' + (w.live ? ' live' : '')}>
            <div className="fork-worlds-text">
              {renaming?.hash === w.hash ? (
                <input
                  className="fork-worlds-input"
                  autoFocus
                  maxLength={60}
                  value={renaming.name}
                  placeholder={ft('worlds.namePlaceholder')}
                  aria-label={ft('worlds.namePlaceholder')}
                  onChange={(e) => setRenaming({ hash: w.hash, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setRenaming(null)
                    if (e.key === 'Enter')
                      void run(null, async () => {
                        setList(await api.rename(w.hash, renaming.name))
                        setRenaming(null)
                      })
                  }}
                />
              ) : (
                <div className="settings-row-title">
                  {worldTitle(w)}
                  {w.live && <span className="settings-beta">{ft('worlds.playing')}</span>}
                  {w.role && (
                    <span className="fork-mode-badge">
                      <ToolSprite icon={ROLE_ICONS[w.role]} size={10} />
                      {w.role === 'god' ? ft('modes.badge.god') : ft('modes.badge.observer')}
                    </span>
                  )}
                </div>
              )}
              <div className="settings-row-desc">{worldFacts(w)}</div>
            </div>
            <div className="fork-worlds-actions">
              {renaming?.hash === w.hash ? (
                <button
                  className="lang-btn"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(null, async () => {
                      setList(await api.rename(w.hash, renaming.name))
                      setRenaming(null)
                    })
                  }
                >
                  {ft('worlds.renameSave')}
                </button>
              ) : (
                <button
                  className="lang-btn"
                  disabled={busy !== null}
                  onClick={() => setRenaming({ hash: w.hash, name: w.name ?? '' })}
                >
                  {ft('worlds.rename')}
                </button>
              )}
              {w.live && w.seed && (
                <button
                  className="lang-btn"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(w.seed ?? '')
                      .then(() => setMessage(ft('worlds.seedCopied')))
                      .catch((error: unknown) => setMessage(ft('worlds.failed', { error: errorText(error) })))
                  }
                >
                  {ft('worlds.copySeed')}
                </button>
              )}
              {!w.live && (
                <button
                  className="lang-btn active"
                  disabled={busy !== null}
                  onClick={() => void run(ft('worlds.opening'), () => api.open(w.hash))}
                >
                  {ft('worlds.open')}
                </button>
              )}
              {!w.live && (
                <button
                  className="lang-btn danger"
                  disabled={busy !== null}
                  onClick={() => {
                    if (trashing !== w.hash) {
                      setTrashing(w.hash)
                      return
                    }
                    setTrashing(null)
                    void run(null, async () => setList(await api.trash(w.hash)))
                  }}
                  onBlur={() => setTrashing((h) => (h === w.hash ? null : h))}
                >
                  {trashing === w.hash ? ft('worlds.trashSure') : ft('worlds.trash')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h3 className="settings-section-title">{ft('worlds.new.title')}</h3>
      <div className="settings-note">{ft('worlds.new.desc')}</div>
      <div className="settings-field">
        <div className="settings-field-label">{ft('worlds.new.name')}</div>
        <input
          className="fork-worlds-input"
          maxLength={60}
          value={name}
          placeholder={ft('worlds.namePlaceholder')}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="settings-field">
        <div className="settings-field-label">{ft('worlds.new.seed')}</div>
        <input
          className="fork-worlds-input"
          maxLength={64}
          value={seed}
          placeholder={ft('worlds.new.seedPlaceholder')}
          onChange={(e) => setSeed(e.target.value)}
        />
      </div>
      <div className="settings-field">
        <div className="settings-field-label">{ft('modes.worlds.role')}</div>
        <div className="fork-mode-cards compact" role="radiogroup" aria-label={ft('modes.worlds.role')}>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              className={'fork-mode-card' + (role === r ? ' picked' : '')}
              onClick={() => setRole(r)}
            >
              <ToolSprite icon={ROLE_ICONS[r]} size={20} />
              <span className="fork-mode-card-name">
                {r === 'god' ? ft('modes.god.name') : ft('modes.observer.name')}
              </span>
              <span className="fork-mode-card-promise">
                {r === 'god' ? ft('modes.god.promise') : ft('modes.observer.promise')}
              </span>
            </button>
          ))}
        </div>
      </div>
      {cap !== null && (
        <div className="settings-field">
          <div className="settings-field-label">{ftn('settings.sim.capacity', cap)}</div>
          <PopulationLoadSlider
            desktop={desktop}
            min={CAP_MIN}
            max={CAP_MAX}
            step={20}
            value={cap}
            onChange={setCap}
            tickMs={tickMs}
          />
        </div>
      )}
      <div className="settings-actions">
        <button
          className="lang-btn active"
          disabled={busy !== null}
          onClick={() =>
            void run(ft('worlds.new.creating'), () =>
              api.create({ name: name.trim() || null, seed: seed.trim() || null, populationCap: cap, role }),
            )
          }
        >
          {busy === ft('worlds.new.creating') ? ft('worlds.new.creating') : ft('worlds.new.create')}
        </button>
      </div>
      {message && <div className="settings-note">{message}</div>}
    </section>
  )
}
