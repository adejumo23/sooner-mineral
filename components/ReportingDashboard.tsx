import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  FunnelIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  DownloadIcon,
  FilterIcon,
  RefreshIcon
} from './icons/Icons';
import FunnelChart from './charts/FunnelChart';
import BarChart from './charts/BarChart';
import MetricCard from './charts/MetricCard';
import type { 
  LeadConversionFunnel, 
  OutreachActivitySummary, 
  AssignmentPerformanceMetrics,
  DealVelocityMetrics,
  ESGComplianceSummary,
  ReportFilter
} from '../types';
import * as api from '../services/api';

interface ReportingDashboardProps {
  currentUser: any; // User type
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ currentUser }) => {
  const [filters, setFilters] = useState<ReportFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  
  // Dashboard data
  const [leadConversionData, setLeadConversionData] = useState<LeadConversionFunnel | null>(null);
  const [outreachData, setOutreachData] = useState<OutreachActivitySummary | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentPerformanceMetrics | null>(null);
  const [dealVelocityData, setDealVelocityData] = useState<DealVelocityMetrics | null>(null);
  const [esgData, setEsgData] = useState<ESGComplianceSummary | null>(null);

  useEffect(() => {
    fetchData();
    fetchFilterOptions();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        leadData,
        outreachData,
        assignmentData,
        dealData,
        esgData
      ] = await Promise.all([
        api.fetchLeadConversionFunnel(filters),
        api.fetchOutreachActivitySummary(filters),
        api.fetchAssignmentPerformanceMetrics(filters),
        api.fetchDealVelocityMetrics(filters),
        api.fetchESGComplianceSummary(filters)
      ]);

      setLeadConversionData(leadData);
      setOutreachData(outreachData);
      setAssignmentData(assignmentData);
      setDealVelocityData(dealData);
      setEsgData(esgData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await api.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const handleExport = async (reportTitle: string, exportType: 'csv' | 'excel' | 'pdf') => {
    try {
      const exportData = await api.exportDashboardData(reportTitle, exportType, filters);
      // In a real app, this would trigger file download
      console.log('Export successful:', exportData);
      alert(`${exportType.toUpperCase()} export started for ${reportTitle}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reporting & Dashboards</h1>
              <p className="text-sm text-gray-600">Real-time visibility into CRM performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={fetchData}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filterOptions && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyers</label>
                  <select
                    multiple
                    value={filters.buyers || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, buyers: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {filterOptions.buyers.map((buyer: any) => (
                      <option key={buyer.id} value={buyer.id}>{buyer.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counties</label>
                  <select
                    multiple
                    value={filters.counties || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, counties: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {filterOptions.counties.map((county: string) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basins</label>
                  <select
                    multiple
                    value={filters.basins || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, basins: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {filterOptions.basins.map((basin: string) => (
                      <option key={basin} value={basin}>{basin}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sources</label>
                  <select
                    multiple
                    value={filters.sources || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, sources: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {filterOptions.sources.map((source: string) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statuses</label>
                  <select
                    multiple
                    value={filters.statuses || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, statuses: selected }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {filterOptions.statuses.map((status: string) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Contacts"
            value={leadConversionData?.totalContacts || 0}
            subtitle="In pipeline"
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Overall Conversion"
            value={`${leadConversionData?.conversionRates.overallConversion || 0}%`}
            subtitle="Contact to Deal"
            icon={<FunnelIcon className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title="Total Deals"
            value={dealVelocityData?.totalDeals || 0}
            subtitle={`$${(dealVelocityData?.totalGrossValue || 0).toLocaleString()}`}
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            color="purple"
          />
          <MetricCard
            title="ESG Compliance"
            value={`${esgData?.complianceRates.overallCompliance || 0}%`}
            subtitle="Overall compliance rate"
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            color="yellow"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Conversion Funnel */}
          {leadConversionData && (
            <FunnelChart
              title="Lead Conversion Funnel"
              data={[
                {
                  stage: 'Contacts',
                  value: leadConversionData.totalContacts,
                  percentage: 100,
                  color: '#3B82F6'
                },
                {
                  stage: 'Leads',
                  value: leadConversionData.contactsToLeads,
                  percentage: leadConversionData.conversionRates.contactToLead,
                  color: '#10B981'
                },
                {
                  stage: 'LOIs',
                  value: leadConversionData.leadsToLOI,
                  percentage: leadConversionData.conversionRates.leadToLOI,
                  color: '#F59E0B'
                },
                {
                  stage: 'Deals',
                  value: leadConversionData.loiToDeals,
                  percentage: leadConversionData.conversionRates.loiToDeal,
                  color: '#EF4444'
                }
              ]}
            />
          )}

          {/* Outreach Activity by Type */}
          {outreachData && (
            <BarChart
              title="Outreach Activity by Type"
              data={[
                { label: 'Emails', value: outreachData.byType.emails, color: '#3B82F6' },
                { label: 'Calls', value: outreachData.byType.calls, color: '#10B981' },
                { label: 'Letters', value: outreachData.byType.letters, color: '#F59E0B' },
                { label: 'SMS', value: outreachData.byType.sms, color: '#8B5CF6' }
              ]}
              horizontal={true}
            />
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assignment Performance */}
          {assignmentData && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Assignment Performance</h3>
                <button
                  onClick={() => handleExport('Assignment Performance', 'csv')}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <DownloadIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {assignmentData.averagePriorityScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Priority Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${assignmentData.averagePricePerAcre.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Avg $/Acre</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {assignmentData.averageContactRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Contact Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {assignmentData.averageDealCloseRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Close Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deal Velocity Metrics */}
          {dealVelocityData && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deal Velocity</h3>
                <button
                  onClick={() => handleExport('Deal Velocity', 'csv')}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <DownloadIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {dealVelocityData.totalNMA.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total NMA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${dealVelocityData.averagePricePerAcre.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Avg $/Acre</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {dealVelocityData.trends.averageCloseTime}
                    </div>
                    <div className="text-sm text-gray-600">Avg Close Time (days)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {dealVelocityData.trends.pipelineVelocity.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Pipeline Velocity</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ESG Compliance */}
        {esgData && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">ESG Compliance Summary</h3>
              <button
                onClick={() => handleExport('ESG Compliance', 'csv')}
                className="text-orange-600 hover:text-orange-700"
              >
                <DownloadIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {esgData.complianceRates.regulatoryFlags.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Regulatory Flags</div>
                <div className="text-xs text-gray-500 mt-1">
                  {esgData.regulatoryFlags} of {esgData.totalTracts} tracts
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {esgData.complianceRates.carbonScores.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Carbon Scores</div>
                <div className="text-xs text-gray-500 mt-1">
                  {esgData.carbonScores} of {esgData.totalTracts} tracts
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {esgData.complianceRates.verifiedTitle.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Verified Title</div>
                <div className="text-xs text-gray-500 mt-1">
                  {esgData.verifiedTitle} of {esgData.totalTracts} tracts
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingDashboard;
