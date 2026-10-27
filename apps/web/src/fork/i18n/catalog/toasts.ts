import { defineMessages } from '../define'

/** Toasts in the corner: a new web version, and the desktop app's own updates. */
export const toasts = defineMessages(
  {
    'toast.update.title': 'New version available',
    'toast.update.sub': 'refresh to load the latest world',
    'toast.update.refresh': 'Refresh',
    'toast.update.refreshing': 'refreshing…',
    'toast.update.failed': 'could not checkpoint the current world; update refresh was cancelled safely',
    'toast.dismiss': 'Dismiss',

    'toast.desktop.ready': 'Update ready to install',
    'toast.desktop.available': 'Update available',
    'toast.desktop.downloaded': 'v{version} downloaded — restart to apply',
    'toast.desktop.downloading': 'v{version} downloading…',
    'toast.desktop.error': 'update failed: {message}',
    'toast.desktop.notReady': 'update is not ready yet',
    'toast.desktop.restartFailed': 'could not restart updater',
    'toast.desktop.restartTip': 'Restart The Human Box and install the downloaded update',
    'toast.desktop.restart': 'restart',
    'toast.desktop.restarting': 'restarting…',
  },
  {
    'toast.update.title': 'Доступна новая версия',
    'toast.update.sub': 'обновите страницу, чтобы загрузить свежую версию мира',
    'toast.update.refresh': 'Обновить',
    'toast.update.refreshing': 'обновление…',
    'toast.update.failed': 'не удалось сохранить текущий мир; обновление страницы безопасно отменено',
    'toast.dismiss': 'Закрыть',

    'toast.desktop.ready': 'Обновление готово к установке',
    'toast.desktop.available': 'Доступно обновление',
    'toast.desktop.downloaded': 'Версия {version} загружена — перезапустите, чтобы установить',
    'toast.desktop.downloading': 'Загрузка версии {version}…',
    'toast.desktop.error': 'ошибка обновления: {message}',
    'toast.desktop.notReady': 'обновление ещё не готово',
    'toast.desktop.restartFailed': 'не удалось перезапустить установку обновления',
    'toast.desktop.restartTip': 'Перезапустить The Human Box и установить загруженное обновление',
    'toast.desktop.restart': 'перезапустить',
    'toast.desktop.restarting': 'перезапуск…',
  },
)
