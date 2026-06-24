// Native health bridge (Apple Health / Android Health Connect).
//
// On the plain web this is fully inert. Inside the Capacitor shell it reads
// weight + active energy via the community read plugin (@capgo/capacitor-health)
// and writes nutrition via our custom plugin (native/health-write).
//
// To keep Capacitor OUT of the web bundle until the native app is set up, the
// plugins are reached through the runtime `Capacitor` global rather than static
// imports. When you build the native app you can swap these for proper
// `registerPlugin`/`import` calls (see native/README.md).

type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>
}

function capacitor(): CapacitorGlobal | null {
  const c = (globalThis as unknown as { Capacitor?: CapacitorGlobal }).Capacitor
  return c && c.isNativePlatform?.() ? c : null
}

export function isNativeHealthAvailable(): boolean {
  return capacitor() !== null
}

export function nativePlatform(): 'ios' | 'android' | null {
  const p = capacitor()?.getPlatform?.()
  return p === 'ios' || p === 'android' ? p : null
}

function plugin(name: string): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  return capacitor()?.Plugins?.[name] ?? null
}

/** Ask the OS for read + write permissions. Call once before reading/writing. */
export async function requestHealthPermissions(): Promise<boolean> {
  const read = plugin('CapacitorHealth')
  const write = plugin('NourishHealthWrite')
  if (!read && !write) return false
  try {
    // TODO(native): the read plugin's permission method/shape depends on its
    // version — confirm against @capgo/capacitor-health at setup.
    await read?.requestAuthorization?.({ read: ['weight', 'active-calories'] })
    await write?.requestPermissions?.()
    return true
  } catch {
    return false
  }
}

export interface NutritionWrite {
  date: string // yyyy-mm-dd
  kcal: number
  protein: number
  carbs: number
  fat: number
  waterMl?: number
}

/** Push a day's logged nutrition into Apple Health / Health Connect. */
export async function writeNutrition(entry: NutritionWrite): Promise<{ ok: boolean; error?: string }> {
  const p = plugin('NourishHealthWrite')
  if (!p) return { ok: false, error: 'native health unavailable' }
  try {
    const res = (await p.writeNutrition?.(entry as unknown as Record<string, unknown>)) as { ok?: boolean } | undefined
    return { ok: !!res?.ok }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

/** Latest synced body weight in kg, if a source is connected. */
export async function readLatestWeightKg(): Promise<number | null> {
  const p = plugin('CapacitorHealth')
  if (!p) return null
  try {
    // TODO(native): map to @capgo/capacitor-health's actual query API + result shape.
    const res = (await p.queryAggregated?.({ dataType: 'weight', latest: true })) as { value?: number; unit?: string } | undefined
    if (typeof res?.value !== 'number') return null
    return res.unit === 'lb' ? res.value * 0.45359237 : res.value
  } catch {
    return null
  }
}

/** Active energy (exercise kcal) for a given yyyy-mm-dd, if a source is connected. */
export async function readActiveEnergyForDate(dateISO: string): Promise<number | null> {
  const p = plugin('CapacitorHealth')
  if (!p) return null
  try {
    const res = (await p.queryAggregated?.({
      dataType: 'active-calories',
      startDate: `${dateISO}T00:00:00`,
      endDate: `${dateISO}T23:59:59`,
    })) as { value?: number } | undefined
    return typeof res?.value === 'number' ? Math.round(res.value) : null
  } catch {
    return null
  }
}
