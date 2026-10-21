import { t, tn } from '../../i18n'
import type { SandboxTool } from '../../simulation/sandbox'

/** One-line descriptions shown in dock tooltips, keyed by sandbox tool id. */
const TOOL_TIPS: Record<string, string> = {
  spawn1: t('tools.tip.spawn1'),
  spawn5: t('tools.tip.spawn5'),
  leader: t('tools.tip.leader'),
  cure_tribe: t('tools.tip.cure_tribe'),
  guardian: t('tools.tip.guardian'),
  clear_region: t('tools.tip.clear_region'),
  merge_tribes: t('tools.tip.merge_tribes'),
  split_tribe: t('tools.tip.split_tribe'),
  mutate: t('tools.tip.mutate'),
  teach_tribe: t('tools.tip.teach_tribe'),
  curse: t('tools.tip.curse'),
  heal_one: t('tools.tip.heal_one'),
  name: t('tools.tip.name'),
  marry: t('tools.tip.marry'),
  follow: t('tools.tip.follow'),
  gift_food: t('tools.tip.gift_food'),
  gift_tool: t('tools.tip.gift_tool'),
  teleport: t('tools.tip.teleport'),
  family: t('tools.tip.family'),
  heal: t('tools.tip.heal'),
  revive: t('tools.tip.revive'),
  smite: t('tools.tip.smite'),
  shelter: t('tools.tip.shelter'),
  road: t('tools.tip.road'),
  bridge: t('tools.tip.bridge'),
  road_erase: t('tools.tip.road_erase'),
  campfire: t('tools.tip.campfire'),
  grass: t('tools.tip.grass'),
  water: t('tools.tip.water'),
  rock: t('tools.tip.rock'),
  sand: t('tools.tip.sand'),
  snow: t('tools.tip.snow'),
  frost: t('tools.tip.frost'),
  lava: t('tools.tip.lava'),
  food: t('tools.tip.food'),
  drink: t('tools.tip.drink'),
  plant_crop: t('tools.tip.plant_crop'),
  plant_orchard: t('tools.tip.plant_orchard'),
  plant_sapling: t('tools.tip.plant_sapling'),
  plant_flowers: t('tools.tip.plant_flowers'),
  territory_map: t('tools.tip.territory_map'),
  settlement_map: t('tools.tip.settlement_map'),
  population_map: t('tools.tip.population_map'),
  hazard_map: t('tools.tip.hazard_map'),
  routes_map: t('tools.tip.routes_map'),
  migration_map: t('tools.tip.migration_map'),
  trade_map: t('tools.tip.trade_map'),
  fertility_map: t('tools.tip.fertility_map'),
  age_map: t('tools.tip.age_map'),
  threat_map: t('tools.tip.threat_map'),
  food_map: t('tools.tip.food_map'),
  wealth_map: t('tools.tip.wealth_map'),
  mood_map: t('tools.tip.mood_map'),
  names_view: t('tools.tip.names_view'),
  thoughts_view: t('tools.tip.thoughts_view'),
  animals_view: t('tools.tip.animals_view'),
  grid_view: t('tools.tip.grid_view'),
  plant_berry: t('tools.tip.plant_berry'),
  plant_mushroom: t('tools.tip.plant_mushroom'),
  fog: t('tools.tip.fog'),
  gale: t('tools.tip.gale'),
  snow_weather: t('tools.tip.snow_weather'),
  penguin: t('tools.tip.penguin'),
  camel: t('tools.tip.camel'),
  frog: t('tools.tip.frog'),
  whale: t('tools.tip.whale'),
  hail: t('tools.tip.hail'),
  nuke: t('tools.tip.nuke'),
  eclipse: t('tools.tip.eclipse'),
  bless_river: t('tools.tip.bless_river'),
  bless_forest: t('tools.tip.bless_forest'),
  talent: t('tools.tip.talent'),
  tribe_food: t('tools.tip.tribe_food'),
  tribe_tools: t('tools.tip.tribe_tools'),
  migrate_tribe: t('tools.tip.migrate_tribe'),
  trade_gift: t('tools.tip.trade_gift'),
  era_stone: t('tools.tip.era_stone'),
  era_bronze: t('tools.tip.era_bronze'),
  era_medieval: t('tools.tip.era_medieval'),
  era_modern: t('tools.tip.era_modern'),
  heat_wave: t('tools.tip.heat_wave'),
  monsoon: t('tools.tip.monsoon'),
  cold_snap: t('tools.tip.cold_snap'),
  aurora: t('tools.tip.aurora'),
  duck: t('tools.tip.duck'),
  bee: t('tools.tip.bee'),
  owl: t('tools.tip.owl'),
  eagle: t('tools.tip.eagle'),
  snake: t('tools.tip.snake'),
  crocodile: t('tools.tip.crocodile'),
  goat: t('tools.tip.goat'),
  elephant: t('tools.tip.elephant'),
  lion: t('tools.tip.lion'),
  zebra: t('tools.tip.zebra'),
  polar_bear: t('tools.tip.polar_bear'),
  boat: t('tools.tip.boat'),
  kangaroo: t('tools.tip.kangaroo'),
  monkey: t('tools.tip.monkey'),
  rain_patch: t('tools.tip.rain_patch'),
  comet: t('tools.tip.comet'),
  dice: t('tools.tip.dice'),
  dawn: t('tools.tip.dawn'),
  noon: t('tools.tip.noon'),
  dusk: t('tools.tip.dusk'),
  midnight: t('tools.tip.midnight'),
  tornado: t('tools.tip.tornado'),
  tsunami: t('tools.tip.tsunami'),
  locusts: t('tools.tip.locusts'),
  long_life: t('tools.tip.long_life'),
  courage: t('tools.tip.courage'),
  wildfire: t('tools.tip.wildfire'),
  plant_oak: t('tools.tip.plant_oak'),
  plant_pine: t('tools.tip.plant_pine'),
  plant_palm: t('tools.tip.plant_palm'),
  sunshine: t('tools.tip.sunshine'),
  restore: t('tools.tip.restore'),
  place_house: t('tools.tip.place_house'),
  place_library: t('tools.tip.place_library'),
  demolish: t('tools.tip.demolish'),
  repair: t('tools.tip.repair'),
  deer: t('tools.tip.deer'),
  rabbit: t('tools.tip.rabbit'),
  boar: t('tools.tip.boar'),
  wolf: t('tools.tip.wolf'),
  bird: t('tools.tip.bird'),
  fish: t('tools.tip.fish'),
  bear: t('tools.tip.bear'),
  sheep: t('tools.tip.sheep'),
  cow: t('tools.tip.cow'),
  horse: t('tools.tip.horse'),
  chicken: t('tools.tip.chicken'),
  fox: t('tools.tip.fox'),
  dog: t('tools.tip.dog'),
  cat: t('tools.tip.cat'),
  rain: t('tools.tip.rain'),
  storm: t('tools.tip.storm'),
  clear: t('tools.tip.clear'),
  drought_on: t('tools.tip.drought_on'),
  drought_off: t('tools.tip.drought_off'),
  fire: t('tools.tip.fire'),
  plague: t('tools.tip.plague'),
  poison: t('tools.tip.poison'),
  meteor: t('tools.tip.meteor'),
  earthquake: t('tools.tip.earthquake'),
  bless: t('tools.tip.bless'),
  inspire: t('tools.tip.inspire'),
  war: t('tools.tip.war'),
  peace: t('tools.tip.peace'),
  cure: t('tools.tip.cure'),
  harvest: t('tools.tip.harvest'),
  arm: t('tools.tip.arm'),
  bounty: t('tools.tip.bounty'),
  douse: t('tools.tip.douse'),
  banish: t('tools.tip.banish'),
  ward: t('tools.tip.ward'),
  frenzy: t('tools.tip.frenzy'),
  thunder: t('tools.tip.thunder'),
  blight: t('tools.tip.blight'),
  flood: t('tools.tip.flood'),
  blizzard: t('tools.tip.blizzard'),
  zombie: t('tools.tip.zombie'),
  demon: t('tools.tip.demon'),
  dragon: t('tools.tip.dragon'),
  alien: t('tools.tip.alien'),
  ufo: t('tools.tip.ufo'),
  biome_grassland: t('tools.tip.biome_grassland'),
  biome_forest: t('tools.tip.biome_forest'),
  biome_jungle: t('tools.tip.biome_jungle'),
  biome_savanna: t('tools.tip.biome_savanna'),
  biome_desert: t('tools.tip.biome_desert'),
  biome_badlands: t('tools.tip.biome_badlands'),
  biome_wetland: t('tools.tip.biome_wetland'),
  biome_tundra: t('tools.tip.biome_tundra'),
  biome_taiga: t('tools.tip.biome_taiga'),
  love: t('tools.tip.love'),
  tame: t('tools.tip.tame'),
  meteor_shower: t('tools.tip.meteor_shower'),
  volcano: t('tools.tip.volcano'),
}

export function toolTip(tool: SandboxTool): string {
  return TOOL_TIPS[tool.id] ?? tool.label
}

export function toolHowTo(tool: SandboxTool, brush = 0): string {
  if (tool.view) return t('tools.how.layer')
  if (tool.mode === 'instant') return t('tools.how.instant')
  return t('tools.how.point', { reach: toolReach(tool, brush) })
}

/**
 * What a point tool reaches at this brush size: its radius in tiles, and how many it brings when
 * it has a count (animals, people). Read from the command the tool builds, so it follows the
 * tool's own rule. Empty for tools that take no brush.
 */
export function toolReach(tool: SandboxTool, brush: number): string {
  if (!tool.build) return ''
  const cmd = tool.build(0, 0, brush) as { radius?: number; count?: number }
  const bits: string[] = []
  if (typeof cmd.radius === 'number') bits.push(tn('tools.how.reach', Math.round(cmd.radius)))
  // One animal per click is the norm and not worth saying; only a tool that brings several does.
  if (typeof cmd.count === 'number' && cmd.count > 1) bits.push(t('tools.how.brings', { n: cmd.count }))
  return bits.length ? `${bits.join(' · ')} · ` : ''
}

/** Why a tool did nothing when the simulation rejects it. */
export function toolFailure(tool: SandboxTool): string {
  switch (tool.id) {
    case 'spawn1':
    case 'spawn5':
      return t('tools.fail.full')
    case 'smite':
    case 'heal':
    case 'poison':
    case 'bless':
    case 'inspire':
    case 'cure':
    case 'arm':
    case 'bounty':
    case 'frenzy':
    case 'long_life':
    case 'love':
      return t('tools.fail.noOne')
    case 'courage':
      return t('tools.fail.noFear')
    case 'tame':
      return t('tools.fail.noBeasts')
    case 'banish':
      return t('tools.fail.nothingToBanish')
    case 'boat':
      return t('tools.fail.noShore')
    case 'revive':
      return t('tools.fail.noDead')
    case 'douse':
      return t('tools.fail.noFire')
    case 'thunder':
      return t('tools.fail.missed')
    case 'cure_tribe':
      return t('tools.fail.noSick')
    case 'guardian':
      return t('tools.fail.noOneToGuard')
    case 'clear_region':
      return t('tools.fail.nothingToClear')
    case 'rain_patch':
      return t('tools.fail.rainPatch')
    case 'merge_tribes':
      return t('tools.fail.twoTribes')
    case 'split_tribe':
      return t('tools.fail.split')
    case 'mutate':
    case 'curse':
      return t('tools.fail.noOneToChange')
    case 'teach_tribe':
      return t('tools.fail.teach')
    case 'nuke':
      return t('tools.fail.industrial')
    case 'eclipse':
      return t('tools.fail.noWitness')
    case 'aurora':
      return t('tools.fail.noWitnessLights')
    case 'comet':
      return t('tools.fail.noOneInReach')
    case 'hail':
    case 'harvest':
    case 'restore':
    case 'sunshine':
    case 'tornado':
    case 'tsunami':
    case 'locusts':
    case 'wildfire':
    case 'blight':
    case 'flood':
    case 'blizzard':
    case 'volcano':
    case 'meteor_shower':
      return t('tools.fail.nothingHere')
    case 'plant_mushroom':
      return t('tools.fail.mushrooms')
    case 'plant_palm':
      return t('tools.fail.palms')
    case 'frost':
      return t('tools.fail.noWater')
    case 'war':
    case 'peace':
      return t('tools.fail.needTribes')
    case 'deer':
    case 'rabbit':
    case 'boar':
    case 'wolf':
    case 'bird':
    case 'fish':
    case 'bear':
    case 'sheep':
    case 'cow':
    case 'horse':
    case 'chicken':
    case 'fox':
    case 'cat':
    case 'penguin':
    case 'camel':
    case 'frog':
    case 'whale':
    case 'dog':
    case 'zombie':
    case 'demon':
    case 'dragon':
    case 'alien':
    case 'ufo':
      return t('tools.fail.noGround')
    default:
      if (tool.id.startsWith('biome_')) return t('tools.fail.noLand')
      return t('tools.fail.other')
  }
}
