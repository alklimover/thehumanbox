import type { SimTable } from './types'

/**
 * World milestones: `Milestone::name()` in crates/sim-core/src/sim/civ/progress/world_milestones.rs.
 * The simulation sends them only inside chronicle text: the headline "first_fire: the first flame is
 * tamed" and the event line with the description alone (crates/sim-core/src/sim/civ/civ_tick/milestones.rs).
 */
export const milestone: SimTable = {
  first_fire: { ru: 'первый огонь' },
  first_tool: { ru: 'первое орудие' },
  first_shelter: { ru: 'первое укрытие' },
  first_birth: { ru: 'первое рождение' },
  first_death: { ru: 'первая смерть' },
  first_speech: { ru: 'первая речь' },
  first_religion: { ru: 'первая вера' },
  first_writing: { ru: 'первые письмена' },
  first_book: { ru: 'первая книга' },
  first_school: { ru: 'первая школа' },
  first_university: { ru: 'первый университет' },
  first_plague: { ru: 'первый мор' },
  first_war: { ru: 'первая война' },
  first_treaty: { ru: 'первый договор' },
  first_vehicle: { ru: 'первая повозка' },
  first_ship: { ru: 'первый корабль' },
  first_train: { ru: 'первый поезд' },
  first_plane: { ru: 'первый самолёт' },
  first_factory: { ru: 'первая фабрика' },
  first_hospital: { ru: 'первая больница' },
  first_electricity: { ru: 'первое электричество' },
  first_computer: { ru: 'первый компьютер' },
  first_satellite: { ru: 'первый спутник' },
  first_ai: { ru: 'первый ИИ' },
  pop_100: { ru: 'сто человек' },
  pop_500: { ru: 'пятьсот человек' },
  pop_1000: { ru: 'тысяча человек' },
  pop_5000: { ru: 'пять тысяч человек' },
  golden_age: { ru: 'золотой век' },
  renaissance: { ru: 'Возрождение' },
  enlightenment: { ru: 'Просвещение' },
  guild_formed: { ru: 'первая гильдия' },
  empire_born: { ru: 'рождение империи' },
  republic_born: { ru: 'рождение республики' },
  democracy_born: { ru: 'рождение демократии' },
  great_famine: { ru: 'великий голод' },
  great_plague: { ru: 'великий мор' },
  great_flood: { ru: 'великий потоп' },
  great_fire: { ru: 'великий пожар' },
  revolution: { ru: 'революция' },
  moon_landing: { ru: 'высадка на Луну' },
  internet_age: { ru: 'эпоха интернета' },
}

/**
 * The line each milestone is announced with: `Milestone::description()`, word for word in `en`, so
 * whoever translates chronicle lines can match the English the simulation sent.
 */
export const milestoneDescription: Record<string, { en: string; ru: string }> = {
  first_fire: { en: 'the first flame is tamed', ru: 'впервые укрощён огонь' },
  first_tool: { en: 'the first tool is shaped from stone', ru: 'из камня впервые сделано орудие' },
  first_shelter: { en: 'the first roof rises against the rain', ru: 'от дождя впервые укрывает крыша' },
  first_birth: { en: 'the first child is born into the world', ru: 'в мире родился первый ребёнок' },
  first_death: {
    en: 'the first eyes close for the last time',
    ru: 'чьи-то глаза впервые закрылись навсегда',
  },
  first_speech: {
    en: 'words gather meaning across many tongues',
    ru: 'слова обретают смысл во многих языках',
  },
  first_religion: {
    en: 'a people lifts its eyes to the unseen',
    ru: 'народ впервые обращает взор к незримому',
  },
  first_writing: {
    en: 'marks on stone outlive the hand that made them',
    ru: 'знаки на камне переживают руку, что их начертала',
  },
  first_book: {
    en: 'many pages bound together preserve a mind',
    ru: 'сшитые вместе страницы хранят чужие мысли',
  },
  first_school: {
    en: 'elders gather the young to teach them',
    ru: 'старшие собирают молодых, чтобы учить их',
  },
  first_university: {
    en: 'a place is set aside for learning above all',
    ru: 'появилось место, где учение превыше всего',
  },
  first_plague: { en: 'an unseen sickness cuts through the people', ru: 'незримая болезнь косит людей' },
  first_war: { en: 'two peoples settle their dispute with blood', ru: 'два народа решают спор кровью' },
  first_treaty: {
    en: 'lines on the earth replace lines of swords',
    ru: 'черта на земле заменяет строй мечей',
  },
  first_vehicle: { en: 'the wheel carries a body further than feet', ru: 'колесо уносит дальше, чем ноги' },
  first_ship: { en: 'wood crosses what no foot can', ru: 'дерево пересекает то, что не пройти пешком' },
  first_train: { en: 'iron carries iron through the hills', ru: 'железо везёт железо сквозь холмы' },
  first_plane: { en: 'a body slips the bonds of the ground', ru: 'человек вырывается из плена земли' },
  first_factory: { en: 'machines repeat the work of many hands', ru: 'машины повторяют работу многих рук' },
  first_hospital: {
    en: 'the sick gather in one place to be healed',
    ru: 'больных собирают в одном месте, чтобы лечить',
  },
  first_electricity: {
    en: 'lightning is bottled and put to work',
    ru: 'молнию заперли и заставили работать',
  },
  first_computer: {
    en: 'a machine learns to follow instructions',
    ru: 'машина научилась следовать указаниям',
  },
  first_satellite: { en: 'a made thing orbits the sky', ru: 'рукотворная вещь кружит по небу' },
  first_ai: { en: 'thought is poured into silicon', ru: 'мысль перелита в кремний' },
  pop_100: { en: 'the people number one hundred', ru: 'людей уже сто' },
  pop_500: { en: 'the people number five hundred', ru: 'людей уже пятьсот' },
  pop_1000: { en: 'the people number one thousand', ru: 'людей уже тысяча' },
  pop_5000: { en: 'the people number five thousand', ru: 'людей уже пять тысяч' },
  golden_age: { en: 'an age of plenty and song begins', ru: 'начинается век изобилия и песен' },
  renaissance: {
    en: 'old knowledge is rediscovered, and new questions follow',
    ru: 'старое знание открыто заново, и за ним приходят новые вопросы',
  },
  enlightenment: { en: 'reason becomes the lamp of the people', ru: 'разум становится светочем народа' },
  guild_formed: { en: 'those of one craft band together', ru: 'люди одного ремесла объединяются' },
  empire_born: { en: 'many peoples bow to one banner', ru: 'многие народы склоняются перед одним знаменем' },
  republic_born: {
    en: 'the rule of one gives way to the rule of many',
    ru: 'власть одного уступает власти многих',
  },
  democracy_born: {
    en: 'each voice counts the same as any other',
    ru: 'каждый голос весит столько же, сколько любой другой',
  },
  great_famine: { en: 'the harvest fails and many do not eat', ru: 'урожай погиб, и многим нечего есть' },
  great_plague: { en: 'a sickness sweeps across the lands', ru: 'болезнь прокатилась по всем землям' },
  great_flood: { en: 'the waters rise and the land is unmade', ru: 'воды поднимаются, и земля гибнет' },
  great_fire: { en: 'the world burns, and rebuilds', ru: 'мир сгорает и отстраивается заново' },
  revolution: {
    en: 'the rulers are cast down by their own people',
    ru: 'правителей свергает их собственный народ',
  },
  moon_landing: { en: 'feet stand upon the moon', ru: 'нога человека ступила на Луну' },
  internet_age: { en: 'minds are linked across every land', ru: 'умы связаны во всех краях' },
}
