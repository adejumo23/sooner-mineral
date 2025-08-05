
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tract, User, TitleStatus } from '../types';
import * as api from '../services/api';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const titleStatuses: TitleStatus[] = ['In Progress', 'Verified', 'Verified with Curative Requirements', 'Failed', 'Unmapped'];

const TractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTract, setEditingTract] = useState<Tract | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tractsData, usersData] = await Promise.all([api.fetchTracts(), api.fetchUsers()]);
      setTracts(tractsData);
      setUsers(usersData.filter(u => u.role.name === 'Buyer' || u.role.name === 'Land Manager'));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (tract: Tract | null = null) => {
    setEditingTract(tract);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTract(null);
    setIsModalOpen(false);
  };

  const handleDelete = async (tractId: string) => {
    if (window.confirm('Are you sure you want to delete this tract?')) {
        await api.deleteTract(tractId);
        fetchData();
    }
  };
  
  const handleSaveTract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const tractData: Omit<Tract, 'id' | 'assignedBuyer' | 'nra'> = {
        tractName: formData.get('tractName') as string,
        state: formData.get('state') as string,
        county: formData.get('county') as string,
        legalDescription: formData.get('legalDescription') as string,
        str: formData.get('str') as string || undefined,
        abstractNumber: formData.get('abstractNumber') as string || undefined,
        anum: formData.get('anum') as string || undefined,
        grossAcres: parseFloat(formData.get('grossAcres') as string),
        netMineralAcres: parseFloat(formData.get('netMineralAcres') as string) || undefined,
        royalty: parseFloat(formData.get('royalty') as string) || undefined,
        ownershipPercentage: parseFloat(formData.get('ownershipPercentage') as string) || undefined,
        titleStatus: formData.get('titleStatus') as TitleStatus,
        assignedBuyerId: formData.get('assignedBuyerId') as string || undefined,
        nraCapUsd: parseFloat(formData.get('nraCapUsd') as string) || undefined,
        sourceChannel: formData.get('sourceChannel') as string || undefined,
        routingNotes: formData.get('routingNotes') as string || undefined,
        heldByFund: formData.has('heldByFund'),
        isLocked: formData.has('isLocked'),
    };
    
    if (editingTract) {
      await api.updateTract(editingTract.id, tractData);
    } else {
      await api.createTract(tractData);
    }
    fetchData();
    handleCloseModal();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Tracts</h1>
        <Button onClick={() => handleOpenModal()}>Add Tract</Button>
      </div>

      {isLoading ? (
        <p className="text-center text-sc-slate">Loading tracts...</p>
      ) : (
        <Table headers={['Tract Name', 'State', 'County', 'Status', 'Assigned To', 'Acres (Net/Gross)', 'Actions']}>
          {tracts.map((tract) => (
            <tr key={tract.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{tract.tractName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">{tract.state}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">{tract.county}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">{tract.titleStatus}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">{tract.assignedBuyer?.name || 'Unassigned'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-sc-slate">{tract.netMineralAcres || 'N/A'} / {tract.grossAcres}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button variant="secondary" onClick={() => navigate(`/tracts/${tract.id}`)}>View Details</Button>
                <Button variant="secondary" onClick={() => handleOpenModal(tract)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(tract.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTract ? 'Edit Tract' : 'Add Tract'}>
        <form onSubmit={handleSaveTract} className="space-y-6 max-h-[75vh] overflow-y-auto pr-3">
            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tractName" className="block text-sm font-medium text-sc-slate mb-1">Tract Name</label>
                    <Input id="tractName" name="tractName" type="text" defaultValue={editingTract?.tractName} required />
                </div>
                 <div>
                    <label htmlFor="state" className="block text-sm font-medium text-sc-slate mb-1">State</label>
                    <Input id="state" name="state" type="text" defaultValue={editingTract?.state} required />
                </div>
                <div>
                    <label htmlFor="county" className="block text-sm font-medium text-sc-slate mb-1">County</label>
                    <Input id="county" name="county" type="text" defaultValue={editingTract?.county} required />
                </div>
                 <div>
                    <label htmlFor="sourceChannel" className="block text-sm font-medium text-sc-slate mb-1">Source Channel</label>
                    <Input id="sourceChannel" name="sourceChannel" type="text" defaultValue={editingTract?.sourceChannel} />
                </div>
            </div>

            {/* Legal Info */}
            <div>
                <label htmlFor="legalDescription" className="block text-sm font-medium text-sc-slate mb-1">Legal Description</label>
                <textarea id="legalDescription" name="legalDescription" defaultValue={editingTract?.legalDescription} required  className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate placeholder-sc-slate focus:outline-none focus:ring-2 focus:ring-sc-blue transition duration-200" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="str" className="block text-sm font-medium text-sc-slate mb-1">STR</label>
                    <Input id="str" name="str" type="text" defaultValue={editingTract?.str} />
                </div>
                <div>
                    <label htmlFor="abstractNumber" className="block text-sm font-medium text-sc-slate mb-1">Abstract Number</label>
                    <Input id="abstractNumber" name="abstractNumber" type="text" defaultValue={editingTract?.abstractNumber} />
                </div>
                <div>
                    <label htmlFor="anum" className="block text-sm font-medium text-sc-slate mb-1">ANUM</label>
                    <Input id="anum" name="anum" type="text" defaultValue={editingTract?.anum} />
                </div>
            </div>
            
            {/* Acreage & Ownership */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label htmlFor="grossAcres" className="block text-sm font-medium text-sc-slate mb-1">Gross Acres</label>
                    <Input id="grossAcres" name="grossAcres" type="number" step="any" defaultValue={editingTract?.grossAcres} required />
                </div>
                <div>
                    <label htmlFor="netMineralAcres" className="block text-sm font-medium text-sc-slate mb-1">Net Mineral Acres</label>
                    <Input id="netMineralAcres" name="netMineralAcres" type="number" step="any" defaultValue={editingTract?.netMineralAcres} />
                </div>
                <div>
                    <label htmlFor="royalty" className="block text-sm font-medium text-sc-slate mb-1">Royalty (%)</label>
                    <Input id="royalty" name="royalty" type="number" step="any" placeholder="e.g. 0.25" defaultValue={editingTract?.royalty}/>
                </div>
                <div>
                    <label htmlFor="ownershipPercentage" className="block text-sm font-medium text-sc-slate mb-1">Ownership (%)</label>
                    <Input id="ownershipPercentage" name="ownershipPercentage" placeholder="e.g. 1.0" type="number" step="any" defaultValue={editingTract?.ownershipPercentage} />
                </div>
            </div>

            {/* Assignment & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="titleStatus" className="block text-sm font-medium text-sc-slate mb-1">Title Status</label>
                    <select id="titleStatus" name="titleStatus" defaultValue={editingTract?.titleStatus || 'In Progress'} className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue" required>
                        {titleStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="assignedBuyerId" className="block text-sm font-medium text-sc-slate mb-1">Assigned Buyer</label>
                    <select id="assignedBuyerId" name="assignedBuyerId" defaultValue={editingTract?.assignedBuyerId} className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate focus:outline-none focus:ring-2 focus:ring-sc-blue">
                        <option value="">Unassigned</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="nraCapUsd" className="block text-sm font-medium text-sc-slate mb-1">$/NRA Cap</label>
                    <Input id="nraCapUsd" name="nraCapUsd" type="number" step="any" defaultValue={editingTract?.nraCapUsd} />
                </div>
            </div>

             <div>
                <label htmlFor="routingNotes" className="block text-sm font-medium text-sc-slate mb-1">Routing Notes</label>
                <textarea id="routingNotes" name="routingNotes" defaultValue={editingTract?.routingNotes} className="w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate placeholder-sc-slate focus:outline-none focus:ring-2 focus:ring-sc-blue transition duration-200" rows={3}></textarea>
            </div>

             {/* Flags */}
             <div className="flex items-center space-x-8">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="heldByFund" defaultChecked={editingTract?.heldByFund} className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue" />
                    <span className="text-sm text-sc-slate">Held by Fund</span>
                </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="isLocked" defaultChecked={editingTract?.isLocked} className="h-4 w-4 rounded border-gray-300 text-sc-blue focus:ring-sc-blue" />
                    <span className="text-sm text-sc-slate">Lock Flag (e.g. under LOI)</span>
                </label>
             </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-sc-light-navy">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save Tract</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default TractsPage;
