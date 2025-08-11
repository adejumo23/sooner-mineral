import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  fetchUnit, 
  fetchUnitTracts, 
  fetchUnitContacts, 
  fetchUnitNotes, 
  fetchUnitAssignments,
  fetchUsers,
  assignUnit,
  unassignUnit,
  updateUnitLock,
  createUnitNote,
  deleteUnit
} from '../services/api';
import { Unit, UnitTract, UnitContact, UnitNote, UnitAssignment, User } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  LockClosedIcon, 
  LockOpenIcon,
  UserIcon,
  MapIcon,
  DocumentTextIcon,
  CogIcon
} from '../components/icons/Icons';

const UnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [unitTracts, setUnitTracts] = useState<UnitTract[]>([]);
  const [unitContacts, setUnitContacts] = useState<UnitContact[]>([]);
  const [unitNotes, setUnitNotes] = useState<UnitNote[]>([]);
  const [unitAssignments, setUnitAssignments] = useState<UnitAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [lockNotes, setLockNotes] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<UnitNote['noteType']>('Internal');

  useEffect(() => {
    if (id) {
      loadUnitData();
    }
  }, [id]);

  const loadUnitData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [
        unitData, 
        tractsData, 
        contactsData, 
        notesData, 
        assignmentsData,
        usersData
      ] = await Promise.all([
        fetchUnit(id),
        fetchUnitTracts(id),
        fetchUnitContacts(id),
        fetchUnitNotes(id),
        fetchUnitAssignments(id),
        fetchUsers()
      ]);
      
      setUnit(unitData);
      setUnitTracts(tractsData);
      setUnitContacts(contactsData);
      setUnitNotes(notesData);
      setUnitAssignments(assignmentsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading unit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUnit = async () => {
    if (!id || !selectedBuyer) return;
    
    try {
      await assignUnit(id, { buyerId: selectedBuyer, notes: assignmentNotes });
      await loadUnitData(); // Reload data
      setShowAssignmentModal(false);
      setSelectedBuyer('');
      setAssignmentNotes('');
    } catch (error) {
      console.error('Error assigning unit:', error);
    }
  };

  const handleUnassignUnit = async () => {
    if (!id) return;
    
    try {
      await unassignUnit(id, 'Unit unassigned by user');
      await loadUnitData(); // Reload data
    } catch (error) {
      console.error('Error unassigning unit:', error);
    }
  };

  const handleUpdateLock = async () => {
    if (!id) return;
    
    try {
      await updateUnitLock(id, { 
        isLocked: !unit?.isLocked, 
        notes: lockNotes 
      });
      await loadUnitData(); // Reload data
      setShowLockModal(false);
      setLockNotes('');
    } catch (error) {
      console.error('Error updating unit lock:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!id || !noteText) return;
    
    try {
      await createUnitNote(id, { noteText, noteType });
      await loadUnitData(); // Reload data
      setShowNoteModal(false);
      setNoteText('');
      setNoteType('Internal');
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteUnit = async () => {
    if (!id) return;
    
    try {
      await deleteUnit(id);
      navigate('/units');
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const getStatusColor = (status: Unit['status']) => {
    switch (status) {
      case 'Producing': return 'text-green-600 bg-green-100';
      case 'Permitted': return 'text-blue-600 bg-blue-100';
      case 'Held by Production': return 'text-yellow-600 bg-yellow-100';
      case 'Plugged': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getExitStrategyColor = (strategy: Unit['exitStrategy']) => {
    switch (strategy) {
      case 'Hold': return 'text-blue-600 bg-blue-100';
      case 'Flip': return 'text-yellow-600 bg-yellow-100';
      case 'LP Buyout': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading unit...</div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Unit not found</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'tracts', name: 'Linked Tracts', icon: MapIcon },
    { id: 'contacts', name: 'Contacts', icon: UserIcon },
    { id: 'mapping', name: 'Mapping Preview', icon: MapIcon },
    { id: 'assignment', name: 'Assignment', icon: CogIcon },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/units" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{unit.unitName}</h1>
            <p className="text-gray-600 mt-1">
              {unit.operator} • {unit.county}, {unit.state}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {unit.isLocked ? (
            <Button
              variant="outline"
              onClick={() => setShowLockModal(true)}
              className="flex items-center space-x-2"
            >
              <LockClosedIcon className="h-4 w-4" />
              <span>Unlock</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowLockModal(true)}
              className="flex items-center space-x-2"
            >
              <LockOpenIcon className="h-4 w-4" />
              <span>Lock</span>
            </Button>
          )}
          
          <Link to={`/units/${id}/edit`}>
            <Button variant="outline" className="flex items-center space-x-2">
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-4 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(unit.status)}`}>
          {unit.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExitStrategyColor(unit.exitStrategy)}`}>
          {unit.exitStrategy}
        </span>
        {unit.heldByFund && (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-purple-600 bg-purple-100">
            Held by Fund
          </span>
        )}
        {unit.isLocked && (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-red-600 bg-red-100">
            Locked
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-sc-blue text-sc-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unit Name</dt>
                    <dd className="text-sm text-gray-900">{unit.unitName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Operator</dt>
                    <dd className="text-sm text-gray-900">{unit.operator}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{unit.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">County</dt>
                    <dd className="text-sm text-gray-900">{unit.county}, {unit.state}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Strategy</dt>
                    <dd className="text-sm text-gray-900">{unit.exitStrategy}</dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Acreage & Wells */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acreage & Wells</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Gross Acres</dt>
                    <dd className="text-sm text-gray-900">{unit.estimatedGrossAcres.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Net Acres</dt>
                    <dd className="text-sm text-gray-900">
                      {unit.estimatedNetAcres ? unit.estimatedNetAcres.toLocaleString() : 'TBD'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">API Numbers</dt>
                    <dd className="text-sm text-gray-900">
                      {unit.apiNumbers.map(api => (
                        <div key={api} className="font-mono">{api}</div>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target Formations</dt>
                    <dd className="text-sm text-gray-900">
                      {unit.targetFormations.join(', ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* Assignment & Notes */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment & Notes</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Current Assignment</h4>
                    {unit.assignedBuyer ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Assigned to:</span> {unit.assignedBuyer.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Email:</span> {unit.assignedBuyer.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No buyer currently assigned</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Notes</h4>
                    {unit.notes ? (
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{unit.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No notes available</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tracts' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Tracts</h3>
              {unitTracts.length === 0 ? (
                <p className="text-gray-500">No tracts linked to this unit</p>
              ) : (
                <div className="space-y-4">
                  {unitTracts.map((unitTract) => (
                    <div key={unitTract.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {unitTract.tract?.tractName || 'Unknown Tract'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {unitTract.tract?.county}, {unitTract.tract?.state}
                          </p>
                          <p className="text-sm text-gray-600">
                            Gross: {unitTract.tract?.grossAcres.toLocaleString()} acres
                          </p>
                        </div>
                        <div className="text-right">
                          {unitTract.allocationPercentage && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {unitTract.allocationPercentage * 100}% Allocation
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'contacts' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Contacts</h3>
              {unitContacts.length === 0 ? (
                <p className="text-gray-500">No contacts linked to this unit</p>
              ) : (
                <div className="space-y-4">
                  {unitContacts.map((unitContact) => (
                    <div key={unitContact.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {unitContact.contact?.name || 'Unknown Contact'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {unitContact.contact?.entityType}
                          </p>
                          {unitContact.contact?.email && (
                            <p className="text-sm text-gray-600">
                              {unitContact.contact.email}
                            </p>
                          )}
                          {unitContact.contact?.phone && (
                            <p className="text-sm text-gray-600">
                              {unitContact.contact.phone}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`/contacts/${unitContact.contactId}`}
                          className="text-sc-blue hover:text-sc-blue-dark text-sm font-medium"
                        >
                          View Contact
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'mapping' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapping Preview</h3>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Map integration coming soon. This will show unit boundaries overlaid on tract data.
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'assignment' && (
          <div className="space-y-6">
            {/* Current Assignment */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Current Assignment</h3>
                  {!unit.assignedBuyer && (
                    <Button onClick={() => setShowAssignmentModal(true)}>
                      Assign Buyer
                    </Button>
                  )}
                </div>
                
                {unit.assignedBuyer ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{unit.assignedBuyer.name}</h4>
                        <p className="text-sm text-gray-600">{unit.assignedBuyer.email}</p>
                        <p className="text-sm text-gray-600">Role: {unit.assignedBuyer.role.name}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleUnassignUnit}
                        className="text-red-600 hover:text-red-700"
                      >
                        Unassign
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No buyer currently assigned to this unit</p>
                )}
              </div>
            </Card>

            {/* Assignment History */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment History</h3>
                {unitAssignments.length === 0 ? (
                  <p className="text-gray-500">No assignment history available</p>
                ) : (
                  <div className="space-y-3">
                    {unitAssignments.map((assignment) => (
                      <div key={assignment.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Assigned to:</span> {assignment.buyer?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">By:</span> {assignment.assignedByUser?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Date:</span> {new Date(assignment.assignedAt).toLocaleDateString()}
                            </p>
                            {assignment.notes && (
                              <p className="text-sm text-gray-600 mt-1">{assignment.notes}</p>
                            )}
                          </div>
                          {assignment.removedAt && (
                            <div className="text-right">
                              <p className="text-sm text-red-600">
                                Removed: {new Date(assignment.removedAt).toLocaleDateString()}
                              </p>
                              {assignment.removedByUser && (
                                <p className="text-sm text-gray-600">
                                  by {assignment.removedByUser.name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Unit Notes */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Unit Notes</h3>
                  <Button onClick={() => setShowNoteModal(true)}>
                    Add Note
                  </Button>
                </div>
                
                {unitNotes.length === 0 ? (
                  <p className="text-gray-500">No notes available</p>
                ) : (
                  <div className="space-y-3">
                    {unitNotes.map((note) => (
                      <div key={note.id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-900">{note.noteText}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {note.createdByUser?.name} • {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            note.noteType === 'Assignment' ? 'bg-blue-100 text-blue-800' :
                            note.noteType === 'Status Change' ? 'bg-yellow-100 text-yellow-800' :
                            note.noteType === 'Lock/Unlock' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {note.noteType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title="Assign Unit to Buyer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Buyer
            </label>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="">Choose a buyer...</option>
              {users.filter(u => u.role.name === 'Buyer').map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
              placeholder="Add any notes about this assignment..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignUnit} disabled={!selectedBuyer}>
            Assign Unit
          </Button>
        </div>
      </Modal>

      {/* Lock/Unlock Modal */}
      <Modal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        title={unit.isLocked ? 'Unlock Unit' : 'Lock Unit'}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {unit.isLocked 
              ? 'Unlocking this unit will allow outreach and assignment activities.'
              : 'Locking this unit will prevent outreach and assignment activities while under due diligence.'
            }
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={lockNotes}
              onChange={(e) => setLockNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
              placeholder={`Add notes about ${unit.isLocked ? 'unlocking' : 'locking'} this unit...`}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowLockModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateLock}>
            {unit.isLocked ? 'Unlock Unit' : 'Lock Unit'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Unit"
      >
        <div className="space-y-4">
          <p className="text-red-600 font-medium">
            Are you sure you want to delete this unit?
          </p>
          <p className="text-gray-600">
            This action cannot be undone. All unit data, assignments, and notes will be permanently removed.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUnit} className="bg-red-600 hover:bg-red-700">
            Delete Unit
          </Button>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Unit Note"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Type
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as UnitNote['noteType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
            >
              <option value="Internal">Internal</option>
              <option value="Assignment">Assignment</option>
              <option value="Status Change">Status Change</option>
              <option value="Lock/Unlock">Lock/Unlock</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Text
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-transparent"
              placeholder="Enter your note..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowNoteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateNote} disabled={!noteText}>
            Add Note
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UnitDetailPage;
