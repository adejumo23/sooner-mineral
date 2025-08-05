
import React, { useState, useEffect, useCallback } from 'react';
import type { Privilege, Role } from '../types';
import * as api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const PrivilegesPage: React.FC = () => {
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);
  
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


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Privileges</h1>
      </div>
      
      {isLoading ? (
        <p>Loading privileges...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {privileges.map((privilege) => (
            <Card key={privilege.id}>
              <h2 className="text-xl font-bold text-sc-light-blue">{privilege.name}</h2>
              <p className="text-sc-slate mt-2 h-10">{privilege.description}</p>
              
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-sc-light-slate">Assigned Roles:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {privilege.roles.length > 0 ? privilege.roles.map(role => (
                    <span key={role.id} className="px-2 py-1 text-xs font-medium rounded-full bg-sc-blue/20 text-sc-light-blue">
                      {role.name}
                    </span>
                  )) : (
                    <span className="text-xs text-sc-slate">No roles assigned.</span>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-sc-light-navy pt-4 flex justify-end">
                <Button variant="secondary" onClick={() => handleOpenModal(privilege)}>Edit Assignments</Button>
              </div>
            </Card>
          ))}
        </div>
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
