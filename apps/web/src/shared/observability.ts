// Fork: analytics are removed. Upstream sends PostHog events from the desktop
// app; this fork sends nothing anywhere. Nothing imports posthog-js any more, so
// it never reaches the bundle (it stays in package.json only to keep the
// lockfile identical to upstream's). Upstream's functions stay as no-ops so its
// call sites merge without conflicts.

/** Facts about the world at the moment a session summary is sent; App supplies them. */
export type WorldSummary = Record<string, string | number | boolean | null>

export function initAnalytics(): void {}

export function refreshAnalyticsContext(): void {}

export function trackEvent(
  name: string,
  props?: Record<string, unknown>,
  options?: { send_instantly?: boolean },
): void {
  void name
  void props
  void options
}

export function countToolApply(toolId: string): void {
  void toolId
}

export function setWorldSummary(fn: (() => WorldSummary | null) | null): void {
  void fn
}
