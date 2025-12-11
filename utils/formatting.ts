/**
 * Utility functions for formatting numbers and values across the application
 */

/**
 * Format Net Mineral Acres (NMA) to 6 decimal places
 * @param value - The NMA value to format (can be number, string, or null/undefined)
 * @returns Formatted string with 6 decimal places, or 'N/A' if value is invalid
 */
export const formatNMA = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'N/A';
  }
  
  return numValue.toFixed(6);
};

/**
 * Format acres (for gross acres, calculated acreage, etc.) to 2 decimal places
 * @param value - The acreage value to format
 * @returns Formatted string with 2 decimal places, or 'N/A' if value is invalid
 */
export const formatAcres = (value?: number): string => {
  return value ? value.toFixed(2) : 'N/A';
};

/**
 * Format percentage to 2 decimal places with % symbol
 * @param value - The percentage value (as decimal, e.g., 0.125 for 12.5%)
 * @returns Formatted string with 2 decimal places and % symbol, or 'N/A'
 */
export const formatPercentage = (value?: number): string => {
  return value ? `${(value * 100).toFixed(2)}%` : 'N/A';
};

