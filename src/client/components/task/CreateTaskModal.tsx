import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// We'll use a simple input instead of react-datepicker to avoid the dependency issue
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

interface User {
  id: string;
  name: string;
  email: string;
}

interface TaskStatus {
  id: string;
  name: string;
}

interface Startup {
  id: string;
  name: string;
}

interface HourlyRate {
  id: string;
  skillType: string;
  hourlyRate: number;
  description: string;
}

interface CreateTaskModalProps {
  startup: Startup;
  onSave: () => void;
  onCancel: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  startup, 
  onSave, 
  onCancel 
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: null as null | string,
    statusId: '',
    assigneeIds: [] as string[],
    isFreelance: false,
    estimatedHours: 1,
    hourlyRate: 15.00,
    skillType: 'Design'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [hourlyRates, setHourlyRates] = useState<HourlyRate[]>([]);
  
  // Calculate total payment
  const totalPayment = formData.estimatedHours * formData.hourlyRate;
  
  // Calculate base points (1 point per dollar)
  const basePoints = Math.round(totalPayment);
  
  // Calculate bonus points for shorter tasks
  const BASELINE_HOURS = 8;
  const bonusPoints = formData.estimatedHours < BASELINE_HOURS 
    ? Math.round((BASELINE_HOURS - formData.estimatedHours) * 10) 
    : 0;
  
  // Calculate total points
  const totalPoints = basePoints + bonusPoints;
  
  // Fetch task statuses, team members, and hourly rates when component mounts
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch(`/api/tasks/statuses/${startup.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token || ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch task statuses');
        }
        
        const data = await response.json();
        setStatuses(data);
        
        // Set default status to 'To Do' or first status
        const todoStatus = data.find((s: any) => s.name === 'To Do') || data[0];
        if (todoStatus) {
          setFormData(prev => ({ ...prev, statusId: todoStatus.id }));
        }
      } catch (err) {
        console.error('Error fetching statuses:', err);
        setError('Failed to load task statuses');
      }
    };
    
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/startups/${startup.id}/members`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token || ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }
        
        const data = await response.json();
        setTeamMembers(data);
        setAvailableUsers(data);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('Failed to load team members');
      }
    };
    
    const fetchHourlyRates = async () => {
      try {
        const response = await fetch('/api/hourly-rates', {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token || ''
          }
        });
        
        if (!response.ok) {
          // If the API isn't ready yet, use default values
          setHourlyRates([
            { id: '1', skillType: 'Design', hourlyRate: 15, description: 'Design tasks' },
            { id: '2', skillType: 'Development', hourlyRate: 25, description: 'Development tasks' },
            { id: '3', skillType: 'Marketing', hourlyRate: 20, description: 'Marketing tasks' },
            { id: '4', skillType: 'Admin', hourlyRate: 10, description: 'Admin tasks' }
          ]);
          return;
        }
        
        const data = await response.json();
        setHourlyRates(data);
        
        // Set default hourly rate
        if (data.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            hourlyRate: data[0].hourlyRate,
            skillType: data[0].skillType
          }));
        }
      } catch (err) {
        console.error('Error fetching hourly rates:', err);
        // Use default values if API fails
        setHourlyRates([
          { id: '1', skillType: 'Design', hourlyRate: 15, description: 'Design tasks' },
          { id: '2', skillType: 'Development', hourlyRate: 25, description: 'Development tasks' },
          { id: '3', skillType: 'Marketing', hourlyRate: 20, description: 'Marketing tasks' },
          { id: '4', skillType: 'Admin', hourlyRate: 10, description: 'Admin tasks' }
        ]);
      }
    };
    
    fetchStatuses();
    fetchTeamMembers();
    fetchHourlyRates();
  }, [startup.id, token]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'skillType') {
      // Find the hourly rate for this skill type
      const rate = hourlyRates.find(r => r.skillType === value);
      if (rate) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          hourlyRate: rate.hourlyRate
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dueDate: e.target.value }));
  };
  
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({ ...prev, assigneeIds: selectedOptions }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Base points calculation: 1 point per dollar
      const basePoints = Math.round(formData.estimatedHours * formData.hourlyRate);
      
      // Add bonus points for shorter tasks (compared to 8-hour baseline)
      // For each hour below 8, add 10 additional points
      const BASELINE_HOURS = 8;
      let bonusPoints = 0;
      
      if (formData.estimatedHours < BASELINE_HOURS) {
        bonusPoints = Math.round((BASELINE_HOURS - formData.estimatedHours) * 10);
      }
      
      // Calculate total points (base + bonus)
      const totalPoints = basePoints + bonusPoints;
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          ...formData,
          startupId: startup.id,
          basePoints,
          bonusPoints,
          totalPoints
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      onSave();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Task</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select
                    className="form-select"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="dueDate" className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate || ''}
                    onChange={handleDateChange}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="statusId" className="form-label">Status *</label>
                <select
                  className="form-select"
                  id="statusId"
                  name="statusId"
                  value={formData.statusId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a status</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="estimatedHours" className="form-label">
                  <strong>Estimated Hours to Complete Task *</strong>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="estimatedHours"
                  name="estimatedHours"
                  min="0.5"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={handleNumberChange}
                  required
                />
                <small className="form-text text-muted">
                  This is important for task prioritization - tasks with less time per hour of work will be shown first
                </small>
              </div>
              
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isFreelance"
                  name="isFreelance"
                  checked={formData.isFreelance}
                  onChange={handleCheckboxChange}
                />
                <label className="form-check-label" htmlFor="isFreelance">
                  Make this a freelance task (available for all users to accept)
                </label>
              </div>
              
              {formData.isFreelance && (
                <div className="bg-light p-3 mb-3 border rounded">
                  <h6 className="mb-3">Freelance Task Settings</h6>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="skillType" className="form-label">Skill Type *</label>
                      <select
                        className="form-select"
                        id="skillType"
                        name="skillType"
                        value={formData.skillType}
                        onChange={handleChange}
                        required
                      >
                        {hourlyRates.map(rate => (
                          <option key={rate.id} value={rate.skillType}>
                            {rate.skillType}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="hourlyRate" className="form-label">Hourly Rate ($) *</label>
                      <input
                        type="number"
                        className="form-control"
                        id="hourlyRate"
                        name="hourlyRate"
                        min="1"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={handleNumberChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="alert alert-info">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Estimated Payment:</strong></p>
                        <h4 className="mb-1">${totalPayment.toFixed(2)}</h4>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Estimated Points:</strong></p>
                        <h4 className="mb-1">{totalPoints} pts</h4>
                        {bonusPoints > 0 && (
                          <small className="text-success">
                            Includes {bonusPoints} bonus points for quick task!
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!formData.isFreelance && (
                <div className="mb-3">
                  <label htmlFor="assigneeIds" className="form-label">Assignees</label>
                  <select
                    className="form-select"
                    id="assigneeIds"
                    name="assigneeIds"
                    multiple
                    value={formData.assigneeIds}
                    onChange={handleAssigneeChange}
                  >
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <small className="form-text text-muted">Hold Ctrl/Cmd to select multiple users</small>
                </div>
              )}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal; 