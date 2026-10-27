import { defineMessages } from '../define'

/** Ready-made scenarios: their names and what each adds to the world. */
export const scenarios = defineMessages(
  {
    'scenarios.founding-family.title': 'Founding family',
    'scenarios.founding-family.detail':
      'A couple with children settles the middle of the land, and their kin are crowned leader.',
    'scenarios.two-tribes.title': 'Two rival tribes',
    'scenarios.two-tribes.detail':
      'Two groups of five start on opposite sides of the land, each with a little wild game nearby.',
    'scenarios.wild-valley.title': 'Wild valley',
    'scenarios.wild-valley.detail':
      'A herd of deer and rabbits is placed through the land, with a clear sky to start.',
    'scenarios.apocalypse.title': 'Apocalypse',
    'scenarios.apocalypse.detail':
      'A storm breaks over the land, a meteor falls in the middle, a plague spreads, and zombies walk the edges.',
    'scenarios.golden-age.title': 'Golden age',
    'scenarios.golden-age.detail':
      'Clear skies, a bounty of food and warm sun over the middle, and two families founding their tribes on the good ground.',
    'scenarios.tribal-war.title': 'Tribal war',
    'scenarios.tribal-war.detail':
      'Two families found rival tribes on either side of the land, and the gods set them at war.',
    'scenarios.island-survival.title': 'Island survival',
    'scenarios.island-survival.detail':
      'A band of six starts in the middle with deer and rabbits about, and rain to drink.',
    'scenarios.ice-age.title': 'Ice age',
    'scenarios.ice-age.detail':
      'Snow falls and a blizzard sweeps the middle while a small band and a few bears are left to endure it.',

    // The status line while a scenario is placed.
    'scenarios.starting': '{title} · starting',
    'scenarios.done': '{title} is in the world',
    'scenarios.partial': {
      one: '{title}: {worked} of {n} steps worked',
      other: '{title}: {worked} of {n} steps worked',
    },
  },
  {
    'scenarios.founding-family.title': 'Семья-основатель',
    'scenarios.founding-family.detail':
      'Пара с детьми селится в самом центре земли, и один из семьи становится правителем.',
    'scenarios.two-tribes.title': 'Два племени-соперника',
    'scenarios.two-tribes.detail':
      'Две группы по пять человек появляются на противоположных краях земли, и у каждой поблизости немного дичи.',
    'scenarios.wild-valley.title': 'Дикая долина',
    'scenarios.wild-valley.detail': 'По всей земле расселяются олени и кролики, а небо для начала ясное.',
    'scenarios.apocalypse.title': 'Апокалипсис',
    'scenarios.apocalypse.detail':
      'Над землёй разражается гроза, в центр падает метеорит, расползается мор, а по окраинам бродят зомби.',
    'scenarios.golden-age.title': 'Золотой век',
    'scenarios.golden-age.detail':
      'Ясное небо, изобилие еды и тёплое солнце над центром, а на доброй земле две семьи основывают свои племена.',
    'scenarios.tribal-war.title': 'Межплеменная война',
    'scenarios.tribal-war.detail':
      'Две семьи основывают враждующие племена по разные стороны земли, и боги стравливают их в войне.',
    'scenarios.island-survival.title': 'Выживание на острове',
    'scenarios.island-survival.detail':
      'Шестеро начинают в центре: вокруг бродят олени и кролики, а пить можно дождевую воду.',
    'scenarios.ice-age.title': 'Ледниковый период',
    'scenarios.ice-age.detail':
      'Идёт снег, центр накрывает буран, а небольшой группе людей и нескольким медведям предстоит это пережить.',

    // The status line while a scenario is placed.
    'scenarios.starting': '{title} · начинаем',
    'scenarios.done': '{title} · готово',
    'scenarios.partial': {
      one: '{title}: удалось {worked} из {n} шага',
      few: '{title}: удалось {worked} из {n} шагов',
      many: '{title}: удалось {worked} из {n} шагов',
      other: '{title}: удалось {worked} из {n} шага',
    },
  },
)
