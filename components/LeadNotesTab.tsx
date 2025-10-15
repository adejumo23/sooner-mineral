import * as React from 'react';
import type { LeadEnhanced, User } from '../types';
import Button from './ui/Button';
import { LockClosedIcon, PencilIcon, TrashIcon, PlusIcon, XCircleIcon } from './icons/Icons';

const tagOptions = ['Legal Risk', 'Hot Lead', 'Delay Flagged'];

const mockNotes = [
  {
    id: '1',
    text: 'This lead has a potential title issue. @Bob Legal please review.\n\n**Bold** and line breaks supported.',
    createdAt: '2024-06-01T10:00:00Z',
    author: 'Alice Admin',
    authorId: 'admin1',
    tags: ['Legal Risk'],
    private: false,
    mentions: ['legal1'],
  },
  {
    id: '2',
    text: 'Seller is motivated but wants to delay until Q3. @Sarah Johnson',
    createdAt: '2024-06-02T14:30:00Z',
    author: 'Bob Legal',
    authorId: 'legal1',
    tags: ['Delay Flagged'],
    private: true,
    mentions: ['admin1'],
  },
];

function parseMentions(text: string, users: User[]) {
  return text.replace(/@([\w\s]+)/g, (match, name) => {
    const user = users.find(u => u.name === name.trim());
    return user ? `<span class='text-sc-blue font-semibold'>@${user.name}</span>` : match;
  });
}

const LeadNotesTab: React.FC<{ lead: LeadEnhanced; currentUser: User; users: User[] }> = ({ lead, currentUser, users }) => {
  const [notes, setNotes] = React.useState(mockNotes);
  const [search, setSearch] = React.useState('');
  const [tagFilter, setTagFilter] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [newNote, setNewNote] = React.useState({ text: '', tags: [] as string[], private: false });
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editNote, setEditNote] = React.useState({ text: '', tags: [] as string[], private: false });
  const [deleteNoteId, setDeleteNoteId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<{ [id: string]: boolean }>({});

  // Filtered notes
  const filteredNotes = notes
    .filter(n => (!search || n.text.toLowerCase().includes(search.toLowerCase())) && (!tagFilter || n.tags.includes(tagFilter)))
    .filter(n => !n.private || currentUser.role.name === 'Admin' || currentUser.role.name === 'Legal' || n.authorId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Permission logic
  const canEditOrDelete = (note: typeof mockNotes[0]) => currentUser.role.name === 'Admin' || note.authorId === currentUser.id;

  // Add note handler (mock)
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    setNotes([
      {
        id: Math.random().toString(36).slice(2),
        text: newNote.text,
        createdAt: new Date().toISOString(),
        author: currentUser.name,
        authorId: currentUser.id,
        tags: newNote.tags,
        private: newNote.private,
        mentions: (newNote.text.match(/@([\w\s]+)/g) || []).map(m => m.slice(1)),
      },
      ...notes,
    ]);
    setShowAdd(false);
    setNewNote({ text: '', tags: [], private: false });
  };

  // Edit note handler (mock)
  const handleEditNote = (e: React.FormEvent) => {
    e.preventDefault();
    setNotes(notes.map(n => n.id === editingNoteId ? { ...n, text: editNote.text, tags: editNote.tags, private: editNote.private } : n));
    setEditingNoteId(null);
  };

  // Delete note handler (mock)
  const handleDelete = () => {
    setNotes(notes.filter(n => n.id !== deleteNoteId));
    setDeleteNoteId(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <Button onClick={() => setShowAdd(true)} aria-label="Add Note">
          <PlusIcon className="h-4 w-4 mr-2" /> Add Note
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search notes..."
          className="border border-gray-300 rounded px-3 py-2 text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search notes"
        />
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm"
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All Tags</option>
          {tagOptions.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {filteredNotes.length === 0 && (
          <div className="text-center text-gray-400 py-8">No notes found.</div>
        )}
        {filteredNotes.map(note => (
          <div key={note.id} className="bg-white rounded-lg border border-gray-200 shadow p-4 relative">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                <span className="text-xs text-sc-blue font-semibold cursor-pointer hover:underline">{note.author}</span>
                {note.private && <LockClosedIcon className="h-4 w-4 text-red-500" title="Private Note" />}
                {note.tags.map(tag => (
                  <span key={tag} className="inline-block bg-gray-100 text-gray-800 rounded px-2 py-1 text-xs ml-1">{tag}</span>
                ))}
              </div>
              <div className="flex space-x-2">
                {canEditOrDelete(note) && (
                  <>
                    <Button size="icon" variant="secondary" title="Edit" aria-label="Edit" onClick={() => { setEditingNoteId(note.id); setEditNote({ text: note.text, tags: note.tags, private: note.private }); }}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="danger" title="Delete" aria-label="Delete" onClick={() => setDeleteNoteId(note.id)}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* Collapsible note text */}
            <div className="text-sm text-gray-800 whitespace-pre-line">
              {note.text.split('\n').length > 4 && !expanded[note.id] ? (
                <>
                  {note.text.split('\n').slice(0, 4).join('\n')}
                  <span className="block text-xs text-sc-blue cursor-pointer mt-2" onClick={() => setExpanded(e => ({ ...e, [note.id]: true }))}>Show More</span>
                </>
              ) : note.text.split('\n').length > 4 ? (
                <>
                  {note.text}
                  <span className="block text-xs text-sc-blue cursor-pointer mt-2" onClick={() => setExpanded(e => ({ ...e, [note.id]: false }))}>Show Less</span>
                </>
              ) : (
                note.text
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Add Note Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Text</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={5}
                  value={newNote.text}
                  onChange={e => setNewNote(n => ({ ...n, text: e.target.value }))}
                  placeholder="Type your note. Use @Name to mention a user. Use **bold** for emphasis."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={newNote.tags}
                  onChange={e => setNewNote(n => ({ ...n, tags: Array.from(e.target.selectedOptions, o => o.value) }))}
                >
                  {tagOptions.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-note"
                  checked={newNote.private}
                  onChange={e => setNewNote(n => ({ ...n, private: e.target.checked }))}
                />
                <label htmlFor="private-note" className="text-sm text-gray-700">Private (Admin/Legal only)</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowAdd(false)} type="button">Cancel</Button>
                <Button type="submit">Add Note</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Note Modal */}
      {editingNoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Note</h3>
            <form onSubmit={handleEditNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Text</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={5}
                  value={editNote.text}
                  onChange={e => setEditNote(n => ({ ...n, text: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={editNote.tags}
                  onChange={e => setEditNote(n => ({ ...n, tags: Array.from(e.target.selectedOptions, o => o.value) }))}
                >
                  {tagOptions.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-private-note"
                  checked={editNote.private}
                  onChange={e => setEditNote(n => ({ ...n, private: e.target.checked }))}
                />
                <label htmlFor="edit-private-note" className="text-sm text-gray-700">Private (Admin/Legal only)</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setEditingNoteId(null)} type="button">Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteNoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
            <XCircleIcon className="h-10 w-10 text-red-500 mb-2" />
            <div className="mb-4 text-center">Are you sure you want to delete this note?</div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setDeleteNoteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadNotesTab;
