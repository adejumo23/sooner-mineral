import React, { useState, useEffect } from 'react';
import type { Lead, LeadCallLog, LeadNote, User } from '../types';
import * as api from '../services/api';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  DocumentTextIcon, 
  CogIcon, 
  UserIcon,
  CalendarIcon,
  FilterIcon,
  PlusIcon
} from './icons/Icons';

interface ActivityLogTabProps {
  leadId: string;
  users: User[];
}

interface ActivityEntry {
  id: string;
  timestamp: Date;
  activityType: 'Call' | 'Email' | 'Note' | 'System Event';
  actor: User;
  summary: string;
  fullContent?: string;
  isSystemGenerated?: boolean;
  linkedContact?: {
    name: string;
    initials: string;
  };
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ leadId, users }) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogActivityModal, setShowLogActivityModal] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityEntry['activityType']>('Call');
  const [activityFilter, setActivityFilter] = useState<ActivityEntry['activityType'] | 'All'>('All');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [activityForm, setActivityForm] = useState({
    summary: '',
    content: '',
    nextSteps: '',
    outcome: 'No Answer'
  });

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const [callLogs, notes] = await Promise.all([
        api.fetchLeadCallLogs(leadId),
        api.fetchLeadNotes(leadId)
      ]);

      const callActivities: ActivityEntry[] = (callLogs || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.callDate),
        activityType: 'Call' as const,
        actor: users.find(u => u.id === log.createdBy) || users[0],
        summary: log.outcome,
        fullContent: log.notes,
        isSystemGenerated: false
      }));

      const noteActivities: ActivityEntry[] = (notes || []).map(note => ({
        id: note.id,
        timestamp: new Date(note.createdAt),
        activityType: 'Note' as const,
        actor: users.find(u => u.id === note.createdBy) || users[0],
        summary: note.noteType,
        fullContent: note.noteText,
        isSystemGenerated: false
      }));

      const systemActivities: ActivityEntry[] = [
        {
          id: 'system-1',
          timestamp: new Date(),
          activityType: 'System Event',
          actor: users[0],
          summary: 'Lead created',
          isSystemGenerated: true
        }
      ];

      const allActivities = [...callActivities, ...noteActivities, ...systemActivities]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      if (selectedActivityType === 'Call') {
        await api.createLeadCallLog(leadId, {
          leadId,
          outcome: activityForm.outcome,
          notes: activityForm.content,
          nextSteps: activityForm.nextSteps
        });
      } else if (selectedActivityType === 'Note') {
        await api.createLeadNote(leadId, {
          leadId,
          noteText: activityForm.content,
          noteType: 'General'
        });
      }

      await loadActivities();
      setShowLogActivityModal(false);
      setActivityForm({ summary: '', content: '', nextSteps: '', outcome: 'No Answer' });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const getActivityIcon = (activityType: ActivityEntry['activityType']) => {
    switch (activityType) {
      case 'Call':
        return <PhoneIcon className="h-5 w-5 text-blue-600" />;
      case 'Email':
        return <EnvelopeIcon className="h-5 w-5 text-green-600" />;
      case 'Note':
        return <DocumentTextIcon className="h-5 w-5 text-purple-600" />;
      case 'System Event':
        return <CogIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType: ActivityEntry['activityType']) => {
    switch (activityType) {
      case 'Call':
        return 'bg-blue-50 border-blue-200';
      case 'Email':
        return 'bg-green-50 border-green-200';
      case 'Note':
        return 'bg-purple-50 border-purple-200';
      case 'System Event':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesType = activityFilter === 'All' || activity.activityType === activityFilter;
    const matchesDate = activity.timestamp >= new Date(dateRange.start) && 
                       activity.timestamp <= new Date(dateRange.end + 'T23:59:59');
    return matchesType && matchesDate;
  });

  const jumpToDate = (date: Date) => {
    const element = document.getElementById(`activity-${date.toISOString().split('T')[0]}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
          <p className="text-sm text-gray-600">
            Chronological feed of all interactions and engagement history
          </p>
        </div>
        <Button onClick={() => setShowLogActivityModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Log New Activity
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as ActivityEntry['activityType'] | 'All')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue"
          >
            <option value="All">All Activities</option>
            <option value="Call">Calls</option>
            <option value="Email">Emails</option>
            <option value="Note">Notes</option>
            <option value="System Event">System Events</option>
          </select>

          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No activities found for the selected filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                id={`activity-${activity.timestamp.toISOString().split('T')[0]}`}
                className={`p-4 hover:bg-gray-50 transition-colors ${getActivityColor(activity.activityType)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activityType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {activity.actor.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {activity.timestamp.toLocaleString()}
                        </span>
                        {activity.isSystemGenerated && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Auto-generated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {activity.summary}
                      </span>
                    </div>

                    {activity.fullContent && (
                      <div className="mt-2">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-sc-blue hover:text-sc-blue-dark">
                            View details
                          </summary>
                          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {activity.fullContent}
                            </p>
                          </div>
                        </details>
                      </div>
                    )}

                    <div className="mt-2">
                      <button
                        onClick={() => jumpToDate(activity.timestamp)}
                        className="text-xs text-sc-blue hover:text-sc-blue-dark underline"
                      >
                        Jump to {activity.timestamp.toLocaleDateString()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showLogActivityModal}
        onClose={() => setShowLogActivityModal(false)}
        title="Log New Activity"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Call', 'Note'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedActivityType(type)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    selectedActivityType === type
                      ? 'border-sc-blue bg-sc-blue text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <Input
              id="summary"
              value={activityForm.summary}
              onChange={(e) => setActivityForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief summary of the activity"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              {selectedActivityType === 'Call' ? 'Call Notes' : 'Note Content'}
            </label>
            <textarea
              id="content"
              value={activityForm.content}
              onChange={(e) => setActivityForm(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue"
              placeholder={selectedActivityType === 'Call' ? 'Details about the call...' : 'Note content...'}
              required
            />
          </div>

          {selectedActivityType === 'Call' && (
            <>
              <div>
                <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
                  Call Outcome
                </label>
                <select
                  id="outcome"
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, outcome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue"
                >
                  <option value="No Answer">No Answer</option>
                  <option value="Left Message">Left Message</option>
                  <option value="Spoke with Contact">Spoke with Contact</option>
                  <option value="Call Back Later">Call Back Later</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Interested">Interested</option>
                </select>
              </div>
              <div>
                <label htmlFor="nextSteps" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Steps
                </label>
                <Input
                  id="nextSteps"
                  value={activityForm.nextSteps}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, nextSteps: e.target.value }))}
                  placeholder="What should happen next?"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowLogActivityModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Log Activity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ActivityLogTab;
