/** A display name for one simulation id. `en` only where it differs from the prettified id. */
export interface SimName {
  ru: string
  en?: string
}

export type SimTable = Record<string, SimName>
