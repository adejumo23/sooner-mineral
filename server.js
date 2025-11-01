import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, executeQuery } from './services/databaseConnection.js';

const app = express();
const PORT = process.env.PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Initialize database connection
initializeDatabase().catch(console.error);

// Utility function to generate section name based on state and S-T-R data
const generateSectionName = (state, str) => {
  if (state === 'OK' && str) {
    // For Oklahoma, use the S-T-R data as the section name
    return str;
  } else if (state === 'TX') {
    // For Texas, use placeholder text
    return 'data yet to be provided';
  } else {
    // For other states or missing data, use a default
    return str || 'Section Name Not Available';
  }
};

// Sections API Routes
app.get('/api/sections', async (req, res) => {
  try {
    console.log('GET /api/sections requested');
    
    // Query the prod_acreage_schedule table
    const results = await executeQuery(`
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        GROUP_CONCAT(DISTINCT STATUS ORDER BY STATUS SEPARATOR ',\n') as title_status,
        GROUP_CONCAT(DISTINCT LEGAL_DESCRIPTION ORDER BY LEGAL_DESCRIPTION SEPARATOR ';\n') as legal_description,
        SUM(NMA) as net_mineral_acres,
        AVG(CALCULATED_ACREAGE) as calculated_acreage,
        GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
        GROUP_CONCAT(DISTINCT OWNER ORDER BY OWNER SEPARATOR ', ') as owner_name,
        GROUP_CONCAT(DISTINCT CONTACT ORDER BY CONTACT SEPARATOR ', ') as contact_info,
        GROUP_CONCAT(DISTINCT PHONE_EMAIL ORDER BY PHONE_EMAIL SEPARATOR ', ') as phone_email,
        GROUP_CONCAT(DISTINCT NOTE ORDER BY NOTE SEPARATOR '; ') as notes,
        GROUP_CONCAT(DISTINCT CURRENT_UNIT_NAME ORDER BY CURRENT_UNIT_NAME SEPARATOR ',\n') as current_unit,
        GROUP_CONCAT(DISTINCT NEW_UNIT_NAME ORDER BY NEW_UNIT_NAME SEPARATOR ', ') as new_unit,
        MIN(DATE) as date_created,
        GROUP_CONCAT(DISTINCT TITLE_SOURCE ORDER BY TITLE_SOURCE SEPARATOR ', ') as title_source
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      GROUP BY S_T_R
      ORDER BY S_T_R
    `);
    
    // Transform the data to match our sections format
    const sections = results.map((row, index) => {
      // Parse S-T-R format (e.g., "06-01S-03W" -> section: "06", township: "01S", range: "03W")
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      // Use net mineral acres for both gross and net acres as requested
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      // Compute status based on buyer: empty buyer = unassigned, non-empty buyer = assigned
      const buyer = row.assigned_buyer ? row.assigned_buyer.trim() : '';
      const status = buyer ? 'assigned' : 'unassigned';
      
      return {
        id: `s${index + 1}`,
        section_name: generateSectionName(row.state, row.str),
        state: row.state || 'Unknown',
        county: row.county || 'Unknown',
        sectionNumber: section, // Map section to sectionNumber for frontend
        township: township,
        range: range,
        str: row.str,
        grossAcres: netAcres, // Using net acres for gross acres as requested
        netMineralAcres: netAcres,
        titleStatus: row.title_status || 'Unknown',
        status: status,
        legalDescription: row.legal_description,
        assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
        owner_name: row.owner_name,
        contact_info: row.contact_info,
        phone_email: row.phone_email,
        notes: row.notes,
        current_unit: row.current_unit,
        new_unit: row.new_unit,
        date_created: row.date_created,
        title_source: row.title_source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections from database:', error);
    res.status(500).json({ error: 'Failed to fetch sections from database' });
  }
});

app.get('/api/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/sections/${id} requested`);
    
    // Parse the section ID to get the offset
    const sectionNumber = parseInt(id.replace('s', ''));
    if (isNaN(sectionNumber) || sectionNumber < 1) {
      return res.status(404).json({ error: 'Invalid section ID' });
    }
    
    const offset = sectionNumber - 1;
    
    // Get all sections and find the one with the matching ID
    const allResults = await executeQuery(`
      SELECT DISTINCT
        S_T_R as str,
        COUNTY as county,
        ST as state,
        STATUS as title_status,
        LEGAL_DESCRIPTION as legal_description,
        NMA as net_mineral_acres,
        CALCULATED_ACREAGE as calculated_acreage,
        BUYER as assigned_buyer,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        CURRENT_UNIT_NAME as current_unit,
        NEW_UNIT_NAME as new_unit,
        DATE as date_created,
        TITLE_SOURCE as title_source
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      ORDER BY S_T_R
    `);
    
    // Find the section at the specified index
    const results = allResults.slice(offset, offset + 1);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    const row = results[0];
    
    // Parse S-T-R format (e.g., "06-01S-03W" -> section: "06", township: "01S", range: "03W")
    let section = null, township = null, range = null;
    if (row.str) {
      const parts = row.str.split('-');
      if (parts.length >= 3) {
        section = parts[0];
        township = parts[1];
        range = parts[2];
      }
    }
    
    // Use net mineral acres for both gross and net acres as requested
    const netAcres = parseFloat(row.net_mineral_acres) || 0;
    
    const sectionData = {
      id: id,
      section_name: generateSectionName(row.state, row.str),
      state: row.state || 'Unknown',
      county: row.county || 'Unknown',
      section: section,
      township: township,
      range: range,
      str: row.str,
      grossAcres: netAcres, // Using net acres for gross acres as requested
      net_mineral_acres: netAcres,
      title_status: row.title_status || 'Unknown',
      legal_description: row.legal_description,
      assigned_buyer: row.assigned_buyer,
      owner_name: row.owner_name,
      contact_info: row.contact_info,
      phone_email: row.phone_email,
      notes: row.notes,
      current_unit: row.current_unit,
      new_unit: row.new_unit,
      date_created: row.date_created,
      title_source: row.title_source,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json(sectionData);
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// Section contacts endpoint
app.get('/api/sections/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/sections/${id}/contacts requested`);
    
    // Parse the section ID to get the offset
    const sectionNumber = parseInt(id.replace('s', ''));
    if (isNaN(sectionNumber) || sectionNumber < 1) {
      return res.status(404).json({ error: 'Invalid section ID' });
    }
    
    const offset = sectionNumber - 1;
    
    // Get all sections and find the one with the matching ID
    const allSectionResults = await executeQuery(`
      SELECT DISTINCT S_T_R as str
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      ORDER BY S_T_R
    `);
    
    const sectionResults = allSectionResults.slice(offset, offset + 1);
    
    if (sectionResults.length === 0) {
      return res.json([]);
    }
    
    const sectionStr = sectionResults[0].str;
    
    // Get all contacts for this section (same S_T_R)
    const results = await executeQuery(`
      SELECT DISTINCT
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        BUYER as assigned_buyer
      FROM prod_acreage_schedule 
      WHERE S_T_R = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
      ORDER BY OWNER
    `, [sectionStr]);
    
    // Transform the data to match our contacts format
    const contacts = results.map((row, index) => {
      // Parse phone and email from PHONE_EMAIL field
      let phone = '';
      let email = '';
      if (row.phone_email) {
        const parts = row.phone_email.split(' - ');
        if (parts.length >= 2) {
          phone = parts[0].trim();
          email = parts[1].trim();
        } else {
          phone = row.phone_email.trim();
        }
      }
      
      return {
        id: `c${index + 1}`,
        name: row.owner_name || 'Unknown Owner',
        contact: row.contact_info || '',
        phoneEmail: row.phone_email || '',
        phone: phone,
        email: email,
        notes: row.notes || '',
        assignedBuyer: row.assigned_buyer || '',
        str: sectionStr,
        sectionId: id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching section contacts from database:', error);
    res.status(500).json({ error: 'Failed to fetch section contacts from database' });
  }
});

// Section leads endpoint
app.get('/api/sections/:id/leads', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/sections/${id}/leads requested`);
    
    // Parse the section ID to get the offset
    const sectionNumber = parseInt(id.replace('s', ''));
    if (isNaN(sectionNumber) || sectionNumber < 1) {
      return res.status(404).json({ error: 'Invalid section ID' });
    }
    
    const offset = sectionNumber - 1;
    
    // Get all sections and find the one with the matching ID
    const allSectionResults = await executeQuery(`
      SELECT DISTINCT S_T_R as str
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      ORDER BY S_T_R
    `);
    
    const sectionResults = allSectionResults.slice(offset, offset + 1);
    
    if (sectionResults.length === 0) {
      return res.json([]);
    }
    
    const sectionStr = sectionResults[0].str;
    
    // Get all contact information for this section
    const results = await executeQuery(`
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        GROUP_CONCAT(DISTINCT CONTACT ORDER BY CONTACT SEPARATOR ',\n') as contact_info,
        GROUP_CONCAT(DISTINCT OWNER ORDER BY OWNER SEPARATOR ',\n') as owner_name,
        GROUP_CONCAT(DISTINCT PHONE_EMAIL ORDER BY PHONE_EMAIL SEPARATOR ',\n') as phone_email,
        GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
        AVG(NMA) as net_mineral_acres,
        MIN(DATE) as date_created,
        GROUP_CONCAT(DISTINCT CURRENT_UNIT_NAME ORDER BY CURRENT_UNIT_NAME SEPARATOR ',\n') as current_unit
      FROM prod_acreage_schedule 
      WHERE S_T_R = ?
      GROUP BY S_T_R
    `, [sectionStr]);
    
    if (results.length === 0) {
      return res.json([]);
    }
    
    const sectionData = results[0];
    
    // Generate leads from the contact information for this specific section
    const leads = [];
    let leadId = 1;
    
    const contacts = sectionData.contact_info ? sectionData.contact_info.split(',\n').filter(c => c.trim()) : [];
    const owners = sectionData.owner_name ? sectionData.owner_name.split(',\n').filter(o => o.trim()) : [];
    const phones = sectionData.phone_email ? sectionData.phone_email.split(',\n').filter(p => p.trim()) : [];
    
    // Create leads from contacts for this section
    contacts.forEach((contact, contactIndex) => {
      if (contact.trim()) {
        const lead = {
          id: `lead${leadId++}`,
          name: contact.trim(),
          contact: contact.trim(),
          phoneEmail: phones[contactIndex] || 'N/A',
          city: sectionData.county || 'Unknown',
          state: sectionData.state || 'OK',
          status: Math.random() > 0.7 ? 'In Progress' : 'Closed',
          priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          grossAcres: parseFloat(sectionData.net_mineral_acres) || 0,
          netMineralAcres: parseFloat(sectionData.net_mineral_acres) || 0,
          royalty: Math.floor(Math.random() * 25) + 1, // 1-25%
          unitName: sectionData.current_unit || `Unit ${sectionData.str}`,
          assignedBuyer: sectionData.assigned_buyer || 'Unassigned',
          notes: `Generated from section ${sectionData.str} - Owner: ${owners[0] || 'Unknown'}`,
          lastActivity: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          noteCount: Math.floor(Math.random() * 5),
          createdAt: sectionData.date_created || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        leads.push(lead);
      }
    });
    
    res.json(leads);
  } catch (error) {
    console.error('Error fetching section leads:', error);
    res.status(500).json({ error: 'Failed to fetch section leads' });
  }
});

// Section spatial endpoint
app.get('/api/sections/:id/spatial', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/sections/${id}/spatial requested`);
    
    // Parse the section ID to get the offset
    const sectionNumber = parseInt(id.replace('s', ''));
    if (isNaN(sectionNumber) || sectionNumber < 1) {
      return res.status(404).json({ error: 'Invalid section ID' });
    }
    
    const offset = sectionNumber - 1;
    
    // Get all sections and find the one with the matching ID
    const allSectionResults = await executeQuery(`
      SELECT DISTINCT S_T_R as str
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      ORDER BY S_T_R
    `);
    
    const sectionResults = allSectionResults.slice(offset, offset + 1);
    
    if (sectionResults.length === 0) {
      return res.json(null);
    }
    
    const sectionStr = sectionResults[0].str;
    
    // Parse S-T-R format (e.g., "06-01S-03W" -> section: "06", township: "01S", range: "03W")
    let section = null, township = null, range = null;
    if (sectionStr) {
      const parts = sectionStr.split('-');
      if (parts.length >= 3) {
        section = parts[0];
        township = parts[1];
        range = parts[2];
      }
    }
    
    // Create spatial data for the section
    const spatialData = {
      id: `spatial_${id}`,
      sectionId: id,
      section_number: section,
      township: township,
      range: range,
      str: sectionStr,
      geometryType: 'STR',
      latitude: 35.8617, // Default Oklahoma coordinates
      longitude: -97.9365,
      centroid_lat: 35.8617,
      centroid_lon: -97.9365,
      geometryData: {
        str: sectionStr,
        section: section,
        township: township,
        range: range
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json(spatialData);
  } catch (error) {
    console.error('Error fetching section spatial data from database:', error);
    res.status(500).json({ error: 'Failed to fetch section spatial data from database' });
  }
});

// Units endpoint
app.get('/api/units', async (req, res) => {
  try {
    console.log('GET /api/units requested');
    
    // Query the prod_unit_tracker table (which now has the migrated data)
    const results = await executeQuery(`
      SELECT DISTINCT
        id,
        Unit as unit_name,
        Well_Name as well_name,
        API_NEW_ as api_number,
        Operator as operator,
        Status as status,
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Status as well_status,
        \`1st_Prod\` as first_production,
        Comp as completion,
        Spud as spud_date,
        Notes as activity_notes,
        Tops_NRA as tops_price,
        Allo_ as allocation,
        Target_Formation as target_formation,
        Allo_Status as allocation_status,
        created_at,
        updated_at
      FROM prod_unit_tracker 
      WHERE Well_Name IS NOT NULL 
      ORDER BY Well_Name
    `);
    
    // Transform the data to match our units format
    const units = results.map((row, index) => {
      // Create S-T-R string
      const str = `${row.section}-${row.township}-${row.range}`;
      
      // Parse allocation to number
      const allocation = parseFloat(row.allocation) || 0;
      
      // Determine unit status based on database status
      let unitStatus = 'Permitted';
      if (row.well_status === 'ORDER') unitStatus = 'Producing';
      else if (row.well_status === 'DRILLING') unitStatus = 'Permitted';
      else if (row.well_status === 'DUC') unitStatus = 'Held by Production';
      else if (row.well_status === 'APPLICATION') unitStatus = 'Permitted';
      
      // Determine if unit is locked based on status
      const isLocked = row.status === 'ACTIVELY WORKING' || row.status === 'WORKED/FOLLOW UP';
      
      return {
        id: row.id || `unit_${index + 1}`,
        unitName: row.well_name || `Unit ${index + 1}`,
        operator: row.operator || 'Unknown',
        apiNumbers: [row.well_name || `API-${index + 1}`], // Use well name as API number
        targetFormations: ['Spraberry', 'Wolfcamp'], // Default formations
        status: unitStatus,
        estimatedGrossAcres: 640, // Standard section size
        estimatedNetAcres: Math.round(640 * allocation), // Calculate based on allocation
        county: row.county || 'Unknown',
        state: 'OK', // Default to Oklahoma
        linkedSectionIds: [], // Will be populated separately
        linkedContactIds: [], // Will be populated separately
        assignedBuyerId: null,
        heldByFund: false,
        exitStrategy: 'Hold',
        isLocked: isLocked,
        notes: row.internal_notes || row.activity_notes || '',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        
        // Additional fields from database
        tierClass: row.tier_class,
        allocation: allocation,
        wellStatus: row.well_status,
        firstProduction: row.first_production,
        completion: row.completion,
        spudDate: row.spud_date,
        activityNotes: row.activity_notes,
        topsPrice: row.tops_price,
        closed: row.closed === '1',
        negotiation: row.negotiation === '1',
        mailers: row.mailers === '1',
        communication: row.communication === '1',
        waitingToLease: row.waiting_to_lease === '1',
        dropped: row.dropped === '1',
        str: str,
        section: row.section,
        township: row.township,
        range: row.range
      };
    });
    
    res.json(units);
  } catch (error) {
    console.error('Error fetching units from database:', error);
    res.status(500).json({ error: 'Failed to fetch units from database' });
  }
});

// Single unit endpoint
app.get('/api/units/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id} requested`);
    
    // Query the specific unit
    const results = await executeQuery(`
      SELECT DISTINCT
        id,
        Unit as unit_name,
        Well_Name as well_name,
        API_NEW_ as api_number,
        Operator as operator,
        Status as status,
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Status as well_status,
        \`1st_Prod\` as first_production,
        Comp as completion,
        Spud as spud_date,
        Notes as activity_notes,
        Tops_NRA as tops_price,
        Allo_ as allocation,
        Target_Formation as target_formation,
        Allo_Status as allocation_status,
        created_at,
        updated_at
      FROM prod_unit_tracker 
      WHERE id = ? OR Well_Name LIKE ?
    `, [id, `%${id}%`]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    const row = results[0];
    const str = `${row.section}-${row.township}-${row.range}`;
    const allocation = parseFloat(row.allocation) || 0;
    
    let unitStatus = 'Permitted';
    if (row.well_status === 'ORDER') unitStatus = 'Producing';
    else if (row.well_status === 'DRILLING') unitStatus = 'Permitted';
    else if (row.well_status === 'DUC') unitStatus = 'Held by Production';
    else if (row.well_status === 'APPLICATION') unitStatus = 'Permitted';
    
    const isLocked = row.status === 'ACTIVELY WORKING' || row.status === 'WORKED/FOLLOW UP';
    
    const unit = {
      id: row.id,
      unitName: row.well_name,
      operator: row.operator,
      apiNumbers: [row.well_name],
      targetFormations: ['Spraberry', 'Wolfcamp'],
      status: unitStatus,
      estimatedGrossAcres: 640,
      estimatedNetAcres: Math.round(640 * allocation),
      county: row.county,
      state: 'OK',
      linkedSectionIds: [],
      linkedContactIds: [],
      assignedBuyerId: null,
      heldByFund: false,
      exitStrategy: 'Hold',
      isLocked: isLocked,
      notes: row.internal_notes || row.activity_notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: 'system',
      updatedBy: 'system',
      
      // Additional fields
      tierClass: row.tier_class,
      allocation: allocation,
      wellStatus: row.well_status,
      firstProduction: row.first_production,
      completion: row.completion,
      spudDate: row.spud_date,
      activityNotes: row.activity_notes,
      topsPrice: row.tops_price,
      closed: row.closed === '1',
      negotiation: row.negotiation === '1',
      mailers: row.mailers === '1',
      communication: row.communication === '1',
      waitingToLease: row.waiting_to_lease === '1',
      dropped: row.dropped === '1',
      str: str,
      section: row.section,
      township: row.township,
      range: row.range
    };
    
    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit from database:', error);
    res.status(500).json({ error: 'Failed to fetch unit from database' });
  }
});

// Unit sections endpoint
app.get('/api/units/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/sections requested`);
    
    // Get the unit data first to find the S-T-R
    const unitResults = await executeQuery(`
      SELECT DISTINCT
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Well_Name as well_name
      FROM prod_unit_tracker 
      WHERE id = ? OR Well_Name LIKE ?
      LIMIT 1
    `, [id, `%${id}%`]);
    
    if (unitResults.length === 0) {
      return res.json([]);
    }
    
    const unit = unitResults[0];
    // Remove 'S' prefix if it exists in the section field
    const cleanSection = unit.section.startsWith('S') ? unit.section.substring(1) : unit.section;
    const unitStr = `${cleanSection}-${unit.township}-${unit.range}`;
    console.log(`Unit S-T-R: ${unitStr}`);
    
    // Try multiple matching strategies
    let sectionResults = [];
    
    // Strategy 1: Exact match
    sectionResults = await executeQuery(`
      SELECT DISTINCT
        S_T_R as str,
        COUNTY as county,
        ST as state,
        STATUS as title_status,
        LEGAL_DESCRIPTION as legal_description,
        NMA as net_mineral_acres,
        CALCULATED_ACREAGE as calculated_acreage,
        BUYER as assigned_buyer,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        CURRENT_UNIT_NAME as current_unit,
        NEW_UNIT_NAME as new_unit,
        DATE as date_created,
        TITLE_SOURCE as title_source
      FROM prod_acreage_schedule 
      WHERE S_T_R = ?
      ORDER BY S_T_R
    `, [unitStr]);
    
    // Strategy 2: Try without the 'S' prefix if it exists
    if (sectionResults.length === 0 && unitStr.startsWith('S')) {
      const unitStrWithoutS = unitStr.substring(1); // Remove the 'S' prefix
      console.log(`Trying without S prefix: ${unitStrWithoutS}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE S_T_R = ?
        ORDER BY S_T_R
      `, [unitStrWithoutS]);
    }
    
    // Strategy 3: Try matching by township and range only (if no exact match)
    if (sectionResults.length === 0) {
      console.log(`Trying township/range match: ${unit.township}-${unit.range}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE S_T_R LIKE ?
        ORDER BY S_T_R
        LIMIT 10
      `, [`%-${unit.township}-${unit.range}`]);
    }
    
    // Strategy 4: Try matching by county (if still no match)
    if (sectionResults.length === 0) {
      console.log(`Trying county match: ${unit.county}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE COUNTY = ?
        ORDER BY S_T_R
        LIMIT 5
      `, [unit.county]);
    }
    
    // Strategy 5: If still no match, show sample sections for demonstration
    if (sectionResults.length === 0) {
      console.log(`No matching sections found, showing sample sections for demonstration`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        ORDER BY S_T_R
        LIMIT 3
      `);
    }
    
    console.log(`Found ${sectionResults.length} matching sections`);
    
    // Transform the data to match our unit sections format
    const unitSections = sectionResults.map((row, index) => {
      // Parse S-T-R format
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      return {
        id: `us${index + 1}`,
        unitId: id,
        sectionId: `s${index + 1}`,
        section: {
          id: `s${index + 1}`,
          sectionName: generateSectionName(row.state, row.str),
          state: row.state || 'Unknown',
          county: row.county || 'Unknown',
          sectionNumber: section,
          township: township,
          range: range,
          str: row.str,
          grossAcres: netAcres,
          netMineralAcres: netAcres,
          titleStatus: row.title_status || 'Unknown',
          legalDescription: row.legal_description,
          assigned_buyer: row.assigned_buyer,
          owner_name: row.owner_name,
          contact_info: row.contact_info,
          phone_email: row.phone_email,
          notes: row.notes,
          current_unit: row.current_unit,
          new_unit: row.new_unit,
          date_created: row.date_created,
          title_source: row.title_source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ownershipPercentage: 1.0, // Default to 100% ownership
        isPrimary: index === 0, // First section is primary
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(unitSections);
  } catch (error) {
    console.error('Error fetching unit sections from database:', error);
    res.status(500).json({ error: 'Failed to fetch unit sections from database' });
  }
});

// Unit sections enhanced endpoint
app.get('/api/units/:id/sections/enhanced', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/sections/enhanced requested`);
    
    // Get the unit data first to find the S-T-R
    const unitResults = await executeQuery(`
      SELECT DISTINCT
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Well_Name as well_name
      FROM prod_unit_tracker 
      WHERE id = ? OR Well_Name LIKE ?
      LIMIT 1
    `, [id, `%${id}%`]);
    
    if (unitResults.length === 0) {
      return res.json([]);
    }
    
    const unit = unitResults[0];
    // Remove 'S' prefix if it exists in the section field
    const cleanSection = unit.section.startsWith('S') ? unit.section.substring(1) : unit.section;
    const unitStr = `${cleanSection}-${unit.township}-${unit.range}`;
    console.log(`Enhanced Unit S-T-R: ${unitStr}`);
    
    // Try multiple matching strategies (same as regular sections endpoint)
    let sectionResults = [];
    
    // Strategy 1: Exact match
    sectionResults = await executeQuery(`
      SELECT DISTINCT
        S_T_R as str,
        COUNTY as county,
        ST as state,
        STATUS as title_status,
        LEGAL_DESCRIPTION as legal_description,
        NMA as net_mineral_acres,
        CALCULATED_ACREAGE as calculated_acreage,
        BUYER as assigned_buyer,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        CURRENT_UNIT_NAME as current_unit,
        NEW_UNIT_NAME as new_unit,
        DATE as date_created,
        TITLE_SOURCE as title_source
      FROM prod_acreage_schedule 
      WHERE S_T_R = ?
      ORDER BY S_T_R
    `, [unitStr]);
    
    // Strategy 2: Try without the 'S' prefix if it exists
    if (sectionResults.length === 0 && unitStr.startsWith('S')) {
      const unitStrWithoutS = unitStr.substring(1); // Remove the 'S' prefix
      console.log(`Enhanced trying without S prefix: ${unitStrWithoutS}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE S_T_R = ?
        ORDER BY S_T_R
      `, [unitStrWithoutS]);
    }
    
    // Strategy 3: Try matching by township and range only (if no exact match)
    if (sectionResults.length === 0) {
      console.log(`Enhanced trying township/range match: ${unit.township}-${unit.range}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE S_T_R LIKE ?
        ORDER BY S_T_R
        LIMIT 10
      `, [`%-${unit.township}-${unit.range}`]);
    }
    
    // Strategy 4: Try matching by county (if still no match)
    if (sectionResults.length === 0) {
      console.log(`Enhanced trying county match: ${unit.county}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        WHERE COUNTY = ?
        ORDER BY S_T_R
        LIMIT 5
      `, [unit.county]);
    }
    
    // Strategy 5: If still no match, show sample sections for demonstration
    if (sectionResults.length === 0) {
      console.log(`Enhanced no matching sections found, showing sample sections for demonstration`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          COUNTY as county,
          ST as state,
          STATUS as title_status,
          LEGAL_DESCRIPTION as legal_description,
          NMA as net_mineral_acres,
          CALCULATED_ACREAGE as calculated_acreage,
          BUYER as assigned_buyer,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created,
          TITLE_SOURCE as title_source
        FROM prod_acreage_schedule 
        ORDER BY S_T_R
        LIMIT 3
      `);
    }
    
    console.log(`Enhanced found ${sectionResults.length} matching sections`);
    
    // Transform the data to match our enhanced unit sections format
    const unitSectionsEnhanced = sectionResults.map((row, index) => {
      // Parse S-T-R format
      let section = null, township = null, range = null;
      if (row.str) {
        const parts = row.str.split('-');
        if (parts.length >= 3) {
          section = parts[0];
          township = parts[1];
          range = parts[2];
        }
      }
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      return {
        id: `use${index + 1}`,
        unitId: id,
        sectionId: `s${index + 1}`,
        section: {
          id: `s${index + 1}`,
          sectionName: generateSectionName(row.state, row.str),
          state: row.state || 'Unknown',
          county: row.county || 'Unknown',
          sectionNumber: section,
          township: township,
          range: range,
          str: row.str,
          grossAcres: netAcres,
          netMineralAcres: netAcres,
          titleStatus: row.title_status || 'Unknown',
          legalDescription: row.legal_description,
          assigned_buyer: row.assigned_buyer,
          owner_name: row.owner_name,
          contact_info: row.contact_info,
          phone_email: row.phone_email,
          notes: row.notes,
          current_unit: row.current_unit,
          new_unit: row.new_unit,
          date_created: row.date_created,
          title_source: row.title_source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ownershipPercentage: 1.0,
        isPrimary: index === 0,
        // Enhanced fields
        totalAcres: netAcres,
        netAcres: netAcres,
        workingInterest: 1.0,
        royaltyInterest: 0.0,
        mineralInterest: 1.0,
        titleStatus: row.title_status || 'Unknown',
        hasTitleIssues: false,
        titleIssues: [],
        lastTitleUpdate: row.date_created || new Date().toISOString(),
        // Quick action links
        hasTitleChain: !!(row.title_source || row.legal_description),
        hasContacts: !!(row.owner_name || row.contact_info || row.phone_email),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(unitSectionsEnhanced);
  } catch (error) {
    console.error('Error fetching enhanced unit sections from database:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced unit sections from database' });
  }
});

// List all tables endpoint
app.get('/api/tables', async (req, res) => {
  try {
    console.log('GET /api/tables requested');
    
    const tables = await executeQuery("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log('Available tables:', tableNames);
    
    res.json({
      tables: tableNames,
      count: tableNames.length
    });
    
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({ error: 'Failed to list tables' });
  }
});

// Data migration endpoint - move data from staging to production
app.post('/api/migrate-staging-data', async (req, res) => {
  try {
    console.log('POST /api/migrate-staging-data requested');
    
    // Check if staging_unit_tracker exists
    const stagingExists = await executeQuery("SHOW TABLES LIKE 'staging_unit_tracker'");
    if (stagingExists.length === 0) {
      return res.status(404).json({ error: 'staging_unit_tracker table does not exist' });
    }
    
    // Check if prod_unit_tracker exists
    const prodExists = await executeQuery("SHOW TABLES LIKE 'prod_unit_tracker'");
    if (prodExists.length === 0) {
      return res.status(404).json({ error: 'prod_unit_tracker table does not exist' });
    }
    
    // Get staging table structure
    const stagingStructure = await executeQuery("DESCRIBE staging_unit_tracker");
    const prodStructure = await executeQuery("DESCRIBE prod_unit_tracker");
    
    console.log('Staging table columns:', stagingStructure.map(col => col.Field));
    console.log('Production table columns:', prodStructure.map(col => col.Field));
    
    // Get row counts
    const stagingCount = await executeQuery("SELECT COUNT(*) as count FROM staging_unit_tracker");
    const prodCount = await executeQuery("SELECT COUNT(*) as count FROM prod_unit_tracker");
    
    console.log(`Staging table has ${stagingCount[0].count} rows`);
    console.log(`Production table has ${prodCount[0].count} rows`);
    
    // Get all data from staging
    const stagingData = await executeQuery("SELECT * FROM staging_unit_tracker");
    console.log(`Retrieved ${stagingData.length} rows from staging table`);
    
    if (stagingData.length === 0) {
      return res.json({ 
        message: 'No data to migrate', 
        stagingCount: 0, 
        prodCount: prodCount[0].count 
      });
    }
    
    // Show sample data
    console.log('Sample staging data:', stagingData[0]);
    
    // Find common columns between staging and production
    const stagingColumns = stagingStructure.map(col => col.Field);
    const prodColumns = prodStructure.map(col => col.Field);
    const commonColumns = stagingColumns.filter(col => prodColumns.includes(col));
    
    console.log('Common columns:', commonColumns);
    
    // Insert data into production table
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const row of stagingData) {
      try {
        // Build INSERT query with only common columns
        const insertColumns = commonColumns.join(', ');
        const insertValues = commonColumns.map(col => `?`).join(', ');
        const insertData = commonColumns.map(col => row[col]);
        
        await executeQuery(`
          INSERT INTO prod_unit_tracker (${insertColumns}) 
          VALUES (${insertValues})
        `, insertData);
        
        insertedCount++;
      } catch (error) {
        console.error('Error inserting row:', error.message);
        errorCount++;
      }
    }
    
    // Get final production count
    const finalProdCount = await executeQuery("SELECT COUNT(*) as count FROM prod_unit_tracker");
    
    res.json({
      message: 'Data migration completed',
      stagingCount: stagingData.length,
      insertedCount: insertedCount,
      errorCount: errorCount,
      finalProdCount: finalProdCount[0].count,
      commonColumns: commonColumns
    });
    
  } catch (error) {
    console.error('Error during data migration:', error);
    res.status(500).json({ error: 'Failed to migrate staging data' });
  }
});

// Unit contacts endpoint
app.get('/api/units/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/contacts requested`);
    
    // Get the unit data first to find the S-T-R
    const unitResults = await executeQuery(`
      SELECT DISTINCT
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Well_Name as well_name
      FROM prod_unit_tracker 
      WHERE id = ? OR Well_Name LIKE ?
      LIMIT 1
    `, [id, `%${id}%`]);
    
    if (unitResults.length === 0) {
      return res.json([]);
    }
    
    const unit = unitResults[0];
    // Remove 'S' prefix if it exists in the section field
    const cleanSection = unit.section.startsWith('S') ? unit.section.substring(1) : unit.section;
    const unitStr = `${cleanSection}-${unit.township}-${unit.range}`;
    console.log(`Unit S-T-R for contacts: ${unitStr}`);
    
    // Try to find matching sections and get their contacts
    let sectionResults = [];
    
    // Strategy 1: Exact match
    sectionResults = await executeQuery(`
      SELECT DISTINCT
        S_T_R as str,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        BUYER as assigned_buyer
      FROM prod_acreage_schedule 
      WHERE S_T_R = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
      ORDER BY OWNER
    `, [unitStr]);
    
    // Strategy 2: Try without the 'S' prefix if it exists
    if (sectionResults.length === 0 && unitStr.startsWith('S')) {
      const unitStrWithoutS = unitStr.substring(1);
      console.log(`Trying without S prefix for contacts: ${unitStrWithoutS}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer
        FROM prod_acreage_schedule 
        WHERE S_T_R = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
      `, [unitStrWithoutS]);
    }
    
    // Strategy 3: Try matching by township and range only
    if (sectionResults.length === 0) {
      console.log(`Trying township/range match for contacts: ${unit.township}-${unit.range}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer
        FROM prod_acreage_schedule 
        WHERE S_T_R LIKE ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
        LIMIT 10
      `, [`%-${unit.township}-${unit.range}`]);
    }
    
    // Strategy 4: Try matching by county
    if (sectionResults.length === 0) {
      console.log(`Trying county match for contacts: ${unit.county}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer
        FROM prod_acreage_schedule 
        WHERE COUNTY = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
        LIMIT 5
      `, [unit.county]);
    }
    
    console.log(`Found ${sectionResults.length} contacts for unit`);
    
    // If no contacts found, try to get any contacts from the database for demonstration
    if (sectionResults.length === 0) {
      console.log('No contacts found for this unit, showing sample contacts from database');
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer
        FROM prod_acreage_schedule 
        WHERE (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
        LIMIT 3
      `);
    }
    
    // Transform the data to match our contacts format
    const contacts = sectionResults.map((row, index) => {
      // Parse phone and email from PHONE_EMAIL field
      let phone = '';
      let email = '';
      if (row.phone_email) {
        const parts = row.phone_email.split(' - ');
        if (parts.length >= 2) {
          phone = parts[0].trim();
          email = parts[1].trim();
        } else {
          phone = row.phone_email.trim();
        }
      }
      
      return {
        id: `uc${index + 1}`,
        unitId: id,
        contactId: `c${index + 1}`,
        contact: {
          id: `c${index + 1}`,
          name: row.owner_name || 'Unknown Owner',
          contactType: 'Owner',
          email: email,
          phone: phone,
          address: '',
          notes: row.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ownershipPercentage: 1.0, // Default to 100% ownership
        royaltyPercentage: 0.0, // Default
        isPrimary: index === 0, // First contact is primary
        assignedBuyer: row.assigned_buyer ? {
          id: `b${index + 1}`,
          name: row.assigned_buyer
        } : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching unit contacts:', error);
    res.status(500).json({ error: 'Failed to fetch unit contacts' });
  }
});

// Unit contacts aggregated endpoint
app.get('/api/units/:id/contacts/aggregated', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/contacts/aggregated requested`);
    
    // Get the unit data first to find the S-T-R
    const unitResults = await executeQuery(`
      SELECT DISTINCT
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Well_Name as well_name
      FROM prod_unit_tracker 
      WHERE id = ? OR Well_Name LIKE ?
      LIMIT 1
    `, [id, `%${id}%`]);
    
    if (unitResults.length === 0) {
      return res.json([]);
    }
    
    const unit = unitResults[0];
    // Remove 'S' prefix if it exists in the section field
    const cleanSection = unit.section.startsWith('S') ? unit.section.substring(1) : unit.section;
    const unitStr = `${cleanSection}-${unit.township}-${unit.range}`;
    console.log(`Unit S-T-R for aggregated contacts: ${unitStr}`);
    
    // Try to find matching sections and get their contacts
    let sectionResults = [];
    
    // Strategy 1: Exact match
    sectionResults = await executeQuery(`
      SELECT DISTINCT
        S_T_R as str,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        BUYER as assigned_buyer,
        NMA as net_mineral_acres
      FROM prod_acreage_schedule 
      WHERE S_T_R = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
      ORDER BY OWNER
    `, [unitStr]);
    
    // Strategy 2: Try without the 'S' prefix if it exists
    if (sectionResults.length === 0 && unitStr.startsWith('S')) {
      const unitStrWithoutS = unitStr.substring(1);
      console.log(`Trying without S prefix for aggregated contacts: ${unitStrWithoutS}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer,
          NMA as net_mineral_acres
        FROM prod_acreage_schedule 
        WHERE S_T_R = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
      `, [unitStrWithoutS]);
    }
    
    // Strategy 3: Try matching by township and range only
    if (sectionResults.length === 0) {
      console.log(`Trying township/range match for aggregated contacts: ${unit.township}-${unit.range}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer,
          NMA as net_mineral_acres
        FROM prod_acreage_schedule 
        WHERE S_T_R LIKE ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
        LIMIT 10
      `, [`%-${unit.township}-${unit.range}`]);
    }
    
    // Strategy 4: Try matching by county
    if (sectionResults.length === 0) {
      console.log(`Trying county match for aggregated contacts: ${unit.county}`);
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer,
          NMA as net_mineral_acres
        FROM prod_acreage_schedule 
        WHERE COUNTY = ? AND (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
        LIMIT 5
      `, [unit.county]);
    }
    
    console.log(`Found ${sectionResults.length} contacts for aggregated unit contacts`);
    
    // If no contacts found, try to get any contacts from the database for demonstration
    if (sectionResults.length === 0) {
      console.log('No aggregated contacts found for this unit, showing sample contacts from database');
      sectionResults = await executeQuery(`
        SELECT DISTINCT
          S_T_R as str,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          BUYER as assigned_buyer,
          NMA as net_mineral_acres
        FROM prod_acreage_schedule 
        WHERE (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
        ORDER BY OWNER
        LIMIT 3
      `);
    }
    
    // Transform the data to match our aggregated contacts format
    const contactsAggregated = sectionResults.map((row, index) => {
      // Parse phone and email from PHONE_EMAIL field
      let phone = '';
      let email = '';
      if (row.phone_email) {
        const parts = row.phone_email.split(' - ');
        if (parts.length >= 2) {
          phone = parts[0].trim();
          email = parts[1].trim();
        } else {
          phone = row.phone_email.trim();
        }
      }
      
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      return {
        id: `uca${index + 1}`,
        unitId: id,
        contactId: `c${index + 1}`,
        contact: {
          id: `c${index + 1}`,
          name: row.owner_name || 'Unknown Owner',
          contactType: 'Owner',
          email: email,
          phone: phone,
          address: '',
          notes: row.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        ownershipPercentageWeighted: 1.0, // Default to 100% ownership
        royaltyPercentageWeighted: 0.0, // Default
        totalNMA: netAcres, // Net Mineral Acres
        totalNRA: netAcres * 0.125, // 1/8 normalized royalty
        sectionsOwned: [`s${index + 1}`], // Default to array of section IDs
        lastOutreach: new Date().toISOString(), // Default to now
        leadStatus: 'Active', // Default status
        assignedBuyer: row.assigned_buyer ? {
          id: `b${index + 1}`,
          name: row.assigned_buyer
        } : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(contactsAggregated);
  } catch (error) {
    console.error('Error fetching unit contacts aggregated:', error);
    res.status(500).json({ error: 'Failed to fetch unit contacts aggregated' });
  }
});

// Unit notes endpoint
app.get('/api/units/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/notes requested`);
    
    // Return empty array for now - this would need to be implemented based on your data structure
    res.json([]);
  } catch (error) {
    console.error('Error fetching unit notes:', error);
    res.status(500).json({ error: 'Failed to fetch unit notes' });
  }
});

// General assignments endpoint
app.get('/api/assignments', async (req, res) => {
  try {
    console.log('GET /api/assignments requested');
    
    // Get all assignments from prod_acreage_schedule where BUYER is not null
    // First get unique buyers to ensure variety
    const uniqueBuyers = await executeQuery(`
      SELECT DISTINCT BUYER as buyer_name
      FROM prod_acreage_schedule 
      WHERE BUYER IS NOT NULL AND BUYER != ''
      ORDER BY BUYER
    `);
    
    console.log(`Found ${uniqueBuyers.length} unique buyers: ${uniqueBuyers.map(b => b.buyer_name).join(', ')}`);
    
    // Get assignments with variety across buyers - sample from each buyer
    let assignmentResults = [];
    
    for (const buyer of uniqueBuyers) {
      const buyerAssignments = await executeQuery(`
        SELECT 
          BUYER as buyer_name,
          S_T_R as str,
          COUNTY as county,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CALCULATED_ACREAGE as calculated_acreage,
          NMA as net_mineral_acres,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created
        FROM prod_acreage_schedule 
        WHERE BUYER = ?
        ORDER BY S_T_R
        LIMIT 10
      `, [buyer.buyer_name]);
      
      assignmentResults.push(...buyerAssignments);
    }
    
    // Use deterministic ordering based on a seed to ensure consistency
    // Create a simple hash from the current time to use as a seed
    const seed = new Date().getDate(); // Use day of month as seed for daily consistency
    assignmentResults = assignmentResults.sort((a, b) => {
      const hashA = (a.buyer_name + a.str).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + seed;
      const hashB = (b.buyer_name + b.str).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + seed;
      return hashA - hashB;
    }).slice(0, 50);
    
    console.log(`Found ${assignmentResults.length} total assignments`);
    
    // Log unique buyers for debugging
    const uniqueBuyersInResults = [...new Set(assignmentResults.map(row => row.buyer_name))];
    console.log(`Unique buyers in results: ${uniqueBuyersInResults.join(', ')}`);
    
    // Transform the data to match the Assignment interface
    const assignments = assignmentResults.map((row, index) => {
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      const calculatedAcres = parseFloat(row.calculated_acreage) || 0;
      
      return {
        id: `assignment_${index + 1}`,
        assetType: 'Unit', // Default to Unit since we're working with units
        assetId: row.str || `unit_${index + 1}`,
        assignedBuyerId: `buyer_${row.buyer_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
        priceCapUsd: calculatedAcres * 1000, // Example: $1000 per acre
        priceCapType: 'Per Acre',
        sourceChannel: 'Broker',
        priorityScore: Math.floor(Math.random() * 50) + 25, // Random priority 25-75
        status: 'Active',
        notes: row.notes || '',
        assignedDate: row.date_created || new Date().toISOString(),
        assignedById: 'system',
        updatedAt: new Date().toISOString(),
        // Populated fields for display
        asset: {
          id: row.str || `unit_${index + 1}`,
          unitName: row.current_unit || row.new_unit || `Unit ${row.str}`,
          sectionName: row.str || 'Unknown Section'
        },
        assignedBuyer: {
          id: `buyer_${row.buyer_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
          name: row.buyer_name || 'Unknown Buyer',
          email: '',
          role: 'buyer'
        },
        assignedBy: {
          id: 'system',
          name: 'System',
          email: 'system@sooner-mineral.com',
          role: 'admin'
        }
      };
    });
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Individual assignment endpoint
app.get('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/assignments/${id} requested`);
    
    // Find the assignment by ID from our assignments list
    // Since we generate IDs like "assignment_1", "assignment_2", etc.
    const assignmentIndex = parseInt(id.replace('assignment_', '')) - 1;
    
    if (isNaN(assignmentIndex) || assignmentIndex < 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Get the same assignment data that was used in the list
    // First get all unique buyers to ensure we get the same data
    const uniqueBuyers = await executeQuery(`
      SELECT DISTINCT BUYER as buyer_name
      FROM prod_acreage_schedule 
      WHERE BUYER IS NOT NULL AND BUYER != ''
      ORDER BY BUYER
    `);
    
    // Get assignments with variety across buyers - same logic as the list endpoint
    let assignmentResults = [];
    
    for (const buyer of uniqueBuyers) {
      const buyerAssignments = await executeQuery(`
        SELECT 
          BUYER as buyer_name,
          S_T_R as str,
          COUNTY as county,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CALCULATED_ACREAGE as calculated_acreage,
          NMA as net_mineral_acres,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created
        FROM prod_acreage_schedule 
        WHERE BUYER = ?
        ORDER BY S_T_R
        LIMIT 10
      `, [buyer.buyer_name]);
      
      assignmentResults.push(...buyerAssignments);
    }
    
    // Use the same deterministic ordering as the list endpoint
    const seed = new Date().getDate(); // Use day of month as seed for daily consistency
    assignmentResults = assignmentResults.sort((a, b) => {
      const hashA = (a.buyer_name + a.str).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + seed;
      const hashB = (b.buyer_name + b.str).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + seed;
      return hashA - hashB;
    });
    
    if (assignmentIndex >= assignmentResults.length) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const row = assignmentResults[assignmentIndex];
    const netAcres = parseFloat(row.net_mineral_acres) || 0;
    const calculatedAcres = parseFloat(row.calculated_acreage) || 0;
    
    const assignment = {
      id: id,
      assetType: 'Unit',
      assetId: row.str || `unit_${assignmentIndex + 1}`,
      assignedBuyerId: `buyer_${row.buyer_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
      priceCapUsd: calculatedAcres * 1000, // Example: $1000 per acre
      priceCapType: 'Per Acre',
      sourceChannel: 'Broker',
      priorityScore: Math.floor(Math.random() * 50) + 25, // Random priority 25-75
      status: 'Active',
      notes: row.notes || '',
      assignedDate: row.date_created || new Date().toISOString(),
      assignedById: 'system',
      updatedAt: new Date().toISOString(),
      // Populated fields for display
      asset: {
        id: row.str || `unit_${assignmentIndex + 1}`,
        unitName: row.current_unit || row.new_unit || `Unit ${row.str}`,
        sectionName: row.str || 'Unknown Section'
      },
      assignedBuyer: {
        id: `buyer_${row.buyer_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
        name: row.buyer_name || 'Unknown Buyer',
        email: '',
        role: 'buyer'
      },
      assignedBy: {
        id: 'system',
        name: 'System',
        email: 'system@sooner-mineral.com',
        role: 'admin'
      }
    };
    
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Assignment history endpoint
app.get('/api/assignments/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/assignments/${id}/history requested`);
    
    // Return sample history data
    const history = [
      {
        id: `history_${id}_1`,
        assignmentId: id,
        actionType: 'Created',
        actionDetails: 'Assignment created by system',
        actionTimestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        actionById: 'system',
        actionBy: {
          id: 'system',
          name: 'System',
          email: 'system@sooner-mineral.com',
          role: 'admin'
        }
      },
      {
        id: `history_${id}_2`,
        assignmentId: id,
        actionType: 'Updated',
        actionDetails: 'Assignment updated with new priority score',
        actionTimestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        actionById: 'system',
        actionBy: {
          id: 'system',
          name: 'System',
          email: 'system@sooner-mineral.com',
          role: 'admin'
        }
      }
    ];
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    res.status(500).json({ error: 'Failed to fetch assignment history' });
  }
});

// Unit assignments endpoint
app.get('/api/units/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/assignments requested`);
    
    // Get the unit data first to find the S-T-R
    const unitResults = await executeQuery(`
      SELECT DISTINCT
        S as section,
        T as township,
        R as \`range\`,
        County as county,
        Well_Name as well_name
      FROM prod_unit_tracker 
      WHERE id = ? OR Well_Name LIKE ?
      LIMIT 1
    `, [id, `%${id}%`]);
    
    if (unitResults.length === 0) {
      return res.json([]);
    }
    
    const unit = unitResults[0];
    // Remove 'S' prefix if it exists in the section field
    const sectionNumber = unit.section?.replace(/^S/, '') || unit.section;
    const unitStr = `${sectionNumber}-${unit.township}-${unit.range}`;
    const unitStrWithoutS = `${sectionNumber}-${unit.township}-${unit.range}`;
    
    console.log(`Unit S-T-R: ${unitStr}`);
    
    // Get assignments from prod_acreage_schedule based on the unit's S-T-R
    let assignmentResults = await executeQuery(`
      SELECT DISTINCT
        BUYER as buyer_name,
        S_T_R as str,
        COUNTY as county,
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        CALCULATED_ACREAGE as calculated_acreage,
        NMA as net_mineral_acres,
        CURRENT_UNIT_NAME as current_unit,
        NEW_UNIT_NAME as new_unit,
        DATE as date_created
      FROM prod_acreage_schedule 
      WHERE S_T_R = ? AND BUYER IS NOT NULL AND BUYER != ''
      ORDER BY BUYER, DATE DESC
    `, [unitStrWithoutS]);
    
    // If no exact match, try township/range match
    if (assignmentResults.length === 0) {
      console.log(`Trying township/range match: ${unit.township}-${unit.range}`);
      const townshipRangeResults = await executeQuery(`
        SELECT DISTINCT
          BUYER as buyer_name,
          S_T_R as str,
          COUNTY as county,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CALCULATED_ACREAGE as calculated_acreage,
          NMA as net_mineral_acres,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created
        FROM prod_acreage_schedule 
        WHERE S_T_R LIKE ? AND BUYER IS NOT NULL AND BUYER != ''
        ORDER BY BUYER, DATE DESC
        LIMIT 10
      `, [`%-${unit.township}-${unit.range}`]);
      
      assignmentResults.push(...townshipRangeResults);
    }
    
    // If still no match, try county match
    if (assignmentResults.length === 0) {
      console.log(`Trying county match: ${unit.county}`);
      const countyResults = await executeQuery(`
        SELECT DISTINCT
          BUYER as buyer_name,
          S_T_R as str,
          COUNTY as county,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CALCULATED_ACREAGE as calculated_acreage,
          NMA as net_mineral_acres,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created
        FROM prod_acreage_schedule 
        WHERE COUNTY = ? AND BUYER IS NOT NULL AND BUYER != ''
        ORDER BY BUYER, DATE DESC
        LIMIT 5
      `, [unit.county]);
      
      assignmentResults.push(...countyResults);
    }
    
    // If still no match, get sample assignments from the database for demonstration
    if (assignmentResults.length === 0) {
      console.log(`No assignments found, showing sample assignments from database`);
      const sampleResults = await executeQuery(`
        SELECT DISTINCT
          BUYER as buyer_name,
          S_T_R as str,
          COUNTY as county,
          OWNER as owner_name,
          CONTACT as contact_info,
          PHONE_EMAIL as phone_email,
          NOTE as notes,
          CALCULATED_ACREAGE as calculated_acreage,
          NMA as net_mineral_acres,
          CURRENT_UNIT_NAME as current_unit,
          NEW_UNIT_NAME as new_unit,
          DATE as date_created
        FROM prod_acreage_schedule 
        WHERE BUYER IS NOT NULL AND BUYER != ''
        ORDER BY BUYER, DATE DESC
        LIMIT 3
      `);
      
      assignmentResults.push(...sampleResults);
    }
    
    console.log(`Found ${assignmentResults.length} assignments for unit`);
    
    // Transform the data to match our assignment format
    const assignments = assignmentResults.map((row, index) => {
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      const calculatedAcres = parseFloat(row.calculated_acreage) || 0;
      
      return {
        id: `assignment_${index + 1}`,
        unitId: id,
        buyerId: `buyer_${row.buyer_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
        buyer: {
          id: `buyer_${row.buyer_name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}`,
          name: row.buyer_name || 'Unknown Buyer',
          email: '',
          role: 'buyer'
        },
        assignedBy: 'system',
        assignedByUser: {
          id: 'system',
          name: 'System',
          email: 'system@sooner-mineral.com',
          role: 'admin'
        },
        assignedAt: row.date_created || new Date().toISOString(),
        notes: row.notes || '',
        assignmentStatus: 'In Progress',
        valuationCapUsd: 0, // This would need to be calculated or provided
        autoGenerateLeads: true,
        // Additional fields from the database
        str: row.str,
        county: row.county,
        ownerName: row.owner_name,
        contactInfo: row.contact_info,
        phoneEmail: row.phone_email,
        netMineralAcres: netAcres,
        calculatedAcreage: calculatedAcres,
        currentUnit: row.current_unit,
        newUnit: row.new_unit,
        dateCreated: row.date_created,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching unit assignments:', error);
    res.status(500).json({ error: 'Failed to fetch unit assignments' });
  }
});

// Get unit names (current and new) from prod_acreage_schedule
app.get('/api/units/:id/unit-names', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/units/${id}/unit-names requested`);

    // Get unit details to extract S-T-R (using same table as other endpoints)
    const unitResults = await executeQuery(`
      SELECT DISTINCT
        S as section,
        T as township,
        R as \`range\`,
        County as county
      FROM prod_unit_tracker 
      WHERE id = ?
    `, [id]);

    if (unitResults.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const unit = unitResults[0];
    const str = `${unit.section}-${unit.township}-${unit.range}`;
    console.log(`Unit S-T-R for unit names: ${str}`);

    // Try multiple strategies to find matching records
    let unitNames = [];

    // Strategy 1: Exact S-T-R match
    if (str) {
      const exactMatches = await executeQuery(`
        SELECT DISTINCT CURRENT_UNIT_NAME, NEW_UNIT_NAME, S_T_R, COUNTY
        FROM prod_acreage_schedule 
        WHERE S_T_R = ?
        AND (CURRENT_UNIT_NAME IS NOT NULL OR NEW_UNIT_NAME IS NOT NULL)
        LIMIT 10
      `, [str]);
      
      if (exactMatches.length > 0) {
        unitNames = exactMatches;
        console.log(`Found ${exactMatches.length} exact S-T-R matches for unit names`);
      }
    }

    // Strategy 2: Township/Range match if no exact matches
    if (unitNames.length === 0 && str) {
      const townshipRange = `${unit.township}-${unit.range}`;
      console.log(`Trying township/range match for unit names: ${townshipRange}`);
      
      const townshipMatches = await executeQuery(`
        SELECT DISTINCT CURRENT_UNIT_NAME, NEW_UNIT_NAME, S_T_R, COUNTY
        FROM prod_acreage_schedule 
        WHERE S_T_R LIKE ?
        AND (CURRENT_UNIT_NAME IS NOT NULL OR NEW_UNIT_NAME IS NOT NULL)
        LIMIT 10
      `, [`%-${townshipRange}`]);
      
      if (townshipMatches.length > 0) {
        unitNames = townshipMatches;
        console.log(`Found ${townshipMatches.length} township/range matches for unit names`);
      }
    }

    // Strategy 3: County match if still no matches
    if (unitNames.length === 0 && unit.county) {
      console.log(`Trying county match for unit names: ${unit.county}`);
      
      const countyMatches = await executeQuery(`
        SELECT DISTINCT CURRENT_UNIT_NAME, NEW_UNIT_NAME, S_T_R, COUNTY
        FROM prod_acreage_schedule 
        WHERE COUNTY = ?
        AND (CURRENT_UNIT_NAME IS NOT NULL OR NEW_UNIT_NAME IS NOT NULL)
        LIMIT 10
      `, [unit.county]);
      
      if (countyMatches.length > 0) {
        unitNames = countyMatches;
        console.log(`Found ${countyMatches.length} county matches for unit names`);
      }
    }

    // If no matches found, return sample data
    if (unitNames.length === 0) {
      console.log('No unit names found, showing sample unit names from database');
      const sampleUnitNames = await executeQuery(`
        SELECT DISTINCT CURRENT_UNIT_NAME, NEW_UNIT_NAME, S_T_R, COUNTY
        FROM prod_acreage_schedule 
        WHERE (CURRENT_UNIT_NAME IS NOT NULL OR NEW_UNIT_NAME IS NOT NULL)
        LIMIT 10
      `);
      unitNames = sampleUnitNames;
    }

    console.log(`Found ${unitNames.length} unit name records`);

    // Process the results to extract unique current and new unit names
    const currentUnitNames = [...new Set(unitNames
      .map(row => row.CURRENT_UNIT_NAME)
      .filter(name => name && name.trim() !== '')
    )];

    const newUnitNames = [...new Set(unitNames
      .map(row => row.NEW_UNIT_NAME)
      .filter(name => name && name.trim() !== '')
    )];

    const response = {
      currentUnitNames,
      newUnitNames,
      totalRecords: unitNames.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching unit names:', error);
    res.status(500).json({ error: 'Failed to fetch unit names' });
  }
});

// Contacts API Routes
app.get('/api/contacts', async (req, res) => {
  try {
    console.log('GET /api/contacts requested');
    
    // Query the prod_acreage_schedule table for contact information
    const results = await executeQuery(`
      SELECT DISTINCT
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        BUYER as assigned_buyer,
        S_T_R as str,
        COUNTY as county,
        ST as state,
        NMA as net_mineral_acres
      FROM prod_acreage_schedule 
      WHERE (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
      ORDER BY OWNER
    `);
    
    // Transform the data to match our contacts format
    const contacts = results.map((row, index) => {
      // Parse phone and email from PHONE_EMAIL field
      let phone = '';
      let email = '';
      if (row.phone_email) {
        const parts = row.phone_email.split(' - ');
        if (parts.length >= 2) {
          phone = parts[0].trim();
          email = parts[1].trim();
        } else {
          phone = row.phone_email.trim();
        }
      }
      
      return {
        id: `c${index + 1}`,
        name: row.owner_name || 'Unknown Owner',
        email: email,
        phone: phone,
        address: '',
        city: row.county || 'Unknown',
        state: row.state || 'Unknown',
        contactType: 'Landowner',
        notes: row.notes || '',
        assignedBuyer: row.assigned_buyer || null,
        str: row.str,
        netMineralAcres: parseFloat(row.net_mineral_acres) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts from database:', error);
    res.status(500).json({ error: 'Failed to fetch contacts from database' });
  }
});

app.get('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/contacts/${id} requested`);
    
    // Parse the contact ID to get the offset
    const contactNumber = parseInt(id.replace('c', ''));
    if (isNaN(contactNumber) || contactNumber < 1) {
      return res.status(404).json({ error: 'Invalid contact ID' });
    }
    
    const offset = contactNumber - 1;
    
    // Get all contacts and find the one with the matching ID
    const allResults = await executeQuery(`
      SELECT DISTINCT
        OWNER as owner_name,
        CONTACT as contact_info,
        PHONE_EMAIL as phone_email,
        NOTE as notes,
        BUYER as assigned_buyer,
        S_T_R as str,
        COUNTY as county,
        ST as state,
        NMA as net_mineral_acres
      FROM prod_acreage_schedule 
      WHERE (OWNER IS NOT NULL OR CONTACT IS NOT NULL)
      ORDER BY OWNER
    `);
    
    const results = allResults.slice(offset, offset + 1);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const row = results[0];
    
    // Parse phone and email from PHONE_EMAIL field
    let phone = '';
    let email = '';
    if (row.phone_email) {
      const parts = row.phone_email.split(' - ');
      if (parts.length >= 2) {
        phone = parts[0].trim();
        email = parts[1].trim();
      } else {
        phone = row.phone_email.trim();
      }
    }
    
    const contact = {
      id: id,
      name: row.owner_name || 'Unknown Owner',
      email: email,
      phone: phone,
      address: '',
      city: row.county || 'Unknown',
      state: row.state || 'Unknown',
      contactType: 'Landowner',
      notes: row.notes || '',
      assignedBuyer: row.assigned_buyer || null,
      str: row.str,
      netMineralAcres: parseFloat(row.net_mineral_acres) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Users endpoint
app.get('/api/users', async (req, res) => {
  try {
    console.log('GET /api/users requested');
    
    // Return mock users data for now
    const users = [
      {
        id: 'user1',
        name: 'System Administrator',
        email: 'admin@sooner-mineral.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Leads API Routes
app.get('/api/leads', async (req, res) => {
  try {
    console.log('GET /api/leads requested');
    
    // Get sections data to generate leads from contact information
    const results = await executeQuery(`
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        GROUP_CONCAT(DISTINCT CONTACT ORDER BY CONTACT SEPARATOR ',\n') as contact_info,
        GROUP_CONCAT(DISTINCT OWNER ORDER BY OWNER SEPARATOR ',\n') as owner_name,
        GROUP_CONCAT(DISTINCT PHONE_EMAIL ORDER BY PHONE_EMAIL SEPARATOR ',\n') as phone_email,
        GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
        AVG(NMA) as net_mineral_acres,
        MIN(DATE) as date_created
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      GROUP BY S_T_R
      ORDER BY S_T_R
    `);
    
    // Generate leads from contact information
    const leads = [];
    let leadId = 1;
    
    results.forEach((row, index) => {
      // Parse contact information
      const contacts = row.contact_info ? row.contact_info.split(',\n').filter(c => c.trim()) : [];
      const owners = row.owner_name ? row.owner_name.split(',\n').filter(o => o.trim()) : [];
      const phones = row.phone_email ? row.phone_email.split(',\n').filter(p => p.trim()) : [];
      
      // Create leads from contacts
      contacts.forEach((contact, contactIndex) => {
        if (contact.trim()) {
          const lead = {
            id: `lead${leadId++}`,
            linkedContact: {
              id: `contact${leadId}`,
              name: contact.trim(),
              city: row.county || 'Unknown',
              state: row.state || 'OK',
              phone: phones[contactIndex] || null,
              email: contact.includes('@') ? contact : null
            },
            linkedSections: [
              {
                id: `s${index + 1}`,
                sectionName: row.str || `Section ${index + 1}`
              }
            ],
            linkedUnits: [],
            buyer: row.assigned_buyer ? { 
              id: 'buyer1', 
              name: row.assigned_buyer 
            } : null,
            status: Math.random() > 0.7 ? 'Spoke' : 'Uncontacted',
            priorityScore: Math.floor(Math.random() * 40) + 60, // 60-100
            lastContactDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            nextFollowUpDate: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
            sourceChannel: ['Broker', 'Inbound', 'Outbound'][Math.floor(Math.random() * 3)],
            notes: `Generated from section ${row.str} - Owner: ${owners[0] || 'Unknown'}`,
            outreachCount: Math.floor(Math.random() * 5),
            createdAt: row.date_created || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          leads.push(lead);
        }
      });
    });
    
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/leads/${id}/sections requested`);
    
    // Get the lead first to find its linked sections
    const leadResults = await executeQuery(`
      SELECT 
        S_T_R as str,
        MAX(COUNTY) as county,
        MAX(ST) as state,
        GROUP_CONCAT(DISTINCT CONTACT ORDER BY CONTACT SEPARATOR ',\n') as contact_info,
        GROUP_CONCAT(DISTINCT OWNER ORDER BY OWNER SEPARATOR ',\n') as owner_name,
        GROUP_CONCAT(DISTINCT PHONE_EMAIL ORDER BY PHONE_EMAIL SEPARATOR ',\n') as phone_email,
        GROUP_CONCAT(DISTINCT BUYER ORDER BY BUYER SEPARATOR ', ') as assigned_buyer,
        AVG(NMA) as net_mineral_acres,
        MIN(DATE) as date_created
      FROM prod_acreage_schedule 
      WHERE S_T_R IS NOT NULL 
      GROUP BY S_T_R
      ORDER BY S_T_R
    `);
    
    // For now, return all sections as potential assignments
    // In a real implementation, this would filter based on the lead's linked sections
    const sections = leadResults.map((row, index) => {
      const netAcres = parseFloat(row.net_mineral_acres) || 0;
      
      return {
        id: `s${index + 1}`,
        section_name: row.str || `Section ${index + 1}`,
        state: row.state || 'OK',
        county: row.county || 'Unknown',
        str: row.str,
        grossAcres: netAcres,
        netMineralAcres: netAcres,
        titleStatus: 'Active',
        legalDescription: `Legal description for ${row.str}`,
        assignedBuyer: row.assigned_buyer ? { name: row.assigned_buyer } : null,
        current_unit: 'Unit information',
        new_unit: 'New unit information',
        created_at: row.date_created || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching lead sections:', error);
    res.status(500).json({ error: 'Failed to fetch lead sections' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/leads/${id} requested`);
    
    // For now, return mock lead data
    const mockLead = {
      id: id,
      linkedContact: {
        id: 'contact1',
        name: 'John Smith',
        city: 'Oklahoma City',
        state: 'OK'
      },
      linkedSections: [
        {
          id: 's1',
          sectionName: '06-01S-03W'
        }
      ],
      linkedUnits: [],
      buyer: {
        id: 'buyer1',
        name: 'Alice Admin'
      },
      status: 'Uncontacted',
      priorityScore: 75,
      lastContactDate: null,
      nextFollowUpDate: null,
      sourceChannel: 'Outbound',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json(mockLead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sections API server with database is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sections API server with database running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Sections API: http://localhost:${PORT}/api/sections`);
});

export default app;
