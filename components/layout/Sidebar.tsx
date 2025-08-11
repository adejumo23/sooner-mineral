
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, BuildingIcon, MapIcon, CubeIcon } from '../icons/Icons';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tracts', href: '/tracts', icon: MapIcon },
  { name: 'Units', href: '/units', icon: CubeIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Roles', href: '/roles', icon: ShieldCheckIcon },
  { name: 'Privileges', href: '/privileges', icon: KeyIcon },
];

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-sc-navy h-full flex flex-col fixed top-0 left-0 border-r border-sc-light-navy">
      <div className="flex items-center justify-center h-20 border-b border-sc-light-navy">
        <BuildingIcon className="h-8 w-8 text-sc-blue" />
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
                  ? 'bg-sc-blue text-white'
                  : 'text-sc-slate hover:bg-sc-light-navy hover:text-white'
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