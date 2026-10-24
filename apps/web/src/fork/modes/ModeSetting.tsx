// Fork: the mode of the world being played, in the settings' world tab.
import clsx from 'clsx'
import { t } from '../../i18n'
import { getDesktop } from '../../shared/desktop'
import { ToolSprite } from '../../ui/toolbar/ToolSprite'
import { chooseRole, ROLE_ICONS, ROLES, useModeStore } from './role'

export function ModeSetting() {
  const role = useModeStore((s) => s.role)
  return (
    <section className="settings-section">
      <div className="settings-row">
        <div className="settings-row-text">
          <div className="settings-row-title">{t('modes.settings.title')}</div>
          <div className="settings-row-desc">{t('modes.settings.desc')}</div>
        </div>
        <div
          className="settings-row-control fork-mode-switch"
          role="radiogroup"
          aria-label={t('modes.settings.title')}
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
              {r === 'god' ? t('modes.god.name') : t('modes.observer.name')}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
