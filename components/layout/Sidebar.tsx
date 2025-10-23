
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, BuildingIcon, MapIcon, CubeIcon, ClipboardDocumentListIcon, UserIcon, EnvelopeIcon, CheckListIcon, DocumentIcon, ChartBarIcon, GlobeAltIcon, DocumentArrowUpIcon, TableCellsIcon, CurrencyDollarIcon } from '../icons/Icons';
import './Sidebar.css';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Sections', href: '/sections', icon: MapIcon },
  { name: 'Units', href: '/units', icon: CubeIcon },
  { name: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon },
  { name: 'Leads', href: '/leads', icon: UserIcon },
  { name: 'Contacts', href: '/contacts', icon: UserIcon },
  { name: 'Message Center', href: '/communication', icon: EnvelopeIcon },
  { name: 'Mapping', href: '/mapping', icon: MapIcon },
  { name: 'Calendar & Tasks', href: '/calendar-tasks', icon: CheckListIcon },
  { name: 'Document Generation', href: '/document-generation', icon: DocumentIcon },
  { name: 'Data Import', href: '/data-import', icon: DocumentArrowUpIcon },
  { name: 'Acreage Schedule', href: '/acreage-schedule', icon: TableCellsIcon },
  { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon },
  { name: 'Reporting', href: '/reporting', icon: ChartBarIcon },
  { name: 'ESG Tracking', href: '/esg', icon: GlobeAltIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Roles', href: '/roles', icon: ShieldCheckIcon },
  { name: 'Privileges', href: '/privileges', icon: KeyIcon },
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

  // Debug logging
  console.log('Sidebar rendering with navigation items:', navigation.length);
  console.log('Privileges item:', navigation.find(item => item.name === 'Privileges'));

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
        {navigation.map((item) => {
          console.log(`Rendering navigation item: ${item.name}`);
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