/** Return `prev` when structurally equal so React can skip re-renders. */
export function retainIfEqual<T>(prev: T | null, next: T, equals: (a: T, b: T) => boolean): T {
  if (prev !== null && equals(prev, next)) return prev
  return next
}

export function shallowEqual<T extends object>(a: T, b: T): boolean {
  const keysA = Object.keys(a) as Array<keyof T>
  const keysB = Object.keys(b) as Array<keyof T>
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

export function jsonEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
