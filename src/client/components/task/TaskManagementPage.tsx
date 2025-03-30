import React, { useState, useEffect, useCallback } from 'react';
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
  creator: User;
  assignees: User[];
  createdAt: string;
  updatedAt: string;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  ownerId: string;
}

interface CalendarViewProps {
  tasks: Task[];
  openTaskDetails: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, openTaskDetails }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState<Array<Array<{date: Date; tasks: Task[]}>>>([]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const calendarDays: Array<Array<{date: Date; tasks: Task[]}>> = [];
    let calendarWeek: Array<{date: Date; tasks: Task[]}> = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarWeek.push({ date: new Date(year, month, -i), tasks: [] });
    }
    calendarWeek.reverse();
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getFullYear() === date.getFullYear() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getDate() === date.getDate()
        );
      });
      
      calendarWeek.push({ date, tasks: dayTasks });
      
      // Start a new week if we've reached Sunday or the end of the month
      if (calendarWeek.length === 7 || day === daysInMonth) {
        // If it's the last week and we need to fill in empty cells
        while (calendarWeek.length < 7) {
          const nextDate = new Date(year, month, day + calendarWeek.length - 6);
          calendarWeek.push({ date: nextDate, tasks: [] });
        }
        
        calendarDays.push([...calendarWeek]);
        calendarWeek = [];
      }
    }
    
    setCalendar(calendarDays);
  }, [currentDate, tasks]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="calendar-view">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={prevMonth}>
          <i className="bi bi-chevron-left"></i>
        </button>
        <h5 className="mb-0">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h5>
        <button className="btn btn-sm btn-outline-secondary" onClick={nextMonth}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
      
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <th key={day} className="text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => (
                  <td key={dayIndex} className={`calendar-day ${isToday(day.date) ? 'bg-light' : ''} ${!isCurrentMonth(day.date) ? 'text-muted' : ''}`}>
                    <div className="date-header">
                      {day.date.getDate()}
                    </div>
                    <div className="day-events">
                      {day.tasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id} 
                          className={`calendar-event ${getPriorityColorClass(task.priority)}`}
                          onClick={() => openTaskDetails(task)}
                        >
                          <div className="event-title text-truncate">
                            {task.title}
                          </div>
                        </div>
                      ))}
                      {day.tasks.length > 3 && (
                        <div className="more-events text-muted">
                          +{day.tasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getPriorityColorClass = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'event-high';
    case 'medium':
      return 'event-medium';
    case 'low':
      return 'event-low';
    default:
      return 'event-default';
  }
};

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
  const [meetingLink, setMeetingLink] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    statusId: '',
    assigneeIds: [] as string[]
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
      
      // Add the new task to the tasks array
      setTasks([...tasks, response.data]);
      // Close the modal
      setShowNewTaskModal(false);
      // Reset the form
      resetTaskForm();
      
      // Refresh tasks to ensure we get the latest data
      const tasksResponse = await axios.get(`/api/tasks/startup/${startupId}`, {
        headers: { 'x-auth-token': token }
      });
      setTasks(tasksResponse.data);
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
      assigneeIds: task.assignees.map(assignee => assignee.id)
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
      assigneeIds: []
    });
    setCurrentTask(null);
  };

  const getTasksByStatus = (statusId: string) => {
    return tasks.filter(task => 
      task.statusId === statusId && 
      // Filter out items that start with "Meeting:" from task boards
      !task.title.startsWith('Meeting:')
    );
  };

  const getMeetingsByStatus = (statusId: string) => {
    return tasks.filter(task => 
      task.statusId === statusId && 
      task.title.startsWith('Meeting:')
    );
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
                  <div className="card-header bg-primary text-white p-1">
                    {status.name}
                  </div>
                  <div 
                    className="card-body p-1"
                    style={{ 
                      minHeight: '600px',
                      maxHeight: '600px',
                      overflowY: 'auto',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    {getTasksByStatus(status.id).length === 0 ? (
                      <p className="text-muted text-center">No tasks</p>
                    ) : (
                      getTasksByStatus(status.id).map((task) => (
                        <div 
                          key={task.id} 
                          className="card mb-1"
                          style={{ 
                            cursor: 'pointer',
                            maxHeight: '100px',
                            overflow: 'hidden'
                          }}
                          onClick={() => openTaskDetails(task)}
                        >
                          <div className="card-body p-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <h6 className="mb-0" style={{ fontSize: '0.85rem', maxWidth: '70%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{task.title}</h6>
                              <span className={`badge ${getPriorityClass(task.priority)}`} style={{ fontSize: '0.65rem' }}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-truncate mb-1" style={{ fontSize: '0.75rem', height: '18px' }}>
                              {task.description || "No description"}
                            </p>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              {task.dueDate ? (
                                <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                  <i className="bi bi-calendar-event me-1"></i>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </small>
                              ) : (
                                <small className="text-muted" style={{ fontSize: '0.65rem' }}>No due date</small>
                              )}
                              <select 
                                className="form-select form-select-sm" 
                                style={{ width: '45%', fontSize: '0.65rem', height: 'auto', padding: '1px 6px' }}
                                value={task.statusId}
                                onChange={(e) => {
                                  const newStatusId = e.target.value;
                                  
                                  // Update UI optimistically
                                  setTasks(prevTasks => 
                                    prevTasks.map(t => 
                                      t.id === task.id 
                                        ? { 
                                            ...t, 
                                            statusId: newStatusId,
                                            status: statuses.find(s => s.id === newStatusId) || t.status 
                                          } 
                                        : t
                                    )
                                  );
                                  
                                  // Update backend
                                  axios.patch(
                                    `/api/tasks/${task.id}/status`,
                                    { statusId: newStatusId },
                                    { headers: { 'x-auth-token': token } }
                                  )
                                  .catch(err => {
                                    console.error('Error updating task status:', err);
                                    setError('Failed to update task status');
                                    
                                    // Refresh tasks from server on error
                                    axios.get(`/api/tasks/startup/${startupId}`, {
                                      headers: { 'x-auth-token': token }
                                    })
                                    .then(response => setTasks(response.data))
                                    .catch(error => console.error('Error refreshing tasks:', error));
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {statuses.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="d-flex flex-wrap mt-1">
                                {task.assignees.map(assignee => (
                                  <span 
                                    key={assignee.id} 
                                    className="badge bg-secondary me-1"
                                    title={assignee.name}
                                    style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                                  >
                                    {assignee.name?.charAt(0) || 'U'}
                                  </span>
                                ))}
                              </div>
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
                  <label htmlFor="title" className="form-label">Title *</label>
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
                  <label htmlFor="description" className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="priority" className="form-label">Priority *</label>
                  <select
                    className="form-select"
                    id="priority"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    required
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
                  <label htmlFor="status" className="form-label">Status *</label>
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
                  <label htmlFor="assignees" className="form-label">Assignees *</label>
                  <select
                    className="form-select"
                    id="assignees"
                    multiple
                    value={taskForm.assigneeIds}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setTaskForm({...taskForm, assigneeIds: selectedOptions});
                    }}
                    required
                  >
                    {members.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <small className="form-text text-muted">Hold Ctrl (Windows) or Command (Mac) to select multiple assignees</small>
                </div>
                <div className="text-end">
                  <button type="submit" className="btn btn-primary px-4">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'taskAnalytics':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Task Analytics</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Tasks by Status</h5>
                    </div>
                    <div className="card-body">
                      <div className="chart-container" style={{ height: '250px' }}>
                        {statuses.length > 0 && (
                          <div className="d-flex flex-column h-100">
                            <div className="d-flex justify-content-between mb-2">
                              <div className="small text-muted">Status</div>
                              <div className="small text-muted">Tasks</div>
                            </div>
                            {statuses.map(status => {
                              const count = getTasksByStatus(status.id).length;
                              const percentage = tasks.length > 0 
                                ? Math.round((count / tasks.length) * 100) 
                                : 0;
                              
                              return (
                                <div key={status.id} className="mb-3">
                                  <div className="d-flex justify-content-between mb-1">
                                    <span>{status.name}</span>
                                    <span>{count} ({percentage}%)</span>
                                  </div>
                                  <div className="progress" style={{ height: '20px' }}>
                                    <div 
                                      className="progress-bar" 
                                      role="progressbar" 
                                      style={{ width: `${percentage}%` }}
                                      aria-valuenow={percentage} 
                                      aria-valuemin={0} 
                                      aria-valuemax={100}
                                    >
                                      {percentage > 10 ? `${percentage}%` : ''}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Tasks by Priority</h5>
                    </div>
                    <div className="card-body">
                      <div className="chart-container" style={{ height: '250px' }}>
                        {(() => {
                          const priorities = ['high', 'medium', 'low'];
                          const countByPriority = priorities.map(priority => {
                            return tasks.filter(task => task.priority === priority).length;
                          });
                          
                          return (
                            <div className="d-flex flex-column h-100">
                              <div className="d-flex justify-content-between mb-2">
                                <div className="small text-muted">Priority</div>
                                <div className="small text-muted">Tasks</div>
                              </div>
                              {priorities.map((priority, index) => {
                                const count = countByPriority[index];
                                const percentage = tasks.length > 0 
                                  ? Math.round((count / tasks.length) * 100) 
                                  : 0;
                                
                                return (
                                  <div key={priority} className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="text-capitalize">{priority}</span>
                                      <span>{count} ({percentage}%)</span>
                                    </div>
                                    <div className="progress" style={{ height: '20px' }}>
                                      <div 
                                        className={`progress-bar ${getPriorityClass(priority)}`}
                                        role="progressbar" 
                                        style={{ width: `${percentage}%` }}
                                        aria-valuenow={percentage} 
                                        aria-valuemin={0} 
                                        aria-valuemax={100}
                                      >
                                        {percentage > 10 ? `${percentage}%` : ''}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-12 mb-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Task Completion Timeline</h5>
                    </div>
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-6 mb-3">
                          <h6>Tasks Due This Week</h6>
                          {(() => {
                            const today = new Date();
                            const endOfWeek = new Date(today);
                            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
                            
                            const tasksThisWeek = tasks.filter(task => {
                              if (!task.dueDate) return false;
                              const dueDate = new Date(task.dueDate);
                              return dueDate >= today && dueDate <= endOfWeek;
                            });
                            
                            if (tasksThisWeek.length === 0) {
                              return <p className="text-muted">No tasks due this week</p>;
                            }
                            
                            return (
                              <div className="list-group">
                                {tasksThisWeek.map(task => (
                                  <div key={task.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="d-flex align-items-center">
                                        <span className={`badge ${getPriorityClass(task.priority)} me-2`}>
                                          {task.priority}
                                        </span>
                                        <span className="fw-bold">{task.title}</span>
                                      </div>
                                      <small className="text-muted d-block">
                                        {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                                      </small>
                                    </div>
                                    <span className="badge bg-secondary">
                                      {statuses.find(s => s.id === task.statusId)?.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <h6>Overdue Tasks</h6>
                          {(() => {
                            const today = new Date();
                            
                            const overdueTasksNotDone = tasks.filter(task => {
                              if (!task.dueDate) return false;
                              const doneStatusIds = statuses
                                .filter(s => s.name.toLowerCase() === 'done' || s.name.toLowerCase() === 'completed')
                                .map(s => s.id);
                              const isDone = doneStatusIds.includes(task.statusId);
                              const dueDate = new Date(task.dueDate);
                              return dueDate < today && !isDone;
                            });
                            
                            if (overdueTasksNotDone.length === 0) {
                              return <p className="text-muted">No overdue tasks</p>;
                            }
                            
                            return (
                              <div className="list-group">
                                {overdueTasksNotDone.map(task => (
                                  <div key={task.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="d-flex align-items-center">
                                        <span className={`badge ${getPriorityClass(task.priority)} me-2`}>
                                          {task.priority}
                                        </span>
                                        <span className="fw-bold">{task.title}</span>
                                      </div>
                                      <small className="text-danger d-block">
                                        Due {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                                      </small>
                                    </div>
                                    <span className="badge bg-secondary">
                                      {statuses.find(s => s.id === task.statusId)?.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Task Summary</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-3 col-sm-6 mb-3">
                          <div className="card bg-primary text-white">
                            <div className="card-body py-3">
                              <h6 className="mb-0">Total Tasks</h6>
                              <h2 className="mt-2 mb-0">{tasks.length}</h2>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-3">
                          <div className="card bg-success text-white">
                            <div className="card-body py-3">
                              <h6 className="mb-0">Completed</h6>
                              {(() => {
                                const doneStatusIds = statuses
                                  .filter(s => s.name.toLowerCase() === 'done' || s.name.toLowerCase() === 'completed')
                                  .map(s => s.id);
                                const completedCount = tasks.filter(t => doneStatusIds.includes(t.statusId)).length;
                                return <h2 className="mt-2 mb-0">{completedCount}</h2>;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-3">
                          <div className="card bg-warning text-dark">
                            <div className="card-body py-3">
                              <h6 className="mb-0">In Progress</h6>
                              {(() => {
                                const inProgressStatusIds = statuses
                                  .filter(s => s.name.toLowerCase().includes('progress') || s.name.toLowerCase().includes('doing'))
                                  .map(s => s.id);
                                const inProgressCount = tasks.filter(t => inProgressStatusIds.includes(t.statusId)).length;
                                return <h2 className="mt-2 mb-0">{inProgressCount}</h2>;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-3">
                          <div className="card bg-danger text-white">
                            <div className="card-body py-3">
                              <h6 className="mb-0">High Priority</h6>
                              <h2 className="mt-2 mb-0">{tasks.filter(t => t.priority === 'high').length}</h2>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'meetings':
        return (
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Meetings</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>All Meetings</h5>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => {
                        resetTaskForm();
                        if (statuses.length > 0) {
                          setTaskForm(prev => ({
                            ...prev,
                            statusId: statuses[0].id
                          }));
                        }
                        setActiveTab('calendar');
                      }}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Schedule New Meeting
                    </button>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Meeting</th>
                          <th>Date & Time</th>
                          <th>Attendees</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks
                          .filter(task => task.title.startsWith('Meeting:'))
                          .sort((a, b) => {
                            // Sort by date - newest first
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                          })
                          .map(meeting => (
                            <tr key={meeting.id}>
                              <td>
                                <div className="fw-bold">{meeting.title.replace('Meeting: ', '')}</div>
                                <small className="text-truncate d-block" style={{ maxWidth: '300px' }}>
                                  {meeting.description?.split('\n\nMeeting Link:')[0]?.substring(0, 50)}
                                  {meeting.description && meeting.description.length > 50 ? '...' : ''}
                                </small>
                              </td>
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
                              <td>
                                {meeting.assignees.length > 0 ? (
                                  <div className="d-flex align-items-center">
                                    <div className="avatar-group">
                                      {meeting.assignees.slice(0, 3).map(assignee => (
                                        <span 
                                          key={assignee.id} 
                                          className="badge bg-secondary me-1"
                                          title={assignee.name}
                                        >
                                          {assignee.name?.charAt(0) || 'U'}
                                        </span>
                                      ))}
                                    </div>
                                    {meeting.assignees.length > 3 && (
                                      <small className="text-muted ms-1">+{meeting.assignees.length - 3} more</small>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted">No attendees</span>
                                )}
                              </td>
                              <td>
                                <select 
                                  className="form-select form-select-sm"
                                  value={meeting.statusId}
                                  onChange={(e) => {
                                    const newStatusId = e.target.value;
                                    
                                    // Update UI optimistically
                                    setTasks(prevTasks => 
                                      prevTasks.map(t => 
                                        t.id === meeting.id 
                                          ? { 
                                              ...t, 
                                              statusId: newStatusId,
                                              status: statuses.find(s => s.id === newStatusId) || t.status 
                                            } 
                                          : t
                                      )
                                    );
                                    
                                    // Update backend
                                    axios.patch(
                                      `/api/tasks/${meeting.id}/status`,
                                      { statusId: newStatusId },
                                      { headers: { 'x-auth-token': token } }
                                    )
                                    .catch(err => {
                                      console.error('Error updating meeting status:', err);
                                      setError('Failed to update meeting status');
                                      
                                      // Refresh tasks from server on error
                                      axios.get(`/api/tasks/startup/${startupId}`, {
                                        headers: { 'x-auth-token': token }
                                      })
                                      .then(response => setTasks(response.data))
                                      .catch(error => console.error('Error refreshing meetings:', error));
                                    });
                                  }}
                                >
                                  {statuses.map(status => (
                                    <option key={status.id} value={status.id}>
                                      {status.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => openTaskDetails(meeting)}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteTask(meeting.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    
                    {tasks.filter(task => task.title.startsWith('Meeting:')).length === 0 && (
                      <div className="text-center p-3">
                        <p className="text-muted">No meetings scheduled</p>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            resetTaskForm();
                            if (statuses.length > 0) {
                              setTaskForm(prev => ({
                                ...prev,
                                statusId: statuses[0].id
                              }));
                            }
                            setActiveTab('calendar');
                          }}
                        >
                          Schedule a Meeting
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
              <div className="row">
                <div className="col-md-8">
                  <div className="calendar-container mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>Upcoming Meetings</h5>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => {
                          resetTaskForm();
                          if (statuses.length > 0) {
                            setTaskForm(prev => ({
                              ...prev,
                              statusId: statuses[0].id
                            }));
                          }
                        }}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Schedule Meeting
                      </button>
                    </div>
                    
                    <div className="list-group">
                      {tasks
                        .filter(task => task.dueDate && new Date(task.dueDate) >= new Date() && task.title.startsWith('Meeting:'))
                        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                        .slice(0, 5)
                        .map(task => (
                          <div key={task.id} className="list-group-item list-group-item-action">
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1">{task.title}</h6>
                              <small className="text-muted">
                                {new Date(task.dueDate!).toLocaleDateString()} {new Date(task.dueDate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </small>
                            </div>
                            <p className="mb-1 text-truncate">{task.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {task.assignees.length} attendee{task.assignees.length !== 1 ? 's' : ''}
                              </small>
                              <span className={`badge ${getPriorityClass(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                      {tasks.filter(task => task.dueDate && new Date(task.dueDate) >= new Date() && task.title.startsWith('Meeting:')).length === 0 && (
                        <div className="text-center p-3">
                          <p className="text-muted">No upcoming meetings scheduled</p>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => {
                              resetTaskForm();
                              if (statuses.length > 0) {
                                setTaskForm(prev => ({
                                  ...prev,
                                  statusId: statuses[0].id
                                }));
                              }
                            }}
                          >
                            Schedule a Meeting
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="calendar-grid">
                    <CalendarView 
                      tasks={tasks} 
                      openTaskDetails={openTaskDetails}
                    />
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Schedule Meeting</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        // Create task with meeting info
                        const meetingTaskForm = {
                          ...taskForm,
                          title: `Meeting: ${taskForm.title}`,
                          description: `${taskForm.description}\n\nMeeting Link: ${meetingLink}`,
                          // Set default priority and status
                          priority: 'medium',
                          statusId: statuses.length > 0 ? statuses[0].id : '',
                        };
                        
                        const handleCreateMeeting = async () => {
                          try {
                            const response = await axios.post('/api/tasks', 
                              { ...meetingTaskForm, startupId },
                              { headers: { 'x-auth-token': token } }
                            );
                            
                            // Add the new task to the tasks array
                            setTasks([...tasks, response.data]);
                            
                            // Reset the forms
                            resetTaskForm();
                            setMeetingLink('');
                            
                            // Refresh tasks from server
                            const tasksResponse = await axios.get(`/api/tasks/startup/${startupId}`, {
                              headers: { 'x-auth-token': token }
                            });
                            setTasks(tasksResponse.data);
                            
                            // Show success message
                            setError(null);
                            alert('Meeting scheduled successfully!');
                          } catch (err: any) {
                            setError(err.response?.data?.msg || 'Error scheduling meeting');
                          }
                        };
                        
                        handleCreateMeeting();
                      }}>
                        <div className="mb-3">
                          <label htmlFor="meetingTitle" className="form-label">Meeting Title*</label>
                          <input
                            type="text"
                            className="form-control"
                            id="meetingTitle"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="meetingDescription" className="form-label">Description*</label>
                          <textarea
                            className="form-control"
                            id="meetingDescription"
                            rows={3}
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                            required
                          ></textarea>
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="meetingLink" className="form-label">Meeting Link*</label>
                          <input
                            type="url"
                            className="form-control"
                            id="meetingLink"
                            placeholder="https://meet.google.com/..."
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="meetingDate" className="form-label">Date & Time*</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            id="meetingDate"
                            value={taskForm.dueDate}
                            onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="meetingAssignees" className="form-label">Attendees*</label>
                          <select
                            className="form-select"
                            id="meetingAssignees"
                            multiple
                            value={taskForm.assigneeIds}
                            onChange={(e) => {
                              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                              setTaskForm({...taskForm, assigneeIds: selectedOptions});
                            }}
                            required
                          >
                            {members.map(member => (
                              <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                          </select>
                          <small className="form-text text-muted">Hold Ctrl (Windows) or Command (Mac) to select multiple attendees</small>
                        </div>
                        
                        <div className="text-end">
                          <button type="submit" className="btn btn-primary">
                            Schedule Meeting
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
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
                className={`nav-link ${activeTab === 'meetings' ? 'active bg-primary' : ''}`} 
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('meetings'); }}
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
                  <strong>Assignees:</strong>
                  {currentTask.assignees.length === 0 ? (
                    <p>None</p>
                  ) : (
                    <ul className="list-group mt-2">
                      {currentTask.assignees.map(assignee => (
                        <li key={assignee.id} className="list-group-item d-flex justify-content-between align-items-center">
                          {assignee.name}
                          <span className="badge bg-primary rounded-pill">{assignee.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mb-3">
                  <strong>Created by:</strong>
                  <p>{currentTask.creator?.name || 'Unknown'}</p>
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
                    <label htmlFor="edit-title" className="form-label">Title *</label>
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
                    <label htmlFor="edit-description" className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      id="edit-description"
                      rows={3}
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-priority" className="form-label">Priority *</label>
                    <select
                      className="form-select"
                      id="edit-priority"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as 'low' | 'medium' | 'high'})}
                      required
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
                    <label htmlFor="edit-status" className="form-label">Status *</label>
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
                    <label htmlFor="edit-assignees" className="form-label">Assignees *</label>
                    <select
                      className="form-select"
                      id="edit-assignees"
                      multiple
                      value={taskForm.assigneeIds}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setTaskForm({...taskForm, assigneeIds: selectedOptions});
                      }}
                      required
                    >
                      {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                    <small className="form-text text-muted">Hold Ctrl (Windows) or Command (Mac) to select multiple assignees</small>
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