import type { SimTextTable } from '../engine'

/** What people carry in memory, in their own words: first person. */
export const memories: SimTextTable = {
  'Danger hurts. Fire warms.': 'Опасность ранит. Огонь греет.',
  'Food keeps me strong; water keeps me well.': 'Еда даёт мне силы, вода — здоровье.',
  'I am alive in this world.': 'Я живу в этом мире.',
  'I can choose what to do.': 'Я [сам|сама] выбираю, что делать.',
  'Other beings move around me.': 'Вокруг меня движутся другие существа.',
  'The sun rises and the sun sets.': 'Солнце встаёт, и солнце садится.',
  'The world is real and I am part of it.': 'Мир настоящий, и я — его часть.',
  'I am elder now — the young look to me for what I remember':
    'Теперь я старейшина — молодые ждут от меня того, что я помню',
  'I am no longer a child — the world is mine to walk now':
    'Я больше не ребёнок — теперь мир открыт для меня',
  'I was born on the open grasslands': 'Я родил[ся|ась] в открытой степи',
  'I became a mother — my first child was {child_name}': 'Я стала матерью — мой первый ребёнок: {child_name}',

  'I became a father — my first child was {cn}': 'Я стал отцом — мой первый ребёнок: {cn}',
  '{attacker_name} struck me with their kin behind them': 'на меня напали: {attacker_name} и родичи',
  'the day I left the family hearth — frightened, and free':
    'день, когда я [ушёл|ушла] из родного дома, — испуганн[ый|ая] и свободн[ый|ая]',
  'my first kill — a {kind} fell to my hand': 'моя первая добыча — {kind|animal}',
  'I lost my temper — words I cannot take back': 'я [вышел|вышла] из себя — сказанного не вернуть',
  'a new child arrived in our home — we all crowded close':
    'в нашем доме появился ребёнок — мы все столпились вокруг',
  'left the family hearth to claim my own ground': '[ушёл|ушла] из родного дома, чтобы обрести свою землю',

  'I am named for {namesake_name}, who came before me':
    'Меня назвали в честь {namesake_name} — того, кто жил до меня',
  'we held a festival — drums until dawn': 'у нас был праздник — барабаны до рассвета',
  '{teller_name} told me — {lower}': 'от {teller_name} я узнал[а] — {lower}',
  'I was born in the dry land where the sun burns': 'Я родил[ся|ась] в сухой земле, где жжёт солнце',
  'I was born under the trees of the forest': 'Я родил[ся|ась] под деревьями леса',
  'I was born on the golden plains under the wide sky':
    'Я родил[ся|ась] на золотых равнинах под широким небом',
  'I was born in the green dark of the jungle': 'Я родил[ся|ась] в зелёном сумраке джунглей',
  'I was born where the cold lives in the ground': 'Я родил[ся|ась] там, где земля скована холодом',
  'I was born among the snow-heavy pines': 'Я родил[ся|ась] среди заснеженных сосен',
  'I was born among the red rocks where the wind cuts': 'Я родил[ся|ась] среди красных скал, где режет ветер',
  'I came of age, and my people gathered for me':
    'Я [стал|стала] [взрослым|взрослой], и мой народ собрался ради меня',
  'the sun was eaten by the moon at midday': 'в полдень луна проглотила солнце',
  'the moon ran red in the night sky': 'ночью луна налилась красным',
  'I am growing — my body changes and the elders watch': 'Я расту — тело меняется, и старшие смотрят на меня',
  'a young one of our people came of age, and we gathered to see them stand':
    'кто-то из наших юных повзрослел, и мы собрались посмотреть на это',
  'I was born by the wet land where the reeds grow': 'Я [родился|родилась] у болот, где растёт тростник',
  'I was born on the burning land': 'Я [родился|родилась] на горящей земле',
  'the first frost arrived and the cold settled in my bones':
    'пришли первые заморозки, и холод поселился в моих костях',
  'we welcomed a new soul into our people by name': 'мы приняли в наш народ новую душу и дали ей имя',
  'warmth returned, and the earth gave fresh shoots': 'вернулось тепло, и земля дала свежие ростки',
  'I have lived one full year in this world': 'я [прожил|прожила] в этом мире целый год',
  'the snow softened, the streams ran fast and cold': 'снег осел, ручьи побежали быстро и холодно',
  'we celebrated a pairing — vows, dance, and food until the stars dimmed':
    'мы праздновали союз — клятвы, пляски и угощение, пока не побледнели звёзды',
  // Conversations, losses, knowledge.
  'talked with {other_name} about courtship': '[говорил|говорила] с {other_name} о любви',
  'talked with {other_name} about excited': 'радостно [поговорил|поговорила] с {other_name}',
  'talked with {other_name} about argue': '[поспорил|поспорила] с {other_name}',
  'talked with {other_name} about gossip': '[посплетничал|посплетничала] с {other_name}',
  'talked with {other_name} about bonded': '[поговорил|поговорила] по душам с {other_name}',
  'talked with {other_name} about chat': '[поболтал|поболтала] с {other_name}',
  'overheard {a_name} and {c_name} argue': '[слышал|слышала], как спорят {a_name} и {c_name}',
  'overheard {a_name} and {c_name} gossip': '[слышал|слышала], как сплетничают {a_name} и {c_name}',
  'overheard {a_name} and {c_name} excited': '[слышал|слышала], как оживлённо болтают {a_name} и {c_name}',
  'overheard {a_name} and {c_name} chat': '[слышал|слышала], как болтают {a_name} и {c_name}',
  'I challenged {target_name_for_mem}': 'Я [бросил|бросила] вызов {target_name_for_mem}',
  'I lost {dead_name}, who slept beside me through the years':
    'Я [потерял|потеряла] {dead_name} — столько лет мы спали рядом',
  'I lost my father {dead_name} when I was small': 'В детстве я [потерял|потеряла] отца — {dead_name}',
  'I lost my mother {dead_name} when I was small': 'В детстве я [потерял|потеряла] мать — {dead_name}',
  '{actor_name} of another people taught me without asking for return':
    'Меня учили, ничего не прося взамен: {actor_name} из чужого народа',
  'I gave knowledge to {target_name_for_mem}, of another people — they took it':
    'Я [поделился|поделилась] знанием с {target_name_for_mem} из чужого народа — его приняли',
  'I lost my friend {dead_name}': 'Я [потерял|потеряла] друга — {dead_name}',
  'brought down a {kind} that day': 'в тот день [добыл|добыла] зверя: {kind|animal}',
  'I saw green and violet curtains breathing across the night sky':
    'Я [видел|видела], как по ночному небу колышутся зелёные и фиолетовые занавеси',
  'I marvelled at the stars tonight — the world felt impossibly large':
    'Этой ночью я [любовался|любовалась] звёздами — мир казался невозможно большим',
  'we shared a dream tonight — bright shapes that neither of us could name':
    'этой ночью нам снился один сон на двоих — яркие образы, которым никто из нас не знал названия',

  // Fork: the last line of a life, in the chronicle's "is gone" headline.
  'died of {cause} at age {age}': 'причина смерти: {cause|deathCause}',
}
