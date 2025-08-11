
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
  entityType: 'Individual' | 'Entity';
  legalName: string;
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