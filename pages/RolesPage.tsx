
import React, { useState, useEffect, useCallback } from 'react';
import type { Role } from '../types';
import * as api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const rolesData = await api.fetchRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);
  
  const handleOpenModal = (role: Role | null = null) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingRole(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role? This will unassign it from all users and privileges.')) {
        await api.deleteRole(roleId);
        fetchRoles();
    }
  };

  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (editingRole) {
      await api.updateRole(editingRole.id, { name, description });
    } else {
      await api.createRole({ name, description });
    }
    fetchRoles();
    handleCloseModal();
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600 mt-1">Define user roles and their associated permissions</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Role</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              {filteredRoles.length} of {roles.length} roles
            </div>
          </div>
        </div>
      </Card>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading roles...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">{role.name}</h2>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Active
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{role.description}</p>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={() => handleOpenModal(role)}
                  className="text-sm"
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleDelete(role.id)}
                  className="text-sm"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredRoles.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No roles found</div>
            <div className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</div>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRole ? 'Edit Role' : 'Add Role'}>
        <form onSubmit={handleSaveRole} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-sc-slate mb-1">Role Name</label>
                <Input id="name" name="name" type="text" defaultValue={editingRole?.name} required />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-sc-slate mb-1">Description</label>
                <Input id="description" name="description" type="text" defaultValue={editingRole?.description} required />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesPage;
