// Key caps that are words. Upstream shows them as they are ("space"); the glossary writes Space as «Пробел».
import { ft } from '.'

/** A key cap or a shortcut's keys as shown: "space" in the player's language, anything else as it is. */
export function keyCapName(keys: string): string {
  return keys === 'space' ? ft('shortcuts.key.space') : keys
}
