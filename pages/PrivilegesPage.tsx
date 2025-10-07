
import React, { useState, useEffect, useCallback } from 'react';
import type { Privilege, Role } from '../types';
import * as api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const PrivilegesPage: React.FC = () => {
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [privs, roles] = await Promise.all([api.fetchPrivileges(), api.fetchRoles()]);
      setPrivileges(privs);
      setAllRoles(roles);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleOpenModal = (privilege: Privilege) => {
    setEditingPrivilege(privilege);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setEditingPrivilege(null);
    setIsModalOpen(false);
  };

  const handleSaveAssignments = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPrivilege) return;

    const formData = new FormData(e.currentTarget);
    const selectedRoleIds = Array.from(formData.keys()).filter(key => key.startsWith('role-')).map(key => key.split('-')[1]);
    
    await api.assignRolesToPrivilege(editingPrivilege.id, selectedRoleIds);
    fetchData();
    handleCloseModal();
  };

  const filteredPrivileges = privileges.filter(privilege => {
    const matchesSearch = privilege.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         privilege.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || 
                           (filterCategory === 'assigned' && privilege.roles.length > 0) ||
                           (filterCategory === 'unassigned' && privilege.roles.length === 0);
    return matchesSearch && matchesCategory;
  });


  return (
    <div className="space-y-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privilege Management</h1>
              <p className="text-gray-600 mt-1">Manage system permissions and role assignments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search privileges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Privileges</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading privileges...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrivileges.map((privilege) => (
            <Card key={privilege.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900">{privilege.name}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  privilege.roles.length > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {privilege.roles.length} role{privilege.roles.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{privilege.description}</p>
              
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Assigned Roles:</h3>
                <div className="flex flex-wrap gap-1">
                  {privilege.roles.length > 0 ? privilege.roles.map(role => (
                    <span key={role.id} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {role.name}
                    </span>
                  )) : (
                    <span className="text-xs text-gray-500 italic">No roles assigned</span>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-end">
                <Button 
                  variant="secondary" 
                  onClick={() => handleOpenModal(privilege)}
                  className="text-sm"
                >
                  Edit Assignments
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredPrivileges.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No privileges found</div>
            <div className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</div>
          </div>
        </Card>
      )}

      {editingPrivilege && (
         <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Edit Roles for: ${editingPrivilege.name}`}>
            <form onSubmit={handleSaveAssignments}>
                <p className="text-sc-slate mb-4">Select the roles that should have this privilege.</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {allRoles.map(role => {
                        const isChecked = editingPrivilege.roles.some(assignedRole => assignedRole.id === role.id);
                        return (
                            <label key={role.id} className="flex items-center p-3 bg-sc-light-navy rounded-md hover:bg-slate-600 transition cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name={`role-${role.id}`}
                                    defaultChecked={isChecked}
                                    className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue"
                                />
                                <span className="ml-3 text-sm font-medium text-white">{role.name}</span>
                            </label>
                        )
                    })}
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                    <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                    <Button type="submit">Save Assignments</Button>
                </div>
            </form>
         </Modal>
      )}
    </div>
  );
};

export default PrivilegesPage;
