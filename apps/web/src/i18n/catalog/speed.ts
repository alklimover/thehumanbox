import { defineMessages } from '../define'

/** Fork: the speed the world really runs at, and the cores it runs on (fork/SpeedReadout.tsx). */
export const speed = defineMessages(
  {
    'speed.of': '{actual} of {asked}',
    'speed.eco': 'eco',
    'speed.power.thermal': 'The Mac is hot, so the world runs on the efficiency cores until it cools down.',
    'speed.power.low-power': 'Low Power Mode is on, so the world runs on the efficiency cores.',
    'speed.power.battery':
      'The Mac is on battery, so the world runs on the efficiency cores and the Mac stays cool and quiet.',
    'speed.power.hidden': 'The window is hidden, so the world runs on the efficiency cores.',
  },
  {
    'speed.of': '{actual} из {asked}',
    'speed.eco': 'эко',
    'speed.power.thermal': 'Mac перегрелся: мир считается на энергоэффективных ядрах, пока он не остынет.',
    'speed.power.low-power': 'Включён режим энергосбережения: мир считается на энергоэффективных ядрах.',
    'speed.power.battery':
      'Mac работает от батареи: мир считается на энергоэффективных ядрах, чтобы Mac не грелся и не шумел.',
    'speed.power.hidden': 'Окно скрыто: мир считается на энергоэффективных ядрах.',
  },
)
