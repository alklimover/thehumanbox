import type { Message, PluralForms } from '../define'
import { civ } from './civ'
import { common } from './common'
import { dialogs } from './dialogs'
import { errors } from './errors'
import { header } from './header'
import { hud } from './hud'
import { life } from './life'
import { map } from './map'
import { modals } from './modals'
import { model } from './model'
import { onboarding } from './onboarding'
import { panels } from './panels'
import { people } from './people'
import { person } from './person'
import { scenarios } from './scenarios'
import { settings } from './settings'
import { shortcuts } from './shortcuts'
import { splash } from './splash'
import { stats } from './stats'
import { status } from './status'
import { toasts } from './toasts'
import { tools } from './tools'
import { toolTips } from './tools-tips'

/** Every area of the interface. Add a new area here; its keys join MessageKey. */
const AREAS = {
  civ,
  common,
  dialogs,
  errors,
  header,
  hud,
  life,
  map,
  modals,
  model,
  onboarding,
  panels,
  people,
  person,
  scenarios,
  settings,
  shortcuts,
  splash,
  stats,
  status,
  toasts,
  toolTips,
  tools,
}

type Areas = typeof AREAS
export type MessageKey = { [A in keyof Areas]: keyof Areas[A]['en'] & string }[keyof Areas]

/** Keys whose English is a plural (use tn for them). */
export type PluralKey = {
  [A in keyof Areas]: {
    [K in keyof Areas[A]['en']]: Areas[A]['en'][K] extends PluralForms ? K : never
  }[keyof Areas[A]['en']]
}[keyof Areas] &
  string

function merge(side: 'en' | 'ru'): Record<string, Message> {
  const out: Record<string, Message> = {}
  for (const area of Object.values(AREAS)) {
    for (const [key, value] of Object.entries(area[side])) {
      if (key in out) throw new Error(`duplicate message key ${key}`)
      out[key] = value
    }
  }
  return out
}

export const CATALOGS = { en: merge('en'), ru: merge('ru') }
