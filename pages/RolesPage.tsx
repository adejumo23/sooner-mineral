
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Roles</h1>
        <Button onClick={() => handleOpenModal()}>Add Role</Button>
      </div>
      
      {isLoading ? (
        <p>Loading roles...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="flex flex-col">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-sc-light-blue">{role.name}</h2>
                <p className="text-sc-slate mt-2">{role.description}</p>
              </div>
              <div className="mt-6 border-t border-sc-light-navy pt-4 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => handleOpenModal(role)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(role.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
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
