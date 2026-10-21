import type { SceneContext, SceneFixture, SceneId, SceneOccupant } from '../core/types'
import type { WorldState } from '../../../shared/types'
import { getBuildingState } from '../../model/building-state'
import { t, type MessageKey } from '../../../i18n'

const RADIUS = 14

type ShopKind = 'forge' | 'bakery' | 'mill'

const SHOP_WORDS: Record<ShopKind, { title: MessageKey; subtitle: MessageKey; working: MessageKey }> = {
  forge: {
    title: 'map.shop.forge.title',
    subtitle: 'map.shop.forge.subtitle',
    working: 'map.shop.forge.working',
  },
  bakery: {
    title: 'map.shop.bakery.title',
    subtitle: 'map.shop.bakery.subtitle',
    working: 'map.shop.bakery.working',
  },
  mill: {
    title: 'map.shop.mill.title',
    subtitle: 'map.shop.mill.subtitle',
    working: 'map.shop.mill.working',
  },
}

export function resolveForgeScene(world: WorldState, scene: SceneId): SceneContext | null {
  if (scene.kind !== 'forge' && scene.kind !== 'bakery' && scene.kind !== 'mill') return null
  const building = world.buildings?.find((b) => b.id === scene.buildingId)
  if (!building || !getBuildingState(building).isOperational) return null

  const kind: ShopKind = scene.kind
  const words = SHOP_WORDS[kind]
  const wantedSpecialties: string[] =
    kind === 'forge'
      ? ['smith', 'carpenter', 'builder', 'mason']
      : kind === 'bakery'
        ? ['baker', 'brewer']
        : ['miller', 'farmer', 'carpenter']

  const ax = building.x + 0.5
  const ay = building.y + 0.5

  const inside: SceneOccupant[] = []
  const away: SceneOccupant[] = []
  for (const o of world.organisms) {
    if (!o.alive) continue
    if (o.age_stage === 'infant') continue
    const d = Math.abs(o.x - ax) + Math.abs(o.y - ay)
    if (d > RADIUS) continue
    const isWorker = !!o.specialty && wantedSpecialties.includes(o.specialty)
    if (!isWorker && d > 6) continue
    const entry: SceneOccupant = {
      org: o,
      role: isWorker ? 'host' : 'patron',
      activity: isWorker ? t(words.working) : o.thought || t('map.shop.visiting'),
    }
    if (d <= 3) inside.push(entry)
    else away.push(entry)
  }

  const owned = building as { owner_lineage?: string | null; lineage_id?: string | null }
  const ownerLineage = owned.owner_lineage ?? owned.lineage_id ?? ''
  const lineageName =
    world.lineage_names?.[ownerLineage] ?? (ownerLineage ? ownerLineage.slice(0, 6) : t('map.shop.unowned'))

  const subtitle = t(words.subtitle, { tribe: lineageName })

  const fixtures: SceneFixture[] =
    kind === 'forge'
      ? [
          { id: 'anvil', kind: 'anvil', x: 6, y: 5 },
          { id: 'forge-fire', kind: 'forge_fire', x: 2, y: 5 },
          { id: 'rack', kind: 'tool_rack', x: 10, y: 2 },
          { id: 'quench', kind: 'quench', x: 10, y: 6 },
        ]
      : kind === 'bakery'
        ? [
            { id: 'oven', kind: 'oven', x: 2, y: 5 },
            { id: 'table', kind: 'work_table', x: 6, y: 5 },
            { id: 'sacks', kind: 'sacks', x: 10, y: 5 },
          ]
        : [
            { id: 'wheel', kind: 'mill_wheel', x: 2, y: 5 },
            { id: 'stones', kind: 'grindstones', x: 6, y: 5 },
            { id: 'sacks', kind: 'sacks', x: 10, y: 5 },
          ]

  return {
    scene,
    world,
    title: t(words.title, { tribe: lineageName }),
    subtitle,
    isDay: !!world.is_day,
    occupants: inside.slice(0, 6),
    away: away.slice(0, 12),
    fixtures,
  }
}
