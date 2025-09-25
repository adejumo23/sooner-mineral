import React, { useState, useEffect, useMemo } from 'react';
import './PricingPage.css';

interface PricingRecord {
  id: number;
  County: string;
  Basin: string;
  Survey_Company: string;
  Formation: string;
  Price_Per_Acre: number;
  [key: string]: any;
}

interface PricingSummary {
  totalRecords: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  uniqueCounties: number;
  uniqueFormations: number;
  uniqueBasins: number;
  priceByFormation: { [key: string]: number };
  priceByCounty: { [key: string]: number };
  priceByBasin: { [key: string]: number };
}

const PricingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'oklahoma' | 'texas'>('oklahoma');
  const [oklahomaData, setOklahomaData] = useState<PricingRecord[]>([]);
  const [texasData, setTexasData] = useState<PricingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [formationFilter, setFormationFilter] = useState('');
  const [basinFilter, setBasinFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // View states
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'analytics'>('table');
  const [sortField, setSortField] = useState<keyof PricingRecord>('Price_Per_Acre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedRecord, setSelectedRecord] = useState<PricingRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  
  // Enhanced UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonRecords, setComparisonRecords] = useState<PricingRecord[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [favoriteRecords, setFavoriteRecords] = useState<Set<string>>(new Set());
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [showQuickStats, setShowQuickStats] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    County: true,
    Basin: true,
    Survey_Company: true,
    Formation: true,
    S_T_R: true,
    Section: true,
    Price_Per_Acre: true
  });
  
  // Advanced UI states
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showDataInsights, setShowDataInsights] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<Array<{name: string, filters: any}>>([]);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [dataVisualization, setDataVisualization] = useState<'none' | 'chart' | 'heatmap' | 'scatter'>('none');
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [oklahomaRes, texasRes] = await Promise.all([
          fetch('/api/pricing/oklahoma'),
          fetch('/api/pricing/texas')
        ]);

        if (oklahomaRes.ok) {
          const oklahomaData = await oklahomaRes.json();
          console.log('Oklahoma data received:', oklahomaData);
          setOklahomaData(oklahomaData.data || []);
        } else {
          console.error('Oklahoma API error:', oklahomaRes.status, oklahomaRes.statusText);
        }

        if (texasRes.ok) {
          const texasData = await texasRes.json();
          console.log('Texas data received:', texasData);
          setTexasData(texasData.data || []);
        } else {
          console.error('Texas API error:', texasRes.status, texasRes.statusText);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  // Get current data based on active tab
  const currentData = activeTab === 'oklahoma' ? oklahomaData : texasData;

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = currentData.filter(record => {
      const matchesSearch = searchTerm === '' || 
        Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesCounty = countyFilter === '' || record.County === countyFilter;
      const matchesFormation = formationFilter === '' || record.Formation === formationFilter;
      const matchesBasin = basinFilter === '' || record.Basin === basinFilter;
      
      const price = parseFloat(record.Price_Per_Acre) || 0;
      const matchesMinPrice = priceRange.min === '' || price >= parseFloat(priceRange.min);
      const matchesMaxPrice = priceRange.max === '' || price <= parseFloat(priceRange.max);

      return matchesSearch && matchesCounty && matchesFormation && matchesBasin && 
             matchesMinPrice && matchesMaxPrice;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      const aNum = parseFloat(aVal) || 0;
      const bNum = parseFloat(bVal) || 0;
      
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return filtered;
  }, [currentData, searchTerm, countyFilter, formationFilter, basinFilter, priceRange, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Calculate summary statistics
  const summary = useMemo((): PricingSummary => {
    const prices = filteredData.map(record => {
      const price = typeof record.Price_Per_Acre === 'number' 
        ? record.Price_Per_Acre 
        : parseFloat(record.Price_Per_Acre) || 0;
      return price;
    });
    const validPrices = prices.filter(price => price > 0);
    
    const priceByFormation: { [key: string]: number } = {};
    const priceByCounty: { [key: string]: number } = {};
    const priceByBasin: { [key: string]: number } = {};

    filteredData.forEach(record => {
      const price = typeof record.Price_Per_Acre === 'number' 
        ? record.Price_Per_Acre 
        : parseFloat(record.Price_Per_Acre) || 0;
      const formation = record.Formation || 'Unknown';
      const county = record.County || 'Unknown';
      const basin = record.Basin || 'Unknown';

      priceByFormation[formation] = (priceByFormation[formation] || 0) + price;
      priceByCounty[county] = (priceByCounty[county] || 0) + price;
      priceByBasin[basin] = (priceByBasin[basin] || 0) + price;
    });

    return {
      totalRecords: filteredData.length,
      averagePrice: validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0,
      minPrice: validPrices.length > 0 ? Math.min(...validPrices) : 0,
      maxPrice: validPrices.length > 0 ? Math.max(...validPrices) : 0,
      uniqueCounties: new Set(filteredData.map(record => record.County)).size,
      uniqueFormations: new Set(filteredData.map(record => record.Formation)).size,
      uniqueBasins: new Set(filteredData.map(record => record.Basin)).size,
      priceByFormation,
      priceByCounty,
      priceByBasin
    };
  }, [filteredData]);

  // Get unique values for filters
  const uniqueCounties = useMemo(() => 
    Array.from(new Set(currentData.map(record => record.County))).sort(), [currentData]);
  const uniqueFormations = useMemo(() => 
    Array.from(new Set(currentData.map(record => record.Formation))).sort(), [currentData]);
  const uniqueBasins = useMemo(() => 
    Array.from(new Set(currentData.map(record => record.Basin))).sort(), [currentData]);

  const handleSort = (field: keyof PricingRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCountyFilter('');
    setFormationFilter('');
    setBasinFilter('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const handleRecordClick = (record: PricingRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
    // Add to view history
    setViewHistory(prev => [record.id, ...prev.filter(id => id !== record.id)].slice(0, 10));
  };

  const handleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === paginatedData.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(paginatedData.map(record => record.id)));
    }
  };

  const handleFavoriteToggle = (recordId: string) => {
    const newFavorites = new Set(favoriteRecords);
    if (newFavorites.has(recordId)) {
      newFavorites.delete(recordId);
    } else {
      newFavorites.add(recordId);
    }
    setFavoriteRecords(newFavorites);
  };

  const handleAddToComparison = (record: PricingRecord) => {
    if (comparisonRecords.length < 5 && !comparisonRecords.find(r => r.id === record.id)) {
      setComparisonRecords([...comparisonRecords, record]);
    }
  };

  const handleRemoveFromComparison = (recordId: string) => {
    setComparisonRecords(comparisonRecords.filter(r => r.id !== recordId));
  };

  const handleExportData = (format: 'csv' | 'excel' | 'json') => {
    const dataToExport = selectedRecords.size > 0 
      ? filteredData.filter(record => selectedRecords.has(record.id))
      : filteredData;
    
    if (format === 'csv') {
      const csvContent = convertToCSV(dataToExport);
      downloadFile(csvContent, 'pricing-data.csv', 'text/csv');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      downloadFile(jsonContent, 'pricing-data.json', 'application/json');
    }
  };

  const convertToCSV = (data: PricingRecord[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header as keyof PricingRecord];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkEdit = (field: string, value: any) => {
    const updatedData = currentData.map(record => {
      if (selectedRecords.has(record.id)) {
        return { ...record, [field]: value };
      }
      return record;
    });
    
    if (activeTab === 'oklahoma') {
      setOklahomaData(updatedData);
    } else {
      setTexasData(updatedData);
    }
    
    setSelectedRecords(new Set());
    setBulkEditMode(false);
  };

  // Advanced handlers
  const handleSaveFilter = (filterName: string) => {
    const newFilter = {
      name: filterName,
      filters: {
        searchTerm,
        countyFilter,
        formationFilter,
        basinFilter,
        priceRange
      }
    };
    setSavedFilters([...savedFilters, newFilter]);
  };

  const handleLoadFilter = (filter: any) => {
    setSearchTerm(filter.filters.searchTerm);
    setCountyFilter(filter.filters.countyFilter);
    setFormationFilter(filter.filters.formationFilter);
    setBasinFilter(filter.filters.basinFilter);
    setPriceRange(filter.filters.priceRange);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Generate search suggestions
    const suggestions = Array.from(new Set([
      ...currentData.map(r => r.County),
      ...currentData.map(r => r.Basin),
      ...currentData.map(r => r.Formation),
      ...currentData.map(r => r.Survey_Company)
    ])).filter(item => 
      item && item.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
    
    setSearchSuggestions(suggestions);
  };

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          setShowFilters(!showFilters);
          break;
        case 'e':
          e.preventDefault();
          setShowExportMenu(!showExportMenu);
          break;
        case 'a':
          e.preventDefault();
          handleSelectAll();
          break;
        case 'c':
          e.preventDefault();
          setShowComparison(!showComparison);
          break;
        case 'k':
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
        case 'd':
          e.preventDefault();
          setDarkMode(!darkMode);
          break;
        case 't':
          e.preventDefault();
          setShowTutorial(!showTutorial);
          break;
      }
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPricingData();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Keyboard shortcuts effect
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, [showFilters, showExportMenu, showComparison, showKeyboardShortcuts, darkMode, showTutorial]);

  // Data quality analysis
  const dataQualityAnalysis = useMemo(() => {
    const totalRecords = currentData.length;
    const recordsWithPrice = currentData.filter(r => r.Price_Per_Acre && parseFloat(r.Price_Per_Acre) > 0).length;
    const recordsWithCounty = currentData.filter(r => r.County && r.County.trim() !== '').length;
    const recordsWithBasin = currentData.filter(r => r.Basin && r.Basin.trim() !== '').length;
    const recordsWithFormation = currentData.filter(r => r.Formation && r.Formation.trim() !== '').length;
    
    return {
      totalRecords,
      completeness: {
        price: (recordsWithPrice / totalRecords * 100).toFixed(1),
        county: (recordsWithCounty / totalRecords * 100).toFixed(1),
        basin: (recordsWithBasin / totalRecords * 100).toFixed(1),
        formation: (recordsWithFormation / totalRecords * 100).toFixed(1)
      },
      qualityScore: ((recordsWithPrice + recordsWithCounty + recordsWithBasin + recordsWithFormation) / (totalRecords * 4) * 100).toFixed(1)
    };
  }, [currentData]);

  // Advanced analytics
  const advancedAnalytics = useMemo(() => {
    const prices = filteredData.map(r => parseFloat(r.Price_Per_Acre) || 0).filter(p => p > 0);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    return {
      priceDistribution: {
        q1: sortedPrices[Math.floor(sortedPrices.length * 0.25)],
        median: sortedPrices[Math.floor(sortedPrices.length * 0.5)],
        q3: sortedPrices[Math.floor(sortedPrices.length * 0.75)],
        iqr: sortedPrices[Math.floor(sortedPrices.length * 0.75)] - sortedPrices[Math.floor(sortedPrices.length * 0.25)]
      },
      outliers: prices.filter(p => {
        const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
        const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
        const iqr = q3 - q1;
        return p < q1 - 1.5 * iqr || p > q3 + 1.5 * iqr;
      }).length,
      priceVolatility: prices.length > 1 ? (Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) * 100 : 0
    };
  }, [filteredData]);

  const exportData = () => {
    const csvContent = [
      ['County', 'Basin', 'Survey Company', 'Formation', 'Price Per Acre'],
      ...filteredData.map(record => [
        record.County,
        record.Basin,
        record.Survey_Company,
        record.Formation,
        record.Price_Per_Acre
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_pricing_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="pricing-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pricing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pricing-page ${compactMode ? 'compact-mode' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Mineral Rights Pricing</h1>
            <p>Comprehensive pricing data for Oklahoma and Texas mineral rights</p>
            {showQuickStats && (
              <div className="quick-stats">
                <span className="stat-item">
                  📊 {filteredData.length} records
                </span>
                <span className="stat-item">
                  💰 ${summary.averagePrice.toLocaleString()}/acre avg
                </span>
                <span className="stat-item">
                  🏛️ {summary.uniqueCounties} counties
                </span>
                <span className="stat-item">
                  ⛰️ {summary.uniqueFormations} formations
                </span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <div className="action-group">
              <button 
                className={`action-btn ${showQuickStats ? 'active' : ''}`}
                onClick={() => setShowQuickStats(!showQuickStats)}
                title="Toggle Quick Stats"
              >
                📊 Stats
              </button>
              <button 
                className={`action-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle Filters"
              >
                🔍 Filters
              </button>
              <button 
                className={`action-btn ${showDataInsights ? 'active' : ''}`}
                onClick={() => setShowDataInsights(!showDataInsights)}
                title="Data Insights"
              >
                🔬 Insights
              </button>
              <button 
                className={`action-btn ${showAdvancedAnalytics ? 'active' : ''}`}
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                title="Advanced Analytics"
              >
                📈 Analytics
              </button>
            </div>
            <div className="action-group">
              <button 
                className="action-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export Data"
              >
                📤 Export
              </button>
              <button 
                className={`action-btn ${bulkEditMode ? 'active' : ''}`}
                onClick={() => setBulkEditMode(!bulkEditMode)}
                title="Bulk Edit"
                disabled={selectedRecords.size === 0}
              >
                ✏️ Bulk Edit
              </button>
              <button 
                className={`action-btn ${showComparison ? 'active' : ''}`}
                onClick={() => setShowComparison(!showComparison)}
                title="Compare Records"
              >
                ⚖️ Compare
              </button>
              <button 
                className={`action-btn ${showColumnManager ? 'active' : ''}`}
                onClick={() => setShowColumnManager(!showColumnManager)}
                title="Manage Columns"
              >
                📋 Columns
              </button>
            </div>
            <div className="action-group">
              <button 
                className={`action-btn ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title="Auto Refresh"
              >
                🔄 {autoRefresh ? 'Auto' : 'Manual'}
              </button>
              <button 
                className={`action-btn ${darkMode ? 'active' : ''}`}
                onClick={() => setDarkMode(!darkMode)}
                title="Dark Mode"
              >
                {darkMode ? '🌙' : '☀️'} Theme
              </button>
              <button 
                className="action-btn"
                onClick={() => setShowTutorial(!showTutorial)}
                title="Tutorial"
              >
                🎓 Help
              </button>
              <button 
                className="action-btn"
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                title="Keyboard Shortcuts"
              >
                ⌨️ Shortcuts
              </button>
            </div>
            <div className="action-group">
              <button 
                className={`action-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                📊 Table
              </button>
              <button 
                className={`action-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                🃏 Cards
              </button>
              <button 
                className={`action-btn ${viewMode === 'analytics' ? 'active' : ''}`}
                onClick={() => setViewMode('analytics')}
              >
                📈 Analytics
              </button>
              <button 
                className={`action-btn ${compactMode ? 'active' : ''}`}
                onClick={() => setCompactMode(!compactMode)}
              >
                {compactMode ? '📏 Expand' : '📐 Compact'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'oklahoma' ? 'active' : ''}`}
          onClick={() => setActiveTab('oklahoma')}
        >
          🌾 Oklahoma Pricing ({oklahomaData.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'texas' ? 'active' : ''}`}
          onClick={() => setActiveTab('texas')}
        >
          🤠 Texas Pricing ({texasData.length})
        </button>
      </div>

      {/* Enhanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>Advanced Filters</h3>
            <button 
              className="close-filters-btn"
              onClick={() => setShowFilters(false)}
            >
              ×
            </button>
          </div>
          <div className="filters-content">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Search Term</label>
                <input
                  type="text"
                  placeholder="Search across all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <label>County</label>
                <select
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Counties</option>
                  {Array.from(new Set(currentData.map(record => record.County))).map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Formation</label>
                <select
                  value={formationFilter}
                  onChange={(e) => setFormationFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Formations</option>
                  {Array.from(new Set(currentData.map(record => record.Formation))).map(formation => (
                    <option key={formation} value={formation}>{formation}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Basin</label>
                <select
                  value={basinFilter}
                  onChange={(e) => setBasinFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Basins</option>
                  {Array.from(new Set(currentData.map(record => record.Basin))).map(basin => (
                    <option key={basin} value={basin}>{basin}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-range">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    className="search-input"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    className="search-input"
                  />
                </div>
              </div>
            </div>
            <div className="filters-actions">
              <button onClick={clearFilters} className="clear-filters-btn">
                🗑️ Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="action-btn">
                ✅ Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Menu */}
      {showExportMenu && (
        <div className="export-menu">
          <div className="export-header">
            <h3>📤 Export Data</h3>
            <button 
              className="close-export-btn"
              onClick={() => setShowExportMenu(false)}
            >
              ×
            </button>
          </div>
          <div className="export-options">
            <button 
              className="export-btn"
              onClick={() => handleExportData('csv')}
            >
              📄 Export as CSV
            </button>
            <button 
              className="export-btn"
              onClick={() => handleExportData('json')}
            >
              📋 Export as JSON
            </button>
            <div className="export-info">
              {selectedRecords.size > 0 ? (
                <p>Exporting {selectedRecords.size} selected records</p>
              ) : (
                <p>Exporting all {filteredData.length} filtered records</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Panel */}
      {bulkEditMode && selectedRecords.size > 0 && (
        <div className="bulk-edit-panel">
          <div className="bulk-edit-header">
            <h3>✏️ Bulk Edit ({selectedRecords.size} records)</h3>
            <button 
              className="close-bulk-edit-btn"
              onClick={() => setBulkEditMode(false)}
            >
              ×
            </button>
          </div>
          <div className="bulk-edit-content">
            <div className="bulk-edit-field">
              <label>Field to Edit:</label>
              <select className="bulk-edit-select">
                <option value="County">County</option>
                <option value="Basin">Basin</option>
                <option value="Formation">Formation</option>
                <option value="Survey_Company">Survey Company</option>
              </select>
            </div>
            <div className="bulk-edit-field">
              <label>New Value:</label>
              <input 
                type="text" 
                className="bulk-edit-input"
                placeholder="Enter new value..."
              />
            </div>
            <button className="apply-bulk-edit-btn">
              ✅ Apply to Selected
            </button>
          </div>
        </div>
      )}

      {/* Comparison Panel */}
      {showComparison && (
        <div className="comparison-panel">
          <div className="comparison-header">
            <h3>⚖️ Record Comparison ({comparisonRecords.length}/5)</h3>
            <button 
              className="close-comparison-btn"
              onClick={() => setShowComparison(false)}
            >
              ×
            </button>
          </div>
          <div className="comparison-content">
            {comparisonRecords.length > 0 ? (
              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      {comparisonRecords.map(record => (
                        <th key={record.id}>
                          {record.County} County
                          <button 
                            className="remove-comparison-btn"
                            onClick={() => handleRemoveFromComparison(record.id)}
                          >
                            ×
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Price/Acre</td>
                      {comparisonRecords.map(record => (
                        <td key={record.id}>
                          ${(typeof record.Price_Per_Acre === 'number' 
                            ? record.Price_Per_Acre 
                            : parseFloat(record.Price_Per_Acre) || 0
                          ).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Basin</td>
                      {comparisonRecords.map(record => (
                        <td key={record.id}>{record.Basin}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Formation</td>
                      {comparisonRecords.map(record => (
                        <td key={record.id}>{record.Formation}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No records selected for comparison. Click "Add to Compare" on records to compare them.</p>
            )}
          </div>
        </div>
      )}

      {/* Data Insights Panel */}
      {showDataInsights && (
        <div className="insights-panel">
          <div className="insights-header">
            <h3>🔬 Data Insights & Quality Analysis</h3>
            <button 
              className="close-insights-btn"
              onClick={() => setShowDataInsights(false)}
            >
              ×
            </button>
          </div>
          <div className="insights-content">
            <div className="quality-metrics">
              <div className="quality-card">
                <h4>📊 Data Completeness</h4>
                <div className="metric-grid">
                  <div className="metric">
                    <span className="metric-label">Price Data:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{width: `${dataQualityAnalysis.completeness.price}%`}}
                      ></div>
                      <span className="metric-value">{dataQualityAnalysis.completeness.price}%</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">County Data:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{width: `${dataQualityAnalysis.completeness.county}%`}}
                      ></div>
                      <span className="metric-value">{dataQualityAnalysis.completeness.county}%</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Basin Data:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{width: `${dataQualityAnalysis.completeness.basin}%`}}
                      ></div>
                      <span className="metric-value">{dataQualityAnalysis.completeness.basin}%</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Formation Data:</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{width: `${dataQualityAnalysis.completeness.formation}%`}}
                      ></div>
                      <span className="metric-value">{dataQualityAnalysis.completeness.formation}%</span>
                    </div>
                  </div>
                </div>
                <div className="overall-quality">
                  <span className="quality-label">Overall Quality Score:</span>
                  <span className="quality-score">{dataQualityAnalysis.qualityScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Panel */}
      {showAdvancedAnalytics && (
        <div className="analytics-panel">
          <div className="analytics-header">
            <h3>📈 Advanced Analytics</h3>
            <button 
              className="close-analytics-btn"
              onClick={() => setShowAdvancedAnalytics(false)}
            >
              ×
            </button>
          </div>
          <div className="analytics-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>💰 Price Distribution</h4>
                <div className="distribution-stats">
                  <div className="stat-row">
                    <span>Q1 (25th percentile):</span>
                    <span>${advancedAnalytics.priceDistribution.q1?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="stat-row">
                    <span>Median (50th percentile):</span>
                    <span>${advancedAnalytics.priceDistribution.median?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="stat-row">
                    <span>Q3 (75th percentile):</span>
                    <span>${advancedAnalytics.priceDistribution.q3?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="stat-row">
                    <span>Interquartile Range:</span>
                    <span>${advancedAnalytics.priceDistribution.iqr?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="analytics-card">
                <h4>📊 Data Quality Metrics</h4>
                <div className="quality-stats">
                  <div className="stat-row">
                    <span>Outliers Detected:</span>
                    <span className="outlier-count">{advancedAnalytics.outliers}</span>
                  </div>
                  <div className="stat-row">
                    <span>Price Volatility:</span>
                    <span>{advancedAnalytics.priceVolatility.toFixed(2)}%</span>
                  </div>
                  <div className="stat-row">
                    <span>Data Range:</span>
                    <span>${summary.minPrice.toLocaleString()} - ${summary.maxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Manager Panel */}
      {showColumnManager && (
        <div className="column-manager-panel">
          <div className="column-manager-header">
            <h3>📋 Column Visibility Manager</h3>
            <button 
              className="close-column-manager-btn"
              onClick={() => setShowColumnManager(false)}
            >
              ×
            </button>
          </div>
          <div className="column-manager-content">
            <div className="column-list">
              {Object.entries(columnVisibility).map(([column, visible]) => (
                <label key={column} className="column-item">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setColumnVisibility({
                      ...columnVisibility,
                      [column]: e.target.checked
                    })}
                  />
                  <span className="column-name">{column.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
            <div className="column-actions">
              <button 
                className="select-all-columns-btn"
                onClick={() => setColumnVisibility(
                  Object.keys(columnVisibility).reduce((acc, key) => ({...acc, [key]: true}), {})
                )}
              >
                Select All
              </button>
              <button 
                className="deselect-all-columns-btn"
                onClick={() => setColumnVisibility(
                  Object.keys(columnVisibility).reduce((acc, key) => ({...acc, [key]: false}), {})
                )}
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Panel */}
      {showKeyboardShortcuts && (
        <div className="shortcuts-panel">
          <div className="shortcuts-header">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <button 
              className="close-shortcuts-btn"
              onClick={() => setShowKeyboardShortcuts(false)}
            >
              ×
            </button>
          </div>
          <div className="shortcuts-content">
            <div className="shortcuts-grid">
              <div className="shortcut-group">
                <h4>Navigation</h4>
                <div className="shortcut-item">
                  <kbd>Ctrl + F</kbd>
                  <span>Toggle Filters</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + E</kbd>
                  <span>Export Data</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + C</kbd>
                  <span>Compare Records</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + A</kbd>
                  <span>Select All</span>
                </div>
              </div>
              <div className="shortcut-group">
                <h4>Interface</h4>
                <div className="shortcut-item">
                  <kbd>Ctrl + D</kbd>
                  <span>Toggle Dark Mode</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + T</kbd>
                  <span>Show Tutorial</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + K</kbd>
                  <span>Show Shortcuts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Panel */}
      {showTutorial && (
        <div className="tutorial-panel">
          <div className="tutorial-header">
            <h3>🎓 Interactive Tutorial</h3>
            <button 
              className="close-tutorial-btn"
              onClick={() => setShowTutorial(false)}
            >
              ×
            </button>
          </div>
          <div className="tutorial-content">
            <div className="tutorial-step">
              <h4>Step {tutorialStep + 1} of 5</h4>
              {tutorialStep === 0 && (
                <div>
                  <p>Welcome to the Enhanced Pricing Module! This tutorial will guide you through all the powerful features.</p>
                  <p>🎯 <strong>Goal:</strong> Learn to efficiently manage and analyze pricing data</p>
                </div>
              )}
              {tutorialStep === 1 && (
                <div>
                  <p>📊 <strong>Quick Stats:</strong> View key metrics at a glance in the header</p>
                  <p>🔍 <strong>Advanced Filters:</strong> Use the Filters button to narrow down your data</p>
                  <p>💡 <strong>Tip:</strong> Try filtering by county or price range!</p>
                </div>
              )}
              {tutorialStep === 2 && (
                <div>
                  <p>✏️ <strong>Bulk Operations:</strong> Select multiple records and use Bulk Edit</p>
                  <p>⚖️ <strong>Comparison:</strong> Add records to comparison for side-by-side analysis</p>
                  <p>❤️ <strong>Favorites:</strong> Mark important records as favorites</p>
                </div>
              )}
              {tutorialStep === 3 && (
                <div>
                  <p>📤 <strong>Export:</strong> Export your data in CSV or JSON format</p>
                  <p>🔬 <strong>Data Insights:</strong> Check data quality and completeness</p>
                  <p>📈 <strong>Analytics:</strong> View advanced statistical analysis</p>
                </div>
              )}
              {tutorialStep === 4 && (
                <div>
                  <p>⌨️ <strong>Keyboard Shortcuts:</strong> Use Ctrl+F, Ctrl+E, Ctrl+C for quick access</p>
                  <p>🌙 <strong>Dark Mode:</strong> Toggle between light and dark themes</p>
                  <p>🎉 <strong>You're all set!</strong> Explore the features and become a power user!</p>
                </div>
              )}
            </div>
            <div className="tutorial-navigation">
              <button 
                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                disabled={tutorialStep === 0}
              >
                ← Previous
              </button>
              <span className="tutorial-progress">
                {tutorialStep + 1} / 5
              </span>
              <button 
                onClick={() => setTutorialStep(Math.min(4, tutorialStep + 1))}
                disabled={tutorialStep === 4}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>${summary.averagePrice.toLocaleString()}</h3>
              <p>Avg Price/Acre</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>${summary.maxPrice.toLocaleString()}</h3>
              <p>Highest Price</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <h3>${summary.minPrice.toLocaleString()}</h3>
              <p>Lowest Price</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🏘️</div>
            <div className="card-content">
              <h3>{summary.uniqueCounties}</h3>
              <p>Counties</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">⛰️</div>
            <div className="card-content">
              <h3>{summary.uniqueFormations}</h3>
              <p>Formations</p>
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
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Counties</option>
            {uniqueCounties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>

          <select
            value={formationFilter}
            onChange={(e) => setFormationFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Formations</option>
            {uniqueFormations.map(formation => (
              <option key={formation} value={formation}>{formation}</option>
            ))}
          </select>

          <select
            value={basinFilter}
            onChange={(e) => setBasinFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Basins</option>
            {uniqueBasins.map(basin => (
              <option key={basin} value={basin}>{basin}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            className="price-input"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            className="price-input"
          />

          <button onClick={exportData} className="export-btn">
            📥 Export CSV
          </button>

          <button onClick={clearFilters} className="clear-filters-btn">
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      {/* Data Display */}
      <div className="data-section">
        {viewMode === 'table' && (
          <div className="table-container">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedRecords.size === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      title="Select All"
                    />
                  </th>
                  <th onClick={() => handleSort('County')} className="sortable">
                    County {sortField === 'County' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('Basin')} className="sortable">
                    Basin {sortField === 'Basin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('Survey_Company')} className="sortable">
                    Survey Company {sortField === 'Survey_Company' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('Formation')} className="sortable">
                    Formation {sortField === 'Formation' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {activeTab === 'oklahoma' && (
                    <th onClick={() => handleSort('S_T_R')} className="sortable">
                      S-T-R {sortField === 'S_T_R' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {activeTab === 'texas' && (
                    <th onClick={() => handleSort('Section')} className="sortable">
                      Section {sortField === 'Section' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  <th onClick={() => handleSort('Price_Per_Acre')} className="sortable">
                    Price/Acre {sortField === 'Price_Per_Acre' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record) => (
                  <tr key={record.id} className={`data-row ${selectedRecords.has(record.id) ? 'selected' : ''} ${favoriteRecords.has(record.id) ? 'favorite' : ''}`}>
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                      />
                    </td>
                    <td className="owner-cell">{record.County}</td>
                    <td>{record.Basin}</td>
                    <td className="owner-cell">{record.Survey_Company}</td>
                    <td>{record.Formation}</td>
                    {activeTab === 'oklahoma' && (
                      <td>{record.S_T_R || record.STR || '-'}</td>
                    )}
                    {activeTab === 'texas' && (
                      <td>{record.Section || '-'}</td>
                    )}
                    <td className="price-cell">
                      ${(typeof record.Price_Per_Acre === 'number' 
                        ? record.Price_Per_Acre 
                        : parseFloat(record.Price_Per_Acre) || 0
                      ).toLocaleString()}
                    </td>
                    <td className="actions-column">
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleRecordClick(record)}
                          className="action-btn-small"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => handleFavoriteToggle(record.id)}
                          className={`action-btn-small ${favoriteRecords.has(record.id) ? 'favorited' : ''}`}
                          title={favoriteRecords.has(record.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          {favoriteRecords.has(record.id) ? '❤️' : '🤍'}
                        </button>
                        <button 
                          onClick={() => handleAddToComparison(record)}
                          className="action-btn-small"
                          title="Add to Comparison"
                          disabled={comparisonRecords.length >= 5 || comparisonRecords.find(r => r.id === record.id)}
                        >
                          ⚖️
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(record, null, 2));
                            alert('Record copied to clipboard!');
                          }}
                          className="action-btn-small"
                          title="Copy Record"
                        >
                          📋
                        </button>
                      </div>
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
              <div key={record.id} className="pricing-card">
                <div className="card-header">
                  <h3>{record.County} County</h3>
                  <span className="price-badge">
                    ${(typeof record.Price_Per_Acre === 'number' 
                      ? record.Price_Per_Acre 
                      : parseFloat(record.Price_Per_Acre) || 0
                    ).toLocaleString()}/acre
                  </span>
                </div>
                <div className="card-content">
                  <div className="card-row">
                    <span className="label">Basin:</span>
                    <span className="value">{record.Basin}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Formation:</span>
                    <span className="value">{record.Formation}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Survey Company:</span>
                    <span className="value">{record.Survey_Company}</span>
                  </div>
                  {activeTab === 'oklahoma' && record.S_T_R && (
                    <div className="card-row">
                      <span className="label">S-T-R:</span>
                      <span className="value">{record.S_T_R}</span>
                    </div>
                  )}
                  {activeTab === 'texas' && record.Section && (
                    <div className="card-row">
                      <span className="label">Section:</span>
                      <span className="value">{record.Section}</span>
                    </div>
                  )}
                  {record.Acquisition_Area && (
                    <div className="card-row">
                      <span className="label">Acquisition Area:</span>
                      <span className="value">{record.Acquisition_Area}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => handleRecordClick(record)}
                    className="view-details-btn"
                  >
                    View All Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="analytics-container">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Price by Formation</h4>
                <div className="chart-container">
                  {Object.entries(summary.priceByFormation)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([formation, totalPrice]) => (
                      <div key={formation} className="chart-bar">
                        <span className="bar-label">{formation}</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${(totalPrice / Math.max(...Object.values(summary.priceByFormation))) * 100}%` 
                            }}
                          ></div>
                          <span className="bar-value">${totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="analytics-card">
                <h4>Price by County</h4>
                <div className="chart-container">
                  {Object.entries(summary.priceByCounty)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([county, totalPrice]) => (
                      <div key={county} className="chart-bar">
                        <span className="bar-label">{county}</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${(totalPrice / Math.max(...Object.values(summary.priceByCounty))) * 100}%` 
                            }}
                          ></div>
                          <span className="bar-value">${totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredData.length} records)
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pricing Details - {selectedRecord.County} County</h3>
              <div className="modal-actions">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="close-btn"
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="modal-body scrollable">
              <div className="detail-grid">
                {Object.entries(selectedRecord).map(([key, value]) => {
                  // Skip empty or null values
                  if (!value || value === '' || value === null) return null;
                  
                  // Format the key for display
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  
                  // Special formatting for price fields
                  const isPriceField = key.includes('Price') || key.includes('BOE') || key.includes('ANUM');
                  const isDateField = key.includes('created_at') || key.includes('updated_at');
                  const isEditable = !isDateField && key !== 'id';
                  
                  return (
                    <div key={key} className="detail-item">
                      <label className="detail-label" htmlFor={`edit-${key}`}>
                        {displayKey}:
                      </label>
                      {isEditable ? (
                        <input
                          id={`edit-${key}`}
                          type={isPriceField ? 'number' : 'text'}
                          className={`detail-input ${isPriceField ? 'price-input' : ''}`}
                          defaultValue={
                            isPriceField && typeof value === 'string' && !isNaN(parseFloat(value))
                              ? parseFloat(value).toString()
                              : String(value)
                          }
                          step={isPriceField ? '0.01' : undefined}
                          onChange={(e) => {
                            // Update the selectedRecord in real-time
                            const updatedRecord = { ...selectedRecord };
                            updatedRecord[key] = isPriceField ? parseFloat(e.target.value) || 0 : e.target.value;
                            setSelectedRecord(updatedRecord);
                          }}
                        />
                      ) : (
                        <span className={`detail-value ${isPriceField ? 'price-highlight' : ''}`}>
                          {isPriceField && typeof value === 'string' && !isNaN(parseFloat(value)) 
                            ? `$${parseFloat(value).toLocaleString()}` 
                            : isDateField 
                              ? new Date(value).toLocaleDateString()
                              : String(value)
                          }
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="save-btn"
                onClick={() => {
                  // Here you would typically save the changes to the backend
                  alert('Changes saved! (This would normally update the database)');
                  setShowModal(false);
                }}
              >
                💾 Save Changes
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
