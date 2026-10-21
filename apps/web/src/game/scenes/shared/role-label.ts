import { t, type MessageKey } from '../../../i18n'
import type { OccupantRole } from '../core/types'

const ROLE: Record<OccupantRole, MessageKey> = {
  host: 'map.scene.role.host',
  partner: 'map.scene.role.partner',
  child: 'map.scene.role.child',
  kin: 'map.scene.role.kin',
  guest: 'map.scene.role.guest',
  stranger: 'map.scene.role.stranger',
  patron: 'map.scene.role.patron',
  worshipper: 'map.scene.role.worshipper',
  brewer: 'map.scene.role.brewer',
  priest: 'map.scene.role.priest',
}

/** The word on an occupant's chip for their part in the room ("host", "kin", "patron"). */
export function roleLabel(role: OccupantRole): string {
  return t(ROLE[role])
}
