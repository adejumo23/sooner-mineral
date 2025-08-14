import React from 'react';
import { ContactCallLog } from '../types';
import { PhoneIcon, CalendarIcon, ClockIcon, UserIcon, ExclamationTriangleIcon } from './icons/Icons';

interface CallLogDetailsProps {
  callLog: ContactCallLog;
}

const CallLogDetails: React.FC<CallLogDetailsProps> = ({ callLog }) => {
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallTypeColor = (callType: string) => {
    switch (callType) {
      case 'Outbound': return 'bg-blue-100 text-blue-800';
      case 'Inbound': return 'bg-green-100 text-green-800';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-800';
      case 'Meeting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'No Answer': return 'bg-red-100 text-red-800';
      case 'Left Message': return 'bg-yellow-100 text-yellow-800';
      case 'Busy': return 'bg-orange-100 text-orange-800';
      case 'Disconnected': return 'bg-red-100 text-red-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'Not Interested': return 'bg-red-100 text-red-800';
      case 'Qualified': return 'bg-blue-100 text-blue-800';
      case 'Disqualified': return 'bg-red-100 text-red-800';
      case 'Spoke': return 'bg-blue-100 text-blue-800';
      case 'Left Message': return 'bg-yellow-100 text-yellow-800';
      case 'No Answer': return 'bg-gray-100 text-gray-800';
      case 'Scheduled Follow-up': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with key information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PhoneIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {callLog.callType} Call
              </h4>
              <p className="text-sm text-gray-600">
                {new Date(callLog.callDate).toLocaleDateString()} at {callLog.callTime}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCallStatusColor(callLog.callStatus)}`}>
              {callLog.callStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Call Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Caller</label>
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{callLog.caller}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Call Type</label>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCallTypeColor(callLog.callType)}`}>
              {callLog.callType}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{formatDuration(callLog.duration)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Outcome</label>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(callLog.outcome)}`}>
              {callLog.outcome}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Call Date</label>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">
                {new Date(callLog.callDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Call Time</label>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{callLog.callTime}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Follow-up Required</label>
            <div className="flex items-center space-x-2">
              {callLog.followUpFlag ? (
                <>
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Yes</span>
                  {callLog.followUpDate && (
                    <span className="text-sm text-gray-600">
                      ({new Date(callLog.followUpDate).toLocaleDateString()})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-500">No</span>
              )}
            </div>
          </div>

          {callLog.nextAction && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Next Action</label>
              <span className="text-sm text-gray-900">{callLog.nextAction}</span>
              {callLog.nextActionDate && (
                <div className="text-xs text-gray-500 mt-1">
                  Due: {new Date(callLog.nextActionDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">Call Notes</label>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{callLog.notes}</p>
        </div>
      </div>

      {/* Associated Data */}
      {(callLog.tractIds?.length > 0 || callLog.unitIds?.length > 0) && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Associated Assets</label>
          <div className="bg-gray-50 p-4 rounded-lg">
            {callLog.tractIds?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tracts:</span>
                <div className="mt-1 space-x-2">
                  {callLog.tractIds.map(tractId => (
                    <span key={tractId} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {tractId}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {callLog.unitIds?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Units:</span>
                <div className="mt-1 space-x-2">
                  {callLog.unitIds.map(unitId => (
                    <span key={unitId} className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      {unitId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t pt-4">
        <div className="text-xs text-gray-500">
          <div>Created: {new Date(callLog.createdAt).toLocaleString()}</div>
          {callLog.updatedAt && callLog.updatedAt !== callLog.createdAt && (
            <div>Updated: {new Date(callLog.updatedAt).toLocaleString()}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogDetails;
