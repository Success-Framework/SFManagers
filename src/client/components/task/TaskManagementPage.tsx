import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Modal, Button } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { Opportunity, OpportunityFormData } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { useCallback, useMemo } from 'react';
import AffiliateAnalytics from '../affiliate/AffiliateAnalytics';

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

type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'COMPLETED';

interface TaskStatus {
  id: string;
  name: TaskStatusType;
  startupId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: { id: string; name: string };
  assignees: Array<{ id: string; name: string; email?: string }>;
  statusId: string;
  startup: { id: string; name: string };
  totalTimeSpent?: number;
  isTimerRunning?: boolean;
  timerStartedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  creator?: { id: string; name: string; email?: string };
}

interface Startup {
  id: string;
  name: string;
  details: string;
  ownerId: string;
  roles?: Array<{
    id: string;
    title: string;
    roleType?: string;
    assignedUser?: User;
    assignedUsers?: Array<{userId: string, user: User}>;
  }>;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

interface MeetingDetailsModalProps {
  meeting: Task;
  onClose: () => void;
}

const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({ meeting, onClose }) => {
  const extractMeetingLink = (description: string | null): string | null => {
    if (!description) return null;
    const match = description.match(/Meeting Link: (https?:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title">
              {meeting.title.replace('Meeting: ', '')}
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body pt-0">
            <p className="mb-4">
              {meeting.description?.split('\n\nMeeting Link:')[0]}
            </p>
            
            {extractMeetingLink(meeting.description) && (
              <a 
                href={extractMeetingLink(meeting.description) || '#'} 
                className="btn btn-success w-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-camera-video me-2"></i> Join Meeting
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CalendarViewProps {
  tasks: Task[];
  openTaskDetails: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, openTaskDetails }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendar, setCalendar] = useState<Array<Array<{date: Date; tasks: Task[]}>>>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Task | null>(null);

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
          taskDate.getDate() === date.getDate() &&
          task.title.startsWith('Meeting:') // Only show meetings
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
      {selectedMeeting && (
        <MeetingDetailsModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
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
                          onClick={() => {
                            if (task.title.startsWith('Meeting:')) {
                              setSelectedMeeting(task);
                            } else {
                              openTaskDetails(task);
                            }
                          }}
                        >
                          <div className="event-title text-truncate">
                            {task.title.startsWith('Meeting:') ? task.title.substring(9) : task.title}
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

const getPriorityColorClass = (priority: string): string => {
  if (!priority) {
    return 'bg-secondary';
  }
  
  switch (priority.toLowerCase()) {
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

function getStatusColor(status: TaskStatusType | Lead['status']): string {
  switch (status) {
    case 'TODO':
      return 'bg-secondary';
    case 'IN_PROGRESS':
      return 'bg-info';
    case 'DONE':
    case 'COMPLETED':
      return 'bg-success';
    case 'NEW':
      return 'bg-secondary';
    case 'CONTACTED':
      return 'bg-info';
    case 'QUALIFIED':
      return 'bg-primary';
    case 'PROPOSAL':
      return 'bg-warning';
    case 'NEGOTIATION':
      return 'bg-danger';
    case 'CLOSED':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return `${hours > 0 ? hours + ':' : ''}${pad(minutes)}:${pad(remainingSeconds)}`;
};

// Add this component for the timer display and controls
interface TimeTrackerProps {
  task: Task;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerStop: (note: string) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ task, onTimerStart, onTimerPause, onTimerStop }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(task.totalTimeSpent || 0);
  const [timerNote, setTimerNote] = useState<string>('');
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (task.isTimerRunning && task.timerStartedAt) {
      const startTime = new Date(task.timerStartedAt).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const additionalTime = Math.floor((now - startTime) / 1000);
        setElapsedTime((task.totalTimeSpent || 0) + additionalTime);
      }, 1000);
    } else {
      setElapsedTime(task.totalTimeSpent || 0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task.isTimerRunning, task.timerStartedAt, task.totalTimeSpent]);
  
  const handlePause = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button action
    e.stopPropagation(); // Stop event propagation
    onTimerPause();
    setTimerNote('');
  };

  const handleStop = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button action
    e.stopPropagation(); // Stop event propagation
    onTimerStop(timerNote);
    setTimerNote('');
  };
  
  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button action
    e.stopPropagation(); // Stop event propagation
    onTimerStart();
  };
  
  return (
    <div className="time-tracker mt-3">
      <h6>Time Tracking</h6>
      <div className="d-flex align-items-center mb-2">
        <div className="timer-display me-3">
          <i className="bi bi-clock me-2"></i>
          <span className="time">{formatTime(elapsedTime)}</span>
        </div>
        {task.isTimerRunning ? (
          <div className="btn-group">
            <button 
              type="button" // Explicitly set button type to prevent form submission
              className="btn btn-sm btn-warning me-2"
              onClick={handlePause}
              title="Pause Timer"
            >
              <i className="bi bi-pause-fill"></i> Pause
            </button>
            <button 
              type="button" // Explicitly set button type to prevent form submission
              className="btn btn-sm btn-danger"
              onClick={handleStop}
              title="Stop Timer"
            >
              <i className="bi bi-stop-fill"></i> Stop
            </button>
          </div>
        ) : (
          <button 
            type="button" // Explicitly set button type to prevent form submission
            className="btn btn-sm btn-success"
            onClick={handleStart}
            title="Start Timer"
          >
            <i className="bi bi-play-fill"></i> Start
          </button>
        )}
      </div>
      {task.isTimerRunning && (
        <div className="mt-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Add a note about this time entry (optional)"
            value={timerNote}
            onChange={(e) => setTimerNote(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// Add time tracking logs component
interface TimeLogsProps {
  task: Task;
}

// Add the TimeTracking and TimeLogs components to complete what was started earlier
interface TimeTrackingLog {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  startTime: string;
  endTime: string;
  duration: number; // Duration in seconds
  note?: string;
  createdAt: string;
}

// Complete the TimeLogs component
const TimeLogs: React.FC<TimeLogsProps> = ({ task }) => {
  const [timeLogs, setTimeLogs] = useState<TimeTrackingLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  useEffect(() => {
    const fetchTimeLogs = async () => {
      if (!task.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }
        
        const response = await fetch(`/api/tasks/${task.id}/time-logs`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch time logs: ${response.status}`);
        }
        
        const data = await response.json();
        setTimeLogs(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching time logs:', err);
        setError('Failed to load time logs');
        setLoading(false);
      }
    };
    
    fetchTimeLogs();
  }, [task.id, token, task.totalTimeSpent]); // Re-fetch when totalTimeSpent changes
  
  if (loading) {
    return <div className="text-center py-3">Loading time logs...</div>;
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  
  if (timeLogs.length === 0) {
    return <div className="text-muted py-2">No time logs recorded yet.</div>;
  }
  
  return (
    <div className="time-logs mt-3">
      <h6>Time Logs</h6>
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>User</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {timeLogs.map(log => (
              <tr key={log.id}>
                <td>{log.user?.name || log.userId}</td>
                <td>{new Date(log.startTime).toLocaleString()}</td>
                <td>{new Date(log.endTime).toLocaleString()}</td>
                <td>{formatTime(log.duration)}</td>
                <td>{log.note || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-end fw-bold">Total:</td>
              <td className="fw-bold">{formatTime(task.totalTimeSpent || 0)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

interface SidebarTab {
  id: string;
  icon: string;
  label: string;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  startTime?: string;
  endTime?: string;
  statusId: string;
  assigneeIds: string[];
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;  // Added company field
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  source: string;
  notes?: string;
  salesAmount: number;
  nextActionDate?: string;
  assignedToId?: string;
  assignedTo?: User;
  startupId: string;
  startup?: Startup;
  createdAt: string;
  updatedAt: string;
  comments?: LeadComment[];
}

interface LeadComment {
  id: string;
  content: string;
  leadId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: Lead['status'];
  source: string;
  notes: string;
  salesAmount: number;
  assignedToId?: string;
  nextActionDate: string;
}

const formatDate = (date: string | undefined | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

// Add a helper function to check for meeting time conflicts
const checkMeetingTimeConflict = (startTime: string, endTime: string, date: string, existingMeetings: Task[]): boolean => {
  const newStartDateTime = new Date(`${date}T${startTime}`);
  const newEndDateTime = new Date(`${date}T${endTime}`);

  return existingMeetings.some(meeting => {
    if (!meeting.dueDate || !meeting.startTime || !meeting.endTime) return false;
    
    const meetingDate = meeting.dueDate.split('T')[0];
    const existingStartDateTime = new Date(`${meetingDate}T${meeting.startTime}`);
    const existingEndDateTime = new Date(`${meetingDate}T${meeting.endTime}`);

    // Check if the new meeting overlaps with an existing meeting
    return (
      (newStartDateTime >= existingStartDateTime && newStartDateTime < existingEndDateTime) ||
      (newEndDateTime > existingStartDateTime && newEndDateTime <= existingEndDateTime) ||
      (newStartDateTime <= existingStartDateTime && newEndDateTime >= existingEndDateTime)
    );
  });
};

interface UserRoleWithContext {
  role: {
    id: string;
    title: string;
    roleType: string;
  };
  startup: {
    id: string;
    name: string;
  };
}

// Define correct interface for member structure
interface Member {
  id: string;
  name: string;
  email: string;
}

const TaskManagementPage: React.FC = (): JSX.Element => {
  const { startupId } = useParams<{ startupId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [meetingLink, setMeetingLink] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStartupOwner, setIsStartupOwner] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    statusId: '',
    assigneeIds: []
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityForm, setOpportunityForm] = useState<OpportunityFormData>({
    position: '',
    experience: '',
    description: '',
    openings: 1
  });
  const [showEditOpportunityModal, setShowEditOpportunityModal] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState<Opportunity | null>(null);
  const [timeTrackingError, setTimeTrackingError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [showLeadDetailsModal, setShowLeadDetailsModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'NEW',
    source: '',
    notes: '',
    salesAmount: 0,
    nextActionDate: new Date().toISOString().split('T')[0]
  });
  const [newLeadComment, setNewLeadComment] = useState('');
  const [leadFilters, setLeadFilters] = useState<{
    status?: string;
    assignedToId?: string;
    search?: string;
  }>({});
  const [userRoles, setUserRoles] = useState<UserRoleWithContext[]>([]);
  const [ownedStartups, setOwnedStartups] = useState<Startup[]>([]);

  useEffect(() => {
    if (!startupId || !token) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      
      try {
        // Fetch startup details first to check ownership
        let startupData = null;
        let isOwner = false; // Declare isOwner here so it's accessible in the entire function scope
        
        try {
        const startupResponse = await axios.get(`/api/startups/${startupId}`, {
          headers: { 'x-auth-token': token }
        });
          startupData = startupResponse.data;
          setStartup(startupData);
        
        // Check if user is startup owner
          isOwner = user?.id === startupData.ownerId;
        setIsStartupOwner(isOwner);
        } catch (err: any) {
          console.error('Error fetching startup details:', err);
          throw new Error(err.response?.data?.msg || 'Error fetching startup details');
        }
        
        // Fetch user's roles for this startup
        let roles: UserRoleWithContext[] = [];
        try {
        const userRolesResponse = await axios.get(`/api/startups/${startupId}/user-roles`, {
          headers: { 'x-auth-token': token }
        });
        
        // Transform the roles data
          roles = userRolesResponse.data.map((userRole: any) => ({
          role: userRole.role,
          startup: {
            id: startupId,
              name: startupData?.name || 'Unknown Startup' // Add null check here
          }
        }));
        
        setUserRoles(roles);
        
        // Check if user has admin role
        const hasAdminRole = roles.some((role: UserRoleWithContext) => 
          role.role.roleType === 'Admin' || role.role.roleType === 'Founder'
        );
        setIsAdmin(hasAdminRole || isOwner);
        
        // Set the highest priority role for UI purposes
        const highestRole = roles.find((role: UserRoleWithContext) => role.role.roleType === 'Admin') ||
                           roles.find((role: UserRoleWithContext) => role.role.roleType === 'Manager') ||
                           roles[0];
        
        if (highestRole) {
          setUserRole(highestRole.role.roleType);
        } else if (isOwner) {
          setUserRole('Admin');
          }
        } catch (err: any) {
          console.error('Error fetching user roles:', err);
          // Don't throw here, continue with partial data
        }

        // Use Promise.allSettled to fetch multiple resources in parallel
        // Even if some fail, we still get partial data
        const [
          tasksResult,
          statusesResult,
          membersResult,
          opportunitiesResult,
          leadsResult,
          ownedStartupsResult
        ] = await Promise.allSettled([
        // Fetch tasks for this startup
          axios.get(`/api/tasks/startup/${startupId}`, {
          headers: { 'x-auth-token': token }
          }),
        
        // Fetch task statuses
          axios.get(`/api/tasks/statuses/${startupId}`, {
          headers: { 'x-auth-token': token }
          }),
        
        // Fetch startup members
          axios.get(`/api/startups/${startupId}/members`, {
          headers: { 'x-auth-token': token }
          }),
        
        // Fetch opportunities for this startup
          axios.get(`/api/opportunities/startup/${startupId}`, {
          headers: { 'x-auth-token': token }
          }),
        
        // Fetch leads for this startup
          axios.get(`/api/leads/startup/${startupId}`, {
          headers: { 'x-auth-token': token }
          }),
        
        // Fetch owned startups
          axios.get(`/api/startups/owned/${user?.id}`, {
          headers: { 'x-auth-token': token }
          })
        ]);
        
        // Handle tasks result
        if (tasksResult.status === 'fulfilled') {
          setTasks(tasksResult.value.data || []);
        } else {
          console.error('Error fetching tasks:', tasksResult.reason);
          setTasks([]);
        }
        
        // Handle statuses result
        if (statusesResult.status === 'fulfilled') {
          setStatuses(statusesResult.value.data || []);
        } else {
          console.error('Error fetching statuses:', statusesResult.reason);
          setStatuses([]);
        }
        
        // Handle members result
        if (membersResult.status === 'fulfilled') {
          setMembers(membersResult.value.data || []);
        } else {
          console.error('Error fetching members:', membersResult.reason);
          setMembers([]);
        }
        
        // Handle opportunities result
        if (opportunitiesResult.status === 'fulfilled') {
          setOpportunities(opportunitiesResult.value.data || []);
        } else {
          // Silently handle the error without logging to console
          setOpportunities([]);
        }
        
        // Handle leads result
        if (leadsResult.status === 'fulfilled') {
          setLeads(leadsResult.value.data || []);
        } else {
          // Silently handle the error without logging to console
          setLeads([]);
        }
        
        // Handle owned startups result
        if (ownedStartupsResult.status === 'fulfilled') {
          setOwnedStartups(ownedStartupsResult.value.data || []);
        } else {
          console.error('Error fetching owned startups:', ownedStartupsResult.reason);
          setOwnedStartups([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startupId, token, user]);

  // Function to check if user has a specific role in this startup
  const hasRole = (roleType: string | string[]): boolean => {
    // Startup owner has all permissions for their startup
    if (isStartupOwner && ownedStartups && ownedStartups.some(s => s.id === startupId)) {
      return true;
    }
    
    const rolesToCheck = Array.isArray(roleType) ? roleType : [roleType];
    
    // Check if user has any of the specified roles in this specific startup
    return userRoles && userRoles.some(
      roleContext => 
        roleContext.startup.id === startupId &&
        rolesToCheck.includes(roleContext.role.roleType)
    );
  };

  // Function to check if user has admin privileges
  const hasAdminPrivileges = (): boolean => {
    return isAdmin || (isStartupOwner && ownedStartups && ownedStartups.some(s => s.id === startupId));
  };

  // Function to check if a tab should be visible based on user role
  const isTabVisible = (tabId: string): boolean => {
    // Make all tabs visible to all users
      return true;
  };

  // Function to check if user can perform specific actions
  const canPerformAction = (action: string, task?: Task): boolean => {
    // Allow all actions for all users
      return true;
  };

  // Update the handlers to use permission checks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canPerformAction('create_task')) {
      setError('You do not have permission to create tasks');
      return;
    }
    
    console.log('Current task form:', taskForm);
    console.log('Available statuses:', statuses);
    
    // Get default status if not set
    const statusId = taskForm.statusId || (statuses && statuses.length > 0 ? statuses[0].id : '');
    
    // Validate required fields
    if (!taskForm.title || !statusId || !startupId) {
      setError(`Title, status and startup are required. Title: ${taskForm.title}, StatusId: ${statusId}, StartupId: ${startupId}`);
      return;
    }
    
    try {
      const payload = { 
        ...taskForm, 
        startupId,
        statusId // Use the guaranteed statusId
      };
      
      console.log('Sending task payload:', payload);
      
      const response = await axios.post('/api/tasks', 
        payload,
        { headers: { 'x-auth-token': token } }
      );
      
      // Add the new task to the tasks array
      setTasks([...tasks, response.data]);
      // Close the modal
      setShowNewTaskModal(false);
      // Reset the form
      resetTaskForm();
      // Clear any previous errors
      setError(null);
      // Show success message
      alert('Task created successfully!');
      
      // Refresh tasks to ensure we get the latest data
      const tasksResponse = await axios.get(`/api/tasks/startup/${startupId}`, {
        headers: { 'x-auth-token': token }
      });
      setTasks(tasksResponse.data);
    } catch (err: any) {
      console.error('Task creation error:', err);
      setError(err.response?.data?.msg || 'Error creating task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask) return;
    
    if (!canPerformAction('edit_task', currentTask)) {
      setError('You do not have permission to edit this task');
      return;
    }
    
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
    if (!canPerformAction('delete_task')) {
      setError('You do not have permission to delete tasks');
      return;
    }
    
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
    if (!canPerformAction('view_task_details', task)) {
      setError('You do not have permission to view this task');
      return;
    }
    setCurrentTask(task);
    setShowTaskDetailsModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    if (!canPerformAction('edit_task', task)) {
      setError('You do not have permission to edit this task');
      return;
    }
    setCurrentTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      statusId: task.statusId,
      assigneeIds: task.assignees.map(assignee => assignee.id)
    });
    setShowEditTaskModal(true);
  };

  const openNewTaskModal = () => {
    if (!canPerformAction('create_task')) {
      setError('You do not have permission to create tasks');
      return;
    }
    
    // Check for available statuses first
    if (!statuses || statuses.length === 0) {
      setError('No task statuses available. Please contact your administrator.');
      return;
    }

    console.log('Available statuses when opening modal:', statuses);

    // Initialize the form with default values including the first status
    const defaultStatus = statuses[0]?.id || '';
    console.log('Setting default status to:', defaultStatus);

    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      statusId: defaultStatus, // Ensure default status is set
      assigneeIds: []
    });
    
    setShowNewTaskModal(true);
    setError(null);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      statusId: statuses.length > 0 ? statuses[0].id : '',
      assigneeIds: []
    });
    setCurrentTask(null);
  };

  const getTasksByStatus = (statusId: string): Task[] => {
    return tasks.filter(task => 
      task.statusId === statusId && 
      !task.title.toLowerCase().includes('meeting')
    );
  };

  const getMeetingsByStatus = (statusId: string): Task[] => {
    return tasks.filter(task => task.statusId === statusId && task.title.toLowerCase().includes('meeting'));
  };

  const getPriorityClass = (priority: string): string => {
    if (!priority) {
      return 'bg-secondary';
    }
    
    switch (priority.toLowerCase()) {
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

  const handleStartTimer = async (taskId: string) => {
    try {
      if (!token) {
        setTimeTrackingError('Authentication token missing. Please log in again.');
        return;
      }
      
      // Replace fetch with axios
      const response = await axios.post(`/api/tasks/${taskId}/timer/start`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      // Update state with response data
      const updatedTask = response.data.task;
      
      // Preserve statusId in case it's missing in the response
      if (!updatedTask.statusId && tasks.find(t => t.id === taskId)?.statusId) {
        updatedTask.statusId = tasks.find(t => t.id === taskId)?.statusId;
      }
      
      // Update the task in the tasks array, preserving important fields
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.id === taskId) {
            // Merge the existing task with updated data, preserving fields that might not be in the response
            return {
              ...task,
              ...updatedTask,
              statusId: updatedTask.statusId || task.statusId
            };
          }
          return task;
        })
      );
      
      // If this is the current task, update it as well
      if (currentTask && currentTask.id === taskId) {
        setCurrentTask({
          ...currentTask,
          ...updatedTask,
          statusId: updatedTask.statusId || currentTask.statusId
        });
      }
      
      setTimeTrackingError(null);
    } catch (err) {
      console.error('Error starting timer:', err);
      setTimeTrackingError('Failed to start timer. Please try again.');
    }
  };
  
  const handlePauseTimer = async (taskId: string) => {
    try {
      if (!token) {
        setTimeTrackingError('Authentication token missing. Please log in again.');
        return;
      }
      
      // Replace fetch with axios
      const response = await axios.post(`/api/tasks/${taskId}/timer/pause`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      // Update state with response data
      const updatedTask = response.data.task;
      
      // Preserve statusId in case it's missing in the response
      if (!updatedTask.statusId && tasks.find(t => t.id === taskId)?.statusId) {
        updatedTask.statusId = tasks.find(t => t.id === taskId)?.statusId;
      }
      
      // Update the task in the local tasks list
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.id === taskId) {
            // Merge the existing task with updated data, preserving fields that might not be in the response
            return {
              ...task,
              ...updatedTask,
              statusId: updatedTask.statusId || task.statusId
            };
          }
          return task;
        })
      );
      
      // If this is the current task, update it as well
      if (currentTask && currentTask.id === taskId) {
        setCurrentTask({
          ...currentTask,
          ...updatedTask,
          statusId: updatedTask.statusId || currentTask.statusId
        });
      }
      
      setTimeTrackingError(null);
    } catch (err) {
      console.error('Error pausing timer:', err);
      setTimeTrackingError('Failed to pause timer. Please try again.');
    }
  };

  const handleStopTimer = async (note: string) => {
    if (!currentTask) {
      setTimeTrackingError('No task selected');
      return;
    }
    
    if (!token) {
      setTimeTrackingError('Authentication token missing. Please log in again.');
      return;
    }
    
    try {
      // Replace fetch with axios
      const response = await axios.post(`/api/tasks/${currentTask.id}/timer/stop`, 
        { note },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      // Update state with response data
      const updatedTask = response.data.task;
      
      // Preserve statusId in case it's missing in the response
      if (!updatedTask.statusId && tasks.find(t => t.id === currentTask.id)?.statusId) {
        updatedTask.statusId = tasks.find(t => t.id === currentTask.id)?.statusId;
      }
      
      // Update the task in the local tasks list
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.id === currentTask.id) {
            // Merge the existing task with updated data, preserving fields that might not be in the response
            return {
              ...task,
              ...updatedTask,
              statusId: updatedTask.statusId || task.statusId
            };
          }
          return task;
        })
      );
      
      // Update current task
      setCurrentTask({
        ...currentTask,
        ...updatedTask,
        statusId: updatedTask.statusId || currentTask.statusId
      });
      
      setTimeTrackingError(null);
    } catch (err) {
      console.error('Error stopping timer:', err);
      setTimeTrackingError('Failed to stop timer. Please try again.');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate inputs
      if (!opportunityForm.position || !opportunityForm.experience || !opportunityForm.description) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Ensure we have a valid startupId
      if (!startupId) {
        setError('Startup ID is missing. Please refresh the page or contact support.');
        return;
      }
      
      const response = await axios.post('/api/opportunities', 
        { ...opportunityForm, startupId },
        { headers: { 'x-auth-token': token } }
      );
      
      // Add the new opportunity to the list
      setOpportunities([...opportunities, response.data]);
      
      // Reset the form
      setOpportunityForm({
        position: '',
        experience: '',
        description: '',
        openings: 1
      });
      
      // Clear any previous errors
      setError(null);
      
      // Show success message
      alert('Opportunity created successfully!');
      
      // Switch to the opportunities tab
      setActiveTab('opportunities');
    } catch (err: any) {
      console.error('Error creating opportunity:', err);
      const errorMessage = err.response?.data?.msg || 
                          (err.message || 'Error creating opportunity');
      setError(errorMessage);
      
      // Alert the user
      alert(`Failed to create opportunity: ${errorMessage}`);
    }
  };

  const handleUpdateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOpportunity) return;
    
    try {
      const response = await axios.put(`/api/opportunities/${currentOpportunity.id}`, 
        opportunityForm,
        { headers: { 'x-auth-token': token } }
      );
      
      // Update the opportunity in the list
      setOpportunities(opportunities.map(opp => 
        opp.id === currentOpportunity.id ? response.data : opp
      ));
      
      // Close the modal
      setShowEditOpportunityModal(false);
      
      // Reset the form
      resetOpportunityForm();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error updating opportunity');
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/opportunities/${opportunityId}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove the opportunity from the list
      setOpportunities(opportunities.filter(opp => opp.id !== opportunityId));
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error deleting opportunity');
    }
  };

  const openEditOpportunityModal = (opportunity: Opportunity) => {
    setCurrentOpportunity(opportunity);
    setOpportunityForm({
      position: opportunity.position,
      experience: opportunity.experience,
      description: opportunity.description,
      openings: opportunity.openings
    });
    setShowEditOpportunityModal(true);
  };

  const resetOpportunityForm = () => {
    setOpportunityForm({
      position: '',
      experience: '',
      description: '',
      openings: 1
    });
    setCurrentOpportunity(null);
  };

  // Lead Management Functions
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`/api/leads/startup/${startupId}`, {
        headers: { 'x-auth-token': token }
      });
      setLeads(response.data || []);
    } catch (err) {
      // Silently handle the error without logging to console
      setLeads([]);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/leads', {
        ...newLeadForm,
        startupId
      }, {
        headers: { 'x-auth-token': token }
      });
      setLeads([...leads, response.data]);
      setShowNewLeadModal(false);
      setNewLeadForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'NEW',
        source: '',
        notes: '',
        salesAmount: 0,
        nextActionDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      setError('Failed to create lead');
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead) return;
    try {
      const response = await axios.patch(`/api/leads/${currentLead.id}`, {
        ...newLeadForm,
        startupId
      }, {
        headers: { 'x-auth-token': token }
      });
      setLeads(leads.map(lead => lead.id === currentLead.id ? response.data : lead));
      setShowEditLeadModal(false);
      setCurrentLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      setError('Failed to update lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await axios.delete(`/api/leads/${leadId}`, {
        headers: { 'x-auth-token': token }
      });
      setLeads(leads.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
      setError('Failed to delete lead');
    }
  };

  const openLeadDetailsModal = (lead: Lead) => {
    setCurrentLead(lead);
    setShowLeadDetailsModal(true);
  };

  const openEditLeadModal = (lead: Lead) => {
    setCurrentLead(lead);
    setNewLeadForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company || '',
      status: lead.status,
      source: lead.source,
      notes: lead.notes || '',
      salesAmount: lead.salesAmount,
      nextActionDate: lead.nextActionDate || new Date().toISOString().split('T')[0],
      assignedToId: lead.assignedToId
    });
    setShowEditLeadModal(true);
  };

  const handleAddLeadComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead || !newLeadComment.trim() || !user) return;
    try {
      console.log('Adding comment to lead:', currentLead.id);
      console.log('Comment content:', newLeadComment);
      
      const response = await axios.post(`/api/leads/${currentLead.id}/comments`, {
        content: newLeadComment,
        userId: user.id
      }, {
        headers: { 'x-auth-token': token }
      });
      
      console.log('Comment added successfully:', response.data);
      
      // Update the current lead with the new comment
      const updatedLead = {
        ...currentLead,
        comments: [...(currentLead.comments || []), response.data]
      };
      setCurrentLead(updatedLead);
      
      // Also update the lead in the leads array
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === currentLead.id ? updatedLead : lead
        )
      );
      
      // Clear the comment input
      setNewLeadComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      // Show a more user-friendly error message
      if (error?.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setError(`Failed to add comment: ${error.response.data?.error || 'Server error'}`);
      } else if (error?.request) {
        console.error('No response received');
        setError('Failed to add comment: No response from server');
      } else {
        console.error('Error message:', error?.message);
        setError(`Failed to add comment: ${error?.message || 'Unknown error occurred'}`);
      }
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const response = await axios.patch(`/api/leads/${leadId}`, {
        status: newStatus
      }, {
        headers: { 'x-auth-token': token }
      });
      setLeads(leads.map(lead => lead.id === leadId ? response.data : lead));
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      setError('Failed to update lead status');
    }
  };

  // Update the handleCreateMeeting function
  const handleCreateMeeting = async () => {
    try {
      if (!taskForm.startTime || !taskForm.endTime) {
        setError('Please select both start and end time');
        return;
      }

      // Check if start time is before end time
      const startDateTime = new Date(`${taskForm.dueDate}T${taskForm.startTime}`);
      const endDateTime = new Date(`${taskForm.dueDate}T${taskForm.endTime}`);
      
      if (startDateTime >= endDateTime) {
        setError('End time must be after start time');
        return;
      }

      // Get existing meetings for the selected date
      const existingMeetings = tasks.filter(task => 
        task.title.startsWith('Meeting:') && 
        task.dueDate?.split('T')[0] === taskForm.dueDate
      );

      // Check for time conflicts
      if (checkMeetingTimeConflict(taskForm.startTime, taskForm.endTime, taskForm.dueDate, existingMeetings)) {
        setError('There is already a meeting scheduled during this time slot');
        return;
      }

      const combinedDateTime = `${taskForm.dueDate}T${taskForm.startTime}:00`;
      const endDateTimeStr = `${taskForm.dueDate}T${taskForm.endTime}:00`;
      
      const response = await axios.post('/api/tasks', {
        ...taskForm,
        title: `Meeting: ${taskForm.title}`,
        description: `${taskForm.description}\n\nMeeting Time: ${taskForm.startTime} - ${taskForm.endTime}\nMeeting Link: ${meetingLink}`,
        dueDate: combinedDateTime,
        endDate: endDateTimeStr,
        startTime: taskForm.startTime,
        endTime: taskForm.endTime,
        priority: 'medium',
        startupId
      }, {
        headers: { 'x-auth-token': token }
      });

      // Add the new task to the tasks array
      setTasks([...tasks, response.data]);
      
      // Reset the forms
      resetTaskForm();
      setMeetingLink('');
      setActiveTab('calendar');
      
      // Show success message
      setError(null);
      alert('Meeting scheduled successfully!');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error creating meeting');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div className="tasks-container">
          <div className="row">
            {statuses.map(status => (
                <div key={status.id} className="col-md-4">
                  <div className="card h-100">
                    <div className="card-header bg-primary text-white p-2 text-center">
                      <h5 className="mb-0 fw-bold">{status.name}</h5>
                  </div>
                    <div 
                      className="card-body p-1"
                      style={{ 
                        minHeight: 'calc(100vh - 300px)',
                        maxHeight: 'calc(100vh - 300px)',
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
                          onClick={(e) => {
                            e.preventDefault();
                            openTaskDetails(task);
                          }}
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
                  <label htmlFor="assignees" className="form-label">Assignees (Optional)</label>
                  <select
                    className="form-select"
                    id="assignees"
                    multiple
                    value={taskForm.assigneeIds}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setTaskForm({...taskForm, assigneeIds: selectedOptions});
                    }}
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
                              // Filter out meetings from the task counts
                              const tasksInStatus = getTasksByStatus(status.id);
                              const totalRegularTasks = tasks.filter(task => !task.title.startsWith('Meeting:')).length;
                              const count = tasksInStatus.length;
                              const percentage = totalRegularTasks > 0 
                                ? Math.round((count / totalRegularTasks) * 100) 
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
                          // Filter out meetings when counting tasks by priority
                          const regularTasks = tasks.filter(task => !task.title.startsWith('Meeting:'));
                          const countByPriority = priorities.map(priority => {
                            return regularTasks.filter(task => task.priority === priority).length;
                          });
                          
        return (
                            <div className="d-flex flex-column h-100">
                              <div className="d-flex justify-content-between mb-2">
                                <div className="small text-muted">Priority</div>
                                <div className="small text-muted">Tasks</div>
                              </div>
                              {priorities.map((priority, index) => {
                                const count = countByPriority[index];
                                const percentage = regularTasks.length > 0 
                                  ? Math.round((count / regularTasks.length) * 100) 
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
                            
                            // Filter out meetings when showing tasks due this week
                            const tasksThisWeek = tasks.filter(task => {
                              if (!task.dueDate || task.title.startsWith('Meeting:')) return false;
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
                              <h2 className="mt-2 mb-0">{tasks.filter(task => !task.title.startsWith('Meeting:')).length}</h2>
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
                                const completedCount = tasks.filter(t => 
                                  doneStatusIds.includes(t.statusId) && !t.title.startsWith('Meeting:')
                                ).length;
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
                                const inProgressCount = tasks.filter(t => 
                                  inProgressStatusIds.includes(t.statusId) && !t.title.startsWith('Meeting:')
                                ).length;
                                return <h2 className="mt-2 mb-0">{inProgressCount}</h2>;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-3">
                          <div className="card bg-danger text-white">
                            <div className="card-body py-3">
                              <h6 className="mb-0">High Priority</h6>
                              <h2 className="mt-2 mb-0">{tasks.filter(t => t.priority === 'high' && !t.title.startsWith('Meeting:')).length}</h2>
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
          <div className="meetings-container">
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
                                  <button 
                                    className="btn btn-sm btn-outline-primary me-1"
                                    onClick={(e) => {
                                      e.preventDefault(); 
                                      e.stopPropagation();
                                      openTaskDetails(meeting);
                                    }}
                                  >
                                    <i className="bi bi-eye"></i>
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
          </div>
        );
      case 'calendar':
        return (
          <div className="calendar-container">
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
                      <div className="upcoming-meetings">
                        {tasks
                          .filter(task => 
                            task.dueDate && 
                            task.dueDate !== null &&
                            new Date(task.dueDate) >= new Date() && 
                            task.title.startsWith('Meeting:')
                          )
                          .sort((a, b) => {
                            if (!a.dueDate || !b.dueDate) return 0;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                          })
                          .map(meeting => {
                            const meetingLink = meeting.description?.match(/Meeting Link: (https?:\/\/[^\s]+)/)?.[1] || null;
                            return (
                              <div 
                                key={meeting.id} 
                                className="meeting-item p-2 mb-2 border rounded d-flex justify-content-between align-items-center"
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  openTaskDetails(meeting);
                                }}
                              >
                                <div>
                                  <span className="d-block">{meeting.title.replace('Meeting: ', '')}</span>
                                  {meeting.startTime && meeting.endTime && (
                                    <small className="text-muted">
                                      {meeting.startTime} - {meeting.endTime}
                                    </small>
                                  )}
                                </div>
                                {meetingLink && (
                                  <a 
                                    href={meetingLink} 
                                    className="btn btn-sm btn-success"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <i className="bi bi-camera-video"></i>
                                  </a>
                                )}
                              </div>
                            );
                          })
                        }
                        {tasks.filter(task => 
                          task.dueDate && 
                          task.dueDate !== null &&
                          new Date(task.dueDate) >= new Date() && 
                          task.title.startsWith('Meeting:')
                        ).length === 0 && (
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

                          <div className="row mb-3">
                            <div className="col-md-4">
                              <label htmlFor="meetingDate" className="form-label">Date*</label>
                              <input
                                type="date"
                                className="form-control"
                                id="meetingDate"
                                value={taskForm.dueDate}
                                onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-4">
                              <label htmlFor="startTime" className="form-label">Start Time*</label>
                              <input
                                type="time"
                                className="form-control"
                                id="startTime"
                                value={taskForm.startTime || ''}
                                onChange={(e) => setTaskForm({...taskForm, startTime: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-4">
                              <label htmlFor="endTime" className="form-label">End Time*</label>
                              <input
                                type="time"
                                className="form-control"
                                id="endTime"
                                value={taskForm.endTime || ''}
                                onChange={(e) => setTaskForm({...taskForm, endTime: e.target.value})}
                                required
                              />
                            </div>
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
                            <label htmlFor="assignees" className="form-label">Attendees*</label>
                            <select
                              multiple
                              className="form-select"
                              id="assignees"
                              value={taskForm.assigneeIds}
                              onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setTaskForm({...taskForm, assigneeIds: selectedOptions});
                              }}
                              required
                            >
                              {members.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <small className="text-muted">
                              Hold Ctrl (Windows) or Command (Mac) to select multiple attendees
                            </small>
                          </div>

                          <button type="submit" className="btn btn-primary w-100">
                            Schedule Meeting
                          </button>
                        </form>
                      </div>
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
          <div className="analytics-container">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Task Analytics</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h5>Task Completion Rate</h5>
                    {(() => {
                      // Calculate completion rate
                      const doneStatusIds = statuses
                        .filter(s => s.name.toLowerCase() === 'done' || s.name.toLowerCase() === 'completed')
                        .map(s => s.id);
                      const totalTasks = tasks.length;
                      const completedTasks = tasks.filter(t => doneStatusIds.includes(t.statusId)).length;
                      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                      
                      return (
                        <div className="progress mb-3">
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${completionRate}%` }}
                          >
                            {completionRate}%
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="col-md-6">
                    <h5>Tasks by Status</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statuses.map(status => (
                            <tr key={status.id}>
                              <td>{status.name}</td>
                              <td>{tasks.filter(task => task.statusId === status.id).length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'opportunities':
        return (
          <div className="opportunities-container">
            <div className="card">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Opportunities</h4>
            </div>
            <div className="card-body">
                {opportunities.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Experience</th>
                          <th>Openings</th>
                          <th>Posted On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opportunities.map(opp => (
                          <tr key={opp.id}>
                            <td>
                              <div className="fw-bold">{opp.position}</div>
                              <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>
                                {opp.description.substring(0, 60)}
                                {opp.description.length > 60 ? '...' : ''}
                              </small>
                            </td>
                            <td>{opp.experience}</td>
                            <td>{opp.openings}</td>
                            <td>{new Date(opp.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-primary me-1"
                                onClick={() => openEditOpportunityModal(opp)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteOpportunity(opp.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="mb-3 text-muted">No opportunities posted yet.</p>
                  </div>
                )}
              </div>
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
              <form onSubmit={handleCreateOpportunity}>
                <div className="mb-3">
                  <label htmlFor="position" className="form-label">Position Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="position"
                    value={opportunityForm.position}
                    onChange={e => setOpportunityForm({...opportunityForm, position: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="experience" className="form-label">Experience Required *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="experience"
                    placeholder="e.g. 2-3 years, Entry Level, etc."
                    value={opportunityForm.experience}
                    onChange={e => setOpportunityForm({...opportunityForm, experience: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Job Description *</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows={6}
                    value={opportunityForm.description}
                    onChange={e => setOpportunityForm({...opportunityForm, description: e.target.value})}
                    required
                  ></textarea>
                  <small className="text-muted">
                    Include details about responsibilities, qualifications, and any other relevant information.
                  </small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="openings" className="form-label">Number of Openings *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="openings"
                    min="1"
                    value={opportunityForm.openings}
                    onChange={e => setOpportunityForm({...opportunityForm, openings: parseInt(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="text-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary me-2"
                    onClick={() => setActiveTab('opportunities')}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Create Opportunity</button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="calendar-container">
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

                          <div className="row mb-3">
                            <div className="col-md-4">
                              <label htmlFor="meetingDate" className="form-label">Date*</label>
                              <input
                                type="date"
                                className="form-control"
                                id="meetingDate"
                                value={taskForm.dueDate}
                                onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-4">
                              <label htmlFor="startTime" className="form-label">Start Time*</label>
                              <input
                                type="time"
                                className="form-control"
                                id="startTime"
                                value={taskForm.startTime || ''}
                                onChange={(e) => setTaskForm({...taskForm, startTime: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-4">
                              <label htmlFor="endTime" className="form-label">End Time*</label>
                              <input
                                type="time"
                                className="form-control"
                                id="endTime"
                                value={taskForm.endTime || ''}
                                onChange={(e) => setTaskForm({...taskForm, endTime: e.target.value})}
                                required
                              />
                            </div>
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
                            <label htmlFor="assignees" className="form-label">Attendees*</label>
                            <select
                              multiple
                              className="form-select"
                              id="assignees"
                              value={taskForm.assigneeIds}
                              onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setTaskForm({...taskForm, assigneeIds: selectedOptions});
                              }}
                              required
                            >
                              {members.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <small className="text-muted">
                              Hold Ctrl (Windows) or Command (Mac) to select multiple attendees
                            </small>
                          </div>

                          <button type="submit" className="btn btn-primary w-100">
                            Schedule Meeting
                          </button>
                        </form>
                      </div>
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
      case 'leads':
        return (
          <div className="leads-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>Leads Management</h4>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewLeadModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>Add New Lead
              </button>
            </div>

            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : leads.length === 0 ? (
              <div className="alert alert-info">No leads found</div>
            ) : (
              <>
                <div className="filters mb-3">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Filter by Status</label>
                        <select 
                          className="form-select"
                          onChange={(e) => {
                            const value = e.target.value;
                            setLeadFilters(prev => ({...prev, status: value ? value : undefined}));
                          }}
                        >
                          <option value="">All Statuses</option>
                          <option value="NEW">New</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="QUALIFIED">Qualified</option>
                          <option value="PROPOSAL">Proposal</option>
                          <option value="NEGOTIATION">Negotiation</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Filter by Assignee</label>
                        <select 
                          className="form-select"
                          onChange={(e) => {
                            const value = e.target.value;
                            setLeadFilters(prev => ({...prev, assignedToId: value ? value : undefined}));
                          }}
                        >
                          <option value="">All Assignees</option>
                          <option value="unassigned">Unassigned</option>
                          {members.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Search</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name, email, phone..."
                          onChange={(e) => {
                            const value = e.target.value;
                            setLeadFilters(prev => ({...prev, search: value ? value : undefined}));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Source</th>
                        <th>Sales Amount</th>
                        <th>Next Action</th>
                        <th>Assigned To</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => (
                        <tr key={lead.id}>
                          <td>{lead.name}</td>
                          <td>{lead.email}</td>
                          <td>{lead.phone}</td>
                          <td>
                            <span className={`badge ${getStatusColor(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td>{lead.source}</td>
                          <td>${lead.salesAmount.toLocaleString()}</td>
                          <td>
                            {lead.nextActionDate ? (
                              new Date(lead.nextActionDate).toLocaleDateString()
                            ) : (
                              'Not set'
                            )}
                          </td>
                          <td>
                            {lead.assignedTo?.name || 
                              (lead.assignedToId ? 
                                (members.find(m => m.id === lead.assignedToId)?.name || 'Unassigned') 
                                : 'Unassigned')
                            }
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openLeadDetailsModal(lead)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => openEditLeadModal(lead)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteLead(lead.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      case 'leadsAnalytics':
        return (
          <div className="leads-analytics-container">
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Leads Analytics Dashboard</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Key Metrics */}
                  <div className="col-md-3 mb-3">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6 className="text-muted mb-2">Total Leads</h6>
                        <h3 className="mb-0">{leads.length}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6 className="text-muted mb-2">Potential Revenue</h6>
                        <h3 className="mb-0">${leads.reduce((sum, lead) => sum + lead.salesAmount, 0).toLocaleString()}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6 className="text-muted mb-2">Conversion Rate</h6>
                        <h3 className="mb-0">
                          {leads.length > 0 
                            ? `${Math.round((leads.filter(lead => lead.status === 'CLOSED').length / leads.length) * 100)}%` 
                            : '0%'}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6 className="text-muted mb-2">Avg. Deal Size</h6>
                        <h3 className="mb-0">
                          ${leads.length > 0 
                            ? Math.round(leads.reduce((sum, lead) => sum + lead.salesAmount, 0) / leads.length).toLocaleString() 
                            : '0'}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Distribution */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5>Lead Status Distribution</h5>
                    <div className="chart-container" style={{ height: '250px', marginTop: '20px' }}>
                      {(() => {
                        const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'];
                        return (
                          <div className="d-flex flex-column h-100">
                            {statuses.map(status => {
                              const count = leads.filter(lead => lead.status === status).length;
                              const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                              return (
                                <div key={status} className="d-flex align-items-center mb-3">
                                  <div style={{ width: '120px' }} className="me-2">
                                    <span className={`badge ${getStatusColor(status as Lead['status'])}`}>{status}</span>
                                  </div>
                                  <div className="progress flex-grow-1" style={{ height: '20px' }}>
                                    <div 
                                      className={`progress-bar ${getStatusColor(status as Lead['status'])}`} 
                                      role="progressbar" 
                                      style={{ width: `${percentage}%` }} 
                                      aria-valuenow={percentage} 
                                      aria-valuemin={0} 
                                      aria-valuemax={100}
                                    >
                                      {percentage}%
                                    </div>
                                  </div>
                                  <div style={{ width: '50px' }} className="ms-2 text-end">
                                    {count}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h5>Sales Pipeline Value</h5>
                    <div className="chart-container" style={{ height: '250px', marginTop: '20px' }}>
                      {(() => {
                        const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'];
                        const totalValue = leads.reduce((sum, lead) => sum + lead.salesAmount, 0);
                        return (
                          <div className="d-flex flex-column h-100">
                            {statuses.map(status => {
                              const value = leads
                                .filter(lead => lead.status === status)
                                .reduce((sum, lead) => sum + lead.salesAmount, 0);
                              const percentage = totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
                              return (
                                <div key={status} className="d-flex align-items-center mb-3">
                                  <div style={{ width: '120px' }} className="me-2">
                                    <span className={`badge ${getStatusColor(status as Lead['status'])}`}>{status}</span>
                                  </div>
                                  <div className="progress flex-grow-1" style={{ height: '20px' }}>
                                    <div 
                                      className={`progress-bar ${getStatusColor(status as Lead['status'])}`} 
                                      role="progressbar" 
                                      style={{ width: `${percentage}%` }} 
                                      aria-valuenow={percentage} 
                                      aria-valuemin={0} 
                                      aria-valuemax={100}
                                    >
                                      {percentage}%
                                    </div>
                                  </div>
                                  <div style={{ width: '100px' }} className="ms-2 text-end">
                                    ${value.toLocaleString()}
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
                
                {/* Recent Activity */}
                <div className="row">
                  <div className="col-md-6">
                    <h5>Recent Lead Activity</h5>
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Lead</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                            .slice(0, 10)
                            .map(lead => (
                              <tr key={lead.id}>
                                <td>
                                  <span className="fw-bold">{lead.name}</span><br/>
                                  <small className="text-muted">{lead.email}</small>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusColor(lead.status)}`}>{lead.status}</span>
                                </td>
                                <td>
                                  <span>{new Date(lead.updatedAt).toLocaleDateString()}</span><br/>
                                  <small className="text-muted">
                                    {new Date(lead.updatedAt).toLocaleTimeString()}
                                  </small>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h5>Top Leads by Value</h5>
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Lead</th>
                            <th>Status</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads
                            .sort((a, b) => b.salesAmount - a.salesAmount)
                            .slice(0, 10)
                            .map(lead => (
                              <tr key={lead.id}>
                                <td>
                                  <span className="fw-bold">{lead.name}</span><br/>
                                  <small className="text-muted">{lead.company || 'N/A'}</small>
                                </td>
                                <td>
                                  <span className={`badge ${getStatusColor(lead.status)}`}>{lead.status}</span>
                                </td>
                                <td className="text-end">
                                  <span className="fw-bold">${lead.salesAmount.toLocaleString()}</span>
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
          </div>
        );
      case 'affiliateAnalytics':
        return startupId ? (
          <div className="affiliate-analytics-container">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Affiliate Analytics Dashboard</h4>
              </div>
              <div className="card-body">
                <AffiliateAnalytics startupId={startupId} />
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            No startup selected
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Filter by status
      if (leadFilters.status && lead.status !== leadFilters.status) {
        return false;
      }
      
      // Filter by assignee
      if (leadFilters.assignedToId) {
        if (leadFilters.assignedToId === 'unassigned' && lead.assignedToId) {
          return false;
        } else if (leadFilters.assignedToId !== 'unassigned' && lead.assignedToId !== leadFilters.assignedToId) {
          return false;
        }
      }
      
      // Filter by search term
      if (leadFilters.search) {
        const searchTerm = leadFilters.search.toLowerCase();
        return (
          lead.name.toLowerCase().includes(searchTerm) ||
          lead.email.toLowerCase().includes(searchTerm) ||
          lead.phone.toLowerCase().includes(searchTerm) ||
          (lead.company && lead.company.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
  }, [leads, leadFilters]);

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

  // Sidebar tabs configuration
  const sidebarTabs: SidebarTab[] = [
    { id: 'tasks', icon: 'list-task', label: 'Tasks' },
    { id: 'addTask', icon: 'plus-circle', label: 'Add Tasks' },
    { id: 'taskAnalytics', icon: 'graph-up', label: 'Task Analytics' },
    { id: 'meetings', icon: 'people', label: 'Meetings' },
    { id: 'opportunities', icon: 'lightning', label: 'Opportunities' },
    { id: 'createOpportunities', icon: 'plus-lg', label: 'Create Opportunities' },
    { id: 'calendar', icon: 'calendar', label: 'Calendar' },
    { id: 'editProject', icon: 'pencil', label: 'Edit Project' },
    { id: 'leads', icon: 'chat-dots', label: 'Leads' },
    { id: 'leadsAnalytics', icon: 'graph-up', label: 'Leads Analytics' },
    { id: 'affiliateAnalytics', icon: 'bar-chart', label: 'Affiliate Analytics' }
  ];

  // Define default tabs based on role
  const defaultTabs = ['tasks', 'meetings', 'calendar'];

  return (
    <div className="container-fluid p-0">
      <div className="d-flex">
        {/* Sidebar */}
        <div className={`bg-dark text-white dashboard-sidebar position-fixed top-0 pt-2 ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ 
               width: sidebarCollapsed ? '60px' : '250px', 
          height: '100vh',
          overflowY: 'auto',
          marginTop: '56px', // Add margin-top to match navbar height
               transition: 'width 0.3s ease'
             }}>
          <div className="d-flex justify-content-between align-items-center p-3">
            {!sidebarCollapsed && <h5 className="mb-0">Dashboard</h5>}
            <button className="btn btn-sm btn-outline-light" onClick={toggleSidebar}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          <hr className="my-2" />
          <ul className="nav flex-column">
            {sidebarTabs.map(tab => (
              <li className="nav-item" key={tab.id}>
              <a 
                  className={`nav-link ${activeTab === tab.id ? 'active bg-primary' : ''}`} 
                href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
              >
                  <i className={`bi bi-${tab.icon} me-2`}></i>
                  {!sidebarCollapsed && tab.label}
              </a>
            </li>
            ))}
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
                  <p>{formatDate(currentTask.createdAt)}</p>
                </div>
                
                {/* Time Tracking Section */}
                <hr />
                <div className="mb-3">
                  {timeTrackingError && (
                    <div className="alert alert-danger">{timeTrackingError}</div>
                  )}
                  <TimeTracker 
                    task={currentTask} 
                    onTimerStart={() => {
                      // Use an anonymous function to trap the event
                      handleStartTimer(currentTask.id);
                      return false; // Ensure no default behavior
                    }} 
                    onTimerPause={() => {
                      // Use an anonymous function to trap the event
                      handlePauseTimer(currentTask.id);
                      return false; // Ensure no default behavior
                    }}
                    onTimerStop={(note) => {
                      // Use an anonymous function to trap the event
                      handleStopTimer(note);
                      return false; // Ensure no default behavior
                    }}
                  />
                  <TimeLogs task={currentTask} />
                </div>
              </div>
              <div className="modal-footer">
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
                    <label htmlFor="edit-assignees" className="form-label">Assignees (Optional)</label>
                    <select
                      className="form-select"
                      id="edit-assignees"
                      multiple
                      value={taskForm.assigneeIds}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setTaskForm({...taskForm, assigneeIds: selectedOptions});
                      }}
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

      {/* Edit Opportunity Modal */}
      {showEditOpportunityModal && currentOpportunity && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Opportunity</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditOpportunityModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateOpportunity}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-position" className="form-label">Position Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="edit-position"
                      value={opportunityForm.position}
                      onChange={(e) => setOpportunityForm({...opportunityForm, position: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="edit-experience" className="form-label">Experience Required *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="edit-experience"
                      value={opportunityForm.experience}
                      onChange={(e) => setOpportunityForm({...opportunityForm, experience: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="edit-description" className="form-label">Job Description *</label>
                    <textarea
                      className="form-control"
                      id="edit-description"
                      rows={6}
                      value={opportunityForm.description}
                      onChange={(e) => setOpportunityForm({...opportunityForm, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="edit-openings" className="form-label">Number of Openings *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="edit-openings"
                      min="1"
                      value={opportunityForm.openings}
                      onChange={(e) => setOpportunityForm({...opportunityForm, openings: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-danger me-auto" onClick={() => {
                    setShowEditOpportunityModal(false);
                    handleDeleteOpportunity(currentOpportunity.id);
                  }}>
                    Delete
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditOpportunityModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowNewTaskModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="new-title" className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="new-title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="new-description"
                      rows={3}
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-priority" className="form-label">Priority *</label>
                    <select
                      className="form-select"
                      id="new-priority"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-dueDate" className="form-label">Due Date (Optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      id="new-dueDate"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-status" className="form-label">Status *</label>
                    <select
                      className="form-select"
                      id="new-status"
                      value={taskForm.statusId || (statuses && statuses.length > 0 ? statuses[0].id : '')}
                      onChange={(e) => setTaskForm({...taskForm, statusId: e.target.value})}
                      required
                    >
                      {statuses && statuses.length > 0 ? (
                        statuses.map(status => (
                          <option key={status.id} value={status.id}>{status.name}</option>
                        ))
                      ) : (
                        <option value="">No statuses available</option>
                      )}
                    </select>
                    {(!taskForm.statusId && statuses && statuses.length > 0) && (
                      <div className="form-text text-warning">
                        Select a status to continue. Using default: {statuses[0].name}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-assignees" className="form-label">Assignees (Optional)</label>
                    <select
                      className="form-select"
                      id="new-assignees"
                      multiple
                      value={taskForm.assigneeIds}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setTaskForm({...taskForm, assigneeIds: selectedOptions});
                      }}
                    >
                      {members && members.length > 0 ? (
                        members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No members available</option>
                      )}
                    </select>
                    <small className="form-text text-muted">Hold Ctrl (Windows) or Command (Mac) to select multiple assignees</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Modals */}
      {showNewLeadModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Lead</h5>
                <button type="button" className="btn-close" onClick={() => setShowNewLeadModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateLead}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLeadForm.name}
                        onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newLeadForm.email}
                        onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newLeadForm.phone}
                        onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Company</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLeadForm.company}
                        onChange={e => setNewLeadForm({...newLeadForm, company: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status *</label>
                      <select
                        className="form-select"
                        value={newLeadForm.status}
                        onChange={e => setNewLeadForm({...newLeadForm, status: e.target.value as Lead['status']})}
                        required
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Source *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLeadForm.source}
                        onChange={e => setNewLeadForm({...newLeadForm, source: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sales Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newLeadForm.salesAmount}
                        onChange={e => setNewLeadForm({...newLeadForm, salesAmount: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Next Action Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newLeadForm.nextActionDate}
                        onChange={e => setNewLeadForm({...newLeadForm, nextActionDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Assigned To</label>
                    <select
                      className="form-select"
                      value={newLeadForm.assignedToId}
                      onChange={e => setNewLeadForm({...newLeadForm, assignedToId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      value={newLeadForm.notes}
                      onChange={e => setNewLeadForm({...newLeadForm, notes: e.target.value})}
                      rows={3}
                    ></textarea>
                  </div>

                  <div className="text-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={() => setShowNewLeadModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Lead
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditLeadModal && currentLead && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Lead</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditLeadModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateLead}>
                  {/* Same form fields as New Lead Modal */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLeadForm.name}
                        onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newLeadForm.email}
                        onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newLeadForm.phone}
                        onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Company</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLeadForm.company}
                        onChange={e => setNewLeadForm({...newLeadForm, company: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status *</label>
                      <select
                        className="form-select"
                        value={newLeadForm.status}
                        onChange={e => setNewLeadForm({...newLeadForm, status: e.target.value as Lead['status']})}
                        required
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Source *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLeadForm.source}
                        onChange={e => setNewLeadForm({...newLeadForm, source: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sales Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newLeadForm.salesAmount}
                        onChange={e => setNewLeadForm({...newLeadForm, salesAmount: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Next Action Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newLeadForm.nextActionDate}
                        onChange={e => setNewLeadForm({...newLeadForm, nextActionDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Assigned To</label>
                    <select
                      className="form-select"
                      value={newLeadForm.assignedToId}
                      onChange={e => setNewLeadForm({...newLeadForm, assignedToId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      value={newLeadForm.notes}
                      onChange={e => setNewLeadForm({...newLeadForm, notes: e.target.value})}
                      rows={3}
                    ></textarea>
                  </div>

                  <div className="text-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={() => setShowEditLeadModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update Lead
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeadDetailsModal && currentLead && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Lead Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowLeadDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Basic Information</h6>
                    <p><strong>Name:</strong> {currentLead.name}</p>
                    <p><strong>Email:</strong> {currentLead.email}</p>
                    <p><strong>Phone:</strong> {currentLead.phone}</p>
                    <p><strong>Company:</strong> {currentLead.company || 'N/A'}</p>
                    <p><strong>Status:</strong> <span className={`badge ${getStatusColor(currentLead.status)}`}>{currentLead.status}</span></p>
                    <p><strong>Source:</strong> {currentLead.source}</p>
                    <p><strong>Sales Amount:</strong> ${currentLead.salesAmount.toLocaleString()}</p>
                    <p><strong>Next Action Date:</strong> {currentLead.nextActionDate ? new Date(currentLead.nextActionDate).toLocaleDateString() : 'Not set'}</p>
                    <p><strong>Created:</strong> {formatDate(currentLead.createdAt)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(currentLead.updatedAt)}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Notes</h6>
                    <p>{currentLead.notes || 'No notes available'}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h6>Quick Actions</h6>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        setShowLeadDetailsModal(false);
                        openEditLeadModal(currentLead);
                      }}
                    >
                      Edit Lead
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this lead?')) {
                          handleDeleteLead(currentLead.id);
                          setShowLeadDetailsModal(false);
                        }
                      }}
                    >
                      Delete Lead
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagementPage;