
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
  
  // ESG Tracking Fields
  esgProfileId?: string;
  esgRiskLevel?: ESGRiskLevel;
  carbonIntensity?: number; // tons CO2e/BOE
  operatorComplianceScore?: ESGComplianceScore;
  titleVerificationStatus?: 'Clean' | 'Clouded' | 'Pending' | 'Unknown';
  hasRiskFlags?: boolean;
  lastESGUpdate?: Date;
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

// Enhanced Contact interface for the Contact Management module
export interface ContactEnhanced extends Contact {
  // Core contact information
  role: 'Seller' | 'Landowner' | 'Heir' | 'Attorney-in-Fact' | 'Unknown';
  ownershipType: 'Mineral' | 'Royalty' | 'NPRI' | 'ORRI' | 'Working Interest';
  source: string; // Where/how the contact was first discovered
  origination: string; // Additional source details
  
  // Calculated fields
  totalNMA: number; // Total net mineral acres across all tracts
  totalNRA: number; // Total NRA (1/8 normalized) across all tracts
  
  // Distress and intent signals
  distressSignals: DistressSignal[];
  
  // Linked data counts
  linkedTractCount: number;
  linkedUnitCount: number;
  activeLeadCount: number;

  // Communication preferences
  preferredContactMethod: 'Call' | 'Email' | 'Text' | 'Do Not Contact';
  preferredContactTime?: string; // Time of day preference
  doNotContactUntil?: string; // Date until which contact is restricted
  optOutDate?: string; // When they opted out of communications
  
  // Communication history
  lastContactedDate?: string;
  lastContactMethod?: CommunicationMethod;
  lastContactOutcome?: CommunicationOutcome;
  totalCommunications: number;
}

// Distress and Intent Signal interface
export interface DistressSignal {
  id: string;
  contactId: string;
  signalType: 'Death' | 'Bankruptcy' | 'Tax Lien' | 'Judgment' | 'Criminal' | 'Indebtedness' | 'Divorce' | 'Foreclosure' | 'Other';
  signalSource: string; // County, court, enrichment service, etc.
  dateFlagged: string;
  matchConfidence: number; // Percentage likelihood the record matches this contact
  matchingAlgorithm: string; // Description of how the match was made
  signalStatus: 'Open' | 'Cleared' | 'Under Review' | 'Verified';
  internalNotes?: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  updatedAt: string;
}

// Contact Tract Ownership with enhanced fields
export interface ContactTractOwnershipEnhanced extends ContactTractOwnership {
  // Core ownership information
  ownershipPercentage: number; // e.g., 0.25 for 25%
  royaltyPercentage: number; // e.g., 0.25 for 25%
  sourceOfTitle?: string;
  
  // Calculated fields
  nma: number; // Net Mineral Acres = Gross Acres × Ownership %
  nra: number; // NRA (1/8 normalized) = NMA × (Royalty % ÷ 0.125)
  
  // Tract information
  tract: Tract;
  
  // Unit information (if tract is part of a unit)
  unitId?: string;
  unitName?: string;
  unitOperator?: string;
  unitFormation?: string;
  
  // Lead information
  hasActiveLead: boolean;
  leadStatus?: string;
  assignedBuyer?: User;
  
  // Activity tracking
  lastActivity?: string;
}

// Contact Unit Summary interface
export interface ContactUnitSummary {
  id: string;
  unitId: string;
  unitName: string;
  operator: string;
  county: string;
  state: string;
  formation: string;
  totalNMA: number; // Sum of NMA across all tracts in this unit
  totalNRA: number; // Sum of NRA across all tracts in this unit
  tractCount: number; // Number of tracts owned in this unit
  tracts: ContactTractOwnershipEnhanced[]; // Detailed tract breakdown
  hasActiveLead: boolean;
  leadStatus?: string;
  assignedBuyer?: User;
}

// Contact Call Log interface
export interface ContactCallLog {
  id: string;
  contactId: string;
  
  // Core data fields
  callDate: string;
  callTime: string; // Time of day the call was made
  caller: string; // Who made/received the call
  callType: 'Outbound' | 'Inbound' | 'Follow-up' | 'Meeting' | 'Other';
  callStatus: 'Completed' | 'No Answer' | 'Left Message' | 'Busy' | 'Disconnected' | 'Scheduled';
  notes: string;
  followUpFlag: boolean; // Whether follow-up is required
  followUpDate?: string; // When to follow up
  
  // Associated data
  associatedLeadId?: string; // Link to specific lead
  associatedLead?: LeadEnhanced; // Populated from associatedLeadId
  tractIds?: string[]; // Associated tracts discussed
  unitIds?: string[]; // Associated units discussed
  
  // Call details
  duration: number; // Call duration in seconds
  outcome: 'No Answer' | 'Left Message' | 'Spoke' | 'Scheduled Follow-up' | 'Not Interested' | 'Interested' | 'Qualified' | 'Disqualified';
  nextAction?: string;
  nextActionDate?: string;
  
  // Metadata
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
}

// Contact Document interface
export interface ContactDocument {
  id: string;
  contactId: string;
  
  // Core data fields
  documentName: string; // User-assigned or auto-generated name
  fileType: string; // PDF, DOCX, CSV, PNG, etc.
  category: 'Lease' | 'Conveyance' | 'Title Opinion' | 'Deed' | 'Contract' | 'Correspondence' | 'Legal' | 'Financial' | 'Research' | 'Other';
  redFlagStatus: boolean; // Toggle for legal/internal review
  versionHistory: string[]; // Array of version IDs
  dateUploaded: string; // Timestamp when document was added
  uploadedBy: string; // Username or initials of uploading team member
  notes?: string; // Optional description or summary relevance
  linkedTracts?: string[]; // Associated tract IDs
  
  // File metadata
  fileSize: number;
  fileUrl: string;
  originalFileName: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Contact Management Filters
export interface ContactFilters {
  search?: string;
  role?: ContactEnhanced['role'];
  ownershipType?: ContactEnhanced['ownershipType'];
  contactType?: Contact['contactType'];
  state?: string;
  county?: string;
  hasDistressSignals?: boolean;
  distressSignalType?: DistressSignal['signalType'];
  riskLevel?: DistressSignal['riskLevel'];
  hasActiveLeads?: boolean;
  lastContactedDate?: string;
  preferredContactMethod?: ContactEnhanced['preferredContactMethod'];
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

  // Communication tracking
  lastOutreachDate?: string;
  lastOutreachMethod?: CommunicationMethod;
  lastOutreachOutcome?: CommunicationOutcome;
  totalOutreachAttempts: number;
  nextFollowUpDate?: string;
  followUpNotes?: string;
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
  
  // ESG Tracking Fields
  esgProfileId?: string;
  esgRiskLevel?: ESGRiskLevel;
  carbonIntensity?: number; // tons CO2e/BOE
  operatorComplianceScore?: ESGComplianceScore;
  regulatoryCompliance?: string;
  hasRiskFlags?: boolean;
  lastESGUpdate?: Date;
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
  // New fields per specifications
  assignmentStatus: 'In Progress' | 'Under Review' | 'Closed' | 'Rejected';
  valuationCapUsd: number; // $/NRA target price per normalized royalty acre
  autoGenerateLeads: boolean; // Option to auto-create leads for contacts tied to linked tracts
}

// New interface for assignment comment thread
export interface AssignmentComment {
  id: string;
  assignmentId: string;
  commentText: string;
  authorId: string;
  author?: User; // Populated from authorId
  timestamp: string;
}

export interface UnitTract {
  id: string;
  unitId: string;
  tractId: string;
  tract?: Tract; // Populated from tractId
  allocationPercentage?: number; // Allocation % for OK & take points for TX
  createdAt: string;
}

// New interface for enhanced unit tract data with comprehensive information
export interface UnitTractEnhanced {
  id: string;
  unitId: string;
  tractId: string;
  tract?: Tract; // Populated from tractId
  
  // Core tract information
  tractName: string;
  str?: string; // Spatial/geographic anchor in PLSS format
  grossAcres: number;
  netMineralAcres?: number;
  royalty?: number;
  nra?: number; // NRA (1/8 Normalized)
  
  // Title and assignment information
  titleStatus: TitleStatus;
  assignedBuyerId?: string;
  assignedBuyer?: User;
  
  // Activity tracking
  lastActivity?: string; // Date of most recent activity (lead, note, etc.)
  
  // Quick action links
  hasTitleChain: boolean; // Whether title chain data exists
  hasContacts: boolean; // Whether contact data exists for this tract
  
  // Unit-specific allocation
  allocationPercentage?: number;
  createdAt: string;
}

export interface UnitContact {
  id: string;
  unitId: string;
  contactId: string;
  contact?: Contact; // Populated from contactId
  createdAt: string;
}

// New interface for aggregated unit contact data with economic interest and outreach status
export interface UnitContactAggregated {
  id: string;
  unitId: string;
  contactId: string;
  contact?: Contact; // Populated from contactId
  
  // Economic interest fields (aggregated across all linked tracts)
  ownershipPercentageWeighted: number; // Pro rata share across all linked tracts
  royaltyPercentageWeighted: number; // Weighted average royalty across linked tracts
  totalNMA: number; // Sum of net mineral acres across all tracts
  totalNRA: number; // NMA × (Royalty % ÷ 0.125) - 1/8 normalized
  
  // Tract ownership details
  tractsOwned: string[]; // List of tract IDs the contact appears in within the unit
  
  // Outreach and lead information
  lastOutreach?: string; // Date of most recent buyer contact note or email
  leadStatus: 'Open' | 'Closed' | 'Unassigned'; // Derived from lead status
  hasActiveLeads: boolean; // Whether contact has active leads tied to unit tracts
  
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
  
  // ESG Tracking Fields
  esgRiskLevel?: ESGRiskLevel;
  requiresESGReview?: boolean;
  esgReviewNotes?: string;
  esgApprovedBy?: string;
  esgApprovedAt?: Date;
  
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
  
  // ESG Filter Fields
  esgRiskLevel?: ESGRiskLevel[];
  maxCarbonIntensity?: number;
  minOperatorComplianceScore?: ESGComplianceScore;
  titleVerificationStatus?: string[];
  hasRiskFlags?: boolean;
  requiresESGReview?: boolean;
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

// Lead Management Module Types - Enhanced Lead interface
export interface LeadEnhanced {
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
  
  // ESG Tracking Fields
  esgRiskLevel?: ESGRiskLevel;
  requiresESGReview?: boolean;
  esgReviewNotes?: string;
  
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
  createdBy: string;
  createdAt: string;
  
  // Populated fields
  createdByUser?: User;
}

export interface LeadFilters {
  status?: LeadEnhanced['status'];
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
  status?: LeadEnhanced['status'];
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

// Deal interface for communication integration
export interface Deal {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Active' | 'Pending' | 'Closed' | 'Cancelled';
  contactId: string;
  contact?: Contact;
  leadId?: string;
  lead?: Lead;
  value?: number;
  startDate?: string;
  endDate?: string;
  
  // ESG Tracking Fields
  esgRiskLevel?: ESGRiskLevel;
  requiresESGReview?: boolean;
  esgReviewNotes?: string;
  esgApprovedBy?: string;
  esgApprovedAt?: Date;
  
  createdAt: string;
  updatedAt: string;
}

// Communication Integration Module Types
export type CommunicationMethod = 'Email' | 'Call' | 'SMS' | 'Mail';

export type CommunicationOutcome = 
  | 'No Answer' 
  | 'Left Voicemail' 
  | 'Sent' 
  | 'Bounced' 
  | 'Replied' 
  | 'Delivered' 
  | 'Read' 
  | 'Failed' 
  | 'Opted Out';

export interface Communication {
  id: string;
  userId: string; // Sender/caller
  user?: User; // Populated from userId
  contactId: string; // Recipient
  contact?: Contact; // Populated from contactId
  leadId?: string; // If applicable
  lead?: Lead; // Populated from leadId
  method: CommunicationMethod;
  timestamp: string;
  outcome: CommunicationOutcome;
  subject?: string; // For emails
  messageSnippet?: string; // For calls, SMS, mail
  attachments?: string[]; // File paths or URLs
  relatedDealId?: string; // If in active negotiations
  deal?: Deal; // Populated from relatedDealId
  campaignId?: string; // If part of a campaign
  campaign?: CommunicationCampaign; // Populated from campaignId
  sequenceStep?: number; // For multi-step campaigns
  optOutDate?: string; // When contact opted out
  failureReason?: string; // For failed communications
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationCampaign {
  id: string;
  name: string;
  description?: string;
  type: 'Email Sequence' | 'Call Campaign' | 'SMS Campaign' | 'Direct Mail' | 'Multi-Channel';
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  createdBy: string; // User ID
  createdByUser?: User; // Populated from createdBy
  targetAudience: 'All Contacts' | 'Specific Leads' | 'Custom List' | 'Geographic';
  targetCriteria?: Record<string, any>; // JSON criteria for targeting
  startDate?: string;
  endDate?: string;
  totalRecipients: number;
  successfulDeliveries: number;
  responses: number;
  optOuts: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSequence {
  id: string;
  campaignId: string;
  campaign?: CommunicationCampaign;
  name: string;
  steps: EmailSequenceStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSequenceStep {
  id: string;
  sequenceId: string;
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number; // Days after previous step
  delayHours?: number; // Additional hours
  conditions?: Record<string, any>; // JSON conditions for sending
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMailLog {
  id: string;
  campaignId?: string;
  campaign?: CommunicationCampaign;
  contactId: string;
  contact?: Contact;
  leadId?: string;
  lead?: Lead;
  mailType: 'Letter' | 'Postcard' | 'Brochure' | 'Other';
  status: 'Scheduled' | 'Sent' | 'Delivered' | 'Returned' | 'Failed';
  scheduledDate?: string;
  sentDate?: string;
  deliveredDate?: string;
  returnedDate?: string;
  trackingNumber?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'Email' | 'SMS' | 'Call Script' | 'Mail Letter';
  subject?: string; // For emails
  content: string; // Body content
  variables?: string[]; // Available template variables
  isActive: boolean;
  createdBy: string; // User ID
  createdByUser?: User;
  createdAt: string;
  updatedAt: string;
}

// Mapping Integration Module Types
export interface MapAsset {
  id: string;
  assetType: 'Tract' | 'Unit';
  asset: Tract | Unit;
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: number[][][] | number[]; // GeoJSON format
  };
  status: 'Unassigned' | 'Assigned' | 'In Negotiation' | 'Under Review' | 'Completed';
  assignedBuyerId?: string;
  assignedBuyer?: User;
  priceCapUsd?: number;
  county: string;
  state: string;
  operator?: string; // For units
  formation?: string; // For units
  grossAcres: number;
  netAcres?: number;
  titleStatus?: TitleStatus;
  lastActivity?: string;
}

export interface MapFilter {
  basin?: string;
  county?: string;
  state?: string;
  operator?: string;
  permittingActivity?: 'Active' | 'Inactive' | 'All';
  priceCapMin?: number;
  priceCapMax?: number;
  assignmentStatus?: 'Unassigned' | 'Assigned' | 'In Negotiation' | 'Under Review' | 'Completed' | 'All';
  assetType?: 'Tract' | 'Unit' | 'All';
  formation?: string;
  hasESGFlags?: boolean;
  hasProduction?: boolean;
}

export interface MapSelection {
  id: string;
  type: 'polygon' | 'rectangle' | 'freehand';
  coordinates: number[][];
  selectedAssets: MapAsset[];
  createdAt: string;
  createdBy: string;
  createdByUser?: User;
}

export interface MapOverlay {
  id: string;
  name: string;
  type: 'heatmap' | 'clustering' | 'symbol';
  data: any[];
  isVisible: boolean;
  opacity: number;
  colorScheme?: string;
  legend?: {
    title: string;
    items: Array<{
      label: string;
      color: string;
      value?: number;
    }>;
  };
}

export interface MapLayerConfig {
  id: string;
  name: string;
  displayName: string;
  type: 'basemap' | 'overlay' | 'analysis';
  isVisible: boolean;
  opacity: number;
  order: number;
  source: 'ArcGIS' | 'Custom' | 'External';
  metadata?: {
    description?: string;
    attribution?: string;
    updateFrequency?: string;
  };
}

export interface MapInteraction {
  id: string;
  userId: string;
  user?: User;
  action: 'pan' | 'zoom' | 'select' | 'filter' | 'export' | 'assign';
  details?: string;
  timestamp: string;
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom: number;
  };
  selectedAssets?: string[];
}

export interface MapExport {
  id: string;
  userId: string;
  user?: User;
  exportType: 'excel' | 'csv' | 'pdf' | 'assignment-list';
  filters: MapFilter;
  selectedAssets: string[];
  exportDate: string;
  downloadUrl?: string;
  status: 'Processing' | 'Completed' | 'Failed';
  errorMessage?: string;
}

// Task Types
export type TaskType = 'Call' | 'Email' | 'Internal' | 'Deadline' | 'Reminder';
export type TaskStatus = 'Open' | 'In Progress' | 'Complete' | 'Overdue';
export type TaskPriority = 'Low' | 'Medium' | 'High';

// Task Interface
export interface Task {
  id: string;
  userId: string;
  taskType: TaskType;
  subject: string;
  description?: string;
  dueDate: Date;
  dueTime?: string;
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  relatedAssignmentId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completionNotes?: string;
}

// Task Creation Request
export interface CreateTaskRequest {
  userId: string;
  taskType: TaskType;
  subject: string;
  description?: string;
  dueDate: Date;
  dueTime?: string;
  priority: TaskPriority;
  notes?: string;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  relatedAssignmentId?: string;
}

// Task Update Request
export interface UpdateTaskRequest {
  subject?: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  notes?: string;
  completionNotes?: string;
}

// Task Filter
export interface TaskFilter {
  userId?: string;
  taskType?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  relatedAssignmentId?: string;
}

// Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  taskId?: string;
  relatedObjectId?: string;
  relatedObjectType?: 'Contact' | 'Lead' | 'Deal' | 'Assignment';
  color: string;
  userId: string;
}

// Calendar View Type
export type CalendarViewType = 'month' | 'week' | 'agenda';

// Task Statistics
export interface TaskStatistics {
  total: number;
  open: number;
  inProgress: number;
  complete: number;
  overdue: number;
  byPriority: {
    low: number;
    high: number;
    medium: number;
  };
  byType: {
    call: number;
    email: number;
    internal: number;
    deadline: number;
    reminder: number;
  };
}

// ====== REPORTING & DASHBOARDS MODULE TYPES ======

// Dashboard Widget
export interface DashboardWidget {
  id: string;
  type: 'funnel' | 'bar' | 'line' | 'pie' | 'heatmap' | 'metric' | 'table';
  title: string;
  description?: string;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  data: any;
  lastUpdated: Date;
}

// Widget Configuration
export interface WidgetConfig {
  dataSource: 'leads' | 'deals' | 'assignments' | 'communications' | 'esg' | 'contacts';
  filters: ReportFilter;
  refreshInterval?: number; // in seconds
  exportFormats: ('csv' | 'excel' | 'pdf')[];
}

// Report Filter
export interface ReportFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  buyers?: string[]; // User IDs
  counties?: string[];
  basins?: string[];
  sources?: string[];
  statuses?: string[];
  customFilters?: Record<string, any>;
}

// Lead Conversion Funnel
export interface LeadConversionFunnel {
  totalContacts: number;
  contactsToLeads: number;
  leadsToLOI: number;
  loiToDeals: number;
  conversionRates: {
    contactToLead: number;
    leadToLOI: number;
    loiToDeal: number;
    overallConversion: number;
  };
  breakdown: {
    byBuyer: Record<string, LeadConversionMetrics>;
    byCounty: Record<string, LeadConversionMetrics>;
    bySource: Record<string, LeadConversionMetrics>;
    byTimePeriod: Record<string, LeadConversionMetrics>;
  };
}

// Lead Conversion Metrics
export interface LeadConversionMetrics {
  contacts: number;
  leads: number;
  lois: number;
  deals: number;
  conversionRates: {
    contactToLead: number;
    leadToLOI: number;
    loiToDeal: number;
    overallConversion: number;
  };
}

// Outreach Activity Summary
export interface OutreachActivitySummary {
  totalActivities: number;
  byType: {
    emails: number;
    calls: number;
    letters: number;
    sms: number;
  };
  byBuyer: Record<string, BuyerOutreachMetrics>;
  byWeek: Record<string, WeeklyOutreachMetrics>;
  trends: {
    weeklyGrowth: number;
    topPerformers: string[];
    responseRates: Record<string, number>;
  };
}

// Buyer Outreach Metrics
export interface BuyerOutreachMetrics {
  userId: string;
  buyerName: string;
  totalActivities: number;
  emails: number;
  calls: number;
  letters: number;
  sms: number;
  responseRate: number;
  conversionRate: number;
}

// Weekly Outreach Metrics
export interface WeeklyOutreachMetrics {
  weekStart: Date;
  totalActivities: number;
  emails: number;
  calls: number;
  letters: number;
  sms: number;
  responseRate: number;
}

// Assignment Performance Metrics
export interface AssignmentPerformanceMetrics {
  totalAssignments: number;
  averagePriorityScore: number;
  averagePricePerAcre: number;
  averageContactRate: number;
  averageDealCloseRate: number;
  byBuyer: Record<string, BuyerAssignmentMetrics>;
  correlations: {
    priorityVsPrice: number;
    priorityVsContactRate: number;
    priorityVsCloseRate: number;
    priceVsCloseRate: number;
  };
}

// Buyer Assignment Metrics
export interface BuyerAssignmentMetrics {
  userId: string;
  buyerName: string;
  assignments: number;
  averagePriorityScore: number;
  averagePricePerAcre: number;
  contactRate: number;
  dealCloseRate: number;
  totalDealValue: number;
}

// Deal Velocity & NMA Metrics
export interface DealVelocityMetrics {
  totalDeals: number;
  totalNMA: number;
  totalGrossValue: number;
  averagePricePerAcre: number;
  averageDealSize: number;
  byBuyer: Record<string, BuyerDealMetrics>;
  byBasin: Record<string, BasinDealMetrics>;
  byStatus: Record<string, StatusDealMetrics>;
  trends: {
    monthlyGrowth: number;
    averageCloseTime: number;
    pipelineVelocity: number;
  };
}

// Buyer Deal Metrics
export interface BuyerDealMetrics {
  userId: string;
  buyerName: string;
  deals: number;
  totalNMA: number;
  totalValue: number;
  averagePricePerAcre: number;
  averageDealSize: number;
  closeRate: number;
}

// Basin Deal Metrics
export interface BasinDealMetrics {
  basin: string;
  deals: number;
  totalNMA: number;
  totalValue: number;
  averagePricePerAcre: number;
  averageDealSize: number;
}

// Status Deal Metrics
export interface StatusDealMetrics {
  status: string;
  deals: number;
  totalNMA: number;
  totalValue: number;
  averagePricePerAcre: number;
}

// ESG Compliance Summary
export interface ESGComplianceSummary {
  totalTracts: number;
  regulatoryFlags: number;
  carbonScores: number;
  verifiedTitle: number;
  complianceRates: {
    regulatoryFlags: number;
    carbonScores: number;
    verifiedTitle: number;
    overallCompliance: number;
  };
  byBasin: Record<string, BasinESGMetrics>;
  byCounty: Record<string, CountyESGMetrics>;
  riskAssessment: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

// Basin ESG Metrics
export interface BasinESGMetrics {
  basin: string;
  totalTracts: number;
  regulatoryFlags: number;
  carbonScores: number;
  verifiedTitle: number;
  complianceRate: number;
}

// County ESG Metrics
export interface CountyESGMetrics {
  county: string;
  totalTracts: number;
  regulatoryFlags: number;
  carbonScores: number;
  verifiedTitle: number;
  complianceRate: number;
}

// Dashboard Export
export interface DashboardExport {
  id: string;
  reportTitle: string;
  exportType: 'csv' | 'excel' | 'pdf';
  filters: ReportFilter;
  exportedBy: string;
  exportedAt: Date;
  fileUrl?: string;
  fileSize?: number;
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  layout: DashboardWidget[];
  filters: ReportFilter;
  refreshInterval: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

// ====== DOCUMENT GENERATION MODULE TYPES ======

// Document Template
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'LOI' | 'Call Script' | 'Due Diligence' | 'Mail Merge' | 'Contract' | 'Other';
  content: string;
  variables: string[]; // Array of variable tags like ["{{Contact Name}}", "{{Tract ID}}"]
  fileType: 'docx' | 'pdf' | 'html';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// Generated Document
export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  documentName: string;
  content: string;
  variables: Record<string, string>; // Key-value pairs of populated variables
  fileType: 'docx' | 'pdf' | 'html';
  status: 'draft' | 'final' | 'signed' | 'shared';
  isFinalVersion: boolean;
  version: number;
  
  // Related CRM objects
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  
  // Metadata
  generatedBy: string;
  generatedAt: Date;
  lastModifiedAt: Date;
  lastModifiedBy: string;
  finalVersionAt?: Date;
  finalVersionBy?: string;
  
  // File storage
  fileUrl?: string;
  fileSize?: number;
  checksum?: string;
}

// Document Generation Request
export interface GenerateDocumentRequest {
  templateId: string;
  documentName: string;
  variables: Record<string, string>;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  fileType: 'docx' | 'pdf' | 'html';
}

// Document Update Request
export interface UpdateDocumentRequest {
  content?: string;
  variables?: Record<string, string>;
  status?: 'draft' | 'final' | 'signed' | 'shared';
  isFinalVersion?: boolean;
}

// Document Template Creation Request
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: 'LOI' | 'Call Script' | 'Due Diligence' | 'Mail Merge' | 'Contract' | 'Other';
  content: string;
  fileType: 'docx' | 'pdf' | 'html';
}

// Document Template Update Request
export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: 'LOI' | 'Call Script' | 'Due Diligence' | 'Mail Merge' | 'Contract' | 'Other';
  content?: string;
  fileType?: 'docx' | 'pdf' | 'html';
  isActive?: boolean;
}

// Document Filter
export interface DocumentFilter {
  templateId?: string;
  category?: string;
  status?: string;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  generatedBy?: string;
  generatedAtFrom?: Date;
  generatedAtTo?: Date;
  isFinalVersion?: boolean;
}

// Document Template Filter
export interface TemplateFilter {
  category?: string;
  isActive?: boolean;
  createdBy?: string;
}

// Document Generation Context
export interface DocumentContext {
  contact?: ContactEnhanced;
  lead?: LeadEnhanced;
  deal?: Deal;
  currentUser: User;
  availableVariables: string[];
}

// Document Variable Mapping
export interface VariableMapping {
  variable: string; // e.g., "{{Contact Name}}"
  displayName: string; // e.g., "Contact Name"
  description: string; // e.g., "Full name of the contact"
  source: 'contact' | 'lead' | 'deal' | 'user' | 'system';
  required: boolean;
  defaultValue?: string;
}

// ====== ESG TRACKING MODULE TYPES ======

// ESG Risk Level
export type ESGRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// ESG Compliance Score (1-5 scale)
export type ESGComplianceScore = 1 | 2 | 3 | 4 | 5;

// ESG Data Source
export type ESGDataSource = 'Manual' | 'Scraped' | 'API' | 'Operator Report' | 'Regulatory Database';

// ESG Profile for Tracts and Units
export interface ESGProfile {
  id: string;
  
  // Asset Reference
  tractId?: string;
  unitId?: string;
  dealId?: string;
  
  // Environmental Metrics
  carbonIntensity?: number; // tons CO2e/BOE
  emissionsData?: {
    scope1?: number; // tons CO2e
    scope2?: number; // tons CO2e
    scope3?: number; // tons CO2e
    totalEmissions?: number; // tons CO2e
  };
  environmentalFlags?: string[];
  
  // Social Metrics
  surfaceUseSensitivity?: string;
  landImpactNotes?: string;
  communityEngagement?: string;
  socialFlags?: string[];
  
  // Governance Metrics
  titleVerificationStatus: 'Clean' | 'Clouded' | 'Pending' | 'Unknown';
  operatorComplianceScore: ESGComplianceScore;
  regulatoryCompliance?: string;
  governanceFlags?: string[];
  
  // Risk Assessment
  overallRiskLevel: ESGRiskLevel;
  riskFactors: string[];
  riskNotes?: string;
  
  // Data Quality
  dataCompleteness: 'Complete' | 'Partial' | 'Incomplete';
  dataSource: ESGDataSource;
  lastDataUpdate: Date;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  isActive: boolean;
}

// ESG Risk Flag
export interface ESGRiskFlag {
  id: string;
  assetId: string; // Tract ID or Unit ID
  assetType: 'tract' | 'unit';
  riskType: 'Environmental' | 'Social' | 'Governance' | 'Compliance' | 'Regulatory';
  riskLevel: ESGRiskLevel;
  description: string;
  impact: string;
  mitigationRequired: boolean;
  requiresManagerOverride: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  lastModifiedBy: string;
  lastModifiedAt: Date;
}

// Regulatory Watchlist Entry
export interface RegulatoryWatchlistEntry {
  id: string;
  operatorName: string;
  apiNumber?: string;
  violationType: 'Environmental' | 'Safety' | 'Compliance' | 'Financial' | 'Other';
  violationDescription: string;
  violationDate: Date;
  penaltyAmount?: number;
  resolutionStatus: 'Open' | 'Resolved' | 'Appealed' | 'Dismissed';
  resolutionDate?: Date;
  repeatOffender: boolean;
  riskLevel: ESGRiskLevel;
  
  // Related Assets
  affectedTracts?: string[];
  affectedUnits?: string[];
  
  // Metadata
  reportedBy: string;
  reportedAt: Date;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  isActive: boolean;
}

// ESG Portfolio Summary
export interface ESGPortfolioSummary {
  id: string;
  portfolioName: string;
  
  // Asset Counts
  totalTracts: number;
  totalUnits: number;
  tractsWithESGData: number;
  unitsWithESGData: number;
  
  // Risk Distribution
  lowRiskAssets: number;
  mediumRiskAssets: number;
  highRiskAssets: number;
  criticalRiskAssets: number;
  
  // Compliance Metrics
  hbpPercentage: number; // % under HBP
  verifiedTitlePercentage: number;
  compliantOperatorPercentage: number;
  
  // Environmental Metrics
  averageCarbonIntensity: number;
  highCarbonAssets: number;
  
  // Regulatory Metrics
  regulatoryRiskAssets: number;
  watchlistOperators: number;
  
  // Data Quality
  dataCompletenessPercentage: number;
  lastUpdated: Date;
  
  // Metadata
  generatedBy: string;
  generatedAt: Date;
}

// ESG Dashboard Widget
export interface ESGDashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'alert';
  data: any;
  refreshInterval?: number; // seconds
  lastUpdated: Date;
}

// ESG Filter Criteria
export interface ESGFilterCriteria {
  riskLevel?: ESGRiskLevel[];
  complianceScore?: ESGComplianceScore[];
  titleStatus?: string[];
  operatorCompliance?: ESGComplianceScore[];
  carbonIntensityRange?: {
    min?: number;
    max?: number;
  };
  hasRiskFlags?: boolean;
  dataCompleteness?: string[];
  lastUpdateFrom?: Date;
  lastUpdateTo?: Date;
}

// ESG Report Request
export interface ESGReportRequest {
  reportType: 'Portfolio Summary' | 'Risk Assessment' | 'Compliance Report' | 'Regulatory Watchlist' | 'Custom';
  filters: ESGFilterCriteria;
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeRecommendations: boolean;
}

// ESG Data Import
export interface ESGDataImport {
  id: string;
  fileName: string;
  importType: 'Bulk Update' | 'New Records' | 'Replacement';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: string[];
  
  // Metadata
  importedBy: string;
  importedAt: Date;
  status: 'In Progress' | 'Completed' | 'Failed' | 'Partially Completed';
}

// ESG Audit Log
export interface ESGAuditLog {
  id: string;
  assetId: string;
  assetType: 'tract' | 'unit' | 'deal';
  action: 'Created' | 'Updated' | 'Deleted' | 'Risk Flag Added' | 'Risk Flag Resolved' | 'Data Imported';
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  
  // Metadata
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}