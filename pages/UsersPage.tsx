
import React, { useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../types';
import * as api from '../services/api';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsersAndRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([api.fetchUsers(), api.fetchRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndRoles();
  }, [fetchUsersAndRoles]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
        await api.deleteUser(userId);
        fetchUsersAndRoles();
    }
  };
  
  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const roleId = formData.get('roleId') as string;
    
    if (editingUser) {
      // update
      await api.updateUser(editingUser.id, { name, roleId });
    } else {
      // create
      const password = formData.get('password') as string;
      await api.createUser({ name, email, password, roleId });
    }
    fetchUsersAndRoles();
    handleCloseModal();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Users</h1>
        <Button onClick={() => handleOpenModal()}>Add User</Button>
      </div>

      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <Table headers={['Name', 'Email', 'Role', 'Actions']}>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sc-blue/20 text-sc-light-blue">
                  {user.role.name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button variant="secondary" onClick={() => handleOpenModal(user)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(user.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSaveUser} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-sc-slate mb-1">Full Name</label>
                <Input id="name" name="name" type="text" defaultValue={editingUser?.name} required />
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-sc-slate mb-1">Email</label>
                <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required disabled={!!editingUser} />
            </div>
            {!editingUser && (
                 <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-sc-slate mb-1">Password</label>
                    <Input id="password" name="password" type="password" required />
                </div>
            )}
            <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-sc-slate mb-1">Role</label>
                <select 
                    id="roleId" 
                    name="roleId"
                    defaultValue={editingUser?.role.id}
                    className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue"
                    required>
                    {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </select>
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

export default UsersPage;
