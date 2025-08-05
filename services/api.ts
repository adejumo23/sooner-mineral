
import type { User, Role, Privilege, Tract } from '../types';

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
