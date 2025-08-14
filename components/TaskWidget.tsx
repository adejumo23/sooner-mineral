import React, { useState, useEffect } from 'react';
import { CheckListIcon, PlusIcon, ClockIcon, ExclamationTriangleIcon } from './icons/Icons';
import type { Task, CreateTaskRequest, User } from '../types';
import * as api from '../services/api';

interface TaskWidgetProps {
  currentUser: User;
  relatedContactId?: string;
  relatedLeadId?: string;
  relatedDealId?: string;
  relatedAssignmentId?: string;
  title?: string;
  className?: string;
}

const TaskWidget: React.FC<TaskWidgetProps> = ({
  currentUser,
  relatedContactId,
  relatedLeadId,
  relatedDealId,
  relatedAssignmentId,
  title = 'Tasks',
  className = ''
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    subject: '',
    description: '',
    taskType: 'Call' as const,
    priority: 'Medium' as const,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    notes: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [relatedContactId, relatedLeadId, relatedDealId, relatedAssignmentId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const filters = {
        relatedContactId,
        relatedLeadId,
        relatedDealId,
        relatedAssignmentId
      };
      
      // Only fetch if we have at least one related ID
      if (Object.values(filters).some(id => id)) {
        const tasksData = await api.fetchTasks(filters);
        setTasks(tasksData);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData: CreateTaskRequest = {
        userId: currentUser.id,
        ...newTask,
        dueDate: new Date(newTask.dueDate + 'T' + newTask.dueTime),
        relatedContactId,
        relatedLeadId,
        relatedDealId,
        relatedAssignmentId
      };
      
      await api.createTask(taskData);
      setShowCreateForm(false);
      setNewTask({
        subject: '',
        description: '',
        taskType: 'Call',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        notes: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await api.updateTask(taskId, { status });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
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

  const isOverdue = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return task.status !== 'Complete' && dueDate < now;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckListIcon className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({tasks.length})</span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-2 py-1 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Task
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckListIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No tasks found</p>
            <p className="text-sm">Create a task to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 border rounded-lg ${
                  isOverdue(task) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTaskTypeIcon(task.taskType)}
                      <span className="text-sm font-medium text-gray-900">{task.subject}</span>
                      {isOverdue(task) && (
                        <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      {task.dueTime && <span>at {task.dueTime}</span>}
                      <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    {task.status === 'Open' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'In Progress' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'Complete')}
                        className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-100"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
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
                  onClick={() => setShowCreateForm(false)}
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

export default TaskWidget;
