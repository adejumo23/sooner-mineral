
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, BuildingIcon, MapIcon, CubeIcon, ClipboardDocumentListIcon, UserIcon, EnvelopeIcon, CheckListIcon, DocumentIcon, ChartBarIcon, GlobeAltIcon, DocumentArrowUpIcon } from '../icons/Icons';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tracts', href: '/tracts', icon: MapIcon },
  { name: 'Units', href: '/units', icon: CubeIcon },
  { name: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon },
  { name: 'Leads', href: '/leads', icon: UserIcon },
  { name: 'Contacts', href: '/contacts', icon: UserIcon },
  { name: 'Message Center', href: '/communication', icon: EnvelopeIcon },
  { name: 'Mapping', href: '/mapping', icon: MapIcon },
  { name: 'Calendar & Tasks', href: '/calendar-tasks', icon: CheckListIcon },
  { name: 'Document Generation', href: '/document-generation', icon: DocumentIcon },
  { name: 'Data Import', href: '/data-import', icon: DocumentArrowUpIcon },
  { name: 'Reporting', href: '/reporting', icon: ChartBarIcon },
  { name: 'ESG Tracking', href: '/esg', icon: GlobeAltIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Roles', href: '/roles', icon: ShieldCheckIcon },
  { name: 'Privileges', href: '/privileges', icon: KeyIcon },
];

const Sidebar: React.FC = () => {
  // Debug logging
  console.log('Sidebar rendering with navigation items:', navigation.length);
  console.log('Privileges item:', navigation.find(item => item.name === 'Privileges'));

  return (
    <div className="w-64 bg-gradient-to-b from-orange-500 to-orange-600 h-screen flex flex-col fixed top-0 left-0 border-r border-orange-700 shadow-lg">
      <div className="flex items-center justify-center h-20 border-b border-orange-700 bg-orange-600">
        <BuildingIcon className="h-8 w-8 text-white" />
        <h1 className="text-2xl font-bold ml-2 text-white">Sooner Capital</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          console.log(`Rendering navigation item: ${item.name}`);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-orange-700 text-white shadow-md'
                    : 'text-white hover:bg-orange-600/80 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;