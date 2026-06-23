import type { Food } from '../types'

// Live search against USDA FoodData Central — a free, official US government
// database of ~2M foods (whole foods + branded products). It sends CORS
// headers, so the browser can call it directly. A free API key (instant signup
// at https://fdc.nal.usda.gov/api-key-signup) raises limits to 1,000 req/hour;
// DEMO_KEY works out of the box for light use.
const API_KEY = (import.meta.env.VITE_USDA_API_KEY as string | undefined) || 'DEMO_KEY'
const ENDPOINT = 'https://api.nal.usda.gov/fdc/v1/foods/search'

interface FdcNutrient {
  nutrientNumber?: string
  value?: number
}
interface FdcFood {
  fdcId: number
  description?: string
  dataType?: string
  brandName?: string
  brandOwner?: string
  foodNutrients?: FdcNutrient[]
}

// USDA nutrient numbers: energy (kcal) 208, protein 203, carbs 205, fat 204.
function nutrient(nutrients: FdcNutrient[], num: string): number {
  const match = nutrients.find((n) => String(n.nutrientNumber) === num)
  return match && typeof match.value === 'number' ? Math.max(0, Math.round(match.value)) : 0
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export async function searchFoods(query: string): Promise<Food[]> {
  const params = new URLSearchParams({
    query,
    pageSize: '25',
    api_key: API_KEY,
    dataType: 'Foundation,SR Legacy,Branded',
  })
  try {
    const res = await fetch(`${ENDPOINT}?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as { foods?: FdcFood[] }
    // Generic whole foods (Foundation/SR/Survey) are more accurate for common
    // searches than branded products, so surface them first.
    const foods = [...(data.foods ?? [])].sort(
      (a, b) => (a.dataType === 'Branded' ? 1 : 0) - (b.dataType === 'Branded' ? 1 : 0),
    )
    const out: Food[] = []
    const seen = new Set<string>()

    for (const f of foods) {
      const desc = (f.description ?? '').trim()
      if (!desc) continue
      const nutrients = f.foodNutrients ?? []
      const kcal = nutrient(nutrients, '208')
      if (!kcal) continue

      const brand = f.brandName || f.brandOwner
      const label = brand ? `${titleCase(desc)} (${titleCase(brand)})` : titleCase(desc)
      const key = label.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      out.push({
        id: `usda_${f.fdcId}`,
        name: label.length > 48 ? `${label.slice(0, 47)}…` : label,
        portion: 'per 100 g',
        kcal,
        p: nutrient(nutrients, '203'),
        c: nutrient(nutrients, '205'),
        f: nutrient(nutrients, '204'),
      })
      if (out.length >= 15) break
    }
    return out
  } catch {
    return []
  }
}
