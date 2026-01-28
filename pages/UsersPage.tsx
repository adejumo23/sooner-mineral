
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Role } from '../types';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const UsersPage: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortField, setSortField] = useState<keyof User | string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  
  // Initialize column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('users-column-visibility');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  // Column width state and resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('users-column-widths');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const fetchUsersAndRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersResponse, rolesData] = await Promise.all([api.fetchUsers(), api.fetchRoles()]);
      const usersData = usersResponse.data || usersResponse;
      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setUsers([]);
      setRoles([]);
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
    
    try {
      if (editingUser) {
        // Get the old role name for comparison
        const oldRoleName = editingUser.role?.name || 'Unknown';
        
        // update
        const updatedUser = await api.updateUser(editingUser.id, { name, roleId });
        
        // Ensure the role object is complete by fetching role description if missing
        let completeUser = updatedUser;
        if (updatedUser && updatedUser.role && !updatedUser.role.description) {
          const fullRole = roles.find(r => r.id === updatedUser.role.id);
          if (fullRole) {
            completeUser = {
              ...updatedUser,
              role: {
                ...updatedUser.role,
                description: fullRole.description || ''
              }
            };
          }
        }
        
        const newRoleName = completeUser?.role?.name || 'Unknown';
        
        // Show success message for any user update
        if (oldRoleName !== newRoleName) {
          console.log(`User role updated: ${editingUser.name} from "${oldRoleName}" to "${newRoleName}"`);
        }
        
        // If the updated user is the currently logged-in user, refresh their session
        if (currentUser && completeUser) {
          const isCurrentUser = completeUser.id === currentUser.id || completeUser.email === currentUser.email;
          if (isCurrentUser) {
            console.log('Current user role updated. Refreshing session...', {
              oldRole: currentUser.role,
              newRole: completeUser.role
            });
            refreshUser(completeUser);
            // Show a message to the user
            setTimeout(() => {
              alert(`Your role has been updated from "${oldRoleName}" to "${newRoleName}". The changes should be reflected immediately.`);
            }, 100);
          } else {
            // Show message that another user's role was updated
            setTimeout(() => {
              alert(`User "${editingUser.name}" role has been updated from "${oldRoleName}" to "${newRoleName}". They will see the new role on their next login.`);
            }, 100);
          }
        } else {
          // Show message when updating another user (currentUser might be null in some cases)
          if (oldRoleName !== newRoleName) {
            setTimeout(() => {
              alert(`User "${editingUser.name}" role has been updated from "${oldRoleName}" to "${newRoleName}". They will see the new role on their next login.`);
            }, 100);
          }
        }
      } else {
        // create
        const password = formData.get('password') as string;
        await api.createUser({ name, email, password, roleId });
      }
      fetchUsersAndRoles();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role.id === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleSort = (field: keyof User | string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort users based on current sort field and direction
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role?.name || '';
          bValue = b.role?.name || '';
          break;
        default:
          aValue = a[sortField as keyof User] ?? '';
          bValue = b[sortField as keyof User] ?? '';
      }

      // Handle comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  const allColumns = [
    {
      header: 'Name',
      accessor: 'name',
      alwaysVisible: false,
      cell: (user: User) => (
        <span className="text-sm font-medium text-gray-900">{user.name}</span>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      cell: (user: User) => (
        <span className="text-sm text-gray-700">{user.email}</span>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (user: User) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sc-blue/20 text-sc-light-blue">
          {user.role.name}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      alwaysVisible: true,
      cell: (user: User) => (
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => handleOpenModal(user)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(user.id)}>Delete</Button>
        </div>
      )
    }
  ];

  // Filter columns based on visibility
  const columns = useMemo(() => {
    return allColumns.filter(col => {
      const accessor = col.accessor as string;
      if (col.alwaysVisible) return true;
      return visibleColumns.size === 0 || visibleColumns.has(accessor);
    });
  }, [visibleColumns]);

  // Initialize visible columns on mount if not set
  useEffect(() => {
    if (visibleColumns.size === 0) {
      const allAccessors = allColumns.map(col => col.accessor as string);
      setVisibleColumns(new Set(allAccessors));
      localStorage.setItem('users-column-visibility', JSON.stringify(Array.from(allAccessors)));
    }
  }, []);

  const toggleColumnVisibility = (accessor: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(accessor)) {
      newVisible.delete(accessor);
    } else {
      newVisible.add(accessor);
    }
    setVisibleColumns(newVisible);
    localStorage.setItem('users-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const showAllColumns = () => {
    const allAccessors = allColumns.map(col => col.accessor as string);
    const newVisible = new Set(allAccessors);
    setVisibleColumns(newVisible);
    localStorage.setItem('users-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  const hideAllColumns = () => {
    const newVisible = new Set(['actions']);
    setVisibleColumns(newVisible);
    localStorage.setItem('users-column-visibility', JSON.stringify(Array.from(newVisible)));
  };

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, accessor: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(accessor);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(100, resizeStartWidth + diff);
      setColumnWidths(prev => {
        const updated = { ...prev, [resizingColumn]: newWidth };
        localStorage.setItem('users-column-widths', JSON.stringify(updated));
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const getColumnWidth = (accessor: string): number => {
    return columnWidths[accessor] || 150;
  };

  return (
    <div className="space-y-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add User</span>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              
              {/* Column Visibility Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2 border border-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>Columns</span>
                  <svg className={`w-4 h-4 transition-transform ${isColumnMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isColumnMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsColumnMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-semibold text-gray-900">Column Visibility</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={showAllColumns}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Show All
                            </button>
                            <button
                              onClick={hideAllColumns}
                              className="text-xs text-gray-600 hover:text-gray-800"
                            >
                              Hide All
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        {allColumns.map((column) => {
                          const accessor = column.accessor as string;
                          const isVisible = column.alwaysVisible || visibleColumns.size === 0 || visibleColumns.has(accessor);
                          const isDisabled = column.alwaysVisible;
                          
                          return (
                            <div key={accessor} className="p-2 rounded hover:bg-gray-50">
                              <label
                                className={`flex items-center space-x-2 cursor-pointer ${
                                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={() => !isDisabled && toggleColumnVisibility(accessor)}
                                  disabled={isDisabled}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{column.header}</span>
                                {isDisabled && (
                                  <span className="text-xs text-gray-400">Required</span>
                                )}
                              </label>
                              {!isDisabled && (
                                <div className="mt-1 flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Width: {getColumnWidth(accessor)}px</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newWidth = getColumnWidth(accessor) + 50;
                                      setColumnWidths(prev => {
                                        const updated = { ...prev, [accessor]: newWidth };
                                        localStorage.setItem('users-column-widths', JSON.stringify(updated));
                                        return updated;
                                      });
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                    title="Increase width by 50px"
                                  >
                                    +50
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newWidth = Math.max(100, getColumnWidth(accessor) - 50);
                                      setColumnWidths(prev => {
                                        const updated = { ...prev, [accessor]: newWidth };
                                        localStorage.setItem('users-column-widths', JSON.stringify(updated));
                                        return updated;
                                      });
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50"
                                    title="Decrease width by 50px"
                                  >
                                    -50
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setColumnWidths(prev => {
                                        const updated = { ...prev };
                                        delete updated[accessor];
                                        localStorage.setItem('users-column-widths', JSON.stringify(updated));
                                        return updated;
                                      });
                                    }}
                                    className="text-xs text-gray-600 hover:text-gray-800 px-2 py-0.5 rounded hover:bg-gray-100"
                                    title="Reset to default width"
                                  >
                                    Reset
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-sm text-gray-500 flex items-center px-3">
                {sortedUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.find(col => col.accessor === 'name') && (
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                        sortField === 'name' ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {sortField === 'name' && (
                          <span className="text-gray-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {sortField !== 'name' && (
                          <span className="opacity-30 text-xs">⇅</span>
                        )}
                      </div>
                    </th>
                  )}
                  {columns.find(col => col.accessor === 'email') && (() => {
                    const accessor = 'email';
                    const width = getColumnWidth(accessor);
                    const isResizing = resizingColumn === accessor;
                    return (
                      <th 
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative ${
                          sortField === 'email' ? 'bg-gray-100' : ''
                        }`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                            return;
                          }
                          handleSort('email');
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Email</span>
                          {sortField === 'email' && (
                            <span className="text-gray-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          {sortField !== 'email' && (
                            <span className="opacity-30 text-xs">⇅</span>
                          )}
                        </div>
                        <div
                          className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                            isResizing ? 'bg-blue-500' : 'bg-transparent'
                          }`}
                          onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                          style={{ userSelect: 'none' }}
                        />
                      </th>
                    );
                  })()}
                  {columns.find(col => col.accessor === 'role') && (() => {
                    const accessor = 'role';
                    const width = getColumnWidth(accessor);
                    const isResizing = resizingColumn === accessor;
                    return (
                      <th 
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative ${
                          sortField === 'role' ? 'bg-gray-100' : ''
                        }`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).classList.contains('column-resizer')) {
                            return;
                          }
                          handleSort('role');
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Role</span>
                          {sortField === 'role' && (
                            <span className="text-gray-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          {sortField !== 'role' && (
                            <span className="opacity-30 text-xs">⇅</span>
                          )}
                        </div>
                        <div
                          className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                            isResizing ? 'bg-blue-500' : 'bg-transparent'
                          }`}
                          onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                          style={{ userSelect: 'none' }}
                        />
                      </th>
                    );
                  })()}
                  {(() => {
                    const accessor = 'status';
                    const width = getColumnWidth(accessor);
                    const isResizing = resizingColumn === accessor;
                    return (
                      <th 
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                      >
                        Status
                        <div
                          className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                            isResizing ? 'bg-blue-500' : 'bg-transparent'
                          }`}
                          onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                          style={{ userSelect: 'none' }}
                        />
                      </th>
                    );
                  })()}
                  {columns.find(col => col.accessor === 'actions') && (() => {
                    const accessor = 'actions';
                    const width = getColumnWidth(accessor);
                    const isResizing = resizingColumn === accessor;
                    return (
                      <th 
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                      >
                        Actions
                        <div
                          className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${
                            isResizing ? 'bg-blue-500' : 'bg-transparent'
                          }`}
                          onMouseDown={(e) => handleResizeStart(e, accessor, width)}
                          style={{ userSelect: 'none' }}
                        />
                      </th>
                    );
                  })()}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {columns.find(col => col.accessor === 'name') && (
                      <td style={{ width: `${getColumnWidth('name')}px`, minWidth: `${getColumnWidth('name')}px` }} className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {columns.find(col => col.accessor === 'email') && (
                      <td style={{ width: `${getColumnWidth('email')}px`, minWidth: `${getColumnWidth('email')}px` }} className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                    )}
                    {columns.find(col => col.accessor === 'role') && (
                      <td style={{ width: `${getColumnWidth('role')}px`, minWidth: `${getColumnWidth('role')}px` }} className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {user.role.name}
                        </span>
                      </td>
                    )}
                    <td style={{ width: `${getColumnWidth('status')}px`, minWidth: `${getColumnWidth('status')}px` }} className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    {columns.find(col => col.accessor === 'actions') && (
                      <td style={{ width: `${getColumnWidth('actions')}px`, minWidth: `${getColumnWidth('actions')}px` }} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="secondary" 
                            onClick={() => handleOpenModal(user)}
                            className="text-sm"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            onClick={() => handleDelete(user.id)}
                            className="text-sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {sortedUsers.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No users found</div>
            <div className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</div>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSaveUser} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input id="name" name="name" type="text" defaultValue={editingUser?.name} required />
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required disabled={!!editingUser} />
            </div>
            {!editingUser && (
                 <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <Input id="password" name="password" type="password" required />
                </div>
            )}
            <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                    id="roleId" 
                    name="roleId"
                    defaultValue={editingUser?.role.id}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue"
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
