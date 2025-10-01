// Ticket API service for handling ticket-related operations
// Note: Using mock implementations for frontend build

// Ticket types
export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category_id: string;
  priority_id: string;
  status_id: string;
  reporter_id: string;
  assignee_id?: string;
  module_name?: string;
  page_url?: string;
  browser_info?: string;
  user_agent?: string;
  screenshot_url?: string;
  attachments?: any[];
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  comments?: TicketComment[];
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface TicketPriority {
  id: string;
  name: string;
  description: string;
  priority_level: number;
  color_code: string;
}

export interface TicketStatus {
  id: string;
  name: string;
  description: string;
  is_closed: boolean;
  color_code: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category_id: string;
  priority_id: string;
  module_name?: string;
  page_url?: string;
  browser_info?: string;
  user_agent?: string;
  screenshot_url?: string;
  attachments?: any[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  category_id?: string;
  priority_id?: string;
  status_id?: string;
  assignee_id?: string;
  resolution_notes?: string;
}

export interface CreateCommentRequest {
  comment: string;
  is_internal?: boolean;
}

// API functions - using mock implementations for frontend build
export const fetchTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  assignee?: string;
  reporter?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ tickets: Ticket[]; total: number; page: number; limit: number }> => {
  return mockFetchTickets(params);
};

export const fetchTicket = async (id: string): Promise<Ticket> => {
  // Mock implementation - find ticket by ID
  const response = await mockFetchTickets();
  const ticket = response.tickets.find(t => t.id === id);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  return ticket;
};

export const createTicket = async (ticketData: CreateTicketRequest): Promise<Ticket> => {
  return mockCreateTicket(ticketData);
};

export const updateTicket = async (id: string, ticketData: UpdateTicketRequest): Promise<Ticket> => {
  // Mock implementation - would update ticket in real API
  console.log('Mock: Updating ticket', id, ticketData);
  const response = await mockFetchTickets();
  const ticket = response.tickets.find(t => t.id === id);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  return { ...ticket, ...ticketData, updated_at: new Date().toISOString() };
};

export const deleteTicket = async (id: string): Promise<void> => {
  // Mock implementation - would delete ticket in real API
  console.log('Mock: Deleting ticket', id);
};

export const fetchTicketCategories = async (): Promise<TicketCategory[]> => {
  return mockFetchTicketCategories();
};

export const fetchTicketPriorities = async (): Promise<TicketPriority[]> => {
  return mockFetchTicketPriorities();
};

export const fetchTicketStatuses = async (): Promise<TicketStatus[]> => {
  return mockFetchTicketStatuses();
};

export const fetchTicketComments = async (ticketId: string): Promise<TicketComment[]> => {
  // Mock implementation - return empty comments for now
  console.log('Mock: Fetching comments for ticket', ticketId);
  return [];
};

export const createTicketComment = async (ticketId: string, commentData: CreateCommentRequest): Promise<TicketComment> => {
  // Mock implementation - would create comment in real API
  console.log('Mock: Creating comment for ticket', ticketId, commentData);
  return {
    id: `comment_${Date.now()}`,
    ticket_id: ticketId,
    user_id: 'current_user',
    comment: commentData.comment,
    is_internal: commentData.is_internal || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const updateTicketComment = async (ticketId: string, commentId: string, commentData: Partial<CreateCommentRequest>): Promise<TicketComment> => {
  // Mock implementation - would update comment in real API
  console.log('Mock: Updating comment', commentId, commentData);
  return {
    id: commentId,
    ticket_id: ticketId,
    user_id: 'current_user',
    comment: commentData.comment || '',
    is_internal: commentData.is_internal || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const deleteTicketComment = async (ticketId: string, commentId: string): Promise<void> => {
  // Mock implementation - would delete comment in real API
  console.log('Mock: Deleting comment', commentId);
};

export const fetchTicketStatistics = async (): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_priority: { [key: string]: number };
  by_category: { [key: string]: number };
}> => {
  return mockFetchTicketStatistics();
};

export const assignTicket = async (ticketId: string, assigneeId: string): Promise<Ticket> => {
  // Mock implementation - would assign ticket in real API
  console.log('Mock: Assigning ticket', ticketId, 'to', assigneeId);
  const response = await mockFetchTickets();
  const ticket = response.tickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  return { ...ticket, assignee_id: assigneeId, updated_at: new Date().toISOString() };
};

export const uploadTicketAttachment = async (ticketId: string, file: File): Promise<{ url: string; filename: string }> => {
  // Mock implementation - would upload file in real API
  console.log('Mock: Uploading attachment for ticket', ticketId, file.name);
  return {
    url: `https://example.com/uploads/${file.name}`,
    filename: file.name
  };
};

// Mock implementations for development
const mockTickets: Ticket[] = [
  {
    id: 'ticket_1',
    ticket_number: 'TKT-001',
    title: 'Login page not loading properly',
    description: 'When I try to access the login page, it shows a blank screen. This happens on both Chrome and Firefox browsers.',
    category_id: 'cat_bug',
    priority_id: 'pri_high',
    status_id: 'status_open',
    reporter_id: 'user_1',
    assignee_id: 'user_2',
    module_name: 'Authentication',
    page_url: '/login',
    browser_info: 'Chrome 120.0.0.0, Firefox 121.0',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T14:20:00Z',
    category: {
      id: 'cat_bug',
      name: 'Bug Report',
      description: 'Issues with functionality or errors in the system',
      is_active: true
    },
    priority: {
      id: 'pri_high',
      name: 'High',
      description: 'Important functionality is affected',
      priority_level: 2,
      color_code: '#EA580C'
    },
    status: {
      id: 'status_open',
      name: 'Open',
      description: 'Ticket is being investigated',
      is_closed: false,
      color_code: '#8B5CF6'
    },
    reporter: {
      id: 'user_1',
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    assignee: {
      id: 'user_2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    }
  },
  {
    id: 'ticket_2',
    ticket_number: 'TKT-002',
    title: 'Add export functionality to reports',
    description: 'It would be great to have the ability to export reports to PDF and Excel formats. Currently, users can only view reports online.',
    category_id: 'cat_feature',
    priority_id: 'pri_medium',
    status_id: 'status_new',
    reporter_id: 'user_3',
    module_name: 'Reporting',
    page_url: '/reporting',
    created_at: '2024-01-16T09:15:00Z',
    updated_at: '2024-01-16T09:15:00Z',
    category: {
      id: 'cat_feature',
      name: 'Feature Request',
      description: 'Requests for new features or enhancements',
      is_active: true
    },
    priority: {
      id: 'pri_medium',
      name: 'Medium',
      description: 'Minor issues or workarounds available',
      priority_level: 3,
      color_code: '#D97706'
    },
    status: {
      id: 'status_new',
      name: 'New',
      description: 'Newly created ticket',
      is_closed: false,
      color_code: '#3B82F6'
    },
    reporter: {
      id: 'user_3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com'
    }
  }
];

const mockCategories: TicketCategory[] = [
  {
    id: 'cat_bug',
    name: 'Bug Report',
    description: 'Issues with functionality or errors in the system',
    is_active: true
  },
  {
    id: 'cat_feature',
    name: 'Feature Request',
    description: 'Requests for new features or enhancements',
    is_active: true
  },
  {
    id: 'cat_ui',
    name: 'User Interface',
    description: 'Issues with the user interface or user experience',
    is_active: true
  },
  {
    id: 'cat_performance',
    name: 'Performance',
    description: 'Performance issues or slow loading times',
    is_active: true
  },
  {
    id: 'cat_data',
    name: 'Data Issue',
    description: 'Problems with data accuracy or data import/export',
    is_active: true
  },
  {
    id: 'cat_integration',
    name: 'Integration',
    description: 'Issues with third-party integrations or APIs',
    is_active: true
  },
  {
    id: 'cat_security',
    name: 'Security',
    description: 'Security concerns or vulnerabilities',
    is_active: true
  },
  {
    id: 'cat_other',
    name: 'Other',
    description: 'Other issues not covered by the above categories',
    is_active: true
  }
];

const mockPriorities: TicketPriority[] = [
  {
    id: 'pri_critical',
    name: 'Critical',
    description: 'System is down or major functionality is broken',
    priority_level: 1,
    color_code: '#DC2626'
  },
  {
    id: 'pri_high',
    name: 'High',
    description: 'Important functionality is affected',
    priority_level: 2,
    color_code: '#EA580C'
  },
  {
    id: 'pri_medium',
    name: 'Medium',
    description: 'Minor issues or workarounds available',
    priority_level: 3,
    color_code: '#D97706'
  },
  {
    id: 'pri_low',
    name: 'Low',
    description: 'Nice to have or cosmetic issues',
    priority_level: 4,
    color_code: '#059669'
  }
];

const mockStatuses: TicketStatus[] = [
  {
    id: 'status_new',
    name: 'New',
    description: 'Newly created ticket',
    is_closed: false,
    color_code: '#3B82F6'
  },
  {
    id: 'status_open',
    name: 'Open',
    description: 'Ticket is being investigated',
    is_closed: false,
    color_code: '#8B5CF6'
  },
  {
    id: 'status_in_progress',
    name: 'In Progress',
    description: 'Ticket is being worked on',
    is_closed: false,
    color_code: '#F59E0B'
  },
  {
    id: 'status_pending',
    name: 'Pending',
    description: 'Waiting for user response or external dependency',
    is_closed: false,
    color_code: '#6B7280'
  },
  {
    id: 'status_resolved',
    name: 'Resolved',
    description: 'Issue has been fixed',
    is_closed: true,
    color_code: '#10B981'
  },
  {
    id: 'status_closed',
    name: 'Closed',
    description: 'Ticket is closed',
    is_closed: true,
    color_code: '#6B7280'
  },
  {
    id: 'status_rejected',
    name: 'Rejected',
    description: 'Ticket was rejected or not a valid issue',
    is_closed: true,
    color_code: '#EF4444'
  }
];

// Mock API implementations
export const mockFetchTickets = async (params?: any): Promise<{ tickets: Ticket[]; total: number; page: number; limit: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredTickets = [...mockTickets];
  
  if (params?.search) {
    const search = params.search.toLowerCase();
    filteredTickets = filteredTickets.filter(ticket => 
      ticket.title.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search) ||
      ticket.ticket_number.toLowerCase().includes(search)
    );
  }
  
  if (params?.status) {
    filteredTickets = filteredTickets.filter(ticket => ticket.status_id === params.status);
  }
  
  if (params?.priority) {
    filteredTickets = filteredTickets.filter(ticket => ticket.priority_id === params.priority);
  }
  
  if (params?.category) {
    filteredTickets = filteredTickets.filter(ticket => ticket.category_id === params.category);
  }
  
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    tickets: filteredTickets.slice(startIndex, endIndex),
    total: filteredTickets.length,
    page,
    limit
  };
};

export const mockCreateTicket = async (ticketData: CreateTicketRequest): Promise<Ticket> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newTicket: Ticket = {
    id: `ticket_${Date.now()}`,
    ticket_number: `TKT-${String(mockTickets.length + 1).padStart(3, '0')}`,
    ...ticketData,
    status_id: 'status_new',
    reporter_id: 'current_user', // This would come from auth context
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategories.find(cat => cat.id === ticketData.category_id),
    priority: mockPriorities.find(pri => pri.id === ticketData.priority_id),
    status: mockStatuses.find(status => status.id === 'status_new'),
    reporter: {
      id: 'current_user',
      name: 'Current User',
      email: 'user@example.com'
    }
  };
  
  mockTickets.unshift(newTicket);
  return newTicket;
};

export const mockFetchTicketCategories = async (): Promise<TicketCategory[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockCategories;
};

export const mockFetchTicketPriorities = async (): Promise<TicketPriority[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockPriorities;
};

export const mockFetchTicketStatuses = async (): Promise<TicketStatus[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockStatuses;
};

export const mockFetchTicketStatistics = async (): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  by_priority: { [key: string]: number };
  by_category: { [key: string]: number };
}> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const total = mockTickets.length;
  const open = mockTickets.filter(t => !t.status?.is_closed).length;
  const in_progress = mockTickets.filter(t => t.status_id === 'status_in_progress').length;
  const resolved = mockTickets.filter(t => t.status_id === 'status_resolved').length;
  const closed = mockTickets.filter(t => t.status?.is_closed).length;
  
  const by_priority: { [key: string]: number } = {};
  const by_category: { [key: string]: number } = {};
  
  mockTickets.forEach(ticket => {
    by_priority[ticket.priority_id] = (by_priority[ticket.priority_id] || 0) + 1;
    by_category[ticket.category_id] = (by_category[ticket.category_id] || 0) + 1;
  });
  
  return {
    total,
    open,
    in_progress,
    resolved,
    closed,
    by_priority,
    by_category
  };
};

