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
export const fetchTract = apiClient.fetchTract;
export const createTract = apiClient.createTract;
export const updateTract = apiClient.updateTract;
export const deleteTract = apiClient.deleteTract;
export const fetchTractOwners = apiClient.fetchTractOwners;
export const fetchTractPricing = apiClient.fetchTractPricing;
export const fetchTractDashboard = apiClient.fetchTractDashboard;

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
export const fetchStagingTables = async () => {
  await new Promise(resolve => setTimeout(resolve, apiDelay));
  return mockStagingTables;
};

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
  
  // Import sessions
  fetchImportSessions,
  createImportSession,
  updateImportSession,
  deleteImportSession,
  
  // Staging tables
  fetchStagingTables,
  createStagingTable,
  
  // Production tables
  fetchProductionTables,
  createProductionTable,
  
  // Data import
  importData,
  validateData,
  processImport,
};

