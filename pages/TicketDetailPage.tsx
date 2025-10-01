import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { 
  mockFetchTickets,
  mockFetchTicketStatuses,
  mockFetchTicketPriorities,
  Ticket,
  TicketStatus,
  TicketPriority
} from '../services/ticketApi';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [priorities, setPriorities] = useState<TicketPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    status_id: '',
    priority_id: '',
    assignee_id: '',
    resolution_notes: ''
  });

  useEffect(() => {
    if (id) {
      loadTicket();
      loadFormData();
    }
  }, [id]);

  const loadTicket = async () => {
    try {
      const response = await mockFetchTickets();
      const foundTicket = response.tickets.find(t => t.id === id);
      if (foundTicket) {
        setTicket(foundTicket);
        setEditData({
          status_id: foundTicket.status_id,
          priority_id: foundTicket.priority_id,
          assignee_id: foundTicket.assignee_id || '',
          resolution_notes: foundTicket.resolution_notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [statusesData, prioritiesData] = await Promise.all([
        mockFetchTicketStatuses(),
        mockFetchTicketPriorities()
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleSave = async () => {
    if (!ticket) return;

    try {
      // In a real implementation, this would call the API
      console.log('Updating ticket:', editData);
      
      // Update local state
      setTicket(prev => prev ? {
        ...prev,
        ...editData,
        updated_at: new Date().toISOString()
      } : null);
      
      setEditing(false);
      alert('Ticket updated successfully!');
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket. Please try again.');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (statusId: string): string => {
    const status = statuses.find(s => s.id === statusId);
    return status?.color_code || '#6B7280';
  };

  const getPriorityColor = (priorityId: string): string => {
    const priority = priorities.find(p => p.id === priorityId);
    return priority?.color_code || '#6B7280';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h1>
          <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist.</p>
          <Link to="/tickets">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Back to Tickets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link to="/tickets" className="hover:text-orange-600">Tickets</Link>
                <span>/</span>
                <span className="text-gray-900">{ticket.ticket_number}</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="text-gray-600 mt-2">Created by {ticket.reporter?.name} on {formatDate(ticket.created_at)}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : 'Edit'}
              </Button>
              {editing && (
                <Button
                  onClick={handleSave}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Technical Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Module</label>
                  <p className="text-sm text-gray-900">{ticket.module_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Page URL</label>
                  <p className="text-sm text-gray-900 break-all">{ticket.page_url || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Browser</label>
                  <p className="text-sm text-gray-900">{ticket.browser_info || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">User Agent</label>
                  <p className="text-sm text-gray-900 break-all">{ticket.user_agent || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Resolution Notes */}
            {ticket.resolution_notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution Notes</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.resolution_notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  {editing ? (
                    <select
                      value={editData.status_id}
                      onChange={(e) => setEditData(prev => ({ ...prev, status_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getStatusColor(ticket.status_id) }}
                    >
                      {ticket.status?.name || 'Unknown'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                  {editing ? (
                    <select
                      value={editData.priority_id}
                      onChange={(e) => setEditData(prev => ({ ...prev, priority_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getPriorityColor(ticket.priority_id) }}
                    >
                      {ticket.priority?.name || 'Unknown'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                  <p className="text-sm text-gray-900">{ticket.category?.name || 'Unknown'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Reporter</label>
                  <p className="text-sm text-gray-900">{ticket.reporter?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{ticket.reporter?.email || ''}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Assignee</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editData.assignee_id}
                      onChange={(e) => setEditData(prev => ({ ...prev, assignee_id: e.target.value }))}
                      placeholder="Assignee ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{ticket.assignee?.name || 'Unassigned'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(ticket.created_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(ticket.updated_at)}</p>
                </div>

                {ticket.resolved_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Resolved</label>
                    <p className="text-sm text-gray-900">{formatDate(ticket.resolved_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Notes Editor */}
            {editing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution Notes</h2>
                <textarea
                  value={editData.resolution_notes}
                  onChange={(e) => setEditData(prev => ({ ...prev, resolution_notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add resolution notes..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
