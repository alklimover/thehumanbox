// Fork: the "Important moment" card. When the desktop simulation pauses or
// slows the world for something that matters (see ./watch.ts), this card
// says what happened, top centre and not modal: show it on the map, continue
// at the speed it ran at, or open the chronicle. It also keeps the server's
// copy of the player's choices and of the tribe in focus up to date.
import { useEffect, useRef, useState } from 'react'
import { calendarAt } from '../../game/model/calendar'
import { fmtNumber, t, tn } from '../../i18n'
import { displayName } from '../../i18n/names'
import { sexByName } from '../../i18n/simtext'
import { isDesktop } from '../../shared/desktop'
import { useUIStore } from '../../state/store'
import { useWorldStore } from '../../state/worldStore'
import {
  CATEGORY_COLOR,
  CATEGORY_ICON,
  entryActor,
  entrySex,
  entryText,
  sentence,
  shownActor,
  type ChronicleEntry,
} from './model'
import { goToTribe, openWholeHistory } from './navigate'
import { useCardPlacement, type Placement } from './placement'
import { refreshRuntime } from './runtime-refresh'
import {
  RULE_LABEL,
  alsoShown,
  differs,
  fetchAlerts,
  focusedTribe,
  sendSettings,
  useWatchSettings,
  type AlertLine,
  type WatchAlert,
} from './watch'
import './important-moment.css'

const POLL_MS = 1000

interface Props {
  /** The same runtime controls the time control uses. */
  setSpeed: (mult: number) => Promise<boolean>
  resume: () => Promise<boolean>
}

function asEntry(line: AlertLine): ChronicleEntry {
  return { ...line, id: 0 }
}

/** The whole line, with who did it in front when the text does not say. */
function lineText(line: AlertLine): string {
  const people = useWorldStore.getState().world?.organisms
  const entry = asEntry(line)
  const text = entryText(entry, entrySex(entry, sexByName(people)))
  const actor = entryActor(entry)
  return actor ? `${shownActor(actor)} ${text}` : sentence(text)
}

export function ImportantMoment(props: Props) {
  return isDesktop() ? <Watcher {...props} /> : null
}

function Watcher({ setSpeed, resume }: Props) {
  const [alert, setAlert] = useState<WatchAlert | null>(null)
  const settings = useWatchSettings((s) => s.settings)
  const setSettings = useWatchSettings((s) => s.set)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // Poll the alerts; the first answer only marks where we are, so an old card is not shown again.
  useEffect(() => {
    const abort = new AbortController()
    let after: number | null = null
    let sending = false
    const poll = async () => {
      try {
        const answer = await fetchAlerts(after ?? 0, abort.signal)
        const ui = useUIStore.getState()
        const focus = focusedTribe(ui.focus, ui.selectedOrgId, useWorldStore.getState().world?.organisms)
        if (!sending && differs(answer.watch, settingsRef.current, focus)) {
          sending = true
          void sendSettings(settingsRef.current, focus)
            .catch(() => null)
            .finally(() => {
              sending = false
            })
        }
        const newest = answer.alerts[answer.alerts.length - 1]
        if (after !== null && newest) {
          setAlert(newest)
          void refreshRuntime()
        }
        after = Math.max(after ?? 0, answer.latest_id)
      } catch {
        /* the simulation is restarting: try again */
      }
    }
    void poll()
    const timer = setInterval(() => void poll(), POLL_MS)
    return () => {
      clearInterval(timer)
      abort.abort()
    }
  }, [])

  useEffect(() => {
    if (!alert) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAlert(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alert])

  const place = useCardPlacement(alert !== null)
  if (!alert) return null
  return (
    <MomentCard
      alert={alert}
      place={place}
      ignored={settings.rules[alert.main.rule] === 'ignore'}
      onIgnore={(ignore) =>
        setSettings({ rules: { [alert.main.rule]: ignore ? 'ignore' : alertDefault(alert) } })
      }
      onShow={() => alert.focus && goToTribe(alert.focus.id)}
      onContinue={() => {
        void (alert.action === 'pause' ? resume() : setSpeed(alert.prev_speed))
        setAlert(null)
      }}
      onChronicle={() => openWholeHistory()}
      onSettings={() => useUIStore.getState().openDesktopSettings()}
      onClose={() => setAlert(null)}
    />
  )
}

/** What a rule went back to when the box is unticked: what stopped the world this time. */
function alertDefault(alert: WatchAlert) {
  return alert.action
}

export function MomentCard({
  alert,
  place,
  ignored,
  onIgnore,
  onShow,
  onContinue,
  onChronicle,
  onSettings,
  onClose,
}: {
  alert: WatchAlert
  place?: Placement
  ignored: boolean
  onIgnore: (ignore: boolean) => void
  onShow: () => void
  onContinue: () => void
  onChronicle: () => void
  onSettings: () => void
  onClose: () => void
}) {
  const date = calendarAt(alert.tick)
  const { lines, more } = alsoShown(alert)
  const firstInto = alert.main.kind === 'era' && alert.focus ? alert.focus : null
  return (
    <div
      className="fmoment"
      role="status"
      aria-live="polite"
      style={place && { left: place.left, top: place.top, width: place.width }}
    >
      <div className="fmoment-head">
        <span className="fmoment-title">
          {alert.action === 'pause' ? t('moment.paused') : t('moment.slowed')}
        </span>
        <span className="fmoment-date">
          {t('calendar.yearSeason', { year: date.year, season: date.season })}
        </span>
        <button type="button" className="fmoment-x" aria-label={t('common.close')} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="fmoment-main">
        <Icon cat={alert.main.cat} />
        <span>
          {lineText(alert.main)}
          {firstInto && (
            <span className="fmoment-first">
              {' '}
              {t('moment.firstInto', { name: displayName(firstInto.name) })}
            </span>
          )}
        </span>
      </div>
      {lines.length > 0 && (
        <div className="fmoment-also">
          <div className="fmoment-also-title">{t('moment.also', { n: alert.also_total })}</div>
          {lines.map((line, i) => (
            <div key={i} className="fmoment-also-row">
              <Icon cat={line.cat} />
              <span>{lineText(line)}</span>
            </div>
          ))}
          {more > 0 && <div className="fmoment-more">{tn('moment.more', more)}</div>}
        </div>
      )}
      <div className="fmoment-actions">
        {alert.focus && (
          <button type="button" className="lang-btn" onClick={onShow}>
            {t('moment.show')}
          </button>
        )}
        <button type="button" className="lang-btn primary" onClick={onContinue}>
          {t('moment.continue', { speed: fmtNumber(alert.prev_speed, { maximumFractionDigits: 2 }) })}
        </button>
        <button type="button" className="lang-btn" onClick={onChronicle}>
          {t('moment.chronicle')}
        </button>
      </div>
      <div className="fmoment-foot">
        <label>
          <input type="checkbox" checked={ignored} onChange={(e) => onIgnore(e.target.checked)} />{' '}
          {t('moment.dontStop', { rule: t(RULE_LABEL[alert.main.rule]) })}
        </label>
        <button
          type="button"
          className="fmoment-gear"
          title={t('moment.settings')}
          aria-label={t('moment.settings')}
          onClick={onSettings}
        >
          ⚙
        </button>
      </div>
    </div>
  )
}

function Icon({ cat }: { cat: string }) {
  return (
    <span className="fmoment-icon" style={{ color: CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.other }}>
      {CATEGORY_ICON[cat] ?? CATEGORY_ICON.other}
    </span>
  )
}
