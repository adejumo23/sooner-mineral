// API client for making HTTP requests to the server
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Utility function to generate section name based on state and S-T-R data
export const generateSectionName = (state: string, str?: string, sectionName?: string): string => {
  // If sectionName is already provided and not empty, use it
  if (sectionName && sectionName.trim() && sectionName !== 'data yet to be provided') {
    return sectionName;
  }
  
  if (state === 'OK' && str) {
    // For Oklahoma, use the S-T-R data as the section name
    return str;
  } else if (str && str.trim() && str !== 'data yet to be provided') {
    // If STR data is available, use it regardless of state
    return str;
  } else {
    // For other states or missing data, use a default
    return 'Section Name Not Available';
  }
};

// Helper function to make API requests with cache-busting
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Add cache-busting parameter to prevent stale data
  const separator = endpoint.includes('?') ? '&' : '?';
  const cacheBuster = `_t=${Date.now()}`;
  const url = `${API_BASE_URL}${endpoint}${separator}${cacheBuster}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
    cache: 'no-store',
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Mock data for fallback when server is not available
const mockUsers = [
  { 
    id: 'u1', 
    name: 'Alice Admin', 
    email: 'admin@sooner.cap', 
    role: { id: '1', name: 'Administrator' }, 
    roleId: '1' 
  },
  { 
    id: 'u2', 
    name: 'Bob Manager', 
    email: 'manager@sooner.cap', 
    role: { id: '2', name: 'Manager' }, 
    roleId: '2' 
  },
  { 
    id: 'u3', 
    name: 'Charlie Analyst', 
    email: 'analyst@sooner.cap', 
    role: { id: '3', name: 'Analyst' }, 
    roleId: '3' 
  },
  { 
    id: 'u4', 
    name: 'David Buyer', 
    email: 'buyer@sooner.cap', 
    role: { id: '4', name: 'Buyer' }, 
    roleId: '4' 
  },
  { 
    id: 'u5', 
    name: 'Eve Viewer', 
    email: 'viewer@sooner.cap', 
    role: { id: '5', name: 'Viewer' }, 
    roleId: '5' 
  }
];

// User API functions
export const fetchUsers = async (page = 1, limit = 50) => {
  try {
    const response = await apiRequest(`/users?page=${page}&limit=${limit}`);
    // Handle new paginated response structure
    return {
      data: response.data || response,
      pagination: response.pagination || null
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { data: mockUsers, pagination: null };
  }
};

export const fetchUser = async (id: string) => {
  try {
    return await apiRequest(`/users/${id}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return mockUsers.find(user => user.id === id);
  }
};

export const createUser = async (userData: any) => {
  try {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock user:', error);
    const newUser = { ...userData, id: `u${Date.now()}` };
    mockUsers.push(newUser);
    return newUser;
  }
};

export const updateUser = async (id: string, userData: any) => {
  try {
    return await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock user:', error);
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
      return mockUsers[userIndex];
    }
    throw new Error('User not found');
  }
};

export const deleteUser = async (id: string) => {
  try {
    return await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock user:', error);
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
      return { success: true };
    }
    throw new Error('User not found');
  }
};

// Section API functions
export const fetchSections = async (page = 1, limit = 50) => {
  try {
    const response = await apiRequest(`/sections?page=${page}&limit=${limit}`);
    // Handle new paginated response structure
    const sections = response.data || response; // Support both old and new formats
    // Generate section names based on state and S-T-R data
    const processedSections = sections.map((section: any) => ({
      ...section,
      sectionName: generateSectionName(section.state, section.str, section.sectionName || section.section_name),
      state: 'OK' // Hardcode state to 'OK' as requested
    }));
    
    // Return both data and pagination info if available
    return {
      data: processedSections,
      pagination: response.pagination || null
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { data: [], pagination: null };
  }
};

export const fetchSection = async (id: string) => {
  try {
    const section = await apiRequest(`/sections/${id}`);
    // Generate section name based on state and S-T-R data
    return {
      ...section,
      sectionName: generateSectionName(section.state, section.str, section.sectionName || section.section_name),
      state: 'OK' // Hardcode state to 'OK' as requested
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

export const createSection = async (sectionData: any) => {
  try {
    // Ensure state is set to 'OK' for all new sections
    const sectionDataWithState = {
      ...sectionData,
      state: 'OK'
    };
    return await apiRequest('/sections', {
      method: 'POST',
      body: JSON.stringify(sectionDataWithState),
    });
  } catch (error) {
    console.warn('Server not available, creating mock tract:', error);
    return { ...sectionData, id: `s${Date.now()}`, state: 'OK' };
  }
};

export const updateSection = async (id: string, sectionData: any) => {
  try {
    // Ensure state is set to 'OK' for all section updates
    const sectionDataWithState = {
      ...sectionData,
      state: 'OK'
    };
    return await apiRequest(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sectionDataWithState),
    });
  } catch (error) {
    console.warn('Server not available, updating mock tract:', error);
    return { ...sectionData, id, state: 'OK' };
  }
};

export const deleteSection = async (id: string) => {
  try {
    return await apiRequest(`/sections/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock tract:', error);
    return { success: true };
  }
};

// Unit API functions
export const fetchUnits = async (page = 1, limit = 50) => {
  try {
    const response = await apiRequest(`/units?page=${page}&limit=${limit}`);
    // Handle new paginated response structure
    return {
      data: response.data || response,
      pagination: response.pagination || null
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { data: [], pagination: null };
  }
};

export const fetchUnit = async (id: string) => {
  try {
    return await apiRequest(`/units/${id}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

export const createUnit = async (unitData: any) => {
  try {
    return await apiRequest('/units', {
      method: 'POST',
      body: JSON.stringify(unitData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock unit:', error);
    return { ...unitData, id: `unit${Date.now()}` };
  }
};

export const updateUnit = async (id: string, unitData: any) => {
  try {
    return await apiRequest(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(unitData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock unit:', error);
    return { ...unitData, id };
  }
};

export const deleteUnit = async (id: string) => {
  try {
    return await apiRequest(`/units/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock unit:', error);
    return { success: true };
  }
};

// Lead API functions
export const fetchLeads = async (page = 1, limit = 50) => {
  try {
    const response = await apiRequest(`/leads?page=${page}&limit=${limit}`);
    // Handle new paginated response structure
    return {
      data: response.data || response,
      pagination: response.pagination || null
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { data: [], pagination: null };
  }
};

export const fetchLead = async (id: string) => {
  try {
    return await apiRequest(`/leads/${id}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

export const createLead = async (leadData: any) => {
  try {
    return await apiRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock lead:', error);
    return { ...leadData, id: `lead${Date.now()}` };
  }
};

export const updateLead = async (id: string, leadData: any) => {
  try {
    return await apiRequest(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock lead:', error);
    return { ...leadData, id };
  }
};

export const deleteLead = async (id: string) => {
  try {
    return await apiRequest(`/leads/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock lead:', error);
    return { success: true };
  }
};

// Contact API functions
export const fetchContacts = async (page = 1, limit = 50) => {
  try {
    const response = await apiRequest(`/contacts?page=${page}&limit=${limit}`);
    // Handle new paginated response structure
    return {
      data: response.data || response,
      pagination: response.pagination || null
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { data: [], pagination: null };
  }
};

export const fetchContact = async (id: string) => {
  try {
    return await apiRequest(`/contacts/${id}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

// Assignment API functions
export const fetchAssignments = async (page = 1, limit = 50, search = '') => {
  try {
    let url = `/assignments?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await apiRequest(url);
    // Handle new paginated response structure
    return {
      data: response.data || response,
      pagination: response.pagination || null
    };
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { data: [], pagination: null };
  }
};

export const fetchAssignment = async (id: string) => {
  try {
    return await apiRequest(`/assignments/${id}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

export const createAssignment = async (assignmentData: any) => {
  try {
    return await apiRequest('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock assignment:', error);
    return { ...assignmentData, id: `assignment${Date.now()}` };
  }
};

export const updateAssignment = async (id: string, assignmentData: any) => {
  try {
    return await apiRequest(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock assignment:', error);
    return { ...assignmentData, id };
  }
};

export const deleteAssignment = async (id: string) => {
  try {
    return await apiRequest(`/assignments/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock assignment:', error);
    return { success: true };
  }
};

// Bulk operations
export const createBulkAssignments = async (assignments: any[]) => {
  try {
    return await apiRequest('/assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  } catch (error) {
    console.warn('Server not available, creating mock bulk assignments:', error);
    return assignments.map((assignment, index) => ({
      ...assignment,
      id: `assignment${Date.now()}_${index}`
    }));
  }
};

// Call log functions
export const fetchLeadCallLogs = async (leadId: string) => {
  try {
    return await apiRequest(`/leads/${leadId}/call-logs`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const createLeadCallLog = async (leadId: string, callLogData: any) => {
  try {
    return await apiRequest(`/leads/${leadId}/call-logs`, {
      method: 'POST',
      body: JSON.stringify(callLogData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock call log:', error);
    return { ...callLogData, id: `calllog${Date.now()}` };
  }
};

// Notes functions
export const fetchLeadNotes = async (leadId: string) => {
  try {
    return await apiRequest(`/leads/${leadId}/notes`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchLeadSections = async (leadId: string) => {
  try {
    return await apiRequest(`/leads/${leadId}/sections`);
  } catch (error) {
    console.warn('Server not available, using mock sections:', error);
    return [];
  }
};

export const createLeadNote = async (leadId: string, noteData: any) => {
  try {
    return await apiRequest(`/leads/${leadId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock note:', error);
    return { ...noteData, id: `note${Date.now()}` };
  }
};

// Assignment history
export const fetchAssignmentHistory = async (assignmentId: string) => {
  try {
    return await apiRequest(`/assignments/${assignmentId}/history`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

// Unit-specific functions
export const fetchUnitSections = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/sections`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitSectionsEnhanced = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/sections/enhanced`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitContacts = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/contacts`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitContactsAggregated = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/contacts/aggregated`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitNotes = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/notes`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitAssignments = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/assignments`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitNames = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/unit-names`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      currentUnitNames: [],
      newUnitNames: [],
      totalRecords: 0
    };
  }
};

export const assignUnit = async (unitId: string, assignmentData: any) => {
  try {
    return await apiRequest(`/units/${unitId}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock assignment:', error);
    return { ...assignmentData, id: `assignment${Date.now()}` };
  }
};

export const unassignUnit = async (unitId: string, notes: string) => {
  try {
    return await apiRequest(`/units/${unitId}/unassign`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  } catch (error) {
    console.warn('Server not available, unassigning mock unit:', error);
    return { success: true };
  }
};

export const updateUnitLock = async (unitId: string, lockData: any) => {
  try {
    return await apiRequest(`/units/${unitId}/lock`, {
      method: 'PUT',
      body: JSON.stringify(lockData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock unit lock:', error);
    return { ...lockData, id: unitId };
  }
};

export const createUnitNote = async (unitId: string, noteData: any) => {
  try {
    return await apiRequest(`/units/${unitId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock unit note:', error);
    return { ...noteData, id: `note${Date.now()}` };
  }
};

// Contact-specific functions
export const fetchContactTractOwnership = async (contactId: string) => {
  try {
    return await apiRequest(`/contacts/${contactId}/tract-ownership`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchContactUnits = async (contactId: string) => {
  try {
    return await apiRequest(`/contacts/${contactId}/units`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

// Tract contacts
export const fetchSectionContacts = async (sectionId: string) => {
  try {
    return await apiRequest(`/sections/${sectionId}/contacts`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchContactLeads = async (contactId: string) => {
  try {
    return await apiRequest(`/contacts/${contactId}/leads`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchContactCallLogs = async (contactId: string) => {
  try {
    return await apiRequest(`/contacts/${contactId}/call-logs`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchContactDocuments = async (contactId: string) => {
  try {
    return await apiRequest(`/contacts/${contactId}/documents`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchDistressSignals = async (contactId: string) => {
  try {
    return await apiRequest(`/contacts/${contactId}/distress-signals`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

// Authentication functions
export const login = async (credentials: any) => {
  try {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (error) {
    console.warn('Server not available, using mock login:', error);
    return { 
      success: true, 
      user: { 
        id: 'mock-user', 
        name: 'Mock User', 
        email: credentials.email,
        role: {
          name: 'Administrator',
          id: 'admin-role'
        }
      } 
    };
  }
};

export const logout = async () => {
  try {
    return await apiRequest('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.warn('Server not available, using mock logout:', error);
    return { success: true };
  }
};

// Lead-related functions
export const fetchSectionLeads = async (sectionId: string) => {
  try {
    return await apiRequest(`/sections/${sectionId}/leads`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const createSectionLead = async (sectionId: string, leadData: any) => {
  try {
    return await apiRequest(`/sections/${sectionId}/leads`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock lead:', error);
    return { ...leadData, id: `lead${Date.now()}` };
  }
};

export const updateLeadStatus = async (leadId: string, status: string) => {
  try {
    return await apiRequest(`/leads/${leadId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.warn('Server not available, updating mock lead status:', error);
    return { success: true };
  }
};

export const convertLeadToDeal = async (leadId: string, dealData: any) => {
  try {
    return await apiRequest(`/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify(dealData),
    });
  } catch (error) {
    console.warn('Server not available, converting mock lead:', error);
    return { ...dealData, id: `deal${Date.now()}` };
  }
};

// Mapping and spatial functions
export const fetchSectionSpatial = async (sectionId: string) => {
  try {
    return await apiRequest('/section-spatial');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

export const fetchMapLayerPreferences = async () => {
  try {
    return await apiRequest('/map/layer-preferences');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchNearbyWells = async (lat: number, lng: number, radius: number, county?: string) => {
  try {
    let url = `/map/nearby/wells?lat=${lat}&lng=${lng}&radius=${radius}`;
    if (county) {
      url += `&county=${encodeURIComponent(county)}`;
    }
    return await apiRequest(url);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchNearbyPermits = async (lat: number, lng: number, radius: number) => {
  try {
    return await apiRequest(`/map/nearby/permits?lat=${lat}&lng=${lng}&radius=${radius}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchNearbyRigs = async (lat: number, lng: number, radius: number) => {
  try {
    return await apiRequest(`/map/nearby/rigs?lat=${lat}&lng=${lng}&radius=${radius}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchNearbyUnits = async (lat: number, lng: number, radius: number) => {
  try {
    return await apiRequest(`/map/nearby/units?lat=${lat}&lng=${lng}&radius=${radius}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const updateMapLayerPreference = async (layerId: string, preferences: any) => {
  try {
    return await apiRequest(`/map/layer-preferences/${layerId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  } catch (error) {
    console.warn('Server not available, updating mock preferences:', error);
    return { success: true };
  }
};

export const fetchProducingWells = async () => {
  try {
    return await apiRequest('/wells/producing');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchPermits = async () => {
  try {
    return await apiRequest('/permits');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchRigs = async () => {
  try {
    return await apiRequest('/rigs');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

// ESG functions
export const fetchESGProfiles = async () => {
  try {
    return await apiRequest('/esg/profiles');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [
      {
        id: '1',
        tractName: 'Sample Tract A',
        operatorName: 'ExxonMobil',
        overallRiskLevel: 'Low',
        carbonIntensity: 12.5,
        operatorComplianceScore: 4,
        environmentalScore: 85,
        socialScore: 78,
        governanceScore: 82,
        lastAssessmentDate: '2024-01-15',
        nextReviewDate: '2024-07-15'
      },
      {
        id: '2',
        tractName: 'Sample Tract B',
        operatorName: 'Chevron',
        overallRiskLevel: 'Medium',
        carbonIntensity: 18.3,
        operatorComplianceScore: 3,
        environmentalScore: 72,
        socialScore: 85,
        governanceScore: 78,
        lastAssessmentDate: '2024-01-10',
        nextReviewDate: '2024-07-10'
      }
    ];
  }
};

export const fetchESGRiskFlags = async () => {
  try {
    return await apiRequest('/esg/risk-flags');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [
      {
        id: '1',
        tractName: 'High Risk Tract',
        riskType: 'Environmental',
        severity: 'High',
        description: 'Potential groundwater contamination risk',
        flaggedDate: '2024-01-20',
        status: 'Active',
        assignedTo: 'Environmental Team'
      },
      {
        id: '2',
        tractName: 'Compliance Issue',
        riskType: 'Regulatory',
        severity: 'Medium',
        description: 'Missing permit documentation',
        flaggedDate: '2024-01-18',
        status: 'Under Review',
        assignedTo: 'Legal Team'
      }
    ];
  }
};

export const fetchRegulatoryWatchlist = async () => {
  try {
    return await apiRequest('/esg/regulatory-watchlist');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [
      {
        id: '1',
        regulationName: 'EPA Methane Rule',
        jurisdiction: 'Federal',
        effectiveDate: '2024-03-15',
        impactLevel: 'High',
        complianceDeadline: '2024-06-15',
        status: 'Pending'
      },
      {
        id: '2',
        regulationName: 'State Water Quality Standards',
        jurisdiction: 'Texas',
        effectiveDate: '2024-02-01',
        impactLevel: 'Medium',
        complianceDeadline: '2024-05-01',
        status: 'Active'
      }
    ];
  }
};

export const fetchESGPortfolioSummary = async () => {
  try {
    return await apiRequest('/esg/portfolio-summary');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      totalSections: 150,
      totalUnits: 25,
      lowRiskAssets: 120,
      highRiskAssets: 25,
      criticalRiskAssets: 5,
      averageCarbonIntensity: 15.2,
      overallComplianceScore: 82,
      environmentalScore: 85,
      socialScore: 78,
      governanceScore: 82
    };
  }
};

// Map dashboard functions
export const fetchMapAssets = async () => {
  try {
    return await apiRequest('/map/assets');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchMapOverlays = async () => {
  try {
    return await apiRequest('/map/overlays');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchMapLayerConfigs = async () => {
  try {
    return await apiRequest('/map/layer-configs');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const getMapFilterOptions = async () => {
  try {
    return await apiRequest('/map/filter-options');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
  }
};

export const logMapInteraction = async (interaction: any) => {
  try {
    return await apiRequest('/map/interactions', {
      method: 'POST',
      body: JSON.stringify(interaction),
    });
  } catch (error) {
    console.warn('Server not available, logging mock interaction:', error);
    return { success: true };
  }
};

export const exportMapData = async (filters: any) => {
  try {
    return await apiRequest('/map/export', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  } catch (error) {
    console.warn('Server not available, exporting mock data:', error);
    return { success: true, data: [] };
  }
};

// Task and calendar functions
export const fetchTasks = async () => {
  try {
    return await apiRequest('/tasks');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchTaskStatistics = async () => {
  try {
    return await apiRequest('/tasks/statistics');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
  }
};

export const fetchCalendarEvents = async () => {
  try {
    return await apiRequest('/calendar/events');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const createTask = async (taskData: any) => {
  try {
    return await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock task:', error);
    return { ...taskData, id: `task${Date.now()}` };
  }
};

export const updateTask = async (taskId: string, taskData: any) => {
  try {
    return await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock task:', error);
    return { ...taskData, id: taskId };
  }
};

// Document generation functions
export const fetchDocumentTemplates = async () => {
  try {
    return await apiRequest('/documents/templates');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchGeneratedDocuments = async () => {
  try {
    return await apiRequest('/documents/generated');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const createDocumentTemplate = async (templateData: any) => {
  try {
    return await apiRequest('/documents/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock template:', error);
    return { ...templateData, id: `template${Date.now()}` };
  }
};

export const updateDocumentTemplate = async (templateId: string, templateData: any) => {
  try {
    return await apiRequest(`/documents/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock template:', error);
    return { ...templateData, id: templateId };
  }
};

export const deleteDocumentTemplate = async (templateId: string) => {
  try {
    return await apiRequest(`/documents/templates/${templateId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock template:', error);
    return { success: true };
  }
};

export const generateDocument = async (documentData: any) => {
  try {
    return await apiRequest('/documents/generate', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  } catch (error) {
    console.warn('Server not available, generating mock document:', error);
    return { ...documentData, id: `doc${Date.now()}` };
  }
};

// Reporting functions
export const fetchLeadConversionFunnel = async () => {
  try {
    const response = await apiRequest('/reports/lead-conversion-funnel');
    return response;
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      stages: [
        { stage: 'Leads Generated', value: 1000, percentage: 100, color: '#3B82F6' },
        { stage: 'Initial Contact', value: 750, percentage: 75, color: '#10B981' },
        { stage: 'Qualified', value: 500, percentage: 50, color: '#F59E0B' },
        { stage: 'Proposal Sent', value: 300, percentage: 30, color: '#EF4444' },
        { stage: 'Closed Won', value: 150, percentage: 15, color: '#8B5CF6' }
      ],
      conversionRate: 15,
      totalLeads: 1000
    };
  }
};

export const fetchOutreachActivitySummary = async () => {
  try {
    return await apiRequest('/reports/outreach-activity-summary');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      totalOutreach: 2500,
      successfulContacts: 1800,
      responseRate: 72,
      averageResponseTime: 2.5,
      topChannels: [
        { channel: 'Email', count: 1200, percentage: 48 },
        { channel: 'Phone', count: 800, percentage: 32 },
        { channel: 'LinkedIn', count: 500, percentage: 20 }
      ]
    };
  }
};

export const fetchAssignmentPerformanceMetrics = async () => {
  try {
    return await apiRequest('/reports/assignment-performance-metrics');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      totalAssignments: 450,
      completedAssignments: 380,
      completionRate: 84.4,
      averageCompletionTime: 5.2,
      topPerformers: [
        { buyer: 'John Smith', assignments: 45, completionRate: 95 },
        { buyer: 'Sarah Johnson', assignments: 42, completionRate: 90 },
        { buyer: 'Mike Davis', assignments: 38, completionRate: 88 }
      ]
    };
  }
};

export const fetchDealVelocityMetrics = async () => {
  try {
    return await apiRequest('/reports/deal-velocity-metrics');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      averageDealTime: 45,
      fastestDeal: 12,
      slowestDeal: 120,
      dealsThisMonth: 25,
      velocityTrend: 'increasing',
      stageBreakdown: [
        { stage: 'Discovery', averageDays: 8 },
        { stage: 'Negotiation', averageDays: 15 },
        { stage: 'Due Diligence', averageDays: 12 },
        { stage: 'Closing', averageDays: 10 }
      ]
    };
  }
};

export const fetchESGComplianceSummary = async () => {
  try {
    return await apiRequest('/reports/esg-compliance-summary');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      complianceScore: 85,
      environmentalScore: 90,
      socialScore: 80,
      governanceScore: 85,
      certifications: 12,
      pendingAudits: 3,
      riskLevel: 'Low'
    };
  }
};

export const getFilterOptions = async () => {
  try {
    return await apiRequest('/reports/filter-options');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
  }
};

export const exportDashboardData = async (filters: any) => {
  try {
    return await apiRequest('/reports/export', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  } catch (error) {
    console.warn('Server not available, exporting mock data:', error);
    return { success: true, data: [] };
  }
};

// Role and privilege functions
export const fetchRoles = async () => {
  try {
    return await apiRequest('/roles');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [
      {
        id: '1',
        name: 'Administrator',
        description: 'Full system access with all permissions'
      },
      {
        id: '2',
        name: 'Manager',
        description: 'Management access to most system features'
      },
      {
        id: '3',
        name: 'Analyst',
        description: 'Read-only access to reports and analytics'
      },
      {
        id: '4',
        name: 'Buyer',
        description: 'Access to tract and unit management features'
      },
      {
        id: '5',
        name: 'Viewer',
        description: 'Basic read-only access to system data'
      }
    ];
  }
};

export const deleteRole = async (roleId: string) => {
  try {
    return await apiRequest(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock role:', error);
    return { success: true };
  }
};

export const updateRole = async (roleId: string, roleData: any) => {
  try {
    return await apiRequest(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock role:', error);
    return { ...roleData, id: roleId };
  }
};

export const createRole = async (roleData: any) => {
  try {
    return await apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock role:', error);
    return { ...roleData, id: `role${Date.now()}` };
  }
};

export const fetchPrivileges = async () => {
  try {
    return await apiRequest('/privileges');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [
      {
        id: '1',
        name: 'User Management',
        description: 'Create, edit, and delete system users',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' }
        ]
      },
      {
        id: '2',
        name: 'Tract Management',
        description: 'View, create, edit, and delete mineral sections',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' },
          { id: '4', name: 'Buyer' }
        ]
      },
      {
        id: '3',
        name: 'Unit Management',
        description: 'Manage leasehold-based pooled acreage groups',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' },
          { id: '4', name: 'Buyer' }
        ]
      },
      {
        id: '4',
        name: 'Assignment Management',
        description: 'Assign sections and units to buyers',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' }
        ]
      },
      {
        id: '5',
        name: 'Lead Management',
        description: 'Manage and track lead outreach activities',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' },
          { id: '4', name: 'Buyer' }
        ]
      },
      {
        id: '6',
        name: 'Owner Management',
        description: 'Manage landowners, sellers, and contacts',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' },
          { id: '4', name: 'Buyer' }
        ]
      },
      {
        id: '7',
        name: 'Reporting Access',
        description: 'View reports and analytics dashboards',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' },
          { id: '3', name: 'Analyst' }
        ]
      },
      {
        id: '8',
        name: 'Data Import',
        description: 'Import CSV and Excel files into the system',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' }
        ]
      },
      {
        id: '9',
        name: 'ESG Tracking',
        description: 'Access environmental, social, and governance tracking',
        roles: [
          { id: '1', name: 'Administrator' },
          { id: '2', name: 'Manager' }
        ]
      },
      {
        id: '10',
        name: 'System Settings',
        description: 'Configure system-wide settings and preferences',
        roles: [
          { id: '1', name: 'Administrator' }
        ]
      }
    ];
  }
};

export const assignRolesToPrivilege = async (privilegeId: string, roleIds: string[]) => {
  try {
    return await apiRequest(`/privileges/${privilegeId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleIds }),
    });
  } catch (error) {
    console.warn('Server not available, assigning mock roles:', error);
    return { success: true };
  }
};

// Dashboard data
export const fetchSectionDashboard = async () => {
  try {
    return await apiRequest('/dashboard/sections');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { totalSections: 0, totalAcres: 0, totalValue: 0 };
  }
};

export const fetchSectionOwners = async (sectionId: string) => {
  try {
    return await apiRequest(`/sections/${sectionId}/owners`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchSectionPricing = async (sectionId: string) => {
  try {
    return await apiRequest(`/sections/${sectionId}/pricing`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

// Import functions
export const uploadFile = async (formData: FormData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/import/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Server not available for file upload:', error);
    return {
      success: false,
      message: 'Upload failed. Server not available.'
    };
  }
};

export const fetchStagingTables = async () => {
  try {
    return await apiRequest('/import/staging-tables');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      success: true,
      stagingTables: []
    };
  }
};

export const fetchStagingTableData = async (tableName: string, limit: number = 50) => {
  try {
    return await apiRequest(`/import/staging-data/${tableName}?limit=${limit}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      success: true,
      data: []
    };
  }
};

export const fetchProductionTables = async () => {
  try {
    return await apiRequest('/import/production-tables');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      success: true,
      productionTables: []
    };
  }
};

export const fetchProductionTableData = async (tableName: string, limit: number = 50) => {
  try {
    return await apiRequest(`/import/production-data/${tableName}?limit=${limit}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {
      success: true,
      data: []
    };
  }
};

// Normalized data queries
export const fetchNormalizedOverview = async () => {
  try {
    return await apiRequest('/normalized/overview');
  } catch (error) {
    console.error('Error fetching normalized overview:', error);
    return {
      success: true,
      data: []
    };
  }
};

export const fetchPricingSummary = async () => {
  try {
    return await apiRequest('/normalized/pricing-summary');
  } catch (error) {
    console.error('Error fetching pricing summary:', error);
    return {
      success: true,
      data: []
    };
  }
};

export const fetchAcreageSummary = async () => {
  try {
    return await apiRequest('/normalized/acreage-summary');
  } catch (error) {
    console.error('Error fetching acreage summary:', error);
    return {
      success: true,
      data: []
    };
  }
};

export const fetchUnitSummary = async () => {
  try {
    return await apiRequest('/normalized/unit-summary');
  } catch (error) {
    console.error('Error fetching unit summary:', error);
    return {
      success: true,
      data: []
    };
  }
};

// Pricing data functions
export const fetchOklahomaPricing = async () => {
  try {
    return await apiRequest('/pricing/oklahoma');
  } catch (error) {
    console.error('Error fetching Oklahoma pricing:', error);
    return {
      success: false,
      data: []
    };
  }
};

export const fetchTexasPricing = async () => {
  try {
    return await apiRequest('/pricing/texas');
  } catch (error) {
    console.error('Error fetching Texas pricing:', error);
    return {
      success: false,
      data: []
    };
  }
};

// Acreage schedule functions
export const fetchAcreageSchedule = async () => {
  try {
    return await apiRequest('/normalized/recreate-acreage-schedule');
  } catch (error) {
    console.error('Error fetching acreage schedule:', error);
    return {
      success: false,
      data: []
    };
  }
};

export const approveImport = async (stagingTableName: string, productionTableName: string) => {
  try {
    return await apiRequest('/import/approve', {
      method: 'POST',
      body: JSON.stringify({
        stagingTableName,
        productionTableName
      }),
    });
  } catch (error) {
    console.warn('Server not available for import approval:', error);
    return {
      success: false,
      message: 'Import approval failed. Server not available.'
    };
  }
};

export const deleteStagingTable = async (tableName: string) => {
  try {
    return await apiRequest(`/import/staging-table/${tableName}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available for table deletion:', error);
    return {
      success: false,
      message: 'Table deletion failed. Server not available.'
    };
  }
};

export const updateStagingRecord = async (tableName: string, recordId: string, updateData: any) => {
  try {
    return await apiRequest(`/import/staging-data/${tableName}/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  } catch (error) {
    console.warn('Server not available for update staging record:', error);
    return {
      success: false,
      message: 'Update failed. Server not available.'
    };
  }
};

export const deleteStagingRecord = async (tableName: string, recordId: string) => {
  try {
    return await apiRequest(`/import/staging-data/${tableName}/${recordId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available for delete staging record:', error);
    return {
      success: false,
      message: 'Delete failed. Server not available.'
    };
  }
};

// Export all functions as default
export default {
  // Users
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  
  // Sections
  fetchSections,
  fetchSection,
  createSection,
  updateSection,
  deleteSection,
  fetchSectionOwners,
  fetchSectionPricing,
  fetchSectionDashboard,
  
  // Units
  fetchUnits,
  fetchUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  
  // Leads
  fetchLeads,
  fetchLead,
  createLead,
  updateLead,
  deleteLead,
  fetchLeadCallLogs,
  createLeadCallLog,
  fetchLeadNotes,
  createLeadNote,
  
  // Contacts
  fetchContacts,
  fetchContact,
  
  // Assignments
  fetchAssignments,
  fetchAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createBulkAssignments,
  fetchAssignmentHistory,
  
  // Unit-specific functions
  fetchUnitSections,
  fetchUnitSectionsEnhanced,
  fetchUnitContacts,
  fetchUnitContactsAggregated,
  fetchUnitNotes,
  fetchUnitAssignments,
  assignUnit,
  unassignUnit,
  updateUnitLock,
  createUnitNote,
  
  // Contact-specific functions
  fetchContactTractOwnership,
  fetchContactUnits,
  fetchContactLeads,
  fetchContactCallLogs,
  fetchContactDocuments,
  fetchDistressSignals,
  
  // Authentication functions
  login,
  logout,
  
  // Lead-related functions
  fetchSectionLeads,
  createSectionLead,
  updateLeadStatus,
  convertLeadToDeal,
  
  // Mapping and spatial functions
  fetchSectionSpatial,
  fetchMapLayerPreferences,
  fetchNearbyWells,
  fetchNearbyPermits,
  fetchNearbyRigs,
  fetchNearbyUnits,
  updateMapLayerPreference,
  fetchProducingWells,
  fetchPermits,
  fetchRigs,
  
  // ESG functions
  fetchESGProfiles,
  fetchESGRiskFlags,
  fetchRegulatoryWatchlist,
  fetchESGPortfolioSummary,
  
  // Map dashboard functions
  fetchMapAssets,
  fetchMapOverlays,
  fetchMapLayerConfigs,
  getMapFilterOptions,
  logMapInteraction,
  exportMapData,
  
  // Task and calendar functions
  fetchTasks,
  fetchTaskStatistics,
  fetchCalendarEvents,
  createTask,
  updateTask,
  
  // Document generation functions
  fetchDocumentTemplates,
  fetchGeneratedDocuments,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  generateDocument,
  
  // Reporting functions
  fetchLeadConversionFunnel,
  fetchOutreachActivitySummary,
  fetchAssignmentPerformanceMetrics,
  fetchDealVelocityMetrics,
  fetchESGComplianceSummary,
  getFilterOptions,
  exportDashboardData,
  
  // Role and privilege functions
  fetchRoles,
  deleteRole,
  updateRole,
  createRole,
  fetchPrivileges,
  assignRolesToPrivilege,
  
    // Import functions
    uploadFile,
  fetchStagingTables,
  fetchStagingTableData,
  fetchProductionTables,
  fetchProductionTableData,
  approveImport,
  deleteStagingTable,
  updateStagingRecord,
  deleteStagingRecord,
  fetchNormalizedOverview,
  fetchPricingSummary,
  fetchAcreageSummary,
  fetchUnitSummary,
  fetchOklahomaPricing,
  fetchTexasPricing,
  fetchAcreageSchedule,
};

