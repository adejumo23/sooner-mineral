
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, BuildingIcon, MapIcon, CubeIcon, ClipboardDocumentListIcon, UserIcon, EnvelopeIcon, CheckListIcon, DocumentIcon, ChartBarIcon, GlobeAltIcon, DocumentArrowUpIcon, TableCellsIcon, CurrencyDollarIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['Admin', 'Manager', 'Buyer', 'Viewer', 'Analyst'] },
  { name: 'Sections', href: '/sections', icon: MapIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Units', href: '/units', icon: CubeIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Buyer', href: '/assignments', icon: ClipboardDocumentListIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Leads', href: '/leads', icon: UserIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Message Center', href: '/communication', icon: EnvelopeIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Mapping', href: '/mapping', icon: MapIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Calendar & Tasks', href: '/calendar-tasks', icon: CheckListIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Document Generation', href: '/document-generation', icon: DocumentIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Data Import', href: '/data-import', icon: DocumentArrowUpIcon, roles: ['Admin', 'Manager'] },
  { name: 'Acreage Schedule', href: '/acreage-schedule', icon: TableCellsIcon, roles: ['Admin', 'Manager', 'Buyer'] },
  { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon, roles: ['Admin', 'Manager'] },
  { name: 'Reporting', href: '/reporting', icon: ChartBarIcon, roles: ['Admin', 'Manager', 'Analyst'] },
  { name: 'ESG Tracking', href: '/esg', icon: GlobeAltIcon, roles: ['Admin', 'Manager'] },
  { name: 'Users', href: '/users', icon: UserGroupIcon, roles: ['Admin'] },
  { name: 'Roles', href: '/roles', icon: ShieldCheckIcon, roles: ['Admin'] },
  { name: 'Privileges', href: '/privileges', icon: KeyIcon, roles: ['Admin'] },
];

interface SidebarProps {
  isCollapsed: boolean;
  isHovered: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  onHoverChange: (hovered: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  isHovered, 
  onCollapseChange, 
  onHoverChange 
}) => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'Viewer';
  
  // Normalize role name (handle "Administrator" vs "Admin", etc.)
  const normalizeRole = (role: string): string => {
    const normalized = role.trim();
    // Map common variations
    if (normalized.toLowerCase() === 'administrator') return 'Admin';
    if (normalized.toLowerCase() === 'read-only') return 'Viewer';
    return normalized;
  };
  
  const normalizedUserRole = normalizeRole(userRole);

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    // If no roles specified, allow all (backward compatibility)
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    // Check if user's role (normalized) is in the allowed roles list
    const normalizedItemRoles = item.roles.map(normalizeRole);
    return normalizedItemRoles.includes(normalizedUserRole);
  });

  // Debug logging
  console.log('Sidebar rendering with user role:', userRole, '(normalized:', normalizedUserRole + ')');
  console.log('Filtered navigation items:', filteredNavigation.length, 'out of', navigation.length);
  console.log('Visible items:', filteredNavigation.map(i => i.name).join(', '));

  const sidebarWidth = isCollapsed && !isHovered ? 'w-16' : 'w-64';
  const showText = !isCollapsed || isHovered;

  return (
    <div 
      className={`${sidebarWidth} sidebar-container bg-gradient-to-b from-orange-500 to-orange-600 h-screen flex flex-col fixed top-0 left-0 border-r border-orange-700 shadow-lg transition-all duration-300 ease-in-out z-50`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className={`flex items-center ${isCollapsed && !isHovered ? 'justify-center' : 'justify-center'} h-20 border-b border-orange-700 bg-orange-600`}>
        <BuildingIcon className="h-8 w-8 text-white" />
        {showText && <h1 className="text-2xl font-bold ml-2 text-white whitespace-nowrap">Sooner Capital</h1>}
      </div>
      <nav className={`flex-1 px-4 py-6 space-y-2 ${isCollapsed && !isHovered ? 'sidebar-collapsed-nav' : 'sidebar-expanded-nav'}`}>
        {filteredNavigation.map((item) => {
          console.log(`Rendering navigation item: ${item.name} (allowed for role: ${userRole})`);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `sidebar-nav-item flex items-center ${isCollapsed && !isHovered ? 'justify-center px-2' : 'px-4'} py-2.5 text-sm font-medium rounded-md transition-colors duration-200 group relative ${
                  isActive
                    ? 'bg-orange-700 text-white shadow-md'
                    : 'text-white hover:bg-orange-600/80 hover:text-white'
                }`
              }
              title={isCollapsed && !isHovered ? item.name : undefined}
            >
              <item.icon className={`nav-icon h-5 w-5 flex-shrink-0 ${isCollapsed && !isHovered ? 'mr-0' : 'mr-3'}`} />
              {showText && <span className="whitespace-nowrap">{item.name}</span>}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isHovered && (
                <div className="sidebar-tooltip">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Toggle button */}
      <div className={`${isCollapsed && !isHovered ? 'p-2' : 'p-4'} border-t border-orange-700`}>
        <button
          onClick={() => onCollapseChange(!isCollapsed)}
          className={`sidebar-toggle w-full flex items-center ${isCollapsed && !isHovered ? 'justify-center' : 'justify-center'} p-2 text-white hover:bg-orange-600/80 rounded-md transition-colors duration-200`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </div>
          {showText && <span className="ml-2 text-sm">Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;