import { defineMessages } from '../define'

/**
 * The crash screen, storage notices and the browser simulation's save errors.
 * A worker message ends in a technical cause ({error}) from the browser or the
 * save code; that cause is shown as it comes.
 */
export const errors = defineMessages(
  {
    'errors.crash.title': 'The world stuttered',
    'errors.crash.body':
      'Something unexpected happened in the renderer. Reload to reconnect to the current simulation.',
    'errors.crash.reload': 'Reload',

    'errors.stillLoading.title': 'World still loading',
    'errors.stillLoading.body': 'The local world is still loading. Wait a moment, then try refreshing again.',
    'errors.stillLoading.reset':
      'The local world is still loading. Wait a moment, then try starting a new world again.',
    'errors.stillLoading.restore':
      'The local world is still loading. Wait a moment, then try restoring again.',
    'errors.storage.title': 'Browser storage unavailable',
    'errors.storage.notReset': 'The current world was not reset.',
    'errors.storage.notRestored': 'The recovery was not started.',
    'errors.badRecovery.title': 'Can’t restore that save',
    'errors.badRecovery.body': 'That recovery save is not valid for this local world.',

    'errors.checkpoint.reload': 'could not checkpoint the current world; refresh was cancelled safely',
    'errors.checkpoint.reset': 'could not checkpoint the current world; reset was cancelled safely',
    'errors.checkpoint.restore': 'could not checkpoint the current world; restore was cancelled safely',
    'errors.checkpoint.renderer':
      'could not checkpoint the current world; renderer update was cancelled safely',

    'errors.save.failed': 'save failed',
    'errors.save.failedStatus': 'save failed ({status})',
    'errors.worker.stopped': 'the local simulation worker stopped unexpectedly',
    'errors.worker.initFailed': 'wasm init failed: {error}',
    'errors.worker.lockFailed': 'could not lock local save: {error}',
    'errors.worker.otherTab':
      'this local world is already open in another tab; this tab will not overwrite its save',
    'errors.worker.autosaveFailed': 'autosave failed: {error}',
    'errors.worker.readFailed': 'could not read local save: {error}',
    'errors.worker.resetFailed': 'could not reset local save: {error}',
    'errors.worker.restoreFailed': 'local save could not be restored: {error}',
    'errors.worker.restoreFailedKept': 'local save could not be restored; recovery copy kept: {error}',
    'errors.worker.preserveFailed': 'local save recovery copy failed; original preserved: {error}',
    'errors.worker.recoveryFailed': 'recovery save could not be restored: {error}',
    'errors.worker.recoveryInvalid': 'recovery request is invalid; normal local saving resumed',
    'errors.worker.recoveryGone': 'recovery copy no longer exists; normal local saving resumed',
    'errors.worker.recoveryUnusable': 'recovery copy is unusable; normal local saving resumed: {error}',
    'errors.worker.saveEmpty': 'save is empty',
    'errors.worker.saveTickMismatch': 'save expected tick {expected}, restored tick {actual}',
    'errors.worker.serializedEmpty': 'simulation produced an empty save',
    'errors.worker.recoveryIdInvalid': 'invalid recovery save id',
    'errors.worker.recoveryMissing': 'recovery save no longer exists',
    'errors.worker.recoveryEmpty': 'recovery save is empty',
    'errors.worker.recoveryTickMismatch': 'recovery expected tick {expected}, restored tick {actual}',
  },
  {
    'errors.crash.title': 'Мир споткнулся',
    'errors.crash.body':
      'При отрисовке случилось что-то непредвиденное. Перезагрузите страницу, чтобы вернуться к текущей симуляции.',
    'errors.crash.reload': 'Перезагрузить',

    'errors.stillLoading.title': 'Мир ещё загружается',
    'errors.stillLoading.body':
      'Ваш мир ещё загружается. Подождите немного и попробуйте перезагрузить снова.',
    'errors.stillLoading.reset':
      'Ваш мир ещё загружается. Подождите немного и попробуйте начать новый мир снова.',
    'errors.stillLoading.restore':
      'Ваш мир ещё загружается. Подождите немного и попробуйте восстановить копию снова.',
    'errors.storage.title': 'Хранилище браузера недоступно',
    'errors.storage.notReset': 'Текущий мир не сброшен.',
    'errors.storage.notRestored': 'Восстановление не началось.',
    'errors.badRecovery.title': 'Эту копию не восстановить',
    'errors.badRecovery.body': 'Эта резервная копия не подходит к вашему миру.',

    'errors.checkpoint.reload': 'не удалось сохранить текущий мир; перезагрузка безопасно отменена',
    'errors.checkpoint.reset': 'не удалось сохранить текущий мир; сброс безопасно отменён',
    'errors.checkpoint.restore': 'не удалось сохранить текущий мир; восстановление безопасно отменено',
    'errors.checkpoint.renderer': 'не удалось сохранить текущий мир; обновление графики безопасно отменено',

    'errors.save.failed': 'сохранить не удалось',
    'errors.save.failedStatus': 'сохранить не удалось ({status})',
    'errors.worker.stopped': 'симуляция в браузере неожиданно остановилась',
    'errors.worker.initFailed': 'не удалось запустить симуляцию (WASM): {error}',
    'errors.worker.lockFailed': 'не удалось закрепить сохранение за этой вкладкой: {error}',
    'errors.worker.otherTab':
      'этот мир уже открыт в другой вкладке; отсюда его сохранение перезаписываться не будет',
    'errors.worker.autosaveFailed': 'автосохранение не удалось: {error}',
    'errors.worker.readFailed': 'не удалось прочитать сохранение: {error}',
    'errors.worker.resetFailed': 'не удалось сбросить сохранение: {error}',
    'errors.worker.restoreFailed': 'не удалось восстановить сохранение: {error}',
    'errors.worker.restoreFailedKept':
      'не удалось восстановить сохранение; резервная копия оставлена: {error}',
    'errors.worker.preserveFailed':
      'не удалось создать резервную копию; исходное сохранение не тронуто: {error}',
    'errors.worker.recoveryFailed': 'не удалось восстановить резервную копию: {error}',
    'errors.worker.recoveryInvalid': 'неверный запрос на восстановление; обычное сохранение возобновлено',
    'errors.worker.recoveryGone': 'резервной копии больше нет; обычное сохранение возобновлено',
    'errors.worker.recoveryUnusable': 'резервная копия повреждена; обычное сохранение возобновлено: {error}',
    'errors.worker.saveEmpty': 'сохранение пустое',
    'errors.worker.saveTickMismatch': 'ожидался такт {expected}, а восстановился {actual}',
    'errors.worker.serializedEmpty': 'симуляция выдала пустое сохранение',
    'errors.worker.recoveryIdInvalid': 'недопустимая резервная копия',
    'errors.worker.recoveryMissing': 'резервной копии больше нет',
    'errors.worker.recoveryEmpty': 'резервная копия пустая',
    'errors.worker.recoveryTickMismatch': 'в копии ожидался такт {expected}, а восстановился {actual}',
  },
)
