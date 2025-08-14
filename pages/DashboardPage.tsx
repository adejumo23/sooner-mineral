
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  KeyIcon, 
  BuildingIcon, 
  MapIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  UserIcon, 
  EnvelopeIcon, 
  CheckListIcon, 
  DocumentIcon, 
  ChartBarIcon, 
  GlobeAltIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartPieIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  BeakerIcon,
  LightBulbIcon
} from '../components/icons/Icons';

interface ModuleButton {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'management' | 'communication' | 'analytics' | 'administration' | 'future';
  color: string;
  gradient: string;
  status: 'active' | 'beta' | 'planned' | 'coming-soon';
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modules: ModuleButton[] = [
    // Core Land Management Modules
    {
      name: 'Tracts',
      description: 'Manage land tracts, ownership, and mineral rights',
      href: '/tracts',
      icon: MapIcon,
      category: 'core',
      color: 'from-green-500 to-emerald-600',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      status: 'active'
    },
    {
      name: 'Units',
      description: 'Manage drilling units and production areas',
      href: '/units',
      icon: CubeIcon,
      category: 'core',
      color: 'from-blue-500 to-indigo-600',
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      status: 'active'
    },
    {
      name: 'Assignments',
      description: 'Track buyer assignments and acquisition workflows',
      href: '/assignments',
      icon: ClipboardDocumentListIcon,
      category: 'core',
      color: 'from-purple-500 to-violet-600',
      gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
      status: 'active'
    },
    {
      name: 'Leads',
      description: 'Manage potential acquisition opportunities',
      href: '/leads',
      icon: UserIcon,
      category: 'core',
      color: 'from-orange-500 to-red-500',
      gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
      status: 'active'
    },
    {
      name: 'Contacts',
      description: 'Manage landowner and stakeholder relationships',
      href: '/contacts',
      icon: UserGroupIcon,
      category: 'core',
      color: 'from-teal-500 to-cyan-600',
      gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      status: 'active'
    },

    // Communication & Outreach Modules
    {
      name: 'Message Center',
      description: 'Centralized communication hub for all outreach',
      href: '/communication',
      icon: EnvelopeIcon,
      category: 'communication',
      color: 'from-pink-500 to-rose-600',
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',
      status: 'active'
    },
    {
      name: 'Calendar & Tasks',
      description: 'Schedule management and task tracking',
      href: '/calendar-tasks',
      icon: CalendarIcon,
      category: 'communication',
      color: 'from-yellow-500 to-amber-600',
      gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      status: 'active'
    },
    {
      name: 'Document Generation',
      description: 'Create and manage legal documents and contracts',
      href: '/document-generation',
      icon: DocumentTextIcon,
      category: 'communication',
      color: 'from-indigo-500 to-purple-600',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      status: 'active'
    },

    // Analytics & Reporting Modules
    {
      name: 'Mapping',
      description: 'Geographic visualization and spatial analysis',
      href: '/mapping',
      icon: MapIcon,
      category: 'analytics',
      color: 'from-emerald-500 to-green-600',
      gradient: 'bg-gradient-to-br from-emerald-500 to-green-600',
      status: 'active'
    },
    {
      name: 'Reporting',
      description: 'Comprehensive analytics and KPI dashboards',
      href: '/reporting',
      icon: ChartPieIcon,
      category: 'analytics',
      color: 'from-cyan-500 to-blue-600',
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      status: 'active'
    },
    {
      name: 'ESG Tracking',
      description: 'Environmental, social, and governance monitoring',
      href: '/esg',
      icon: GlobeAltIcon,
      category: 'analytics',
      color: 'from-lime-500 to-green-500',
      gradient: 'bg-gradient-to-br from-lime-500 to-green-500',
      status: 'active'
    },

    // Administration Modules
    {
      name: 'Users',
      description: 'Manage system users and access controls',
      href: '/users',
      icon: UserPlusIcon,
      category: 'administration',
      color: 'from-gray-500 to-slate-600',
      gradient: 'bg-gradient-to-br from-gray-500 to-slate-600',
      status: 'active'
    },
    {
      name: 'Roles',
      description: 'Define and manage user roles and permissions',
      href: '/roles',
      icon: ShieldCheckIcon,
      category: 'administration',
      color: 'from-slate-500 to-gray-600',
      gradient: 'bg-gradient-to-br from-slate-500 to-gray-600',
      status: 'active'
    },
    {
      name: 'Privileges',
      description: 'Configure system-wide access privileges',
      href: '/privileges',
      icon: KeyIcon,
      category: 'administration',
      color: 'from-amber-500 to-orange-600',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      status: 'active'
    },

    // Future/Planned Modules
    {
      name: 'Deal Management',
      description: 'End-to-end deal workflow and pipeline tracking',
      href: '/deals',
      icon: CurrencyDollarIcon,
      category: 'future',
      color: 'from-green-400 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-400 to-emerald-500',
      status: 'planned'
    },
    {
      name: 'LP Portal',
      description: 'Limited partner access and reporting portal',
      href: '/lp-portal',
      icon: KeyIcon,
      category: 'future',
      color: 'from-purple-400 to-violet-500',
      gradient: 'bg-gradient-to-br from-purple-400 to-violet-500',
      status: 'active'
    },
    {
      name: 'Production Monitoring',
      description: 'Real-time well production and performance tracking',
      href: '/production',
      icon: BeakerIcon,
      category: 'future',
      color: 'from-blue-400 to-indigo-500',
      gradient: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      status: 'planned'
    },
    {
      name: 'Regulatory Compliance',
      description: 'Track permits, regulations, and compliance status',
      href: '/compliance',
      icon: ShieldExclamationIcon,
      category: 'future',
      color: 'from-red-400 to-pink-500',
      gradient: 'bg-gradient-to-br from-red-400 to-pink-500',
      status: 'planned'
    },
    {
      name: 'Financial Management',
      description: 'Revenue tracking, budgeting, and financial reporting',
      href: '/financials',
      icon: ChartBarIcon,
      category: 'future',
      color: 'from-emerald-400 to-teal-500',
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      status: 'planned'
    },
    {
      name: 'Mobile App',
      description: 'Field operations and mobile data collection',
      href: '/mobile',
      icon: PhoneIcon,
      category: 'future',
      color: 'from-cyan-400 to-blue-500',
      gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500',
      status: 'coming-soon'
    },
    {
      name: 'AI Insights',
      description: 'Machine learning powered analytics and predictions',
      href: '/ai-insights',
      icon: LightBulbIcon,
      category: 'future',
      color: 'from-violet-400 to-purple-500',
      gradient: 'bg-gradient-to-br from-violet-400 to-purple-500',
      status: 'coming-soon'
    },
    {
      name: 'Integration Hub',
      description: 'Third-party system integrations and APIs',
      href: '/integrations',
      icon: Cog6ToothIcon,
      category: 'future',
      color: 'from-orange-400 to-red-500',
      gradient: 'bg-gradient-to-br from-orange-400 to-red-500',
      status: 'coming-soon'
    }
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'beta': 'bg-blue-100 text-blue-800 border-blue-200',
      'planned': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'coming-soon': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return badges[status as keyof typeof badges] || badges['coming-soon'];
  };

  const getStatusText = (status: string) => {
    const texts = {
      'active': 'Active',
      'beta': 'Beta',
      'planned': 'Planned',
      'coming-soon': 'Coming Soon'
    };
    return texts[status as keyof typeof texts] || 'Coming Soon';
  };

  const handleModuleClick = (href: string, status: string) => {
    if (status === 'active' || status === 'beta') {
      navigate(href);
    } else {
      // For future modules, show a toast or modal
      alert(`This module is ${status.replace('-', ' ')}. Stay tuned for updates!`);
    }
  };

  const categories = [
    { key: 'core', name: 'Core Land Management', color: 'from-green-500 to-emerald-600' },
    { key: 'communication', name: 'Communication & Outreach', color: 'from-blue-500 to-indigo-600' },
    { key: 'analytics', name: 'Analytics & Reporting', color: 'from-purple-500 to-violet-600' },
    { key: 'administration', name: 'System Administration', color: 'from-gray-500 to-slate-600' },
    { key: 'future', name: 'Future & Planned Modules', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Sooner Capital</h1>
        <p className="text-xl text-gray-600 mb-2">
          Land Management & Mineral Rights CRM
        </p>
        <p className="text-lg text-gray-500">
          Welcome back, <span className="font-semibold text-orange-600">{user?.name}</span> • 
          <span className="ml-2 text-gray-600">{user?.role.name}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">15</div>
          <div className="text-sm text-gray-600">Active Modules</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">3</div>
          <div className="text-sm text-gray-600">Planned Modules</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">5</div>
          <div className="text-sm text-gray-600">Coming Soon</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">23</div>
          <div className="text-sm text-gray-600">Total Modules</div>
        </Card>
      </div>

      {/* Module Grid by Category */}
      {categories.map((category) => (
        <div key={category.key} className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${category.color}`}></div>
            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules
              .filter(module => module.category === category.key)
              .map((module) => (
                <div
                  key={module.name}
                  onClick={() => handleModuleClick(module.href, module.status)}
                  className={`group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    module.status === 'active' || module.status === 'beta' 
                      ? 'hover:shadow-lg' 
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <Card className="h-full p-6 relative overflow-hidden">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 ${module.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(module.status)}`}>
                        {getStatusText(module.status)}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 ${module.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <module.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors duration-300">
                        {module.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {module.description}
                      </p>
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${module.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                  </Card>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Footer Info */}
      <div className="text-center py-8 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          Sooner Capital CRM • Built for modern land management • Version 2.0
        </p>
        <p className="text-gray-400 text-xs mt-2">
          {new Date().toLocaleDateString()} • {modules.filter(m => m.status === 'active').length} active modules
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
