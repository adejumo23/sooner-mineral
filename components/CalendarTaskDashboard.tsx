import React, { useState, useEffect } from 'react';
import { CalendarIcon, CheckListIcon, ClockIcon, ExclamationTriangleIcon, PlusIcon, FilterIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon } from './icons/Icons';
import type { Task, TaskFilter, TaskStatistics, CalendarEvent, CalendarViewType, User } from '../types';
import * as api from '../services/api';

interface CalendarTaskDashboardProps {
  currentUser: User;
}

const CalendarTaskDashboard: React.FC<CalendarTaskDashboardProps> = ({ currentUser }) => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [taskStatistics, setTaskStatistics] = useState<TaskStatistics | null>(null);
  const [selectedView, setSelectedView] = useState<'calendar' | 'tasks'>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarViewType>('month');
  const [filters, setFilters] = useState<TaskFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Task creation form state
  const [newTask, setNewTask] = useState({
    subject: '',
    description: '',
    taskType: 'Call' as const,
    priority: 'Medium' as const,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    notes: '',
    relatedContactId: '',
    relatedLeadId: '',
    relatedDealId: '',
    relatedAssignmentId: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters, currentDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, statsData, eventsData] = await Promise.all([
        api.fetchTasks(filters),
        api.fetchTaskStatistics(currentUser.id),
        api.fetchCalendarEvents(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
          currentUser.id
        )
      ]);
      
      setTasks(tasksData);
      setTaskStatistics(statsData);
      setCalendarEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        userId: currentUser.id,
        ...newTask,
        dueDate: new Date(newTask.dueDate + 'T' + newTask.dueTime)
      };
      
      await api.createTask(taskData);
      setShowCreateTask(false);
      setNewTask({
        subject: '',
        description: '',
        taskType: 'Call',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        notes: '',
        relatedContactId: '',
        relatedLeadId: '',
        relatedDealId: '',
        relatedAssignmentId: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await api.updateTask(taskId, { status });
      fetchData();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleFilterChange = (key: keyof TaskFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Complete': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Overdue': return 'text-red-600 bg-red-100';
      case 'Open': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskTypeIcon = (taskType: Task['taskType']) => {
    switch (taskType) {
      case 'Call': return <ClockIcon className="h-4 w-4" />;
      case 'Email': return <EnvelopeIcon className="h-4 w-4" />;
      case 'Internal': return <CheckListIcon className="h-4 w-4" />;
      case 'Deadline': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'Reminder': return <ClockIcon className="h-4 w-4" />;
      default: return <CheckListIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar and tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar & Tasks</h1>
              <p className="text-sm text-gray-600">Manage your schedule and follow-up activities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      {taskStatistics && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-lg font-bold text-gray-900">{taskStatistics.total}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Open:</span>
              <span className="text-lg font-bold text-blue-600">{taskStatistics.open}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">In Progress:</span>
              <span className="text-lg font-bold text-yellow-600">{taskStatistics.inProgress}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Complete:</span>
              <span className="text-lg font-bold text-green-600">{taskStatistics.complete}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Overdue:</span>
              <span className="text-lg font-bold text-red-600">{taskStatistics.overdue}</span>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedView('calendar')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              selectedView === 'calendar'
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setSelectedView('tasks')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              selectedView === 'tasks'
                ? 'bg-orange-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckListIcon className="h-4 w-4 mr-2" />
            Task List
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Filters Panel */}
        {showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {/* Task Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <select
                  value={filters.taskType || ''}
                  onChange={(e) => handleFilterChange('taskType', e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Internal">Internal</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Reminder">Reminder</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Complete">Complete</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Due Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date From
                </label>
                <input
                  type="date"
                  value={filters.dueDateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('dueDateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date To
                </label>
                <input
                  type="date"
                  value={filters.dueDateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('dueDateTo', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedView === 'calendar' ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1 text-sm rounded ${
                      calendarView === 'month' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1 text-sm rounded ${
                      calendarView === 'week' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView('agenda')}
                    className={`px-3 py-1 text-sm rounded ${
                      calendarView === 'agenda' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Agenda
                  </button>
                </div>
              </div>
              
              {/* Simple Calendar Display */}
              <div className="text-center text-gray-500 py-12">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Calendar view coming soon</p>
                <p className="text-sm">This will include monthly/weekly calendar with task integration</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Task List</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {tasks.length} tasks found
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.subject}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500">{task.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getTaskTypeIcon(task.taskType)}
                            <span className="text-sm text-gray-900">{task.taskType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          {task.dueTime && (
                            <div className="text-sm text-gray-500">{task.dueTime}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {task.status === 'Open' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Start
                              </button>
                            )}
                            {task.status === 'In Progress' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'Complete')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Complete
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-900">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={newTask.subject}
                    onChange={(e) => setNewTask(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter task subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={newTask.taskType}
                      onChange={(e) => setNewTask(prev => ({ ...prev, taskType: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="Internal">Internal</option>
                      <option value="Deadline">Deadline</option>
                      <option value="Reminder">Reminder</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Time</label>
                    <input
                      type="time"
                      value={newTask.dueTime}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueTime: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.subject}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTaskDashboard;
