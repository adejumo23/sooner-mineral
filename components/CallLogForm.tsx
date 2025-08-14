import React, { useState, useEffect } from 'react';
import { ContactEnhanced, ContactCallLog } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';

interface CallLogFormProps {
  callLog?: ContactCallLog | null;
  onSave: (data: Partial<ContactCallLog>) => void;
  onCancel: () => void;
  contact: ContactEnhanced | null;
}

const CallLogForm: React.FC<CallLogFormProps> = ({ callLog, onSave, onCancel, contact }) => {
  const [formData, setFormData] = useState<Partial<ContactCallLog>>({
    callDate: new Date().toISOString().split('T')[0],
    callTime: new Date().toTimeString().slice(0, 5),
    caller: '',
    callType: 'Outbound',
    callStatus: 'Completed',
    notes: '',
    followUpFlag: false,
    followUpDate: '',
    duration: 0,
    outcome: 'Spoke',
    nextAction: '',
    nextActionDate: '',
    tractIds: [],
    unitIds: [],
  });

  useEffect(() => {
    if (callLog) {
      setFormData({
        callDate: callLog.callDate.split('T')[0],
        callTime: callLog.callTime,
        caller: callLog.caller,
        callType: callLog.callType,
        callStatus: callLog.callStatus,
        notes: callLog.notes,
        followUpFlag: callLog.followUpFlag,
        followUpDate: callLog.followUpDate?.split('T')[0] || '',
        duration: callLog.duration,
        outcome: callLog.outcome,
        nextAction: callLog.nextAction || '',
        nextActionDate: callLog.nextActionDate?.split('T')[0] || '',
        tractIds: callLog.tractIds || [],
        unitIds: callLog.unitIds || [],
      });
    } else {
      // Set default caller to current user
      setFormData(prev => ({
        ...prev,
        caller: 'Current User', // TODO: Get from auth context
      }));
    }
  }, [callLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Date *
          </label>
          <Input
            type="date"
            value={formData.callDate}
            onChange={(e) => handleInputChange('callDate', e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Time *
          </label>
          <Input
            type="time"
            value={formData.callTime}
            onChange={(e) => handleInputChange('callTime', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Caller *
          </label>
          <Input
            type="text"
            value={formData.caller}
            onChange={(e) => handleInputChange('caller', e.target.value)}
            placeholder="Who made/received the call"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Type *
          </label>
          <select
            value={formData.callType}
            onChange={(e) => handleInputChange('callType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Outbound">Outbound</option>
            <option value="Inbound">Inbound</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Meeting">Meeting</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Call Status *
          </label>
          <select
            value={formData.callStatus}
            onChange={(e) => handleInputChange('callStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Completed">Completed</option>
            <option value="No Answer">No Answer</option>
            <option value="Left Message">Left Message</option>
            <option value="Busy">Busy</option>
            <option value="Disconnected">Disconnected</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (seconds)
          </label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Outcome *
        </label>
        <select
          value={formData.outcome}
          onChange={(e) => handleInputChange('outcome', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="No Answer">No Answer</option>
          <option value="Left Message">Left Message</option>
          <option value="Spoke">Spoke</option>
          <option value="Scheduled Follow-up">Scheduled Follow-up</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Interested">Interested</option>
          <option value="Qualified">Qualified</option>
          <option value="Disqualified">Disqualified</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes *
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Detailed notes about the call..."
          required
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.followUpFlag}
            onChange={(e) => handleInputChange('followUpFlag', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Follow-up required</span>
        </label>
        
        {formData.followUpFlag && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Date
            </label>
            <Input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => handleInputChange('followUpDate', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Next Action
          </label>
          <Input
            type="text"
            value={formData.nextAction}
            onChange={(e) => handleInputChange('nextAction', e.target.value)}
            placeholder="What should happen next?"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Next Action Date
          </label>
          <Input
            type="date"
            value={formData.nextActionDate}
            onChange={(e) => handleInputChange('nextActionDate', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {callLog ? 'Update Call Log' : 'Add Call Log'}
        </Button>
      </div>
    </form>
  );
};

export default CallLogForm;
