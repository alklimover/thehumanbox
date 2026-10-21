// One table per kind of simulation id, each in its own file. A table maps the
// id exactly as the simulation sends it to its Russian name and, where the
// game showed something other than the prettified id, its English name.
import { era } from './era'
import { building } from './building'
import { buildingFunction } from './buildingFunction'
import { discovery } from './discovery'
import { specialty } from './specialty'
import { good } from './good'
import { government } from './government'
import { law } from './law'
import { disease } from './disease'
import { zodiac } from './zodiac'
import { aspiration } from './aspiration'
import { attribute } from './attribute'
import { deathCause } from './deathCause'
import { religion } from './religion'
import { animal } from './animal'
import { concept } from './concept'
import { currency } from './currency'
import { treaty } from './treaty'
import { mood } from './mood'
import { personality } from './personality'
import { ageStage } from './ageStage'
import { settlement } from './settlement'
import { strategy } from './strategy'
import { milestone } from './milestone'
import { festival } from './festival'

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
  currency,
  treaty,
  mood,
  personality,
  ageStage,
  settlement,
  strategy,
  milestone,
  festival,
}

export type SimDomain = keyof typeof SIM_TABLES
