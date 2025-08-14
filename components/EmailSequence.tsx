import React, { useState, useEffect } from 'react';
import { 
  EmailSequence as EmailSequenceType, 
  EmailSequenceStep, 
  CommunicationCampaign,
  User 
} from '../types';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  PlayIcon, 
  PauseIcon,
  EyeIcon,
  ClockIcon,
  EnvelopeIcon
} from './icons/Icons';

interface EmailSequenceProps {
  currentUser: User;
  campaignId?: string;
  onSave?: (sequence: EmailSequenceType) => void;
}

const EmailSequence: React.FC<EmailSequenceProps> = ({ 
  currentUser, 
  campaignId, 
  onSave 
}) => {
  const [sequence, setSequence] = useState<EmailSequenceType>({
    id: '',
    campaignId: campaignId || '',
    name: '',
    steps: [],
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<EmailSequenceStep | null>(null);
  const [stepForm, setStepForm] = useState({
    stepNumber: 1,
    subject: '',
    body: '',
    delayDays: 1,
    delayHours: 0,
    conditions: {},
    isActive: true
  });

  useEffect(() => {
    if (campaignId) {
      fetchSequence();
    }
  }, [campaignId]);

  const fetchSequence = async () => {
    try {
      // Mock API call - replace with actual API
      const mockSequence: EmailSequenceType = {
        id: 'seq1',
        campaignId: campaignId || '',
        name: 'Mineral Rights Outreach Sequence',
        steps: [
          {
            id: 'step1',
            sequenceId: 'seq1',
            stepNumber: 1,
            subject: 'Mineral Rights Acquisition Opportunity',
            body: 'Dear {{contact.firstName}},\n\nWe are interested in acquiring your mineral rights in {{tract.county}} County, {{tract.state}}.\n\nOur team has identified significant value in this area and we would like to discuss a potential offer.\n\nPlease let us know if you would be interested in learning more.\n\nBest regards,\n{{user.name}}',
            delayDays: 0,
            delayHours: 0,
            conditions: {},
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'step2',
            sequenceId: 'seq1',
            stepNumber: 2,
            subject: 'Follow-up: Mineral Rights Discussion',
            body: 'Hi {{contact.firstName}},\n\nI wanted to follow up on my previous email about your mineral rights.\n\nIf you haven\'t had a chance to review our offer, I\'d be happy to discuss the details over the phone.\n\nWhat would be a good time to call?\n\nBest regards,\n{{user.name}}',
            delayDays: 3,
            delayHours: 0,
            conditions: { 'previousStep': 'notReplied' },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSequence(mockSequence);
    } catch (error) {
      console.error('Error fetching sequence:', error);
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setStepForm({
      stepNumber: sequence.steps.length + 1,
      subject: '',
      body: '',
      delayDays: 1,
      delayHours: 0,
      conditions: {},
      isActive: true
    });
    setShowStepForm(true);
  };

  const handleEditStep = (step: EmailSequenceStep) => {
    setEditingStep(step);
    setStepForm({
      stepNumber: step.stepNumber,
      subject: step.subject,
      body: step.body,
      delayDays: step.delayDays,
      delayHours: step.delayHours || 0,
      conditions: step.conditions || {},
      isActive: step.isActive
    });
    setShowStepForm(true);
  };

  const handleSaveStep = () => {
    if (editingStep) {
      // Update existing step
      const updatedSteps = sequence.steps.map(step => 
        step.id === editingStep.id 
          ? { ...step, ...stepForm, updatedAt: new Date().toISOString() }
          : step
      );
      setSequence(prev => ({ ...prev, steps: updatedSteps, updatedAt: new Date().toISOString() }));
    } else {
      // Add new step
      const newStep: EmailSequenceStep = {
        id: Date.now().toString(),
        sequenceId: sequence.id,
        ...stepForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSequence(prev => ({ 
        ...prev, 
        steps: [...prev.steps, newStep], 
        updatedAt: new Date().toISOString() 
      }));
    }
    
    setShowStepForm(false);
    setEditingStep(null);
    setStepForm({
      stepNumber: 1,
      subject: '',
      body: '',
      delayDays: 1,
      delayHours: 0,
      conditions: {},
      isActive: true
    });
  };

  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = sequence.steps.filter(step => step.id !== stepId);
    // Renumber remaining steps
    const renumberedSteps = updatedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      updatedAt: new Date().toISOString()
    }));
    setSequence(prev => ({ 
      ...prev, 
      steps: renumberedSteps, 
      updatedAt: new Date().toISOString() 
    }));
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const stepIndex = sequence.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;
    
    const newSteps = [...sequence.steps];
    if (direction === 'up' && stepIndex > 0) {
      [newSteps[stepIndex], newSteps[stepIndex - 1]] = [newSteps[stepIndex - 1], newSteps[stepIndex]];
    } else if (direction === 'down' && stepIndex < newSteps.length - 1) {
      [newSteps[stepIndex], newSteps[stepIndex + 1]] = [newSteps[stepIndex + 1], newSteps[stepIndex]];
    }
    
    // Renumber all steps
    const renumberedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      updatedAt: new Date().toISOString()
    }));
    
    setSequence(prev => ({ 
      ...prev, 
      steps: renumberedSteps, 
      updatedAt: new Date().toISOString() 
    }));
  };

  const handleSaveSequence = () => {
    if (onSave) {
      onSave(sequence);
    }
    // Mock API call - replace with actual API
    console.log('Saving sequence:', sequence);
  };

  const getAvailableVariables = () => [
    '{{contact.firstName}}',
    '{{contact.lastName}}',
    '{{contact.email}}',
    '{{tract.county}}',
    '{{tract.state}}',
    '{{tract.tractName}}',
    '{{user.name}}',
    '{{user.email}}',
    '{{lead.name}}',
    '{{lead.status}}'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Sequence</h3>
          <p className="text-sm text-gray-500">Configure multi-step email campaigns</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </button>
          <button
            onClick={handleSaveSequence}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Save Sequence
          </button>
        </div>
      </div>

      {/* Sequence Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sequence Name
            </label>
            <input
              type="text"
              value={sequence.name}
              onChange={(e) => setSequence(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Enter sequence name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={sequence.isActive}
                  onChange={() => setSequence(prev => ({ ...prev, isActive: true }))}
                  disabled={!isEditing}
                  className="mr-2"
                />
                Active
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!sequence.isActive}
                  onChange={() => setSequence(prev => ({ ...prev, isActive: false }))}
                  disabled={!isEditing}
                  className="mr-2"
                />
                Inactive
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-medium text-gray-900">
            Email Steps ({sequence.steps.length})
          </h4>
          {isEditing && (
            <button
              onClick={handleAddStep}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Step
            </button>
          )}
        </div>

        {sequence.steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No email steps configured yet.</p>
            <p className="text-sm">Add your first step to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sequence.steps.map((step, index) => (
              <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{step.stepNumber}</span>
                    </div>
                    <div>
                      <h5 className="text-md font-medium text-gray-900">{step.subject}</h5>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {step.delayDays > 0 && `${step.delayDays} day(s)`}
                          {step.delayHours > 0 && step.delayDays > 0 && ' + '}
                          {step.delayHours > 0 && `${step.delayHours} hour(s)`}
                          {step.delayDays === 0 && step.delayHours === 0 && 'Immediate'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMoveStep(step.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveStep(step.id, 'down')}
                        disabled={index === sequence.steps.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleEditStep(step)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{step.body}</p>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    step.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {step.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {Object.keys(step.conditions || {}).length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Conditional
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step Form Modal */}
      {showStepForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingStep ? 'Edit Step' : 'Add New Step'}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={stepForm.subject}
                    onChange={(e) => setStepForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body
                  </label>
                  <textarea
                    value={stepForm.body}
                    onChange={(e) => setStepForm(prev => ({ ...prev, body: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email body content"
                  />
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Available variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {getAvailableVariables().map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => setStepForm(prev => ({ 
                            ...prev, 
                            body: prev.body + variable 
                          }))}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stepForm.delayDays}
                      onChange={(e) => setStepForm(prev => ({ ...prev, delayDays: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay (Hours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={stepForm.delayHours}
                      onChange={(e) => setStepForm(prev => ({ ...prev, delayHours: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stepForm.isActive}
                      onChange={(e) => setStepForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Step is active</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStepForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStep}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingStep ? 'Update Step' : 'Add Step'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSequence;
