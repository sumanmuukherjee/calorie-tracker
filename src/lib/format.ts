// Shared formatting helpers.

/** "0 items" · "1 item" · "2 items" — one place so counts read correctly everywhere. */
export function itemCount(n: number): string {
  return `${n} item${n === 1 ? '' : 's'}`
}
