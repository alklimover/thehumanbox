import type { Message, PluralForms } from '../define'
import { common } from './common'
import { dialogs } from './dialogs'
import { errors } from './errors'
import { header } from './header'
import { hud } from './hud'
import { onboarding } from './onboarding'
import { people } from './people'
import { scenarios } from './scenarios'
import { settings } from './settings'
import { shortcuts } from './shortcuts'
import { splash } from './splash'
import { status } from './status'
import { toasts } from './toasts'
import { tools } from './tools'
import { toolTips } from './tools-tips'

/** Every area of the interface. Add a new area here; its keys join MessageKey. */
const AREAS = {
  common,
  dialogs,
  errors,
  header,
  hud,
  onboarding,
  people,
  scenarios,
  settings,
  shortcuts,
  splash,
  status,
  toasts,
  tools,
  toolTips,
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
