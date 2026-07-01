/** Dev-only flag: `?debugPaths=1` draws path and tower range overlays. */
export function isDebugPathsEnabled(search = window.location.search): boolean {
  if (!import.meta.env.DEV) return false
  return new URLSearchParams(search).get('debugPaths') === '1'
}
