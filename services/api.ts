// API service file - now uses HTTP client instead of direct database calls
const apiDelay = 500;

// Import API client
import * as apiClient from './apiClient';

// Re-export all API client functions
export const fetchUsers = apiClient.fetchUsers;
export const fetchUser = apiClient.fetchUser;
export const createUser = apiClient.createUser;
export const updateUser = apiClient.updateUser;
export const deleteUser = apiClient.deleteUser;

export const fetchSections = apiClient.fetchSections;
export const fetchSection = apiClient.fetchSection;
export const createSection = apiClient.createSection;
export const updateSection = apiClient.updateSection;
export const deleteSection = apiClient.deleteSection;
export const fetchSectionOwners = apiClient.fetchSectionOwners;
export const fetchSectionPricing = apiClient.fetchSectionPricing;
export const fetchSectionDashboard = apiClient.fetchSectionDashboard;
export const fetchSectionAcreageSchedule = apiClient.fetchSectionAcreageSchedule;
export const updateAcreageScheduleRecord = apiClient.updateAcreageScheduleRecord;
export const fetchUnitAcreageSchedule = apiClient.fetchUnitAcreageSchedule;
export const fetchUnitTracker = apiClient.fetchUnitTracker;
export const updateUnitTrackerRecord = apiClient.updateUnitTrackerRecord;

export const fetchUnits = apiClient.fetchUnits;
export const fetchUnit = apiClient.fetchUnit;
export const createUnit = apiClient.createUnit;
export const updateUnit = apiClient.updateUnit;
export const deleteUnit = apiClient.deleteUnit;

export const fetchLeads = apiClient.fetchLeads;
export const fetchLead = apiClient.fetchLead;
export const createLead = apiClient.createLead;
export const updateLead = apiClient.updateLead;
export const deleteLead = apiClient.deleteLead;
export const fetchLeadCallLogs = apiClient.fetchLeadCallLogs;
export const createLeadCallLog = apiClient.createLeadCallLog;
export const fetchLeadNotes = apiClient.fetchLeadNotes;
export const fetchLeadSections = apiClient.fetchLeadSections;
export const createLeadNote = apiClient.createLeadNote;

export const fetchContacts = apiClient.fetchContacts;
export const fetchContact = apiClient.fetchContact;

export const fetchAssignments = apiClient.fetchAssignments;
export const fetchAssignment = apiClient.fetchAssignment;
export const createAssignment = apiClient.createAssignment;
export const updateAssignment = apiClient.updateAssignment;
export const deleteAssignment = apiClient.deleteAssignment;
export const createBulkAssignments = apiClient.createBulkAssignments;
export const fetchAssignmentHistory = apiClient.fetchAssignmentHistory;

// Unit-specific functions
export const fetchUnitSections = apiClient.fetchUnitSections;
export const fetchUnitSectionsEnhanced = apiClient.fetchUnitSectionsEnhanced;
export const fetchUnitContacts = apiClient.fetchUnitContacts;
export const fetchUnitContactsAggregated = apiClient.fetchUnitContactsAggregated;
export const fetchUnitNotes = apiClient.fetchUnitNotes;
export const fetchUnitAssignments = apiClient.fetchUnitAssignments;
export const fetchUnitNames = apiClient.fetchUnitNames;
export const assignUnit = apiClient.assignUnit;
export const unassignUnit = apiClient.unassignUnit;
export const updateUnitLock = apiClient.updateUnitLock;
export const createUnitNote = apiClient.createUnitNote;

// Contact-specific functions
export const fetchContactTractOwnership = apiClient.fetchContactTractOwnership;
export const fetchContactUnits = apiClient.fetchContactUnits;
export const fetchContactLeads = apiClient.fetchContactLeads;
export const fetchSectionContacts = apiClient.fetchSectionContacts;
export const fetchContactCallLogs = apiClient.fetchContactCallLogs;
export const fetchContactDocuments = apiClient.fetchContactDocuments;
export const fetchDistressSignals = apiClient.fetchDistressSignals;

// Authentication functions
export const login = apiClient.login;
export const logout = apiClient.logout;

// Lead-related functions
export const fetchSectionLeads = apiClient.fetchSectionLeads;
export const createSectionLead = apiClient.createSectionLead;
export const createTractLead = apiClient.createTractLead;
export const updateLeadStatus = apiClient.updateLeadStatus;
export const convertLeadToDeal = apiClient.convertLeadToDeal;

// Mapping and spatial functions
export const fetchSectionSpatial = apiClient.fetchSectionSpatial;
export const fetchMapLayerPreferences = apiClient.fetchMapLayerPreferences;
export const fetchNearbyWells = apiClient.fetchNearbyWells;
export const fetchNearbyPermits = apiClient.fetchNearbyPermits;
export const fetchNearbyRigs = apiClient.fetchNearbyRigs;
export const fetchNearbyUnits = apiClient.fetchNearbyUnits;
export const updateMapLayerPreference = apiClient.updateMapLayerPreference;
export const fetchProducingWells = apiClient.fetchProducingWells;
export const fetchPermits = apiClient.fetchPermits;
export const fetchRigs = apiClient.fetchRigs;

// ESG functions
export const fetchESGProfiles = apiClient.fetchESGProfiles;
export const fetchESGRiskFlags = apiClient.fetchESGRiskFlags;
export const fetchRegulatoryWatchlist = apiClient.fetchRegulatoryWatchlist;
export const fetchESGPortfolioSummary = apiClient.fetchESGPortfolioSummary;

// Map dashboard functions
export const fetchMapAssets = apiClient.fetchMapAssets;
export const fetchMapOverlays = apiClient.fetchMapOverlays;
export const fetchMapLayerConfigs = apiClient.fetchMapLayerConfigs;
export const getMapFilterOptions = apiClient.getMapFilterOptions;
export const logMapInteraction = apiClient.logMapInteraction;
export const exportMapData = apiClient.exportMapData;

// Task and calendar functions
export const fetchTasks = apiClient.fetchTasks;
export const fetchTaskStatistics = apiClient.fetchTaskStatistics;
export const fetchCalendarEvents = apiClient.fetchCalendarEvents;
export const createTask = apiClient.createTask;
export const updateTask = apiClient.updateTask;

// Document generation functions
export const fetchDocumentTemplates = apiClient.fetchDocumentTemplates;
export const fetchGeneratedDocuments = apiClient.fetchGeneratedDocuments;
export const createDocumentTemplate = apiClient.createDocumentTemplate;
export const updateDocumentTemplate = apiClient.updateDocumentTemplate;
export const deleteDocumentTemplate = apiClient.deleteDocumentTemplate;
export const generateDocument = apiClient.generateDocument;

// Reporting functions
export const fetchLeadConversionFunnel = apiClient.fetchLeadConversionFunnel;
export const fetchOutreachActivitySummary = apiClient.fetchOutreachActivitySummary;
export const fetchAssignmentPerformanceMetrics = apiClient.fetchAssignmentPerformanceMetrics;
export const fetchDealVelocityMetrics = apiClient.fetchDealVelocityMetrics;
export const fetchESGComplianceSummary = apiClient.fetchESGComplianceSummary;
export const getFilterOptions = apiClient.getFilterOptions;
export const exportDashboardData = apiClient.exportDashboardData;

// Role and privilege functions
export const fetchRoles = apiClient.fetchRoles;
export const deleteRole = apiClient.deleteRole;
export const updateRole = apiClient.updateRole;
export const createRole = apiClient.createRole;
export const fetchPrivileges = apiClient.fetchPrivileges;
export const assignRolesToPrivilege = apiClient.assignRolesToPrivilege;

// Import functions
export const uploadFile = apiClient.uploadFile;
export const fetchStagingTables = apiClient.fetchStagingTables;
export const fetchStagingTableData = apiClient.fetchStagingTableData;
export const approveImport = apiClient.approveImport;
export const deleteStagingTable = apiClient.deleteStagingTable;
export const updateStagingRecord = apiClient.updateStagingRecord;
export const deleteStagingRecord = apiClient.deleteStagingRecord;

// Mock data for import sessions (kept for compatibility)
let mockImportSessions: any[] = [];
let mockStagingTables: any[] = [];
let mockProductionTables: any[] = [];

// Import session functions (mock implementations)
export const fetchImportSessions = async () => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockImportSessions;
};

export const createImportSession = async (sessionData: any) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newSession = {
    id: `session_${Date.now()}`,
    ...sessionData,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  mockImportSessions.push(newSession);
  return newSession;
};

export const updateImportSession = async (id: string, sessionData: any) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const sessionIndex = mockImportSessions.findIndex(s => s.id === id);
  if (sessionIndex !== -1) {
    mockImportSessions[sessionIndex] = { ...mockImportSessions[sessionIndex], ...sessionData };
    return mockImportSessions[sessionIndex];
  }
  throw new Error('Import session not found');
};

export const deleteImportSession = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const sessionIndex = mockImportSessions.findIndex(s => s.id === id);
  if (sessionIndex !== -1) {
    mockImportSessions.splice(sessionIndex, 1);
    return { success: true };
  }
  throw new Error('Import session not found');
};

// Staging table functions (mock implementations)

export const createStagingTable = async (tableData: any) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newTable = {
    id: `staging_${Date.now()}`,
    ...tableData,
    createdAt: new Date().toISOString()
  };
  mockStagingTables.push(newTable);
  return newTable;
};

// Production table functions (mock implementations)
export const fetchProductionTables = async () => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockProductionTables;
};

export const createProductionTable = async (tableData: any) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  const newTable = {
    id: `production_${Date.now()}`,
    ...tableData,
    createdAt: new Date().toISOString()
  };
  mockProductionTables.push(newTable);
  return newTable;
};

// Data import functions (mock implementations)
export const importData = async (sessionId: string, data: any[]) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  console.log(`Importing ${data.length} records for session ${sessionId}`);
  return {
    success: true,
    importedCount: data.length,
    errors: []
  };
};

export const validateData = async (data: any[]) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return {
    valid: true,
    errors: [],
    warnings: []
  };
};

export const processImport = async (sessionId: string) => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return {
    success: true,
    processedCount: 100,
    errors: []
  };
};

// Export default object for compatibility
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
  fetchUnitNames,
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
  createTractLead,
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
  
  // Import sessions
  fetchImportSessions,
  createImportSession,
  updateImportSession,
  deleteImportSession,
  
  // Staging tables
  createStagingTable,
  
  // Production tables
  fetchProductionTables,
  createProductionTable,
  
  // Data import
  importData,
  validateData,
  processImport,
  uploadFile,
  fetchStagingTableData,
  approveImport,
  deleteStagingTable,
  updateStagingRecord,
  deleteStagingRecord,
};
