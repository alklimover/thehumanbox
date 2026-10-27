import { defineMessages } from '../define'

/**
 * The app shell around the map: the dock's status line (what a tool or key just did), the save
 * status, the start-up screen, the map's own buttons and messages, and the way out of photo mode.
 */
export const status = defineMessages(
  {
    'startup.title': 'starting your world…',
    'startup.failed': 'local world could not start',
    'startup.desktop': 'starting the native simulation on this computer',
    'startup.browser': 'loading the private WebAssembly simulation saved in this browser',
    'startup.retry': 'retry local world',

    'map.drawFailed': 'The world could not be drawn. Retry the renderer to restore the map.',
    'map.noCanvas': 'The browser could not create a 2D canvas. Try reloading this page.',
  },
  {
    'startup.title': 'запускаем ваш мир…',
    'startup.failed': 'не удалось запустить мир',
    'startup.desktop': 'запуск симуляции на этом компьютере',
    'startup.browser': 'загрузка вашей WebAssembly-симуляции, сохранённой в этом браузере',
    'startup.retry': 'попробовать снова',

    'map.drawFailed': 'Не удалось нарисовать мир. Перезапустите отрисовку, чтобы вернуть карту.',
    'map.noCanvas': 'Браузер не смог создать 2D-холст. Попробуйте перезагрузить страницу.',
  },
)
