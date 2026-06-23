import type { Food } from '../types'

export const FOODS: Food[] = [
  { id: 'oatmeal', name: 'Oatmeal', portion: '1 cup cooked', kcal: 158, p: 6, c: 27, f: 3 },
  { id: 'greek-yogurt', name: 'Greek yogurt', portion: '1 cup, plain', kcal: 130, p: 17, c: 9, f: 0 },
  { id: 'banana', name: 'Banana', portion: '1 medium', kcal: 105, p: 1, c: 27, f: 0 },
  { id: 'eggs', name: 'Eggs', portion: '2 large', kcal: 156, p: 12, c: 1, f: 10 },
  { id: 'chicken-breast', name: 'Chicken breast', portion: '6 oz grilled', kcal: 280, p: 53, c: 0, f: 6 },
  { id: 'brown-rice', name: 'Brown rice', portion: '1 cup', kcal: 216, p: 5, c: 45, f: 2 },
  { id: 'salmon', name: 'Salmon', portion: '5 oz baked', kcal: 280, p: 39, c: 0, f: 13 },
  { id: 'almonds', name: 'Almonds', portion: '1 oz', kcal: 164, p: 6, c: 6, f: 14 },
  { id: 'protein-shake', name: 'Protein shake', portion: '1 scoop + water', kcal: 160, p: 30, c: 5, f: 2 },
  { id: 'apple', name: 'Apple', portion: '1 medium', kcal: 95, p: 0, c: 25, f: 0 },
  { id: 'avocado', name: 'Avocado', portion: '1/2 fruit', kcal: 160, p: 2, c: 9, f: 15 },
  { id: 'sweet-potato', name: 'Sweet potato', portion: '1 medium', kcal: 112, p: 2, c: 26, f: 0 },
  { id: 'broccoli', name: 'Steamed broccoli', portion: '1 cup', kcal: 55, p: 4, c: 11, f: 1 },
  { id: 'olive-oil', name: 'Olive oil', portion: '1 tbsp', kcal: 119, p: 0, c: 0, f: 14 },
  { id: 'coffee-milk', name: 'Coffee w/ milk', portion: '1 mug', kcal: 50, p: 2, c: 4, f: 2 },
]

export const SEED_MEALS = {
  Breakfast: ['oatmeal', 'greek-yogurt', 'banana'],
  Lunch: ['chicken-breast', 'brown-rice'],
  Dinner: [] as string[],
  Snacks: ['almonds'],
}

export const PHOTO_DETECTED = [
  { id: 'chicken-breast', name: 'Grilled chicken', portion: '~6 oz', kcal: 320, p: 53, c: 0, f: 8, confidence: 92 },
  { id: 'white-rice', name: 'White rice', portion: '~1 cup', kcal: 205, p: 4, c: 45, f: 0, confidence: 88 },
  { id: 'broccoli', name: 'Steamed broccoli', portion: '~1 cup', kcal: 55, p: 4, c: 11, f: 1, confidence: 81 },
  { id: 'olive-oil', name: 'Olive oil drizzle', portion: '~1/2 tbsp', kcal: 60, p: 0, c: 0, f: 7, confidence: 63 },
]
