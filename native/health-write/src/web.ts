import { WebPlugin } from '@capacitor/core'
import type { NourishHealthWritePlugin, NutritionEntry } from './definitions'

// Web has no Health store — these are no-ops so the same code runs in the PWA.
export class NourishHealthWriteWeb extends WebPlugin implements NourishHealthWritePlugin {
  async requestPermissions(): Promise<{ granted: boolean }> {
    return { granted: false }
  }
  async writeNutrition(_entry: NutritionEntry): Promise<{ ok: boolean }> {
    return { ok: false }
  }
}
