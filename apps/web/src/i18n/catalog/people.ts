import { defineMessages } from '../define'

/**
 * Lines about a person that the client keeps for simulation ids: the flavour of
 * each birth sign (`ZodiacSign::flavor` in crates/sim-core/src/sim/cosmos.rs) and
 * the tooltip of each aspiration role. Keyed by the id: `people.zodiacFlavor.<sign>`,
 * `people.aspirationTip.<aspiration>`. The names themselves are in i18n/sim
 * (zodiac.ts, aspiration.ts). Russian avoids words that change with the person's
 * sex: a verb in the present tense or a noun phrase.
 */
export const people = defineMessages(
  {
    'people.zodiacFlavor.ember': 'warm-hearted and quick to act',
    'people.zodiacFlavor.wave': 'fluid, patient, follows the moon',
    'people.zodiacFlavor.stone': 'steady, slow to anger, slow to fall',
    'people.zodiacFlavor.root': 'drawn deep, holds onto kin',
    'people.zodiacFlavor.bough': 'reaches outward, growing always',
    'people.zodiacFlavor.crane': 'watchful, long memory, careful step',
    'people.zodiacFlavor.wolf': 'hunts in silence, trusts the pack',
    'people.zodiacFlavor.dawn': 'born of light, restless until day',
    'people.zodiacFlavor.hearth': 'keeps the fire, tends the home',
    'people.zodiacFlavor.veil': 'quiet, sees what others miss',
    'people.zodiacFlavor.spear': 'true-aimed, blunt, unafraid',
    'people.zodiacFlavor.seed': 'small now, but everything is coming',

    'people.aspirationTip.seeker': 'Drawn to knowledge — pursues exploration, science, and learning.',
    'people.aspirationTip.wanderer': 'Restless and curious — happiest on the road, far from settlements.',
    'people.aspirationTip.warrior': 'Born for conflict — gravitates toward combat and military life.',
    'people.aspirationTip.connector': 'Lives for others — seeks partnerships, friendships, family.',
    'people.aspirationTip.builder': 'Wants to make things — construction and craft are their calling.',
    'people.aspirationTip.devout': 'A spiritual life — religion, ritual, and devotion guide them.',
    'people.aspirationTip.sage': 'A teacher at heart — passes knowledge to the next generation.',
    'people.aspirationTip.provider': 'Tends the household — agriculture, food, and family care.',
    'people.aspirationTip.artist': 'Makes for the sake of making — paintings, song, written words.',
    'people.aspirationTip.healer': 'Tends the sick — medicine, herbs, and the long patience of care.',
  },
  {
    'people.zodiacFlavor.ember': 'горячее сердце, быстрые решения',
    'people.zodiacFlavor.wave': 'легко меняется, умеет ждать, следует за луной',
    'people.zodiacFlavor.stone': 'стоит твёрдо: нелегко разгневать, нелегко свалить',
    'people.zodiacFlavor.root': 'уходит корнями вглубь, держится за родных',
    'people.zodiacFlavor.bough': 'тянется вширь и растёт всю жизнь',
    'people.zodiacFlavor.crane': 'зоркий глаз, долгая память, осторожный шаг',
    'people.zodiacFlavor.wolf': 'охотится молча, верит стае',
    'people.zodiacFlavor.dawn': 'дитя света, не знает покоя до утра',
    'people.zodiacFlavor.hearth': 'хранит огонь, бережёт дом',
    'people.zodiacFlavor.veil': 'говорит мало, видит то, чего не замечают другие',
    'people.zodiacFlavor.spear': 'бьёт точно, говорит прямо, не знает страха',
    'people.zodiacFlavor.seed': 'пока лишь росток, но всё впереди',

    'people.aspirationTip.seeker': 'Тянется к знанию — к открытиям, науке и учёбе.',
    'people.aspirationTip.wanderer':
      'Неугомонная, любопытная душа — счастливее всего в пути, вдали от поселений.',
    'people.aspirationTip.warrior': 'Жизнь ради битвы — тянется к сражениям и ратному делу.',
    'people.aspirationTip.connector': 'Живёт ради других — ищет любовь, дружбу, семью.',
    'people.aspirationTip.builder': 'Хочет создавать своими руками — призвание в стройке и ремесле.',
    'people.aspirationTip.devout': 'Жизнь духа — путь указывают вера, обряды и служение.',
    'people.aspirationTip.sage': 'Учитель в душе — передаёт знания следующему поколению.',
    'people.aspirationTip.provider': 'Опора дома — поле, пища и забота о семье.',
    'people.aspirationTip.artist': 'Творит ради самого творчества — картины, песни, слова на письме.',
    'people.aspirationTip.healer': 'Выхаживает больных — лекарства, травы и долгое терпение заботы.',
  },
)
