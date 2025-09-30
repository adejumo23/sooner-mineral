import React, { useState, useEffect, useMemo } from 'react';
import './AcreageSchedulePage.css';
import { fetchAcreageSchedule } from '../services/apiClient';

interface AcreageRecord {
  COUNTY: string;
  S_TR: string;
  LEGAL_DESCRIPTION: string;
  NMA: string;
  OWNER: string;
  STREET: string;
  CITY: string;
  ST: string;
  ZIP: string;
  PHONE_EMAIL: string;
  ROY: string;
  ALLOCATION_PERCENT: string;
  TITLE_SOURCE: string;
  STATUS: string;
  BUYER: string;
  NOTE: string;
  mineral_interest_id: string;
  property_id: string;
  owner_id: string;
  county_id: string;
  section_id: string;
  state_id: string;
}

interface AcreageSummary {
  totalRecords: number;
  totalAcres: number;
  uniqueOwners: number;
  uniqueCounties: number;
  averageAllocation: number;
  statusBreakdown: { [key: string]: number };
  countyBreakdown: { [key: string]: number };
}

const AcreageSchedulePage: React.FC = () => {
  const [acreageData, setAcreageData] = useState<AcreageRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AcreageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [sortField, setSortField] = useState<keyof AcreageRecord>('COUNTY');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState<AcreageRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'map'>('table');
  const [compactMode, setCompactMode] = useState(false);

  // Fetch acreage data
  useEffect(() => {
    const fetchAcreageData = async () => {
      try {
        setLoading(true);
        const result = await fetchAcreageSchedule();
        
        console.log('Acreage data received:', result);
        
        if (result.success) {
          setAcreageData(result.data);
          setFilteredData(result.data);
        } else {
          setError('Failed to fetch acreage data');
        }
      } catch (err) {
        setError('Error fetching acreage data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAcreageData();
  }, []);

  // Calculate summary statistics
  const summary: AcreageSummary = useMemo(() => {
    const totalRecords = filteredData.length;
    const totalAcres = filteredData.reduce((sum, record) => sum + (parseFloat(record.NMA) || 0), 0);
    const uniqueOwners = new Set(filteredData.map(record => record.OWNER)).size;
    const uniqueCounties = new Set(filteredData.map(record => record.COUNTY)).size;
    const averageAllocation = filteredData.reduce((sum, record) => sum + (parseFloat(record.ALLOCATION_PERCENT) || 0), 0) / totalRecords;
    
    const statusBreakdown = filteredData.reduce((acc, record) => {
      const status = record.STATUS || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const countyBreakdown = filteredData.reduce((acc, record) => {
      const county = record.COUNTY;
      acc[county] = (acc[county] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalRecords,
      totalAcres,
      uniqueOwners,
      uniqueCounties,
      averageAllocation: averageAllocation || 0,
      statusBreakdown,
      countyBreakdown
    };
  }, [filteredData]);

  // Filter and sort data
  useEffect(() => {
    let filtered = [...acreageData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply county filter
    if (selectedCounty) {
      filtered = filtered.filter(record => record.COUNTY === selectedCounty);
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(record => record.STATUS === selectedStatus);
    }

    // Apply owner filter
    if (selectedOwner) {
      filtered = filtered.filter(record => record.OWNER === selectedOwner);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [acreageData, searchTerm, selectedCounty, selectedStatus, selectedOwner, sortField, sortDirection]);

  // Get unique values for filters
  const uniqueCounties = useMemo(() => [...new Set(acreageData.map(record => record.COUNTY))].sort(), [acreageData]);
  const uniqueStatuses = useMemo(() => [...new Set(acreageData.map(record => record.STATUS).filter(Boolean))].sort(), [acreageData]);
  const uniqueOwners = useMemo(() => [...new Set(acreageData.map(record => record.OWNER))].sort(), [acreageData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof AcreageRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle record selection
  const handleRecordClick = (record: AcreageRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCounty('');
    setSelectedStatus('');
    setSelectedOwner('');
  };

  if (loading) {
    return (
      <div className="acreage-schedule-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading acreage schedule data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="acreage-schedule-page">
        <div className="error-container">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`acreage-schedule-page ${compactMode ? 'compact-mode' : ''}`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>🏞️ Acreage Schedule</h1>
          <p>Comprehensive mineral rights ownership and acquisition tracking</p>
        </div>
        <div className="header-actions">
          <button 
            className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            📊 Table
          </button>
          <button 
            className={`view-toggle ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            🃏 Cards
          </button>
          <button 
            className={`view-toggle ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Map
          </button>
          <button 
            className={`view-toggle ${compactMode ? 'active' : ''}`}
            onClick={() => setCompactMode(!compactMode)}
          >
            {compactMode ? '📏 Expand' : '📐 Compact'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!compactMode && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h3>{summary.totalRecords.toLocaleString()}</h3>
              <p>Total Records</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🌾</div>
            <div className="card-content">
              <h3>{summary.totalAcres.toLocaleString()}</h3>
              <p>Total Acres</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>{summary.uniqueOwners.toLocaleString()}</h3>
              <p>Unique Owners</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🏘️</div>
            <div className="card-content">
              <h3>{summary.uniqueCounties.toLocaleString()}</h3>
              <p>Counties</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>{summary.averageAllocation.toFixed(1)}%</h3>
              <p>Avg Allocation</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search all fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Counties</option>
            {uniqueCounties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="filter-select"
          >
            <option value="">All Owners</option>
            {uniqueOwners.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Status and County Breakdown */}
      {!compactMode && (
        <div className="breakdown-section">
          <div className="breakdown-card">
            <h4>Status Breakdown</h4>
            <div className="breakdown-items">
              {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                <div key={status} className="breakdown-item">
                  <span className="breakdown-label">{status}</span>
                  <span className="breakdown-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="breakdown-card">
            <h4>County Distribution</h4>
            <div className="breakdown-items">
              {Object.entries(summary.countyBreakdown).map(([county, count]) => (
                <div key={county} className="breakdown-item">
                  <span className="breakdown-label">{county}</span>
                  <span className="breakdown-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Display */}
      <div className="data-section">
        {viewMode === 'table' && (
          <div className="table-container">
            <table className="acreage-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('COUNTY')} className="sortable">
                    County {sortField === 'COUNTY' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('S_TR')} className="sortable">
                    S-T-R {sortField === 'S_TR' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('OWNER')} className="sortable">
                    Owner {sortField === 'OWNER' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('NMA')} className="sortable">
                    NMA {sortField === 'NMA' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('STATUS')} className="sortable">
                    Status {sortField === 'STATUS' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('ALLOCATION_PERCENT')} className="sortable">
                    Allocation % {sortField === 'ALLOCATION_PERCENT' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record, index) => (
                  <tr key={record.mineral_interest_id} className="data-row">
                    <td>{record.COUNTY}</td>
                    <td>{record.S_TR}</td>
                    <td className="owner-cell">{record.OWNER}</td>
                    <td className="number-cell">{parseFloat(record.NMA).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${record.STATUS.toLowerCase().replace(/\s+/g, '-')}`}>
                        {record.STATUS || 'Unknown'}
                      </span>
                    </td>
                    <td className="number-cell">
                      {parseFloat(record.ALLOCATION_PERCENT).toFixed(2)}%
                    </td>
                    <td>
                      <button 
                        onClick={() => handleRecordClick(record)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="cards-container">
            {paginatedData.map((record) => (
              <div key={record.mineral_interest_id} className="acreage-card">
                <div className="card-header">
                  <h3>{record.OWNER}</h3>
                  <span className={`status-badge ${record.STATUS.toLowerCase().replace(/\s+/g, '-')}`}>
                    {record.STATUS || 'Unknown'}
                  </span>
                </div>
                <div className="card-content">
                  <div className="card-row">
                    <span className="label">Location:</span>
                    <span>{record.COUNTY}, {record.ST} - {record.S_TR}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Acres:</span>
                    <span>{parseFloat(record.NMA).toFixed(2)} NMA</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Allocation:</span>
                    <span>{parseFloat(record.ALLOCATION_PERCENT).toFixed(2)}%</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Buyer:</span>
                    <span>{record.BUYER || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleRecordClick(record)}
                    className="view-details-btn"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="map-container">
            <div className="map-placeholder">
              <h3>🗺️ Map View</h3>
              <p>Interactive map visualization coming soon...</p>
              <p>This will show acreage locations on a map with filtering capabilities.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({filteredData.length} records)
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Acreage Details</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>📍 Location Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">County:</span>
                    <span className="detail-value">{selectedRecord.COUNTY}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">State:</span>
                    <span className="detail-value">{selectedRecord.ST}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">S-T-R:</span>
                    <span className="detail-value">{selectedRecord.S_TR}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Legal Description:</span>
                    <span className="detail-value">{selectedRecord.LEGAL_DESCRIPTION}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>👤 Owner Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Owner:</span>
                    <span className="detail-value">{selectedRecord.OWNER}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">
                      {selectedRecord.STREET}<br/>
                      {selectedRecord.CITY}, {selectedRecord.ST} {selectedRecord.ZIP}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{selectedRecord.PHONE_EMAIL}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>📊 Mineral Interest Details</h4>
                  <div className="detail-item">
                    <span className="detail-label">Net Mineral Acres:</span>
                    <span className="detail-value">{parseFloat(selectedRecord.NMA).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Royalty %:</span>
                    <span className="detail-value">{parseFloat(selectedRecord.ROY).toFixed(4)}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Allocation %:</span>
                    <span className="detail-value">{parseFloat(selectedRecord.ALLOCATION_PERCENT).toFixed(2)}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Title Source:</span>
                    <span className="detail-value">{selectedRecord.TITLE_SOURCE}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>🎯 Acquisition Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-badge ${selectedRecord.STATUS.toLowerCase().replace(/\s+/g, '-')}`}>
                      {selectedRecord.STATUS || 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Buyer:</span>
                    <span className="detail-value">{selectedRecord.BUYER || 'Unassigned'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{selectedRecord.NOTE || 'No notes'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcreageSchedulePage;
