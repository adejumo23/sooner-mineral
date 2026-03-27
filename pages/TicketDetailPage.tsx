import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchTicket,
  updateTicket,
  addTicketComment,
  uploadTicketAttachment,
  getTicketAttachmentUrl,
  fetchUsers,
} from '../services/api';
import { Ticket, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, TicketIcon, DocumentArrowUpIcon } from '../components/icons/Icons';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [uploadingComment, setUploadingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadTicket = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const t = await fetchTicket(id);
      setTicket(t);
      setStatus(t.status);
      setAssigneeId(t.assigneeId || '');
    } catch (e: any) {
      setTicket(null);
      setError(e?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    fetchUsers(1, 200).then((res) => setUsers(res?.data || [])).catch(() => setUsers([]));
  }, []);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user?.id || !commentText.trim()) return;
    setUploadingComment(true);
    setError(null);
    try {
      await addTicketComment(id, user.id, commentText.trim());
      setCommentText('');
      await loadTicket();
    } catch (e: any) {
      setError(e?.message || 'Failed to add comment');
    } finally {
      setUploadingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user?.id) return;
    setUploadingFile(true);
    setError(null);
    try {
      await uploadTicketAttachment(id, file, user.id);
      await loadTicket();
    } catch (e: any) {
      setError(e?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleUpdateStatusOrAssignee = async () => {
    if (!id) return;
    setUpdating(true);
    setError(null);
    try {
      await updateTicket(id, { status, assigneeId: assigneeId || null });
      await loadTicket();
    } catch (e: any) {
      setError(e?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const statusColor: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-amber-100 text-amber-800',
    Resolved: 'bg-green-100 text-green-800',
    Closed: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-500">Loading ticket…</div>
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-red-600">{error || 'Ticket not found'}</div>
        <Button onClick={() => navigate('/tickets')}>Back to tickets</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" onClick={() => navigate('/tickets')} className="flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <TicketIcon className="w-6 h-6 text-orange-600" />
          <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Module</span>
            <p className="font-medium">{ticket.module}</p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p>
              <span className={`px-2 py-0.5 rounded ${statusColor[ticket.status] || 'bg-gray-100'}`}>
                {ticket.status}
              </span>
            </p>
          </div>
          <div>
            <span className="text-gray-500">Priority</span>
            <p className="font-medium">{ticket.priority}</p>
          </div>
          <div>
            <span className="text-gray-500">Requester</span>
            <p className="font-medium">{ticket.requesterName || ticket.requesterId}</p>
          </div>
          <div>
            <span className="text-gray-500">Assignee</span>
            <p className="font-medium">{ticket.assigneeName || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p>{new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {ticket.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-gray-500 text-sm">Description</span>
            <p className="mt-1 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        )}
      </Card>

      <Card className="p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Update ticket</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleUpdateStatusOrAssignee} disabled={updating}>
            {updating ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Attachments / images</h3>
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer text-sm">
          <DocumentArrowUpIcon className="w-5 h-5" />
          {uploadingFile ? 'Uploading…' : 'Upload image or PDF'}
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploadingFile}
          />
        </label>
        {ticket.attachments && ticket.attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {ticket.attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <a
                  href={getTicketAttachmentUrl(a.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  {a.fileName}
                </a>
                <span className="text-gray-400 text-xs">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
        <form onSubmit={handleAddComment} className="mb-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
          />
          <Button type="submit" disabled={uploadingComment || !commentText.trim()}>
            {uploadingComment ? 'Posting…' : 'Post comment'}
          </Button>
        </form>
        <div className="space-y-3">
          {ticket.comments && ticket.comments.length > 0 ? (
            ticket.comments.map((c) => (
              <div key={c.id} className="pl-3 border-l-2 border-gray-200">
                <div className="text-xs text-gray-500">
                  {c.userName || c.userId} · {new Date(c.createdAt).toLocaleString()}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TicketDetailPage;
