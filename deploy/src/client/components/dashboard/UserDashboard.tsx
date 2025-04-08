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
}

const UserDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  
  // User role-related state
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStartupOwner, setIsStartupOwner] = useState(false);
  
  useEffect(() => {
    if (!token) return;
    
    const fetchUserTasks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tasks/user', {
          headers: { 'x-auth-token': token }
        });
        setTasks(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.msg || 'Error fetching your tasks');
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchUserRoles = async () => {
      try {
        // Get user's startups and roles
        const roleTitles: string[] = [];
        
        // Check if user is admin (you can adjust this based on your auth system)
        if (user?.email?.includes('admin')) {
          setIsAdmin(true);
          roleTitles.push('Admin');
        }
        
        // Get user's startups
        const userStartupsResponse = await axios.get('/api/startups/user', {
          headers: { 'x-auth-token': token }
        });
        
        const ownedStartups = userStartupsResponse.data.ownedStartups || [];
        if (ownedStartups.length > 0) {
          setIsStartupOwner(true);
          roleTitles.push('Startup Owner');
        }
        
        // Get user's roles from joined startups
        const joinedRoles = userStartupsResponse.data.joinedRoles || [];
        joinedRoles.forEach((userRole: any) => {
          if (userRole.role?.title) {
            roleTitles.push(userRole.role.title);
          }
          if (userRole.role?.roleType) {
            roleTitles.push(userRole.role.roleType);
          }
        });
        
        setUserRoles(Array.from(new Set(roleTitles))); // Remove duplicates using Array.from instead of spread
      } catch (err) {
        console.error('Error fetching user roles:', err);
      }
    };
    
    fetchUserTasks();
    fetchUserRoles();
  }, [token, user]);
  
  // Function to check user role
  const hasRole = (roleType: string | string[]): boolean => {
    if (isAdmin || isStartupOwner) return true;
    
    const rolesToCheck = Array.isArray(roleType) ? roleType : [roleType];
    return rolesToCheck.some(role => 
      userRoles.some(userRole => 
        userRole.toLowerCase().includes(role.toLowerCase())
      )
    );
  };

  // Function to check if user has manager role
  const isManager = (): boolean => {
    return hasRole('manager');
  };

  // Function to check if user is a marketing/sales employee
  const isMarketingSales = (): boolean => {
    return hasRole(['marketing', 'sales']);
  };

  // Function to check if user is a tech/development employee
  const isTechDevelopment = (): boolean => {
    return hasRole(['tech', 'development']);
  };

  // Function to check if user is any type of employee
  const isEmployee = (): boolean => {
    return isMarketingSales() || isTechDevelopment();
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
  
  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetailsModal(true);
  };
  
  const closeTaskDetails = () => {
    setSelectedTask(null);
    setShowTaskDetailsModal(false);
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
  
  const getRegularTasks = () => {
    return tasks.filter(task => !task.title.startsWith('Meeting:'));
  };
  
  const getMeetings = () => {
    // Filter meetings to only those assigned to the current user
    return tasks.filter(task => 
      task.title.startsWith('Meeting:') && 
      (isAdmin || isStartupOwner || task.assignees.some(assignee => assignee.id === user?.id))
    );
  };
  
  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Filter tasks for calendar based on user permissions
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = new Date(task.dueDate);
      const isSameDate = (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
      
      // Regular tasks are visible to everyone
      if (!task.title.startsWith('Meeting:')) {
        return isSameDate;
      }
      
      // Meetings are only visible to admin, startup owner, or assigned users
      return isSameDate && (
        isAdmin || 
        isStartupOwner || 
        task.assignees.some(assignee => assignee.id === user?.id)
      );
    });
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    
    const days: JSX.Element[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`} className="calendar-day empty"></td>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const tasksForDay = getTasksForDate(date);
      const isToday = (
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()
      );
      
      const isSelected = selectedDate && 
        selectedDate.getDate() === date.getDate() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getFullYear() === date.getFullYear();
      
      days.push(
        <td 
          key={`day-${day}`} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="date-header">{day}</div>
          <div className="day-events">
            {tasksForDay.length > 0 && tasksForDay.slice(0, 2).map((task, idx) => (
              <div 
                key={idx} 
                className={`calendar-event event-${task.priority.toLowerCase()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openTaskDetails(task);
                }}
              >
                {task.title.startsWith('Meeting:') ? task.title.substring(9) : task.title}
              </div>
            ))}
            {tasksForDay.length > 2 && (
              <div className="more-events text-primary">
                +{tasksForDay.length - 2} more
              </div>
            )}
          </div>
        </td>
      );
    }
    
    const rows: JSX.Element[] = [];
    let cells: JSX.Element[] = [];
    
    days.forEach((day, i) => {
      if (i % 7 === 0 && i > 0) {
        rows.push(<tr key={i}>{cells}</tr>);
        cells = [];
      }
      cells.push(day);
    });
    
    if (cells.length > 0) {
      // Fill the last row with empty cells if needed
      while (cells.length < 7) {
        cells.push(<td key={`empty-end-${cells.length}`} className="calendar-day empty"></td>);
      }
      rows.push(<tr key={cells.length}>{cells}</tr>);
    }
    
    return rows;
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const prevMonth = () => {
    setSelectedDate(null);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const nextMonth = () => {
    setSelectedDate(null);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  const resetCalendar = () => {
    setSelectedDate(null);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };
  
  // Function to generate a test notification
  const generateTestNotification = () => {
    const types = ['info', 'success', 'warning', 'danger'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const titles = [
      'New join request',
      'Task reminder',
      'Message received',
      'Achievement unlocked',
      'New role added',
      'Startup update',
      'Meeting scheduled'
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    const messages = [
      'Someone wants to join your startup.',
      'Don\'t forget to complete your tasks.',
      'You have a new message from a team member.',
      'You\'ve earned a new badge!',
      'A new role was added to your startup.',
      'Your startup has been updated with new information.',
      'A new meeting has been scheduled for your team.'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    const links = [
      '/my-requests',
      '/my-startups',
      '/profile',
      undefined
    ];
    const randomLink = links[Math.floor(Math.random() * links.length)];
    
    addNotification({
      title: randomTitle,
      message: randomMessage,
      type: randomType,
      link: randomLink
    });
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
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">My Dashboard</h1>
            
          </div>
          
          {/* Role information */}
          {userRoles.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                {userRoles.map((role, index) => (
                  <span key={index} className="badge bg-secondary">{role}</span>
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
                    {getMeetings().length > 0 ? (
                      <div>
                        <p className="mb-1 small">Next meeting:</p>
                        <p className="mb-0 fw-bold">
                          {getMeetings()
                            .filter(m => m.dueDate && new Date(m.dueDate) >= new Date())
                            .sort((a, b) => {
                              if (!a.dueDate || !b.dueDate) return 0;
                              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                            })[0]?.title.replace('Meeting: ', '') || 'No upcoming meetings'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted">No scheduled meetings</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Upcoming Meetings Section */}
          {(isAdmin || isStartupOwner || isManager() || isEmployee()) && getMeetings().filter(m => m.dueDate && new Date(m.dueDate) >= new Date()).length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-info text-white">
                    <h5 className="mb-0">Upcoming Meetings</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Meeting</th>
                            <th>Startup</th>
                            <th>Date & Time</th>
                            <th>Attendees</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getMeetings()
                            .filter(m => m.dueDate && new Date(m.dueDate) >= new Date())
                            .sort((a, b) => {
                              if (!a.dueDate || !b.dueDate) return 0;
                              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                            })
                            .slice(0, 5) // Show only 5 upcoming meetings
                            .map(meeting => (
                              <tr key={meeting.id} onClick={() => openTaskDetails(meeting)} style={{ cursor: 'pointer' }}>
                                <td>
                                  <div className="fw-bold">{meeting.title.replace('Meeting: ', '')}</div>
                                  <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                    {meeting.description?.split('\n\nMeeting Link:')[0]?.substring(0, 40)}
                                    {meeting.description && meeting.description.length > 40 ? '...' : ''}
                                  </small>
                                </td>
                                <td>
                                  {meeting.startup?.name}
                                </td>
                                <td>
                                  {meeting.dueDate && (
                                    <>
                                      <div className="fw-bold">{new Date(meeting.dueDate).toLocaleDateString()}</div>
                                      <small className="text-muted">
                                        {new Date(meeting.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </small>
                                    </>
                                  )}
                                </td>
                                <td>
                                  <div className="d-flex flex-wrap gap-1">
                                    {meeting.assignees.slice(0, 3).map(assignee => (
                                      <span key={assignee.id} className="badge bg-info text-dark">
                                        {assignee.name.split(' ')[0]}
                                        {assignee.id === user?.id && ' (You)'}
                                      </span>
                                    ))}
                                    {meeting.assignees.length > 3 && (
                                      <span className="badge bg-secondary">
                                        +{meeting.assignees.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTaskDetails(meeting);
                                      }}
                                    >
                                      <i className="bi bi-eye me-1"></i> Details
                                    </button>
                                    {extractMeetingLink(meeting.description) && (
                                      <a 
                                        href={extractMeetingLink(meeting.description) || '#'} 
                                        className="btn btn-sm btn-success"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <i className="bi bi-link-45deg me-1"></i> Join
                                      </a>
                                    )}
                                  </div>
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

          {/* Task Status Row */}
          <div className="row mb-4">
            {/* My Tasks */}
            <div className="col-md-7 mb-4">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">My Tasks</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Startup</th>
                          <th>Due Date</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRegularTasks().length > 0 ? (
                          getRegularTasks().map(task => (
                            <tr key={task.id} onClick={() => openTaskDetails(task)} style={{ cursor: 'pointer' }}>
                              <td>
                                <div className="fw-bold">{task.title}</div>
                                <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                  {task.description?.substring(0, 30)}
                                  {task.description && task.description.length > 30 ? '...' : ''}
                                </small>
                              </td>
                              <td>{task.startup.name}</td>
                              <td>
                                {task.dueDate ? (
                                  <div className={isTaskOverdue(task.dueDate) ? 'text-danger' : ''}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${getPriorityClass(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-4">
                              <p className="text-muted mb-0">No assigned tasks</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="col-md-5 mb-4">
              <div className="card">
                <div className="card-header bg-info text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Calendar</h5>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-light" onClick={prevMonth}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-light" onClick={resetCalendar}>
                        Today
                      </button>
                      <button className="btn btn-sm btn-outline-light" onClick={nextMonth}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <h6 className="text-center mb-3">{monthNames[selectedMonth]} {selectedYear}</h6>
                  <table className="table table-bordered calendar-table mb-0">
                    <thead>
                      <tr>
                        <th>Sun</th>
                        <th>Mon</th>
                        <th>Tue</th>
                        <th>Wed</th>
                        <th>Thu</th>
                        <th>Fri</th>
                        <th>Sat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderCalendar()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {selectedDate && (
                <div className="card mt-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      {selectedDate.toLocaleDateString(undefined, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      {getTasksForDate(selectedDate).length > 0 ? (
                        getTasksForDate(selectedDate).map(task => (
                          <li 
                            key={task.id} 
                            className="list-group-item"
                            onClick={() => openTaskDetails(task)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <span className={`badge ${getPriorityClass(task.priority)} me-2`}>
                                  {task.priority}
                                </span>
                                <span className="fw-bold">
                                  {task.title.startsWith('Meeting:') ? (
                                    <i className="bi bi-people me-1"></i>
                                  ) : (
                                    <i className="bi bi-list-task me-1"></i>
                                  )}
                                  {task.title.startsWith('Meeting:') ? task.title.substring(9) : task.title}
                                </span>
                              </div>
                              <small className="text-muted">
                                {task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : ''}
                              </small>
                            </div>
                            <div className="small text-muted mt-1">
                              {task.startup.name}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item text-center py-3">
                          <p className="text-muted mb-0">No tasks or meetings on this day</p>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Meetings */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Upcoming Meetings</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Meeting</th>
                          <th>Startup</th>
                          <th>Date & Time</th>
                          <th>Attendees</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getMeetings().filter(m => m.dueDate && new Date(m.dueDate) >= new Date()).length > 0 ? (
                          getMeetings()
                            .filter(m => m.dueDate && new Date(m.dueDate) >= new Date())
                            .sort((a, b) => {
                              if (!a.dueDate || !b.dueDate) return 0;
                              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                            })
                            .map(meeting => (
                              <tr key={meeting.id} onClick={() => openTaskDetails(meeting)} style={{ cursor: 'pointer' }}>
                                <td>
                                  <div className="fw-bold">{meeting.title.replace('Meeting: ', '')}</div>
                                </td>
                                <td>{meeting.startup.name}</td>
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
                                  <div className="d-flex flex-wrap gap-1">
                                    {meeting.assignees.slice(0, 2).map(assignee => (
                                      <span key={assignee.id} className="badge bg-info text-dark">
                                        {assignee.name.split(' ')[0]}
                                      </span>
                                    ))}
                                    {meeting.assignees.length > 2 && (
                                      <span className="badge bg-secondary">
                                        +{meeting.assignees.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTaskDetails(meeting);
                                      }}
                                    >
                                      <i className="bi bi-eye me-1"></i> Details
                                    </button>
                                    {extractMeetingLink(meeting.description) && (
                                      <a 
                                        href={extractMeetingLink(meeting.description) || '#'} 
                                        className="btn btn-sm btn-success"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <i className="bi bi-link-45deg me-1"></i> Join
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-4">
                              <p className="text-muted mb-0">No upcoming meetings</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task/Meeting Details Modal */}
      {showTaskDetailsModal && selectedTask && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedTask.title.startsWith('Meeting:') 
                    ? selectedTask.title.replace('Meeting: ', '') 
                    : selectedTask.title}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeTaskDetails}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-2">
                    {selectedTask.title.startsWith('Meeting:') 
                      ? selectedTask.description?.split('\n\nMeeting Link:')[0] 
                      : selectedTask.description}
                  </p>
                </div>
                
                {/* Show meeting link if it's a meeting */}
                {selectedTask.title.startsWith('Meeting:') && extractMeetingLink(selectedTask.description) && (
                  <div className="mb-3">
                    <strong>Meeting Link:</strong>
                    <div className="mt-2">
                      <a 
                        href={extractMeetingLink(selectedTask.description) || '#'} 
                        className="btn btn-success"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="bi bi-link-45deg me-1"></i> Join Meeting
                      </a>
                    </div>
                  </div>
                )}
                
                {selectedTask.dueDate && (
                  <div className="mb-3">
                    <strong>{selectedTask.title.startsWith('Meeting:') ? 'Schedule:' : 'Due Date:'}</strong>
                    <p>
                      {new Date(selectedTask.dueDate).toLocaleDateString()}{' '}
                      {selectedTask.title.startsWith('Meeting:') && 
                        new Date(selectedTask.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                )}
                
                {!selectedTask.title.startsWith('Meeting:') && (
                  <div className="mb-3">
                    <strong>Priority:</strong>
                    <p>
                      <span className={`badge ${getPriorityClass(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </p>
                  </div>
                )}
                
                <div className="mb-3">
                  <strong>Status:</strong>
                  <p>{selectedTask.status.name}</p>
                </div>
                
                <div className="mb-3">
                  <strong>Startup:</strong>
                  <p>{selectedTask.startup.name}</p>
                </div>
                
                {selectedTask.title.startsWith('Meeting:') && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <p className="mb-1"><strong>Attendees:</strong></p>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {selectedTask.assignees.map(assignee => (
                          <span key={assignee.id} className="badge bg-info text-dark p-2">
                            {assignee.name}
                            {assignee.id === user?.id && <span className="ms-1">(You)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="row">
                  <div className="col-12">
                    <p className="mb-1"><strong>{selectedTask.title.startsWith('Meeting:') ? 'Other assignees:' : 'Assignees:'}</strong></p>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedTask && !selectedTask.title.startsWith('Meeting:') && selectedTask.assignees.map(assignee => (
                        <span key={assignee.id} className="badge bg-light text-dark p-2">
                          {assignee.name}
                          {assignee.id === user?.id && <span className="ms-1">(You)</span>}
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
                  onClick={closeTaskDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard; 