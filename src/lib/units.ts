// Weight unit handling. Weight is always stored canonically in kilograms; the
// unit here only controls how it is displayed and entered.
//
// The chosen unit is a deliberate per-DEVICE display preference kept in
// localStorage (the same approach as the height cm/ft preference), not part of
// the synced per-user state. Account data (weigh-ins, custom target) syncs in
// cloud mode; the display unit follows the device.

export type WeightUnit = 'kg' | 'lbs'

export const KG_PER_LB = 0.45359237
export const kgToLbs = (kg: number) => kg / KG_PER_LB
export const lbsToKg = (lb: number) => lb * KG_PER_LB

const WEIGHT_UNIT_KEY = 'nourish.weightUnit'

export function getWeightUnit(): WeightUnit {
  try {
    return (localStorage.getItem(WEIGHT_UNIT_KEY) as WeightUnit) === 'lbs' ? 'lbs' : 'kg'
  } catch {
    return 'kg'
  }
}

export function setWeightUnitPref(unit: WeightUnit): void {
  try {
    localStorage.setItem(WEIGHT_UNIT_KEY, unit)
  } catch {
    /* ignore unavailable storage */
  }
}

// Convert a canonical kg value into the chosen unit, rounded for display/entry.
export function fromKg(kg: number, unit: WeightUnit, decimals = 0): number {
  const v = unit === 'kg' ? kg : kgToLbs(kg)
  const f = Math.pow(10, decimals)
  return Math.round(v * f) / f
}

// Convert a value entered in the chosen unit back to canonical kg.
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbsToKg(value)
}
