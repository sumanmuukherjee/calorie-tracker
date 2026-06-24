export interface NutritionEntry {
  /** ISO date (yyyy-mm-dd) the nutrition is logged for. */
  date: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  waterMl?: number
}

export interface NourishHealthWritePlugin {
  /** Request OS permission to WRITE nutrition + hydration to Health. */
  requestPermissions(): Promise<{ granted: boolean }>
  /** Write a day's nutrition totals to Apple Health / Health Connect. */
  writeNutrition(entry: NutritionEntry): Promise<{ ok: boolean }>
}
