import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldExclamationIcon,
  GlobeAltIcon,
  UserGroupIcon,
  CogIcon
} from './icons/Icons';
import type { 
  ESGProfile, 
  ESGRiskFlag, 
  User 
} from '../types';
import * as api from '../services/api';

interface ESGTabProps {
  currentUser: User;
  relatedTractId?: string;
  relatedUnitId?: string;
  relatedDealId?: string;
}

const ESGTab: React.FC<ESGTabProps> = ({ 
  currentUser, 
  relatedTractId, 
  relatedUnitId, 
  relatedDealId 
}) => {
  // State management
  const [esgProfile, setEsgProfile] = useState<ESGProfile | null>(null);
  const [riskFlags, setRiskFlags] = useState<ESGRiskFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showCreateFlag, setShowCreateFlag] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    if (relatedTractId || relatedUnitId) {
      fetchESGData();
    }
  }, [relatedTractId, relatedUnitId]);

  const fetchESGData = async () => {
    setIsLoading(true);
    try {
      // Find ESG profile for this asset
      const profiles = await api.fetchESGProfiles();
      const assetProfile = profiles.find(profile => 
        profile.tractId === relatedTractId || profile.unitId === relatedUnitId
      );
      
      if (assetProfile) {
        setEsgProfile(assetProfile);
      }

      // Fetch risk flags for this asset
      if (relatedTractId || relatedUnitId) {
        const flags = await api.fetchESGRiskFlags(relatedTractId || relatedUnitId);
        setRiskFlags(flags);
      }
    } catch (error) {
      console.error('Failed to fetch ESG data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getDataCompletenessColor = (completeness: string) => {
    switch (completeness) {
      case 'Complete': return 'text-green-600 bg-green-100';
      case 'Partial': return 'text-yellow-600 bg-yellow-100';
      case 'Incomplete': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to safely format dates
  const formatDate = (date: Date | string | undefined | null): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading ESG data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">ESG Profile</h3>
          <p className="text-sm text-gray-600">
            Environmental, Social, and Governance metrics for this asset
          </p>
        </div>
        <div className="flex space-x-3">
          {!esgProfile && (
            <button
              onClick={() => setShowCreateProfile(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create ESG Profile
            </button>
          )}
          {esgProfile && (
            <button
              onClick={() => setShowEditProfile(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
          <button
            onClick={() => setShowCreateFlag(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Risk Flag
          </button>
        </div>
      </div>

      {/* ESG Profile Summary */}
      {esgProfile ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">ESG Metrics</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Risk Assessment */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-3">Risk Assessment</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Risk Level</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(esgProfile.overallRiskLevel)}`}>
                      {esgProfile.overallRiskLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Operator Compliance</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceScoreColor(esgProfile.operatorComplianceScore)}`}>
                      {esgProfile.operatorComplianceScore}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Title Status</span>
                    <span className="text-sm font-medium text-gray-900">{esgProfile.titleVerificationStatus}</span>
                  </div>
                </div>
              </div>

              {/* Environmental Metrics */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-3">Environmental</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Carbon Intensity</span>
                    <span className="text-sm font-medium text-gray-900">
                      {esgProfile.carbonIntensity ? `${esgProfile.carbonIntensity.toFixed(2)} tCO2e/BOE` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Emissions</span>
                    <span className="text-sm font-medium text-gray-900">
                      {esgProfile.emissionsData?.totalEmissions ? `${esgProfile.emissionsData.totalEmissions.toLocaleString()} tCO2e` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Data Quality</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDataCompletenessColor(esgProfile.dataCompleteness)}`}>
                      {esgProfile.dataCompleteness}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social & Governance */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-3">Social & Governance</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Surface Use</span>
                    <span className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {esgProfile.surfaceUseSensitivity || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Community Engagement</span>
                    <span className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {esgProfile.communityEngagement || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(esgProfile.lastDataUpdate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {esgProfile.riskFactors && esgProfile.riskFactors.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-500 mb-3">Risk Factors</h5>
                <div className="flex flex-wrap gap-2">
                  {esgProfile.riskFactors.map((factor, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Environmental Flags */}
            {esgProfile.environmentalFlags && esgProfile.environmentalFlags.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-500 mb-3">Environmental Flags</h5>
                <div className="flex flex-wrap gap-2">
                  {esgProfile.environmentalFlags.map((flag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No ESG Profile</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating an ESG profile for this asset.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateProfile(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create ESG Profile
            </button>
          </div>
        </div>
      )}

      {/* Risk Flags */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Risk Flags</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {riskFlags.length > 0 ? (
            riskFlags.map((flag) => (
              <div key={flag.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(flag.riskLevel)}`}>
                      {flag.riskLevel}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{flag.riskType}</span>
                    <span className="text-sm text-gray-500">{flag.description}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      flag.isResolved ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                    }`}>
                      {flag.isResolved ? 'Resolved' : 'Open'}
                    </span>
                    <button className="text-blue-600 hover:text-blue-900">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {flag.notes && (
                  <p className="mt-2 text-sm text-gray-600">{flag.notes}</p>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No risk flags identified for this asset.
            </div>
          )}
        </div>
      </div>

      {/* Data Source Information */}
      {esgProfile && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Data Source Information</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-3">Data Quality</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Source</span>
                    <span className="text-sm font-medium text-gray-900">{esgProfile.dataSource}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completeness</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDataCompletenessColor(esgProfile.dataCompleteness)}`}>
                      {esgProfile.dataCompleteness}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Update</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(esgProfile.lastDataUpdate)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-3">Audit Trail</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created By</span>
                    <span className="text-sm font-medium text-gray-900">{esgProfile.createdBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(esgProfile.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Modified</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(esgProfile.lastModifiedAt)}
                    </span>
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

export default ESGTab;
