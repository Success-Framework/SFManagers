import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
  email?: string;
}

interface Startup {
  id: string;
  name: string;
}

interface TaskStatus {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  status: {
    id: string;
    name: string;
  };
  startup: Startup;
  createdBy: string;
  creator: User;
  isFreelance: boolean;
  freelancerId: string | null;
  estimatedHours: number;
  hourlyRate: number;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  totalPoints: number;
  skillType: string;
  createdAt: string;
  updatedAt: string;
}

// Types for sorting
type SortBy = 'dueDate' | 'priority' | 'title' | 'points';

const FreelanceTaskList: React.FC = () => {
  const { token, user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'myTasks'>('available');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [positionFilter, setPositionFilter] = useState<string>('All');

  useEffect(() => {
    const fetchAvailableTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/tasks/freelance', {
          headers: {
            'x-auth-token': token || ''
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAvailableTasks(data);
      } catch (err) {
        console.error('Error fetching available freelance tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load available tasks');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchMyTasks = async () => {
      try {
        const response = await fetch('/api/tasks/freelance/my', {
          headers: {
            'x-auth-token': token || ''
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMyTasks(data);
      } catch (err) {
        console.error('Error fetching my freelance tasks:', err);
        // Don't show error for my tasks since it might be empty for new users
      }
    };
    
    if (token) {
      fetchAvailableTasks();
      fetchMyTasks();
    }
  }, [token, refreshCounter]);

  const acceptTask = async (taskId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/tasks/freelance/accept/${taskId}`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept task');
      }
      
      // Refresh both task lists
      setRefreshCounter(prev => prev + 1);
      toast.success('Task accepted successfully!');
    } catch (err) {
      console.error('Error accepting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept task');
      toast.error(err instanceof Error ? err.message : 'Failed to accept task');
    }
  };

  const cancelTask = async (taskId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/tasks/freelance/cancel/${taskId}`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel task');
      }
      
      // Refresh both task lists
      setRefreshCounter(prev => prev + 1);
      toast.success('Task cancelled successfully!');
    } catch (err) {
      console.error('Error cancelling task:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel task');
      toast.error(err instanceof Error ? err.message : 'Failed to cancel task');
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning text-dark';
      case 'low':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-danger';
      case 'HIGH':
        return 'bg-warning text-dark';
      case 'MEDIUM':
        return 'bg-info text-dark';
      case 'LOW':
        return 'bg-success text-light';
      default:
        return 'bg-secondary';
    }
  };

  const calculateTimeRemaining = (dueDate: string | null): string => {
    if (!dueDate) return 'No deadline';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | string | null | undefined): string => {
    // Handle all possible cases to ensure we have a valid number
    if (amount === null || amount === undefined) {
      return '0.00';
    }
    
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number after conversion
    if (isNaN(numAmount) || typeof numAmount !== 'number') {
      return '0.00';
    }
    
    return numAmount.toFixed(2);
  };

  const totalPayment = (task: Task): number => {
    // Ensure both values are valid numbers
    const hours = task.estimatedHours || 0;
    const rate = task.hourlyRate || 0;
    
    // Convert to numbers if they're strings
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    
    // Check if both are valid numbers
    if (isNaN(numHours) || isNaN(numRate) || typeof numHours !== 'number' || typeof numRate !== 'number') {
      return 0;
    }
    
    return numHours * numRate;
  };

  // Add helper function for calculating urgency ratio
  const calculateUrgencyRatio = (task: Task) => {
    if (!task.dueDate) return 0; // No deadline = lowest urgency
    
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    
    // If already overdue, return highest value (highest urgency)
    if (diffHours <= 0) return 100;
    
    // Use estimated hours or default to 1 to avoid division by zero
    const estHours = task.estimatedHours || 1;
    
    // Calculate urgency - less time means higher urgency
    if (diffHours < 24) return 90; // Due in less than a day
    if (diffHours < 72) return 70; // Due in less than 3 days
    if (diffHours < 168) return 50; // Due in less than a week
    
    return 10; // Due in more than a week
  };

  const getUrgencyLabel = (task: Task): string => {
    const ratio = calculateUrgencyRatio(task);
    
    if (ratio === 0) return 'Overdue';
    if (ratio === Infinity) return 'No deadline';
    
    if (ratio < 8) return 'CRITICAL'; // Less than 8 hours per hour of work
    if (ratio < 24) return 'HIGH';     // Less than 1 day per hour of work
    if (ratio < 72) return 'MEDIUM';   // Less than 3 days per hour of work
    return 'LOW';
  };

  const formatTimeToWorkRatio = (task: Task): string => {
    const ratio = calculateUrgencyRatio(task);
    
    if (ratio === 0) return 'Overdue!';
    if (ratio === Infinity) return 'No deadline';
    
    if (ratio < 1) {
      // Less than 1 hour per hour of work - show in minutes
      return `${Math.round(ratio * 60)} min/hour of work`;
    } else if (ratio < 24) {
      // Less than a day - show in hours
      return `${ratio.toFixed(1)} hours/hour of work`;
    } else {
      // Show in days
      return `${(ratio / 24).toFixed(1)} days/hour of work`;
    }
  };

  // Get unique skill types from tasks
  const uniquePositions = useMemo(() => {
    const positions = new Set<string>();
    positions.add('All');
    
    availableTasks.forEach(task => {
      if (task.skillType) positions.add(task.skillType);
    });
    
    myTasks.forEach(task => {
      if (task.skillType) positions.add(task.skillType);
    });
    
    return Array.from(positions);
  }, [availableTasks, myTasks]);

  // Filtered available tasks by position
  const filteredAvailableTasks = useMemo(() => {
    if (!availableTasks) return [];
    
    if (positionFilter === 'All') {
      return availableTasks;
    }
    
    return availableTasks.filter(task => task.skillType === positionFilter);
  }, [availableTasks, positionFilter]);

  // Filtered my tasks by position
  const filteredMyTasks = useMemo(() => {
    if (!myTasks) return [];
    
    if (positionFilter === 'All') {
      return myTasks;
    }
    
    return myTasks.filter(task => task.skillType === positionFilter);
  }, [myTasks, positionFilter]);

  // Sorted available tasks
  const sortedAvailableTasks = useMemo(() => {
    if (!filteredAvailableTasks) return [];
    
    return [...filteredAvailableTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        // Sort by due date (ascending)
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortBy === 'priority') {
        // Sort by priority (high > medium > low)
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
      } else if (sortBy === 'title') {
        // Sort by title (A-Z)
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'points') {
        // Sort by points (descending)
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      }
      // Default sorting by due date
      return 0;
    });
  }, [filteredAvailableTasks, sortBy]);

  // Sorted my tasks
  const sortedMyTasks = useMemo(() => {
    if (!filteredMyTasks) return [];
    
    return [...filteredMyTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        // Sort by due date (ascending)
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      } else if (sortBy === 'priority') {
        // Sort by priority (high > medium > low)
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
      } else if (sortBy === 'title') {
        // Sort by title (A-Z)
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'points') {
        // Sort by points (descending)
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      }
      // Default sorting by due date
      return 0;
    });
  }, [filteredMyTasks, sortBy]);

  if (loading && !(availableTasks.length || myTasks.length)) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Freelance Tasks</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available Tasks
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'myTasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTasks')}
          >
            My Tasks
          </button>
        </li>
      </ul>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-3">
          <div>
            <label htmlFor="sortBy" className="me-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="form-select"
              id="sortBy"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
              <option value="points">Points (Highest first)</option>
            </select>
            <div className="form-text small text-muted mt-1">
              <i className="bi bi-info-circle me-1"></i>
              Points represent task value based on payment and completion time. Higher points = more valuable tasks.
            </div>
          </div>
          
          <div>
            <label htmlFor="positionFilter" className="me-2">Filter by Position:</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="form-select"
              id="positionFilter"
            >
              {uniquePositions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'available' && (
        <>
          <h3>Available Freelance Tasks</h3>
          {availableTasks.length === 0 ? (
            <div className="alert alert-info">
              No freelance tasks are available at the moment.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
              {sortedAvailableTasks.map(task => (
                <div className="col" key={task.id}>
                  <div className={`card h-100 shadow-sm border-${getUrgencyLabel(task) === 'CRITICAL' ? 'danger' : getUrgencyLabel(task) === 'HIGH' ? 'warning' : ''}`}>
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0">{task.title}</h5>
                      <div>
                        <span className={`badge ${getUrgencyBadgeClass(getUrgencyLabel(task))}`}>
                          {getUrgencyLabel(task)}
                        </span>
                        {task.skillType && (
                          <span className="ms-1 small text-muted">
                            {task.skillType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="card-text">{task.description}</p>
                      
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">
                            <i className="bi bi-clock me-2"></i>
                            <strong>Est. Hours:</strong> {task.estimatedHours || 'Not specified'}
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-currency-dollar me-2"></i>
                            <strong>Rate:</strong> ${formatCurrency(task.hourlyRate)}/hr
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-cash-stack me-2"></i>
                            <strong>Total Pay:</strong> ${formatCurrency(totalPayment(task))}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">
                            <i className="bi bi-calendar-event me-2"></i>
                            <strong>Due:</strong> {formatDate(task.dueDate)}
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-star me-2"></i>
                            <strong>Points:</strong> <span className="text-primary fw-bold">{task.totalPoints || 0}</span>
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-tags me-2"></i>
                            <strong>Skill Type:</strong> {task.skillType || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-muted small mb-1">
                        <strong>Status:</strong> {task.status.name}
                      </p>
                      <p className="text-muted small mb-1">
                        <strong>Project:</strong> {task.startup.name}
                      </p>
                      <p className="text-muted small mb-3">
                        <strong>Created By:</strong> {task.creator.name}
                      </p>
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => acceptTask(task.id)}
                      >
                        Accept Task
                      </button>
                    </div>
                    <div className="card-footer text-muted small">
                      Created: {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'myTasks' && (
        <>
          <h3>My Freelance Tasks</h3>
          {myTasks.length === 0 ? (
            <div className="alert alert-info">
              You haven't accepted any freelance tasks yet.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
              {sortedMyTasks.map(task => (
                <div className="col" key={task.id}>
                  <div className={`card h-100 shadow-sm border-${getUrgencyLabel(task) === 'CRITICAL' ? 'danger' : getUrgencyLabel(task) === 'HIGH' ? 'warning' : ''}`}>
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0">{task.title}</h5>
                      <div>
                        <span className={`badge ${getUrgencyBadgeClass(getUrgencyLabel(task))}`}>
                          {getUrgencyLabel(task)}
                        </span>
                        {task.skillType && (
                          <span className="ms-1 small text-muted">
                            {task.skillType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="card-text">{task.description}</p>
                      
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">
                            <i className="bi bi-clock me-2"></i>
                            <strong>Est. Hours:</strong> {task.estimatedHours || 'Not specified'}
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-currency-dollar me-2"></i>
                            <strong>Rate:</strong> ${formatCurrency(task.hourlyRate)}/hr
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-cash-stack me-2"></i>
                            <strong>Total Pay:</strong> ${formatCurrency(totalPayment(task))}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">
                            <i className="bi bi-calendar-event me-2"></i>
                            <strong>Due:</strong> {formatDate(task.dueDate)}
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-star me-2"></i>
                            <strong>Points:</strong> <span className="text-primary fw-bold">{task.totalPoints || 0}</span>
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-tags me-2"></i>
                            <strong>Skill Type:</strong> {task.skillType || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-footer bg-transparent d-flex justify-content-between">
                      <div>
                        <span className="text-muted small">
                          <i className="bi bi-person me-1"></i>
                          Created by: {task.creator?.name || 'Unknown'}
                        </span>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this task? It will return to the available tasks list.')) {
                            cancelTask(task.id);
                          }
                        }}
                      >
                        Cancel Task
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FreelanceTaskList; 