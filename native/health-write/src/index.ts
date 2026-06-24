import { registerPlugin } from '@capacitor/core'
import type { NourishHealthWritePlugin } from './definitions'

// Custom Capacitor plugin: writes nutrition to Apple Health / Health Connect,
// which no aggregator or community plugin does cross-platform.
export const NourishHealthWrite = registerPlugin<NourishHealthWritePlugin>('NourishHealthWrite', {
  web: () => import('./web').then((m) => new m.NourishHealthWriteWeb()),
})

export * from './definitions'
