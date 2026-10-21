import type { SimTable } from './types'

// One table per kind of simulation id. Each maps the id exactly as the
// simulation sends it to its Russian name and, where the game showed something
// other than the prettified id, its English name.
const era: SimTable = {}
const building: SimTable = {}
const buildingFunction: SimTable = {}
const discovery: SimTable = {}
const specialty: SimTable = {}
const good: SimTable = {}
const government: SimTable = {}
const law: SimTable = {}
const disease: SimTable = {}
const zodiac: SimTable = {}
const aspiration: SimTable = {}
const attribute: SimTable = {}
const deathCause: SimTable = {}
const religion: SimTable = {}
const animal: SimTable = {}
const concept: SimTable = {}
const treaty: SimTable = {}
const mood: SimTable = {}
const personality: SimTable = {}
const ageStage: SimTable = {}
const settlement: SimTable = {}
const strategy: SimTable = {}
const milestone: SimTable = {}

export const SIM_TABLES = {
  era,
  building,
  buildingFunction,
  discovery,
  specialty,
  good,
  government,
  law,
  disease,
  zodiac,
  aspiration,
  attribute,
  deathCause,
  religion,
  animal,
  concept,
  treaty,
  mood,
  personality,
  ageStage,
  settlement,
  strategy,
  milestone,
} satisfies Record<string, SimTable>

export type SimDomain = keyof typeof SIM_TABLES
