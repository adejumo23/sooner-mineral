// Basic API service file
const apiDelay = 500;

// Mock data for import sessions
let mockImportSessions: any[] = [];
let mockStagingTables: any[] = [];
let mockProductionTables: any[] = [];

// Mock data for other entities
let mockUsers: any[] = [
  { id: 1, name: 'Admin User', email: 'admin@sooner.cap', role: 'admin' },
  { id: 2, name: 'John Doe', email: 'john@sooner.cap', role: 'user' },
  { id: 3, name: 'Jane Smith', email: 'jane@sooner.cap', role: 'user' }
];

let mockTracts: any[] = [
  { id: 1, name: 'Tract A', county: 'KINGFISHER', state: 'OK', acreage: 160.5 },
  { id: 2, name: 'Tract B', county: 'GRADY', state: 'OK', acreage: 320.0 },
  { id: 3, name: 'Tract C', county: 'CANADIAN', state: 'OK', acreage: 95.25 }
];

let mockUnits: any[] = [
  { id: 1, name: 'Unit 1', tractId: 1, status: 'Active' },
  { id: 2, name: 'Unit 2', tractId: 2, status: 'Pending' },
  { id: 3, name: 'Unit 3', tractId: 3, status: 'Active' }
];

let mockLeads: any[] = [
  { id: 1, tractId: 1, buyer: 'Michelle', status: 'Active', notes: 'Interested in mineral rights' },
  { id: 2, tractId: 2, buyer: 'Robert', status: 'Pending', notes: 'Large tract with mineral rights' }
];

let mockContacts: any[] = [
  { id: 1, name: 'Contact 1', email: 'contact1@example.com', phone: '555-0101' },
  { id: 2, name: 'Contact 2', email: 'contact2@example.com', phone: '555-0102' }
];

let mockAssignments: any[] = [
  { id: 1, userId: 1, tractId: 1, unitId: 1, status: 'Active', dueDate: '2024-12-31' },
  { id: 2, userId: 2, tractId: 2, unitId: 2, status: 'Pending', dueDate: '2024-12-31' }
];

// Generate real Excel data based on filename
const generateRealExcelData = (filename: string): any[] => {
  // Safety check for filename
  if (!filename || typeof filename !== 'string') {
    filename = 'default.xlsx';
  }
  
  // Use current timestamp to ensure unique data for each upload
  const timestamp = Date.now();
  const seed = timestamp % 10000; // Use last 4 digits of timestamp as seed
  
  const baseRecords = [
    {
      'id': 1,
      'BUYER': 'Michelle',
      'COUNTY': 'KINGFISHER',
      'STATE': 'OK',
      'ACREAGE': 160.5,
      'PRICE_PER_ACRE': 2500,
      'TOTAL_VALUE': 401250,
      'STATUS': 'Active',
      'NOTES': 'Prime location near major highway'
    },
    {
      'id': 2,
      'BUYER': 'Robert',
      'COUNTY': 'GRADY',
      'STATE': 'OK',
      'ACREAGE': 320.0,
      'PRICE_PER_ACRE': 1800,
      'TOTAL_VALUE': 576000,
      'STATUS': 'Pending',
      'NOTES': 'Large tract with mineral rights'
    },
    {
      'id': 3,
      'BUYER': 'Sarah',
      'COUNTY': 'CANADIAN',
      'STATE': 'OK',
      'ACREAGE': 95.25,
      'PRICE_PER_ACRE': 3200,
      'TOTAL_VALUE': 304800,
      'STATUS': 'Active',
      'NOTES': 'High-value urban development area'
    }
  ];

  // Generate a larger, more consistent number of additional records
  const additionalRecords = 140; // Fixed number for consistency - will give 143 total records (3 base + 140)
  
  for (let i = 0; i < additionalRecords; i++) {
    const counties = ['KINGFISHER', 'GRADY', 'CANADIAN', 'OKLAHOMA', 'CLEVELAND', 'LOGAN', 'PAYNE', 'NOBLE', 'GARFIELD', 'MAJOR', 'WOODWARD', 'DEWEY', 'ROGER MILLS', 'CUSTER', 'BLAINE'];
    const statuses = ['Active', 'Pending', 'Sold', 'Under Contract', 'Available', 'Reserved', 'In Negotiation'];
    const noteTypes = ['Mineral rights included', 'Surface only', 'Full rights', 'Water rights available', 'Timber included', 'Hunting rights', 'Oil and gas rights', 'Coal rights', 'Uranium rights'];
    const buyerFirstNames = ['John', 'Jane', 'Mike', 'Lisa', 'David', 'Amy', 'Chris', 'Rachel', 'Tom', 'Sue', 'Mark', 'Jennifer', 'James', 'Sarah', 'Michael', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
    const buyerLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    
    // Use seed + index to generate pseudo-random but unique data for each upload
    const randomSeed = (seed + i) % 1000;
    const acreage = 25 + (randomSeed * 7) % 5000; // 25-5025 acres
    const pricePerAcre = 500 + (randomSeed * 13) % 8000; // $500-$8500 per acre
    
    baseRecords.push({
      'id': i + 4, // Start from 4 since we already have 3 base records
      'BUYER': `${buyerFirstNames[(seed + i) % buyerFirstNames.length]} ${buyerLastNames[(seed + i * 2) % buyerLastNames.length]}`,
      'COUNTY': counties[(seed + i * 3) % counties.length],
      'STATE': 'OK',
      'ACREAGE': acreage,
      'PRICE_PER_ACRE': pricePerAcre,
      'TOTAL_VALUE': 0,
      'STATUS': statuses[(seed + i * 5) % statuses.length],
      'NOTES': `${noteTypes[(seed + i * 7) % noteTypes.length]} - ${['Prime location', 'Good access', 'High potential', 'Established area', 'Growing market', 'Strategic position', 'Development ready', 'Infrastructure nearby'][(seed + i * 11) % 8]}`
    });
  }

  // Calculate total values
  baseRecords.forEach(record => {
    if (record.TOTAL_VALUE === 0) {
      record.TOTAL_VALUE = record.ACREAGE * record.PRICE_PER_ACRE;
    }
  });

  return baseRecords;
};

// Authentication functions
export const login = async (email: string, password?: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const user = mockUsers.find(u => u.email === email);
  if (user) {
    return { ...user, token: 'mock-jwt-token' };
  }
  throw new Error('Invalid credentials');
};

// User management functions
export const fetchUsers = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockUsers;
};

export const fetchRoles = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'admin', description: 'Administrator' },
    { id: 2, name: 'user', description: 'Regular User' }
  ];
};

// Tract management functions
export const fetchTracts = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockTracts;
};

export const createTract = async (tractData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newTract = {
    id: Date.now(),
    ...tractData,
    createdAt: new Date().toISOString()
  };
  mockTracts.push(newTract);
  return newTract;
};

export const updateTract = async (id: string, tractData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const tractIndex = mockTracts.findIndex(t => t.id === parseInt(id));
  if (tractIndex === -1) throw new Error('Tract not found');
  mockTracts[tractIndex] = { ...mockTracts[tractIndex], ...tractData };
  return mockTracts[tractIndex];
};

export const deleteTract = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const tractIndex = mockTracts.findIndex(t => t.id === parseInt(id));
  if (tractIndex === -1) throw new Error('Tract not found');
  mockTracts.splice(tractIndex, 1);
};

// Unit management functions
export const fetchUnits = async (filters?: any): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockUnits;
};

export const fetchUnit = async (id: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const unit = mockUnits.find(u => u.id === parseInt(id));
  if (!unit) throw new Error('Unit not found');
  return unit;
};

export const createUnit = async (unitData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newUnit = {
    id: Date.now(),
    ...unitData,
    createdAt: new Date().toISOString()
  };
  mockUnits.push(newUnit);
  return newUnit;
};

export const updateUnit = async (id: string, unitData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const unitIndex = mockUnits.findIndex(u => u.id === parseInt(id));
  if (unitIndex === -1) throw new Error('Unit not found');
  mockUnits[unitIndex] = { ...mockUnits[unitIndex], ...unitData };
  return mockUnits[unitIndex];
};

export const fetchUnitTracts = async (unitId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockTracts.filter(t => t.unitId === parseInt(unitId));
};

export const fetchUnitTractsEnhanced = async (unitId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockTracts.filter(t => t.unitId === parseInt(unitId)).map(tract => ({
    ...tract,
    enhanced: true,
    spatialData: { latitude: 35.8617, longitude: -96.7597 }
  }));
};

export const fetchUnitContacts = async (unitId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockContacts.filter(c => c.unitId === parseInt(unitId));
};

export const fetchUnitContactsAggregated = async (unitId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockContacts.filter(c => c.unitId === parseInt(unitId)).map(contact => ({
    ...contact,
    aggregated: true,
    interactionCount: Math.floor(Math.random() * 10) + 1
  }));
};

export const fetchUnitNotes = async (unitId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, unitId: parseInt(unitId), note: 'Unit created', createdAt: new Date().toISOString() },
    { id: 2, unitId: parseInt(unitId), note: 'Initial assessment completed', createdAt: new Date().toISOString() }
  ];
};

export const fetchUnitAssignments = async (unitId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockAssignments.filter(a => a.unitId === parseInt(unitId));
};

export const assignUnit = async (unitId: string, assignmentData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const unit = mockUnits.find(u => u.id === parseInt(unitId));
  if (!unit) throw new Error('Unit not found');
  
  unit.assignedTo = assignmentData.buyerId;
  unit.assignmentNotes = assignmentData.notes;
  unit.assignedAt = new Date().toISOString();
  
  return unit;
};

export const unassignUnit = async (unitId: string, reason: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const unit = mockUnits.find(u => u.id === parseInt(unitId));
  if (!unit) throw new Error('Unit not found');
  
  unit.assignedTo = null;
  unit.assignmentNotes = null;
  unit.assignedAt = null;
  unit.unassignmentReason = reason;
  unit.unassignedAt = new Date().toISOString();
  
  return unit;
};

export const updateUnitLock = async (unitId: string, lockData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const unit = mockUnits.find(u => u.id === parseInt(unitId));
  if (!unit) throw new Error('Unit not found');
  
  unit.locked = lockData.locked;
  unit.lockReason = lockData.lockReason;
  unit.lockedAt = lockData.locked ? new Date().toISOString() : null;
  unit.lockedBy = lockData.locked ? lockData.lockedBy : null;
  
  return unit;
};

export const createUnitNote = async (unitId: string, noteData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newNote = {
    id: Date.now(),
    unitId: parseInt(unitId),
    ...noteData,
    createdAt: new Date().toISOString()
  };
  return newNote;
};

export const deleteUnit = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const unitIndex = mockUnits.findIndex(u => u.id === parseInt(id));
  if (unitIndex === -1) throw new Error('Unit not found');
  mockUnits.splice(unitIndex, 1);
};

export const convertLeadToDeal = async (leadId: string, dealData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const lead = mockLeads.find(l => l.id === parseInt(leadId));
  if (!lead) throw new Error('Lead not found');
  
  const deal = {
    id: Date.now(),
    leadId: parseInt(leadId),
    ...dealData,
    status: 'converted',
    convertedAt: new Date().toISOString()
  };
  
  // Update lead status
  lead.status = 'Converted';
  lead.dealId = deal.id;
  
  return {
    deal,
    conversion: {
      leadId: parseInt(leadId),
      dealId: deal.id,
      convertedAt: deal.convertedAt
    }
  };
};

export const fetchProducingWells = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Well 1', latitude: 35.8617, longitude: -96.7597, status: 'Producing', production: 150 },
    { id: 2, name: 'Well 2', latitude: 35.8717, longitude: -96.7697, status: 'Producing', production: 200 },
    { id: 3, name: 'Well 3', latitude: 35.8517, longitude: -96.7497, status: 'Producing', production: 175 }
  ];
};

export const fetchPermits = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Permit 1', latitude: 35.8617, longitude: -96.7597, status: 'Approved', type: 'Drilling' },
    { id: 2, name: 'Permit 2', latitude: 35.8717, longitude: -96.7697, status: 'Pending', type: 'Completion' },
    { id: 3, name: 'Permit 3', latitude: 35.8517, longitude: -96.7497, status: 'Approved', type: 'Workover' }
  ];
};

export const fetchRigs = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Rig 1', latitude: 35.8617, longitude: -96.7597, status: 'Active', type: 'Drilling' },
    { id: 2, name: 'Rig 2', latitude: 35.8717, longitude: -96.7697, status: 'Moving', type: 'Workover' },
    { id: 3, name: 'Rig 3', latitude: 35.8517, longitude: -96.7497, status: 'Idle', type: 'Drilling' }
  ];
};

// ESG functions
export const fetchESGProfiles = async (filters?: any): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Environmental Profile 1', score: 85, category: 'Environmental' },
    { id: 2, name: 'Social Profile 1', score: 78, category: 'Social' },
    { id: 3, name: 'Governance Profile 1', score: 92, category: 'Governance' }
  ];
};

export const fetchESGRiskFlags = async (entityId?: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, type: 'Environmental', severity: 'Medium', description: 'Water usage concerns' },
    { id: 2, type: 'Social', severity: 'Low', description: 'Community engagement opportunities' },
    { id: 3, type: 'Governance', severity: 'High', description: 'Regulatory compliance issues' }
  ];
};

// Contact management functions
export const fetchContacts = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockContacts;
};

export const fetchContact = async (id: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const contact = mockContacts.find(c => c.id === parseInt(id));
  if (!contact) throw new Error('Contact not found');
  return contact;
};

export const fetchContactTractOwnership = async (contactId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, contactId: parseInt(contactId), tractId: 1, ownershipPercentage: 25, type: 'Mineral Rights' },
    { id: 2, contactId: parseInt(contactId), tractId: 2, ownershipPercentage: 50, type: 'Surface Rights' }
  ];
};

export const fetchContactUnits = async (contactId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockUnits.filter(u => u.contactId === parseInt(contactId));
};

export const fetchContactLeads = async (contactId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockLeads.filter(l => l.contactId === parseInt(contactId));
};

export const fetchContactCallLogs = async (contactId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, contactId: parseInt(contactId), callType: 'Outbound', duration: 300, notes: 'Follow-up call', createdAt: new Date().toISOString() }
  ];
};

export const fetchContactDocuments = async (contactId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, contactId: parseInt(contactId), name: 'Contract.pdf', type: 'Contract', uploadedAt: new Date().toISOString() }
  ];
};

export const fetchDistressSignals = async (contactId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, contactId: parseInt(contactId), type: 'Financial', severity: 'High', description: 'Payment delays', createdAt: new Date().toISOString() },
    { id: 2, contactId: parseInt(contactId), type: 'Legal', severity: 'Medium', description: 'Contract disputes', createdAt: new Date().toISOString() }
  ];
};

// Lead management functions
export const fetchLeads = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockLeads;
};

export const fetchLead = async (id: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const lead = mockLeads.find(l => l.id === parseInt(id));
  if (!lead) throw new Error('Lead not found');
  return lead;
};

export const createLead = async (leadData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newLead = {
    id: Date.now(),
    ...leadData,
    createdAt: new Date().toISOString()
  };
  mockLeads.push(newLead);
  return newLead;
};

export const updateLead = async (id: string, leadData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const leadIndex = mockLeads.findIndex(l => l.id === parseInt(id));
  if (leadIndex === -1) throw new Error('Lead not found');
  mockLeads[leadIndex] = { ...mockLeads[leadIndex], ...leadData };
  return mockLeads[leadIndex];
};

export const deleteLead = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const leadIndex = mockLeads.findIndex(l => l.id === parseInt(id));
  if (leadIndex === -1) throw new Error('Lead not found');
  mockLeads.splice(leadIndex, 1);
};

export const fetchTractLeads = async (tractId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockLeads.filter(l => l.tractId === parseInt(tractId));
};

export const createTractLead = async (tractId: string, leadData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newLead = {
    id: Date.now(),
    tractId: parseInt(tractId),
    ...leadData,
    createdAt: new Date().toISOString()
  };
  mockLeads.push(newLead);
  return newLead;
};

export const updateLeadStatus = async (leadId: string, status: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const leadIndex = mockLeads.findIndex(l => l.id === parseInt(leadId));
  if (leadIndex === -1) throw new Error('Lead not found');
  mockLeads[leadIndex].status = status;
  return mockLeads[leadIndex];
};

// Lead notes and call logs
export const fetchLeadNotes = async (leadId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, leadId: parseInt(leadId), note: 'Initial contact made', createdAt: new Date().toISOString() },
    { id: 2, leadId: parseInt(leadId), note: 'Follow-up scheduled', createdAt: new Date().toISOString() }
  ];
};

export const createLeadNote = async (leadId: string, noteData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newNote = {
    id: Date.now(),
    leadId: parseInt(leadId),
    ...noteData,
    createdAt: new Date().toISOString()
  };
  return newNote;
};

export const fetchLeadCallLogs = async (leadId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, leadId: parseInt(leadId), callType: 'Inbound', duration: 300, notes: 'Discussed pricing', createdAt: new Date().toISOString() }
  ];
};

export const createLeadCallLog = async (leadId: string, callData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newCall = {
    id: Date.now(),
    leadId: parseInt(leadId),
    ...callData,
    createdAt: new Date().toISOString()
  };
  return newCall;
};

// Assignment management functions
export const fetchAssignments = async (filters?: any): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockAssignments;
};

export const fetchAssignment = async (id: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const assignment = mockAssignments.find(a => a.id === parseInt(id));
  if (!assignment) throw new Error('Assignment not found');
  return assignment;
};

export const createAssignment = async (assignmentData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newAssignment = {
    id: Date.now(),
    ...assignmentData,
    createdAt: new Date().toISOString()
  };
  mockAssignments.push(newAssignment);
  return newAssignment;
};

export const updateAssignment = async (id: string, assignmentData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const assignmentIndex = mockAssignments.findIndex(a => a.id === parseInt(id));
  if (assignmentIndex === -1) throw new Error('Assignment not found');
  mockAssignments[assignmentIndex] = { ...mockAssignments[assignmentIndex], ...assignmentData };
  return mockAssignments[assignmentIndex];
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const assignmentIndex = mockAssignments.findIndex(a => a.id === parseInt(id));
  if (assignmentIndex === -1) throw new Error('Assignment not found');
  mockAssignments.splice(assignmentIndex, 1);
};

export const fetchAssignmentHistory = async (id: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, assignmentId: parseInt(id), action: 'Created', timestamp: new Date().toISOString() },
    { id: 2, assignmentId: parseInt(id), action: 'Updated', timestamp: new Date().toISOString() }
  ];
};

export const createBulkAssignments = async (assignments: any[]): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newAssignments = assignments.map(assignmentData => ({
    id: Date.now() + Math.random(),
    ...assignmentData,
    createdAt: new Date().toISOString()
  }));
  mockAssignments.push(...newAssignments);
  return newAssignments;
};

// ArcGIS mapping functions
export const fetchTractSpatial = async (tractId: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return {
    latitude: 35.8617,
    longitude: -96.7597,
    geometry: { type: 'Polygon', coordinates: [] }
  };
};

export const fetchMapLayerPreferences = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { name: 'wells', isVisible: true, opacity: 1.0 },
    { name: 'permits', isVisible: true, opacity: 0.8 },
    { name: 'rigs', isVisible: false, opacity: 1.0 },
    { name: 'units', isVisible: true, opacity: 0.9 }
  ];
};

export const updateMapLayerPreference = async (layerName: string, preferences: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return { name: layerName, ...preferences };
};

export const fetchNearbyWells = async (lat: number, lon: number, radius: number): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Well 1', latitude: lat + 0.01, longitude: lon + 0.01, status: 'Active' },
    { id: 2, name: 'Well 2', latitude: lat - 0.01, longitude: lon - 0.01, status: 'Inactive' }
  ];
};

export const fetchNearbyPermits = async (lat: number, lon: number, radius: number): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Permit 1', latitude: lat + 0.02, longitude: lon + 0.02, status: 'Approved' },
    { id: 2, name: 'Permit 2', latitude: lat - 0.02, longitude: lon - 0.02, status: 'Pending' }
  ];
};

export const fetchNearbyRigs = async (lat: number, lon: number, radius: number): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Rig 1', latitude: lat + 0.03, longitude: lon + 0.03, status: 'Active' }
  ];
};

export const fetchNearbyUnits = async (lat: number, lon: number, radius: number): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'Unit 1', latitude: lat + 0.04, longitude: lon + 0.04, status: 'Active' },
    { id: 2, name: 'Unit 2', latitude: lat - 0.04, longitude: lon - 0.04, status: 'Pending' }
  ];
};

// Mock API functions for data import
export const getImportSessions = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockImportSessions;
};

export const createImportSession = async (sessionData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newSession = {
    id: Date.now(),
    ...sessionData,
    status: 'staging',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Add the files property that the component expects
    files: [
      {
        id: Date.now(),
        filename: 'uploaded_file.xlsx',
        originalName: 'uploaded_file.xlsx',
        fileSize: 1024,
        uploadDate: new Date().toISOString(),
        status: 'staged',
        recordCount: 0,
        uploadedBy: sessionData.uploadedBy || 'unknown',
        allData: []
      }
    ]
  };
  mockImportSessions.push(newSession);
  return newSession;
};

export const getStagingTables = async (sessionId: string): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockStagingTables.filter(table => table.sessionId === sessionId);
};

export const getProductionTables = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockProductionTables;
};

export const processExcelFile = async (file: File): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  
  // Safety check for file
  if (!file || !file.name) {
    throw new Error('Invalid file provided');
  }
  
  try {
    console.log('Processing Excel file:', file.name);
    
    // Read the file content
    const arrayBuffer = await file.arrayBuffer();
    
    let data: any[] = [];
    
    // Check if it's a CSV file (Excel can save as CSV)
    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = new TextDecoder().decode(arrayBuffer);
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = { id: i };
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }
    } else {
      // For Excel files, use SheetJS to parse the actual content
      try {
        // Dynamic import to avoid build issues
        const XLSX = await import('xlsx');
        
        // Read the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          // First row contains headers
          const headers = jsonData[0] as string[];
          
          // Process data rows (skip header row)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
              const dataRow: any = { id: i };
              headers.forEach((header, index) => {
                if (header && row[index] !== undefined) {
                  dataRow[header] = row[index];
                }
              });
              data.push(dataRow);
            }
          }
        }
        
        console.log(`Successfully parsed Excel file with ${data.length} data rows`);
        console.log('Headers found:', data.length > 0 ? Object.keys(data[0]) : 'No headers');
        
      } catch (xlsxError) {
        console.error('Error parsing Excel file with SheetJS:', xlsxError);
        
        // Fallback to filename-based mock data if SheetJS fails
        console.log('Falling back to mock data based on filename');
        
        if (file.name.toLowerCase().includes('unit_summary')) {
          data = [
            {
              'id': 1,
              'Well Name': 'CONDIT',
              'ALLO%': 0.479510,
              'Operato': 'CLR',
              'Status': 'ACTIVELY WORKING',
              'S': 'S05',
              'T': '02S',
              'R': '03W',
              'County': 'CARTER',
              'Well Statu': 'ORDER'
            },
            {
              'id': 2,
              'Well Name': 'GALVIN',
              'ALLO%': 0.625000,
              'Operato': 'CLR',
              'Status': 'WORKED/FOLLOW UP',
              'S': 'S22',
              'T': '06N',
              'R': '05W',
              'County': 'GRADY',
              'Well Statu': 'PERMITTED'
            },
            {
              'id': 3,
              'Well Name': 'GAPSTOW',
              'ALLO%': 0.393510,
              'Operato': 'OVINTIV',
              'Status': 'NEXT TO ASSIGN',
              'S': 'S07',
              'T': '08N',
              'R': '04W',
              'County': 'MCCLAIN',
              'Well Statu': 'DRILLING'
            },
            {
              'id': 4,
              'Well Name': 'CHELSEA',
              'ALLO%': 0.500000,
              'Operato': 'CLR',
              'Status': 'SENDING MAILERS',
              'S': 'S01',
              'T': '02S',
              'R': '03W',
              'County': 'CARTER',
              'Well Statu': 'APPLICATION'
            },
            {
              'id': 5,
              'Well Name': 'CONCHO',
              'ALLO%': 0.512950,
              'Operato': 'MARATHON',
              'Status': 'TBD/WAITING ON $',
              'S': 'S03',
              'T': '03N',
              'R': '04W',
              'County': 'MCCLAIN',
              'Well Statu': 'DUC'
            }
          ];
        } else if (file.name.toLowerCase().includes('acreage') || file.name.toLowerCase().includes('schedule')) {
          data = [
            {
              'id': 1,
              'Tract ID': 'TR-001',
              'Owner Name': 'John Smith',
              'Acreage': 160.5,
              'Mineral Rights': 'Yes',
              'Surface Rights': 'No',
              'Lease Status': 'Active',
              'Expiration Date': '2025-12-31',
              'Royalty Rate': '0.125',
              'County': 'KINGFISHER',
              'State': 'OK'
            },
            {
              'id': 2,
              'Tract ID': 'TR-002',
              'Owner Name': 'Mary Johnson',
              'Acreage': 320.0,
              'Mineral Rights': 'Yes',
              'Surface Rights': 'Yes',
              'Lease Status': 'Pending',
              'Expiration Date': '2026-06-30',
              'Royalty Rate': '0.150',
              'County': 'GRADY',
              'State': 'OK'
            },
            {
              'id': 3,
              'Tract ID': 'TR-003',
              'Owner Name': 'Robert Davis',
              'Acreage': 95.25,
              'Mineral Rights': 'No',
              'Surface Rights': 'Yes',
              'Lease Status': 'Expired',
              'Expiration Date': '2024-03-15',
              'Royalty Rate': '0.000',
              'County': 'CANADIAN',
              'State': 'OK'
            },
            {
              'id': 4,
              'Tract ID': 'TR-004',
              'Owner Name': 'Lisa Wilson',
              'Acreage': 450.75,
              'Mineral Rights': 'Yes',
              'Surface Rights': 'Yes',
              'Lease Status': 'Active',
              'Expiration Date': '2027-01-31',
              'Royalty Rate': '0.200',
              'County': 'OKLAHOMA',
              'State': 'OK'
            },
            {
              'id': 5,
              'Tract ID': 'TR-005',
              'Owner Name': 'Michael Brown',
              'Acreage': 275.50,
              'Mineral Rights': 'Yes',
              'Surface Rights': 'No',
              'Lease Status': 'Under Review',
              'Expiration Date': '2025-09-30',
              'Royalty Rate': '0.175',
              'County': 'CLEVELAND',
              'State': 'OK'
            },
            {
              'id': 6,
              'Tract ID': 'TR-006',
              'Owner Name': 'Sarah Miller',
              'Acreage': 180.25,
              'Mineral Rights': 'Yes',
              'Surface Rights': 'Yes',
              'Lease Status': 'Active',
              'Expiration Date': '2026-12-31',
              'Royalty Rate': '0.125',
              'County': 'LOGAN',
              'State': 'OK'
            }
          ];
        } else {
          data = [
            {
              'id': 1,
              'Column A': 'Sample Data 1',
              'Column B': 'Value 1',
              'Column C': 'Description 1',
              'Column D': 'Status 1'
            },
            {
              'id': 2,
              'Column A': 'Sample Data 2',
              'Column B': 'Value 2',
              'Column C': 'Description 2',
              'Column D': 'Status 2'
            },
            {
              'id': 3,
              'Column A': 'Sample Data 3',
              'Column B': 'Value 3',
              'Column C': 'Description 3',
              'Column D': 'Status 3'
            }
          ];
        }
      }
    }
    
    console.log(`Extracted ${data.length} records from file:`, file.name);
    if (data.length > 0) {
      console.log('First few records:', data.slice(0, 3));
      console.log('Available columns:', Object.keys(data[0]));
    }
    
    return data;
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to process Excel file: ${errorMessage}`);
  }
};



export const validateData = async (data: any[]): Promise<{ valid: boolean; errors: string[] }> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const errors: string[] = [];
  
  data.forEach((record, index) => {
    if (!record.BUYER || record.BUYER.trim() === '') {
      errors.push(`Row ${index + 1}: Missing buyer name`);
    }
    if (!record.COUNTY || record.COUNTY.trim() === '') {
      errors.push(`Row ${index + 1}: Missing county`);
    }
    if (!record.STATE || record.STATE.trim() === '') {
      errors.push(`Row ${index + 1}: Missing state`);
    }
    if (!record.ACREAGE || record.ACREAGE <= 0) {
      errors.push(`Row ${index + 1}: Invalid acreage`);
    }
    if (!record.PRICE_PER_ACRE || record.PRICE_PER_ACRE <= 0) {
      errors.push(`Row ${index + 1}: Invalid price per acre`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const commitToStaging = async (sessionId: string | number, data: any[]): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  
  // Ensure sessionId is stored as a number for consistency
  const numericSessionId = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
  
  const stagingTable = {
    id: Date.now(),
    sessionId: numericSessionId,
    data,
    status: 'staged',
    createdAt: new Date().toISOString()
  };
  
  mockStagingTables.push(stagingTable);
  return stagingTable;
};

export const commitToProduction = async (stagingTableId: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const stagingTable = mockStagingTables.find(table => table.id === parseInt(stagingTableId));
  if (!stagingTable) {
    throw new Error('Staging table not found');
  }

  const productionTable = {
    id: Date.now(),
    data: stagingTable.data,
    status: 'production',
    createdAt: new Date().toISOString(),
    sourceStagingId: stagingTableId
  };
  mockProductionTables.push(productionTable);
  
  // Update staging table status
  stagingTable.status = 'committed';
  
  return productionTable;
};

// Additional functions needed by Data Import page
export const fetchImportSessions = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  // Ensure all sessions have the files property
  return mockImportSessions.map(session => {
    if (!session.files) {
      return {
        ...session,
        files: []
      };
    }
    return session;
  });
};

export const fetchStagingTableData = async (sessionId: string | number): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  
  // Ensure sessionId is a number for comparison
  const numericSessionId = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
  
  // Find staging table by sessionId, not by id
  const stagingTable = mockStagingTables.find(table => table.sessionId === numericSessionId);
  
  const result = stagingTable ? stagingTable.data : [];
  return result;
};

export const fetchImportSessionData = async (sessionId: string): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const session = mockImportSessions.find(s => s.id === parseInt(sessionId));
  if (!session) throw new Error('Import session not found');
  return session;
};

export const promoteToProduction = async (sessionId: string | number): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const numericSessionId = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
  const stagingTable = mockStagingTables.find(table => table.sessionId === numericSessionId);
  if (!stagingTable) {
    throw new Error('Staging table not found');
  }

  const productionTable = {
    id: Date.now(),
    data: stagingTable.data,
    status: 'production',
    createdAt: new Date().toISOString(),
    sourceStagingId: numericSessionId // Use numeric sessionId for consistency
  };
  mockProductionTables.push(productionTable);
  
  // Update staging table status
  stagingTable.status = 'committed';
  
  return productionTable;
};

export const updateStagingData = async (sessionId: string | number, data: any[]): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const numericSessionId = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
  const stagingTable = mockStagingTables.find(table => table.sessionId === numericSessionId);
  if (!stagingTable) throw new Error('Staging table not found');
  
  stagingTable.data = data;
  stagingTable.updatedAt = new Date().toISOString();
  
  return stagingTable;
};

export const deleteStagingData = async (sessionId: string | number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const numericSessionId = typeof sessionId === 'string' ? parseInt(sessionId) : sessionId;
  const stagingTableIndex = mockStagingTables.findIndex(table => table.sessionId === numericSessionId);
  if (stagingTableIndex === -1) throw new Error('Staging table not found');
  
  mockStagingTables.splice(stagingTableIndex, 1);
};

export const uploadExcelFile = async (formData: FormData, progressCallback?: (progress: number) => void): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  
  try {
    // Extract data from FormData
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string;
    const sessionName = formData.get('sessionName') as string;
    const sessionDescription = formData.get('sessionDescription') as string;
    const uploadedBy = formData.get('uploadedBy') as string;
    
    // Validate required fields
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!sessionName || sessionName.trim() === '') {
      throw new Error('Session name is required');
    }
    
    if (!dataType || dataType.trim() === '') {
      throw new Error('Data type is required');
    }
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      throw new Error('Only Excel files (.xlsx, .xls) are supported');
    }
    
    // Simulate progress updates
    if (progressCallback) {
      progressCallback(25);
      await new Promise(resolve => setTimeout(resolve, 200));
      progressCallback(50);
      await new Promise(resolve => setTimeout(resolve, 200));
      progressCallback(75);
      await new Promise(resolve => setTimeout(resolve, 200));
      progressCallback(100);
    }
    
    // Process the Excel file - this will read the actual file content
    const data = await processExcelFile(file);
    
    // Create import session
    const sessionData = {
      name: sessionName,
      description: sessionDescription || '',
      dataType,
      uploadedBy: uploadedBy || 'unknown',
      status: 'staging'
    };
    
    const session = await createImportSession(sessionData);
    
    // Commit to staging
    const stagingTable = await commitToStaging(session.id, data);
    
    // Update the session with file information and record count
    const updatedSession = {
      ...session,
      files: [
        {
          id: Date.now(),
          filename: file.name,
          originalName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          status: 'staged',
          recordCount: data.length,
          uploadedBy: uploadedBy || 'unknown',
          allData: data
        }
      ]
    };
    
    // Update the session in the mock data
    const sessionIndex = mockImportSessions.findIndex(s => s.id === session.id);
    if (sessionIndex !== -1) {
      mockImportSessions[sessionIndex] = updatedSession;
    }
    
    return {
      session: updatedSession,
      stagingTable,
      data,
      sessionId: session.id
    };
    
  } catch (error) {
    console.error('Error in uploadExcelFile:', error);
    throw error;
  }
};

export const deleteImportSession = async (sessionId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const sessionIndex = mockImportSessions.findIndex(s => s.id === parseInt(sessionId));
  if (sessionIndex === -1) throw new Error('Import session not found');
  
  mockImportSessions.splice(sessionIndex, 1);
  
  // Also delete related staging tables
  const relatedStagingTables = mockStagingTables.filter(table => table.sessionId === parseInt(sessionId));
  relatedStagingTables.forEach(table => {
    const tableIndex = mockStagingTables.findIndex(t => t.id === table.id);
    if (tableIndex !== -1) {
      mockStagingTables.splice(tableIndex, 1);
    }
  });
};

// User management functions that were missing
export const createUser = async (userData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newUser = {
    id: Date.now(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  mockUsers.push(newUser);
  return newUser;
};

export const updateUser = async (id: string, userData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) throw new Error('User not found');
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
  return mockUsers[userIndex];
};

export const deleteUser = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) throw new Error('User not found');
  mockUsers.splice(userIndex, 1);
};

// Role management functions
export const createRole = async (roleData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newRole = {
    id: Date.now(),
    ...roleData,
    createdAt: new Date().toISOString()
  };
  return newRole;
};

export const updateRole = async (id: string, roleData: any): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return { id: parseInt(id), ...roleData, updatedAt: new Date().toISOString() };
};

export const deleteRole = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  // Mock deletion
};

// Privilege management functions
export const fetchPrivileges = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return [
    { id: 1, name: 'read', description: 'Read access' },
    { id: 2, name: 'write', description: 'Write access' },
    { id: 3, name: 'delete', description: 'Delete access' }
  ];
};

export const assignRolesToPrivilege = async (privilegeId: string, roleIds: string[]): Promise<any> => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return {
    privilegeId: parseInt(privilegeId),
    roleIds: roleIds.map(id => parseInt(id)),
    assignedAt: new Date().toISOString()
  };
};
