/**
 * Centralized glaze calculation utilities
 * Single source of truth for all glaze cost calculations
 */

/**
 * Calculate glaze cost based on cubic inches and rate per cubic inch
 * @param cubicInches - Volume of the piece in cubic inches
 * @param glazeRatePerCubicInch - Cost per cubic inch for glaze
 * @returns Calculated glaze cost rounded to 2 decimal places
 */
export const calculateGlazeCost = (
  cubicInches: number,
  glazeRatePerCubicInch: number
): number => {
  if (!cubicInches || !glazeRatePerCubicInch || cubicInches <= 0) {
    return 0;
  }
  
  return Math.round(cubicInches * glazeRatePerCubicInch * 100) / 100;
};

/**
 * Format glaze cost for display with currency symbol
 * @param cost - The calculated glaze cost
 * @returns Formatted cost string (e.g., "$1.25")
 */
export const formatGlazeCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};