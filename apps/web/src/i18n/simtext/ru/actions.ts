import type { SimTextTable } from '../engine'

/**
 * Things people do that the simulation writes the same way as a thought and as
 * an event or a life-log entry ("write poem"). The thought is in the present
 * («пишет стихи»), the event in the past with the person's sex («написал[а]
 * стихи»).
 */
export const actions: SimTextTable = {
  'guard flock': { thought: 'стережёт стадо', event: '[стерёг|стерегла] стадо' },
  'street performance': { thought: 'выступает на улице', event: 'выступил[а] на улице' },
  'breed animals': { thought: 'разводит животных', event: '[развёл|развела] животных' },
  'establish tradition': { thought: 'закладывает традицию', event: 'заложил[а] традицию' },
  'carve relief': { thought: 'вырезает рельеф', event: 'вырезал[а] рельеф' },
  'release animal': { thought: 'выпускает животное', event: 'выпустил[а] животное' },
  'create mask': { thought: 'делает маску', event: 'сделал[а] маску' },
  'write poem': { thought: 'пишет стихи', event: 'написал[а] стихи' },
  'theater play': { thought: 'играет в театре', event: 'сыграл[а] в театре' },
  'weave tapestry': { thought: 'ткёт гобелен', event: 'соткал[а] гобелен' },
  'milk animal': { thought: 'доит животное', event: 'подоил[а] животное' },
  'recite poem': { thought: 'читает стихи', event: 'прочитал[а] стихи' },
  'shear wool': { thought: 'стрижёт шерсть', event: '[остриг|остригла] шерсть' },
  'feed livestock': { thought: 'кормит скот', event: 'накормил[а] скот' },
  'slaughter animal': { thought: 'забивает скот', event: 'забил[а] животное' },
  'train animal': { thought: 'дрессирует животное', event: 'выдрессировал[а] животное' },
  'create jewelry': { thought: 'делает украшения', event: 'сделал[а] украшения' },
  'compose anthem': { thought: 'сочиняет гимн', event: 'сочинил[а] гимн' },
  'compose song': { thought: 'сочиняет песню', event: 'сочинил[а] песню' },
  'observe animal patterns': {
    thought: 'наблюдает за повадками животных',
    event: 'наблюдал[а] за повадками животных',
  },
  'build stable': { thought: 'строит конюшню', event: 'построил[а] конюшню' },
  'perform music': { thought: 'играет музыку', event: 'сыграл[а] музыку' },
  'name festival': { thought: 'придумывает имя празднику', event: 'дал[а] имя празднику' },
  'build monument': { thought: 'возводит памятник', event: '[возвёл|возвела] памятник' },
  'storytelling circle': { thought: 'рассказывает истории в кругу', event: 'рассказывал[а] истории в кругу' },
  'pen animal': { thought: 'загоняет животное', event: 'загнал[а] животное в загон' },
  'build corral': { thought: 'строит загон', event: 'построил[а] загон' },
  'decorate home': { thought: 'украшает дом', event: 'украсил[а] дом' },
  'brand livestock': { thought: 'клеймит скот', event: 'заклеймил[а] скот' },
  'paint mural': { thought: 'расписывает стену', event: 'расписал[а] стену' },
  'transport herd': { thought: 'перегоняет стадо', event: 'перегнал[а] стадо' },
  'record cultural history': { thought: 'записывает историю племени', event: 'записал[а] историю племени' },
  'create calendar': { thought: 'составляет календарь', event: 'составил[а] календарь' },
  'ride animal': { thought: 'едет верхом', event: 'прокатил[ся|ась] верхом' },
  'dance performance': { thought: 'танцует перед зрителями', event: 'станцевал[а] перед зрителями' },
  // A toddler's firsts.
  'climb a chair': { thought: 'лезет на стул', event: '[залез|залезла] на стул' },
  'climb a stair': { thought: 'лезет на ступеньку', event: '[залез|залезла] на ступеньку' },
  'take a first step': { thought: 'делает первый шаг', event: 'сделал[а] первый шаг' },
  'take a second step': { thought: 'делает второй шаг', event: 'сделал[а] второй шаг' },
  'take a third step': { thought: 'делает третий шаг', event: 'сделал[а] третий шаг' },
  'sleep through dusk': { thought: 'спит в сумерках', event: 'проспал[а] сумерки' },
  'scribble a shape': { thought: 'рисует каракули', event: 'нарисовал[а] каракули' },
}
