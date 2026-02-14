import React, { useState, useEffect, useMemo } from 'react';
import './PricingPage.css';
import { fetchOklahomaPricing, fetchTexasPricing } from '../services/apiClient';

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
  const [filtersExpanded, setFiltersExpanded] = useState(true);
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

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('pricing-column-widths');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [oklahomaData, texasData] = await Promise.all([
          fetchOklahomaPricing(),
          fetchTexasPricing()
        ]);

        console.log('Oklahoma data received:', oklahomaData);
        console.log('Texas data received:', texasData);
        
        if (oklahomaData.success) {
          setOklahomaData(oklahomaData.data || []);
        } else {
          console.error('Oklahoma API error:', oklahomaData);
        }

        if (texasData.success) {
          setTexasData(texasData.data || []);
        } else {
          console.error('Texas API error:', texasData);
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

  const handleResizeStart = (e: React.MouseEvent, key: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(key);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingColumn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(20, resizeStartWidth + diff);
      setColumnWidths(prev => {
        const next = { ...prev, [resizingColumn]: newWidth };
        try {
          localStorage.setItem('pricing-column-widths', JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    };
    const handleMouseUp = () => setResizingColumn(null);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const getColumnWidth = (key: string): number => columnWidths[key] ?? 120;

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

  const hasActiveFilters = !!(searchTerm || countyFilter || formationFilter || basinFilter || priceRange.min || priceRange.max);

  return (
    <div className="pricing-page">
      <header className="pricing-header">
        <div className="pricing-header-accent" aria-hidden />
        <div className="pricing-header-inner">
          <div className="pricing-header-text">
            <h1 className="pricing-title">Mineral Rights Pricing</h1>
            <p className="pricing-subtitle">Oklahoma and Texas pricing data</p>
          </div>
          <div className="pricing-view-toggle" role="group" aria-label="View mode">
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'}>Table</button>
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')} aria-pressed={viewMode === 'cards'}>Cards</button>
            <button type="button" className={viewMode === 'analytics' ? 'active' : ''} onClick={() => setViewMode('analytics')} aria-pressed={viewMode === 'analytics'}>Analytics</button>
          </div>
        </div>
      </header>

      <div className="pricing-tabs-wrap" role="tablist" aria-label="State">
        <button type="button" role="tab" aria-selected={activeTab === 'oklahoma'} className={`pricing-tab ${activeTab === 'oklahoma' ? 'active' : ''}`} onClick={() => setActiveTab('oklahoma')}>
          Oklahoma <span className="pricing-tab-count">{oklahomaData.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'texas'} className={`pricing-tab ${activeTab === 'texas' ? 'active' : ''}`} onClick={() => setActiveTab('texas')}>
          Texas <span className="pricing-tab-count">{texasData.length}</span>
        </button>
      </div>

      <section className="pricing-stats" aria-label="Summary">
        <div className="pricing-stat">
          <span className="pricing-stat-value">{summary.totalRecords.toLocaleString()}</span>
          <span className="pricing-stat-label">Records</span>
        </div>
        <div className="pricing-stat pricing-stat-highlight">
          <span className="pricing-stat-value">${summary.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className="pricing-stat-label">Avg $/acre</span>
        </div>
        <div className="pricing-stat">
          <span className="pricing-stat-value">${summary.minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className="pricing-stat-label">Min</span>
        </div>
        <div className="pricing-stat">
          <span className="pricing-stat-value">${summary.maxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className="pricing-stat-label">Max</span>
        </div>
        <div className="pricing-stat">
          <span className="pricing-stat-value">{summary.uniqueCounties}</span>
          <span className="pricing-stat-label">Counties</span>
        </div>
        <div className="pricing-stat">
          <span className="pricing-stat-value">{summary.uniqueFormations}</span>
          <span className="pricing-stat-label">Formations</span>
        </div>
      </section>

      <section className="pricing-filters">
        <button type="button" className="pricing-filters-toggle" onClick={() => setFiltersExpanded(!filtersExpanded)} aria-expanded={filtersExpanded}>
          <span className="pricing-filters-toggle-icon" aria-hidden>{filtersExpanded ? '▼' : '▶'}</span>
          <span>{filtersExpanded ? 'Hide filters' : 'Show filters'}</span>
          {hasActiveFilters && <span className="pricing-filters-badge">{[countyFilter, formationFilter, basinFilter, searchTerm, priceRange.min, priceRange.max].filter(Boolean).length}</span>}
        </button>
        {hasActiveFilters && (
          <div className="pricing-filter-chips">
            {searchTerm && (
              <span className="pricing-chip">
                Search: “{searchTerm.slice(0, 20)}{searchTerm.length > 20 ? '…' : ''}”
                <button type="button" onClick={() => setSearchTerm('')} className="pricing-chip-remove" aria-label="Clear search">×</button>
              </span>
            )}
            {countyFilter && (
              <span className="pricing-chip">
                County: {countyFilter}
                <button type="button" onClick={() => setCountyFilter('')} className="pricing-chip-remove" aria-label="Clear county">×</button>
              </span>
            )}
            {formationFilter && (
              <span className="pricing-chip">
                Formation: {formationFilter}
                <button type="button" onClick={() => setFormationFilter('')} className="pricing-chip-remove" aria-label="Clear formation">×</button>
              </span>
            )}
            {basinFilter && (
              <span className="pricing-chip">
                Basin: {basinFilter}
                <button type="button" onClick={() => setBasinFilter('')} className="pricing-chip-remove" aria-label="Clear basin">×</button>
              </span>
            )}
            {(priceRange.min || priceRange.max) && (
              <span className="pricing-chip">
                Price: {priceRange.min || '—'} – {priceRange.max || '—'}
                <button type="button" onClick={() => setPriceRange({ min: '', max: '' })} className="pricing-chip-remove" aria-label="Clear price range">×</button>
              </span>
            )}
            <button type="button" className="pricing-chip pricing-chip-clear" onClick={clearFilters}>Clear all</button>
          </div>
        )}
        <div className={`pricing-filters-content ${filtersExpanded ? 'is-open' : ''}`}>
          <div className="pricing-filters-grid">
            <div className="pricing-search-wrap">
              <span className="pricing-search-icon" aria-hidden>⌕</span>
              <input type="search" placeholder="Search…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pricing-search" />
            </div>
            <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} className="pricing-select" aria-label="County">
              <option value="">All counties</option>
              {uniqueCounties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={formationFilter} onChange={(e) => setFormationFilter(e.target.value)} className="pricing-select" aria-label="Formation">
              <option value="">All formations</option>
              {uniqueFormations.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={basinFilter} onChange={(e) => setBasinFilter(e.target.value)} className="pricing-select" aria-label="Basin">
              <option value="">All basins</option>
              {uniqueBasins.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="pricing-price-range">
              <label className="pricing-input-label">Min $</label>
              <input type="number" placeholder="0" value={priceRange.min} onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))} className="pricing-input-num" />
            </div>
            <div className="pricing-price-range">
              <label className="pricing-input-label">Max $</label>
              <input type="number" placeholder="—" value={priceRange.max} onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))} className="pricing-input-num" />
            </div>
            {hasActiveFilters && <button type="button" className="pricing-btn pricing-btn-ghost" onClick={clearFilters}>Clear filters</button>}
            <button type="button" className="pricing-btn pricing-btn-primary" onClick={exportData}>Export CSV</button>
          </div>
        </div>
      </section>

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

      {/* Data Display */}
      <div className="data-section">
        {filteredData.length === 0 && (
          <div className="pricing-empty">
            <div className="pricing-empty-icon" aria-hidden>📋</div>
            <h3 className="pricing-empty-title">No records match your filters</h3>
            <p className="pricing-empty-text">Try adjusting search, county, formation, basin, or price range.</p>
            <button type="button" className="pricing-btn pricing-btn-primary" onClick={clearFilters}>Clear all filters</button>
          </div>
        )}
        {viewMode === 'table' && filteredData.length > 0 && (() => {
          const tableColumns = activeTab === 'oklahoma'
            ? [
                { key: 'County', label: 'County', sortKey: 'County' as keyof PricingRecord },
                { key: 'Basin', label: 'Basin', sortKey: 'Basin' as keyof PricingRecord },
                { key: 'Survey_Company', label: 'Survey Company', sortKey: 'Survey_Company' as keyof PricingRecord },
                { key: 'Formation', label: 'Formation', sortKey: 'Formation' as keyof PricingRecord },
                { key: 'S_T_R', label: 'S-T-R', sortKey: 'S_T_R' as keyof PricingRecord },
                { key: 'Price_Per_Acre', label: 'Price/Acre', sortKey: 'Price_Per_Acre' as keyof PricingRecord },
                { key: 'actions', label: 'Actions', sortKey: null }
              ]
            : [
                { key: 'County', label: 'County', sortKey: 'County' as keyof PricingRecord },
                { key: 'Basin', label: 'Basin', sortKey: 'Basin' as keyof PricingRecord },
                { key: 'Survey_Company', label: 'Survey Company', sortKey: 'Survey_Company' as keyof PricingRecord },
                { key: 'Formation', label: 'Formation', sortKey: 'Formation' as keyof PricingRecord },
                { key: 'Section', label: 'Section', sortKey: 'Section' as keyof PricingRecord },
                { key: 'Price_Per_Acre', label: 'Price/Acre', sortKey: 'Price_Per_Acre' as keyof PricingRecord },
                { key: 'actions', label: 'Actions', sortKey: null }
              ];
          return (
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
                  {tableColumns.map((col) => {
                    const width = getColumnWidth(col.key);
                    const isResizing = resizingColumn === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`pricing-th ${col.sortKey ? 'sortable' : ''}`}
                        style={{ width: `${width}px`, minWidth: col.key === 'actions' ? undefined : `${width}px` }}
                        onClick={col.sortKey ? (e) => { if ((e.target as HTMLElement).classList.contains('pricing-resizer')) return; handleSort(col.sortKey!); } : undefined}
                      >
                        <span className="pricing-th-inner">
                          {col.label}
                          {col.sortKey && sortField === col.sortKey && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                        </span>
                        {col.key !== 'actions' && (
                          <div
                            className={`pricing-resizer ${isResizing ? 'active' : ''}`}
                            onMouseDown={(e) => handleResizeStart(e, col.key, width)}
                            aria-hidden
                          />
                        )}
                      </th>
                    );
                  })}
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
                    {tableColumns.map((col) => {
                      const width = getColumnWidth(col.key);
                      const style = col.key !== 'actions' ? { width: `${width}px`, minWidth: `${width}px` } : undefined;
                      if (col.key === 'County') return <td key={col.key} className="owner-cell" style={style}>{record.County}</td>;
                      if (col.key === 'Basin') return <td key={col.key} style={style}>{record.Basin}</td>;
                      if (col.key === 'Survey_Company') return <td key={col.key} className="owner-cell" style={style}>{record.Survey_Company}</td>;
                      if (col.key === 'Formation') return <td key={col.key} style={style}>{record.Formation}</td>;
                      if (col.key === 'S_T_R') return <td key={col.key} style={style}>{record.S_T_R || record.STR || '-'}</td>;
                      if (col.key === 'Section') return <td key={col.key} style={style}>{record.Section || '-'}</td>;
                      if (col.key === 'Price_Per_Acre') return (
                        <td key={col.key} className="price-cell" style={style}>
                          ${(typeof record.Price_Per_Acre === 'number' ? record.Price_Per_Acre : parseFloat(record.Price_Per_Acre) || 0).toLocaleString()}
                        </td>
                      );
                      return (
                        <td key={col.key} className="actions-column" style={style}>
                          <div className="action-buttons">
                            <button onClick={() => handleRecordClick(record)} className="action-btn-small" title="View Details">👁️</button>
                            <button onClick={() => handleFavoriteToggle(record.id)} className={`action-btn-small ${favoriteRecords.has(record.id) ? 'favorited' : ''}`} title={favoriteRecords.has(record.id) ? 'Remove from Favorites' : 'Add to Favorites'}>{favoriteRecords.has(record.id) ? '❤️' : '🤍'}</button>
                            <button onClick={() => handleAddToComparison(record)} className="action-btn-small" title="Add to Comparison" disabled={comparisonRecords.length >= 5 || !!comparisonRecords.find(r => r.id === record.id)}>⚖️</button>
                            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(record, null, 2)); alert('Record copied to clipboard!'); }} className="action-btn-small" title="Copy Record">📋</button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          );
        })()}

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

        {viewMode === 'analytics' && filteredData.length > 0 && (
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
