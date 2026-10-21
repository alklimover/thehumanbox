import { defineMessages } from '../define'

/** The shared confirmation and notice dialogs, and the About window. */
export const dialogs = defineMessages(
  {
    'dialogs.cancel': 'cancel',
    'dialogs.confirm': 'confirm',
    'dialogs.ok': 'ok',

    'dialogs.about.title': 'About',
    'dialogs.about.heading': 'ABOUT',
    'dialogs.about.blurb':
      'The Human Box is a living simulation of small agents that forage, bond, build language, and pass it on to their children. Open source on GitHub.',
    'dialogs.about.frontend': 'FRONTEND',
    'dialogs.about.simulation': 'SIMULATION',
    'dialogs.about.commit': 'commit',
    'dialogs.about.built': 'built',
    'dialogs.about.runtime': 'runtime',
    'dialogs.about.localRuntime': 'local browser · offline',
    'dialogs.about.name': 'name',
    'dialogs.about.unknown': 'unknown',
    'dialogs.about.loading': 'loading…',
    'dialogs.about.versionFailed': 'could not reach simulation /version: {error}',
    'dialogs.about.builtWith': 'BUILT WITH',
    'dialogs.about.engine':
      'React-first 2D browser game engine. The world canvas, camera, input handling, and WebGL pipeline all run on it.',
    'dialogs.about.links': 'LINKS',
    'dialogs.about.fork': 'Russian fork.',
    'dialogs.about.original': 'The original game by Mohamad Homsi.',
  },
  {
    'dialogs.cancel': 'отмена',
    'dialogs.confirm': 'подтвердить',
    'dialogs.ok': 'понятно',

    'dialogs.about.title': 'Об игре',
    'dialogs.about.heading': 'ОБ ИГРЕ',
    'dialogs.about.blurb':
      'The Human Box — живая симуляция крошечных людей: они добывают еду, сближаются, создают язык и передают его детям. Исходный код открыт и лежит на GitHub.',
    'dialogs.about.frontend': 'ИНТЕРФЕЙС',
    'dialogs.about.simulation': 'СИМУЛЯЦИЯ',
    'dialogs.about.commit': 'коммит',
    'dialogs.about.built': 'сборка',
    'dialogs.about.runtime': 'где идёт',
    'dialogs.about.localRuntime': 'в браузере · без сети',
    'dialogs.about.name': 'название',
    'dialogs.about.unknown': 'неизвестно',
    'dialogs.about.loading': 'загрузка…',
    'dialogs.about.versionFailed': 'сервер симуляции не ответил на /version: {error}',
    'dialogs.about.builtWith': 'НА ЧЁМ СДЕЛАНО',
    'dialogs.about.engine':
      'Браузерный 2D-движок для игр на React. На нём работают холст мира, камера, обработка ввода и WebGL-конвейер.',
    'dialogs.about.links': 'ССЫЛКИ',
    'dialogs.about.fork': 'Русская версия.',
    'dialogs.about.original': 'Оригинальная игра, автор — Mohamad Homsi.',
  },
)
