import type { SimTextTable } from '../engine'

/** The news ticker and the world's chronicle. */
export const headlines: SimTextTable = {
  // Ceremonies::tick_festivals: one festival and one line for each season.
  'the {lname} held a Sun Feast — drums, dancing, every belly full':
    '{lname}: праздник Солнца — барабаны, пляски, все сыты',
  'the {lname} held a Fading-Light Rite — lanterns lit against the coming dark':
    '{lname}: обряд угасающего света — фонари зажгли наперекор надвигающейся тьме',
  'the {lname} held a Long-Night Vigil — huddled close, sharing the last stores':
    '{lname}: бдение долгой ночи — сидят тесно, делят последние запасы',
  'the {lname} held a Greening Rite — the first shoots blessed with song':
    '{lname}: обряд зелени — первые ростки благословляют песней',
  '{name} became an elder, carrying: "{t}"': '{name} стал[а] старейшиной и хранит память: «{t}»',

  '{name} is gone. What they carried: "{text}"{suffix}':
    'Не стало {name}. В памяти осталось: «{text@name}»{suffix}',
  ' (held in mind {recalls} times)': ' (вспоминалось столько раз: {recalls})',

  '🤝 {na} and {nb} forged an alliance.': '🤝 {na} и {nb} заключили союз.',
  '⚔️ The {wname} conquered {len} tiles of {lname} land.':
    '⚔️ Племя {wname} захватило землю племени {lname}: клеток — {len}.',
  '🧬 {line}': '🧬 {line}',
  // The news: rulers, crime, roads, buildings, peril, seasons and the sky.
  '👑 {leader_name} of the {lname} {verb}.': '👑 {leader_name}, племя {lname}: {verb@leader_name}.',
  'seized power in a coup': 'захватил[а] власть',
  'takes the throne, the old line ended': 'восходит на престол — старая династия пресеклась',
  'succeeds to the throne as heir': 'наследует престол',
  '⚖️ {thief_name} of {tribe} was caught stealing from {victim_name}: {verdict_text}.':
    '⚖️ {thief_name} из племени {tribe} попадается на краже у {victim_name}: {verdict_text}.',
  'caught, the goods went back and the thief was shamed': 'краденое вернули, вора пристыдили',
  'caught, executed for the killing': 'вора казнили за убийство',
  'caught and tried, executed for the killing': 'вора судили и казнили за убийство',
  'caught, fined {stolen} into the treasury and flogged': 'вора оштрафовали на {stolen} в казну и высекли',
  'caught and tried, the fine of {stolen} went to the treasury': 'вора судили, штраф {stolen} ушёл в казну',
  'nobody saw it': 'никто не видел',
  '🗡️ {text}.': '🗡️ {text}.',
  '{thief_name} killed {victim_name} of {tribe} to get away with the goods':
    '{thief_name} убивает {victim_name} из племени {tribe}, чтобы скрыться с добром',
  '✊ {detail}.': '✊ {detail}.',
  'the poor of {tribe} rose up and shared out the wealth of {rich_name}':
    'бедняки племени {tribe} восстали и разделили богатство {rich_name}',
  'the poor of {tribe} rose up, shared out the wealth of {rich_name}, and raised {name} to lead':
    'бедняки племени {tribe} восстали, разделили богатство {rich_name} и поставили во главе {name}',
  '🏕️ The last {n} of the {from} were taken in by the {to}.':
    '🏕️ Последних из племени {from} ({n}) приютило племя {to}.',
  '🏕️ The last of the {from} was taken in by the {to}.':
    '🏕️ Последнего из племени {from} приютило племя {to}.',
  'The people of {name} laid a road to {label}.': 'Жители {name} проложили дорогу {label}.',
  'The people of {name} built a bridge on the way to {label}.':
    'Жители {name} построили мост на дороге {label}.',
  'the well': 'к колодцу',
  'the fields': 'к полям',
  'the village of {name}': 'к деревне {name}',
  '💔 {a_name} and {b_name} parted ways.': '💔 {a_name} и {b_name} расстались.',
  '{n1} and {n2} pledged themselves to each other': '{n1} и {n2} поклялись друг другу в верности',
  '🛠️ The {lineage_name} rebuilt their {name} from the ruins.':
    '🛠️ Племя {lineage_name} отстроило из руин: {name|building}.',
  '🏛️ The {lineage_name} completed a {name} — a wonder of their age.':
    '🏛️ Племя {lineage_name} завершило чудо своей эпохи: {name|building}.',
  '🔥 A {name} of the {lineage_name} fell to {label}.':
    '🔥 Племя {lineage_name} лишилось постройки ({name|building}): {label}.',
  fire: 'пожар',
  flooding: 'наводнение',
  '🤒 {arg0} spreads among the {tribe}.': '🤒 В племени {tribe} ходит болезнь: {arg0|disease}.',
  '⚠️ The {name} are dwindling: {remain}, and {phrase}.': '⚠️ Племя {name} вымирает: {remain}, и {phrase}.',
  'are dwindling: {remain}, and {phrase}': 'вымирает: {remain}, и {phrase}',
  'only one remains': 'остался один человек',
  'only {n} remain': 'осталось людей: {n}',
  'sickness is taking them': 'их косит болезнь',
  'they are starving': 'они голодают',
  'they have no water': 'у них нет воды',
  'no one is left to raise children': 'некому растить детей',
  'they are growing old': 'они стареют',
  'their numbers keep falling': 'их становится всё меньше',
  'war is killing them': 'их убивает война',
  'beasts are hunting them': 'на них охотятся звери',
  'the water is taking them': 'их забирает вода',
  'fire is taking them': 'их забирает огонь',
  'disaster after disaster strikes them': 'на них обрушивается бедствие за бедствием',
  '🌱 The {name} are recovering: {population} strong again.':
    '🌱 Племя {name} оправляется: снова людей — {population}.',
  'are recovering, {population} strong again': 'оправляется: снова людей — {population}',
  '✝️ A schism splits {parent_name}: the {sect_name} sect breaks away with {len} believers.':
    '✝️ Раскол в вере «{parent_name|faith}»: отделяется секта «{sect_name|faith}», верующих — {len}.',
  '📅 Year {year} begins.': '📅 Начался {year}-й год.',
  'Year {year} begins. The seasons turn again.':
    'Начался {year}-й год. Времена года снова сменяют друг друга.',
  '❄️ A hard winter has come.': '❄️ Пришла суровая зима.',
  '❄️ The elders fear a hard winter.': '❄️ Старейшины опасаются суровой зимы.',
  'a hard winter has come': 'пришла суровая зима',
  'the elders fear a hard winter': 'старейшины опасаются суровой зимы',
  'frost takes the land — winter is here': 'землю сковал мороз — пришла зима',
  'leaves turn — the long descent into colder days begins': 'листья желтеют — дни становятся всё холоднее',
  'the thaw begins — meltwater runs in the gullies': 'начинается оттепель — по оврагам бегут талые воды',
  'the world quickens — green covers the hills again': 'мир оживает — холмы снова зеленеют',
  'the moon stood full and bright': 'луна стояла полная и яркая',
  'the moon went dark tonight': 'этой ночью луна скрылась',
  '🌥️ A drought grips the land — water retreats and crops wither.':
    '🌥️ Землю охватила засуха — вода уходит, посевы вянут.',
  'stars fell across the sky — many made wishes': 'по небу падали звёзды — многие загадали желания',
  'stars fell across the sky tonight — I made a wish':
    'этой ночью падали звёзды — я [загадал|загадала] желание',
  'the people watched green light dance across the cold sky':
    'люди смотрели, как по холодному небу пляшет зелёный свет',

  // Fork: what the whole chronicle (fork/chronicle) keeps of these.
  'the first great-grandchild of {tribe} is born': 'у племени {tribe} родился первый правнук основателей',
  'the {n}th generation of {tribe} is born': 'у племени {tribe} родилось {n}-е поколение',
  'a storm': 'буря',
  battle: 'битва',
  'age and neglect': 'ветхость',
  'a falling star': 'падающая звезда',
  lightning: 'молния',
  'an earthquake': 'землетрясение',
  lava: 'лава',
  'the weight of snow': 'тяжесть снега',
  'the rising rock': 'поднявшаяся скала',
  dragonfire: 'драконий огонь',
}
