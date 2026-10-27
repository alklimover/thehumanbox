// Fork: the mode of the world being played, in the settings' world tab.
import clsx from 'clsx'
import { ft } from '../i18n'
import { getDesktop } from '../../shared/desktop'
import { ToolSprite } from '../../ui/toolbar/ToolSprite'
import { chooseRole, ROLE_ICONS, ROLES, useModeStore } from './role'

export function ModeSetting() {
  const role = useModeStore((s) => s.role)
  return (
    <section className="settings-section">
      <div className="settings-row">
        <div className="settings-row-text">
          <div className="settings-row-title">{ft('modes.settings.title')}</div>
          <div className="settings-row-desc">{ft('modes.settings.desc')}</div>
        </div>
        <div
          className="settings-row-control fork-mode-switch"
          role="radiogroup"
          aria-label={ft('modes.settings.title')}
        >
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              className={clsx('lang-btn', role === r && 'active')}
              onClick={() => chooseRole(r, getDesktop())}
            >
              <ToolSprite icon={ROLE_ICONS[r]} size={14} />
              {r === 'god' ? ft('modes.god.name') : ft('modes.observer.name')}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
