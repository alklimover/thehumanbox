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

    'status.save.loading': 'loading local save…',
    'status.save.retrying': 'retrying local storage…',
    'status.save.restored': 'world restored at tick {tick}',
    'status.save.fresh': 'new local world ready',
    'status.save.saving': 'saving tick {tick}…',
    'status.save.saved': 'saved locally · tick {tick}',
    'status.save.savingWorld': 'saving the world…',

    'status.play': 'play',
    'status.pause': 'pause',
    'status.guidance.set': '{strategy} guidance set',
    'status.guidance.failed': 'guidance failed',
    'status.strategy.hunt': 'hunt',
    'status.strategy.explore': 'explore',
    'status.strategy.settle': 'settle',
    'status.strategy.trade': 'trade',
    'status.strategy.defend': 'defend',
    'status.noPrayers': 'no one is praying',
    'status.noBrink': 'no tribe is on the brink',
    'status.pausedOnBrink': 'paused: {names} on the brink',
    'status.teach.done': 'the gods taught them a secret',
    'status.teach.failed': 'they cannot be taught again yet',

    'status.newWorld.title': 'Start a new world?',
    'status.newWorld.body': 'This silent world is kept in recovery saves.',
    'status.newWorld.confirm': 'start new',

    'mapControls.zoomIn': 'Zoom in',
    'mapControls.zoomOut': 'Zoom out',
    'mapControls.fit': 'Fit world',
    'mapControls.locate': 'Centre on selected',

    'map.aria': 'Interactive world map',
    'map.retry': 'Retry renderer',
    'map.drawFailed': 'The world could not be drawn. Retry the renderer to restore the map.',
    'map.noCanvas': 'The browser could not create a 2D canvas. Try reloading this page.',
  },
  {
    'startup.title': 'запускаем ваш мир…',
    'startup.failed': 'не удалось запустить мир',
    'startup.desktop': 'запуск симуляции на этом компьютере',
    'startup.browser': 'загрузка вашей WebAssembly-симуляции, сохранённой в этом браузере',
    'startup.retry': 'попробовать снова',

    'status.save.loading': 'загрузка сохранения…',
    'status.save.retrying': 'повторная попытка доступа к хранилищу…',
    'status.save.restored': 'мир восстановлен на такте {tick}',
    'status.save.fresh': 'новый мир готов',
    'status.save.saving': 'сохранение такта {tick}…',
    'status.save.saved': 'сохранено на устройстве · такт {tick}',
    'status.save.savingWorld': 'сохранение мира…',

    'status.play': 'пуск',
    'status.pause': 'пауза',
    'status.guidance.set': 'курс задан: {strategy}',
    'status.guidance.failed': 'не удалось задать курс',
    'status.strategy.hunt': 'добыча пищи',
    'status.strategy.explore': 'разведка',
    'status.strategy.settle': 'обустройство',
    'status.strategy.trade': 'торговля',
    'status.strategy.defend': 'оборона',
    'status.noPrayers': 'никто не молится',
    'status.noBrink': 'нет племён на грани гибели',
    'status.pausedOnBrink': 'пауза: на грани гибели — {names}',
    'status.teach.done': 'боги открыли им тайну',
    'status.teach.failed': 'пока их нельзя учить снова',

    'status.newWorld.title': 'Начать новый мир?',
    'status.newWorld.body': 'Этот затихший мир останется в резервных копиях.',
    'status.newWorld.confirm': 'начать заново',

    'mapControls.zoomIn': 'Приблизить',
    'mapControls.zoomOut': 'Отдалить',
    'mapControls.fit': 'Показать весь мир',
    'mapControls.locate': 'К выбранному человеку',

    'map.aria': 'Интерактивная карта мира',
    'map.retry': 'Перезапустить отрисовку',
    'map.drawFailed': 'Не удалось нарисовать мир. Перезапустите отрисовку, чтобы вернуть карту.',
    'map.noCanvas': 'Браузер не смог создать 2D-холст. Попробуйте перезагрузить страницу.',
  },
)
