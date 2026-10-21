import { useState } from 'react'
import { t } from '../../i18n'
import { useVersionCheck } from '../../shared/hooks/useVersionCheck'
import { reloadAppSafely } from '../../simulation/worldSource'

export function UpdateToast() {
  const { newVersionAvailable } = useVersionCheck()
  const [dismissed, setDismissed] = useState(false)
  const [reloading, setReloading] = useState(false)

  if (!newVersionAvailable || dismissed) return null

  const reload = () => {
    setReloading(true)
    window.setTimeout(
      () =>
        reloadAppSafely({
          onFailure: () => setReloading(false),
          failureMessage: t('toast.update.failed'),
        }),
      80,
    )
  }

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <div className="update-toast__icon" aria-hidden="true">
        ⤴
      </div>
      <div className="update-toast__body">
        <div className="update-toast__title">{t('toast.update.title')}</div>
        <div className="update-toast__sub">{t('toast.update.sub')}</div>
      </div>
      <button type="button" className="update-toast__cta" onClick={reload} disabled={reloading} autoFocus>
        {reloading ? t('toast.update.refreshing') : t('toast.update.refresh')}
      </button>
      <button
        type="button"
        className="update-toast__close"
        onClick={() => setDismissed(true)}
        aria-label={t('toast.dismiss')}
      >
        ×
      </button>
    </div>
  )
}
