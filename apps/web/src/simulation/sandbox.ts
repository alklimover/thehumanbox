import { t } from '../i18n'

export type SandboxCommand =
  | { cmd: 'spawn'; x: number; y: number; count?: number; lineage?: string }
  | { cmd: 'smite'; x: number; y: number; radius?: number }
  | { cmd: 'heal'; x: number; y: number; radius?: number }
  | { cmd: 'paint'; x: number; y: number; tile: string; radius?: number }
  | { cmd: 'ignite'; x: number; y: number; radius?: number }
  | { cmd: 'weather'; kind: 'clear' | 'rain' | 'storm' | 'snow' | 'fog' | 'monsoon' | 'cold_snap' }
  | { cmd: 'gale' }
  | { cmd: 'tornado'; x: number; y: number; radius?: number }
  | { cmd: 'tsunami'; x: number; y: number; radius?: number }
  | { cmd: 'locusts'; x: number; y: number; radius?: number }
  | { cmd: 'long_life'; x: number; y: number; radius?: number }
  | { cmd: 'courage'; x: number; y: number; radius?: number }
  | { cmd: 'wildfire'; x: number; y: number; radius?: number }
  | { cmd: 'sunshine'; x: number; y: number; radius?: number }
  | { cmd: 'drought'; active: boolean }
  | { cmd: 'outbreak'; count?: number }
  | { cmd: 'restore'; x: number; y: number; radius?: number }
  | { cmd: 'spawn_animal'; x: number; y: number; kind?: string; count?: number; radius?: number }
  | { cmd: 'poison'; x: number; y: number; radius?: number }
  | { cmd: 'meteor'; x: number; y: number; radius?: number }
  | { cmd: 'bless'; x: number; y: number; radius?: number }
  | { cmd: 'inspire'; x: number; y: number; radius?: number }
  | { cmd: 'earthquake'; x: number; y: number; radius?: number }
  | { cmd: 'war'; x: number; y: number }
  | { cmd: 'peace'; x: number; y: number }
  | { cmd: 'harvest'; x: number; y: number; radius?: number }
  | { cmd: 'cure'; x: number; y: number; radius?: number }
  | { cmd: 'arm'; x: number; y: number; radius?: number }
  | { cmd: 'bounty'; x: number; y: number; radius?: number }
  | { cmd: 'douse'; x: number; y: number; radius?: number }
  | { cmd: 'banish'; x: number; y: number; radius?: number }
  | { cmd: 'revive'; x: number; y: number }
  | { cmd: 'rename_tribe'; lineage: string; name: string }
  | { cmd: 'teach'; lineage: string }
  | { cmd: 'ward'; x: number; y: number; radius?: number }
  | { cmd: 'blight'; x: number; y: number; radius?: number }
  | { cmd: 'frenzy'; x: number; y: number; radius?: number }
  | { cmd: 'flood'; x: number; y: number; radius?: number }
  | { cmd: 'blizzard'; x: number; y: number; radius?: number }
  | { cmd: 'freeze'; x: number; y: number; radius?: number }
  | { cmd: 'thunder'; x: number; y: number; radius?: number }
  | { cmd: 'paint_biome'; x: number; y: number; biome: string; radius?: number }
  | {
      cmd: 'plant'
      x: number
      y: number
      kind: 'crop' | 'orchard' | 'sapling' | 'flowers' | 'berry' | 'mushroom' | 'oak' | 'pine' | 'palm'
      radius?: number
    }
  | { cmd: 'volcano'; x: number; y: number; radius?: number }
  | { cmd: 'meteor_shower'; x: number; y: number; radius?: number }
  | { cmd: 'love'; x: number; y: number; radius?: number }
  | { cmd: 'marry'; ax: number; ay: number; bx: number; by: number }
  | { cmd: 'merge_tribes'; ax: number; ay: number; bx: number; by: number }
  | { cmd: 'split_tribe'; x: number; y: number; radius?: number }
  | { cmd: 'rename_person'; id: string; name: string }
  | { cmd: 'tame'; x: number; y: number; radius?: number }
  | { cmd: 'family'; x: number; y: number }
  | { cmd: 'teleport'; x: number; y: number; radius?: number }
  | { cmd: 'make_leader'; x: number; y: number; radius?: number }
  | { cmd: 'heal_one'; x: number; y: number; radius?: number }
  | { cmd: 'mutate'; x: number; y: number; radius?: number }
  | { cmd: 'curse'; x: number; y: number; radius?: number }
  | { cmd: 'teach_nearby'; x: number; y: number; radius?: number }
  | { cmd: 'set_difficulty'; level: 'calm' | 'normal' | 'harsh' }
  | { cmd: 'gift'; x: number; y: number; radius?: number; what: 'food' | 'tool' }
  | { cmd: 'time_of_day'; phase: 'dawn' | 'noon' | 'dusk' | 'midnight' }
  | { cmd: 'hail'; x: number; y: number; radius?: number }
  | { cmd: 'nuke'; x: number; y: number }
  | { cmd: 'eclipse' }
  | { cmd: 'rain_patch'; x: number; y: number; radius?: number }
  | { cmd: 'cure_tribe'; x: number; y: number }
  | { cmd: 'guardian'; x: number; y: number }
  | { cmd: 'aurora' }
  | { cmd: 'heat_wave' }
  | { cmd: 'bless_river'; x: number; y: number; radius?: number }
  | { cmd: 'bless_forest'; x: number; y: number; radius?: number }
  | { cmd: 'talent'; x: number; y: number; radius?: number }
  | { cmd: 'era_tribe'; x: number; y: number; era: string }
  | { cmd: 'tribe_gift'; x: number; y: number; radius?: number; what: 'food' | 'tool' }
  | { cmd: 'migrate_tribe'; x: number; y: number; radius?: number }
  | { cmd: 'trade_gift'; ax: number; ay: number; bx: number; by: number }
  | { cmd: 'clear_region'; x: number; y: number; radius?: number }
  | { cmd: 'comet'; x: number; y: number; radius?: number }
  | { cmd: 'demolish'; x: number; y: number; radius?: number }
  | { cmd: 'repair'; x: number; y: number; radius?: number }
  | { cmd: 'road'; x: number; y: number; radius?: number; kind: 'road' | 'bridge' | 'erase' }
  | { cmd: 'place_building'; x: number; y: number; kind: string }
  | { cmd: 'place_boat'; x: number; y: number }
  | {
      cmd: 'guide'
      lineage: string
      strategy: LineageStrategy
      duration_ticks?: number
    }

/**
 * The dice tool's events: a mix of kind and cruel things, each landing at a
 * place it is given (weather and the wind ignore the place).
 */
const DICE_EVENTS: ReadonlyArray<(x: number, y: number) => SandboxCommand> = [
  () => ({ cmd: 'weather', kind: 'rain' }),
  () => ({ cmd: 'gale' }),
  (x, y) => ({ cmd: 'bless', x, y, radius: 6 }),
  (x, y) => ({ cmd: 'harvest', x, y, radius: 6 }),
  (x, y) => ({ cmd: 'spawn', x, y, count: 5 }),
  (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'deer', count: 4, radius: 4 }),
  (x, y) => ({ cmd: 'meteor', x, y, radius: 3 }),
  (x, y) => ({ cmd: 'tornado', x, y, radius: 12 }),
  (x, y) => ({ cmd: 'wildfire', x, y, radius: 10 }),
  (x, y) => ({ cmd: 'earthquake', x, y, radius: 5 }),
  (x, y) => ({ cmd: 'locusts', x, y, radius: 12 }),
]

/**
 * Roll the dice: one random event at a random place on a world of the given
 * size. `random` is injectable so the roll can be tested.
 */
export function rollRandomEvent(
  width: number,
  height: number,
  random: () => number = Math.random,
): SandboxCommand {
  const event = DICE_EVENTS[Math.floor(random() * DICE_EVENTS.length) % DICE_EVENTS.length]
  const x = Math.floor(random() * Math.max(1, width))
  const y = Math.floor(random() * Math.max(1, height))
  return event(x, y)
}

export type LineageStrategy = 'hunt' | 'explore' | 'settle' | 'trade' | 'defend'

/**
 * Command permission belongs at the transport boundary, not just the toolbar.
 * This makes 2D, 3D, shortcuts, and future controls obey the same rule.
 */
export function canSendSandboxCommand(
  source: 'native' | 'wasm',
  desktop: boolean,
  localServer: boolean,
): boolean {
  return source === 'wasm' || (desktop && localServer)
}

export type TimeControl = { control: 'pause' | 'resume' | 'speed'; mult?: number }

export type SandboxOverlay =
  'density' | 'hazard' | 'fertility' | 'structures' | 'trails' | 'age' | 'threat' | 'food' | 'wealth' | 'mood'

export type SandboxViewFlag =
  'territory' | 'history' | 'names' | 'thoughts' | 'animals' | 'grid' | 'tradeRoutes'

export type SandboxViewControl =
  { control: 'overlay'; value: SandboxOverlay } | { control: 'flag'; value: SandboxViewFlag }

/** The sky effects a tool can draw over the map once it lands. */
export type SkyOverlayKind = 'eclipse' | 'aurora'

export interface SandboxTool {
  id: string
  label: string
  icon: string
  mode: 'point' | 'instant'
  /** A sky effect drawn over the map for a while once the command lands (see game/render/sky-overlay.ts). */
  overlay?: SkyOverlayKind
  build?: (x: number, y: number, brush: number) => SandboxCommand
  fire?: SandboxCommand
  time?: TimeControl
  view?: SandboxViewControl
}

export interface SandboxCategory {
  id: string
  label: string
  icon: string
  tools: SandboxTool[]
}

export function isSandboxViewControlActive(
  view: SandboxViewControl | undefined,
  overlay: string | null,
  flags: Partial<Record<SandboxViewFlag, boolean>>,
): boolean {
  if (!view) return false
  return view.control === 'overlay' ? overlay === view.value : flags[view.value] === true
}

export const SANDBOX_CATEGORIES: SandboxCategory[] = [
  {
    id: 'life',
    label: t('tools.group.life'),
    icon: '🚶',
    tools: [
      {
        id: 'spawn1',
        label: t('tools.label.spawn1'),
        icon: '🚶',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn', x, y, count: 1 }),
      },
      {
        id: 'spawn5',
        label: t('tools.label.spawn5'),
        icon: '👥',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn', x, y, count: 5 }),
      },
      {
        id: 'family',
        label: t('tools.label.family'),
        icon: '👪',
        mode: 'point',
        build: (x, y) => ({ cmd: 'family', x, y }),
      },
      {
        id: 'heal_one',
        label: t('tools.label.heal_one'),
        icon: '💚',
        mode: 'point',
        build: (x, y) => ({ cmd: 'heal_one', x, y, radius: 4 }),
      },
      {
        id: 'mutate',
        label: t('tools.label.mutate'),
        icon: '🧬',
        mode: 'point',
        build: (x, y) => ({ cmd: 'mutate', x, y, radius: 4 }),
      },
      {
        id: 'curse',
        label: t('tools.label.curse'),
        icon: '🧿',
        mode: 'point',
        build: (x, y) => ({ cmd: 'curse', x, y, radius: 4 }),
      },
      {
        id: 'teach_tribe',
        label: t('tools.label.teach_tribe'),
        icon: '📜',
        mode: 'point',
        build: (x, y) => ({ cmd: 'teach_nearby', x, y, radius: 4 }),
      },
      {
        id: 'follow',
        label: t('tools.label.follow'),
        icon: '👣',
        mode: 'point',
      },
      {
        // Opens the name editor on the person nearest the click. The name is typed on their card.
        id: 'name',
        label: t('tools.label.name'),
        icon: '✏️',
        mode: 'point',
      },
      {
        // Two clicks: the first person, then the second. Sent by the app, not by a single click.
        id: 'marry',
        label: t('tools.label.marry'),
        icon: '💍',
        mode: 'point',
      },
      {
        // Two clicks: a person of one tribe, then a person of another. Sent by the app (see PAIR_TOOLS).
        id: 'merge_tribes',
        label: t('tools.label.merge_tribes'),
        icon: '🤝',
        mode: 'point',
      },
      {
        id: 'split_tribe',
        label: t('tools.label.split_tribe'),
        icon: '🪓',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'split_tribe', x, y, radius: 3 + b }),
      },
      {
        id: 'teleport',
        label: t('tools.label.teleport'),
        icon: '🌀',
        mode: 'point',
        build: (x, y) => ({ cmd: 'teleport', x, y, radius: 4 }),
      },
      {
        id: 'gift_food',
        label: t('tools.label.gift_food'),
        icon: '🎁',
        mode: 'point',
        build: (x, y) => ({ cmd: 'gift', x, y, radius: 4, what: 'food' }),
      },
      {
        id: 'gift_tool',
        label: t('tools.label.gift_tool'),
        icon: '🔧',
        mode: 'point',
        build: (x, y) => ({ cmd: 'gift', x, y, radius: 4, what: 'tool' }),
      },
      {
        id: 'leader',
        label: t('tools.label.leader'),
        icon: '🤴',
        mode: 'point',
        build: (x, y) => ({ cmd: 'make_leader', x, y, radius: 4 }),
      },
    ],
  },
  {
    id: 'good',
    label: t('tools.group.good'),
    icon: '✨',
    tools: [
      {
        id: 'heal',
        label: t('tools.label.heal'),
        icon: '❤️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'heal', x, y, radius: 2 + b }),
      },
      {
        id: 'revive',
        label: t('tools.label.revive'),
        icon: '☥',
        mode: 'point',
        build: (x, y) => ({ cmd: 'revive', x, y }),
      },
      {
        id: 'bless',
        label: t('tools.label.bless'),
        icon: '✨',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'bless', x, y, radius: 2 + b }),
      },
      {
        id: 'inspire',
        label: t('tools.label.inspire'),
        icon: '💡',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'inspire', x, y, radius: 2 + b }),
      },
      {
        id: 'long_life',
        label: t('tools.label.long_life'),
        icon: '🕰️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'long_life', x, y, radius: 2 + b }),
      },
      {
        id: 'courage',
        label: t('tools.label.courage'),
        icon: '🦁',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'courage', x, y, radius: 3 + b }),
      },
      {
        id: 'sunshine',
        label: t('tools.label.sunshine'),
        icon: '🌞',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'sunshine', x, y, radius: 4 + b }),
      },
      {
        id: 'peace',
        label: t('tools.label.peace'),
        icon: '🕊️',
        mode: 'point',
        build: (x, y) => ({ cmd: 'peace', x, y }),
      },
      {
        id: 'cure',
        label: t('tools.label.cure'),
        icon: '💊',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'cure', x, y, radius: 6 + b }),
      },
      {
        id: 'cure_tribe',
        label: t('tools.label.cure_tribe'),
        icon: '🩹',
        mode: 'point',
        build: (x, y) => ({ cmd: 'cure_tribe', x, y }),
      },
      {
        id: 'harvest',
        label: t('tools.label.harvest'),
        icon: '🌾',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'harvest', x, y, radius: 3 + b }),
      },
      {
        id: 'arm',
        label: t('tools.label.arm'),
        icon: '🗡️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'arm', x, y, radius: 2 + b }),
      },
      {
        id: 'bounty',
        label: t('tools.label.bounty'),
        icon: '🎁',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'bounty', x, y, radius: 2 + b }),
      },
      {
        id: 'douse',
        label: t('tools.label.douse'),
        icon: '🪣',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'douse', x, y, radius: 3 + b }),
      },
      {
        id: 'ward',
        label: t('tools.label.ward'),
        icon: '🔰',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'ward', x, y, radius: 6 + b * 2 }),
      },
      {
        id: 'banish',
        label: t('tools.label.banish'),
        icon: '🛡️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'banish', x, y, radius: 4 + b }),
      },
      {
        id: 'love',
        label: t('tools.label.love'),
        icon: '💞',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'love', x, y, radius: 4 + b }),
      },
      {
        id: 'rain',
        label: t('tools.label.rain'),
        icon: '🌧️',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'rain' },
      },
      {
        id: 'clear',
        label: t('tools.label.clear'),
        icon: '☀️',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'clear' },
      },
      {
        id: 'fog',
        label: t('tools.label.fog'),
        icon: '🌫️',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'fog' },
      },
      { id: 'gale', label: t('tools.label.gale'), icon: '🌬️', mode: 'instant', fire: { cmd: 'gale' } },
      {
        id: 'drought_off',
        label: t('tools.label.drought_off'),
        icon: '🌦️',
        mode: 'instant',
        fire: { cmd: 'drought', active: false },
      },
    ],
  },
  {
    id: 'bad',
    label: t('tools.group.bad'),
    icon: '💀',
    tools: [
      {
        id: 'smite',
        label: t('tools.label.smite'),
        icon: '💀',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'smite', x, y, radius: 2 + b }),
      },
      {
        id: 'war',
        label: t('tools.label.war'),
        icon: '⚔️',
        mode: 'point',
        build: (x, y) => ({ cmd: 'war', x, y }),
      },
      {
        id: 'frenzy',
        label: t('tools.label.frenzy'),
        icon: '😡',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'frenzy', x, y, radius: 2 + b }),
      },
      {
        id: 'thunder',
        label: t('tools.label.thunder'),
        icon: '🌩️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'thunder', x, y, radius: 5 + b }),
      },
      {
        id: 'fire',
        label: t('tools.label.fire'),
        icon: '🔥',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'ignite', x, y, radius: 1 + b }),
      },
      {
        id: 'plague',
        label: t('tools.label.plague'),
        icon: '🦠',
        mode: 'instant',
        fire: { cmd: 'outbreak', count: 12 },
      },
      {
        id: 'poison',
        label: t('tools.label.poison'),
        icon: '🧪',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'poison', x, y, radius: 1 + b }),
      },
      {
        id: 'blight',
        label: t('tools.label.blight'),
        icon: '🥀',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'blight', x, y, radius: 3 + b }),
      },
      {
        id: 'earthquake',
        label: t('tools.label.earthquake'),
        icon: '〽️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'earthquake', x, y, radius: 3 + b }),
      },
      {
        id: 'tornado',
        label: t('tools.label.tornado'),
        icon: '🌪️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'tornado', x, y, radius: 6 + b }),
      },
      {
        id: 'tsunami',
        label: t('tools.label.tsunami'),
        icon: '🫧',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'tsunami', x, y, radius: 8 + b }),
      },
      {
        id: 'locusts',
        label: t('tools.label.locusts'),
        icon: '🦗',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'locusts', x, y, radius: 10 + b }),
      },
      {
        id: 'wildfire',
        label: t('tools.label.wildfire'),
        icon: '🪵',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'wildfire', x, y, radius: 6 + b }),
      },
      {
        id: 'meteor',
        label: t('tools.label.meteor'),
        icon: '☄️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'meteor', x, y, radius: 2 + b }),
      },
      {
        id: 'meteor_shower',
        label: t('tools.label.meteor_shower'),
        icon: '🌠',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'meteor_shower', x, y, radius: 8 + b }),
      },
      {
        id: 'volcano',
        label: t('tools.label.volcano'),
        icon: '🌋',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'volcano', x, y, radius: 4 + b }),
      },
      {
        id: 'flood',
        label: t('tools.label.flood'),
        icon: '🌊',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'flood', x, y, radius: 2 + b }),
      },
      {
        id: 'blizzard',
        label: t('tools.label.blizzard'),
        icon: '🌨️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'blizzard', x, y, radius: 4 + b }),
      },
      {
        id: 'hail',
        label: t('tools.label.hail'),
        icon: '☁️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'hail', x, y, radius: 5 + b }),
      },
      {
        id: 'storm',
        label: t('tools.label.storm'),
        icon: '⛈️',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'storm' },
      },
      {
        id: 'snow_weather',
        label: t('tools.label.snow_weather'),
        icon: '☃️',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'snow' },
      },
      {
        id: 'drought_on',
        label: t('tools.label.drought_on'),
        icon: '🏜️',
        mode: 'instant',
        fire: { cmd: 'drought', active: true },
      },
    ],
  },
  {
    id: 'build',
    label: t('tools.group.build'),
    icon: '🏠',
    tools: [
      {
        id: 'shelter',
        label: t('tools.label.shelter'),
        icon: '🛖',
        mode: 'point',
        build: (x, y) => ({ cmd: 'paint', x, y, tile: 'hut', radius: 0 }),
      },
      {
        id: 'campfire',
        label: t('tools.label.campfire'),
        icon: '🔥',
        mode: 'point',
        build: (x, y) => ({ cmd: 'paint', x, y, tile: 'campfire', radius: 0 }),
      },
      {
        id: 'demolish',
        label: t('tools.label.demolish'),
        icon: '⛏️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'demolish', x, y, radius: 1 + b }),
      },
      {
        id: 'repair',
        label: t('tools.label.repair'),
        icon: '🔨',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'repair', x, y, radius: 2 + b }),
      },
      {
        id: 'road',
        label: t('tools.label.road'),
        icon: '🛤️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'road', x, y, radius: b, kind: 'road' }),
      },
      {
        id: 'bridge',
        label: t('tools.label.bridge'),
        icon: '🌉',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'road', x, y, radius: b, kind: 'bridge' }),
      },
      {
        id: 'road_erase',
        label: t('tools.label.road_erase'),
        icon: '🧽',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'road', x, y, radius: b, kind: 'erase' }),
      },
      {
        id: 'place_house',
        label: t('tools.label.place_house'),
        icon: '🏠',
        mode: 'point',
        build: (x, y) => ({ cmd: 'place_building', x, y, kind: 'house' }),
      },
      {
        id: 'place_library',
        label: t('tools.label.place_library'),
        icon: '📖',
        mode: 'point',
        build: (x, y) => ({ cmd: 'place_building', x, y, kind: 'library' }),
      },
      {
        id: 'boat',
        label: t('tools.label.boat'),
        icon: '🛶',
        mode: 'point',
        build: (x, y) => ({ cmd: 'place_boat', x, y }),
      },
    ],
  },
  {
    id: 'terrain',
    label: t('tools.group.terrain'),
    icon: '⛰️',
    tools: [
      {
        id: 'clear_region',
        label: t('tools.label.clear_region'),
        icon: '🧹',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'clear_region', x, y, radius: 2 + b }),
      },
      {
        id: 'restore',
        label: t('tools.label.restore'),
        icon: '🧽',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'restore', x, y, radius: b }),
      },
      {
        id: 'grass',
        label: t('tools.label.grass'),
        icon: '🟩',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'grass', radius: b }),
      },
      {
        id: 'water',
        label: t('tools.label.water'),
        icon: '🟦',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'water', radius: b }),
      },
      {
        id: 'rock',
        label: t('tools.label.rock'),
        icon: '🪨',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'rock', radius: b }),
      },
      {
        id: 'sand',
        label: t('tools.label.sand'),
        icon: '🟨',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'sand', radius: b }),
      },
      {
        id: 'snow',
        label: t('tools.label.snow'),
        icon: '❄️',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'snow', radius: b }),
      },
      {
        id: 'lava',
        label: t('tools.label.lava'),
        icon: '🟧',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'lava', radius: b }),
      },
    ],
  },
  {
    id: 'sky',
    label: t('tools.group.sky'),
    icon: '🌅',
    tools: [
      {
        id: 'dawn',
        label: t('tools.label.dawn'),
        icon: '🌅',
        mode: 'instant',
        fire: { cmd: 'time_of_day', phase: 'dawn' },
      },
      {
        id: 'noon',
        label: t('tools.label.noon'),
        icon: '🕛',
        mode: 'instant',
        fire: { cmd: 'time_of_day', phase: 'noon' },
      },
      {
        id: 'dusk',
        label: t('tools.label.dusk'),
        icon: '🌇',
        mode: 'instant',
        fire: { cmd: 'time_of_day', phase: 'dusk' },
      },
      {
        id: 'midnight',
        label: t('tools.label.midnight'),
        icon: '🌙',
        mode: 'instant',
        fire: { cmd: 'time_of_day', phase: 'midnight' },
      },
      {
        id: 'nuke',
        label: t('tools.label.nuke'),
        icon: '☢️',
        mode: 'point',
        build: (x, y) => ({ cmd: 'nuke', x, y }),
      },
      {
        id: 'eclipse',
        label: t('tools.label.eclipse'),
        icon: '🌑',
        mode: 'instant',
        fire: { cmd: 'eclipse' },
        overlay: 'eclipse',
      },
      {
        id: 'rain_patch',
        label: t('tools.label.rain_patch'),
        icon: '🌂',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'rain_patch', x, y, radius: 4 + b }),
      },
      {
        id: 'aurora',
        label: t('tools.label.aurora'),
        icon: '🌌',
        mode: 'instant',
        fire: { cmd: 'aurora' },
        overlay: 'aurora',
      },
      {
        id: 'heat_wave',
        label: t('tools.label.heat_wave'),
        icon: '🥵',
        mode: 'instant',
        fire: { cmd: 'heat_wave' },
      },
      {
        id: 'monsoon',
        label: t('tools.label.monsoon'),
        icon: '☔',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'monsoon' },
      },
      {
        id: 'cold_snap',
        label: t('tools.label.cold_snap'),
        icon: '🥶',
        mode: 'instant',
        fire: { cmd: 'weather', kind: 'cold_snap' },
      },
      {
        id: 'frost',
        label: t('tools.label.frost'),
        icon: '🔷',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'freeze', x, y, radius: 2 + b }),
      },
      {
        id: 'comet',
        label: t('tools.label.comet'),
        icon: '💫',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'comet', x, y, radius: 12 + b * 4 }),
      },
      // The fire command is a placeholder: the toolbar rolls a random event when it is picked.
      { id: 'dice', label: t('tools.label.dice'), icon: '🎲', mode: 'instant', fire: { cmd: 'gale' } },
    ],
  },
  {
    id: 'biomes',
    label: t('tools.group.biomes'),
    icon: '🌳',
    tools: [
      {
        id: 'biome_grassland',
        label: t('tools.label.biome_grassland'),
        icon: '🌱',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'grassland', radius: 3 + r }),
      },
      {
        id: 'biome_forest',
        label: t('tools.label.biome_forest'),
        icon: '🌳',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'forest', radius: 3 + r }),
      },
      {
        id: 'biome_jungle',
        label: t('tools.label.biome_jungle'),
        icon: '🌴',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'jungle', radius: 3 + r }),
      },
      {
        id: 'biome_savanna',
        label: t('tools.label.biome_savanna'),
        icon: '🦒',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'savanna', radius: 3 + r }),
      },
      {
        id: 'biome_desert',
        label: t('tools.label.biome_desert'),
        icon: '🌵',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'desert', radius: 3 + r }),
      },
      {
        id: 'biome_badlands',
        label: t('tools.label.biome_badlands'),
        icon: '🟥',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'badlands', radius: 3 + r }),
      },
      {
        id: 'biome_wetland',
        label: t('tools.label.biome_wetland'),
        icon: '🪷',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'wetland', radius: 3 + r }),
      },
      {
        id: 'biome_tundra',
        label: t('tools.label.biome_tundra'),
        icon: '🧊',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'tundra', radius: 3 + r }),
      },
      {
        id: 'biome_taiga',
        label: t('tools.label.biome_taiga'),
        icon: '🌲',
        mode: 'point',
        build: (x, y, r) => ({ cmd: 'paint_biome', x, y, biome: 'taiga', radius: 3 + r }),
      },
    ],
  },
  {
    id: 'resources',
    label: t('tools.group.resources'),
    icon: '🍎',
    tools: [
      {
        id: 'food',
        label: t('tools.label.food'),
        icon: '🍎',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'food', radius: b }),
      },
      {
        id: 'drink',
        label: t('tools.label.drink'),
        icon: '💧',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'paint', x, y, tile: 'water', radius: b }),
      },
      {
        id: 'plant_crop',
        label: t('tools.label.plant_crop'),
        icon: '🌿',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'crop', radius: 1 + b }),
      },
      {
        id: 'plant_orchard',
        label: t('tools.label.plant_orchard'),
        icon: '🍐',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'orchard', radius: 1 + b }),
      },
      {
        id: 'plant_sapling',
        label: t('tools.label.plant_sapling'),
        icon: '🪴',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'sapling', radius: 2 + b }),
      },
      {
        id: 'plant_berry',
        label: t('tools.label.plant_berry'),
        icon: '🫐',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'berry', radius: 1 + b }),
      },
      {
        id: 'plant_mushroom',
        label: t('tools.label.plant_mushroom'),
        icon: '🍄',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'mushroom', radius: 1 + b }),
      },
      {
        id: 'plant_oak',
        label: t('tools.label.plant_oak'),
        icon: '🌰',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'oak', radius: 2 + b }),
      },
      {
        id: 'plant_pine',
        label: t('tools.label.plant_pine'),
        icon: '🎄',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'pine', radius: 2 + b }),
      },
      {
        id: 'plant_palm',
        label: t('tools.label.plant_palm'),
        icon: '🥥',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'palm', radius: 1 + b }),
      },
      {
        id: 'plant_flowers',
        label: t('tools.label.plant_flowers'),
        icon: '🌸',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'plant', x, y, kind: 'flowers', radius: 1 + b }),
      },
    ],
  },
  {
    id: 'maps',
    label: t('tools.group.maps'),
    icon: '🗺️',
    tools: [
      {
        id: 'territory_map',
        label: t('tools.label.territory_map'),
        icon: '⬡',
        mode: 'instant',
        view: { control: 'flag', value: 'territory' },
      },
      {
        id: 'settlement_map',
        label: t('tools.label.settlement_map'),
        icon: '🏘️',
        mode: 'instant',
        view: { control: 'overlay', value: 'structures' },
      },
      {
        id: 'population_map',
        label: t('tools.label.population_map'),
        icon: '👥',
        mode: 'instant',
        view: { control: 'overlay', value: 'density' },
      },
      {
        id: 'hazard_map',
        label: t('tools.label.hazard_map'),
        icon: '⚔️',
        mode: 'instant',
        view: { control: 'overlay', value: 'hazard' },
      },
      {
        id: 'routes_map',
        label: t('tools.label.routes_map'),
        icon: '〰️',
        mode: 'instant',
        view: { control: 'overlay', value: 'trails' },
      },
      {
        id: 'migration_map',
        label: t('tools.label.migration_map'),
        icon: '🧭',
        mode: 'instant',
        view: { control: 'flag', value: 'history' },
      },
      {
        id: 'trade_map',
        label: t('tools.label.trade_map'),
        icon: '🐫',
        mode: 'instant',
        view: { control: 'flag', value: 'tradeRoutes' },
      },
      {
        id: 'fertility_map',
        label: t('tools.label.fertility_map'),
        icon: '🌼',
        mode: 'instant',
        view: { control: 'overlay', value: 'fertility' },
      },
      {
        id: 'age_map',
        label: t('tools.label.age_map'),
        icon: '⏳',
        mode: 'instant',
        view: { control: 'overlay', value: 'age' },
      },
      {
        id: 'threat_map',
        label: t('tools.label.threat_map'),
        icon: '⚠️',
        mode: 'instant',
        view: { control: 'overlay', value: 'threat' },
      },
      {
        id: 'food_map',
        label: t('tools.label.food_map'),
        icon: '🍎',
        mode: 'instant',
        view: { control: 'overlay', value: 'food' },
      },
      {
        id: 'wealth_map',
        label: t('tools.label.wealth_map'),
        icon: '🪙',
        mode: 'instant',
        view: { control: 'overlay', value: 'wealth' },
      },
      {
        id: 'mood_map',
        label: t('tools.label.mood_map'),
        icon: '💚',
        mode: 'instant',
        view: { control: 'overlay', value: 'mood' },
      },
    ],
  },
  {
    id: 'view',
    label: t('tools.group.view'),
    icon: '👁️',
    tools: [
      {
        id: 'names_view',
        label: t('tools.label.names_view'),
        icon: '🏷️',
        mode: 'instant',
        view: { control: 'flag', value: 'names' },
      },
      {
        id: 'thoughts_view',
        label: t('tools.label.thoughts_view'),
        icon: '💭',
        mode: 'instant',
        view: { control: 'flag', value: 'thoughts' },
      },
      {
        id: 'animals_view',
        label: t('tools.label.animals_view'),
        icon: '🐾',
        mode: 'instant',
        view: { control: 'flag', value: 'animals' },
      },
      {
        id: 'grid_view',
        label: t('tools.label.grid_view'),
        icon: '#️⃣',
        mode: 'instant',
        view: { control: 'flag', value: 'grid' },
      },
    ],
  },
  {
    id: 'animals',
    label: t('tools.group.animals'),
    icon: '🦌',
    tools: [
      {
        id: 'deer',
        label: t('tools.label.deer'),
        icon: '🦌',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'deer', count: 1 }),
      },
      {
        id: 'rabbit',
        label: t('tools.label.rabbit'),
        icon: '🐇',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'rabbit', count: 1 }),
      },
      {
        id: 'boar',
        label: t('tools.label.boar'),
        icon: '🐗',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'boar', count: 1 }),
      },
      {
        id: 'wolf',
        label: t('tools.label.wolf'),
        icon: '🐺',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'wolf', count: 1 }),
      },
      {
        id: 'bird',
        label: t('tools.label.bird'),
        icon: '🐦',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'bird', count: 1 }),
      },
      {
        id: 'fish',
        label: t('tools.label.fish'),
        icon: '🐟',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'fish', count: 1 }),
      },
      {
        id: 'bear',
        label: t('tools.label.bear'),
        icon: '🐻',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'bear', count: 1 }),
      },
      {
        id: 'sheep',
        label: t('tools.label.sheep'),
        icon: '🐑',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'sheep', count: 1 }),
      },
      {
        id: 'cow',
        label: t('tools.label.cow'),
        icon: '🐄',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'cow', count: 1 }),
      },
      {
        id: 'horse',
        label: t('tools.label.horse'),
        icon: '🐎',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'horse', count: 1 }),
      },
      {
        id: 'chicken',
        label: t('tools.label.chicken'),
        icon: '🐔',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'chicken', count: 1 }),
      },
      {
        id: 'fox',
        label: t('tools.label.fox'),
        icon: '🦊',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'fox', count: 1 }),
      },
      {
        id: 'cat',
        label: t('tools.label.cat'),
        icon: '🐈',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'cat', count: 1 }),
      },
      {
        id: 'penguin',
        label: t('tools.label.penguin'),
        icon: '🐧',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'penguin', count: 1 }),
      },
      {
        id: 'camel',
        label: t('tools.label.camel'),
        icon: '🐪',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'camel', count: 1 }),
      },
      {
        id: 'frog',
        label: t('tools.label.frog'),
        icon: '🐸',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'frog', count: 1 }),
      },
      {
        id: 'whale',
        label: t('tools.label.whale'),
        icon: '🐋',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'whale', count: 1 }),
      },
      {
        id: 'duck',
        label: t('tools.label.duck'),
        icon: '🦆',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'duck', count: 1 }),
      },
      {
        id: 'bee',
        label: t('tools.label.bee'),
        icon: '🐝',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'bee', count: 1 }),
      },
      {
        id: 'tame',
        label: t('tools.label.tame'),
        icon: '🦮',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'tame', x, y, radius: 4 + b }),
      },
      {
        id: 'guardian',
        label: t('tools.label.guardian'),
        icon: '🐶',
        mode: 'point',
        build: (x, y) => ({ cmd: 'guardian', x, y }),
      },
      {
        id: 'dog',
        label: t('tools.label.dog'),
        icon: '🐕',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'dog', count: 1 }),
      },
    ],
  },
  {
    id: 'birds',
    label: t('tools.group.birds'),
    icon: '🦉',
    tools: [
      {
        id: 'owl',
        label: t('tools.label.owl'),
        icon: '🦉',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'owl', count: 1 }),
      },
      {
        id: 'eagle',
        label: t('tools.label.eagle'),
        icon: '🦅',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'eagle', count: 1 }),
      },
    ],
  },
  {
    id: 'reptiles',
    label: t('tools.group.reptiles'),
    icon: '🐍',
    tools: [
      {
        id: 'snake',
        label: t('tools.label.snake'),
        icon: '🐍',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'snake', count: 1 }),
      },
      {
        id: 'crocodile',
        label: t('tools.label.crocodile'),
        icon: '🐊',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'crocodile', count: 1 }),
      },
    ],
  },
  {
    id: 'safari',
    label: t('tools.group.safari'),
    icon: '🐒',
    tools: [
      {
        id: 'monkey',
        label: t('tools.label.monkey'),
        icon: '🐒',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'monkey', count: 1 }),
      },
      {
        id: 'goat',
        label: t('tools.label.goat'),
        icon: '🐐',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'goat', count: 1 }),
      },
      {
        id: 'elephant',
        label: t('tools.label.elephant'),
        icon: '🐘',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'elephant', count: 1 }),
      },
      {
        id: 'lion',
        label: t('tools.label.lion'),
        icon: '🐆',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'lion', count: 1 }),
      },
      {
        id: 'zebra',
        label: t('tools.label.zebra'),
        icon: '🦓',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'zebra', count: 1 }),
      },
      {
        id: 'polar_bear',
        label: t('tools.label.polar_bear'),
        icon: '🐻‍❄️',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'polar_bear', count: 1 }),
      },
      {
        id: 'kangaroo',
        label: t('tools.label.kangaroo'),
        icon: '🦘',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'kangaroo', count: 1 }),
      },
    ],
  },
  {
    id: 'miracles',
    label: t('tools.group.miracles'),
    icon: '🔮',
    tools: [
      {
        id: 'bless_river',
        label: t('tools.label.bless_river'),
        icon: '🐟',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'bless_river', x, y, radius: 4 + b }),
      },
      {
        id: 'bless_forest',
        label: t('tools.label.bless_forest'),
        icon: '🌳',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'bless_forest', x, y, radius: 4 + b }),
      },
      {
        id: 'talent',
        label: t('tools.label.talent'),
        icon: '🌟',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'talent', x, y, radius: 3 + b }),
      },
    ],
  },
  {
    id: 'eras',
    label: t('tools.group.eras'),
    icon: '🪓',
    tools: [
      {
        id: 'era_stone',
        label: t('tools.label.era_stone'),
        icon: '🪓',
        mode: 'point',
        build: (x, y) => ({ cmd: 'era_tribe', x, y, era: 'stone' }),
      },
      {
        id: 'era_bronze',
        label: t('tools.label.era_bronze'),
        icon: '⚔️',
        mode: 'point',
        build: (x, y) => ({ cmd: 'era_tribe', x, y, era: 'bronze' }),
      },
      {
        id: 'era_medieval',
        label: t('tools.label.era_medieval'),
        icon: '🏰',
        mode: 'point',
        build: (x, y) => ({ cmd: 'era_tribe', x, y, era: 'medieval' }),
      },
      {
        id: 'era_modern',
        label: t('tools.label.era_modern'),
        icon: '🚂',
        mode: 'point',
        build: (x, y) => ({ cmd: 'era_tribe', x, y, era: 'modern' }),
      },
    ],
  },
  {
    id: 'tribes',
    label: t('tools.group.tribes'),
    icon: '👥',
    tools: [
      {
        id: 'tribe_food',
        label: t('tools.label.tribe_food'),
        icon: '🌾',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'tribe_gift', x, y, radius: 6 + b, what: 'food' }),
      },
      {
        id: 'tribe_tools',
        label: t('tools.label.tribe_tools'),
        icon: '🔨',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'tribe_gift', x, y, radius: 6 + b, what: 'tool' }),
      },
      {
        id: 'migrate_tribe',
        label: t('tools.label.migrate_tribe'),
        icon: '🧭',
        mode: 'point',
        build: (x, y, b) => ({ cmd: 'migrate_tribe', x, y, radius: 6 + b }),
      },
      {
        id: 'trade_gift',
        label: t('tools.label.trade_gift'),
        icon: '🪙',
        mode: 'point',
      },
    ],
  },
  {
    id: 'monsters',
    label: t('tools.group.monsters'),
    icon: '🧟',
    tools: [
      {
        id: 'zombie',
        label: t('tools.label.zombie'),
        icon: '🧟',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'zombie' }),
      },
      {
        id: 'demon',
        label: t('tools.label.demon'),
        icon: '👹',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'demon' }),
      },
      {
        id: 'dragon',
        label: t('tools.label.dragon'),
        icon: '🐉',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'dragon' }),
      },
      {
        id: 'alien',
        label: t('tools.label.alien'),
        icon: '👽',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'alien' }),
      },
      {
        id: 'ufo',
        label: t('tools.label.ufo'),
        icon: '🛸',
        mode: 'point',
        build: (x, y) => ({ cmd: 'spawn_animal', x, y, kind: 'ufo' }),
      },
    ],
  },
  {
    id: 'time',
    label: t('tools.group.time'),
    icon: '⏱️',
    tools: [
      { id: 'pause', label: t('tools.label.pause'), icon: '⏸️', mode: 'instant', time: { control: 'pause' } },
      { id: 'play', label: t('tools.label.play'), icon: '▶️', mode: 'instant', time: { control: 'resume' } },
      {
        id: 'slow',
        label: t('tools.label.slow'),
        icon: '🐢',
        mode: 'instant',
        time: { control: 'speed', mult: 0.5 },
      },
      { id: 'normal', label: '1×', icon: '⏱️', mode: 'instant', time: { control: 'speed', mult: 1 } },
      { id: 'fast2', label: '2×', icon: '⏩', mode: 'instant', time: { control: 'speed', mult: 2 } },
      { id: 'fast4', label: '4×', icon: '⏩', mode: 'instant', time: { control: 'speed', mult: 4 } },
      { id: 'fast10', label: '10×', icon: '⏭️', mode: 'instant', time: { control: 'speed', mult: 10 } },
      { id: 'fast40', label: '40×', icon: '⚡', mode: 'instant', time: { control: 'speed', mult: 40 } },
      { id: 'fast50', label: '50×', icon: '⚡', mode: 'instant', time: { control: 'speed', mult: 50 } },
      { id: 'fast500', label: '500×', icon: '⚡', mode: 'instant', time: { control: 'speed', mult: 500 } },
      { id: 'fast5000', label: '5000×', icon: '⚡', mode: 'instant', time: { control: 'speed', mult: 5000 } },
    ],
  },
]

/** A tool that takes two clicks: the first picks one thing, the second the other, then the app sends the command. */
export interface PairTool {
  /** Shown while waiting for the second click. */
  next: string
  build: (first: { x: number; y: number }, second: { x: number; y: number }) => SandboxCommand
  done: string
  failed: string
}

export const PAIR_TOOLS: Record<string, PairTool> = {
  marry: {
    next: t('tools.pair.marry.next'),
    build: (a, b) => ({ cmd: 'marry', ax: a.x, ay: a.y, bx: b.x, by: b.y }),
    done: t('tools.pair.marry.done'),
    failed: t('tools.pair.marry.failed'),
  },
  trade_gift: {
    next: t('tools.pair.trade.next'),
    build: (a, b) => ({ cmd: 'trade_gift', ax: a.x, ay: a.y, bx: b.x, by: b.y }),
    done: t('tools.pair.trade.done'),
    failed: t('tools.pair.trade.failed'),
  },
  merge_tribes: {
    next: t('tools.pair.merge.next'),
    build: (a, b) => ({ cmd: 'merge_tribes', ax: a.x, ay: a.y, bx: b.x, by: b.y }),
    done: t('tools.pair.merge.done'),
    failed: t('tools.pair.merge.failed'),
  },
}
