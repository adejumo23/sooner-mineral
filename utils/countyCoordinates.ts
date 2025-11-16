// Shared utility for county-based map centering
// Used across all map components in the application

export interface CountyCoordinates {
  [stateCode: string]: {
    [countyName: string]: [number, number];
  };
}

// Helper function to get county center coordinates
export const getCountyCenter = (county?: string, state?: string): [number, number] | null => {
  if (!county || !state) {
    console.log(`getCountyCenter: Missing county (${county}) or state (${state})`);
    return null;
  }
  
  // Normalize county name for lookup (remove "County" suffix, trim, lowercase, handle multi-word names)
  let normalizedCounty = county.trim().toLowerCase().replace(/\s+county\s*$/i, '');
  // Handle multi-word county names (e.g., "Roger Mills" -> "roger mills")
  normalizedCounty = normalizedCounty.replace(/\s+/g, ' ').trim();
  const stateCode = state.toUpperCase();
  
  console.log(`getCountyCenter: Looking up county="${county}" (normalized: "${normalizedCounty}"), state="${state}" (code: "${stateCode}")`);
  
  // County coordinates by state and county name
  // Oklahoma - All 77 counties
  const countyCenters: CountyCoordinates = {
    'OK': {
      'adair': [-94.6339, 35.8844], // Stilwell
      'alfalfa': [-98.5806, 36.7550], // Cherokee
      'atoka': [-96.1281, 34.3858], // Atoka
      'beaver': [-100.5331, 36.8125], // Beaver
      'beckham': [-99.3350, 35.2681], // Sayre
      'blaine': [-98.4331, 35.8750], // Watonga
      'bryan': [-96.3881, 33.9931], // Durant
      'caddo': [-98.3706, 35.3881], // Anadarko
      'canadian': [-97.9767, 35.4676], // El Reno
      'carter': [-97.1431, 34.2231], // Ardmore
      'cherokee': [-94.9700, 35.9100], // Tahlequah
      'choctaw': [-95.3700, 34.0200], // Hugo
      'cimarron': [-102.5100, 36.7500], // Boise City
      'cleveland': [-97.4867, 35.3278], // Norman
      'coal': [-96.2200, 34.5900], // Coalgate
      'comanche': [-98.3856, 34.6037], // Lawton
      'cotton': [-98.3800, 34.2900], // Walters
      'craig': [-95.2100, 36.7900], // Vinita
      'creek': [-96.0081, 35.9981], // Sapulpa
      'custer': [-99.0000, 35.5400], // Arapaho
      'delaware': [-94.6500, 36.4100], // Jay
      'dewey': [-99.2700, 35.9800], // Taloga
      'ellis': [-99.7500, 36.2200], // Arnett
      'garfield': [-97.8800, 36.4000], // Enid
      'garvin': [-97.5900, 34.7300], // Pauls Valley
      'grady': [-97.9600, 35.0200], // Chickasha
      'grant': [-97.6700, 36.8000], // Medford
      'greer': [-99.5600, 34.9400], // Mangum
      'harmon': [-99.8500, 34.7400], // Hollis
      'harper': [-99.6800, 36.8400], // Buffalo
      'haskell': [-95.6700, 35.2200], // Stigler
      'hughes': [-96.2500, 35.0500], // Holdenville
      'jackson': [-99.3300, 34.6200], // Altus
      'jefferson': [-97.7800, 34.1100], // Waurika
      'johnston': [-96.6800, 34.3200], // Tishomingo
      'kay': [-97.0000, 36.7000], // Newkirk
      'kingfisher': [-97.9300, 35.8600], // Kingfisher
      'kiowa': [-98.9800, 34.7300], // Hobart
      'latimer': [-95.3100, 34.9200], // Wilburton
      'le flore': [-94.6300, 34.9000], // Poteau
      'leflore': [-94.6300, 34.9000], // Poteau (alternative spelling)
      'lincoln': [-96.9200, 35.7000], // Chandler
      'logan': [-97.6000, 35.8500], // Guthrie
      'love': [-97.3200, 33.9600], // Marietta
      'mcclain': [-97.3300, 35.0100], // Purcell
      'mccurtain': [-94.6200, 34.0300], // Idabel
      'mcintosh': [-95.7700, 35.3800], // Eufaula
      'major': [-98.3000, 36.3100], // Fairview
      'marshall': [-96.7700, 34.0200], // Madill
      'mayes': [-95.3100, 36.3000], // Pryor Creek
      'murray': [-97.0100, 34.4800], // Sulphur
      'muskogee': [-95.3700, 35.7500], // Muskogee
      'noble': [-97.4000, 36.3900], // Perry
      'nowata': [-95.6400, 36.7000], // Nowata
      'okfuskee': [-96.3200, 35.4600], // Okemah
      'oklahoma': [-97.5164, 35.4676], // Oklahoma City
      'okmulgee': [-95.9700, 35.6200], // Okmulgee
      'osage': [-96.0000, 36.6300], // Pawhuska
      'ottawa': [-94.8100, 36.8400], // Miami
      'pawnee': [-96.8000, 36.3400], // Pawnee
      'payne': [-97.0920, 36.1263], // Stillwater
      'pittsburg': [-95.7700, 35.0200], // McAlester
      'pontotoc': [-96.6800, 34.6500], // Ada
      'pottawatomie': [-97.0017, 35.3278], // Shawnee
      'pushmataha': [-95.3200, 34.4200], // Antlers
      'roger mills': [-99.6900, 35.6800], // Cheyenne
      'rogers': [-95.7694, 36.3120], // Claremore
      'seminole': [-96.6700, 35.2200], // Wewoka
      'sequoyah': [-94.6300, 35.5000], // Sallisaw
      'stephens': [-97.9600, 34.4800], // Duncan
      'texas': [-101.7800, 36.7500], // Guymon
      'tillman': [-98.9200, 34.3800], // Frederick
      'tulsa': [-95.9928, 36.1540], // Tulsa
      'wagoner': [-95.3800, 35.9600], // Wagoner
      'washington': [-95.9900, 36.7600], // Bartlesville
      'washita': [-98.9200, 35.2900], // Cordell
      'woods': [-98.8700, 36.7500], // Alva
      'woodward': [-99.3900, 36.4300], // Woodward
    },
    'TX': {
      'andrews': [-102.5456, 32.3189], // Andrews
      'borden': [-101.4300, 32.7400], // Gail
      'coke': [-100.5300, 31.8900], // Robert Lee
      'concho': [-99.8600, 31.3300], // Paint Rock
      'crane': [-102.3500, 31.4000], // Crane
      'crosby': [-101.2400, 33.6200], // Crosbyton
      'dawson': [-101.7200, 32.7400], // Lamesa
      'ector': [-102.3676, 31.8486], // Odessa
      'glasscock': [-101.5203, 31.8693], // Garden City
      'howard': [-101.4353, 32.3060], // Big Spring
      'irion': [-100.9800, 31.3000], // Mertzon
      'loving': [-103.5500, 31.8500], // Mentone
      'martin': [-101.9500, 32.3100], // Stanton
      'midland': [-102.0776, 31.9686], // Midland
      'pecos': [-103.0500, 30.7800], // Fort Stockton
      'reagan': [-101.5231, 31.3669], // Big Lake
      'reeves': [-103.6800, 31.3200], // Pecos
      'sterling': [-101.0000, 31.8400], // Sterling City
      'terry': [-102.3300, 33.1800], // Brownfield
      'upton': [-102.5439, 31.2126], // Rankin
      'ward': [-102.7600, 31.5100], // Monahans
      'winkler': [-103.0400, 31.8500], // Kermit
      'yoakum': [-102.8300, 33.1800], // Plains
    },
  };
  
  const stateCounties = countyCenters[stateCode];
  if (!stateCounties) {
    console.log(`getCountyCenter: No counties found for state code "${stateCode}"`);
    return null;
  }
  
  const coordinates = stateCounties[normalizedCounty];
  if (coordinates) {
    console.log(`getCountyCenter: Found coordinates for "${normalizedCounty}":`, coordinates);
    return coordinates;
  }
  
  console.log(`getCountyCenter: County "${normalizedCounty}" not found in state "${stateCode}". Available counties:`, Object.keys(stateCounties));
  return null;
};

// Helper function to get state center coordinates (fallback)
export const getStateCenter = (state?: string): [number, number] => {
  const stateCenters: { [key: string]: [number, number] } = {
    'OK': [-97.5164, 35.4676], // Oklahoma City, OK
    'TX': [-102.0776, 31.9686], // Midland, TX
    'NM': [-106.2485, 34.5199], // Santa Fe, NM
    'CO': [-105.3111, 39.7392], // Denver, CO
    'KS': [-98.4842, 39.0119], // Topeka, KS
    'AR': [-92.3731, 34.7465], // Little Rock, AR
    'LA': [-91.1869, 30.4515], // Baton Rouge, LA
  };
  
  if (state && stateCenters[state.toUpperCase()]) {
    return stateCenters[state.toUpperCase()];
  }
  
  // Default to Oklahoma if state not found
  return [-97.5164, 35.4676];
};

