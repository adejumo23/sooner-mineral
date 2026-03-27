import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchTickets,
  fetchTicketModules,
  createTicket,
  fetchUsers,
} from '../services/api';
import { Ticket, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { PlusIcon, TicketIcon, MagnifyingGlassIcon } from '../components/icons/Icons';

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newModule, setNewModule] = useState('');
  const [newPriority, setNewPriority] = useState<string>('Medium');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchTickets({
        module: filterModule || undefined,
        status: filterStatus || undefined,
      });
      setTickets(res.data || []);
    } catch (e: any) {
      setTickets([]);
      setError(e?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadModulesAndUsers = async () => {
    try {
      const [modRes, usersRes] = await Promise.all([
        fetchTicketModules(),
        fetchUsers(1, 200),
      ]);
      setModules(modRes.modules || []);
      setUsers(usersRes?.data || []);
    } catch (_) {
      setModules([]);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filterModule, filterStatus]);

  useEffect(() => {
    loadModulesAndUsers();
  }, []);

  const openNewModal = () => {
    setNewTitle('');
    setNewDescription('');
    setNewModule(modules[0] || 'Other');
    setNewPriority('Medium');
    setNewAssigneeId('');
    setShowNewModal(true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be logged in to create a ticket');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTicket({
        title: newTitle,
        description: newDescription,
        module: newModule,
        priority: newPriority,
        requesterId: user.id,
        assigneeId: newAssigneeId || null,
      });
      setShowNewModal(false);
      loadTickets();
    } catch (e: any) {
      setError(e?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-amber-100 text-amber-800',
    Resolved: 'bg-green-100 text-green-800',
    Closed: 'bg-gray-100 text-gray-800',
  };
  const priorityColor: Record<string, string> = {
    Low: 'text-gray-600',
    Medium: 'text-amber-600',
    High: 'text-red-600',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <TicketIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            <p className="text-sm text-gray-500">Report issues by module and track fixes</p>
          </div>
        </div>
        <Button onClick={openNewModal} className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New ticket
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Module</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <Card className="text-center py-12 text-gray-500">
          No tickets found. Create one to report an issue or request a fix.
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} to={`/tickets/${t.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{t.description || '—'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-gray-500">{t.module}</span>
                      <span className={`text-xs font-medium ${priorityColor[t.priority] || ''}`}>{t.priority}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor[t.status] || 'bg-gray-100'}`}>{t.status}</span>
                      {t.assigneeName && <span className="text-xs text-gray-500">→ {t.assigneeName}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {t.requesterName && <div>By {t.requesterName}</div>}
                    <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
            <select
              value={newModule}
              onChange={(e) => setNewModule(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              {modules.length === 0 && <option value="Other">Other</option>}
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Details, steps to reproduce, etc."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
            <select
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">— No assignment —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setShowNewModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TicketsPage;
