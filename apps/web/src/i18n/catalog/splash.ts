import { defineMessages } from '../define'

/** The loading screen in index.html (its Russian text is written there too, so it shows before any script runs). */
export const splash = defineMessages(
  {
    'splash.label': 'Loading The Human Box',
    'splash.waking': 'waking the world…',
    'splash.slow': 'still going. big worlds can take a little while to wake up.',
    'splash.downloading': 'downloading · {loaded} kb',
    'splash.downloadingOf': 'downloading · {loaded} / {total} kb',
    // Fork: the steps of the start (fork/boot-stages.ts).
    'splash.stage.sim': 'starting the simulation…',
    'splash.stage.connecting': 'connecting to the world…',
    'splash.stage.drawing': 'drawing the world…',
    'splash.stage.engine': 'loading the simulation engine…',
    'splash.stage.reading': 'reading the saved world…',
    'splash.stage.restoring': 'restoring the world · tick {tick}',
    'splash.stage.creating': 'creating a new world…',
    'splash.elapsed': '{s} s',
  },
  {
    'splash.label': 'Загрузка The Human Box',
    'splash.waking': 'мир просыпается…',
    'splash.slow': 'ещё загружается. большим мирам нужно чуть больше времени, чтобы проснуться.',
    'splash.downloading': 'загрузка · {loaded} КБ',
    'splash.downloadingOf': 'загрузка · {loaded} / {total} КБ',
    'splash.stage.sim': 'запускаю симуляцию…',
    'splash.stage.connecting': 'подключаюсь к миру…',
    'splash.stage.drawing': 'рисую мир…',
    'splash.stage.engine': 'загружаю движок симуляции…',
    'splash.stage.reading': 'читаю сохранённый мир…',
    'splash.stage.restoring': 'восстанавливаю мир · такт {tick}',
    'splash.stage.creating': 'создаю новый мир…',
    'splash.elapsed': '{s} с',
  },
)
