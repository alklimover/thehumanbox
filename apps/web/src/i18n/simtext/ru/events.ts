import type { SimTextTable } from '../engine'

/**
 * What a person did, in the event feed, the life log and the memories made
 * from it: past tense with the person's sex, no subject (the feed shows the
 * name next to it).
 */
export const events: SimTextTable = {
  'built a navigation cairn': 'сложил[а] путевой знак из камней',
  'engaged in a friendly challenge with kin': 'устроил[а] дружеское состязание с родичами',
  'led a dance': '[повёл|повела] танец',
  'trap catch': 'поймал[а] добычу в ловушку',
  'a crude shelter took shape': 'поднялось первое грубое укрытие',
  'humbly asked for forgiveness': 'смиренно попросил[а] прощения',
  'practised selective harvesting and replanting in the forest':
    'вырубал[а] лес выборочно и подсаживал[а] новые деревья',
  'stood up to defend their own reputation': 'встал[а] на защиту своего доброго имени',
  'reconciled with a rival lineage': 'помирил[ся|ась] с враждебным племенем',
  'granted amnesty': 'объявил[а] амнистию',
  'invented dance': 'придумал[а] танец',
  'forged an alliance': 'заключил[а] союз',
  'planted a row of trees as a windbreak': 'высадил[а] ряд деревьев для защиты от ветра',
  'planted a grove of trees for food and timber': 'высадил[а] рощу ради плодов и древесины',
  'composed a tribal anthem': 'сочинил[а] гимн племени',
  'ate with a spoon': 'поел[а] ложкой',
  'ate with hands': 'поел[а] руками',
  'painted the body': 'раскрасил[а] тело',
  'improved the map': 'улучшил[а] карту',
  'began a chronicle': 'начал[а] летопись',
  'learned cloud signs': 'научил[ся|ась] читать приметы по облакам',
  'began cataloguing plants': 'начал[а] описывать растения',
  'marked a fire hazard area to keep the group safe': 'отметил[а] пожароопасное место, чтобы уберечь своих',
  'marked a flood hazard area to keep the group safe':
    'отметил[а] место, которое заливает водой, чтобы уберечь своих',

  // Templates: names stay as they are, ids go through the simLabel tables.
  'heard that {actor_name} {detail}': 'услышал[а], что {actor_name} {detail@actor_name}',
  'noticed {actor_name} {detail}': 'заметил[а]: {actor_name} {detail@actor_name}',
  'watched {actor_name} pass': 'видел[а], как уходит {actor_name}',
  'found and ate food at ({cx},{cy})': '[нашёл|нашла] и съел[а] еду в ({cx},{cy})',
  'drank from water at ({cx},{cy})': 'попил[а] воды в ({cx},{cy})',
  'brought home a {arg0}': '[принёс|принесла] домой: {arg0|good}',
  'crafted {what} for the first time': 'впервые смастерил[а]: {what|good}',
  '"{spoken}" → {understood}/{reached} understood': '«{spoken}» → поняли {understood} из {reached}',
  '"{arg0}" warned {kin_warned}': '«{arg0}» — предупредил[а] родичей ({kin_warned})',
  'set out: {description} toward ({arg1}, {arg2})':
    'отправил[ся|ась] в путь ({description}) к ({arg1}, {arg2})',
  'arrived after {description}': 'прибыл[а] после пути ({description})',
  'ended journey: {description}': 'завершил[а] путь ({description})',
  'mentored by elder {org_name}': 'учил[ся|ась] у старейшины {org_name}',
  'mentored by kin {org_name}': 'учил[ся|ась] у родича {org_name}',
  'learned {disc} from {teacher_short}': 'узнал[а] от {teacher_short}: {disc|discovery}',
  '{lname} discovered {arg1}': '{lname}: открытие — {arg1|discovery}',
  'became close friends with {name}': 'подружил[ся|ась] с {name}',
  'fell in love with {pname}': 'влюбил[ся|ась] в {pname}',
  'set their heart on becoming a {pick}': 'загорел[ся|ась] мечтой: {pick|aspiration}',
  'welcomed {cn} into the world': 'дождал[ся|ась] рождения {cn}',
  'gave birth to {child_name}': 'родила {child_name}',
  'shared knowledge with kin near ({ix},{iy})': 'поделил[ся|ась] знаниями с родичами у ({ix},{iy})',
  'witnessed {dn} die': 'видел[а] смерть {dn}',
  'first child {child_name}': 'первый ребёнок: {child_name}',
}
