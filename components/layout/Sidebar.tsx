
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, BuildingIcon, MapIcon, CubeIcon, ClipboardDocumentListIcon, UserIcon } from '../icons/Icons';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tracts', href: '/tracts', icon: MapIcon },
  { name: 'Units', href: '/units', icon: CubeIcon },
      { name: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon },
    { name: 'Leads', href: '/leads', icon: UserIcon },
    { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Roles', href: '/roles', icon: ShieldCheckIcon },
  { name: 'Privileges', href: '/privileges', icon: KeyIcon },
];

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gradient-to-b from-orange-500 to-orange-600 h-full flex flex-col fixed top-0 left-0 border-r border-orange-700 shadow-lg">
      <div className="flex items-center justify-center h-20 border-b border-orange-700 bg-orange-600">
        <BuildingIcon className="h-8 w-8 text-white" />
        <h1 className="text-2xl font-bold ml-2 text-white">Sooner Capital</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
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
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;