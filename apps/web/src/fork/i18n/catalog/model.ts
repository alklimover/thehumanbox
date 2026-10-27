import { defineMessages } from '../define'

/**
 * Sentences and labels the game-model helpers build from the world (game/model): a person's death
 * and life story, family lines, a tribe's relations, trade, losses and progress, wildlife groups and
 * the titles beside a name. Names of simulation ids come from simLabel. (Achievements, goals, legends
 * and longevity are worded by the modals from the helpers' ids and numbers: catalog/modals.ts, stats.ts.)
 */
export const model = defineMessages(
  {
    // A dead person's card. {n} is the age in ticks, {cause} the cause of death.
    'model.death.line': { one: 'Died of {cause} at age {n}', other: 'Died of {cause} at age {n}' },
    'model.family.line': '{surname} ×{living}',
    'model.family.sentence': {
      one: 'The {surname} family in this tribe: {living} living, the eldest {n} days old.',
      other: 'The {surname} family in this tribe: {living} living, the eldest {n} days old.',
    },

    'model.eldest.line': { one: '{name}, {n} day old', other: '{name}, {n} days old' },

    'model.territory.goodItem': '{count} {good}',
    'model.territory.holds': 'holds {goods}',
    'model.territory.routes': { one: '{n} route', other: '{n} routes' },
    'model.territory.embargoed': 'embargoed by war',
    'model.territory.agreement': 'trade agreement',
    'model.territory.goods': { one: '{n} good', other: '{n} goods' },
    'model.territory.caravans': { one: '{n} caravan on the road', other: '{n} caravans on the road' },
    'model.territory.buying': 'buying {cargo} at {price} each',
    'model.territory.earned': 'earned {money} from trade',
    'model.territory.bartered': 'bartered {n} in kind',
    'model.territory.money': '{n} {unit}',

    // The coin of a tribe's age, by the simulation's currency word. English keeps the word as sent.
    'model.currency.shells': { one: '{n} shells', other: '{n} shells' },
    'model.currency.beads': { one: '{n} beads', other: '{n} beads' },
    'model.currency.coins': { one: '{n} coins', other: '{n} coins' },
    'model.currency.denarii': { one: '{n} denarii', other: '{n} denarii' },
    'model.currency.florins': { one: '{n} florins', other: '{n} florins' },
    'model.currency.pounds': { one: '{n} pounds', other: '{n} pounds' },
    'model.currency.dollars': { one: '{n} dollars', other: '{n} dollars' },
    'model.currency.credits': { one: '{n} credits', other: '{n} credits' },
    'model.currency.tokens': { one: '{n} tokens', other: '{n} tokens' },
    'model.currency.ergs': { one: '{n} ergs', other: '{n} ergs' },
    'model.currency.creds': { one: '{n} creds', other: '{n} creds' },
    'model.currency.synth': { one: '{n} synth', other: '{n} synth' },
    'model.currency.stars': { one: '{n} stars', other: '{n} stars' },
    'model.currency.essence': { one: '{n} essence', other: '{n} essence' },

    // "{era} age": the era name from simLabel('era') with the word "age" after it.
    'model.loss.war': 'war',
    'model.loss.beasts': 'beasts',
    'model.loss.drowning': 'drowning',
    'model.loss.fire': 'fire',
    'model.loss.disaster': 'disaster',
    'model.loss.sickness': 'sickness',
    'model.strategy.days': '{days}d',

    'model.generations.oldest': 'oldest living generation {n}',
    'model.crime.thefts': { one: '{n} theft', other: '{n} thefts' },
    'model.crime.killings': { one: '{n} killing', other: '{n} killings' },

    'model.skill.master': 'master',
    'model.skill.skilled': 'skilled',
    'model.skill.journeyman': 'journeyman',
    'model.skill.apprentice': 'apprentice',
  },
  {
    // Russian age at death is in the genitive: «в возрасте 1 такта», «в возрасте 5 тактов».
    'model.death.line': {
      one: 'Причина смерти: {cause}. Прожит {n} такт',
      few: 'Причина смерти: {cause}. Прожито {n} такта',
      many: 'Причина смерти: {cause}. Прожито {n} тактов',
      other: 'Причина смерти: {cause}. Прожито {n} такта',
    },
    'model.family.line': '{surname} ×{living}',
    'model.family.sentence': {
      one: 'Семья {surname} в этом племени: живых — {living}, старшему {n} день.',
      few: 'Семья {surname} в этом племени: живых — {living}, старшему {n} дня.',
      many: 'Семья {surname} в этом племени: живых — {living}, старшему {n} дней.',
      other: 'Семья {surname} в этом племени: живых — {living}, старшему {n} дня.',
    },

    'model.eldest.line': {
      one: '{name}, {n} день',
      few: '{name}, {n} дня',
      many: '{name}, {n} дней',
      other: '{name}, {n} дня',
    },

    'model.territory.goodItem': '{good} ×{count}',
    'model.territory.holds': 'запасы: {goods}',
    'model.territory.routes': {
      one: '{n} торговый путь',
      few: '{n} торговых пути',
      many: '{n} торговых путей',
      other: '{n} торгового пути',
    },
    'model.territory.embargoed': 'эмбарго из-за войны',
    'model.territory.agreement': 'торговый договор',
    'model.territory.goods': {
      one: '{n} товар',
      few: '{n} товара',
      many: '{n} товаров',
      other: '{n} товара',
    },
    'model.territory.caravans': {
      one: '{n} караван в пути',
      few: '{n} каравана в пути',
      many: '{n} караванов в пути',
      other: '{n} каравана в пути',
    },
    'model.territory.buying': 'закупка: {cargo}, {price} за штуку',
    'model.territory.earned': 'доход от торговли: {money}',
    'model.territory.bartered': 'обмен натурой: {n}',
    'model.territory.money': '{n} {unit}',

    'model.currency.shells': {
      one: '{n} ракушка',
      few: '{n} ракушки',
      many: '{n} ракушек',
      other: '{n} ракушки',
    },
    'model.currency.beads': {
      one: '{n} бусина',
      few: '{n} бусины',
      many: '{n} бусин',
      other: '{n} бусины',
    },
    'model.currency.coins': {
      one: '{n} монета',
      few: '{n} монеты',
      many: '{n} монет',
      other: '{n} монеты',
    },
    'model.currency.denarii': {
      one: '{n} денарий',
      few: '{n} денария',
      many: '{n} денариев',
      other: '{n} денария',
    },
    'model.currency.florins': {
      one: '{n} флорин',
      few: '{n} флорина',
      many: '{n} флоринов',
      other: '{n} флорина',
    },
    'model.currency.pounds': {
      one: '{n} фунт',
      few: '{n} фунта',
      many: '{n} фунтов',
      other: '{n} фунта',
    },
    'model.currency.dollars': {
      one: '{n} доллар',
      few: '{n} доллара',
      many: '{n} долларов',
      other: '{n} доллара',
    },
    'model.currency.credits': {
      one: '{n} кредит',
      few: '{n} кредита',
      many: '{n} кредитов',
      other: '{n} кредита',
    },
    'model.currency.tokens': {
      one: '{n} токен',
      few: '{n} токена',
      many: '{n} токенов',
      other: '{n} токена',
    },
    'model.currency.ergs': {
      one: '{n} эрг',
      few: '{n} эрга',
      many: '{n} эргов',
      other: '{n} эрга',
    },
    'model.currency.creds': {
      one: '{n} кред',
      few: '{n} креда',
      many: '{n} кредов',
      other: '{n} креда',
    },
    'model.currency.synth': {
      one: '{n} синт',
      few: '{n} синта',
      many: '{n} синтов',
      other: '{n} синта',
    },
    'model.currency.stars': {
      one: '{n} звезда',
      few: '{n} звезды',
      many: '{n} звёзд',
      other: '{n} звезды',
    },
    'model.currency.essence': {
      one: '{n} ед. эссенции',
      few: '{n} ед. эссенции',
      many: '{n} ед. эссенции',
      other: '{n} ед. эссенции',
    },

    // simLabel('era') gives the full Russian name («каменный век», «средневековье»).
    'model.loss.war': 'война',
    'model.loss.beasts': 'звери',
    'model.loss.drowning': 'вода',
    'model.loss.fire': 'огонь',
    'model.loss.disaster': 'бедствия',
    'model.loss.sickness': 'болезни',
    'model.strategy.days': '{days} дн.',

    'model.generations.oldest': 'старшее живое поколение: {n}',
    'model.crime.thefts': {
      one: '{n} кража',
      few: '{n} кражи',
      many: '{n} краж',
      other: '{n} кражи',
    },
    'model.crime.killings': {
      one: '{n} убийство',
      few: '{n} убийства',
      many: '{n} убийств',
      other: '{n} убийства',
    },

    'model.skill.master': 'мастер',
    'model.skill.skilled': 'умелец',
    'model.skill.journeyman': 'подмастерье',
    'model.skill.apprentice': 'ученик',
  },
)
