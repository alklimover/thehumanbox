import { defineMessages } from '../define'

/** Fork: the load a world capacity puts on this computer, under the capacity slider (fork/PopulationLoad.tsx). */
export const load = defineMessages(
  {
    'load.level.light': 'Light',
    'load.level.moderate': 'Noticeable load',
    'load.level.heavy': 'Heavy',
    'load.facts': '≈ {gb} GB of memory · {cpu}% of one core at 1x',
    'load.speed': 'smooth up to {speed}x',
    'load.speedNone': 'even 1x is a struggle',
    'load.device': 'This computer: {chip}, {gb} GB',
    'load.optimal': {
      one: 'Best here: up to {n} person',
      other: 'Best here: up to {n} people',
    },
    'load.optimalNone': 'Every size is heavy for this computer',
    'load.measuring': 'measuring how fast this computer is…',
    'load.unmeasured': 'speed not measured: a cautious estimate',
    'load.remeasure': 'measure again',
    'load.hint':
      'An estimate for a grown world that has filled its capacity. Faster speeds multiply the load on the processor.',
  },
  {
    'load.level.light': 'Легко',
    'load.level.moderate': 'Заметная нагрузка',
    'load.level.heavy': 'Тяжело',
    'load.facts': '≈ {gb} ГБ памяти · {cpu}% одного ядра на скорости 1×',
    'load.speed': 'без перегрузки до {speed}×',
    'load.speedNone': 'даже 1× с трудом',
    'load.device': 'Этот компьютер: {chip}, {gb} ГБ',
    'load.optimal': {
      one: 'Оптимально здесь: до {n} жителя',
      few: 'Оптимально здесь: до {n} жителей',
      many: 'Оптимально здесь: до {n} жителей',
      other: 'Оптимально здесь: до {n} жителя',
    },
    'load.optimalNone': 'Для этого компьютера любой размер тяжёлый',
    'load.measuring': 'измеряю скорость этого компьютера…',
    'load.unmeasured': 'скорость не измерена: осторожная оценка',
    'load.remeasure': 'перемерить',
    'load.hint':
      'Оценка для выросшего мира, заполнившего вместимость. Ускорение времени умножает нагрузку на процессор.',
  },
)
