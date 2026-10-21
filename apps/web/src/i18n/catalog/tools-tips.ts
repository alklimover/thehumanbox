import { defineMessages } from '../define'

/** One-line descriptions of the dock's tools, shown in their tooltips; keyed by sandbox tool id. */
export const toolTips = defineMessages(
  {
    'tools.tip.spawn1':
      'Send one grown person. Beside a tribe they join it, as the man or woman it is missing.',
    'tools.tip.spawn5': 'Found a new tribe: five young adults, in couples, where you click.',
    'tools.tip.leader':
      'Crown the grown person nearest where you click the ruler of their tribe. They keep the crown while they live, unless their tribe has no ruler to crown (a plain band) or they are still a child.',
    'tools.tip.cure_tribe':
      'Cure the whole tribe of the person nearest where you click: every sick member of that tribe is cured and kept safe from the same sickness for a while, wherever they are.',
    'tools.tip.guardian':
      'A guardian dog appears beside the person nearest where you click and bonds to them, keeping to them the way a released dog does.',
    'tools.tip.clear_region':
      'Sweep the brush area clean: the people in it die (their kin grieve), the animals are swept away, and plantings and wild food are cleared. Buildings stay; demolish takes those.',
    'tools.tip.merge_tribes':
      'Two clicks: a person of one tribe, then a person of another. The second tribe joins the first, everyone in it.',
    'tools.tip.split_tribe':
      'Click a tribe where its people stand together: the ones near the click (the brush sets how many) found a new tribe of their own, with a new name.',
    'tools.tip.mutate':
      'Change the person nearest where you click: one of their traits (curiosity, aggression, fear, memory, sociability or resilience) jumps far beyond their people. The change is written into the chronicle.',
    'tools.tip.teach_tribe':
      'Teach the tribe of the person nearest where you click the next secret it still lacks for its age, so every grown member learns it. A tribe can be taught only now and then.',
    'tools.tip.curse':
      'Curse the person nearest where you click: bad luck hurts them, fear grips them and sickness takes hold. Only that one person.',
    'tools.tip.heal_one':
      'Heal the person nearest where you click: full health, and no infection or sickness. Only that one person.',
    'tools.tip.name': 'Click a person to give them a name of your own. It shows everywhere their name does.',
    'tools.tip.marry':
      'Click one grown person, then another of the other sex. If both are free to wed, they become partners and are ready for children.',
    'tools.tip.follow':
      'Keep the camera on the person nearest where you click. Click the map again to follow someone else.',
    'tools.tip.gift_food': 'Give the person nearest where you click a few portions of food for their pack.',
    'tools.tip.gift_tool':
      'Give the person nearest where you click a stone tool, so they can work and build.',
    'tools.tip.teleport':
      'Pick up the person nearest where you click and set them down there. Nobody is moved onto water or rock.',
    'tools.tip.family':
      'Found a new tribe with a family: a mother and a father who are partners, and two children, where you click.',
    'tools.tip.heal': 'Restore the health of every person and animal in the brush area.',
    'tools.tip.revive':
      'Raise someone who died within the last season, near where you click. Not the very old, and once per tribe per season.',
    'tools.tip.smite': 'Strike down the nearest person or animal inside the brush area.',
    'tools.tip.shelter': 'Build a hut on one tile.',
    'tools.tip.road':
      'Lay a road over open ground in the brush area: a dirt track, cobbled once the tribes reach the bronze age.',
    'tools.tip.bridge':
      'Lay a bridge across the river or lake in the brush area. People and caravans cross it; the deep water beside it stays closed to them.',
    'tools.tip.road_erase':
      'Clear the roads in the brush area. Only the road goes: the ground under it stays as it is.',
    'tools.tip.campfire': 'Light a campfire on one tile.',
    'tools.tip.grass': 'Paint grassland.',
    'tools.tip.water': 'Paint water.',
    'tools.tip.rock': 'Paint rock.',
    'tools.tip.sand': 'Paint sand.',
    'tools.tip.snow': 'Paint snow. On warm land it melts away again.',
    'tools.tip.frost':
      'Freeze the water in the brush area into ice: people can walk across it. It melts back to water when the warm seasons come.',
    'tools.tip.lava':
      'Paint molten rock. It runs downhill slowly, sets fire to what burns, kills whoever it touches, and cools to rock.',
    'tools.tip.food': 'Scatter food for humans and animals to gather.',
    'tools.tip.drink': 'Add fresh drinking water.',
    'tools.tip.plant_crop':
      'Sow a field in spring or summer. It ripens into grain and regrows after it is eaten. Nothing grows in winter, and a hard winter’s frost kills unripe fields.',
    'tools.tip.plant_orchard':
      'Plant fruit trees. Slow to grow, then they bear fruit again and again. They sleep through winter.',
    'tools.tip.plant_sapling':
      'Plant young trees that grow into a forest. Woods around a factory drink in its smoke.',
    'tools.tip.plant_flowers':
      'Plant flowers. They bloom through spring and summer, and people near them are happier.',
    'tools.tip.territory_map': 'Show the land each tribe claims.',
    'tools.tip.settlement_map': 'Highlight towns and buildings.',
    'tools.tip.population_map': 'Show where people crowd together.',
    'tools.tip.hazard_map': 'Show dangerous ground.',
    'tools.tip.routes_map': 'Show the paths people walk most.',
    'tools.tip.migration_map': 'Show where lineages have travelled over time.',
    'tools.tip.trade_map': 'Show or hide the trade roads, rails and caravans.',
    'tools.tip.fertility_map': 'Show how fertile the soil is.',
    'tools.tip.age_map': 'Colour people by age.',
    'tools.tip.threat_map': 'Show where predators and monsters threaten people.',
    'tools.tip.food_map': 'Show where food grows (green) and where food is carried along the paths (gold).',
    'tools.tip.wealth_map': 'Show where people carry the most goods and tools. Warmer gold means more.',
    'tools.tip.mood_map':
      'Show how people feel around each place: gold where they are content or joyful, red where they grieve, fear or are hungry.',
    'tools.tip.names_view': 'Show people’s names over their heads.',
    'tools.tip.thoughts_view': 'Show what people are thinking.',
    'tools.tip.animals_view': 'Show or hide animals on the map.',
    'tools.tip.grid_view': 'Draw the tile grid.',
    'tools.tip.plant_berry':
      'Plant berry bushes. They fruit, get picked, and fruit again. Asleep through winter.',
    'tools.tip.plant_mushroom':
      'Scatter mushrooms in the woods. They only take root in shade and come up fast in autumn.',
    'tools.tip.fog':
      'Roll in fog: damp, grey air for a while. The ground stays wet; no lightning and no snow.',
    'tools.tip.gale':
      'A gale: the wind turns to a random quarter and blows hard, carrying rain, smoke and fire before it.',
    'tools.tip.snow_weather':
      'Snow falls for a while. It settles on open ground, melts again on warm land, and chills anyone out in it.',
    'tools.tip.penguin':
      'Release a penguin, or a few, on snow or tundra. They huddle together and waddle across the ice, and keep clear of people.',
    'tools.tip.camel':
      'Release a camel, or a few, on desert or badlands. They are tough, need little food, and keep to the dry land.',
    'tools.tip.frog':
      'Release a frog, or a few, on wet ground near water, in wetland or jungle. Frogs are small game for wolves and bears.',
    'tools.tip.whale':
      'Release a whale, or a few, into deep water. They swim where the sea is and never come ashore.',
    'tools.tip.hail':
      'Hail beats down on the brush area. It flattens plantings and wild food, hurts the people under it (most at the centre), cracks roofs a little, and kills some small animals.',
    'tools.tip.nuke':
      'Drop a bomb where you click: a crater like a meteor leaves, fallout that poisons everyone across a wide ring, and blight on the plantings there. Only a tribe that has reached the Industrial age can build one.',
    'tools.tip.eclipse':
      'The sun goes dark for a while. Everyone alive is frightened and a little awed by it, and the omen is written into the chronicle.',
    'tools.tip.bless_river':
      'The river blesses the land: fish gather in the water nearest the point, as many as the brush brings. Needs water within reach.',
    'tools.tip.bless_forest':
      'A forest surges: wild food sprouts on the open ground among the trees, and the plantings there grow on. Needs woods within reach.',
    'tools.tip.talent':
      'A rare gift for the living person nearest the point: a talent that lifts one of their traits (memory, curiosity, resilience or kindness) for good. A person keeps one talent.',
    'tools.tip.tribe_food':
      'Every living member of the tribe nearest the click gets a portion of food, whether they are hungry or not.',
    'tools.tip.tribe_tools': 'Every living member of the tribe nearest the click is handed a stone tool.',
    'tools.tip.migrate_tribe':
      'The tribe nearest the click moves to it: its people are set down around the click, at once. The brush sets how far the tribe is found.',
    'tools.tip.trade_gift':
      'Two clicks: the tribe of the first sends food to the tribe of the second. Its people with food to spare each give a portion, and the other tribe warms toward it.',
    'tools.tip.era_stone':
      'A family settles where you click, already knowing what the stone age knew: the stone tools and the fire. A tribe of its own, with the discoveries of that age.',
    'tools.tip.era_bronze':
      'A family settles where you click, already knowing the stone and bronze ages: the tools, the metal and the trade that came with them.',
    'tools.tip.era_medieval':
      'A family settles where you click, already knowing the ages up to the medieval: the castles, the crafts and the learning of that time.',
    'tools.tip.era_modern':
      'A family settles where you click, already knowing the ages up to the modern: the railways, the factories and the science of today.',
    'tools.tip.heat_wave':
      'A heat wave settles over the land for a while. Shore water dries to sand, people drink more and tire sooner, and crops are held back. Calling it again starts the count over.',
    'tools.tip.monsoon':
      'Rain falls for days in a row, as heavy as the weather goes. Rivers rise and the land stays soaked; the sim does the rest.',
    'tools.tip.cold_snap':
      'A short, hard fall of snow. Everyone out in it is chilled, and it ends sooner than a snowfall does.',
    'tools.tip.aurora':
      'Lights dance across the night sky over the whole world. Everyone alive is awed and a little calmer, and the omen is written into the chronicle.',
    'tools.tip.duck':
      'Release a duck, or a few, on wet ground or grass. They flock together and waddle about, and keep clear of people.',
    'tools.tip.bee':
      'Release a bee, or a few, over the grass, forest or savanna. They hum over the flowers and keep clear of people.',
    'tools.tip.owl':
      'Release an owl, or a few, in the forest or taiga. They fly the woods and keep clear of people.',
    'tools.tip.eagle':
      'Release an eagle, or a few, over the badlands, tundra or grass. They circle high over the land and keep clear of people.',
    'tools.tip.snake':
      'Release a snake, or a few, over the sand, badlands or jungle. They slip about in the heat and keep clear of people.',
    'tools.tip.crocodile':
      'Release a crocodile into the wetlands or jungle. Hungry ones hunt the animals there, and people who wade too close, as a bear does.',
    'tools.tip.goat':
      'Release a goat, or a few, over the badlands or grass. They climb the rocks and keep clear of people.',
    'tools.tip.elephant':
      'Release an elephant, or a few, over the savanna or grass. They walk slowly and keep clear of people.',
    'tools.tip.lion':
      'Release a lion, or a few, over the savanna or grass. They hunt the herds, and when hungry they hunt people.',
    'tools.tip.zebra':
      'Release a zebra, or a few, over the savanna or grass. They graze the grass and run from predators.',
    'tools.tip.polar_bear':
      'Release a polar bear, or a few, over the tundra or taiga. They hunt seals and, when hungry, people.',
    'tools.tip.boat':
      "Set a boat on the water beside the shore. It moors there and fishes the coast by day, and it takes its hull from the nearest tribe's era.",
    'tools.tip.kangaroo':
      'Release a kangaroo, or a few, over the savanna, grass or badlands. They bound off and keep clear of people.',
    'tools.tip.monkey':
      'Release a monkey, or a few, into the jungle. They swing through the canopy and forage for fruit, and keep clear of people.',
    'tools.tip.rain_patch':
      'A rain cloud bursts over the brush area: fires in it go out (leaving ash), and the people in it drink from the rain. The brush sets how wide the patch is.',
    'tools.tip.comet':
      'A comet streaks across the sky over where you click. Everyone who can see it, within the reach, is awed; the awe lasts and the omen is written into the chronicle.',
    'tools.tip.dice':
      'Roll for fate: one random event lands at a random spot. It may bless, bring rain or a gale, or be a disaster such as a tornado, a wildfire or an earthquake.',
    'tools.tip.dawn':
      'Move the clock on to the next dawn. The world keeps its season and year; the light changes at once.',
    'tools.tip.noon': 'Move the clock on to the next noon, when the sun stands highest.',
    'tools.tip.dusk': 'Move the clock on to the next dusk, when the light goes and the night begins.',
    'tools.tip.midnight':
      'Move the clock on to the next middle of the night. Night is the time people walk home and sleep.',
    'tools.tip.tornado':
      'Send a tornado tearing along a random heading from the click. It wrecks buildings, strikes down the nearest people and animals in its funnel, and uproots every planting it passes.',
    'tools.tip.tsunami':
      'Send a wave out of the nearest sea up the coast and inland. Land it reaches floods and drains later; buildings near the shore are wrecked, people in the wave are hurt and land animals drown.',
    'tools.tip.locusts':
      'Send a swarm of locusts flying from the click. It strips crops and wild food along its path and halves what people carry; birds and chickens feast. It does not kill, but it leaves famine.',
    'tools.tip.long_life':
      'Give everyone in the brush area more years to live. Each blessing adds to the span the gods allot, up to a ceiling no natural birth reaches.',
    'tools.tip.courage':
      'Drain fear out of everyone in the brush area, so they stop running from what frightened them and hold their ground.',
    'tools.tip.wildfire':
      'Light a line of fire across the land at the click, driven by the wind. It catches burnable ground downwind and carries on through the woods; buildings in reach burn too.',
    'tools.tip.plant_oak': 'Plant oak saplings. They grow for a long time into a broadleaf forest.',
    'tools.tip.plant_pine':
      'Plant pine saplings. Slow to grow, but they keep growing through winter and make a taiga.',
    'tools.tip.plant_palm': 'Plant palms by the water. They take root only near it and grow into jungle.',
    'tools.tip.sunshine':
      'A bright spell over the fields in the brush area: growing crops, orchards and flowers gain a stretch of growth and ripen sooner.',
    'tools.tip.restore':
      'Erase your changes to the land in the brush area: water drains, fire and ash cool, and sand or snow goes back to what the biome holds. Rock and buildings stay.',
    'tools.tip.place_house':
      'Raise a finished house on the tiles where you click, if the ground is clear of water, rock and other buildings. Nobody owns it yet, so a family nearby can move in.',
    'tools.tip.place_library':
      'Raise a finished library where you click, if the ground is clear of water, rock and other buildings. It is unowned, so the first tribe nearby can take it.',
    'tools.tip.demolish':
      'Pull down the buildings in the brush area, and clear the huts and campfires there to grass. The people inside stay put.',
    'tools.tip.repair':
      'Bring every damaged or ruined building in the brush area back to full condition, at once.',
    'tools.tip.deer': 'Release a deer. Brush size releases more at once, each on ground it can use.',
    'tools.tip.rabbit': 'Release a rabbit. Brush size releases more at once, each on ground it can use.',
    'tools.tip.boar': 'Release a boar. Brush size releases more at once, each on ground it can use.',
    'tools.tip.wolf': 'Release a wolf. Brush size releases more at once, each on ground it can use.',
    'tools.tip.bird': 'Release a bird. Brush size releases more at once, each on ground it can use.',
    'tools.tip.fish': 'Release a fish. Brush size releases more at once, each on ground it can use.',
    'tools.tip.bear':
      'Release a bear. It hunts, and attacks people when hungry. Brush size releases more at once, each on ground it can use.',
    'tools.tip.sheep':
      'Release a sheep. Sheep graze and keep together. Brush size releases more at once, each on ground it can use.',
    'tools.tip.cow':
      'Release a cow. Slow, and a big meal for hunters. Brush size releases more at once, each on ground it can use.',
    'tools.tip.horse':
      'Release a horse. Fast and skittish. Brush size releases more at once, each on ground it can use.',
    'tools.tip.chicken': 'Release a chicken. Brush size releases more at once, each on ground it can use.',
    'tools.tip.fox':
      'Release a fox. Shy and quick: it keeps to woods and grassland, and wolves hunt it. Brush size releases more at once, each on ground it can use.',
    'tools.tip.dog':
      'Release a dog. One beside people bonds to the nearest of them: it takes a name, follows them about and keeps them company.',
    'tools.tip.cat':
      'Release a cat. It keeps to itself, slips away from people, and lives anywhere on land. Brush size releases more at once, each on ground it can use.',
    'tools.tip.rain': 'Start rain. Helps dry land recover.',
    'tools.tip.storm': 'Summon a storm. Drains energy and can strike with lightning.',
    'tools.tip.clear': 'Clear the skies.',
    'tools.tip.drought_on': 'Start a drought. Water shrinks and thirst rises.',
    'tools.tip.drought_off': 'End the drought.',
    'tools.tip.fire':
      'Set the brush area ablaze. Fire spreads to nearby flammable land; the ash it leaves grows back richer.',
    'tools.tip.plague': 'Start an outbreak that spreads through close contact.',
    'tools.tip.poison': 'Sicken everyone inside the brush area.',
    'tools.tip.meteor':
      'Crash a meteor. Kills everything it hits and leaves a burning crater, with ore in its floor to mine.',
    'tools.tip.earthquake': 'Shake the land. Cracks the ground, damages buildings and hurts people.',
    'tools.tip.bless': 'Heal and cheer everyone in the brush area.',
    'tools.tip.inspire': 'Teach everyone in the brush area something new and raise their literacy.',
    'tools.tip.war': 'Turn the two tribes nearest the click against each other.',
    'tools.tip.peace': 'Make the two tribes nearest the click friends.',
    'tools.tip.cure': 'End every sickness across a wide area and keep people safe from it for a while.',
    'tools.tip.harvest': 'Make the land fertile and grow food across it.',
    'tools.tip.arm': 'Teach the adults in the brush area to make and use weapons, so they can fight back.',
    'tools.tip.bounty': 'Fill everyone’s packs with food, wood and stone.',
    'tools.tip.douse': 'Put out every fire in the brush area.',
    'tools.tip.banish': 'Destroy every monster and predator in the brush area.',
    'tools.tip.ward':
      'Ward a place for a season: no raid or battle begins inside, beasts will not strike there, and no sickness spreads.',
    'tools.tip.frenzy': 'Turn neighbours on each other. Everyone in the brush area gets hurt.',
    'tools.tip.thunder': 'Rain lightning across the brush area. Strikes people, animals and dry grass.',
    'tools.tip.blight': 'Rot the crops, spoil the food people carry and sour the soil for years.',
    'tools.tip.flood':
      'Drown the land: a lake in the middle, flooded ground around it. The water drains and leaves rich silt.',
    'tools.tip.blizzard':
      'Bury the land in snow and chill everyone caught in it. The snow melts as the land warms.',
    'tools.tip.zombie': 'Raise a zombie. Its victims rise as zombies too.',
    'tools.tip.demon': 'Summon a demon. It scorches the ground and sets fires as it hunts.',
    'tools.tip.dragon': 'Summon a dragon. It flies, breathes fire, and takes an army to kill.',
    'tools.tip.alien': 'Drop an alien. It zaps people from a distance.',
    'tools.tip.ufo': 'Send a UFO. It abducts people for a while, then leaves.',
    'tools.tip.biome_grassland': 'Paint open meadow: grass and the odd tree.',
    'tools.tip.biome_forest': 'Paint forest: trees, wood and plenty of food.',
    'tools.tip.biome_jungle': 'Paint jungle: a dense canopy and the most food of any land.',
    'tools.tip.biome_savanna': 'Paint savanna: golden grass and flat-topped acacias.',
    'tools.tip.biome_desert': 'Paint desert: sand, cactus and little to eat.',
    'tools.tip.biome_badlands': 'Paint badlands: red rock pillars and dust.',
    'tools.tip.biome_wetland': 'Paint wetland: reeds, marsh and good soil.',
    'tools.tip.biome_tundra': 'Paint tundra: cold, snowy, and hard to live on.',
    'tools.tip.biome_taiga': 'Paint taiga: snowy pine forest.',
    'tools.tip.love': 'Single adults pair up and feel ready for children.',
    'tools.tip.tame': 'Turn wolves and bears into loyal dogs bonded to the nearest person.',
    'tools.tip.meteor_shower': 'Rain several small meteors across the brush area.',
    'tools.tip.volcano':
      'Raise a volcano: a burning crater, a rock cone and an ash apron that weathers into the richest soil. Kills anyone where it rises.',
  },
  {
    'tools.tip.spawn1':
      'Пошлите одного взрослого. Рядом с племенем он вольётся в него — мужчиной или женщиной, смотря кого там не хватает.',
    'tools.tip.spawn5':
      'Основайте новое племя там, где щёлкнете: пятеро молодых взрослых, разбившихся на пары.',
    'tools.tip.leader':
      'Коронуйте взрослого, ближайшего к месту щелчка: он станет правителем своего племени и сохранит корону до конца жизни. Не выйдет, если у его племени не бывает правителя (это простая община) или если это ещё ребёнок.',
    'tools.tip.cure_tribe':
      'Исцелите всё племя человека, ближайшего к месту щелчка: все больные этого племени, где бы они ни были, выздоровеют и на время станут невосприимчивы к той же болезни.',
    'tools.tip.guardian':
      'Рядом с человеком, ближайшим к месту щелчка, появится пёс-хранитель. Он привяжется к нему и будет держаться рядом, как любая выпущенная собака.',
    'tools.tip.clear_region':
      'Очистите всё в области кисти: люди в ней погибнут (их родные будут скорбеть), животных сметёт, а посадки и дикая еда исчезнут. Постройки останутся — для них есть «снос».',
    'tools.tip.merge_tribes':
      'Два щелчка: сначала по человеку из одного племени, затем — из другого. Второе племя целиком вольётся в первое.',
    'tools.tip.split_tribe':
      'Щёлкните по племени там, где его люди стоят вместе: те, кто рядом с местом щелчка (сколько их — зависит от кисти), отделятся и основают своё племя с новым именем.',
    'tools.tip.mutate':
      'Измените человека, ближайшего к месту щелчка: одна из черт его характера (любопытство, агрессивность, страх, память, общительность или стойкость) резко скакнёт, намного обогнав соплеменников. Перемена попадёт в летопись.',
    'tools.tip.teach_tribe':
      'Откройте племени человека, ближайшего к месту щелчка, следующий секрет его эпохи, которого оно ещё не знает, — его узнают все взрослые. Учить племя можно лишь время от времени.',
    'tools.tip.curse':
      'Прокляните человека, ближайшего к месту щелчка: на него обрушатся несчастья, его охватит страх и одолеет болезнь. Только его одного.',
    'tools.tip.heal_one':
      'Исцелите человека, ближайшего к месту щелчка: полное здоровье, никаких заражений и болезней. Только его одного.',
    'tools.tip.name':
      'Щёлкните по человеку, чтобы дать ему имя по своему выбору. Оно заменит прежнее везде, где показывается имя.',
    'tools.tip.marry':
      'Щёлкните по одному взрослому, затем по другому — противоположного пола. Если оба свободны, они вступят в брак и будут готовы завести детей.',
    'tools.tip.follow':
      'Следите камерой за человеком, ближайшим к месту щелчка. Щёлкните по карте ещё раз, чтобы следить за кем-то другим.',
    'tools.tip.gift_food':
      'Дайте человеку, ближайшему к месту щелчка, несколько порций еды в заплечный мешок.',
    'tools.tip.gift_tool':
      'Дайте человеку, ближайшему к месту щелчка, каменное орудие, чтобы он мог работать и строить.',
    'tools.tip.teleport':
      'Перенесите человека, ближайшего к месту щелчка, прямо в эту точку. На воду и скалы никого не перенести.',
    'tools.tip.family':
      'Основайте там, где щёлкнете, новое племя из одной семьи: мать и отец (они супруги) и двое детей.',
    'tools.tip.heal': 'Верните здоровье всем людям и животным в области кисти.',
    'tools.tip.revive':
      'Воскресите того, кто умер рядом с местом щелчка за последнее время года. Глубоких стариков не воскресить, и в каждом племени — лишь одного за время года.',
    'tools.tip.smite': 'Поразите ближайшего человека или зверя в области кисти.',
    'tools.tip.shelter': 'Постройте хижину на одной клетке.',
    'tools.tip.road':
      'Проложите дорогу по открытой земле в области кисти: грунтовую, а когда племена дойдут до бронзового века, — мощёную.',
    'tools.tip.bridge':
      'Перекиньте мост через реку или озеро в области кисти. По нему пройдут люди и караваны, а глубокая вода рядом так и останется для них непроходимой.',
    'tools.tip.road_erase':
      'Уберите дороги в области кисти. Исчезнет только дорога, земля под ней останется прежней.',
    'tools.tip.campfire': 'Разожгите костёр на одной клетке.',
    'tools.tip.grass': 'Рисуйте траву.',
    'tools.tip.water': 'Рисуйте воду.',
    'tools.tip.rock': 'Рисуйте камень.',
    'tools.tip.sand': 'Рисуйте песок.',
    'tools.tip.snow': 'Рисуйте снег. На тёплой земле он снова растает.',
    'tools.tip.frost':
      'Скуйте льдом воду в области кисти: по нему можно будет ходить. С приходом тёплых времён года лёд снова растает.',
    'tools.tip.lava':
      'Рисуйте раскалённую лаву. Она медленно стекает под уклон, поджигает всё, что горит, убивает всех, кого коснётся, и застывает камнем.',
    'tools.tip.food': 'Разбросайте еду — люди и животные её соберут.',
    'tools.tip.drink': 'Добавьте свежей питьевой воды.',
    'tools.tip.plant_crop':
      'Засейте поле весной или летом. Оно созреет зерном и снова отрастёт, когда урожай съедят. Зимой ничего не растёт, а суровые зимние морозы губят недозревшие поля.',
    'tools.tip.plant_orchard':
      'Посадите фруктовые деревья. Растут они медленно, зато потом плодоносят снова и снова. Зимой они спят.',
    'tools.tip.plant_sapling':
      'Посадите молодые деревья — со временем они вырастут в лес. Лес вокруг фабрики поглощает её дым.',
    'tools.tip.plant_flowers':
      'Посадите цветы. Они цветут всю весну и лето, а людям рядом с ними живётся веселее.',
    'tools.tip.territory_map': 'Покажите, какие земли считает своими каждое племя.',
    'tools.tip.settlement_map': 'Выделите поселения и постройки.',
    'tools.tip.population_map': 'Покажите, где люди живут теснее всего.',
    'tools.tip.hazard_map': 'Покажите опасные места.',
    'tools.tip.routes_map': 'Покажите тропы, по которым люди ходят чаще всего.',
    'tools.tip.migration_map': 'Покажите, куда переселялись племена с течением времени.',
    'tools.tip.trade_map': 'Покажите или скройте торговые пути, железные дороги и караваны.',
    'tools.tip.fertility_map': 'Покажите, насколько плодородна почва.',
    'tools.tip.age_map': 'Раскрасьте людей по возрасту.',
    'tools.tip.threat_map': 'Покажите, где людям грозят хищники и чудовища.',
    'tools.tip.food_map': 'Покажите, где растёт еда (зелёным) и где её носят по тропам (золотым).',
    'tools.tip.wealth_map':
      'Покажите, где у людей больше всего добра и орудий. Чем теплее золото, тем богаче.',
    'tools.tip.mood_map':
      'Покажите, как чувствуют себя люди в разных местах: золотым — где они довольны или радостны, красным — где скорбят, боятся или голодают.',
    'tools.tip.names_view': 'Покажите имена людей над их головами.',
    'tools.tip.thoughts_view': 'Покажите, о чём думают люди.',
    'tools.tip.animals_view': 'Покажите или скройте животных на карте.',
    'tools.tip.grid_view': 'Покажите сетку клеток.',
    'tools.tip.plant_berry':
      'Посадите ягодные кусты. Ягоды созревают, их собирают, и они созревают снова. Зимой кусты спят.',
    'tools.tip.plant_mushroom':
      'Рассыпьте грибы по лесу. Они приживаются только в тени и быстро растут осенью.',
    'tools.tip.fog':
      'Напустите туман: на время воздух станет сырым и серым. Земля не просыхает; ни молний, ни снега не будет.',
    'tools.tip.gale':
      'Шквал: ветер поворачивает в случайную сторону и дует изо всех сил, неся перед собой дождь, дым и огонь.',
    'tools.tip.snow_weather':
      'На время пойдёт снег. Он ложится на открытую землю, на тёплой снова тает и пробирает холодом всех, кто оказался под ним.',
    'tools.tip.penguin':
      'Выпустите пингвина, а то и нескольких, на снег или в тундру. Они жмутся друг к другу, вперевалку бродят по льду и держатся подальше от людей.',
    'tools.tip.camel':
      'Выпустите верблюда, а то и нескольких, в пустыню или на бесплодные земли. Они выносливы, едят мало и держатся сухих мест.',
    'tools.tip.frog':
      'Выпустите лягушку, а то и нескольких, на сырую землю у воды, в болото или джунгли. Для волков и медведей лягушки — мелкая добыча.',
    'tools.tip.whale':
      'Выпустите кита, а то и нескольких, в глубокую воду. Они плавают там, где море, и никогда не выходят на берег.',
    'tools.tip.hail':
      'На область кисти обрушится град. Он побьёт посадки и дикую еду, ранит людей под ним (сильнее всего — в центре), слегка повредит крыши и убьёт часть мелких животных.',
    'tools.tip.nuke':
      'Сбросьте бомбу туда, где щёлкнете: останется воронка, как от метеорита, радиоактивные осадки отравят всех в широком кольце, а посадки там поразит порча. Создать такую может лишь племя, дошедшее до индустриальной эпохи.',
    'tools.tip.eclipse':
      'Солнце ненадолго меркнет. Все живые напуганы и невольно благоговеют, а знамение попадает в летопись.',
    'tools.tip.bless_river':
      'Река одаривает землю: в воде у выбранной точки собирается рыба — столько, сколько позволяет кисть. Нужна вода поблизости.',
    'tools.tip.bless_forest':
      'Лес наливается силой: на полянах среди деревьев прорастает дикая еда, а посадки там подрастают. Нужен лес поблизости.',
    'tools.tip.talent':
      'Редкий дар живому человеку, ближайшему к выбранной точке: талант навсегда усиливает одну из черт его характера (память, любопытство, стойкость или доброту). Талант у человека может быть только один.',
    'tools.tip.tribe_food':
      'Каждый живой член племени, ближайшего к месту щелчка, получит порцию еды — голоден он или нет.',
    'tools.tip.tribe_tools': 'Каждый живой член племени, ближайшего к месту щелчка, получит каменное орудие.',
    'tools.tip.migrate_tribe':
      'Племя, ближайшее к месту щелчка, переселяется туда: его люди мгновенно оказываются вокруг этой точки. Кисть задаёт, как далеко искать племя.',
    'tools.tip.trade_gift':
      'Два щелчка: племя первого человека отправит еду племени второго. Каждый, у кого есть лишняя еда, отдаст по порции, и второе племя проникнется к первому теплом.',
    'tools.tip.era_stone':
      'Там, где вы щёлкнете, поселится семья, которая уже знает всё, что знал каменный век: каменные орудия и огонь. Это отдельное племя со всеми открытиями той эпохи.',
    'tools.tip.era_bronze':
      'Там, где вы щёлкнете, поселится семья, которой уже известны каменный и бронзовый века: орудия, металл и торговля, что пришли вместе с ними.',
    'tools.tip.era_medieval':
      'Там, где вы щёлкнете, поселится семья, которой уже известны все эпохи вплоть до средневековья: замки, ремёсла и учёность того времени.',
    'tools.tip.era_modern':
      'Там, где вы щёлкнете, поселится семья, которой уже известны все эпохи вплоть до современности: железные дороги, фабрики и нынешняя наука.',
    'tools.tip.heat_wave':
      'На землю ненадолго опускается зной. Вода у берегов пересыхает до песка, люди больше пьют и быстрее устают, посевы растут медленнее. Если вызвать зной снова, отсчёт начнётся заново.',
    'tools.tip.monsoon':
      'Дождь льёт несколько дней подряд — сильнее не бывает. Реки поднимаются, земля не просыхает, а остальное сделает симуляция.',
    'tools.tip.cold_snap':
      'Короткий, но сильный снегопад. Всех, кто под открытым небом, пробирает холод, а кончается он быстрее обычного снегопада.',
    'tools.tip.aurora':
      'По ночному небу над всем миром пляшут огни. Все живые охвачены благоговением и немного успокаиваются, а знамение попадает в летопись.',
    'tools.tip.duck':
      'Выпустите утку, а то и нескольких, на сырую землю или траву. Они сбиваются в стайку, ходят вперевалку и держатся подальше от людей.',
    'tools.tip.bee':
      'Выпустите пчелу, а то и нескольких, над травой, лесом или саванной. Они жужжат над цветами и держатся подальше от людей.',
    'tools.tip.owl':
      'Выпустите сову, а то и нескольких, в лес или тайгу. Они летают по лесу и держатся подальше от людей.',
    'tools.tip.eagle':
      'Выпустите орла, а то и нескольких, над бесплодными землями, тундрой или травой. Они кружат высоко над землёй и держатся подальше от людей.',
    'tools.tip.snake':
      'Выпустите змею, а то и нескольких, на песок, бесплодные земли или в джунгли. Они скользят по раскалённой земле и держатся подальше от людей.',
    'tools.tip.crocodile':
      'Выпустите крокодила в болото или джунгли. Голодные крокодилы, как и медведи, охотятся на тамошних животных и на людей, которые слишком близко подойдут к воде.',
    'tools.tip.goat':
      'Выпустите козу, а то и нескольких, на бесплодные земли или траву. Они лазают по скалам и держатся подальше от людей.',
    'tools.tip.elephant':
      'Выпустите слона, а то и нескольких, в саванну или на траву. Они ходят неторопливо и держатся подальше от людей.',
    'tools.tip.lion':
      'Выпустите льва, а то и нескольких, в саванну или на траву. Они охотятся на стада, а оголодав — и на людей.',
    'tools.tip.zebra':
      'Выпустите зебру, а то и нескольких, в саванну или на траву. Они щиплют траву и убегают от хищников.',
    'tools.tip.polar_bear':
      'Выпустите белого медведя, а то и нескольких, в тундру или тайгу. Они охотятся на тюленей, а оголодав — и на людей.',
    'tools.tip.boat':
      'Спустите лодку на воду у берега. Она встанет там на якорь и днём будет рыбачить у побережья, а корпус её зависит от эпохи ближайшего племени.',
    'tools.tip.kangaroo':
      'Выпустите кенгуру, а то и нескольких, в саванну, на траву или бесплодные земли. Они уносятся прыжками и держатся подальше от людей.',
    'tools.tip.monkey':
      'Выпустите обезьяну, а то и нескольких, в джунгли. Они качаются на ветвях, ищут фрукты и держатся подальше от людей.',
    'tools.tip.rain_patch':
      'Над областью кисти прорывается туча: пожары под ней гаснут (остаётся пепел), а люди напиваются дождевой водой. Кисть задаёт, насколько широк ливень.',
    'tools.tip.comet':
      'Над местом щелчка по небу проносится комета. Все, кто видит её в пределах охвата, надолго исполняются благоговения, а знамение попадает в летопись.',
    'tools.tip.dice':
      'Бросьте жребий: где-нибудь в мире произойдёт случайное событие. Это может быть благословение, дождь или шквал — а может, и бедствие: смерч, пожар или землетрясение.',
    'tools.tip.dawn':
      'Переведите часы на ближайший рассвет. Время года и год не меняются, а освещение меняется сразу.',
    'tools.tip.noon': 'Переведите часы на ближайший полдень, когда солнце стоит выше всего.',
    'tools.tip.dusk': 'Переведите часы на ближайший закат, когда свет угасает и начинается ночь.',
    'tools.tip.midnight': 'Переведите часы на ближайшую полночь. Ночью люди расходятся по домам и спят.',
    'tools.tip.tornado':
      'Пошлите от места щелчка смерч в случайном направлении. Он крушит постройки, убивает ближайших людей и животных, попавших в его воронку, и вырывает с корнем все посадки на своём пути.',
    'tools.tip.tsunami':
      'Пошлите волну из ближайшего моря на побережье и вглубь суши. Затопленная земля потом осушится; постройки у берега будут разрушены, люди в волне ранены, а сухопутные животные утонут.',
    'tools.tip.locusts':
      'Выпустите от места щелчка тучу саранчи. Она объедает посевы и дикую еду на своём пути и вдвое уменьшает запасы у людей, а птицы и куры пируют. Саранча не убивает, но оставляет после себя голод.',
    'tools.tip.long_life':
      'Подарите всем в области кисти лишние годы жизни. Каждое благословение удлиняет отпущенный богами срок — вплоть до предела, которого не достичь никому из рождённых.',
    'tools.tip.courage':
      'Изгоните страх из всех в области кисти: они перестанут бежать от того, что их пугало, и будут стоять на своём.',
    'tools.tip.wildfire':
      'Подожгите в месте щелчка полосу огня, которую гонит ветер. По ветру она перекидывается на всё, что может гореть, и идёт дальше через леса; постройки на её пути тоже сгорают.',
    'tools.tip.plant_oak': 'Посадите саженцы дуба. Они долго растут и превращаются в широколиственный лес.',
    'tools.tip.plant_pine':
      'Посадите саженцы сосны. Растут они медленно, зато не останавливаются и зимой и превращаются в тайгу.',
    'tools.tip.plant_palm':
      'Посадите пальмы у воды. Они приживаются только рядом с ней и разрастаются в джунгли.',
    'tools.tip.sunshine':
      'Над полями в области кисти ненадолго выглянет яркое солнце: посевы, сады и цветы подрастут и раньше созреют.',
    'tools.tip.restore':
      'Сотрите свои изменения земли в области кисти: вода уходит, огонь и пепел остывают, а песок и снег сменяются тем, что свойственно ландшафту. Скалы и постройки остаются.',
    'tools.tip.place_house':
      'Возведите готовый дом там, где щёлкнете, если на этих клетках нет воды, скал и других построек. Он пока ничей, так что в него может въехать семья поблизости.',
    'tools.tip.place_library':
      'Возведите готовую библиотеку там, где щёлкнете, если там нет воды, скал и других построек. Она ничья, и её может занять первое племя поблизости.',
    'tools.tip.demolish':
      'Снесите постройки в области кисти, а хижины и костры там замените травой. Люди внутри останутся на месте.',
    'tools.tip.repair': 'Мгновенно восстановите все повреждённые и разрушенные постройки в области кисти.',
    'tools.tip.deer':
      'Выпустите оленя. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.rabbit':
      'Выпустите кролика. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.boar':
      'Выпустите кабана. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.wolf':
      'Выпустите волка. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.bird':
      'Выпустите птицу. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.fish':
      'Выпустите рыбу. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.bear':
      'Выпустите медведя. Он охотится, а оголодав, нападает на людей. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.sheep':
      'Выпустите овцу. Овцы пасутся и держатся стадом. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.cow':
      'Выпустите корову. Она медлительна, и для охотников это сытная добыча. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.horse':
      'Выпустите лошадь. Быстрая и пугливая. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.chicken':
      'Выпустите курицу. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.fox':
      'Выпустите лису. Пугливая и быстрая, она держится лесов и лугов, а волки на неё охотятся. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.dog':
      'Выпустите собаку. Если рядом есть люди, она привяжется к ближайшему: получит кличку, будет ходить за ним по пятам и составит ему компанию.',
    'tools.tip.cat':
      'Выпустите кошку. Она гуляет сама по себе, ускользает от людей и живёт где угодно на суше. С кистью побольше выпустите сразу нескольких, каждого — на подходящую ему землю.',
    'tools.tip.rain': 'Вызовите дождь. Он помогает иссохшей земле ожить.',
    'tools.tip.storm': 'Вызовите грозу. Она отнимает силы и может ударить молнией.',
    'tools.tip.clear': 'Разгоните тучи.',
    'tools.tip.drought_on': 'Нашлите засуху. Воды становится меньше, жажда растёт.',
    'tools.tip.drought_off': 'Прекратите засуху.',
    'tools.tip.fire':
      'Подожгите область кисти. Огонь перекидывается на всё горючее поблизости, а на пепелище всё отрастает пышнее.',
    'tools.tip.plague': 'Вызовите вспышку болезни, которая передаётся при тесном контакте.',
    'tools.tip.poison': 'Отравите всех в области кисти: они заболеют.',
    'tools.tip.meteor':
      'Обрушьте метеорит. Он убивает всё, во что попадёт, и оставляет пылающий кратер, на дне которого можно добывать руду.',
    'tools.tip.earthquake':
      'Встряхните землю. Земля трескается, постройки разрушаются, люди получают ранения.',
    'tools.tip.bless': 'Исцелите и порадуйте всех в области кисти.',
    'tools.tip.inspire': 'Научите всех в области кисти чему-то новому и повысьте их грамотность.',
    'tools.tip.war': 'Натравите друг на друга два племени, ближайших к месту щелчка.',
    'tools.tip.peace': 'Помирите два племени, ближайших к месту щелчка.',
    'tools.tip.cure': 'Излечите все болезни на обширной территории и на время защитите от них людей.',
    'tools.tip.harvest': 'Сделайте землю плодородной и вырастите на ней еду.',
    'tools.tip.arm':
      'Научите взрослых в области кисти делать оружие и владеть им, чтобы они могли дать отпор.',
    'tools.tip.bounty': 'Набейте заплечные мешки всех едой, древесиной и камнем.',
    'tools.tip.douse': 'Потушите все пожары в области кисти.',
    'tools.tip.banish': 'Уничтожьте всех чудовищ и хищников в области кисти.',
    'tools.tip.ward':
      'Защитите место оберегом на одно время года: здесь не начнётся ни набег, ни битва, звери не нападут и болезни не распространятся.',
    'tools.tip.frenzy': 'Стравите соседей друг с другом. Пострадают все в области кисти.',
    'tools.tip.thunder': 'Обрушьте молнии на область кисти. Они бьют в людей, животных и сухую траву.',
    'tools.tip.blight': 'Сгноите посевы, испортите еду, которую несут люди, и отравите почву на годы вперёд.',
    'tools.tip.flood':
      'Затопите землю: в середине — озеро, вокруг — залитая земля. Вода сойдёт и оставит плодородный ил.',
    'tools.tip.blizzard':
      'Засыпьте землю снегом и проморозьте всех, кого застал буран. Снег растает, когда земля прогреется.',
    'tools.tip.zombie': 'Поднимите зомби. Его жертвы тоже восстают зомби.',
    'tools.tip.demon': 'Призовите демона. Охотясь, он выжигает землю и устраивает пожары.',
    'tools.tip.dragon': 'Призовите дракона. Он летает, дышит огнём, и чтобы его убить, нужна целая армия.',
    'tools.tip.alien': 'Высадите пришельца. Он поражает людей лучом издалека.',
    'tools.tip.ufo': 'Пошлите НЛО. Какое-то время он похищает людей, а потом улетает.',
    'tools.tip.biome_grassland': 'Рисуйте открытый луг: трава и редкие деревья.',
    'tools.tip.biome_forest': 'Рисуйте лес: деревья, древесина и вдоволь еды.',
    'tools.tip.biome_jungle': 'Рисуйте джунгли: густой полог листвы и больше еды, чем где-либо ещё.',
    'tools.tip.biome_savanna': 'Рисуйте саванну: золотистая трава и акации с плоскими кронами.',
    'tools.tip.biome_desert': 'Рисуйте пустыню: песок, кактусы и почти никакой еды.',
    'tools.tip.biome_badlands': 'Рисуйте бесплодные земли: столбы красного камня и пыль.',
    'tools.tip.biome_wetland': 'Рисуйте болото: камыш, топь и хорошая почва.',
    'tools.tip.biome_tundra': 'Рисуйте тундру: холодно, снежно, и жить там трудно.',
    'tools.tip.biome_taiga': 'Рисуйте тайгу: заснеженный сосновый лес.',
    'tools.tip.love': 'Одинокие взрослые находят себе пару и готовы завести детей.',
    'tools.tip.tame': 'Превратите волков и медведей в верных собак, привязанных к ближайшему человеку.',
    'tools.tip.meteor_shower': 'Пролейте на область кисти дождь из мелких метеоритов.',
    'tools.tip.volcano':
      'Воздвигните вулкан: пылающий кратер, каменный конус и пепельный шлейф вокруг, который со временем становится богатейшей почвой. Все, кто окажется на месте вулкана, погибнут.',
  },
)
