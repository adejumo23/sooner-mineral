import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Input from '../components/ui/Input';
import { formatNMA } from '../utils/formatting';

interface UnassignedOwner {
  id: string;
  name: string;
  contact?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  phoneEmail?: string;
  unitName?: string;
  totalNMA: number;
  netMineralAcres: number;
  sectionCount: number;
  assignedBuyer: null;
  createdAt?: string;
  updatedAt?: string;
}

type SortField = 'name' | 'totalNMA' | 'sectionCount' | 'city' | 'state' | null;
type SortDirection = 'asc' | 'desc';

const UnassignedOwnersPage: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<UnassignedOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  const fetchData = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await api.fetchUnassignedOwners(page, limit);
      const ownersData = response.data || response;
      const pagination = response.pagination;
      
      setOwners(Array.isArray(ownersData) ? ownersData : []);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.total || 0);
        setCurrentPage(pagination.page || page);
      }
    } catch (error) {
      console.error("Failed to fetch unassigned owners:", error);
      setOwners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter owners based on search term
  const filteredOwners = React.useMemo(() => {
    if (!searchTerm.trim()) return owners;

    const searchLower = searchTerm.toLowerCase().trim();
    return owners.filter(owner => {
      const name = (owner.name || '').toLowerCase();
      const city = (owner.city || '').toLowerCase();
      const state = (owner.state || '').toLowerCase();
      const contact = (owner.contact || '').toLowerCase();
      const phoneEmail = (owner.phoneEmail || '').toLowerCase();
      
      return name.includes(searchLower) ||
        city.includes(searchLower) ||
        state.includes(searchLower) ||
        contact.includes(searchLower) ||
        phoneEmail.includes(searchLower);
    });
  }, [owners, searchTerm]);

  const sortedOwners = React.useMemo(() => {
    if (!sortField) return filteredOwners;

    return [...filteredOwners].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'totalNMA':
          aValue = a.totalNMA || 0;
          bValue = b.totalNMA || 0;
          return sortDirection === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        
        case 'sectionCount':
          aValue = a.sectionCount || 0;
          bValue = b.sectionCount || 0;
          return sortDirection === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        case 'state':
          aValue = a.state || '';
          bValue = b.state || '';
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        
        default:
          return 0;
      }
    });
  }, [filteredOwners, sortField, sortDirection]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Unassigned Owners</h1>
            <p className="text-gray-600 mt-1">Owners that have not been assigned a buyer</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search owners by name, city, state, contact, or phone/email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Showing {sortedOwners.length} of {filteredOwners.length} owners
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-sc-medium-gray">Loading unassigned owners...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-sc-light-orange shadow-lg overflow-x-auto">
            <table className="min-w-full table-auto divide-y divide-sc-light-orange">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Owner Name</span>
                      {sortField === 'name' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {sortField !== 'name' && (
                        <span className="text-gray-400 opacity-30">⇅</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 select-none"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>City</span>
                      {sortField === 'city' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {sortField !== 'city' && (
                        <span className="text-gray-400 opacity-30">⇅</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 select-none"
                    onClick={() => handleSort('state')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>State</span>
                      {sortField === 'state' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {sortField !== 'state' && (
                        <span className="text-gray-400 opacity-30">⇅</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                  >
                    Contact Info
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 select-none"
                    onClick={() => handleSort('sectionCount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Sections</span>
                      {sortField === 'sectionCount' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {sortField !== 'sectionCount' && (
                        <span className="text-gray-400 opacity-30">⇅</span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 select-none"
                    onClick={() => handleSort('totalNMA')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Net Mineral Acres</span>
                      {sortField === 'totalNMA' && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {sortField !== 'totalNMA' && (
                        <span className="text-gray-400 opacity-30">⇅</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOwners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No owners found matching your search.' : 'No unassigned owners found.'}
                    </td>
                  </tr>
                ) : (
                  sortedOwners.map((owner, index) => (
                    <tr key={owner.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {owner.name || 'Unknown Owner'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {owner.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {owner.state || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {owner.contact && (
                            <div>{owner.contact}</div>
                          )}
                          {owner.phoneEmail && (
                            <div className="text-gray-600 text-xs">{owner.phoneEmail}</div>
                          )}
                          {!owner.contact && !owner.phoneEmail && (
                            <span className="text-gray-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {owner.sectionCount || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatNMA(owner.totalNMA)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!searchTerm && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages} ({totalCount} total owners)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UnassignedOwnersPage;
