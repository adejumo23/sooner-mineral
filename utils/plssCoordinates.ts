/**
 * PLSS (Public Land Survey System) coordinate calculations for Oklahoma
 * 
 * Oklahoma uses the Indian Meridian and Base Line as the origin point.
 * Each township is 6 miles x 6 miles, containing 36 sections (1 mile x 1 mile each).
 * 
 * Format: Section-Township-Range (e.g., "06-01S-03W")
 * - Section: 01-36
 * - Township: Number + N/S direction (e.g., "01S" = Township 1 South)
 * - Range: Number + E/W direction (e.g., "03W" = Range 3 West)
 */

// Oklahoma PLSS Origin (Indian Meridian and Base Line intersection)
// Initial Point: approximately 34°30′24″N, 97°14′49″W
// Located one mile south of Fort Arbuckle, near Davis, OK
// Source: https://en.wikipedia.org/wiki/Indian_meridian
const INDIAN_MERIDIAN_LON = -97.2469; // Indian Meridian longitude (97°14′49″W)
const BASE_LINE_LAT = 34.5067; // Base Line latitude (34°30′24″N)

// PLSS grid constants
const MILES_PER_DEGREE_LAT = 69.0; // Approximate miles per degree of latitude
const MILES_PER_DEGREE_LON_AT_OK = 54.6; // Approximate miles per degree of longitude at Oklahoma latitude (~35°)

const TOWNSHIP_SIZE_MILES = 6; // 6 miles x 6 miles
const SECTION_SIZE_MILES = 1; // 1 mile x 1 mile

/**
 * Parse PLSS STR format (e.g., "06-01S-03W")
 * @param str - PLSS string in format Section-Township-Range
 * @returns Object with section, township number, township direction, range number, range direction
 */
export interface ParsedPLSS {
  section: number;
  townshipNumber: number;
  townshipDirection: 'N' | 'S';
  rangeNumber: number;
  rangeDirection: 'E' | 'W';
  isValid: boolean;
}

export function parsePLSS(str: string): ParsedPLSS {
  const defaultResult: ParsedPLSS = {
    section: 0,
    townshipNumber: 0,
    townshipDirection: 'N',
    rangeNumber: 0,
    rangeDirection: 'E',
    isValid: false
  };

  if (!str || typeof str !== 'string') {
    return defaultResult;
  }

  // Clean the string
  const cleanStr = str.trim().replace(/\s+/g, '');
  
  // Split by dash
  const parts = cleanStr.split('-');
  if (parts.length < 3) {
    return defaultResult;
  }

  // Parse section (first part)
  const section = parseInt(parts[0], 10);
  if (isNaN(section) || section < 1 || section > 36) {
    return defaultResult;
  }

  // Parse township (second part, e.g., "01S" or "1N")
  const townshipStr = parts[1].trim().toUpperCase();
  const townshipMatch = townshipStr.match(/^(\d+)([NS])$/);
  if (!townshipMatch) {
    return defaultResult;
  }
  const townshipNumber = parseInt(townshipMatch[1], 10);
  const townshipDirection = townshipMatch[2] as 'N' | 'S';

  // Parse range (third part, e.g., "03W" or "3E")
  const rangeStr = parts[2].trim().toUpperCase();
  const rangeMatch = rangeStr.match(/^(\d+)([EW])$/);
  if (!rangeMatch) {
    return defaultResult;
  }
  const rangeNumber = parseInt(rangeMatch[1], 10);
  const rangeDirection = rangeMatch[2] as 'E' | 'W';

  return {
    section,
    townshipNumber,
    townshipDirection,
    rangeNumber,
    rangeDirection,
    isValid: true
  };
}

/**
 * Calculate the position of a section within a township
 * PLSS sections are numbered in a boustrophedon pattern:
 * 
 *  6  5  4  3  2  1
 *  7  8  9 10 11 12
 * 18 17 16 15 14 13
 * 19 20 21 22 23 24
 * 30 29 28 27 26 25
 * 31 32 33 34 35 36
 * 
 * @param sectionNumber - Section number (1-36)
 * @returns Object with row and column (0-indexed, from NW corner)
 */
function getSectionPosition(sectionNumber: number): { row: number; col: number } {
  // Convert 1-based section to 0-based index
  const sectionIndex = sectionNumber - 1;
  
  // Calculate row (0-5, top to bottom)
  const row = Math.floor(sectionIndex / 6);
  
  // Calculate column (0-5, left to right)
  // Odd rows (0, 2, 4) go left to right, even rows (1, 3, 5) go right to left
  const colInRow = sectionIndex % 6;
  const col = (row % 2 === 0) ? colInRow : (5 - colInRow);
  
  return { row, col };
}

/**
 * Calculate geographic coordinates for a PLSS section
 * @param plss - Parsed PLSS data
 * @returns Center coordinates [longitude, latitude] of the section
 */
export function calculatePLSSCoordinates(plss: ParsedPLSS): [number, number] | null {
  if (!plss.isValid) {
    return null;
  }

  // Calculate township offset from origin
  // Townships south of base line are negative, north are positive
  const townshipOffset = plss.townshipDirection === 'S' 
    ? -plss.townshipNumber 
    : plss.townshipNumber;
  
  // Calculate range offset from origin
  // Ranges west of meridian are negative, east are positive
  const rangeOffset = plss.rangeDirection === 'W' 
    ? -plss.rangeNumber 
    : plss.rangeNumber;

  // Calculate township center coordinates
  const townshipLat = BASE_LINE_LAT + (townshipOffset * TOWNSHIP_SIZE_MILES / MILES_PER_DEGREE_LAT);
  const townshipLon = INDIAN_MERIDIAN_LON + (rangeOffset * TOWNSHIP_SIZE_MILES / MILES_PER_DEGREE_LON_AT_OK);

  // Get section position within township
  const sectionPos = getSectionPosition(plss.section);
  
  // Calculate section offset within township
  // Sections are 1 mile x 1 mile
  // Row 0 is northernmost, Col 0 is westernmost
  const sectionLatOffset = (sectionPos.row - 2.5) * (SECTION_SIZE_MILES / MILES_PER_DEGREE_LAT);
  const sectionLonOffset = (sectionPos.col - 2.5) * (SECTION_SIZE_MILES / MILES_PER_DEGREE_LON_AT_OK);

  // Calculate section center coordinates
  const sectionLat = townshipLat + sectionLatOffset;
  const sectionLon = townshipLon + sectionLonOffset;

  return [sectionLon, sectionLat];
}

/**
 * Calculate the bounding box (extent) of a PLSS section
 * @param plss - Parsed PLSS data
 * @returns Bounding box as [minLon, minLat, maxLon, maxLat]
 */
export function calculatePLSSBounds(plss: ParsedPLSS): [number, number, number, number] | null {
  if (!plss.isValid) {
    return null;
  }

  const center = calculatePLSSCoordinates(plss);
  if (!center) {
    return null;
  }

  const [centerLon, centerLat] = center;
  
  // Section is 1 mile x 1 mile
  const halfSectionLat = (SECTION_SIZE_MILES / 2) / MILES_PER_DEGREE_LAT;
  const halfSectionLon = (SECTION_SIZE_MILES / 2) / MILES_PER_DEGREE_LON_AT_OK;

  return [
    centerLon - halfSectionLon, // minLon
    centerLat - halfSectionLat, // minLat
    centerLon + halfSectionLon, // maxLon
    centerLat + halfSectionLat  // maxLat
  ];
}

/**
 * Create polygon coordinates for a PLSS section
 * @param plss - Parsed PLSS data
 * @returns Array of [lon, lat] coordinates for polygon rings
 */
export function createPLSSPolygon(plss: ParsedPLSS): number[][] | null {
  const bounds = calculatePLSSBounds(plss);
  if (!bounds) {
    return null;
  }

  const [minLon, minLat, maxLon, maxLat] = bounds;

  // Create square polygon (clockwise from NW corner)
  return [
    [minLon, maxLat], // NW
    [maxLon, maxLat], // NE
    [maxLon, minLat], // SE
    [minLon, minLat], // SW
    [minLon, maxLat]  // Close polygon
  ];
}
