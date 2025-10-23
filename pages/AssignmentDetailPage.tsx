import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAssignment, fetchAssignmentHistory, updateAssignment, deleteAssignment } from '../services/api';
import { Assignment, AssignmentHistory } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { ArrowLeftIcon, PencilIcon, TrashIcon, ClockIcon, UserIcon } from '../components/icons/Icons';

const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Assignment>>({});

  useEffect(() => {
    if (id) {
      loadAssignment();
    }
  }, [id]);

  const loadAssignment = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [assignmentData, historyData] = await Promise.all([
        fetchAssignment(id),
        fetchAssignmentHistory(id)
      ]);
      
      setAssignment(assignmentData);
      setHistory(historyData || []);
      
      if (assignmentData) {
        setEditData({
          priceCapUsd: assignmentData.priceCapUsd,
          priceCapType: assignmentData.priceCapType,
          sourceChannel: assignmentData.sourceChannel,
          priorityScore: assignmentData.priorityScore,
          status: assignmentData.status,
          notes: assignmentData.notes
        });
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !assignment) return;
    
    try {
      const updatedAssignment = await updateAssignment(id, editData);
      setAssignment(updatedAssignment);
      setShowEditModal(false);
      await loadAssignment(); // Reload to get updated history
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteAssignment(id);
      navigate('/assignments');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Expired': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getActionTypeColor = (actionType: AssignmentHistory['actionType']) => {
    switch (actionType) {
      case 'Created': return 'text-green-600 bg-green-100';
      case 'Updated': return 'text-blue-600 bg-blue-100';
      case 'Reassigned': return 'text-purple-600 bg-purple-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-gray-500 mb-4">Assignment not found</div>
          <Link to="/assignments">
            <Button>Back to Assignments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/assignments">
            <Button variant="secondary" className="flex items-center space-x-2">
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Assignment: {assignment.assetType} {assignment.assetId}
            </h1>
            <p className="text-gray-600 mt-1">
              {assignment.asset?.tractName || assignment.asset?.unitName || 'Unknown Asset'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowEditModal(true)}
            className="flex items-center space-x-2"
          >
            <PencilIcon className="h-5 w-5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2"
          >
            <TrashIcon className="h-5 w-5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Assignment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Overview */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Assignment Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Asset Type</label>
                  <p className="text-gray-900">{assignment.assetType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Asset ID</label>
                  <p className="text-gray-900">{assignment.assetId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Buyer</label>
                  <p className="text-gray-900">{assignment.assignedBuyer?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Assigned By</label>
                  <p className="text-gray-900">{assignment.assignedBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Date</label>
                  <p className="text-gray-900">
                    {new Date(assignment.assignedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-gray-900">
                    {new Date(assignment.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Asset Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Asset Details</h2>
              {assignment.asset ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignment.assetType === 'Tract' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Tract Name</label>
                        <p className="text-gray-900">{assignment.asset.tractName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                        <p className="text-gray-900">{assignment.asset.county}, {assignment.asset.state}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Gross Acres</label>
                        <p className="text-gray-900">{assignment.asset.grossAcres?.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Net Mineral Acres</label>
                        <p className="text-gray-900">{assignment.asset.netMineralAcres?.toLocaleString()}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Unit Name</label>
                        <div className="text-gray-900">
                          {assignment.asset.unitName.split(/\s+(?=[A-Z]+\s+\d+)/).map((unitName, index) => (
                            <div key={index} className="break-words">{unitName.trim()}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                        <p className="text-gray-900">{assignment.asset.county}, {assignment.asset.state}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Operator</label>
                        <p className="text-gray-900">{assignment.asset.operator}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <p className="text-gray-900">{assignment.asset.status}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Asset details not available</p>
              )}
            </div>
          </Card>

          {/* Assignment History */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Assignment History</h2>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((record) => (
                    <div key={record.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(record.actionType)}`}>
                            {record.actionType}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(record.actionTimestamp).toLocaleString()}
                          </span>
                        </div>
                        {record.actionDetails && (
                          <p className="text-sm text-gray-700">{record.actionDetails}</p>
                        )}
                        <div className="flex items-center space-x-1 mt-1">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {record.actionBy?.name || 'Unknown User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No history available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Status */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Assignment Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Priority Score</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priorityScore)}`}>
                    {assignment.priorityScore}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Source Channel</label>
                  <p className="text-gray-900">{assignment.sourceChannel}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Details */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Price Cap</label>
                  <p className="text-2xl font-bold text-gray-900">
                    ${assignment.priceCapUsd.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{assignment.priceCapType}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {assignment.notes && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.notes}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Assignment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Cap (USD) *
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={editData.priceCapUsd || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, priceCapUsd: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Cap Type *
              </label>
              <select
                value={editData.priceCapType || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, priceCapType: e.target.value as 'Per NRA' | 'Per Acre' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                required
              >
                <option value="Per NRA">Per NRA</option>
                <option value="Per Acre">Per Acre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Channel *
              </label>
              <select
                value={editData.sourceChannel || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, sourceChannel: e.target.value as 'Broker' | 'Inbound' | 'Outbound' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                required
              >
                <option value="Broker">Broker</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority Score *
              </label>
              <Input
                type="number"
                placeholder="50"
                value={editData.priorityScore || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, priorityScore: parseInt(e.target.value) || 50 }))}
                min="0"
                max="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={editData.status || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as Assignment['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
                required
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sc-blue"
              placeholder="Update notes about this assignment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Assignment"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this assignment? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentDetailPage;
