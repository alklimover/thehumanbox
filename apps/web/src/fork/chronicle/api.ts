// Fork: the desktop simulation's chronicle routes (apps/server/src/fork_chronicle/routes.rs).
import { API_BASE } from '../../shared/config'
import type { ChronicleEntry, ChronicleTribe, ChronicleYear } from './model'

export interface ChroniclePage {
  rows: ChronicleEntry[]
  /** Whether older entries are left after this page. */
  more: boolean
  /** The tick the chronicle began at (0 for a world that had it from the start). */
  started_tick: number | null
  /** On the first page only: the matching entries in all, and by year. */
  total?: number
  years?: ChronicleYear[]
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as T
}

export function fetchChroniclePage(query: string, signal?: AbortSignal): Promise<ChroniclePage> {
  return getJson<ChroniclePage>(`/chronicle${query ? `?${query}` : ''}`, signal)
}

export async function fetchChronicleTribes(signal?: AbortSignal): Promise<ChronicleTribe[]> {
  const body = await getJson<{ tribes?: ChronicleTribe[] }>('/chronicle/tribes', signal)
  return body.tribes ?? []
}
