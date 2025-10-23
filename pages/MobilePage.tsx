import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { 
  PhoneIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapIcon,
  CameraIcon,
  DocumentIcon,
  UserIcon
} from '../components/icons/Icons';

interface MobileTask {
  id: string;
  taskType: 'Data Collection' | 'Inspection' | 'Survey' | 'Maintenance' | 'Emergency';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  dueDate: string;
  completedDate?: string;
  photos: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface FieldData {
  id: string;
  dataType: 'Well Data' | 'Production Data' | 'Environmental Data' | 'Safety Data';
  title: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  collectedBy: string;
  collectedAt: string;
  data: Record<string, any>;
  photos: string[];
  notes: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

const MobilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tasks' | 'data' | 'sync'>('tasks');
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [fieldData, setFieldData] = useState<FieldData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Mock data for mobile tasks
    const mockTasks: MobileTask[] = [
      {
        id: '1',
        taskType: 'Data Collection',
        title: 'Well Production Check - Smith #1H',
        description: 'Collect daily production data and check equipment status',
        location: {
          latitude: 31.9686,
          longitude: -99.9018,
          address: 'Midland, TX'
        },
        assignedTo: 'John Smith',
        priority: 'High',
        status: 'In Progress',
        dueDate: '2024-01-20',
        photos: [],
        notes: 'Check for any equipment issues',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-18T10:30:00Z'
      },
      {
        id: '2',
        taskType: 'Inspection',
        title: 'Safety Inspection - Johnson #2H',
        description: 'Monthly safety inspection of drilling equipment',
        location: {
          latitude: 31.9786,
          longitude: -99.9118,
          address: 'Midland, TX'
        },
        assignedTo: 'Jane Doe',
        priority: 'Medium',
        status: 'Pending',
        dueDate: '2024-01-25',
        photos: [],
        notes: 'Focus on safety equipment and procedures',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z'
      },
      {
        id: '3',
        taskType: 'Survey',
        title: 'Environmental Survey - Williams Tract',
        description: 'Environmental impact assessment and wildlife survey',
        location: {
          latitude: 31.9586,
          longitude: -99.8918,
          address: 'Midland, TX'
        },
        assignedTo: 'Mike Johnson',
        priority: 'Low',
        status: 'Completed',
        dueDate: '2024-01-15',
        completedDate: '2024-01-14',
        photos: ['photo1.jpg', 'photo2.jpg'],
        notes: 'Survey completed successfully',
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-14T16:00:00Z'
      }
    ];

    // Mock data for field data
    const mockFieldData: FieldData[] = [
      {
        id: '1',
        dataType: 'Well Data',
        title: 'Smith #1H Production Data',
        location: {
          latitude: 31.9686,
          longitude: -99.9018,
          address: 'Midland, TX'
        },
        collectedBy: 'John Smith',
        collectedAt: '2024-01-18T10:30:00Z',
        data: {
          oilProduction: 450,
          gasProduction: 1200,
          waterProduction: 85,
          pressure: 2500,
          temperature: 180
        },
        photos: ['well_photo1.jpg'],
        notes: 'All systems operating normally',
        synced: true,
        createdAt: '2024-01-18T10:30:00Z',
        updatedAt: '2024-01-18T10:30:00Z'
      },
      {
        id: '2',
        dataType: 'Environmental Data',
        title: 'Air Quality Measurement',
        location: {
          latitude: 31.9786,
          longitude: -99.9118,
          address: 'Midland, TX'
        },
        collectedBy: 'Jane Doe',
        collectedAt: '2024-01-17T14:00:00Z',
        data: {
          co2Level: 400,
          noxLevel: 25,
          pm25: 15,
          windSpeed: 12,
          windDirection: 'NW'
        },
        photos: ['air_quality1.jpg'],
        notes: 'Air quality within acceptable limits',
        synced: false,
        createdAt: '2024-01-17T14:00:00Z',
        updatedAt: '2024-01-17T14:00:00Z'
      }
    ];
    
    setTasks(mockTasks);
    setFieldData(mockFieldData);
    setLoading(false);
  }, []);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'Data Collection':
        return <DocumentIcon className="w-5 h-5 text-blue-500" />;
      case 'Inspection':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Survey':
        return <MapIcon className="w-5 h-5 text-purple-500" />;
      case 'Maintenance':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      case 'Emergency':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'In Progress':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'Pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'Cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading mobile data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile App</h1>
          <p className="text-gray-600">Field operations and mobile data collection</p>
        </div>
        <button
          onClick={() => navigate('/mobile/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Mobile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'Completed').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <ClockIcon className="w-6 h-6 text-yellow-500" />
            <div>
              <div className="text-sm text-gray-500">In Progress</div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'In Progress').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <CameraIcon className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Field Data</div>
              <div className="text-2xl font-bold text-gray-900">{fieldData.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Field Data ({fieldData.length})
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Status
          </button>
        </nav>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'tasks' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Task</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Assigned To</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.description}</div>
                        <div className="text-xs text-gray-400">{task.location.address}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getTaskIcon(task.taskType)}
                        <span className="text-sm font-medium text-gray-900">{task.taskType}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{task.assignedTo}</td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(task.dueDate)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/mobile/tasks/${task.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/mobile/tasks/${task.id}/edit`)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeTab === 'data' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Collected By</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Collected At</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Synced</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fieldData.map((data) => (
                  <tr key={data.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{data.title}</div>
                        <div className="text-sm text-gray-500">{data.notes}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {data.dataType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900">{data.collectedBy}</td>
                    <td className="py-4 px-4 text-gray-900">{data.location.address}</td>
                    <td className="py-4 px-4 text-gray-900">{formatDate(data.collectedAt)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {data.synced ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <ClockIcon className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className="text-sm text-gray-900">
                          {data.synced ? 'Synced' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/mobile/data/${data.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/mobile/data/${data.id}/edit`)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <PhoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sync Status</h3>
            <p className="text-gray-500 mb-4">Monitor data synchronization between mobile devices and the server.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-green-50 p-4 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-800">Synced Data</div>
                <div className="text-2xl font-bold text-green-900">
                  {fieldData.filter(d => d.synced).length}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <ClockIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-yellow-800">Pending Sync</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {fieldData.filter(d => !d.synced).length}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <CameraIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-blue-800">Photos</div>
                <div className="text-2xl font-bold text-blue-900">
                  {fieldData.reduce((sum, d) => sum + d.photos.length, 0)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MobilePage;


