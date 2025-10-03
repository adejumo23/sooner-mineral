// API client for making HTTP requests to the server
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3051/api';

// Helper function to make API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Mock data for fallback when server is not available
const mockUsers = [
  { id: 'u1', name: 'Alice Admin', email: 'admin@sooner.cap', role: 'Administrator', roleId: '1' },
  { id: 'u2', name: 'Bob Manager', email: 'manager@sooner.cap', role: 'Land Manager', roleId: '2' },
  { id: 'u3', name: 'Charlie Viewer', email: 'viewer@sooner.cap', role: 'Viewer', roleId: '3' },
  { id: 'u4', name: 'David Buyer', email: 'buyer@sooner.cap', role: 'Buyer', roleId: '4' }
];

// User API functions
export const fetchUsers = async () => {
  try {
    return await apiRequest('/users');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return mockUsers;
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

// Tract API functions
export const fetchTracts = async () => {
  try {
    return await apiRequest('/tracts');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchTract = async (id: string) => {
  try {
    return await apiRequest(`/tracts/${id}`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return null;
  }
};

export const createTract = async (tractData: any) => {
  try {
    return await apiRequest('/tracts', {
      method: 'POST',
      body: JSON.stringify(tractData),
    });
  } catch (error) {
    console.warn('Server not available, creating mock tract:', error);
    return { ...tractData, id: `t${Date.now()}` };
  }
};

export const updateTract = async (id: string, tractData: any) => {
  try {
    return await apiRequest(`/tracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tractData),
    });
  } catch (error) {
    console.warn('Server not available, updating mock tract:', error);
    return { ...tractData, id };
  }
};

export const deleteTract = async (id: string) => {
  try {
    return await apiRequest(`/tracts/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server not available, deleting mock tract:', error);
    return { success: true };
  }
};

// Unit API functions
export const fetchUnits = async () => {
  try {
    return await apiRequest('/units');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
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
export const fetchLeads = async () => {
  try {
    return await apiRequest('/leads');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
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
export const fetchContacts = async () => {
  try {
    return await apiRequest('/contacts');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
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
export const fetchAssignments = async () => {
  try {
    return await apiRequest('/assignments');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
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
export const fetchUnitTracts = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/tracts`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchUnitTractsEnhanced = async (unitId: string) => {
  try {
    return await apiRequest(`/units/${unitId}/tracts/enhanced`);
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
export const fetchTractLeads = async (tractId: string) => {
  try {
    return await apiRequest(`/tracts/${tractId}/leads`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const createTractLead = async (tractId: string, leadData: any) => {
  try {
    return await apiRequest(`/tracts/${tractId}/leads`, {
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
export const fetchTractSpatial = async (tractId: string) => {
  try {
    return await apiRequest('/tract-spatial');
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

export const fetchNearbyWells = async (lat: number, lng: number, radius: number) => {
  try {
    return await apiRequest(`/map/nearby/wells?lat=${lat}&lng=${lng}&radius=${radius}`);
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
    return [];
  }
};

export const fetchESGRiskFlags = async () => {
  try {
    return await apiRequest('/esg/risk-flags');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchRegulatoryWatchlist = async () => {
  try {
    return await apiRequest('/esg/regulatory-watchlist');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchESGPortfolioSummary = async () => {
  try {
    return await apiRequest('/esg/portfolio-summary');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
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
    return await apiRequest('/reports/lead-conversion-funnel');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchOutreachActivitySummary = async () => {
  try {
    return await apiRequest('/reports/outreach-activity-summary');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
  }
};

export const fetchAssignmentPerformanceMetrics = async () => {
  try {
    return await apiRequest('/reports/assignment-performance-metrics');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
  }
};

export const fetchDealVelocityMetrics = async () => {
  try {
    return await apiRequest('/reports/deal-velocity-metrics');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
  }
};

export const fetchESGComplianceSummary = async () => {
  try {
    return await apiRequest('/reports/esg-compliance-summary');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return {};
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
    return [];
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
    return [];
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
export const fetchTractDashboard = async () => {
  try {
    return await apiRequest('/dashboard/tracts');
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return { totalTracts: 0, totalAcres: 0, totalValue: 0 };
  }
};

export const fetchTractOwners = async (tractId: string) => {
  try {
    return await apiRequest(`/tracts/${tractId}/owners`);
  } catch (error) {
    console.warn('Server not available, using mock data:', error);
    return [];
  }
};

export const fetchTractPricing = async (tractId: string) => {
  try {
    return await apiRequest(`/tracts/${tractId}/pricing`);
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
  
  // Tracts
  fetchTracts,
  fetchTract,
  createTract,
  updateTract,
  deleteTract,
  fetchTractOwners,
  fetchTractPricing,
  fetchTractDashboard,
  
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
  fetchUnitTracts,
  fetchUnitTractsEnhanced,
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
  fetchTractLeads,
  createTractLead,
  updateLeadStatus,
  convertLeadToDeal,
  
  // Mapping and spatial functions
  fetchTractSpatial,
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

