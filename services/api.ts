
import type { User, Role, Privilege, Tract, Contact, ContactTractOwnership, ContactNote, Lead, TractLead, LeadNote, TractSpatial, ProducingWell, Permit, Rig, Unit, UnitAssignment, UnitTract, UnitContact, UnitNote, UnitFilters, MapLayerPreference } from '../types';

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
    }
];

// Mock contacts data
let mockContacts: Contact[] = [
    {
        id: 'c1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Oklahoma City, OK 73101',
        entityType: 'Individual',
        legalName: 'John Smith',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'c2',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 234-5678',
        address: '456 Oak Ave, Tulsa, OK 74101',
        entityType: 'Individual',
        legalName: 'Sarah Johnson',
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z',
    },
    {
        id: 'c3',
        name: 'ABC Minerals LLC',
        email: 'contact@abcminerals.com',
        phone: '(555) 345-6789',
        address: '789 Business Blvd, Oklahoma City, OK 73102',
        entityType: 'Entity',
        legalName: 'ABC Minerals LLC, a Delaware Limited Liability Company',
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z',
    },
    {
        id: 'c4',
        name: 'Robert Wilson',
        email: 'rob.wilson@email.com',
        phone: '(555) 456-7890',
        address: '321 Pine St, Edmond, OK 73034',
        entityType: 'Individual',
        legalName: 'Robert Wilson',
        createdAt: '2024-01-18T13:00:00Z',
        updatedAt: '2024-01-18T13:00:00Z',
    },
    {
        id: 'c5',
        name: 'XYZ Energy Corp',
        email: 'info@xyzenergy.com',
        phone: '(555) 567-8901',
        address: '654 Corporate Dr, Oklahoma City, OK 73103',
        entityType: 'Entity',
        legalName: 'XYZ Energy Corporation, a Texas Corporation',
        createdAt: '2024-01-19T14:00:00Z',
        updatedAt: '2024-01-19T14:00:00Z',
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

// Mock leads data
let mockLeads: Lead[] = [
    {
        id: 'l1',
        contactId: 'c1',
        tractId: 't1',
        status: 'In Progress',
        leadType: 'Acquisition',
        priority: 'High',
        assignedTo: 'u2',
        notes: 'High priority lead - contact has significant mineral acreage',
        createdBy: 'u1',
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-01-20T09:00:00Z',
    },
    {
        id: 'l2',
        contactId: 'c2',
        tractId: 't1',
        status: 'Open',
        leadType: 'Acquisition',
        priority: 'Medium',
        assignedTo: 'u2',
        notes: 'Initial contact made, follow-up needed',
        createdBy: 'u1',
        createdAt: '2024-01-21T10:00:00Z',
        updatedAt: '2024-01-21T10:00:00Z',
    },
    {
        id: 'l3',
        contactId: 'c3',
        tractId: 't1',
        status: 'Qualified',
        leadType: 'Acquisition',
        priority: 'High',
        assignedTo: 'u1',
        notes: 'Entity contact, complex ownership structure',
        createdBy: 'u2',
        createdAt: '2024-01-22T11:00:00Z',
        updatedAt: '2024-01-22T11:00:00Z',
    },
    {
        id: 'l4',
        contactId: 'c4',
        tractId: 't2',
        status: 'Open',
        leadType: 'Lease',
        priority: 'Low',
        assignedTo: 'u2',
        notes: 'Contact interested in leasing options',
        createdBy: 'u1',
        createdAt: '2024-01-23T12:00:00Z',
        updatedAt: '2024-01-23T12:00:00Z',
    }
];

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

// Mock lead notes data
let mockLeadNotes: LeadNote[] = [
    // Lead 1 (In Progress) - David Buyer
    {
        id: 'ln1',
        leadId: 'tl1',
        noteText: 'Initial contact made via phone. Contact expressed interest in selling mineral rights. Discussed basic terms and timeline.',
        outreachMethod: 'Phone Call',
        createdBy: 'u4',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'ln2',
        leadId: 'tl1',
        noteText: 'Follow-up email sent with detailed offer package. Included NRA calculations and market analysis.',
        outreachMethod: 'Email',
        createdBy: 'u4',
        createdAt: '2024-01-18T14:00:00Z',
    },
    {
        id: 'ln3',
        leadId: 'tl1',
        noteText: 'Meeting scheduled for next week to discuss acquisition terms and due diligence process.',
        outreachMethod: 'Meeting',
        createdBy: 'u4',
        createdAt: '2024-01-22T11:00:00Z',
    },
    {
        id: 'ln4',
        leadId: 'tl1',
        noteText: 'Contact requested additional documentation before proceeding. Sent title chain summary and ownership verification.',
        outreachMethod: 'Email',
        createdBy: 'u4',
        createdAt: '2024-01-25T14:30:00Z',
    },

    // Lead 2 (Closed) - Bob Manager
    {
        id: 'ln5',
        leadId: 'tl2',
        noteText: 'Initial outreach call made. Contact was not interested in selling at this time.',
        outreachMethod: 'Phone Call',
        createdBy: 'u2',
        createdAt: '2024-01-10T09:00:00Z',
    },
    {
        id: 'ln6',
        leadId: 'tl2',
        noteText: 'Follow-up call to check if circumstances have changed. Still not interested.',
        outreachMethod: 'Phone Call',
        createdBy: 'u2',
        createdAt: '2024-01-12T16:00:00Z',
    },

    // Lead 3 (Converted) - David Buyer
    {
        id: 'ln7',
        leadId: 'tl3',
        noteText: 'Contact referred by existing client. High interest in selling mineral rights.',
        outreachMethod: 'Phone Call',
        createdBy: 'u4',
        createdAt: '2024-01-05T11:00:00Z',
    },
    {
        id: 'ln8',
        leadId: 'tl3',
        noteText: 'Deal terms agreed upon. Moving to contract phase.',
        outreachMethod: 'Meeting',
        createdBy: 'u4',
        createdAt: '2024-01-15T13:00:00Z',
    },
    {
        id: 'ln9',
        leadId: 'tl3',
        noteText: 'Contract signed and deal closed successfully.',
        outreachMethod: 'Meeting',
        createdBy: 'u4',
        createdAt: '2024-01-20T15:00:00Z',
    },

    // Lead 4 (In Progress) - David Buyer
    {
        id: 'ln10',
        leadId: 'tl4',
        noteText: 'Initial contact made. Contact is considering selling but needs more information.',
        outreachMethod: 'Phone Call',
        createdBy: 'u4',
        createdAt: '2024-01-18T13:00:00Z',
    },
    {
        id: 'ln11',
        leadId: 'tl4',
        noteText: 'Sent detailed property analysis and comparable sales data.',
        outreachMethod: 'Email',
        createdBy: 'u4',
        createdAt: '2024-01-24T10:00:00Z',
    },

    // Lead 5 (Closed) - Bob Manager
    {
        id: 'ln12',
        leadId: 'tl5',
        noteText: 'Cold outreach via phone. Contact was not interested in selling.',
        outreachMethod: 'Phone Call',
        createdBy: 'u2',
        createdAt: '2024-01-14T11:00:00Z',
    },

    // Lead 6 (In Progress) - David Buyer
    {
        id: 'ln13',
        leadId: 'tl6',
        noteText: 'Initial contact made. Contact is interested but needs to consult with family members.',
        outreachMethod: 'Phone Call',
        createdBy: 'u4',
        createdAt: '2024-01-20T16:00:00Z',
    },
    {
        id: 'ln14',
        leadId: 'tl6',
        noteText: 'Follow-up call scheduled for next month after family discussion.',
        outreachMethod: 'Phone Call',
        createdBy: 'u4',
        createdAt: '2024-01-26T09:00:00Z',
    }
];


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

const populateLead = (lead: Lead): Lead => {
    const contact = mockContacts.find(c => c.id === lead.contactId);
    const tract = mockTracts.find(t => t.id === lead.tractId);
    const assignedToUser = lead.assignedTo ? mockUsers.find(u => u.id === lead.assignedTo) : undefined;
    const createdByUser = mockUsers.find(u => u.id === lead.createdBy);
    return { ...lead, contact, tract, assignedToUser, createdByUser };
};

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
export const fetchContactLeads = async (contactId: string, tractId: string): Promise<Lead[]> => {
    return new Promise(resolve => setTimeout(() => {
        const leads = mockLeads
            .filter(lead => lead.contactId === contactId && lead.tractId === tractId)
            .map(populateLead);
        resolve(leads);
    }, apiDelay));
};

/*
 * POST /api/leads
 * Body: { contactId: string, tractId: string, leadType: string, priority: string, notes?: string }
 * Response: Lead
 */
export const createLead = async (data: { contactId: string; tractId: string; leadType: string; priority: string; notes?: string }): Promise<Lead> => {
    return new Promise(resolve => setTimeout(() => {
        const newLead: Lead = {
            id: `l${Date.now()}`,
            contactId: data.contactId,
            tractId: data.tractId,
            status: 'Open',
            leadType: data.leadType as Lead['leadType'],
            priority: data.priority as Lead['priority'],
            notes: data.notes,
            createdBy: 'u1', // Mock current user
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockLeads.push(newLead);
        resolve(populateLead(newLead));
    }, apiDelay));
};

/*
 * GET /api/contacts
 * Response: Contact[]
 */
export const fetchContacts = async (): Promise<Contact[]> => {
    return new Promise(resolve => setTimeout(() => {
        resolve([...mockContacts]);
    }, apiDelay));
};

/*
 * POST /api/contacts
 * Body: { name: string, email?: string, phone?: string, address?: string, entityType: string, legalName: string }
 * Response: Contact
 */
export const createContact = async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
    return new Promise(resolve => setTimeout(() => {
        const newContact: Contact = {
            ...data,
            id: `c${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        mockContacts.push(newContact);
        resolve(newContact);
    }, apiDelay));
};

// ====== TRACT LEADS ENDPOINTS ======

const populateTractLead = (lead: TractLead): TractLead => {
    const buyer = mockUsers.find(u => u.id === lead.buyerId);
    const tract = mockTracts.find(t => t.id === lead.tractId);
    return { ...lead, buyer, tract };
};

const populateLeadNote = (note: LeadNote): LeadNote => {
    const createdByUser = mockUsers.find(u => u.id === note.createdBy);
    return { ...note, createdByUser };
};

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
 * Body: { noteText: string, outreachMethod: string }
 * Response: LeadNote
 */
export const createLeadNote = async (leadId: string, data: { noteText: string; outreachMethod: string }): Promise<LeadNote> => {
    return new Promise(resolve => setTimeout(() => {
        const newNote: LeadNote = {
            id: `ln${Date.now()}`,
            leadId,
            noteText: data.noteText,
            outreachMethod: data.outreachMethod as LeadNote['outreachMethod'],
            createdBy: 'u1', // Mock current user
            createdAt: new Date().toISOString(),
        };
        mockLeadNotes.push(newNote);
        resolve(populateLeadNote(newNote));
    }, apiDelay));
};

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
    },
    {
        id: 'ua2',
        unitId: 'unit2',
        buyerId: 'u4',
        assignedBy: 'u2',
        assignedAt: '2024-01-16T11:00:00Z',
        notes: 'Assignment for due diligence review',
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
        const units = mockUnits.filter(unit => {
            const distance = Math.sqrt(
                Math.pow(unit.latitude - latitude, 2) + 
                Math.pow(unit.longitude - longitude, 2)
            ) * 69;
            return distance <= radius;
        });
        resolve(units);
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
 * Body: { buyerId: string, notes?: string }
 * Response: UnitAssignment
 */
export const assignUnit = async (unitId: string, data: { buyerId: string; notes?: string }): Promise<UnitAssignment> => {
    return new Promise(resolve => setTimeout(() => {
        // Create new assignment
        const newAssignment: UnitAssignment = {
            id: `ua${Date.now()}`,
            unitId,
            buyerId: data.buyerId,
            assignedBy: 'u1', // Mock current user
            assignedAt: new Date().toISOString(),
            notes: data.notes,
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
