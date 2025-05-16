import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
  users: User[];
}

interface Startup {
  id: string;
  name: string;
  details: string;
  owner: User;
  roles: Role[];
}

interface TaskStatus {
  id: string;
  name: string;
  startupId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  statusId: string;
  status: TaskStatus;
  startupId: string;
  startup: {
    id: string;
    name: string;
  };
  createdBy: string;
  creator: User;
  assignees: User[];
  createdAt: string;
  updatedAt: string;
  startTime?: string;
  endTime?: string;
}

interface UserRoleWithContext {
  id: string;
  title: string;
  roleType: string;
  startupName: string;
  startupId: string;
  isOwner: boolean;
  isPaid: boolean;
}

// Move getPriorityClass function outside of components
const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-danger';
    case 'medium':
      return 'bg-warning';
    case 'low':
      return 'bg-info';
    default:
      return 'bg-secondary';
  }
};

// Add TaskDetailsModal component
const TaskDetailsModal: React.FC<{
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}> = ({ task, onClose, onUpdate, onDelete }) => {
  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{task.title}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <strong>Description:</strong>
              <p className="mt-2">{task.description}</p>
            </div>
            
            <div className="mb-3">
              <strong>Due Date:</strong>
              <p>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
            </div>

            <div className="mb-3">
              <strong>Priority:</strong>
              <p>
                <span className={`badge ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </p>
            </div>

            <div className="mb-3">
              <strong>Status:</strong>
              <p>{task.status?.name}</p>
            </div>

            <div className="row">
              <div className="col-12">
                <p className="mb-1"><strong>Assignees:</strong></p>
                <div className="d-flex flex-wrap gap-2">
                  {task.assignees?.map(assignee => (
                    <span key={assignee.id} className="badge bg-light text-dark p-2">
                      {assignee.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  
  // User role-related state
  const [userRoles, setUserRoles] = useState<UserRoleWithContext[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStartupOwner, setIsStartupOwner] = useState<boolean>(false);
  const [ownedStartups, setOwnedStartups] = useState<Array<{id: string; name: string; details: string; stage?: string}>>([]);
  const [joinedStartups, setJoinedStartups] = useState<Array<{id: string; name: string; details: string; stage?: string; roles?: Role[]}>>([]);
  
  useEffect(() => {
    if (!token) {
      console.error('No auth token available in UserDashboard');
      addNotification({
        type: 'danger',
        title: 'Authentication Error',
        message: 'Please log in again to continue.'
      });
      navigate('/login');
      return;
    }

    // Create a stable reference to the user ID
    const userId = user?.id;
    
    // Flag to handle component unmount
    let isMounted = true;

    const fetchUserTasks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tasks/user', {
          headers: { 'x-auth-token': token }
        });
        
        if (!isMounted) return;
        
        // If response data is null or undefined, set empty array
        const tasksData = response.data || [];
        setTasks(tasksData);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching tasks:', err);
        // Don't set error state here - we want the dashboard to work even if tasks fail
        // Just set empty tasks
        setTasks([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    const fetchUserRoles = async () => {
      try {
        // Prepare default empty responses in case API calls fail
        let ownedStartupsData: Startup[] = [];
        let joinedStartupsData: Startup[] = [];
        
        try {
          // Get owned startups - handle failure independently
          const ownedResponse = await axios.get<Startup[]>('/api/startups/my-startups', {
            headers: { 'x-auth-token': token }
          });
          ownedStartupsData = ownedResponse.data || [];
        } catch (ownedError) {
          console.error('Error fetching owned startups:', ownedError);
          // Continue with empty owned startups
        }
        
        try {
          // Get joined startups - handle failure independently
          const joinedResponse = await axios.get<Startup[]>('/api/auth/joined-startups', {
            headers: { 'x-auth-token': token }
          });
          joinedStartupsData = joinedResponse.data || [];
        } catch (joinedError) {
          console.error('Error fetching joined startups:', joinedError);
          // Continue with empty joined startups
        }

        if (!isMounted) return;

        // Process startups even if one of the APIs failed
        const allRoles: UserRoleWithContext[] = [
          // Add roles from owned startups (with owner role)
          ...ownedStartupsData.map((startup) => ({
            id: `${startup.id}-owner`,
            title: 'Founder',
            roleType: 'Admin',
            startupName: startup.name,
            startupId: startup.id,
            isOwner: true,
            isPaid: false
          })),
          // Add roles from joined startups - make sure all required fields exist
          ...joinedStartupsData.flatMap((startup) => {
            const startupRoles = startup.roles || [];
            return startupRoles
              .filter((role) => role.users && Array.isArray(role.users) && role.users.some((u) => u && u.id === userId))
              .map((role) => ({
                id: role.id,
                title: role.title || 'Team Member',
                roleType: role.roleType || 'Member',
                startupName: startup.name || 'Unnamed Startup',
                startupId: startup.id,
                isOwner: false,
                isPaid: !!role.isPaid
              }));
          })
        ];

        if (isMounted) {
          // Update admin and owner status
          const hasAdminRole = allRoles.some(role => role.roleType.toLowerCase().includes('admin'));
          const hasOwnerRole = allRoles.some(role => role.isOwner);
          
          setUserRoles(allRoles);
          setIsAdmin(hasAdminRole);
          setIsStartupOwner(hasOwnerRole);
          
          if (ownedStartupsData.length > 0) {
            setOwnedStartups(ownedStartupsData.map(startup => ({
              id: startup.id,
              name: startup.name || 'Unnamed Startup',
              details: startup.details || 'No description available',
              stage: startup.details && startup.details.length > 100 ? startup.details.substring(0, 100) + '...' : undefined
            })));
          }
          
          if (joinedStartupsData.length > 0) {
            setJoinedStartups(joinedStartupsData.map(startup => ({
              id: startup.id,
              name: startup.name || 'Unnamed Startup',
              details: startup.details || 'No description available',
              stage: startup.details && startup.details.length > 100 ? startup.details.substring(0, 100) + '...' : undefined,
              roles: startup.roles || []
            })));
          }
          
          // If we reached this point, we have enough data to show the dashboard
          setLoading(false);
        }
      } catch (error: unknown) {
        if (isMounted) {
          console.error('Error in fetchUserRoles:', error);
          
          // Only show notification if both API calls failed completely
          addNotification({
            type: 'warning',
            title: 'Partial Data Loaded',
            message: 'Some startup data could not be loaded. You may have limited functionality.'
          });
          
          // Set loading to false so the dashboard can still be seen
          setLoading(false);
        }
      }
    };
    
    // Use Promise.all to fetch data in parallel but continue even if one fails
    Promise.allSettled([
      fetchUserTasks(),
      fetchUserRoles()
    ]).then(() => {
      // Set loading to false after all requests finish or fail
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [token, user?.id, addNotification, navigate]);
  
  // Function to check if user has admin privileges in a specific startup
  const hasAdminPrivilegesInStartup = (startupId?: string): boolean => {
    if (!startupId) return false;
    
    // Check if user is the owner of the startup
    if (isStartupOwner && ownedStartups && ownedStartups.some(s => s.id === startupId)) {
      return true;
    }
    
    // Check if user has an admin role in the startup
    return userRoles && userRoles.some(
      roleContext => 
        roleContext.startupId === startupId && 
        roleContext.roleType && roleContext.roleType.toLowerCase().includes('admin')
    );
  };

  // Function to check if user has role in a specific startup
  const hasRoleInStartup = (startupId?: string, roleType?: string | string[]): boolean => {
    if (!startupId || !roleType) return false;
    
    // Startup owner has all permissions for their startup
    if (isStartupOwner && ownedStartups && ownedStartups.some(s => s.id === startupId)) {
      return true;
    }
    
    if (!userRoles || !Array.isArray(userRoles)) return false;
    
    const rolesToCheck = Array.isArray(roleType) ? roleType : [roleType];
    
    return userRoles.some(
      roleContext => 
        roleContext.startupId === startupId && 
        rolesToCheck.some(type => 
          type && roleContext.roleType && 
          roleContext.roleType.toLowerCase().includes(type.toLowerCase())
        )
    );
  };

  // Function to check if user has role in any startup
  const hasRole = (roleType: string | string[]): boolean => {
    // Owner has all roles in their startups
    if (isStartupOwner) {
      return true;
    }
    
    const rolesToCheck = Array.isArray(roleType) ? roleType : [roleType];
    return userRoles.some(
      roleContext => rolesToCheck.some(type => roleContext.roleType.toLowerCase().includes(type.toLowerCase()))
    );
  };

  // Function to check if user has manager role
  const isManager = (): boolean => {
    return hasRole(['manager', 'admin']);
  };

  // Function to check if user is a marketing/sales employee
  const isMarketingSales = (): boolean => {
    return hasRole(['marketing', 'sales', 'operations']);
  };

  // Function to check if user is a tech/development employee
  const isTechDevelopment = (): boolean => {
    return hasRole(['tech', 'development', 'design']);
  };

  // Function to check if user is any type of employee
  const isEmployee = (): boolean => {
    return isMarketingSales() || isTechDevelopment() || hasRole('employee');
  };
  
  // Function to extract meeting link from description
  const extractMeetingLink = (description: string): string | null => {
    if (!description) return null;
    
    // Try to extract link following "Meeting Link:" pattern
    const meetingLinkMatch = description.match(/Meeting Link:\s*(https?:\/\/[^\s]+)/i);
    if (meetingLinkMatch && meetingLinkMatch[1]) {
      return meetingLinkMatch[1];
    }
    
    // Try to find any URL in the description as fallback
    const urlMatch = description.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    
    return null;
  };
  
  // Function to check if user can perform specific actions
  const canPerformAction = (action: string, task?: Task): boolean => {
    if (!task) return false;
    
    // Admin and Startup Owner can do everything in their startup
    if (hasAdminPrivilegesInStartup(task.startup?.id)) {
      return true;
    }

    switch (action) {
      case 'view_task_details':
        // Managers can view all tasks in their startup
        if (hasRoleInStartup(task.startup?.id, 'Manager')) return true;
        // Users can view task details if they're assigned to the task
        return task.assignees && Array.isArray(task.assignees) && 
          task.assignees.some(assignee => assignee?.id === user?.id);
      
      case 'view_meeting_details':
        // Managers can view all meetings in their startup
        if (hasRoleInStartup(task.startup?.id, 'Manager')) return true;
        // Users can view meeting details if they're assigned to the meeting
        return task.assignees && Array.isArray(task.assignees) && 
          task.assignees.some(assignee => assignee?.id === user?.id);
      
      case 'join_meeting':
        // Users can join meetings they're assigned to
        return task.assignees && Array.isArray(task.assignees) && 
          task.assignees.some(assignee => assignee?.id === user?.id);
      
      default:
        return false;
    }
  };

  // Update the task details handler
  const openTaskDetails = (task: Task) => {
    const isMeeting = task.title.startsWith('Meeting:');
    const action = isMeeting ? 'view_meeting_details' : 'view_task_details';
    
    if (!canPerformAction(action, task)) {
      console.error(`You do not have permission to view this ${isMeeting ? 'meeting' : 'task'}`);
      return;
    }
    
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  // Filter tasks based on user role and permissions
  const getRegularTasks = () => {
    return tasks.filter(task => !task.title.startsWith('Meeting:'));
  };
  
  const getMeetings = () => {
    return tasks.filter(task => task.title.startsWith('Meeting:'));
  };
  
  const closeTaskDetails = () => {
    setSelectedTask(null);
    setShowTaskDetails(false);
  };
  
  const isTaskDueSoon = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };
  
  const isTaskOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };
  
  const handleViewDetails = (startupId: string) => {
    navigate(`/startup/${startupId}`);
  };

  const handleViewDashboard = (startup: {id: string; name: string}) => {
    navigate(`/startup/${startup.id}/tasks`);
  };

  const handleManageRequests = (startupId: string) => {
    navigate(`/startup/${startupId}/requests`);
  };
  
  const handleTaskUpdate = async (task: Task) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await axios.put(`/api/tasks/${task.id}`, task, {
        headers: { 'x-auth-token': token }
      });

      setTasks(tasks.map(t => t.id === task.id ? response.data : t));
      setSelectedTask(null);
      setShowTaskDetails(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error updating task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { 'x-auth-token': token }
      });

      setTasks(tasks.filter(t => t.id !== taskId));
      setSelectedTask(null);
      setShowTaskDetails(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error deleting task');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="mb-4">Dashboard</h1>
      
      {/* My Startups Section */}
      <div className="mb-5">
        <h2 className="h4 mb-3">Startups I Own</h2>
        {ownedStartups.length === 0 ? (
          <div className="alert alert-info">
            You don't own any startups yet. <a href="/create-startup">Create a startup</a> to get started.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {ownedStartups.map(startup => (
              <div key={startup.id} className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{startup.name}</h5>
                    <p className="card-text">
                      {startup.details && startup.details.length > 100 
                        ? `${startup.details.substring(0, 100)}...` 
                        : (startup.details || 'No description available')}
                    </p>
                    {startup.stage && <p className="badge bg-info">{startup.stage}</p>}
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => handleViewDetails(startup.id)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn btn-outline-success btn-sm" 
                        onClick={() => handleViewDashboard(startup)}
                      >
                        View Dashboard
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-sm" 
                        onClick={() => handleManageRequests(startup.id)}
                      >
                        Requests
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Joined Startups */}
      <div className="mb-5">
        <h2 className="h4 mb-3">Startups I've Joined</h2>
        {joinedStartups.length === 0 ? (
          <div className="alert alert-info">
            You haven't joined any startups yet. <a href="/browse-startups">Browse startups</a> to collaborate with others.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {joinedStartups.map(startup => (
              <div key={startup.id} className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{startup.name}</h5>
                    <p className="card-text">
                      {startup.details && startup.details.length > 100 
                        ? `${startup.details.substring(0, 100)}...` 
                        : (startup.details || 'No description available')}
                    </p>
                    {startup.stage && <p className="badge bg-info">{startup.stage}</p>}
                    {startup.roles && startup.roles.length > 0 && (
                      <p className="mt-2">
                        <small className="text-muted">
                          Role: {startup.roles[0].title}
                        </small>
                      </p>
                    )}
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => handleViewDetails(startup.id)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn btn-outline-success btn-sm" 
                        onClick={() => handleViewDashboard(startup)}
                      >
                        View Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Dashboard Content */}
      <h2 className="h4 mb-3">My Tasks &amp; Activities</h2>
      
      {/* Role information */}
      {userRoles.length > 0 && (
        <div className="mb-3">
          <div className="d-flex flex-wrap gap-2">
            {userRoles.map((role, index) => (
              <span key={index} className="badge bg-secondary">{role.title}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Task Overview Row */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title text-primary">
                <i className="bi bi-list-task me-2"></i>
                My Tasks
              </h5>
              <div className="display-4 my-3">{getRegularTasks().length}</div>
              <p className="text-muted">Total assigned tasks</p>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${getRegularTasks().filter(t => t.status.name === 'Done').length / Math.max(getRegularTasks().length, 1) * 100}%` }}
                  aria-valuenow={getRegularTasks().filter(t => t.status.name === 'Done').length} 
                  aria-valuemin={0} 
                  aria-valuemax={getRegularTasks().length}
                ></div>
              </div>
              <small className="text-success">
                {getRegularTasks().filter(t => t.status.name === 'Done').length} completed
              </small>
            </div>
          </div>
        </div>
        
        {/* Show Due Soon tasks to everyone */}
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title text-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Due Soon
              </h5>
              <div className="display-4 my-3">
                {getRegularTasks().filter(task => isTaskDueSoon(task.dueDate)).length}
              </div>
              <p className="text-muted">Tasks due within 3 days</p>
              <ul className="list-unstyled">
                {getRegularTasks().filter(task => isTaskDueSoon(task.dueDate)).slice(0, 2).map(task => (
                  <li key={task.id} className="small text-truncate">
                    <span className={`badge ${getPriorityClass(task.priority)} me-1`}>{task.priority}</span>
                    {task.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Show meetings only to those who need to see them */}
        {(isAdmin || isStartupOwner || isManager() || isEmployee()) && (
          <div className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title text-info">
                  <i className="bi bi-calendar-event me-2"></i>
                  Meetings
                </h5>
                <div className="display-4 my-3">{getMeetings().length}</div>
                <p className="text-muted">Scheduled meetings</p>
                <ul className="list-unstyled">
                  {getMeetings().slice(0, 2).map(meeting => (
                    <li key={meeting.id} className="small text-truncate">
                      <i className="bi bi-clock me-1"></i>
                      {meeting.title.replace('Meeting:', '').trim()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tasks List */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Tasks</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Task</th>
                      <th>Startup</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRegularTasks().map(task => (
                      <tr key={task.id} onClick={() => openTaskDetails(task)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div className="fw-bold">{task.title}</div>
                          <small className="text-muted">{task.description}</small>
                        </td>
                        <td>{task.startup?.name}</td>
                        <td>
                          {task.dueDate ? (
                            <div>
                              <div>{new Date(task.dueDate).toLocaleDateString()}</div>
                              <small className="text-muted">
                                {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">No due date</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getPriorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>{task.status?.name}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTaskDetails(task);
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings List */}
      {(isAdmin || isStartupOwner || isManager() || isEmployee()) && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Meetings</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Meeting</th>
                        <th>Startup</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMeetings().map(meeting => (
                        <tr key={meeting.id} onClick={() => openTaskDetails(meeting)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div className="fw-bold">{meeting.title.replace('Meeting:', '').trim()}</div>
                            <small className="text-muted">{meeting.description}</small>
                          </td>
                          <td>{meeting.startup?.name}</td>
                          <td>
                            {meeting.dueDate ? (
                              <div>
                                <div>{new Date(meeting.dueDate).toLocaleDateString()}</div>
                                <small className="text-muted">
                                  {new Date(meeting.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">No date set</span>
                            )}
                          </td>
                          <td>{meeting.status?.name}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-info text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTaskDetails(meeting);
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={closeTaskDetails}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default UserDashboard; 