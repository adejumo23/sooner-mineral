// Database connection for normalized data
// This is a simplified version that works with the current application structure

// Mock database connection for now
// In a real implementation, this would connect to MySQL
export const db = {
  execute: async (query: string, params: any[] = []): Promise<[any[], any]> => {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on query type
    if (query.includes('SELECT') && query.includes('properties p')) {
      return [getMockNormalizedSections(), []];
    }
    
    return [[], []];
  }
};

// Mock normalized tract data that matches the database structure
function getMockNormalizedSections(): any[] {
  return [
    {
      tract_id: 'prop_1',
      state: 'TX',
      county: 'Midland',
      tract_name: 'TX-Midland-15',
      legal_description: 'Section 15, Block 2, T&P RR Co. Survey',
      str: '15-02S-32E',
      abstract_number: 'A-1234',
      gross_acres: 640.00,
      total_net_mineral_acres: 160.00,
      number_of_owners: 3,
      acquisition_status: 'WORKING',
      assigned_buyer: 'David Buyer',
      last_contact_date: '2024-01-15',
      next_follow_up_date: '2024-01-22',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      tract_id: 'prop_2',
      state: 'OK',
      county: 'Kingfisher',
      tract_name: 'OK-Kingfisher-13',
      legal_description: 'N2 NW4, 80 ACRES, MOL',
      str: '13-16N-07W',
      abstract_number: null,
      gross_acres: 80.00,
      total_net_mineral_acres: 20.00,
      number_of_owners: 1,
      acquisition_status: 'DROPPED',
      assigned_buyer: 'Michelle',
      last_contact_date: '2024-01-10',
      next_follow_up_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T14:20:00Z'
    },
    {
      tract_id: 'prop_3',
      state: 'OK',
      county: 'Love',
      tract_name: 'OK-Love-10',
      legal_description: 'W/2 of the SW/4 of Section 10, Township 8 South, Range 2 East',
      str: '10-08S-02E',
      abstract_number: null,
      gross_acres: 80.00,
      total_net_mineral_acres: 20.00,
      number_of_owners: 1,
      acquisition_status: 'NEW',
      assigned_buyer: null,
      last_contact_date: null,
      next_follow_up_date: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];
}
