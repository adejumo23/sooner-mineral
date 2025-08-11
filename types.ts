
export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Privilege {
  id: string;
  name: string;
  description: string;
  roles: Role[];
}

export type TitleStatus = 'Verified' | 'In Progress' | 'Failed' | 'Verified with Curative Requirements' | 'Unmapped';

export interface Tract {
  id: string;
  state: string;
  county: string;
  tractName: string;
  legalDescription: string;
  str?: string;
  abstractNumber?: string;
  anum?: string;
  grossAcres: number;
  royalty?: number;
  netMineralAcres?: number;
  nra?: number; // Net Royalty Acres. Auto-calculated: NMA * Royalty / 0.125
  ownershipPercentage?: number;
  titleStatus: TitleStatus;
  assignedBuyerId?: string; // Foreign Key to User.id
  assignedBuyer?: User; // Populated from assignedBuyerId
  nraCapUsd?: number;
  sourceChannel?: string;
  routingNotes?: string;
  heldByFund: boolean;
  isLocked: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactType: 'Landowner' | 'Broker' | 'Attorney' | 'Other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactTractOwnership {
  id: string;
  contactId: string;
  tractId: string;
  ownershipPercentage: number; // e.g., 0.25 for 25%
  royaltyPercentage: number; // e.g., 0.25 for 25%
  sourceOfTitle?: string;
  contact?: Contact;
  tract?: Tract;
  nma?: number; // Net Mineral Acres = Gross Acres × Ownership %
  nra?: number; // NRA (1/8 normalized) = NMA × (Royalty % ÷ 0.125)
}

export interface ContactNote {
  id: string;
  contactId: string;
  tractId: string;
  noteText: string;
  noteType: 'Outreach' | 'Follow-up' | 'Meeting' | 'Documentation' | 'Other';
  createdBy: string;
  createdAt: string;
  createdByUser?: User;
}

export interface Lead {
  id: string;
  contactId: string;
  tractId: string;
  status: 'Open' | 'In Progress' | 'Qualified' | 'Disqualified' | 'Closed';
  leadType: 'Acquisition' | 'Lease' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  tract?: Tract;
  assignedToUser?: User;
  createdByUser?: User;
}

export interface TractLead {
  id: string;
  tractId: string;
  buyerId: string;
  status: 'In Progress' | 'Closed' | 'Converted';
  leadSource: 'Inbound' | 'Assignment' | 'Referral' | 'Cold Outreach' | 'Other';
  createdAt: string;
  updatedAt: string;
  buyer?: User;
  tract?: Tract;
  lastActivity?: string;
  noteCount?: number;
}

export interface LeadNote {
  id: string;
  leadId: string;
  noteText: string;
  outreachMethod: 'Phone Call' | 'Email' | 'Text' | 'Meeting' | 'Letter' | 'Other';
  createdBy: string;
  createdAt: string;
  createdByUser?: User;
}

export interface TractSpatial {
  id: string;
  tractId: string;
  latitude?: number;
  longitude?: number;
  geometryType: 'Point' | 'Polygon' | 'STR';
  geometryData?: any; // GeoJSON or STR data
  createdAt: string;
  updatedAt: string;
  tract?: Tract;
}

export interface ProducingWell {
  id: string;
  apiNumber: string;
  wellName: string;
  operator: string;
  latitude: number;
  longitude: number;
  status: 'Producing' | 'Shut-in' | 'Abandoned' | 'Drilling';
  spudDate?: string;
  completionDate?: string;
  totalDepth?: number;
  productionData?: any; // Monthly production data
  createdAt: string;
  updatedAt: string;
}

export interface Permit {
  id: string;
  permitNumber: string;
  operator: string;
  latitude: number;
  longitude: number;
  permitType: 'Drilling' | 'Recompletion' | 'Workover' | 'Abandonment';
  permitDate: string;
  spudDate?: string;
  totalDepth?: number;
  targetFormation?: string;
  status: 'Pending' | 'Approved' | 'Drilling' | 'Completed' | 'Abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface Rig {
  id: string;
  rigName: string;
  operator: string;
  latitude: number;
  longitude: number;
  rigType: 'Land' | 'Offshore' | 'Platform';
  status: 'Active' | 'Moving' | 'Stacked' | 'Retired';
  spudDate?: string;
  targetCompletion?: string;
  totalDepth?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  unitName: string;
  operator: string;
  apiNumbers: string[]; // Array of API numbers (1 or more if multiple wells per unit)
  targetFormations: string[]; // Array of target formations/zones
  status: 'Permitted' | 'Producing' | 'Held by Production' | 'Plugged';
  estimatedGrossAcres: number;
  estimatedNetAcres?: number; // Linked from assigned tracts
  county: string;
  state: string;
  linkedTractIds: string[]; // Array of tract IDs linked to this unit
  linkedContactIds: string[]; // Array of contact IDs (landowners in unit footprint)
  assignedBuyerId?: string; // User ID reference
  assignedBuyer?: User; // Populated from assignedBuyerId
  heldByFund: boolean;
  exitStrategy: 'Hold' | 'Flip' | 'LP Buyout';
  isLocked: boolean; // Prevents outreach while under diligence
  notes?: string; // Internal notes only
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  createdByUser?: User; // Populated from createdBy
  updatedByUser?: User; // Populated from updatedBy
}

export interface UnitAssignment {
  id: string;
  unitId: string;
  buyerId: string;
  buyer?: User; // Populated from buyerId
  assignedBy: string;
  assignedByUser?: User; // Populated from assignedBy
  assignedAt: string;
  removedBy?: string;
  removedByUser?: User; // Populated from removedBy
  removedAt?: string;
  notes?: string;
}

export interface UnitTract {
  id: string;
  unitId: string;
  tractId: string;
  tract?: Tract; // Populated from tractId
  allocationPercentage?: number; // Allocation % for OK & take points for TX
  createdAt: string;
}

export interface UnitContact {
  id: string;
  unitId: string;
  contactId: string;
  contact?: Contact; // Populated from contactId
  createdAt: string;
}

export interface UnitNote {
  id: string;
  unitId: string;
  noteText: string;
  noteType: 'Internal' | 'Assignment' | 'Status Change' | 'Lock/Unlock' | 'Other';
  createdBy: string;
  createdByUser?: User; // Populated from createdBy
  createdAt: string;
}

export interface UnitFilters {
  operator?: string;
  formation?: string;
  county?: string;
  status?: Unit['status'];
  assignedBuyer?: string;
  heldByFund?: boolean;
  isLocked?: boolean;
  search?: string; // Search by Unit Name or API
}

export interface MapLayerPreference {
  id: string;
  userId: string;
  layerName: string;
  isVisible: boolean;
  opacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapLayer {
  id: string;
  name: string;
  displayName: string;
  isVisible: boolean;
  opacity: number;
  color: string;
  icon?: string;
}

// Assignment & Buyer Routing Module Types
export interface Assignment {
  id: string;
  assetType: 'Tract' | 'Unit';
  assetId: string;
  assignedBuyerId: string;
  priceCapUsd: number;
  priceCapType: 'Per NRA' | 'Per Acre';
  sourceChannel: 'Broker' | 'Inbound' | 'Outbound';
  priorityScore: number;
  status: 'Active' | 'Completed' | 'Cancelled' | 'Expired';
  notes?: string;
  assignedDate: string;
  assignedById: string;
  updatedAt: string;
  
  // Populated fields
  assignedBuyer?: User;
  assignedBy?: User;
  asset?: Tract | Unit;
}

export interface AssignmentHistory {
  id: string;
  assignmentId: string;
  actionType: 'Created' | 'Updated' | 'Reassigned' | 'Cancelled' | 'Completed';
  actionDetails?: string;
  actionTimestamp: string;
  actionById: string;
  
  // Populated fields
  actionBy?: User;
}

export interface AssignmentFilters {
  assetType?: 'Tract' | 'Unit';
  assetId?: string;
  assignedBuyerId?: string;
  sourceChannel?: 'Broker' | 'Inbound' | 'Outbound';
  status?: 'Active' | 'Completed' | 'Cancelled' | 'Expired';
  priorityMin?: number;
  priorityMax?: number;
  assignedDateFrom?: string;
  assignedDateTo?: string;
  search?: string;
}

export interface CreateAssignmentData {
  assetType: 'Tract' | 'Unit';
  assetId: string;
  assignedBuyerId: string;
  priceCapUsd: number;
  priceCapType: 'Per NRA' | 'Per Acre';
  sourceChannel: 'Broker' | 'Inbound' | 'Outbound';
  priorityScore: number;
  notes?: string;
}

export interface UpdateAssignmentData {
  priceCapUsd?: number;
  priceCapType?: 'Per NRA' | 'Per Acre';
  sourceChannel?: 'Broker' | 'Inbound' | 'Outbound';
  priorityScore?: number;
  status?: 'Active' | 'Completed' | 'Cancelled' | 'Expired';
  notes?: string;
}

// Lead Management Module Types
export interface Lead {
  id: string;
  linkedContactId: string;
  linkedTractIds: string[]; // Array of tract IDs
  linkedUnitIds: string[]; // Array of unit IDs
  buyerId: string;
  sourceChannel: 'Broker' | 'Inbound' | 'Outbound';
  status: 'Uncontacted' | 'Spoke' | 'Interested' | 'LOI Sent' | 'Dead';
  priorityScore: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  outreachCount: number;
  documentLinks?: string[]; // Array of document URLs
  assignmentId?: string; // Reference to the assignment that created this lead
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  linkedContact?: Contact;
  linkedTracts?: Tract[];
  linkedUnits?: Unit[];
  buyer?: User;
  assignment?: Assignment;
}

export interface LeadCallLog {
  id: string;
  leadId: string;
  callDate: string;
  outcome: 'No Answer' | 'Left Message' | 'Spoke' | 'Not Interested' | 'Interested' | 'Call Back Later' | 'Wrong Number';
  notes?: string;
  nextSteps?: string;
  loggedById: string;
  
  // Populated fields
  loggedBy?: User;
}

export interface LeadNote {
  id: string;
  leadId: string;
  noteText: string;
  noteType: 'General' | 'Follow Up' | 'Important' | 'Internal';
  createdById: string;
  createdAt: string;
  
  // Populated fields
  createdBy?: User;
}

export interface LeadFilters {
  status?: Lead['status'];
  county?: string;
  tractId?: string;
  unitId?: string;
  buyerId?: string;
  sourceChannel?: 'Broker' | 'Inbound' | 'Outbound';
  priorityMin?: number;
  priorityMax?: number;
  lastContactFrom?: string;
  lastContactTo?: string;
  nextFollowUpFrom?: string;
  nextFollowUpTo?: string;
  search?: string;
}

export interface CreateLeadData {
  linkedContactId: string;
  linkedTractIds?: string[];
  linkedUnitIds?: string[];
  buyerId: string;
  sourceChannel: 'Broker' | 'Inbound' | 'Outbound';
  priorityScore: number;
  notes?: string;
  assignmentId?: string;
}

export interface UpdateLeadData {
  status?: Lead['status'];
  priorityScore?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  documentLinks?: string[];
}

export interface CreateCallLogData {
  leadId: string;
  outcome: LeadCallLog['outcome'];
  notes?: string;
  nextSteps?: string;
}

export interface CreateLeadNoteData {
  leadId: string;
  noteText: string;
  noteType?: LeadNote['noteType'];
}