
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
    <div className="w-64 bg-sc-orange h-full flex flex-col fixed top-0 left-0 border-r border-sc-dark-orange shadow-lg">
      <div className="flex items-center justify-center h-20 border-b border-sc-dark-orange bg-sc-dark-orange">
        <BuildingIcon className="h-8 w-8 text-sc-warm-cream" />
        <h1 className="text-2xl font-bold ml-2 text-sc-warm-cream">Sooner Capital</h1>
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
                  ? 'bg-sc-dark-orange text-sc-warm-cream shadow-md'
                  : 'text-sc-warm-cream hover:bg-sc-dark-orange/80 hover:text-sc-warm-cream'
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