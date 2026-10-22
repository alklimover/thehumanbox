import { describe, expect, it } from 'vitest'
import { prayerTool } from '../game/model/prayers'
import { answerPrayerOnSpot } from './prayer-click'

describe('a prayer bubble with a power in hand', () => {
  const hunger = { kind: 'hunger', x: 10, y: 20, lineage_id: 'a' }
  const person = (x: number, y: number, lineage_id = 'a', alive = true) => ({ alive, x, y, lineage_id })

  it('answers the prayer with its own power, among the most of the tribe', () => {
    const people = [
      person(3, 20),
      person(14, 22),
      person(15, 22),
      person(15, 23),
      person(16, 22, 'b'),
      person(14, 21, 'a', false),
    ]
    expect(answerPrayerOnSpot(hunger, prayerTool('hunger'), people)).toEqual({ worldX: 14.5, worldY: 22.5 })
  })

  it('aims at the prayer itself when none of the tribe is near', () => {
    expect(answerPrayerOnSpot(hunger, prayerTool('hunger'), [person(60, 60)])).toEqual({
      worldX: 10.5,
      worldY: 20.5,
    })
  })

  it('picks up the right power otherwise', () => {
    expect(answerPrayerOnSpot(hunger, prayerTool('thirst'), [person(10, 20)])).toBeNull()
    expect(answerPrayerOnSpot(hunger, null)).toBeNull()
  })
})
