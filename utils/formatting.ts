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

/**
 * Format OCC date (or any date) as mm/dd/yyyy for display.
 * Accepts YYYY-MM-DD string, ISO string, Excel serial number, or Date.
 * @param value - Date string, number (Excel serial), or null/undefined
 * @param fallback - String when value is empty (default '—')
 * @returns Formatted mm/dd/yyyy or fallback
 */
export const formatOccDate = (
  value: string | number | null | undefined,
  fallback: string = '—'
): string => {
  if (value == null || value === '') return fallback;
  if (typeof value === 'number') {
    if (value < 1 || value > 1000000) return fallback;
    const date = new Date((value - 25569) * 86400 * 1000);
    if (Number.isNaN(date.getTime())) return fallback;
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${m}/${d}/${y}`;
  }
  const s = String(value).trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (ymd) {
    return `${ymd[2]}/${ymd[3]}/${ymd[1]}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
};

