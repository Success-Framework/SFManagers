import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Material UI Icons (example code - you'll need to install @mui/icons-material and @mui/material)
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import TaskIcon from '@mui/icons-material/Assignment';
// import AddTaskIcon from '@mui/icons-material/AddTask';
// import AnalyticsIcon from '@mui/icons-material/BarChart';
// import MeetingIcon from '@mui/icons-material/Group';
// import OpportunitiesIcon from '@mui/icons-material/Lightbulb';
// import CalendarIcon from '@mui/icons-material/Today';
// import EditIcon from '@mui/icons-material/Edit';

interface User {
  id: string;
  name: string;
  email: string;
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
  createdBy: string;
  assigneeId: string | null;
  assignee: User | null;
  createdAt: string;
  updatedAt: string;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  ownerId: string;
}

const TaskManagementPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    statusId: '',
    assigneeId: ''
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch startup details
        const startupResponse = await axios.get(`/api/startups/${startupId}`, {
          headers: { 'x-auth-token': token }
        });
        setStartup(startupResponse.data);
        
        // Fetch tasks for this startup
        const tasksResponse = await axios.get(`/api/tasks/startup/${startupId}`, {
          headers: { 'x-auth-token': token }
        });
        setTasks(tasksResponse.data);
        
        // Fetch task statuses
        const statusResponse = await axios.get(`/api/tasks/statuses/${startupId}`, {
          headers: { 'x-auth-token': token }
        });
        setStatuses(statusResponse.data);
        
        // Fetch startup members
        const membersResponse = await axios.get(`/api/startups/${startupId}/members`, {
          headers: { 'x-auth-token': token }
        });
        setMembers(membersResponse.data);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.msg || 'Error fetching task data');
        setLoading(false);
      }
    };

    fetchData();
  }, [token, startupId, navigate]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/tasks', 
        { ...taskForm, startupId },
        { headers: { 'x-auth-token': token } }
      );
      setTasks([...tasks, response.data]);
      setShowNewTaskModal(false);
      resetTaskForm();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error creating task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask) return;
    
    try {
      const response = await axios.put(`/api/tasks/${currentTask.id}`, 
        taskForm,
        { headers: { 'x-auth-token': token } }
      );
      
      setTasks(tasks.map(task => 
        task.id === currentTask.id ? response.data : task
      ));
      
      setShowEditTaskModal(false);
      resetTaskForm();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error updating task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { 'x-auth-token': token }
      });
      setTasks(tasks.filter(task => task.id !== taskId));
      setShowTaskDetailsModal(false);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error deleting task');
    }
  };

  const openTaskDetails = (task: Task) => {
    setCurrentTask(task);
    setShowTaskDetailsModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    setCurrentTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || '',
      statusId: task.statusId,
      assigneeId: task.assigneeId || ''
    });
    setShowEditTaskModal(true);
  };

  const openNewTaskModal = () => {
    resetTaskForm();
    if (statuses.length > 0) {
      setTaskForm(prev => ({
        ...prev,
        statusId: statuses[0].id
      }));
    }
    setShowNewTaskModal(true);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      statusId: '',
      assigneeId: ''
    });
    setCurrentTask(null);
  };

  const getTasksByStatus = (statusId: string) => {
    return tasks.filter(task => task.statusId === statusId);
  };

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div className="row">
            {statuses.map(status => (
              <div key={status.id} className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    {status.name}
                  </div>
                  <div className="card-body" style={{ minHeight: '300px' }}>
                    {getTasksByStatus(status.id).length === 0 ? (
                      <p className="text-muted text-center">No tasks</p>
                    ) : (
                      getTasksByStatus(status.id).map(task => (
                        <div 
                          key={task.id} 
                          className="card mb-2 task-card"
                          onClick={() => openTaskDetails(task)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body p-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0">{task.title}</h6>
                              <span className={`badge ${getPriorityClass(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-truncate mb-1">{task.description}</p>
                            {task.assignee && (
                              <small className="text-muted">Assigned to: {task.assignee.name}</small>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'addTask':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Add New Task</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateTask}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select
                    className="form-select"
                    id="priority"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="dueDate" className="form-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    id="dueDate"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    value={taskForm.statusId}
                    onChange={(e) => setTaskForm({...taskForm, statusId: e.target.value})}
                    required
                  >
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="assignee" className="form-label">Assignee (Optional)</label>
                  <select
                    className="form-select"
                    id="assignee"
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({...taskForm, assigneeId: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </form>
            </div>
          </div>
        );
      case 'taskAnalytics':
      case 'analytics':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Analytics</h4>
            </div>
            <div className="card-body">
              <p>Analytics feature coming soon!</p>
            </div>
          </div>
        );
      case 'meeting':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Meetings</h4>
            </div>
            <div className="card-body">
              <p>Meeting scheduling feature coming soon!</p>
            </div>
          </div>
        );
      case 'opportunities':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Opportunities</h4>
            </div>
            <div className="card-body">
              <p>View opportunities feature coming soon!</p>
            </div>
          </div>
        );
      case 'createOpportunities':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Create Opportunity</h4>
            </div>
            <div className="card-body">
              <p>Create opportunities feature coming soon!</p>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Calendar</h4>
            </div>
            <div className="card-body">
              <p>Calendar feature coming soon!</p>
            </div>
          </div>
        );
      case 'editProject':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Edit Project</h4>
            </div>
            <div className="card-body">
              <p>Edit project feature coming soon!</p>
            </div>
          </div>
        );
      default:
        return null;
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
    <div className="container-fluid p-0">
      <div className="d-flex">
        {/* Sidebar */}
        <div className={`sidebar bg-dark text-white ${sidebarCollapsed ? 'collapsed' : ''}`} 
             style={{ 
               width: sidebarCollapsed ? '60px' : '250px', 
               minHeight: 'calc(100vh - 56px)',
               position: 'fixed',
               left: 0,
               top: 56, // Adjust for navbar height
               bottom: 0,
               zIndex: 99,
               transition: 'width 0.3s ease'
             }}>
          <div className="p-3 d-flex justify-content-between align-items-center">
            {!sidebarCollapsed && <h5 className="mb-0">Dashboard</h5>}
            <button className="btn btn-sm btn-outline-light" onClick={toggleSidebar}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          <hr className="my-2" />
          <ul className="nav flex-column">
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'tasks' ? 'active bg-primary' : ''}`} 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveTab('tasks'); }}
              >
                <i className="bi bi-list-task me-2"></i>
                {!sidebarCollapsed && 'Tasks'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'addTask' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('addTask'); }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                {!sidebarCollapsed && 'Add Tasks'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'taskAnalytics' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('taskAnalytics'); }}
              >
                <i className="bi bi-graph-up me-2"></i>
                {!sidebarCollapsed && 'Task Analytics'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'analytics' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }}
              >
                <i className="bi bi-bar-chart me-2"></i>
                {!sidebarCollapsed && 'Analytics'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'meeting' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('meeting'); }}
              >
                <i className="bi bi-people me-2"></i>
                {!sidebarCollapsed && 'Meetings'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'opportunities' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('opportunities'); }}
              >
                <i className="bi bi-lightning me-2"></i>
                {!sidebarCollapsed && 'Opportunities'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'createOpportunities' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('createOpportunities'); }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                {!sidebarCollapsed && 'Create Opportunities'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'calendar' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('calendar'); }}
              >
                <i className="bi bi-calendar me-2"></i>
                {!sidebarCollapsed && 'Calendar'}
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'editProject' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('editProject'); }}
              >
                <i className="bi bi-pencil me-2"></i>
                {!sidebarCollapsed && 'Edit Project'}
              </a>
            </li>
          </ul>
        </div>

        {/* Main content */}
        <div className="flex-grow-1 p-4" style={{ 
          marginLeft: sidebarCollapsed ? '60px' : '250px',
          marginTop: '56px', // Add margin-top to match navbar height
          transition: 'margin-left 0.3s ease',
          width: 'calc(100% - ' + (sidebarCollapsed ? '60px' : '250px') + ')'
        }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>{startup?.name} - Dashboard</h2>
            {activeTab === 'tasks' && (
              <button className="btn btn-primary" onClick={openNewTaskModal}>
                Add New Task
              </button>
            )}
          </div>

          {renderTabContent()}
        </div>
      </div>

      {/* Task Details Modal */}
      {showTaskDetailsModal && currentTask && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{currentTask.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowTaskDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p>{currentTask.description}</p>
                </div>
                <div className="mb-3">
                  <strong>Priority:</strong>
                  <span className={`badge ms-2 ${getPriorityClass(currentTask.priority)}`}>
                    {currentTask.priority}
                  </span>
                </div>
                {currentTask.dueDate && (
                  <div className="mb-3">
                    <strong>Due Date:</strong>
                    <p>{new Date(currentTask.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="mb-3">
                  <strong>Status:</strong>
                  <p>{statuses.find(s => s.id === currentTask.statusId)?.name}</p>
                </div>
                <div className="mb-3">
                  <strong>Assignee:</strong>
                  <p>{currentTask.assignee ? currentTask.assignee.name : 'Unassigned'}</p>
                </div>
                <div className="mb-3">
                  <strong>Created at:</strong>
                  <p>{new Date(currentTask.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger me-auto" onClick={() => handleDeleteTask(currentTask.id)}>
                  Delete
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskDetailsModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                  setShowTaskDetailsModal(false);
                  openEditTaskModal(currentTask);
                }}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && currentTask && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditTaskModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateTask}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-title" className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      id="edit-title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="edit-description"
                      rows={3}
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-priority" className="form-label">Priority</label>
                    <select
                      className="form-select"
                      id="edit-priority"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-dueDate" className="form-label">Due Date (Optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      id="edit-dueDate"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-status" className="form-label">Status</label>
                    <select
                      className="form-select"
                      id="edit-status"
                      value={taskForm.statusId}
                      onChange={(e) => setTaskForm({...taskForm, statusId: e.target.value})}
                      required
                    >
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-assignee" className="form-label">Assignee (Optional)</label>
                    <select
                      className="form-select"
                      id="edit-assignee"
                      value={taskForm.assigneeId}
                      onChange={(e) => setTaskForm({...taskForm, assigneeId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagementPage; 