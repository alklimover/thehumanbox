import { displayName } from '../fork/i18n/names'

/** The name to show for a person: the one the player gave them, else the generated first name. */
export function personName(o: { name: string; custom_name?: string | null }): string {
  const custom = o.custom_name?.trim()
  // Fork: a generated name is shown in the player's alphabet (fork/i18n/names); a given one as typed.
  return custom ? custom : displayName(o.name)
}
