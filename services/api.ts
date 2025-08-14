import type { User, Role, Privilege, Tract, Contact, ContactTractOwnership, ContactNote, Lead, TractLead, LeadNote, TractSpatial, ProducingWell, Permit, Rig, Unit, UnitAssignment, UnitTract, UnitContact, UnitNote, UnitFilters, MapLayerPreference, Assignment, AssignmentHistory, CreateAssignmentData, UpdateAssignmentData, AssignmentFilters, UnitTractEnhanced, TitleStatus, ContactCallLog, ContactDocument, DistressSignal, LeadEnhanced, LeadCallLog, MapAsset, MapFilter, MapSelection, MapOverlay, MapLayerConfig, MapInteraction, MapExport } from '../types';

/*
================================================================================
 MOCK API & ENDPOINT DEFINITIONS
================================================================================
This file simulates a backend API for development purposes.
The comments below describe the REST endpoints the real backend should implement.
*/

// --- MOCK DATABASE ---

let mockRoles: Role[] = [
  { id: '1', name: 'Administrator', description: 'Has all permissions' },
  { id: '2', name: 'Land Manager', description: 'Can view and edit land tracts' },
  { id: '3', name: 'Viewer', description: 'Can only view data' },
  { id: '4', name: 'Buyer', description: 'Assigned to tracts for acquisition' },
];

let mockUsers: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'admin@sooner.cap', role: mockRoles[0] },
  { id: 'u2', name: 'Bob Manager', email: 'manager@sooner.cap', role: mockRoles[1] },
  { id: 'u3', name: 'Charlie Viewer', email: 'viewer@sooner.cap', role: mockRoles[2] },
  { id: 'u4', name: 'David Buyer', email: 'buyer@sooner.cap', role: mockRoles[3] },
];

let mockPrivileges: Privilege[] = [
    { id: 'p1', name: 'Manage Users', description: 'Can create, edit, and delete users.', roles: [mockRoles[0]] },
    { id: 'p2', name: 'Manage Roles', description: 'Can create, edit, and delete roles.', roles: [mockRoles[0]] },
    { id: 'p3', name: 'Manage Land Tracts', description: 'Full control over land tract data.', roles: [mockRoles[0], mockRoles[1]] },
    { id: 'p4', name: 'View Financials', description: 'Can view financial reports.', roles: [mockRoles[0], mockRoles[1]] },
    { id: 'p5', name: 'View Land Tracts', description: 'Can only view land tract data.', roles: [mockRoles[0], mockRoles[1], mockRoles[2], mockRoles[3]] },
];

let mockTracts: Tract[] = [
    {
        id: 't1',
        state: 'TX',
        county: 'Midland',
        tractName: 'North Star Prospect',
        legalDescription: 'Section 15, Block 2, T&P RR Co. Survey',
        str: '15-02S-32E',
        abstractNumber: 'A-1234',
        grossAcres: 640,
        netMineralAcres: 160,
        royalty: 0.25,
        nra: 320, // 160 * 0.25 / 0.125
        titleStatus: 'Verified',
        assignedBuyerId: 'u4',
        nraCapUsd: 15000,
        sourceChannel: 'Broker',
        heldByFund: true,
        isLocked: false,
    },
    {
        id: 't2',
        state: 'OK',
        county: 'Love',
        tractName: 'Red River Minerals',
        legalDescription: 'W/2 of the SW/4 of Section 10, Township 8 South, Range 2 East',
        str: '10-08S-02E',
        grossAcres: 80,
        netMineralAcres: 20,
        royalty: 0.1875,
        nra: 30, // 20 * 0.1875 / 0.125
        titleStatus: 'In Progress',
        assignedBuyerId: 'u4',
        sourceChannel: 'Inbound',
        heldByFund: false,
        isLocked: true,
    },
    {
        id: 't3',
        state: 'TX',
        county: 'Dallas',
        tractName: 'Wilson Eagle Ford Prospect',
        legalDescription: 'Section 25, Block 3, T&P RR Co. Survey',
        str: '25-03S-32E',
        abstractNumber: 'A-5678',
        grossAcres: 320,
        netMineralAcres: 80,
        royalty: 0.20,
        nra: 128, // 80 * 0.20 / 0.125
        titleStatus: 'Verified',
        assignedBuyerId: undefined,
        nraCapUsd: 8000,
        sourceChannel: 'Direct',
        heldByFund: false,
        isLocked: false,
    }
];

// Mock contacts data
let mockContacts: Contact[] = [
    {
        id: 'c1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        address: '123 Main St',
        city: 'Midland',
        state: 'TX',
        zipCode: '79701',
        contactType: 'Landowner',
        notes: 'Primary landowner contact',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'c2',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 234-5678',
        address: '456 Oak Ave',
        city: 'Ardmore',
        state: 'OK',
        zipCode: '73401',
        contactType: 'Landowner',
        notes: 'Direct contact - motivated seller',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'c3',
        name: 'Mike Wilson',
        email: 'mike.w@email.com',
        phone: '(555) 345-6789',
        address: '789 Pine Rd',
        city: 'Oklahoma City',
        state: 'OK',
        zipCode: '73101',
        contactType: 'Landowner',
        notes: 'Premium unit landowner',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'c4',
        name: 'Lisa Brown',
        email: 'lisa.b@email.com',
        phone: '(555) 456-7890',
        address: '321 Elm St',
        city: 'Tulsa',
        state: 'OK',
        zipCode: '74101',
        contactType: 'Landowner',
        notes: 'Development opportunity contact',
        createdAt: '2024-01-01T00:00-00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    }
];

// Mock contact-tract ownership data
let mockContactTractOwnership: ContactTractOwnership[] = [
    {
        id: 'cto1',
        contactId: 'c1',
        tractId: 't1',
        ownershipPercentage: 0.25,
        royaltyPercentage: 0.25,
        sourceOfTitle: 'Warranty Deed dated 2015-03-15',
        nma: 160, // 640 * 0.25
        nra: 320, // 160 * 0.25 / 0.125
    },
    {
        id: 'cto2',
        contactId: 'c2',
        tractId: 't1',
        ownershipPercentage: 0.50,
        royaltyPercentage: 0.25,
        sourceOfTitle: 'Mineral Deed dated 2018-07-22',
        nma: 320, // 640 * 0.50
        nra: 640, // 320 * 0.25 / 0.125
    },
    {
        id: 'cto3',
        contactId: 'c3',
        tractId: 't1',
        ownershipPercentage: 0.25,
        royaltyPercentage: 0.25,
        sourceOfTitle: 'Assignment dated 2020-11-10',
        nma: 160, // 640 * 0.25
        nra: 320, // 160 * 0.25 / 0.125
    },
    {
        id: 'cto4',
        contactId: 'c4',
        tractId: 't2',
        ownershipPercentage: 1.00,
        royaltyPercentage: 0.25,
        sourceOfTitle: 'Warranty Deed dated 2016-09-08',
        nma: 80, // 80 * 1.00
        nra: 160, // 80 * 0.25 / 0.125
    },
    {
        id: 'cto5',
        contactId: 'c5',
        tractId: 't3',
        ownershipPercentage: 0.75,
        royaltyPercentage: 0.20,
        sourceOfTitle: 'Mineral Deed dated 2019-04-12',
        nma: 60, // 80 * 0.75 (assuming tract t3 has 80 gross acres)
        nra: 96, // 60 * 0.20 / 0.125
    },
    {
        id: 'cto6',
        contactId: 'c1',
        tractId: 't3',
        ownershipPercentage: 0.25,
        royaltyPercentage: 0.20,
        sourceOfTitle: 'Assignment dated 2021-02-28',
        nma: 20, // 80 * 0.25
        nra: 32, // 20 * 0.20 / 0.125
    }
];

// Mock contact notes data
let mockContactNotes: ContactNote[] = [
    {
        id: 'cn1',
        contactId: 'c1',
        tractId: 't1',
        noteText: 'Initial outreach call made. Contact expressed interest in selling mineral rights.',
        noteType: 'Outreach',
        createdBy: 'u1',
        createdAt: '2024-01-20T09:00:00Z',
    },
    {
        id: 'cn2',
        contactId: 'c2',
        tractId: 't1',
        noteText: 'Follow-up email sent with offer details. Awaiting response.',
        noteType: 'Follow-up',
        createdBy: 'u2',
        createdAt: '2024-01-21T10:00:00Z',
    },
    {
        id: 'cn3',
        contactId: 'c3',
        tractId: 't1',
        noteText: 'Meeting scheduled for next week to discuss acquisition terms.',
        noteType: 'Meeting',
        createdBy: 'u1',
        createdAt: '2024-01-22T11:00:00Z',
    },
    {
        id: 'cn4',
        contactId: 'c4',
        tractId: 't2',
        noteText: 'Contact requested additional documentation before proceeding.',
        noteType: 'Documentation',
        createdBy: 'u2',
        createdAt: '2024-01-23T12:00:00Z',
    }
];

// Mock leads data - removed old structure, using new Lead interface

// Mock tract leads data
let mockTractLeads: TractLead[] = [
    {
        id: 'tl1',
        tractId: 't1',
        buyerId: 'u4',
        status: 'In Progress',
        leadSource: 'Assignment',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        lastActivity: '2024-01-25T14:30:00Z',
        noteCount: 4,
    },
    {
        id: 'tl2',
        tractId: 't1',
        buyerId: 'u2',
        status: 'Closed',
        leadSource: 'Inbound',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-12T16:00:00Z',
        lastActivity: '2024-01-12T16:00:00Z',
        noteCount: 2,
    },
    {
        id: 'tl3',
        tractId: 't1',
        buyerId: 'u4',
        status: 'Converted',
        leadSource: 'Referral',
        createdAt: '2024-01-05T11:00:00Z',
        updatedAt: '2024-01-20T15:00:00Z',
        lastActivity: '2024-01-20T15:00:00Z',
        noteCount: 3,
    },
    {
        id: 'tl4',
        tractId: 't2',
        buyerId: 'u4',
        status: 'In Progress',
        leadSource: 'Assignment',
        createdAt: '2024-01-18T13:00:00Z',
        updatedAt: '2024-01-18T13:00:00Z',
        lastActivity: '2024-01-24T10:00:00Z',
        noteCount: 2,
    },
    {
        id: 'tl5',
        tractId: 't2',
        buyerId: 'u2',
        status: 'Closed',
        leadSource: 'Cold Outreach',
        createdAt: '2024-01-12T14:00:00Z',
        updatedAt: '2024-01-14T11:00:00Z',
        lastActivity: '2024-01-14T11:00:00Z',
        noteCount: 1,
    },
    {
        id: 'tl6',
        tractId: 't3',
        buyerId: 'u4',
        status: 'In Progress',
        leadSource: 'Assignment',
        createdAt: '2024-01-20T16:00:00Z',
        updatedAt: '2024-01-20T16:00:00Z',
        lastActivity: '2024-01-26T09:00:00Z',
        noteCount: 2,
    }
];

// Mock lead notes data - removed old structure, using new LeadNote interface


const apiDelay = 500;

const populateTractBuyer = (tract: Tract): Tract => {
    const buyer = mockUsers.find(u => u.id === tract.assignedBuyerId);
    return { ...tract, assignedBuyer: buyer };
};

// --- API FUNCTIONS ---

// ====== AUTH ENDPOINTS ======
/*
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Response (Success): { token: string, user: User }
 * Response (Error): { message: string }
 */
export const login = async (email: string, password?: string): Promise<User> => {
    console.log(`Attempting login for ${email}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.email === email);
            if (user && password === 'password') { // Simplified password check for mock
                resolve(user);
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, apiDelay);
    });
};

// ====== USERS ENDPOINTS ======
/*
 * GET /api/users
 * Response: User[]
 */
export const fetchUsers = async (): Promise<User[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockUsers]), apiDelay));
};

/*
 * POST /api/users
 * Body: { name: string, email: string, password: string, roleId: string }
 * Response: User
 */
export const createUser = async (data: Omit<User, 'id' | 'role'> & { roleId: string; password: string }): Promise<User> => {
    return new Promise(resolve => setTimeout(() => {
        const role = mockRoles.find(r => r.id === data.roleId);
        if (!role) throw new Error("Role not found");
        const newUser: User = {
            id: `u${Date.now()}`,
            name: data.name,
            email: data.email,
            role,
        };
        mockUsers.push(newUser);
        resolve(newUser);
    }, apiDelay));
};

/*
 * PUT /api/users/:id
 * Body: { name: string, email: string, roleId: string }
 * Response: User
 */
export const updateUser = async (id: string, data: Omit<User, 'id' | 'role' | 'email'> & { roleId: string }): Promise<User> => {
    return new Promise(resolve => setTimeout(() => {
        const userIndex = mockUsers.findIndex(u => u.id === id);
        const role = mockRoles.find(r => r.id === data.roleId);
        if (userIndex === -1 || !role) throw new Error("User or Role not found");
        mockUsers[userIndex] = { ...mockUsers[userIndex], name: data.name, role };
        resolve(mockUsers[userIndex]);
    }, apiDelay));
};


/*
 * DELETE /api/users/:id
 * Response: 204 No Content
 */
 export const deleteUser = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(() => {
        mockUsers = mockUsers.filter(u => u.id !== id);
        resolve();
    }, apiDelay));
};


// ====== ROLES ENDPOINTS ======
/*
 * GET /api/roles
 * Response: Role[]
 */
export const fetchRoles = async (): Promise<Role[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockRoles]), apiDelay));
};

/*
 * POST /api/roles
 * Body: { name: string, description: string }
 * Response: Role
 */
export const createRole = async (data: Omit<Role, 'id'>): Promise<Role> => {
    return new Promise(resolve => setTimeout(() => {
        const newRole: Role = { ...data, id: `r${Date.now()}` };
        mockRoles.push(newRole);
        resolve(newRole);
    }, apiDelay));
};

/*
 * PUT /api/roles/:id
 * Body: { name: string, description: string }
 * Response: Role
 */
export const updateRole = async (id: string, data: Omit<Role, 'id'>): Promise<Role> => {
    return new Promise(resolve => setTimeout(() => {
        const roleIndex = mockRoles.findIndex(r => r.id === id);
        if (roleIndex === -1) throw new Error("Role not found");
        mockRoles[roleIndex] = { ...mockRoles[roleIndex], ...data };
        resolve(mockRoles[roleIndex]);
    }, apiDelay));
};

/*
 * DELETE /api/roles/:id
 * Response: 204 No Content
 */
export const deleteRole = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(() => {
        mockRoles = mockRoles.filter(r => r.id !== id);
        // Also remove this role from any privileges
        mockPrivileges.forEach(p => {
            p.roles = p.roles.filter(r => r.id !== id);
        });
        resolve();
    }, apiDelay));
};


// ====== PRIVILEGES ENDPOINTS ======
/*
 * GET /api/privileges
 * Response: Privilege[]
 */
export const fetchPrivileges = async (): Promise<Privilege[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockPrivileges]), apiDelay));
};

/*
 * PUT /api/privileges/:id/roles
 * Body: { roleIds: string[] }
 * Response: 200 OK
 */
export const assignRolesToPrivilege = async (privilegeId: string, roleIds: string[]): Promise<Privilege> => {
    return new Promise(resolve => setTimeout(() => {
        const privilegeIndex = mockPrivileges.findIndex(p => p.id === privilegeId);
        if (privilegeIndex === -1) throw new Error("Privilege not found");
        const assignedRoles = mockRoles.filter(r => roleIds.includes(r.id));
        mockPrivileges[privilegeIndex].roles = assignedRoles;
        resolve(mockPrivileges[privilegeIndex]);
    }, apiDelay));
};


// ====== TRACTS ENDPOINTS ======

const calculateNra = (nma?: number, royalty?: number): number | undefined => {
    if (typeof nma === 'number' && typeof royalty === 'number' && royalty > 0) {
        return (nma * royalty) / 0.125;
    }
    return undefined;
};

/*
 * GET /api/tracts
 * Response: Tract[]
 */
export const fetchTracts = async (): Promise<Tract[]> => {
    return new Promise(resolve => setTimeout(() => {
        const populatedTracts = mockTracts.map(populateTractBuyer);
        resolve([...populatedTracts]);
    }, apiDelay));
};

/*
 * POST /api/tracts
 * Body: Omit<Tract, 'id' | 'assignedBuyer' | 'nra'>
 * Response: Tract
 */
export const createTract = async (data: Omit<Tract, 'id' | 'assignedBuyer' | 'nra'>): Promise<Tract> => {
    return new Promise(resolve => setTimeout(() => {
        const newTract: Tract = {
            ...data,
            id: `t${Date.now()}`,
            nra: calculateNra(data.netMineralAcres, data.royalty),
        };
        mockTracts.push(newTract);
        resolve(populateTractBuyer(newTract));
    }, apiDelay));
};

/*
 * PUT /api/tracts/:id
 * Body: Omit<Tract, 'id' | 'assignedBuyer' | 'nra'>
 * Response: Tract
 */
export const updateTract = async (id: string, data: Omit<Tract, 'id' | 'assignedBuyer' | 'nra'>): Promise<Tract> => {
    return new Promise(resolve => setTimeout(() => {
        const tractIndex = mockTracts.findIndex(t => t.id === id);
        if (tractIndex === -1) throw new Error("Tract not found");
        
        const updatedTract: Tract = {
            ...mockTracts[tractIndex],
            ...data,
            id,
            nra: calculateNra(data.netMineralAcres, data.royalty),
        };
        mockTracts[tractIndex] = updatedTract;
        resolve(populateTractBuyer(updatedTract));
    }, apiDelay));
};

/*
 * DELETE /api/tracts/:id
 * Response: 204 No Content
 */
export const deleteTract = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(() => {
        mockTracts = mockTracts.filter(t => t.id !== id);
        resolve();
    }, apiDelay));
};

// ====== CONTACTS ENDPOINTS ======

const populateContactTractOwnership = (ownership: ContactTractOwnership): ContactTractOwnership => {
    const contact = mockContacts.find(c => c.id === ownership.contactId);
    const tract = mockTracts.find(t => t.id === ownership.tractId);
    return { ...ownership, contact, tract };
};

const populateContactNote = (note: ContactNote): ContactNote => {
    const createdByUser = mockUsers.find(u => u.id === note.createdBy);
    return { ...note, createdByUser };
};

// Old populateLead function removed - using new Lead interface

/*
 * GET /api/tracts/:id/contacts
 * Response: ContactTractOwnership[]
 */
export const fetchTractContacts = async (tractId: string): Promise<ContactTractOwnership[]> => {
    return new Promise(resolve => setTimeout(() => {
        const ownerships = mockContactTractOwnership
            .filter(cto => cto.tractId === tractId)
            .map(populateContactTractOwnership);
        resolve(ownerships);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/notes
 * Response: ContactNote[]
 */
export const fetchContactNotes = async (contactId: string, tractId: string): Promise<ContactNote[]> => {
    return new Promise(resolve => setTimeout(() => {
        const notes = mockContactNotes
            .filter(note => note.contactId === contactId && note.tractId === tractId)
            .map(populateContactNote)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(notes);
    }, apiDelay));
};

/*
 * POST /api/contacts/:id/notes
 * Body: { noteText: string, noteType: string, tractId: string }
 * Response: ContactNote
 */
export const createContactNote = async (contactId: string, data: { noteText: string; noteType: string; tractId: string }): Promise<ContactNote> => {
    return new Promise(resolve => setTimeout(() => {
        const newNote: ContactNote = {
            id: `cn${Date.now()}`,
            contactId,
            tractId: data.tractId,
            noteText: data.noteText,
            noteType: data.noteType as ContactNote['noteType'],
            createdBy: 'u1', // Mock current user
            createdAt: new Date().toISOString(),
        };
        mockContactNotes.push(newNote);
        resolve(populateContactNote(newNote));
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/leads
 * Response: Lead[]
 */
export const fetchContactLeads = async (contactId: string): Promise<any[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Mock data for contact leads with enhanced fields
        const mockContactLeads = [
            {
                id: 'lead1',
                contactId: contactId,
                tractId: 't1',
                status: 'Open',
                assignedBuyer: 'John Smith',
                lastContacted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                leadSource: 'Inbound',
                outcomeSummary: 'Initial contact made, contact expressed interest in learning more about mineral rights acquisition',
                notes: 'Contacted about mineral rights acquisition. Showed interest in learning more about the offer.',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'lead2',
                contactId: contactId,
                tractId: 't2',
                status: 'In Progress',
                assignedBuyer: 'Jane Doe',
                lastContacted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                leadSource: 'Scraped',
                outcomeSummary: 'LOI sent, awaiting response from contact',
                notes: 'LOI sent with competitive offer. Contact reviewing terms and conditions.',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'lead3',
                contactId: contactId,
                tractId: 't1',
                status: 'Closed Won',
                assignedBuyer: 'Mike Johnson',
                lastContacted: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                leadSource: 'Brokered',
                outcomeSummary: 'Successfully closed deal for 160 NMA at competitive price',
                notes: 'Deal closed successfully. All documentation completed and funds transferred.',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'lead4',
                contactId: contactId,
                tractId: 't3',
                status: 'Closed Lost',
                assignedBuyer: 'Sarah Wilson',
                lastContacted: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                leadSource: 'Auction',
                outcomeSummary: 'Contact decided to hold onto mineral rights for now',
                notes: 'Contact decided not to proceed with sale. Will follow up in 6 months.',
                createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            }
        ];
        
        resolve(mockContactLeads);
    }, apiDelay));
};

// Old createLead function removed - using new Lead interface

/*
 * GET /api/contacts
 * Response: Contact[]
 */
export const fetchContacts = async (): Promise<Contact[]> => {
    return new Promise(resolve => setTimeout(() => {
        resolve(mockContacts);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id
 * Response: Contact
 */
export const fetchContact = async (id: string): Promise<Contact> => {
    return new Promise(resolve => setTimeout(() => {
        const contact = mockContacts.find(c => c.id === id);
        if (!contact) {
            throw new Error('Contact not found');
        }
        resolve(contact);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/tract-ownership
 * Response: ContactTractOwnership[]
 */
export const fetchContactTractOwnership = async (contactId: string): Promise<ContactTractOwnership[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Mock data - in real implementation this would query the database
        const mockOwnership: ContactTractOwnership[] = [
            {
                id: 'cto1',
                contactId,
                tractId: 't1',
                ownershipPercentage: 0.25,
                royaltyPercentage: 0.25,
                sourceOfTitle: 'Deed',
                contact: mockContacts.find(c => c.id === contactId),
                tract: mockTracts[0],
                nma: 160, // 640 * 0.25
                nra: 320, // 160 * 0.25 / 0.125
            }
        ];
        resolve(mockOwnership);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/units
 * Response: ContactUnitSummary[]
 */
export const fetchContactUnits = async (contactId: string): Promise<any[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Mock data for contact units with enhanced fields
        const mockContactUnits = [
            {
                id: 'unit1',
                unitName: 'Bowman 22-27 1306-6N4W',
                operator: 'ExxonMobil',
                status: 'Producing',
                formation: 'Wolfcamp',
                county: 'Reeves',
                state: 'TX',
                assignedBuyer: 'Joe Buyer',
                totalNMA: 320,
                totalNRA: 640,
                tracts: [
                    {
                        id: 'tract1',
                        tractId: 't1',
                        tract: {
                            tractName: 'Bowman 22-27 1306-6N4W',
                            str: '22-27 1306-6N4W',
                            county: 'Reeves',
                            state: 'TX'
                        },
                        nma: 160,
                        royaltyPercentage: 0.1875,
                        status: 'Under Review',
                        assignedBuyer: 'Joe Buyer'
                    },
                    {
                        id: 'tract2',
                        tractId: 't2',
                        tract: {
                            tractName: 'Munson 2-21 1403-6N4W',
                            str: '2-21 1403-6N4W',
                            county: 'Reeves',
                            state: 'TX'
                        },
                        nma: 160,
                        royaltyPercentage: 0.1875,
                        status: 'Under Review',
                        assignedBuyer: 'Joe Buyer'
                    }
                ]
            },
            {
                id: 'unit2',
                unitName: 'Munson 2-21 1403-6N4W',
                operator: 'Chevron',
                status: 'Permitted',
                formation: 'Bone Spring',
                county: 'Reeves',
                state: 'TX',
                assignedBuyer: 'Sarah Wilson',
                totalNMA: 240,
                totalNRA: 480,
                tracts: [
                    {
                        id: 'tract3',
                        tractId: 't3',
                        tract: {
                            tractName: 'Munson 2-21 1403-6N4W',
                            str: '2-21 1403-6N4W',
                            county: 'Reeves',
                            state: 'TX'
                        },
                        nma: 120,
                        royaltyPercentage: 0.1250,
                        status: 'Unassigned',
                        assignedBuyer: null
                    },
                    {
                        id: 'tract4',
                        tractId: 't4',
                        tract: {
                            tractName: 'Bowman 22-27 1306-6N4W',
                            str: '22-27 1306-6N4W',
                            county: 'Reeves',
                            state: 'TX'
                        },
                        nma: 120,
                        royaltyPercentage: 0.1250,
                        status: 'Assigned',
                        assignedBuyer: 'Sarah Wilson'
                    }
                ]
            },
            {
                id: 'unit3',
                unitName: 'Pecos 15-18 1201-5N3W',
                operator: 'ConocoPhillips',
                status: 'Drilling',
                formation: 'Wolfcamp',
                county: 'Pecos',
                state: 'TX',
                assignedBuyer: 'Mike Johnson',
                totalNMA: 180,
                totalNRA: 360,
                tracts: [
                    {
                        id: 'tract5',
                        tractId: 't5',
                        tract: {
                            tractName: 'Pecos 15-18 1201-5N3W',
                            str: '15-18 1201-5N3W',
                            county: 'Pecos',
                            state: 'TX'
                        },
                        nma: 180,
                        royaltyPercentage: 0.2000,
                        status: 'Assigned',
                        assignedBuyer: 'Mike Johnson'
                    }
                ]
            }
        ];
        
        resolve(mockContactUnits);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/call-logs
 * Response: ContactCallLog[]
 */
export const fetchContactCallLogs = async (contactId: string): Promise<ContactCallLog[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Mock data
        const mockCallLogs: ContactCallLog[] = [
            {
                id: 'cl1',
                contactId,
                callDate: new Date().toISOString(),
                callTime: '14:30',
                caller: 'John Smith',
                callType: 'Outbound',
                callStatus: 'Completed',
                notes: 'Contacted about mineral rights acquisition. Showed interest in learning more about the offer. Discussed tract T-001 and unit U-001.',
                followUpFlag: true,
                followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                associatedLeadId: 'l1',
                tractIds: ['t1'],
                unitIds: ['u1'],
                duration: 180,
                outcome: 'Interested',
                nextAction: 'Send follow-up email with proposal',
                nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                createdBy: 'u1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'cl2',
                contactId,
                callDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                callTime: '10:15',
                caller: 'Jane Doe',
                callType: 'Inbound',
                callStatus: 'Completed',
                notes: 'Returned call about mineral rights. Asked for more information about the acquisition process.',
                followUpFlag: false,
                duration: 120,
                outcome: 'Interested',
                nextAction: 'Send information packet',
                nextActionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                createdBy: 'u2',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'cl3',
                contactId,
                callDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                callTime: '16:45',
                caller: 'Mike Johnson',
                callType: 'Follow-up',
                callStatus: 'Left Message',
                notes: 'Left voicemail about follow-up meeting. No response yet.',
                followUpFlag: true,
                followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                duration: 0,
                outcome: 'Left Message',
                nextAction: 'Try calling again tomorrow',
                createdBy: 'u1',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            }
        ];
        resolve(mockCallLogs);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/documents
 * Response: ContactDocument[]
 */
export const fetchContactDocuments = async (contactId: string): Promise<ContactDocument[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Mock data
        const mockDocuments: ContactDocument[] = [
            {
                id: 'doc1',
                contactId,
                documentName: 'Mineral Rights Deed - Tract T-001',
                fileType: 'PDF',
                category: 'Deed',
                redFlagStatus: false,
                versionHistory: ['v1.0'],
                dateUploaded: new Date().toISOString(),
                uploadedBy: 'John Smith',
                notes: 'Original title deed for mineral rights in Section 15',
                linkedTracts: ['t1'],
                fileSize: 2048576,
                fileUrl: '/documents/title_deed.pdf',
                originalFileName: 'title_deed.pdf',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'doc2',
                contactId,
                documentName: 'Lease Agreement - 2024',
                fileType: 'DOCX',
                category: 'Lease',
                redFlagStatus: true,
                versionHistory: ['v1.0', 'v1.1'],
                dateUploaded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedBy: 'Jane Doe',
                notes: 'Current lease agreement requiring legal review',
                linkedTracts: ['t1', 't2'],
                fileSize: 1048576,
                fileUrl: '/documents/lease_agreement.docx',
                originalFileName: 'lease_agreement.docx',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'doc3',
                contactId,
                documentName: 'Title Opinion - Legal Review',
                fileType: 'PDF',
                category: 'Title Opinion',
                redFlagStatus: false,
                versionHistory: ['v1.0'],
                dateUploaded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedBy: 'Mike Johnson',
                notes: 'Attorney title opinion for mineral rights verification',
                linkedTracts: ['t1'],
                fileSize: 3145728,
                fileUrl: '/documents/title_opinion.pdf',
                originalFileName: 'title_opinion.pdf',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            }
        ];
        resolve(mockDocuments);
    }, apiDelay));
};

/*
 * GET /api/contacts/:id/distress-signals
 * Response: DistressSignal[]
 */
export const fetchDistressSignals = async (contactId: string): Promise<DistressSignal[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Mock data
        const mockSignals: DistressSignal[] = [
            {
                id: 'ds1',
                contactId,
                signalType: 'Tax Lien',
                signalSource: 'County Court Records',
                dateFlagged: new Date().toISOString(),
                matchConfidence: 95.5,
                matchingAlgorithm: 'Fuzzy name + address matching',
                signalStatus: 'Open',
                riskLevel: 'High',
                internalNotes: 'Tax lien filed for $15,000 in unpaid property taxes',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        ];
        resolve(mockSignals);
    }, apiDelay));
};

// ====== TRACT LEADS ENDPOINTS ======

const populateTractLead = (lead: TractLead): TractLead => {
    const buyer = mockUsers.find(u => u.id === lead.buyerId);
    const tract = mockTracts.find(t => t.id === lead.tractId);
    return { ...lead, buyer, tract };
};

// Old populateLeadNote function removed - using new LeadNote interface

/*
 * GET /api/tracts/:id/leads
 * Response: TractLead[]
 */
export const fetchTractLeads = async (tractId: string): Promise<TractLead[]> => {
    return new Promise(resolve => setTimeout(() => {
        const leads = mockTractLeads
            .filter(lead => lead.tractId === tractId)
            .map(populateTractLead)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(leads);
    }, apiDelay));
};

// Old fetchLeadNotes and createLeadNote functions removed - using new LeadNote interface

/*
 * POST /api/tracts/:id/leads
 * Body: { buyerId: string, leadSource: string }
 * Response: TractLead
 */
export const createTractLead = async (tractId: string, data: { buyerId: string; leadSource: string }): Promise<TractLead> => {
    return new Promise(resolve => setTimeout(() => {
        const newLead: TractLead = {
            id: `tl${Date.now()}`,
            tractId,
            buyerId: data.buyerId,
            status: 'In Progress',
            leadSource: data.leadSource as TractLead['leadSource'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            noteCount: 0,
        };
        mockTractLeads.push(newLead);
        resolve(populateTractLead(newLead));
    }, apiDelay));
};

/*
 * PUT /api/leads/:id/status
 * Body: { status: string }
 * Response: TractLead
 */
export const updateLeadStatus = async (leadId: string, status: TractLead['status']): Promise<TractLead> => {
    return new Promise(resolve => setTimeout(() => {
        const leadIndex = mockTractLeads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) throw new Error("Lead not found");
        
        mockTractLeads[leadIndex] = {
            ...mockTractLeads[leadIndex],
            status,
            updatedAt: new Date().toISOString(),
        };
        resolve(populateTractLead(mockTractLeads[leadIndex]));
    }, apiDelay));
};

// Mock mapping data
let mockTractSpatial: TractSpatial[] = [
    {
        id: 'ts1',
        tractId: 't1',
        latitude: 31.9686,
        longitude: -102.0776,
        geometryType: 'STR',
        geometryData: { str: '15-02S-32E', section: '15', township: '2S', range: '32E' },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'ts2',
        tractId: 't2',
        latitude: 33.9137,
        longitude: -97.0965,
        geometryType: 'STR',
        geometryData: { str: '10-08S-02E', section: '10', township: '8S', range: '2E' },
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'ts3',
        tractId: 't3',
        latitude: 32.7767,
        longitude: -96.7970,
        geometryType: 'Point',
        geometryData: { type: 'Point', coordinates: [-96.7970, 32.7767] },
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
    }
];

let mockProducingWells: ProducingWell[] = [
    {
        id: 'pw1',
        apiNumber: '42-335-12345',
        wellName: 'Smith #1H',
        operator: 'Pioneer Natural Resources',
        latitude: 31.9686,
        longitude: -102.0776,
        status: 'Producing',
        spudDate: '2023-01-15',
        completionDate: '2023-03-20',
        totalDepth: 12000,
        productionData: { '2024-01': { oil: 150, gas: 500, water: 200 }, '2024-02': { oil: 145, gas: 480, water: 220 } },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'pw2',
        apiNumber: '42-335-12346',
        wellName: 'Smith #2H',
        operator: 'Pioneer Natural Resources',
        latitude: 31.9690,
        longitude: -102.0780,
        status: 'Producing',
        spudDate: '2023-02-10',
        completionDate: '2023-04-15',
        totalDepth: 12000,
        productionData: { '2024-01': { oil: 160, gas: 520, water: 180 }, '2024-02': { oil: 155, gas: 500, water: 200 } },
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'pw3',
        apiNumber: '40-439-78901',
        wellName: 'Johnson #1',
        operator: 'Devon Energy',
        latitude: 33.9137,
        longitude: -97.0965,
        status: 'Producing',
        spudDate: '2023-03-05',
        completionDate: '2023-05-10',
        totalDepth: 11000,
        productionData: { '2024-01': { oil: 120, gas: 400, water: 150 }, '2024-02': { oil: 118, gas: 390, water: 160 } },
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
    },
    {
        id: 'pw4',
        apiNumber: '40-439-78902',
        wellName: 'Johnson #2',
        operator: 'Devon Energy',
        latitude: 33.9140,
        longitude: -97.0970,
        status: 'Drilling',
        spudDate: '2024-01-20',
        totalDepth: 8000,
        createdAt: '2024-01-18T13:00:00Z',
        updatedAt: '2024-01-18T13:00:00Z',
    },
    {
        id: 'pw5',
        apiNumber: '48-113-45678',
        wellName: 'Wilson #1H',
        operator: 'EOG Resources',
        latitude: 32.7767,
        longitude: -96.7970,
        status: 'Producing',
        spudDate: '2023-04-12',
        completionDate: '2023-06-18',
        totalDepth: 13000,
        productionData: { '2024-01': { oil: 180, gas: 600, water: 250 }, '2024-02': { oil: 175, gas: 580, water: 270 } },
        createdAt: '2024-01-19T14:00:00Z',
        updatedAt: '2024-01-19T14:00:00Z',
    }
];

let mockPermits: Permit[] = [
    {
        id: 'p1',
        permitNumber: '42-335-12347',
        operator: 'Pioneer Natural Resources',
        latitude: 31.9688,
        longitude: -102.0778,
        permitType: 'Drilling',
        permitDate: '2024-01-15',
        spudDate: '2024-02-01',
        totalDepth: 12000,
        targetFormation: 'Wolfcamp A',
        status: 'Drilling',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'p2',
        permitNumber: '40-439-78903',
        operator: 'Devon Energy',
        latitude: 33.9139,
        longitude: -97.0967,
        permitType: 'Drilling',
        permitDate: '2024-01-20',
        spudDate: '2024-02-05',
        totalDepth: 11000,
        targetFormation: 'Woodford',
        status: 'Approved',
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'p3',
        permitNumber: '48-113-45679',
        operator: 'EOG Resources',
        latitude: 32.7769,
        longitude: -96.7972,
        permitType: 'Recompletion',
        permitDate: '2024-01-25',
        totalDepth: 13000,
        targetFormation: 'Eagle Ford',
        status: 'Pending',
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
    }
];

let mockRigs: Rig[] = [
    {
        id: 'r1',
        rigName: 'Pioneer Rig #15',
        operator: 'Pioneer Natural Resources',
        latitude: 31.9688,
        longitude: -102.0778,
        rigType: 'Land',
        status: 'Active',
        spudDate: '2024-02-01',
        targetCompletion: '2024-04-01',
        totalDepth: 12000,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'r2',
        rigName: 'Devon Rig #8',
        operator: 'Devon Energy',
        latitude: 33.9139,
        longitude: -97.0967,
        rigType: 'Land',
        status: 'Active',
        spudDate: '2024-02-05',
        targetCompletion: '2024-04-05',
        totalDepth: 11000,
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'r3',
        rigName: 'EOG Rig #22',
        operator: 'EOG Resources',
        latitude: 32.7769,
        longitude: -96.7972,
        rigType: 'Land',
        status: 'Moving',
        spudDate: '2024-02-10',
        targetCompletion: '2024-04-10',
        totalDepth: 13000,
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
    }
];

let mockUnits: Unit[] = [
    {
        id: 'unit1',
        unitName: 'Smith Unit #1',
        operator: 'Pioneer Natural Resources',
        apiNumbers: ['42-335-12345', '42-335-12346'],
        targetFormations: ['Wolfcamp A', 'Wolfcamp B'],
        status: 'Producing',
        estimatedGrossAcres: 1280.00,
        estimatedNetAcres: 960.00,
        county: 'Midland',
        state: 'TX',
        linkedTractIds: ['t1', 't2'],
        linkedContactIds: ['c1', 'c2', 'c3'],
        assignedBuyerId: 'u4',
        heldByFund: true,
        exitStrategy: 'Hold',
        isLocked: false,
        notes: 'High-producing unit with excellent Wolfcamp A performance',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'u1',
        updatedBy: 'u1',
    },
    {
        id: 'unit2',
        unitName: 'Johnson Unit #2',
        operator: 'Devon Energy',
        apiNumbers: ['40-439-78901', '40-439-78902'],
        targetFormations: ['Woodford', 'Hunton'],
        status: 'Producing',
        estimatedGrossAcres: 640.00,
        estimatedNetAcres: 480.00,
        county: 'Love',
        state: 'OK',
        linkedTractIds: ['t2'],
        linkedContactIds: ['c4', 'c5'],
        assignedBuyerId: 'u4',
        heldByFund: false,
        exitStrategy: 'Flip',
        isLocked: true,
        notes: 'Unit under due diligence - do not contact landowners',
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
        createdBy: 'u2',
        updatedBy: 'u2',
    },
    {
        id: 'unit3',
        unitName: 'Wilson Unit #3',
        operator: 'EOG Resources',
        apiNumbers: ['48-113-45678'],
        targetFormations: ['Eagle Ford'],
        status: 'Permitted',
        estimatedGrossAcres: 320.00,
        estimatedNetAcres: 240.00,
        county: 'Dallas',
        state: 'TX',
        linkedTractIds: ['t3'],
        linkedContactIds: ['c1', 'c5'],
        assignedBuyerId: undefined,
        heldByFund: false,
        exitStrategy: 'Hold',
        isLocked: false,
        notes: 'Newly permitted unit targeting Eagle Ford formation',
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
        createdBy: 'u2',
        updatedBy: 'u2',
    }
];

// Mock unit assignments data
let mockUnitAssignments: UnitAssignment[] = [
    {
        id: 'ua1',
        unitId: 'unit1',
        buyerId: 'u4',
        assignedBy: 'u1',
        assignedAt: '2024-01-15T10:00:00Z',
        notes: 'Initial assignment for acquisition campaign',
        assignmentStatus: 'In Progress',
        valuationCapUsd: 2500,
        autoGenerateLeads: true,
    },
    {
        id: 'ua2',
        unitId: 'unit2',
        buyerId: 'u4',
        assignedBy: 'u2',
        assignedAt: '2024-01-16T11:00:00Z',
        notes: 'Assignment for due diligence review',
        assignmentStatus: 'Under Review',
        valuationCapUsd: 3000,
        autoGenerateLeads: false,
    }
];

// Mock unit-tract relationships data
let mockUnitTracts: UnitTract[] = [
    {
        id: 'ut1',
        unitId: 'unit1',
        tractId: 't1',
        allocationPercentage: 0.75,
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'ut2',
        unitId: 'unit1',
        tractId: 't2',
        allocationPercentage: 0.25,
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'ut3',
        unitId: 'unit2',
        tractId: 't2',
        allocationPercentage: 1.00,
        createdAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'ut4',
        unitId: 'unit3',
        tractId: 't3',
        allocationPercentage: 1.00,
        createdAt: '2024-01-17T12:00:00Z',
    }
];

// Mock unit-contact relationships data
let mockUnitContacts: UnitContact[] = [
    {
        id: 'uc1',
        unitId: 'unit1',
        contactId: 'c1',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'uc2',
        unitId: 'unit1',
        contactId: 'c2',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'uc3',
        unitId: 'unit1',
        contactId: 'c3',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'uc4',
        unitId: 'unit2',
        contactId: 'c4',
        createdAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'uc5',
        unitId: 'unit2',
        contactId: 'c5',
        createdAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'uc6',
        unitId: 'unit3',
        contactId: 'c1',
        createdAt: '2024-01-17T12:00:00Z',
    },
    {
        id: 'uc7',
        unitId: 'unit3',
        contactId: 'c5',
        createdAt: '2024-01-17T12:00:00Z',
    }
];

// Mock unit notes data
let mockUnitNotes: UnitNote[] = [
    {
        id: 'un1',
        unitId: 'unit1',
        noteText: 'Unit assigned to David Buyer for acquisition campaign',
        noteType: 'Assignment',
        createdBy: 'u1',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'un2',
        unitId: 'unit2',
        noteText: 'Unit locked for due diligence - do not contact landowners',
        noteType: 'Lock/Unlock',
        createdBy: 'u2',
        createdAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'un3',
        unitId: 'unit3',
        noteText: 'New unit created - awaiting operator updates',
        noteType: 'Status Change',
        createdBy: 'u2',
        createdAt: '2024-01-17T12:00:00Z',
    }
];

let mockMapLayerPreferences: MapLayerPreference[] = [
    { id: 'mlp1', userId: 'u1', layerName: 'tract_boundary', isVisible: true, opacity: 1.00, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'mlp2', userId: 'u1', layerName: 'producing_wells', isVisible: true, opacity: 0.80, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'mlp3', userId: 'u1', layerName: 'permits', isVisible: true, opacity: 0.70, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'mlp4', userId: 'u1', layerName: 'rigs', isVisible: true, opacity: 0.90, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'mlp5', userId: 'u1', layerName: 'units', isVisible: false, opacity: 0.60, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
    { id: 'mlp6', userId: 'u1', layerName: 'nearby_tracts', isVisible: true, opacity: 0.50, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' }
];

// ====== MAPPING ENDPOINTS ======

/*
 * GET /api/tracts/:id/spatial
 * Response: TractSpatial
 */
export const fetchTractSpatial = async (tractId: string): Promise<TractSpatial | null> => {
    return new Promise(resolve => setTimeout(() => {
        const spatial = mockTractSpatial.find(ts => ts.tractId === tractId);
        resolve(spatial || null);
    }, apiDelay));
};

/*
 * GET /api/mapping/wells
 * Query: { latitude: number, longitude: number, radius: number }
 * Response: ProducingWell[]
 */
export const fetchNearbyWells = async (latitude: number, longitude: number, radius: number = 10): Promise<ProducingWell[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Simple distance calculation (in a real app, you'd use proper spatial queries)
        const wells = mockProducingWells.filter(well => {
            const distance = Math.sqrt(
                Math.pow(well.latitude - latitude, 2) + 
                Math.pow(well.longitude - longitude, 2)
            ) * 69; // Rough miles conversion
            return distance <= radius;
        });
        resolve(wells);
    }, apiDelay));
};

/*
 * GET /api/mapping/permits
 * Query: { latitude: number, longitude: number, radius: number }
 * Response: Permit[]
 */
export const fetchNearbyPermits = async (latitude: number, longitude: number, radius: number = 10): Promise<Permit[]> => {
    return new Promise(resolve => setTimeout(() => {
        const permits = mockPermits.filter(permit => {
            const distance = Math.sqrt(
                Math.pow(permit.latitude - latitude, 2) + 
                Math.pow(permit.longitude - longitude, 2)
            ) * 69;
            return distance <= radius;
        });
        resolve(permits);
    }, apiDelay));
};

/*
 * GET /api/mapping/rigs
 * Query: { latitude: number, longitude: number, radius: number }
 * Response: Rig[]
 */
export const fetchNearbyRigs = async (latitude: number, longitude: number, radius: number = 10): Promise<Rig[]> => {
    return new Promise(resolve => setTimeout(() => {
        const rigs = mockRigs.filter(rig => {
            const distance = Math.sqrt(
                Math.pow(rig.latitude - latitude, 2) + 
                Math.pow(rig.longitude - longitude, 2)
            ) * 69;
            return distance <= radius;
        });
        resolve(rigs);
    }, apiDelay));
};

/*
 * GET /api/mapping/units
 * Query: { latitude: number, longitude: number, radius: number }
 * Response: Unit[]
 */
export const fetchNearbyUnits = async (latitude: number, longitude: number, radius: number = 10): Promise<Unit[]> => {
    return new Promise(resolve => setTimeout(() => {
        // TODO: Implement proper spatial distance calculation when Unit interface includes coordinates
        // For now, return all units since we don't have lat/lng in the Unit interface
        resolve(mockUnits.map(populateUnit));
    }, apiDelay));
};

/*
 * GET /api/mapping/layer-preferences
 * Response: MapLayerPreference[]
 */
export const fetchMapLayerPreferences = async (): Promise<MapLayerPreference[]> => {
    return new Promise(resolve => setTimeout(() => {
        resolve([...mockMapLayerPreferences]);
    }, apiDelay));
};

/*
 * PUT /api/mapping/layer-preferences/:layerName
 * Body: { isVisible: boolean, opacity: number }
 * Response: MapLayerPreference
 */
export const updateMapLayerPreference = async (layerName: string, data: { isVisible: boolean; opacity: number }): Promise<MapLayerPreference> => {
    return new Promise(resolve => setTimeout(() => {
        const prefIndex = mockMapLayerPreferences.findIndex(p => p.layerName === layerName);
        if (prefIndex === -1) {
            const newPref: MapLayerPreference = {
                id: `mlp${Date.now()}`,
                userId: 'u1', // Mock current user
                layerName,
                isVisible: data.isVisible,
                opacity: data.opacity,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockMapLayerPreferences.push(newPref);
            resolve(newPref);
        } else {
            mockMapLayerPreferences[prefIndex] = {
                ...mockMapLayerPreferences[prefIndex],
                isVisible: data.isVisible,
                opacity: data.opacity,
                updatedAt: new Date().toISOString(),
            };
            resolve(mockMapLayerPreferences[prefIndex]);
        }
    }, apiDelay));
};

/*
 * GET /api/mapping/producing-wells
 * Response: ProducingWell[]
 */
export const fetchProducingWells = async (): Promise<ProducingWell[]> => {
    return new Promise(resolve => setTimeout(() => {
        resolve([
            {
                id: 'w1',
                apiNumber: '42-123-12345',
                wellName: 'Smith #1',
                operator: 'Pioneer Natural Resources',
                latitude: 31.9686,
                longitude: -102.0776,
                status: 'Producing',
                totalDepth: 12000,
                spudDate: '2023-01-15',
                completionDate: '2023-03-20',
                createdAt: '2023-01-15T00:00:00Z',
                updatedAt: '2023-03-20T00:00:00Z'
            },
            {
                id: 'w2',
                apiNumber: '42-123-12346',
                wellName: 'Johnson #2',
                operator: 'Devon Energy',
                latitude: 33.9137,
                longitude: -97.0965,
                status: 'Producing',
                totalDepth: 11500,
                spudDate: '2023-02-10',
                completionDate: '2023-04-15',
                createdAt: '2023-02-10T00:00:00Z',
                updatedAt: '2023-04-15T00:00:00Z'
            },
            {
                id: 'w3',
                apiNumber: '42-123-12347',
                wellName: 'Wilson #3',
                operator: 'EOG Resources',
                latitude: 32.7767,
                longitude: -96.7970,
                status: 'Producing',
                totalDepth: 12500,
                spudDate: '2023-01-20',
                completionDate: '2023-03-25',
                createdAt: '2023-01-20T00:00:00Z',
                updatedAt: '2023-03-25T00:00:00Z'
            }
        ]);
    }, apiDelay));
};

/*
 * GET /api/mapping/permits
 * Response: Permit[]
 */
export const fetchPermits = async (): Promise<Permit[]> => {
    return new Promise(resolve => setTimeout(() => {
        resolve([
            {
                id: 'p1',
                permitNumber: 'P-001',
                operator: 'Pioneer Natural Resources',
                latitude: 31.9686,
                longitude: -102.0776,
                permitType: 'Drilling',
                status: 'Approved',
                targetFormation: 'Wolfcamp A',
                totalDepth: 12000,
                permitDate: '2023-01-10',
                createdAt: '2023-01-10T00:00:00Z',
                updatedAt: '2023-01-10T00:00:00Z'
            },
            {
                id: 'p2',
                permitNumber: 'P-002',
                operator: 'Devon Energy',
                latitude: 33.9137,
                longitude: -97.0965,
                permitType: 'Drilling',
                status: 'Pending',
                targetFormation: 'Woodford',
                totalDepth: 11500,
                permitDate: '2023-02-05',
                createdAt: '2023-02-05T00:00:00Z',
                updatedAt: '2023-02-05T00:00:00Z'
            },
            {
                id: 'p3',
                permitNumber: 'P-003',
                operator: 'EOG Resources',
                latitude: 32.7767,
                longitude: -96.7970,
                permitType: 'Drilling',
                status: 'Approved',
                targetFormation: 'Eagle Ford',
                totalDepth: 12500,
                permitDate: '2023-01-15',
                createdAt: '2023-01-15T00:00:00Z',
                updatedAt: '2023-01-15T00:00:00Z'
            }
        ]);
    }, apiDelay));
};

/*
 * GET /api/mapping/rigs
 * Response: Rig[]
 */
export const fetchRigs = async (): Promise<Rig[]> => {
    return new Promise(resolve => setTimeout(() => {
        resolve([
            {
                id: 'r1',
                rigName: 'Rig Alpha',
                operator: 'Pioneer Natural Resources',
                latitude: 31.9686,
                longitude: -102.0776,
                status: 'Active',
                rigType: 'Land',
                totalDepth: 8000,
                spudDate: '2023-01-15',
                targetCompletion: '2023-03-20',
                createdAt: '2023-01-15T00:00:00Z',
                updatedAt: '2023-01-15T00:00:00Z'
            },
            {
                id: 'r2',
                rigName: 'Rig Beta',
                operator: 'Devon Energy',
                latitude: 33.9137,
                longitude: -97.0965,
                status: 'Moving',
                rigType: 'Land',
                totalDepth: 0,
                createdAt: '2023-02-10T00:00:00Z',
                updatedAt: '2023-02-10T00:00:00Z'
            },
            {
                id: 'r3',
                rigName: 'Rig Gamma',
                operator: 'EOG Resources',
                latitude: 32.7767,
                longitude: -96.7970,
                status: 'Active',
                rigType: 'Land',
                totalDepth: 6000,
                spudDate: '2023-01-20',
                targetCompletion: '2023-03-25',
                createdAt: '2023-01-20T00:00:00Z',
                updatedAt: '2023-01-20T00:00:00Z'
            }
        ]);
    }, apiDelay));
};

// ====== UNITS ENDPOINTS ======

// Helper functions to populate unit data
const populateUnit = (unit: Unit): Unit => {
    const assignedBuyer = unit.assignedBuyerId ? mockUsers.find(u => u.id === unit.assignedBuyerId) : undefined;
    const createdByUser = mockUsers.find(u => u.id === unit.createdBy);
    const updatedByUser = mockUsers.find(u => u.id === unit.updatedBy);
    return { ...unit, assignedBuyer, createdByUser, updatedByUser };
};

const populateUnitAssignment = (assignment: UnitAssignment): UnitAssignment => {
    const buyer = mockUsers.find(u => u.id === assignment.buyerId);
    const assignedByUser = mockUsers.find(u => u.id === assignment.assignedBy);
    const removedByUser = assignment.removedBy ? mockUsers.find(u => u.id === assignment.removedBy) : undefined;
    return { ...assignment, buyer, assignedByUser, removedByUser };
};

const populateUnitTract = (unitTract: UnitTract): UnitTract => {
    const tract = mockTracts.find(t => t.id === unitTract.tractId);
    return { ...unitTract, tract };
};

const populateUnitContact = (unitContact: UnitContact): UnitContact => {
    const contact = mockContacts.find(c => c.id === unitContact.contactId);
    return { ...unitContact, contact };
};

const populateUnitNote = (note: UnitNote): UnitNote => {
    const createdByUser = mockUsers.find(u => u.id === note.createdBy);
    return { ...note, createdByUser };
};

/*
 * GET /api/units
 * Query: UnitFilters
 * Response: Unit[]
 */
export const fetchUnits = async (filters?: UnitFilters): Promise<Unit[]> => {
    return new Promise(resolve => setTimeout(() => {
        let filteredUnits = [...mockUnits];
        
        if (filters) {
            if (filters.operator) {
                filteredUnits = filteredUnits.filter(u => 
                    u.operator.toLowerCase().includes(filters.operator!.toLowerCase())
                );
            }
            if (filters.formation) {
                filteredUnits = filteredUnits.filter(u => 
                    u.targetFormations.some(f => 
                        f.toLowerCase().includes(filters.formation!.toLowerCase())
                    )
                );
            }
            if (filters.county) {
                filteredUnits = filteredUnits.filter(u => 
                    u.county.toLowerCase().includes(filters.county!.toLowerCase())
                );
            }
            if (filters.status) {
                filteredUnits = filteredUnits.filter(u => u.status === filters.status);
            }
            if (filters.assignedBuyer) {
                filteredUnits = filteredUnits.filter(u => u.assignedBuyerId === filters.assignedBuyer);
            }
            if (filters.heldByFund !== undefined) {
                filteredUnits = filteredUnits.filter(u => u.heldByFund === filters.heldByFund);
            }
            if (filters.isLocked !== undefined) {
                filteredUnits = filteredUnits.filter(u => u.isLocked === filters.isLocked);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredUnits = filteredUnits.filter(u => 
                    u.unitName.toLowerCase().includes(searchLower) ||
                    u.apiNumbers.some(api => api.includes(searchLower))
                );
            }
        }
        
        const populatedUnits = filteredUnits.map(populateUnit);
        resolve(populatedUnits);
    }, apiDelay));
};

/*
 * GET /api/units/:id
 * Response: Unit
 */
export const fetchUnit = async (id: string): Promise<Unit | null> => {
    return new Promise(resolve => setTimeout(() => {
        const unit = mockUnits.find(u => u.id === id);
        resolve(unit ? populateUnit(unit) : null);
    }, apiDelay));
};

/*
 * POST /api/units
 * Body: Omit<Unit, 'id' | 'assignedBuyer' | 'createdByUser' | 'updatedByUser' | 'createdAt' | 'updatedAt'>
 * Response: Unit
 */
export const createUnit = async (data: Omit<Unit, 'id' | 'assignedBuyer' | 'createdByUser' | 'updatedByUser' | 'createdAt' | 'updatedAt'>): Promise<Unit> => {
    return new Promise(resolve => setTimeout(() => {
        const newUnit: Unit = {
            ...data,
            id: `unit${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'u1', // Mock current user
            updatedBy: 'u1', // Mock current user
        };
        mockUnits.push(newUnit);
        resolve(populateUnit(newUnit));
    }, apiDelay));
};

/*
 * PUT /api/units/:id
 * Body: Partial<Omit<Unit, 'id' | 'assignedBuyer' | 'createdByUser' | 'updatedByUser' | 'createdAt' | 'updatedAt'>>
 * Response: Unit
 */
export const updateUnit = async (id: string, data: Partial<Omit<Unit, 'id' | 'assignedBuyer' | 'createdByUser' | 'updatedByUser' | 'createdAt' | 'updatedAt'>>): Promise<Unit> => {
    return new Promise(resolve => setTimeout(() => {
        const unitIndex = mockUnits.findIndex(u => u.id === id);
        if (unitIndex === -1) throw new Error("Unit not found");
        
        const updatedUnit: Unit = {
            ...mockUnits[unitIndex],
            ...data,
            id,
            updatedAt: new Date().toISOString(),
            updatedBy: 'u1', // Mock current user
        };
        mockUnits[unitIndex] = updatedUnit;
        resolve(populateUnit(updatedUnit));
    }, apiDelay));
};

/*
 * DELETE /api/units/:id
 * Response: 204 No Content
 */
export const deleteUnit = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(() => {
        mockUnits = mockUnits.filter(u => u.id !== id);
        // Also remove related data
        mockUnitAssignments = mockUnitAssignments.filter(ua => ua.unitId !== id);
        mockUnitTracts = mockUnitTracts.filter(ut => ut.unitId !== id);
        mockUnitContacts = mockUnitContacts.filter(uc => uc.unitId !== id);
        mockUnitNotes = mockUnitNotes.filter(un => un.unitId !== id);
        resolve();
    }, apiDelay));
};

/*
 * GET /api/units/:id/assignments
 * Response: UnitAssignment[]
 */
export const fetchUnitAssignments = async (unitId: string): Promise<UnitAssignment[]> => {
    return new Promise(resolve => setTimeout(() => {
        const assignments = mockUnitAssignments
            .filter(ua => ua.unitId === unitId)
            .map(populateUnitAssignment)
            .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
        resolve(assignments);
    }, apiDelay));
};

/*
 * POST /api/units/:id/assign
 * Body: { buyerId: string, notes?: string, assignmentStatus: string, valuationCapUsd: number, autoGenerateLeads: boolean }
 * Response: UnitAssignment
 */
export const assignUnit = async (unitId: string, data: { 
  buyerId: string; 
  notes?: string; 
  assignmentStatus?: string;
  valuationCapUsd?: number;
  autoGenerateLeads?: boolean;
}): Promise<UnitAssignment> => {
    return new Promise(resolve => setTimeout(() => {
        // Create new assignment
        const newAssignment: UnitAssignment = {
            id: `ua${Date.now()}`,
            unitId,
            buyerId: data.buyerId,
            assignedBy: 'u1', // Mock current user
            assignedAt: new Date().toISOString(),
            notes: data.notes,
            assignmentStatus: (data.assignmentStatus as any) || 'In Progress',
            valuationCapUsd: data.valuationCapUsd || 2500,
            autoGenerateLeads: data.autoGenerateLeads !== false, // Default to true
        };
        mockUnitAssignments.push(newAssignment);
        
        // Update unit assignment
        const unitIndex = mockUnits.findIndex(u => u.id === unitId);
        if (unitIndex !== -1) {
            mockUnits[unitIndex].assignedBuyerId = data.buyerId;
            mockUnits[unitIndex].updatedAt = new Date().toISOString();
            mockUnits[unitIndex].updatedBy = 'u1';
        }
        
        resolve(populateUnitAssignment(newAssignment));
    }, apiDelay));
};

/*
 * PUT /api/units/:id/unassign
 * Body: { notes?: string }
 * Response: UnitAssignment
 */
export const unassignUnit = async (unitId: string, notes?: string): Promise<UnitAssignment> => {
    return new Promise(resolve => setTimeout(() => {
        // Find the current active assignment
        const assignmentIndex = mockUnitAssignments.findIndex(ua => 
            ua.unitId === unitId && !ua.removedAt
        );
        
        if (assignmentIndex === -1) throw new Error("No active assignment found");
        
        // Mark assignment as removed
        mockUnitAssignments[assignmentIndex] = {
            ...mockUnitAssignments[assignmentIndex],
            removedBy: 'u1', // Mock current user
            removedAt: new Date().toISOString(),
            notes: notes || mockUnitAssignments[assignmentIndex].notes,
        };
        
        // Remove unit assignment
        const unitIndex = mockUnits.findIndex(u => u.id === unitId);
        if (unitIndex !== -1) {
            mockUnits[unitIndex].assignedBuyerId = undefined;
            mockUnits[unitIndex].updatedAt = new Date().toISOString();
            mockUnits[unitIndex].updatedBy = 'u1';
        }
        
        resolve(populateUnitAssignment(mockUnitAssignments[assignmentIndex]));
    }, apiDelay));
};

/*
 * GET /api/units/:id/tracts
 * Response: UnitTract[]
 */
export const fetchUnitTracts = async (unitId: string): Promise<UnitTract[]> => {
    return new Promise(resolve => setTimeout(() => {
        const unitTracts = mockUnitTracts
            .filter(ut => ut.unitId === unitId)
            .map(populateUnitTract);
        resolve(unitTracts);
    }, apiDelay));
};

/*
 * GET /api/units/:id/tracts/enhanced
 * Response: UnitTractEnhanced[]
 * Enhanced version with comprehensive tract information for Linked Tracts tab
 */
export const fetchUnitTractsEnhanced = async (unitId: string): Promise<UnitTractEnhanced[]> => {
    return new Promise(resolve => setTimeout(() => {
        const unitTracts = mockUnitTracts.filter(ut => ut.unitId === unitId);
        
        const enhancedTracts: UnitTractEnhanced[] = unitTracts.map(ut => {
            const tract = mockTracts.find(t => t.id === ut.tractId);
            if (!tract) {
                // Return minimal data if tract not found
                return {
                    id: ut.id,
                    unitId: ut.unitId,
                    tractId: ut.tractId,
                    tractName: 'Unknown Tract',
                    grossAcres: 0,
                    titleStatus: 'Unmapped' as TitleStatus,
                    hasTitleChain: false,
                    hasContacts: false,
                    allocationPercentage: ut.allocationPercentage,
                    createdAt: ut.createdAt,
                };
            }
            
            // Get last activity from leads and notes
            let lastActivity: string | undefined;
            const tractLeads = mockLeads.filter(lead => lead.tractId === tract.id);
            const tractNotes = mockContactNotes.filter(note => note.tractId === tract.id);
            
            if (tractLeads.length > 0 || tractNotes.length > 0) {
                const allActivities = [
                    ...tractLeads.map(lead => ({ date: lead.updatedAt, type: 'lead' })),
                    ...tractNotes.map(note => ({ date: note.createdAt, type: 'note' }))
                ];
                
                const sortedActivities = allActivities.sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                
                if (sortedActivities.length > 0) {
                    lastActivity = sortedActivities[0].date;
                }
            }
            
            // Check if title chain and contacts exist
            const hasTitleChain = tract.titleStatus !== 'Unmapped';
            const hasContacts = mockContactTractOwnership.some(cto => cto.tractId === tract.id);
            
            return {
                id: ut.id,
                unitId: ut.unitId,
                tractId: ut.tractId,
                tract,
                tractName: tract.tractName,
                str: tract.str,
                grossAcres: tract.grossAcres,
                netMineralAcres: tract.netMineralAcres,
                royalty: tract.royalty,
                nra: tract.nra,
                titleStatus: tract.titleStatus,
                assignedBuyerId: tract.assignedBuyerId,
                assignedBuyer: tract.assignedBuyerId ? mockUsers.find(u => u.id === tract.assignedBuyerId) : undefined,
                lastActivity,
                hasTitleChain,
                hasContacts,
                allocationPercentage: ut.allocationPercentage,
                createdAt: ut.createdAt,
            };
        });
        
        resolve(enhancedTracts);
    }, apiDelay));
};

/*
 * GET /api/units/:id/notes
 * Response: UnitNote[]
 */
export const fetchUnitNotes = async (unitId: string): Promise<UnitNote[]> => {
    return new Promise(resolve => setTimeout(() => {
        const notes = mockUnitNotes
            .filter(note => note.unitId === unitId)
            .map(populateUnitNote)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(notes);
    }, apiDelay));
};

/*
 * POST /api/units/:id/notes
 * Body: { noteText: string, noteType: string }
 * Response: UnitNote
 */
export const createUnitNote = async (unitId: string, data: { noteText: string; noteType: string }): Promise<UnitNote> => {
    return new Promise(resolve => setTimeout(() => {
        const newNote: UnitNote = {
            id: `un${Date.now()}`,
            unitId,
            noteText: data.noteText,
            noteType: data.noteType as UnitNote['noteType'],
            createdBy: 'u1', // Mock current user
            createdAt: new Date().toISOString(),
        };
        mockUnitNotes.push(newNote);
        resolve(populateUnitNote(newNote));
    }, apiDelay));
};

/*
 * PUT /api/units/:id/lock
 * Body: { isLocked: boolean, notes?: string }
 * Response: Unit
 */
export const updateUnitLock = async (unitId: string, data: { isLocked: boolean; notes?: string }): Promise<Unit> => {
    return new Promise(resolve => setTimeout(() => {
        const unitIndex = mockUnits.findIndex(u => u.id === unitId);
        if (unitIndex === -1) throw new Error("Unit not found");
        
        mockUnits[unitIndex] = {
            ...mockUnits[unitIndex],
            isLocked: data.isLocked,
            updatedAt: new Date().toISOString(),
            updatedBy: 'u1', // Mock current user
        };
        
        // Add note about lock status change
        if (data.notes) {
            const newNote: UnitNote = {
                id: `un${Date.now()}`,
                unitId,
                noteText: data.notes,
                noteType: 'Lock/Unlock',
                createdBy: 'u1', // Mock current user
                createdAt: new Date().toISOString(),
            };
            mockUnitNotes.push(newNote);
        }
        
        resolve(populateUnit(mockUnits[unitIndex]));
    }, apiDelay));
};

// Mock assignment data
let mockAssignments: Assignment[] = [
    {
        id: 'assign1',
        assetType: 'Tract',
        assetId: 't1',
        assignedBuyerId: 'u4',
        priceCapUsd: 15000.00,
        priceCapType: 'Per NRA',
        sourceChannel: 'Broker',
        priorityScore: 85,
        status: 'Active',
        notes: 'High priority - recent permitting activity in area',
        assignedDate: '2024-01-15T10:00:00Z',
        assignedById: 'u1',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'assign2',
        assetType: 'Tract',
        assetId: 't2',
        assignedBuyerId: 'u4',
        priceCapUsd: 8000.00,
        priceCapType: 'Per Acre',
        sourceChannel: 'Inbound',
        priorityScore: 70,
        status: 'Active',
        notes: 'Direct landowner contact - ready to discuss',
        assignedDate: '2024-01-16T11:00:00Z',
        assignedById: 'u2',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'assign3',
        assetType: 'Unit',
        assetId: 'unit1',
        assignedBuyerId: 'u4',
        priceCapUsd: 12000.00,
        priceCapType: 'Per NRA',
        sourceChannel: 'Broker',
        priorityScore: 90,
        status: 'Active',
        notes: 'Premium unit with proven production',
        assignedDate: '2024-01-17T12:00:00Z',
        assignedById: 'u1',
        updatedAt: '2024-01-17T12:00:00Z',
    },
    {
        id: 'assign4',
        assetType: 'Unit',
        assetId: 'unit2',
        assignedBuyerId: 'u4',
        priceCapUsd: 6000.00,
        priceCapType: 'Per Acre',
        sourceChannel: 'Outbound',
        priorityScore: 60,
        status: 'Active',
        notes: 'Development opportunity - needs due diligence',
        assignedDate: '2024-01-18T13:00:00Z',
        assignedById: 'u2',
        updatedAt: '2024-01-18T13:00:00Z',
    }
];

// Mock assignment history data
let mockAssignmentHistory: AssignmentHistory[] = [
    {
        id: 'ah1',
        assignmentId: 'assign1',
        actionType: 'Created',
        actionDetails: 'Initial assignment for acquisition campaign',
        actionTimestamp: '2024-01-15T10:00:00Z',
        actionById: 'u1',
    },
    {
        id: 'ah2',
        assignmentId: 'assign2',
        actionType: 'Created',
        actionDetails: 'Assignment for direct outreach',
        actionTimestamp: '2024-01-16T11:00:00Z',
        actionById: 'u2',
    },
    {
        id: 'ah3',
        assignmentId: 'assign3',
        actionType: 'Created',
        actionDetails: 'Premium unit assignment',
        actionTimestamp: '2024-01-17T12:00:00Z',
        actionById: 'u1',
    },
    {
        id: 'ah4',
        assignmentId: 'assign4',
        actionType: 'Created',
        actionDetails: 'Development opportunity assignment',
        actionTimestamp: '2024-01-18T13:00:00Z',
        actionById: 'u2',
    }
];

// Helper functions for assignments
const populateAssignment = (assignment: Assignment): Assignment => {
    const assignedBuyer = mockUsers.find(u => u.id === assignment.assignedBuyerId);
    const assignedBy = mockUsers.find(u => u.id === assignment.assignedById);
    const asset = assignment.assetType === 'Tract' 
        ? mockTracts.find(t => t.id === assignment.assetId)
        : mockUnits.find(u => u.id === assignment.assetId);
    
    return { ...assignment, assignedBuyer, assignedBy, asset };
};

const populateAssignmentHistory = (history: AssignmentHistory): AssignmentHistory => {
    const actionBy = mockUsers.find(u => u.id === history.actionById);
    return { ...history, actionBy };
};

/*
 * GET /api/assignments
 * Query: AssignmentFilters
 * Response: Assignment[]
 */
export const fetchAssignments = async (filters?: AssignmentFilters): Promise<Assignment[]> => {
    return new Promise(resolve => setTimeout(() => {
        let filteredAssignments = [...mockAssignments];
        
        if (filters) {
            if (filters.assetType) {
                filteredAssignments = filteredAssignments.filter(a => a.assetType === filters.assetType);
            }
            if (filters.assetId) {
                filteredAssignments = filteredAssignments.filter(a => a.assetId === filters.assetId);
            }
            if (filters.assignedBuyerId) {
                filteredAssignments = filteredAssignments.filter(a => a.assignedBuyerId === filters.assignedBuyerId);
            }
            if (filters.sourceChannel) {
                filteredAssignments = filteredAssignments.filter(a => a.sourceChannel === filters.sourceChannel);
            }
            if (filters.status) {
                filteredAssignments = filteredAssignments.filter(a => a.status === filters.status);
            }
            if (filters.priorityMin !== undefined) {
                filteredAssignments = filteredAssignments.filter(a => a.priorityScore >= filters.priorityMin!);
            }
            if (filters.priorityMax !== undefined) {
                filteredAssignments = filteredAssignments.filter(a => a.priorityScore <= filters.priorityMax!);
            }
            if (filters.assignedDateFrom) {
                filteredAssignments = filteredAssignments.filter(a => a.assignedDate >= filters.assignedDateFrom!);
            }
            if (filters.assignedDateTo) {
                filteredAssignments = filteredAssignments.filter(a => a.assignedDate <= filters.assignedDateTo!);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredAssignments = filteredAssignments.filter(a => 
                    a.notes?.toLowerCase().includes(searchLower) ||
                    a.assetId.toLowerCase().includes(searchLower)
                );
            }
        }
        
        const populatedAssignments = filteredAssignments.map(populateAssignment);
        resolve(populatedAssignments);
    }, apiDelay));
};

/*
 * GET /api/assignments/:id
 * Response: Assignment
 */
export const fetchAssignment = async (id: string): Promise<Assignment | null> => {
    return new Promise(resolve => setTimeout(() => {
        const assignment = mockAssignments.find(a => a.id === id);
        resolve(assignment ? populateAssignment(assignment) : null);
    }, apiDelay));
};

/*
 * POST /api/assignments
 * Body: CreateAssignmentData
 * Response: Assignment
 */
export const createAssignment = async (data: CreateAssignmentData): Promise<Assignment> => {
    return new Promise(resolve => setTimeout(() => {
        const newAssignment: Assignment = {
            ...data,
            id: `assign${Date.now()}`,
            status: 'Active',
            assignedDate: new Date().toISOString(),
            assignedById: 'u1', // Mock current user
            updatedAt: new Date().toISOString(),
        };
        mockAssignments.push(newAssignment);
        
        // Create history record
        const historyRecord: AssignmentHistory = {
            id: `ah${Date.now()}`,
            assignmentId: newAssignment.id,
            actionType: 'Created',
            actionDetails: 'Assignment created',
            actionTimestamp: new Date().toISOString(),
            actionById: 'u1',
        };
        mockAssignmentHistory.push(historyRecord);
        
        resolve(populateAssignment(newAssignment));
    }, apiDelay));
};

/*
 * PUT /api/assignments/:id
 * Body: UpdateAssignmentData
 * Response: Assignment
 */
export const updateAssignment = async (id: string, data: UpdateAssignmentData): Promise<Assignment> => {
    return new Promise(resolve => setTimeout(() => {
        const assignmentIndex = mockAssignments.findIndex(a => a.id === id);
        if (assignmentIndex === -1) throw new Error("Assignment not found");
        
        const updatedAssignment: Assignment = {
            ...mockAssignments[assignmentIndex],
            ...data,
            id,
            updatedAt: new Date().toISOString(),
        };
        mockAssignments[assignmentIndex] = updatedAssignment;
        
        // Create history record
        const historyRecord: AssignmentHistory = {
            id: `ah${Date.now()}`,
            assignmentId: id,
            actionType: 'Updated',
            actionDetails: 'Assignment updated',
            actionTimestamp: new Date().toISOString(),
            actionById: 'u1',
        };
        mockAssignmentHistory.push(historyRecord);
        
        resolve(populateAssignment(updatedAssignment));
    }, apiDelay));
};

/*
 * DELETE /api/assignments/:id
 * Response: void
 */
export const deleteAssignment = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(() => {
        const assignmentIndex = mockAssignments.findIndex(a => a.id === id);
        if (assignmentIndex === -1) throw new Error("Assignment not found");
        
        // Create history record before deletion
        const historyRecord: AssignmentHistory = {
            id: `ah${Date.now()}`,
            assignmentId: id,
            actionType: 'Cancelled',
            actionDetails: 'Assignment cancelled',
            actionTimestamp: new Date().toISOString(),
            actionById: 'u1',
        };
        mockAssignmentHistory.push(historyRecord);
        
        mockAssignments.splice(assignmentIndex, 1);
        resolve();
    }, apiDelay));
};

/*
 * GET /api/assignments/:id/history
 * Response: AssignmentHistory[]
 */
export const fetchAssignmentHistory = async (assignmentId: string): Promise<AssignmentHistory[]> => {
    return new Promise(resolve => setTimeout(() => {
        const history = mockAssignmentHistory.filter(h => h.assignmentId === assignmentId);
        const populatedHistory = history.map(populateAssignmentHistory);
        resolve(populatedHistory);
    }, apiDelay));
};

/*
 * POST /api/assignments/bulk
 * Body: CreateAssignmentData[]
 * Response: Assignment[]
 */
export const createBulkAssignments = async (data: CreateAssignmentData[]): Promise<Assignment[]> => {
    return new Promise(resolve => setTimeout(() => {
        const newAssignments: Assignment[] = data.map((item, index) => ({
            ...item,
            id: `assign${Date.now()}-${index}`,
            status: 'Active',
            assignedDate: new Date().toISOString(),
            assignedById: 'u1', // Mock current user
            updatedAt: new Date().toISOString(),
        }));
        
        mockAssignments.push(...newAssignments);
        
        // Create history records for each assignment
        newAssignments.forEach(assignment => {
            const historyRecord: AssignmentHistory = {
                id: `ah${Date.now()}-${Math.random()}`,
                assignmentId: assignment.id,
                actionType: 'Created',
                actionDetails: 'Bulk assignment created',
                actionTimestamp: new Date().toISOString(),
                actionById: 'u1',
            };
            mockAssignmentHistory.push(historyRecord);
        });
        
        const populatedAssignments = newAssignments.map(populateAssignment);
        resolve(populatedAssignments);
    }, apiDelay));
};

// ====== LEAD MANAGEMENT ENDPOINTS ======

// Mock lead data
let mockLeads: LeadEnhanced[] = [
    {
        id: 'lead1',
        linkedContactId: 'c1',
        linkedTractIds: ['t1'],
        linkedUnitIds: [],
        buyerId: 'u4',
        sourceChannel: 'Broker',
        status: 'Spoke',
        priorityScore: 85,
        lastContactDate: '2024-01-15',
        nextFollowUpDate: '2024-01-22',
        notes: 'Contacted landowner - interested in discussing mineral rights sale',
        outreachCount: 2,
        documentLinks: [],
        assignmentId: 'assign1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'lead2',
        linkedContactId: 'c2',
        linkedTractIds: ['t2'],
        linkedUnitIds: [],
        buyerId: 'u4',
        sourceChannel: 'Inbound',
        status: 'Interested',
        priorityScore: 70,
        lastContactDate: '2024-01-16',
        nextFollowUpDate: '2024-01-23',
        notes: 'Landowner reached out directly - ready to move forward',
        outreachCount: 1,
        documentLinks: [],
        assignmentId: 'assign2',
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'lead3',
        linkedContactId: 'c3',
        linkedTractIds: [],
        linkedUnitIds: ['unit1'],
        buyerId: 'u4',
        sourceChannel: 'Broker',
        status: 'Uncontacted',
        priorityScore: 90,
        lastContactDate: undefined,
        nextFollowUpDate: '2024-01-20',
        notes: 'Premium unit lead - needs initial outreach',
        outreachCount: 0,
        documentLinks: [],
        assignmentId: 'assign3',
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
    },
    {
        id: 'lead4',
        linkedContactId: 'c4',
        linkedTractIds: [],
        linkedUnitIds: ['unit2'],
        buyerId: 'u4',
        sourceChannel: 'Outbound',
        status: 'LOI Sent',
        priorityScore: 60,
        lastContactDate: '2024-01-17',
        nextFollowUpDate: '2024-01-24',
        notes: 'LOI sent - waiting for response',
        outreachCount: 3,
        documentLinks: ['https://example.com/loi1.pdf'],
        assignmentId: 'assign4',
        createdAt: '2024-01-18T13:00:00Z',
        updatedAt: '2024-01-18T13:00:00Z',
    }
];

// Mock lead call logs data
let mockLeadCallLogs: LeadCallLog[] = [
    {
        id: 'cl1',
        leadId: 'lead1',
        callDate: '2024-01-15T10:30:00Z',
        outcome: 'Spoke',
        notes: 'Had good conversation about mineral rights',
        nextSteps: 'Follow up next week with offer details',
        loggedById: 'u4',
    },
    {
        id: 'cl2',
        leadId: 'lead2',
        callDate: '2024-01-16T14:15:00Z',
        outcome: 'Interested',
        notes: 'Landowner is motivated seller',
        nextSteps: 'Send LOI within 48 hours',
        loggedById: 'u4',
    },
    {
        id: 'cl3',
        leadId: 'lead4',
        callDate: '2024-01-17T09:45:00Z',
        outcome: 'Spoke',
        notes: 'Discussed terms and sent LOI',
        nextSteps: 'Wait for LOI response',
        loggedById: 'u4',
    }
];

// Mock lead notes data
let mockLeadNotes: LeadNote[] = [
    {
        id: 'ln1',
        leadId: 'lead1',
        noteText: 'Landowner has 160 net mineral acres in high-value area',
        noteType: 'Important',
        createdBy: 'u4',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'ln2',
        leadId: 'lead2',
        noteText: 'Direct contact - no broker fees involved',
        noteType: 'General',
        createdBy: 'u4',
        createdAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'ln3',
        leadId: 'lead3',
        noteText: 'Premium unit with proven production history',
        noteType: 'Important',
        createdBy: 'u4',
        createdAt: '2024-01-17T12:00:00Z',
    },
    {
        id: 'ln4',
        leadId: 'lead4',
        noteText: 'Development opportunity - needs due diligence',
        noteType: 'General',
        createdBy: 'u4',
        createdAt: '2024-01-18T13:00:00Z',
    }
];

// Helper functions for leads
const populateLead = (lead: Lead): Lead => {
    const linkedContact = mockContacts.find(c => c.id === lead.linkedContactId);
    const linkedTracts = lead.linkedTractIds.map(id => mockTracts.find(t => t.id === id)).filter(Boolean) as Tract[];
    const linkedUnits = lead.linkedUnitIds.map(id => mockUnits.find(u => u.id === id)).filter(Boolean) as Unit[];
    const buyer = mockUsers.find(u => u.id === lead.buyerId);
    const assignment = lead.assignmentId ? mockAssignments.find(a => a.id === lead.assignmentId) : undefined;
    
    return { ...lead, linkedContact, linkedTracts, linkedUnits, buyer, assignment };
};

const populateLeadCallLog = (callLog: LeadCallLog): LeadCallLog => {
    const loggedBy = mockUsers.find(u => u.id === callLog.loggedById);
    return { ...callLog, loggedBy };
};

const populateLeadNote = (note: LeadNote): LeadNote => {
    const createdBy = mockUsers.find(u => u.id === note.createdById);
    return { ...note, createdBy };
};

/*
 * GET /api/leads
 * Query: LeadFilters
 * Response: Lead[]
 */
export const fetchLeads = async (filters?: LeadFilters): Promise<Lead[]> => {
    return new Promise(resolve => setTimeout(() => {
        let filteredLeads = [...mockLeads];
        
        if (filters) {
            if (filters.status) {
                filteredLeads = filteredLeads.filter(l => l.status === filters.status);
            }
            if (filters.county) {
                filteredLeads = filteredLeads.filter(l => {
                    const tract = l.linkedTractIds.length > 0 ? mockTracts.find(t => t.id === l.linkedTractIds[0]) : undefined;
                    const unit = l.linkedUnitIds.length > 0 ? mockUnits.find(u => u.id === l.linkedUnitIds[0]) : undefined;
                    return tract?.county === filters.county || unit?.county === filters.county;
                });
            }
            if (filters.tractId) {
                filteredLeads = filteredLeads.filter(l => l.linkedTractIds.includes(filters.tractId!));
            }
            if (filters.unitId) {
                filteredLeads = filteredLeads.filter(l => l.linkedUnitIds.includes(filters.unitId!));
            }
            if (filters.buyerId) {
                filteredLeads = filteredLeads.filter(l => l.buyerId === filters.buyerId);
            }
            if (filters.sourceChannel) {
                filteredLeads = filteredLeads.filter(l => l.sourceChannel === filters.sourceChannel);
            }
            if (filters.priorityMin !== undefined) {
                filteredLeads = filteredLeads.filter(l => l.priorityScore >= filters.priorityMin!);
            }
            if (filters.priorityMax !== undefined) {
                filteredLeads = filteredLeads.filter(l => l.priorityScore <= filters.priorityMax!);
            }
            if (filters.lastContactFrom) {
                filteredLeads = filteredLeads.filter(l => l.lastContactDate && l.lastContactDate >= filters.lastContactFrom!);
            }
            if (filters.lastContactTo) {
                filteredLeads = filteredLeads.filter(l => l.lastContactDate && l.lastContactDate <= filters.lastContactTo!);
            }
            if (filters.nextFollowUpFrom) {
                filteredLeads = filteredLeads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate >= filters.nextFollowUpFrom!);
            }
            if (filters.nextFollowUpTo) {
                filteredLeads = filteredLeads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate <= filters.nextFollowUpTo!);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredLeads = filteredLeads.filter(l => 
                    l.notes?.toLowerCase().includes(searchLower) ||
                    l.linkedContact?.name.toLowerCase().includes(searchLower)
                );
            }
        }
        
        const populatedLeads = filteredLeads.map(populateLead);
        resolve(populatedLeads);
    }, apiDelay));
};

/*
 * GET /api/leads/:id
 * Response: Lead
 */
export const fetchLead = async (id: string): Promise<Lead | null> => {
    return new Promise(resolve => setTimeout(() => {
        const lead = mockLeads.find(l => l.id === id);
        resolve(lead ? populateLead(lead) : null);
    }, apiDelay));
};

/*
 * POST /api/leads
 * Body: CreateLeadData
 * Response: Lead
 */
export const createLead = async (data: CreateLeadData): Promise<Lead> => {
    return new Promise(resolve => setTimeout(() => {
        const newLead: Lead = {
            ...data,
            id: `lead${Date.now()}`,
            status: 'Uncontacted',
            outreachCount: 0,
            documentLinks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockLeads.push(newLead);
        resolve(populateLead(newLead));
    }, apiDelay));
};

/*
 * PUT /api/leads/:id
 * Body: UpdateLeadData
 * Response: Lead
 */
export const updateLead = async (id: string, data: UpdateLeadData): Promise<Lead> => {
    return new Promise(resolve => setTimeout(() => {
        const leadIndex = mockLeads.findIndex(l => l.id === id);
        if (leadIndex === -1) throw new Error("Lead not found");
        
        const updatedLead: Lead = {
            ...mockLeads[leadIndex],
            ...data,
            id,
            updatedAt: new Date().toISOString(),
        };
        mockLeads[leadIndex] = updatedLead;
        resolve(populateLead(updatedLead));
    }, apiDelay));
};

/*
 * DELETE /api/leads/:id
 * Response: void
 */
export const deleteLead = async (id: string): Promise<void> => {
    return new Promise(resolve => setTimeout(() => {
        mockLeads = mockLeads.filter(l => l.id !== id);
        // Also remove related data
        mockLeadCallLogs = mockLeadCallLogs.filter(cl => cl.leadId !== id);
        mockLeadNotes = mockLeadNotes.filter(ln => ln.leadId !== id);
        resolve();
    }, apiDelay));
};

/*
 * GET /api/leads/:id/call-logs
 * Response: LeadCallLog[]
 */
export const fetchLeadCallLogs = async (leadId: string): Promise<LeadCallLog[]> => {
    return new Promise(resolve => setTimeout(() => {
        const callLogs = mockLeadCallLogs
            .filter(cl => cl.leadId === leadId)
            .map(populateLeadCallLog)
            .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime());
        resolve(callLogs);
    }, apiDelay));
};

/*
 * POST /api/leads/:id/call-logs
 * Body: CreateCallLogData
 * Response: LeadCallLog
 */
export const createLeadCallLog = async (leadId: string, data: CreateCallLogData): Promise<LeadCallLog> => {
    return new Promise(resolve => setTimeout(() => {
        const newCallLog: LeadCallLog = {
            ...data,
            id: `cl${Date.now()}`,
            leadId,
            callDate: new Date().toISOString(),
            loggedById: 'u4', // Mock current user
        };
        mockLeadCallLogs.push(newCallLog);
        
        // Update lead's last contact date and outreach count
        const leadIndex = mockLeads.findIndex(l => l.id === leadId);
        if (leadIndex !== -1) {
            mockLeads[leadIndex].lastContactDate = new Date().toISOString().split('T')[0];
            mockLeads[leadIndex].outreachCount += 1;
            mockLeads[leadIndex].updatedAt = new Date().toISOString();
        }
        
        resolve(populateLeadCallLog(newCallLog));
    }, apiDelay));
};

/*
 * GET /api/leads/:id/notes
 * Response: LeadNote[]
 */
export const fetchLeadNotes = async (leadId: string): Promise<LeadNote[]> => {
    return new Promise(resolve => setTimeout(() => {
        const notes = mockLeadNotes
            .filter(note => note.leadId === leadId)
            .map(populateLeadNote)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(notes);
    }, apiDelay));
};

/*
 * POST /api/leads/:id/notes
 * Body: CreateLeadNoteData
 * Response: LeadNote
 */
export const createLeadNote = async (leadId: string, data: CreateLeadNoteData): Promise<LeadNote> => {
    return new Promise(resolve => setTimeout(() => {
        const newNote: LeadNote = {
            ...data,
            id: `ln${Date.now()}`,
            leadId,
            noteType: data.noteType || 'General',
            createdById: 'u4', // Mock current user
            createdAt: new Date().toISOString(),
        };
        mockLeadNotes.push(newNote);
        resolve(populateLeadNote(newNote));
    }, apiDelay));
};

/*
 * GET /api/units/:id/contacts
 * Response: UnitContact[]
 */
export const fetchUnitContacts = async (unitId: string): Promise<UnitContact[]> => {
    return new Promise(resolve => setTimeout(() => {
        const unitContacts = mockUnitContacts
            .filter(uc => uc.unitId === unitId)
            .map(populateUnitContact);
        resolve(unitContacts);
    }, apiDelay));
};

/*
 * GET /api/units/:id/contacts/aggregated
 * Response: UnitContactAggregated[]
 * Returns aggregated contact data with economic interest and outreach status
 */
export const fetchUnitContactsAggregated = async (unitId: string): Promise<UnitContactAggregated[]> => {
    return new Promise(resolve => setTimeout(() => {
        // Get all unit contacts for this unit
        const unitContacts = mockUnitContacts.filter(uc => uc.unitId === unitId);
        
        // Get all tracts linked to this unit
        const unitTracts = mockUnitTracts.filter(ut => ut.unitId === unitId);
        const tractIds = unitTracts.map(ut => ut.tractId);
        
        // Get all contact-tract ownership records for tracts in this unit
        const ownershipRecords = mockContactTractOwnership.filter(cto => 
            tractIds.includes(cto.tractId)
        );
        
        // Group ownership records by contact
        const contactOwnershipMap = new Map<string, typeof ownershipRecords>();
        ownershipRecords.forEach(cto => {
            if (!contactOwnershipMap.has(cto.contactId)) {
                contactOwnershipMap.set(cto.contactId, []);
            }
            contactOwnershipMap.get(cto.contactId)!.push(cto);
        });
        
        // Create aggregated contact data
        const aggregatedContacts: UnitContactAggregated[] = Array.from(contactOwnershipMap.entries()).map(([contactId, ownerships]) => {
            // Calculate weighted averages and totals
            let totalNMA = 0;
            let totalOwnershipWeighted = 0;
            let totalRoyaltyWeighted = 0;
            let totalNRA = 0;
            const tractsOwned: string[] = [];
            
            ownerships.forEach(ownership => {
                const tract = mockTracts.find(t => t.id === ownership.tractId);
                if (tract) {
                    const nma = (ownership.nma || 0);
                    totalNMA += nma;
                    totalOwnershipWeighted += nma * (ownership.ownershipPercentage || 0);
                    totalRoyaltyWeighted += nma * (ownership.royaltyPercentage || 0);
                    totalNRA += (ownership.nra || 0);
                    
                    if (!tractsOwned.includes(ownership.tractId)) {
                        tractsOwned.push(ownership.tractId);
                    }
                }
            });
            
            // Calculate weighted percentages
            const ownershipPercentageWeighted = totalNMA > 0 ? totalOwnershipWeighted / totalNMA : 0;
            const royaltyPercentageWeighted = totalNMA > 0 ? totalRoyaltyWeighted / totalNMA : 0;
            
            // Determine lead status and last outreach
            const unitLeads = mockLeads.filter(lead => 
                lead.linkedContactId === contactId && 
                (lead.linkedTractIds.some(tractId => tractIds.includes(tractId)) || 
                 lead.linkedUnitIds.includes(unitId))
            );
            
                    const hasActiveLeads = unitLeads.some(lead => lead.status === 'Uncontacted' || lead.status === 'Spoke' || lead.status === 'Interested');
        const leadStatus: 'Open' | 'Closed' | 'Unassigned' = 
            hasActiveLeads ? 'Open' : 
            unitLeads.length > 0 ? 'Closed' : 'Unassigned';
            
            // Get last outreach date from lead notes or contact logs
            let lastOutreach: string | undefined;
            if (unitLeads.length > 0) {
                const sortedLeads = unitLeads.sort((a, b) => 
                    new Date(b.lastContactDate || 0).getTime() - new Date(a.lastContactDate || 0).getTime()
                );
                lastOutreach = sortedLeads[0].lastContactDate;
            }
            
            return {
                id: `uca${contactId}`,
                unitId,
                contactId,
                ownershipPercentageWeighted,
                royaltyPercentageWeighted,
                totalNMA,
                totalNRA,
                tractsOwned,
                lastOutreach,
                leadStatus,
                hasActiveLeads,
                createdAt: new Date().toISOString(),
            };
        });
        
        // Populate contact information
        const populatedContacts = aggregatedContacts.map(contact => ({
            ...contact,
            contact: mockContacts.find(c => c.id === contact.contactId),
        }));
        
        resolve(populatedContacts);
    }, apiDelay));
};

// Mapping Integration Module API Functions

/**
 * Fetch map assets (tracts and units) with geometry data
 */
export const fetchMapAssets = async (filters?: MapFilter): Promise<MapAsset[]> => {
  return new Promise(resolve => setTimeout(() => {
    // Convert tracts to map assets
    const tractAssets: MapAsset[] = mockTracts.map(tract => ({
      id: `tract-${tract.id}`,
      assetType: 'Tract' as const,
      asset: tract,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [tract.latitude || -96.5, tract.longitude || 35.5],
          [tract.latitude || -96.4, tract.longitude || 35.5],
          [tract.latitude || -96.4, tract.longitude || 35.4],
          [tract.latitude || -96.5, tract.longitude || 35.4],
          [tract.latitude || -96.5, tract.longitude || 35.5]
        ]]
      },
      status: tract.assignedBuyerId ? 'Assigned' : 'Unassigned',
      assignedBuyerId: tract.assignedBuyerId,
      assignedBuyer: tract.assignedBuyer,
      priceCapUsd: tract.nraCapUsd,
      county: tract.county,
      state: tract.state,
      grossAcres: tract.grossAcres,
      netAcres: tract.netMineralAcres,
      titleStatus: tract.titleStatus,
      lastActivity: tract.updatedAt
    }));

    // Convert units to map assets
    const unitAssets: MapAsset[] = mockUnits.map(unit => ({
      id: `unit-${unit.id}`,
      assetType: 'Unit' as const,
      asset: unit,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [unit.latitude || -96.5, unit.longitude || 35.5],
          [unit.latitude || -96.4, unit.longitude || 35.5],
          [unit.latitude || -96.4, unit.longitude || 35.4],
          [unit.latitude || -96.5, unit.longitude || 35.4],
          [unit.latitude || -96.5, unit.longitude || 35.5]
        ]]
      },
      status: unit.assignedBuyerId ? 'Assigned' : 'Unassigned',
      assignedBuyerId: unit.assignedBuyerId,
      assignedBuyer: unit.assignedBuyer,
      operator: unit.operator,
      formation: unit.targetFormations[0],
      county: unit.county,
      state: unit.state,
      grossAcres: unit.estimatedGrossAcres,
      netAcres: unit.estimatedNetAcres,
      lastActivity: unit.updatedAt
    }));

    let allAssets = [...tractAssets, ...unitAssets];

    // Apply filters if provided
    if (filters) {
      if (filters.county) {
        allAssets = allAssets.filter(asset => asset.county === filters.county);
      }
      if (filters.state) {
        allAssets = allAssets.filter(asset => asset.state === filters.state);
      }
      if (filters.operator) {
        allAssets = allAssets.filter(asset => asset.operator === filters.operator);
      }
      if (filters.assignmentStatus && filters.assignmentStatus !== 'All') {
        allAssets = allAssets.filter(asset => asset.status === filters.assignmentStatus);
      }
      if (filters.assetType && filters.assetType !== 'All') {
        allAssets = allAssets.filter(asset => asset.assetType === filters.assetType);
      }
      if (filters.priceCapMin) {
        allAssets = allAssets.filter(asset => (asset.priceCapUsd || 0) >= filters.priceCapMin!);
      }
      if (filters.priceCapMax) {
        allAssets = allAssets.filter(asset => (asset.priceCapUsd || 0) <= filters.priceCapMax!);
      }
    }

    resolve(allAssets);
  }, apiDelay));
};

/**
 * Fetch map layer configurations
 */
export const fetchMapLayerConfigs = async (): Promise<MapLayerConfig[]> => {
  return new Promise(resolve => setTimeout(() => {
    const configs: MapLayerConfig[] = [
      {
        id: 'basemap-streets',
        name: 'streets',
        displayName: 'Streets',
        type: 'basemap',
        isVisible: true,
        opacity: 1.0,
        order: 1,
        source: 'ArcGIS',
        metadata: {
          description: 'Street map base layer',
          attribution: 'Esri',
          updateFrequency: 'Weekly'
        }
      },
      {
        id: 'basemap-satellite',
        name: 'satellite',
        displayName: 'Satellite',
        type: 'basemap',
        isVisible: false,
        opacity: 1.0,
        order: 2,
        source: 'ArcGIS',
        metadata: {
          description: 'Satellite imagery base layer',
          attribution: 'Esri',
          updateFrequency: 'Monthly'
        }
      },
      {
        id: 'overlay-counties',
        name: 'counties',
        displayName: 'County Boundaries',
        type: 'overlay',
        isVisible: true,
        opacity: 0.3,
        order: 3,
        source: 'ArcGIS',
        metadata: {
          description: 'County boundary lines',
          attribution: 'US Census Bureau',
          updateFrequency: 'Annually'
        }
      },
      {
        id: 'overlay-townships',
        name: 'townships',
        displayName: 'Township Lines',
        type: 'overlay',
        isVisible: false,
        opacity: 0.2,
        order: 4,
        source: 'ArcGIS',
        metadata: {
          description: 'PLSS township and range lines',
          attribution: 'BLM',
          updateFrequency: 'Annually'
        }
      }
    ];
    resolve(configs);
  }, apiDelay));
};

/**
 * Fetch map overlays (heatmaps, clustering, etc.)
 */
export const fetchMapOverlays = async (): Promise<MapOverlay[]> => {
  return new Promise(resolve => setTimeout(() => {
    const overlays: MapOverlay[] = [
      {
        id: 'heatmap-permits',
        name: 'Permit Activity',
        type: 'heatmap',
        data: mockPermits.map(permit => ({
          latitude: permit.latitude,
          longitude: permit.longitude,
          value: 1,
          status: permit.status
        })),
        isVisible: false,
        opacity: 0.7,
        colorScheme: 'red',
        legend: {
          title: 'Permit Activity Heatmap',
          items: [
            { label: 'Low Activity', color: '#ffebee', value: 1 },
            { label: 'Medium Activity', color: '#ef5350', value: 5 },
            { label: 'High Activity', color: '#c62828', value: 10 }
          ]
        }
      },
      {
        id: 'heatmap-production',
        name: 'Production Activity',
        type: 'heatmap',
        data: mockProducingWells.map(well => ({
          latitude: well.latitude,
          longitude: well.longitude,
          value: 1,
          status: well.status
        })),
        isVisible: false,
        opacity: 0.7,
        colorScheme: 'green',
        legend: {
          title: 'Production Activity Heatmap',
          items: [
            { label: 'Low Production', color: '#e8f5e8', value: 1 },
            { label: 'Medium Production', color: '#66bb6a', value: 5 },
            { label: 'High Production', color: '#2e7d32', value: 10 }
          ]
        }
      }
    ];
    resolve(overlays);
  }, apiDelay));
};

/**
 * Create a new map selection
 */
export const createMapSelection = async (selection: Omit<MapSelection, 'id' | 'createdAt'>): Promise<MapSelection> => {
  return new Promise(resolve => setTimeout(() => {
    const newSelection: MapSelection = {
      ...selection,
      id: `selection-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    resolve(newSelection);
  }, apiDelay));
};

/**
 * Log map interaction
 */
export const logMapInteraction = async (interaction: Omit<MapInteraction, 'id' | 'timestamp'>): Promise<MapInteraction> => {
  return new Promise(resolve => setTimeout(() => {
    const newInteraction: MapInteraction = {
      ...interaction,
      id: `interaction-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    resolve(newInteraction);
  }, apiDelay));
};

/**
 * Export map data
 */
export const exportMapData = async (exportData: Omit<MapExport, 'id' | 'exportDate' | 'status'>): Promise<MapExport> => {
  return new Promise(resolve => setTimeout(() => {
    const newExport: MapExport = {
      ...exportData,
      id: `export-${Date.now()}`,
      exportDate: new Date().toISOString(),
      status: 'Processing'
    };
    
    // Simulate processing delay
    setTimeout(() => {
      newExport.status = 'Completed';
      newExport.downloadUrl = `/api/exports/${newExport.id}/download`;
    }, 2000);
    
    resolve(newExport);
  }, apiDelay));
};

/**
 * Get available filter options for mapping
 */
export const getMapFilterOptions = async () => {
  return new Promise(resolve => setTimeout(() => {
    const counties = [...new Set(mockTracts.map(t => t.county))];
    const states = [...new Set(mockTracts.map(t => t.state))];
    const operators = [...new Set(mockUnits.map(u => u.operator))];
    const formations = [...new Set(mockUnits.flatMap(u => u.targetFormations))];
    
    resolve({
      counties,
      states,
      operators,
      formations,
      basins: ['Anadarko', 'Permian', 'Eagle Ford', 'Haynesville'],
      assignmentStatuses: ['Unassigned', 'Assigned', 'In Negotiation', 'Under Review', 'Completed'],
      assetTypes: ['Tract', 'Unit']
    });
  }, apiDelay));
};

// ====== TASK MANAGEMENT API FUNCTIONS ======

/**
 * Fetch tasks with optional filtering
 */
export const fetchTasks = async (filters?: TaskFilter): Promise<Task[]> => {
  return new Promise(resolve => setTimeout(() => {
    let filteredTasks = [...mockTasks];
    
    if (filters) {
      if (filters.userId) {
        filteredTasks = filteredTasks.filter(task => task.userId === filters.userId);
      }
      if (filters.taskType) {
        filteredTasks = filteredTasks.filter(task => task.taskType === filters.taskType);
      }
      if (filters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
      }
      if (filters.dueDateFrom) {
        filteredTasks = filteredTasks.filter(task => new Date(task.dueDate) >= filters.dueDateFrom!);
      }
      if (filters.dueDateTo) {
        filteredTasks = filteredTasks.filter(task => new Date(task.dueDate) <= filters.dueDateTo!);
      }
      if (filters.relatedContactId) {
        filteredTasks = filteredTasks.filter(task => task.relatedContactId === filters.relatedContactId);
      }
      if (filters.relatedLeadId) {
        filteredTasks = filteredTasks.filter(task => task.relatedLeadId === filters.relatedLeadId);
      }
      if (filters.relatedDealId) {
        filteredTasks = filteredTasks.filter(task => task.relatedDealId === filters.relatedDealId);
      }
      if (filters.relatedAssignmentId) {
        filteredTasks = filteredTasks.filter(task => task.relatedAssignmentId === filters.relatedAssignmentId);
      }
    }
    
    resolve(filteredTasks);
  }, apiDelay));
};

/**
 * Fetch a single task by ID
 */
export const fetchTaskById = async (taskId: string): Promise<Task | null> => {
  return new Promise(resolve => setTimeout(() => {
    const task = mockTasks.find(task => task.id === taskId);
    resolve(task || null);
  }, apiDelay));
};

/**
 * Create a new task
 */
export const createTask = async (taskData: CreateTaskRequest): Promise<Task> => {
  return new Promise(resolve => setTimeout(() => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...taskData,
      status: 'Open',
      createdBy: 'current-user', // In real app, get from auth context
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockTasks.push(newTask);
    resolve(newTask);
  }, apiDelay));
};

/**
 * Update an existing task
 */
export const updateTask = async (taskId: string, updates: UpdateTaskRequest): Promise<Task> => {
  return new Promise(resolve => setTimeout(() => {
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const updatedTask = {
      ...mockTasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    // Handle completion
    if (updates.status === 'Complete') {
      updatedTask.completedAt = new Date();
    }
    
    mockTasks[taskIndex] = updatedTask;
    resolve(updatedTask);
  }, apiDelay));
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  return new Promise(resolve => setTimeout(() => {
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    mockTasks.splice(taskIndex, 1);
    resolve();
  }, apiDelay));
};

/**
 * Fetch task statistics
 */
export const fetchTaskStatistics = async (userId?: string): Promise<TaskStatistics> => {
  return new Promise(resolve => setTimeout(() => {
    let tasks = mockTasks;
    if (userId) {
      tasks = tasks.filter(task => task.userId === userId);
    }
    
    const total = tasks.length;
    const open = tasks.filter(t => t.status === 'Open').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const complete = tasks.filter(t => t.status === 'Complete').length;
    const overdue = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      return t.status !== 'Complete' && dueDate < now;
    }).length;
    
    const byPriority = {
      low: tasks.filter(t => t.priority === 'Low').length,
      medium: tasks.filter(t => t.priority === 'Medium').length,
      high: tasks.filter(t => t.priority === 'High').length
    };
    
    const byType = {
      call: tasks.filter(t => t.taskType === 'Call').length,
      email: tasks.filter(t => t.taskType === 'Email').length,
      internal: tasks.filter(t => t.taskType === 'Internal').length,
      deadline: tasks.filter(t => t.taskType === 'Deadline').length,
      reminder: tasks.filter(t => t.taskType === 'Reminder').length
    };
    
    resolve({
      total,
      open,
      inProgress,
      complete,
      overdue,
      byPriority,
      byType
    });
  }, apiDelay));
};

// ====== CALENDAR API FUNCTIONS ======

/**
 * Fetch calendar events for a date range
 */
export const fetchCalendarEvents = async (startDate: Date, endDate: Date, userId?: string): Promise<CalendarEvent[]> => {
  return new Promise(resolve => setTimeout(() => {
    let events = [...mockCalendarEvents];
    
    if (userId) {
      events = events.filter(event => event.userId === userId);
    }
    
    // Filter by date range
    events = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= endDate && eventEnd >= startDate;
    });
    
    resolve(events);
  }, apiDelay));
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  return new Promise(resolve => setTimeout(() => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      ...eventData
    };
    
    mockCalendarEvents.push(newEvent);
    resolve(newEvent);
  }, apiDelay));
};

// Mock data for tasks
const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    taskType: 'Call',
    subject: 'Follow up on LOI expiration',
    description: 'Contact John Smith regarding LOI that expires next week',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    dueTime: '14:00',
    status: 'Open',
    priority: 'High',
    notes: 'LOI expires on Friday',
    relatedContactId: 'contact-1',
    relatedLeadId: 'lead-1',
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'task-2',
    userId: 'user-2',
    taskType: 'Email',
    subject: 'Send property valuation report',
    description: 'Email the updated valuation report to the client',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
    dueTime: '10:00',
    status: 'In Progress',
    priority: 'Medium',
    notes: 'Include recent comps',
    relatedContactId: 'contact-2',
    relatedDealId: 'deal-1',
    createdBy: 'user-2',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'task-3',
    userId: 'user-1',
    taskType: 'Deadline',
    subject: 'LOI submission deadline',
    description: 'Submit LOI for the Johnson property',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    dueTime: '17:00',
    status: 'Open',
    priority: 'High',
    notes: 'Final review needed before submission',
    relatedLeadId: 'lead-2',
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'task-4',
    userId: 'user-3',
    taskType: 'Internal',
    subject: 'Review title chain documents',
    description: 'Review and validate title chain for the Williams tract',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago (overdue)
    dueTime: '16:00',
    status: 'Overdue',
    priority: 'Medium',
    notes: 'Waiting for additional documents',
    relatedAssignmentId: 'assignment-1',
    createdBy: 'user-3',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'task-5',
    userId: 'user-2',
    taskType: 'Reminder',
    subject: 'Schedule site visit',
    description: 'Schedule site visit for the new acquisition',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    dueTime: '11:00',
    status: 'Open',
    priority: 'Low',
    notes: 'Coordinate with engineering team',
    relatedDealId: 'deal-2',
    createdBy: 'user-2',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

// Mock data for calendar events
const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Follow up on LOI expiration',
    description: 'Contact John Smith regarding LOI that expires next week',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    allDay: false,
    taskId: 'task-1',
    relatedObjectId: 'contact-1',
    relatedObjectType: 'Contact',
    color: '#EF4444', // Red for high priority
    userId: 'user-1'
  },
  {
    id: 'event-2',
    title: 'Send property valuation report',
    description: 'Email the updated valuation report to the client',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
    allDay: false,
    taskId: 'task-2',
    relatedObjectId: 'contact-2',
    relatedObjectType: 'Contact',
    color: '#F59E0B', // Yellow for medium priority
    userId: 'user-2'
  },
  {
    id: 'event-3',
    title: 'LOI submission deadline',
    description: 'Submit LOI for the Johnson property',
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    allDay: true,
    taskId: 'task-3',
    relatedObjectId: 'lead-2',
    relatedObjectType: 'Lead',
    color: '#EF4444', // Red for high priority
    userId: 'user-1'
  }
];
