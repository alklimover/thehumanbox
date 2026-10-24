// Fork: "Don't miss what matters" in the desktop settings' world tab: whether
// the world stops for what matters, how often at most, and what each kind of
// line does. The card (ImportantMoment.tsx) sends the choices to the simulation.
import { t } from '../../i18n'
import { isDesktop } from '../../shared/desktop'
import { ACTIONS, DEBOUNCE_CHOICES, RULES, RULE_LABEL, useWatchSettings, type WatchAction } from './watch'
import './important-moment.css'

const ACTION_LABEL = {
  ignore: 'watch.action.ignore',
  slow: 'watch.action.slow',
  pause: 'watch.action.pause',
} as const satisfies Record<WatchAction, string>

const DEBOUNCE_LABEL = {
  30: 'watch.debounce.30',
  60: 'watch.debounce.60',
  180: 'watch.debounce.180',
} as const

export function WatchSection() {
  const settings = useWatchSettings((s) => s.settings)
  const set = useWatchSettings((s) => s.set)
  const reset = useWatchSettings((s) => s.reset)
  if (!isDesktop()) return null
  return (
    <section className="settings-section fork-watch">
      <h3 className="settings-section-title">{t('watch.title')}</h3>
      <div className="fwatch-row">
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          {t('watch.enabled')}
        </label>
      </div>
      <div className={'fwatch-row' + (settings.enabled ? '' : ' fwatch-off')}>
        <span>{t('watch.debounce')}</span>
        {DEBOUNCE_CHOICES.map((secs) => (
          <label key={secs}>
            <input
              type="radio"
              name="fwatch-debounce"
              checked={settings.debounceSecs === secs}
              disabled={!settings.enabled}
              onChange={() => set({ debounceSecs: secs })}
            />
            {t(DEBOUNCE_LABEL[secs])}
          </label>
        ))}
      </div>
      <table className={'fwatch-table' + (settings.enabled ? '' : ' fwatch-off')}>
        <thead>
          <tr>
            <th />
            {ACTIONS.map((action) => (
              <th key={action}>{t(ACTION_LABEL[action])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RULES.map(([rule]) => (
            <tr key={rule}>
              <td>{t(RULE_LABEL[rule])}</td>
              {ACTIONS.map((action) => (
                <td key={action} className="fwatch-pick">
                  <input
                    type="radio"
                    name={`fwatch-${rule}`}
                    aria-label={`${t(RULE_LABEL[rule])}: ${t(ACTION_LABEL[action])}`}
                    checked={settings.rules[rule] === action}
                    disabled={!settings.enabled}
                    onChange={() => set({ rules: { [rule]: action } })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="settings-note">{t('watch.note')}</div>
      <div className="fwatch-row">
        <button type="button" className="lang-btn" onClick={reset}>
          {t('watch.reset')}
        </button>
      </div>
    </section>
  )
}
