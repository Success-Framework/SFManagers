import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import moment, { Moment } from 'moment';
import axios from 'axios';
import { FaChartLine, FaClipboardList, FaPlus, FaChartBar, 
         FaUserFriends, FaUser, FaComments, FaDiscourse,
         FaHandshake, FaTimes, FaFileUpload, FaFileAlt, FaFolder, FaReply } from 'react-icons/fa';
import Select from 'react-select';
import { format } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import ChatPage from '../chat/ChatPage';
import TimeTrackingModal from './TimeTrackingModal';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Add auth token helper
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Add axios config creator
const getAuthConfig = () => {
  return {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  };
};

interface TaskStatus {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  assignees: User[];
  creator: User;
  priority: 'low' | 'medium' | 'high';
  isFreelance: boolean;
  estimatedHours?: number;
  hourlyRate?: number;
  urgencyLevel?: string;
  startTime?: string;
  endTime?: string;
  totalTimeSpent?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
  role: string;
}

interface Lead {
    id: string;
    name: string;
    email: string;
  phone: string;
  status: string;
  source: string;
  notes: string;
  salesAmount: number;
  nextActionDate: string;
  assignedTo: User;
}

interface TaskManagementPageProps {
  initialTab?: string;
}

interface AffiliateLink {
  id: string;
  name?: string;
  code: string;
  startupId: string;
  userId: string;
  clicks: number;
  conversions: number;
  country?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChartData {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

interface Document {
  id: string;
  name: string;
  description: string | null;
  filePath: string;
  fileType: string;
  fileSize: number;
  startupId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}



const localizer = momentLocalizer(moment);

interface Meeting {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  assignees: User[];
  meetingLink?: string;
}

interface AffiliateClick {
  id: string;
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  converted?: boolean;
  createdAt: string;
}

const TaskManagementPage: React.FC<TaskManagementPageProps> = ({ initialTab = 'tasks' }) => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'kanban' | 'gantt'>('kanban');
  const [activePage, setActivePage] = useState<string>('tasks-board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const [token] = useState(getAuthToken());
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingAssignees, setMeetingAssignees] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    meetingLink: ''
  });
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [startupMembers, setStartupMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    file: null as File | null
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTimeTrackingModal, setShowTimeTrackingModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Add these state variables at the component level (with the other useState declarations)
  const [affiliateLinksData, setAffiliateLinksData] = useState<AffiliateLink[]>([]);
  const [clicksData, setClicksData] = useState<AffiliateClick[]>([]);
  const [isAffiliateLoading, setIsAffiliateLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [affiliateError, setAffiliateError] = useState<string | null>(null);

  // Add retry count state
  const [retryCount, setRetryCount] = useState(0);

  // Reset retry count when component mounts or startup ID changes
  useEffect(() => {
    setRetryCount(0);
  }, [startupId]);

  // Add this useEffect at the component level (with the other useEffect declarations)
  useEffect(() => {
    if (activePage === 'affiliate-analytics') {
      fetchAffiliateData();
    }
  }, [startupId, timeRange, activePage]);

  // Add this function at the component level (outside of renderAffiliateAnalytics)
  const fetchAffiliateData = async () => {
    setIsAffiliateLoading(true);
    setAffiliateError(null);
    
    try {
      if (!startupId) {
        throw new Error('No startup ID provided');
      }

      const token = getAuthToken();
      console.log('Debug - Auth Check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        startupId
      });

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // First check if we're a member of the startup
      try {
        const membershipResponse = await axios.get(`/api/startups/${startupId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Debug - Membership Check:', {
          isMember: true,
          members: membershipResponse.data
        });
      } catch (membershipError: any) {
        console.error('Debug - Membership Error:', membershipError.response?.data);
        throw new Error('Failed to verify startup membership');
      }
      
      // Fix the API endpoint to match the server route
      const linksResponse = await axios.get(`/api/affiliate/startups/${startupId}/affiliate-links`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!linksResponse.data) {
        throw new Error('No affiliate links data received');
      }
      
      setAffiliateLinksData(linksResponse.data);
      
      // Fix the clicks endpoint as well
      const clicksResponse = await axios.get(`/api/affiliate-clicks/startup/${startupId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!clicksResponse.data) {
        throw new Error('No clicks data received');
      }
      
      setClicksData(clicksResponse.data);
      
    } catch (error: any) {
      console.error('Error fetching affiliate data:', error);
      if (error.response?.status === 403) {
        setAffiliateError('You do not have permission to view affiliate data for this startup. Please ensure you are a member of the startup.');
      } else if (error.response?.status === 401) {
        setAffiliateError('Your session has expired. Please log in again.');
      } else {
        setAffiliateError(error.response?.data?.message || 'Failed to load affiliate data. Please try again.');
      }
    } finally {
      setIsAffiliateLoading(false);
    }
  };

  // Add useEffect to fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!startupId) return;
      
      try {
        const response = await axios.get(`/api/documents?startupId=${startupId}`, getAuthConfig());
        setDocuments(response.data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
      }
    };

    fetchDocuments();
  }, [startupId]);

  // Update the useEffect that fetches statuses
  useEffect(() => {
    const fetchData = async () => {
      if (!startupId) {
        console.warn('No startupId provided, skipping data fetch');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch task statuses - this will automatically initialize default statuses
        const statusesResponse = await axios.get(
          `/api/tasks/statuses/${startupId}`,
          getAuthConfig()
        );
        console.log('Fetched statuses:', statusesResponse.data);
        setStatuses(statusesResponse.data);

        // Fetch tasks
        const tasksResponse = await axios.get(
          `/api/tasks/startup/${startupId}`,
          getAuthConfig()
        );
        console.log('Fetched tasks:', tasksResponse.data);
        setTasks(tasksResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
                            } else {
          const errorMessage = axios.isAxiosError(err) 
            ? err.response?.data?.message || 'Error fetching tasks. Please try again.'
            : 'Error fetching tasks. Please try again.';
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startupId]);

  // Add debug logging for state updates
  useEffect(() => {
    console.log('Current tasks state:', tasks);
    console.log('Current statuses state:', statuses);
  }, [tasks, statuses]);

  // Update task status with auth
  const updateTaskStatus = async (taskId: string, newStatusId: string) => {
    try {
      console.log(`Updating task ${taskId} to status ${newStatusId}`);
      await axios.patch(
        `/api/tasks/${taskId}/status`,
        { statusId: newStatusId },
        getAuthConfig()
      );
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: statuses.find(s => s.id === newStatusId)! }
            : task
        )
      );
    } catch (err) {
      console.error('Error updating task status:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        // Optionally redirect to login page or trigger re-authentication
    } else {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || 'Error updating task status. Please try again.'
          : 'Error updating task status. Please try again.';
        setError(errorMessage);
      }
    }
  };

  // Kanban view components
  const renderKanbanBoard = () => {
    const statusOrder = ['TODO', 'IN_PROGRESS', 'DONE'];
    const statusTitles: Record<string, string> = {
      'TODO': 'To Do',
      'IN_PROGRESS': 'In Progress',
      'DONE': 'Done'
    };

    // Create default statuses if they don't exist
    const defaultStatuses = statusOrder.map(statusName => {
      const existingStatus = statuses.find(s => 
        s.name.toUpperCase().replace(/[-_ ]/g, '') === statusName.replace(/[-_ ]/g, '')
      );
      if (existingStatus) return existingStatus;
      
      // Create a default status if it doesn't exist
      return {
        id: `default-${statusName.toLowerCase()}`,
        name: statusName
      };
    });

    // Filter out meetings from tasks
    const nonMeetingTasks = tasks.filter(task => !task.title.startsWith('Meeting:'));

    const onDragEnd = (result: DropResult) => {
      const { destination, source, draggableId } = result;

      // If there's no destination or the item was dropped in its original position
      if (!destination || 
          (destination.droppableId === source.droppableId && 
           destination.index === source.index)) {
        return;
      }

      // Find the task that was dragged
      const task = nonMeetingTasks.find(t => t.id === draggableId);
      if (!task) return;

      // Find the new status
      const newStatus = defaultStatuses.find(s => s.id === destination.droppableId);
      if (!newStatus) return;

      // Update the task status
      updateTaskStatus(task.id, newStatus.id);
    };

    // If no tasks are loaded yet, show a loading message
  if (loading) {
  return (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading tasks...</span>
          </div>
          <p className="mt-3">Loading tasks...</p>
        </div>
      );
    }

    // If there's an error, show it
  if (error) {
  return (
        <div className="alert alert-danger m-3" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setError(null)}
            aria-label="Close"
          />
      </div>
      );
    }

    // If no tasks are available, show a message
    if (!nonMeetingTasks || nonMeetingTasks.length === 0) {
  return (
        <div className="text-center p-5">
          <p className="text-muted">No tasks available. Create a new task to get started.</p>
                    </div>
  );
    }

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-container">
          <div className="kanban-board">
            {defaultStatuses.map((status) => (
              <Droppable key={status.id} droppableId={status.id}>
                {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    className="kanban-column"
                  >
                    <div className="kanban-column-header">
                      <h5 className="mb-0">{statusTitles[status.name] || status.name}</h5>
                      <span className="task-count">
                        {nonMeetingTasks.filter((task) => task.status.id === status.id).length}
                      </span>
                          </div>
                    <div className="kanban-column-content p-3">
                      {nonMeetingTasks
                        .filter((task) => task.status.id === status.id)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
                                className="task-card"
                                onClick={() => handleTaskClick(task)}
                              >
                                <h6 className="task-title">{task.title}</h6>
                                  <p className="task-description">{task.description}</p>
                                  <div className="task-meta">
                                  <span className={`priority-badge priority-${task.priority}`}>
                {task.priority}
                                    </span>
                                  {task.totalTimeSpent && (
                                      <span className="due-date">
                                      <i className="bi bi-clock"></i>
                                      {Math.floor(task.totalTimeSpent / 3600)}h {Math.floor((task.totalTimeSpent % 3600) / 60)}m
              </span>
                                  )}
                          </div>
                                {task.assignees && task.assignees.length > 0 && (
                <div className="assignee-avatars">
                                    {task.assignees.map((assignee, idx) => (
                                      <div
                      key={assignee.id}
                                        className="assignee-avatar"
                      title={assignee.name}
                                        style={{ 
                                          zIndex: task.assignees.length - idx,
                                          backgroundColor: `hsl(${idx * 137.5 % 360}, 70%, 80%)`
                                        }}
                    >
                                        {assignee.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                        </div>
                      )}
      </div>
      )}
    </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                      </div>
                    )}
                  </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>
    );
  };

  // Custom Gantt view component
  const GanttChart = () => {
    // Filter out meetings from tasks
    const nonMeetingTasks = tasks.filter(task => !task.title.startsWith('Meeting:'));
    const sortedTasks = [...nonMeetingTasks].sort((a, b) => 
      moment(a.dueDate).valueOf() - moment(b.dueDate).valueOf()
    );

    const timelineStart = moment().startOf('week');
    const timelineEnd = moment().add(2, 'months').endOf('week');
    const days: Moment[] = [];
    let current = timelineStart.clone();

    while (current.isSameOrBefore(timelineEnd)) {
      days.push(current.clone());
      current.add(1, 'day');
    }

    const getStatusColor = (status: string) => {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('done')) return 'success';
      if (statusLower.includes('progress')) return 'primary';
      if (statusLower.includes('todo') || statusLower.includes('to do')) return 'secondary';
      return 'secondary';
    };

      return (
      <div className="gantt-container" style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '1200px' }}>
          {/* Timeline header */}
          <div className="d-flex border-bottom" style={{ marginLeft: '200px' }}>
            {days.map(day => (
              <div
                key={day.format('YYYY-MM-DD')}
                className="text-center border-end"
                style={{ minWidth: '50px', padding: '8px 4px' }}
              >
                {day.format('D')}
                <small className="d-block text-muted">{day.format('MMM')}</small>
              </div>
            ))}
            </div>
            
          {/* Tasks */}
          <div>
            {sortedTasks.map(task => {
              const taskStart = moment(task.dueDate).subtract(7, 'days');
              const taskEnd = moment(task.dueDate);
              const startOffset = Math.max(0, taskStart.diff(timelineStart, 'days'));
              const duration = Math.min(
                taskEnd.diff(taskStart, 'days'),
                timelineEnd.diff(taskStart, 'days')
              );
  
  return (
                <div key={task.id} className="d-flex align-items-center border-bottom">
                  <div
                    className="border-end bg-light"
                    style={{ width: '200px', padding: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {task.title}
          </div>
                  <div className="position-relative" style={{ height: '40px' }}>
                    <div
                      className={`position-absolute bg-${getStatusColor(task.status.name)}`}
                      style={{
                        left: `${startOffset * 50}px`,
                        width: `${duration * 50}px`,
                        height: '24px',
                        top: '8px',
                        borderRadius: '4px',
                      }}
          />
        </div>
                    </div>
              );
            })}
                  </div>
          </div>
    </div>
  );
};

  // Fetch startup members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!startupId) {
        console.warn('No startup ID provided. Cannot load members.');
        setFormError('No startup ID provided. Cannot load members.');
        setAvailableUsers([]);
        return;
      }

      setLoadingUsers(true);
      try {
        const response = await axios.get(`/api/startups/${startupId}/members`, getAuthConfig());
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format from members endpoint');
        }

        // Transform the response data to match the User interface
        const users = response.data
          .filter(member => member && member.id && member.name)
          .map(member => ({
            id: member.id,
            name: member.name,
            email: member.email || ''
          }));
        
        if (users.length === 0) {
          console.warn('No members found in the startup');
          setFormError('No members found in this startup. You can still create the task and assign members later.');
          setAvailableUsers([]);
          setMembers([]);
          } else {
          setAvailableUsers(users);
          setMembers(users);
        }
      } catch (err) {
        console.error('Error fetching startup members:', err);
        setFormError('Unable to load startup members. You can still create the task and assign members later.');
        setAvailableUsers([]);
        setMembers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchMembers();
  }, [startupId]); // Only depend on startupId

  // Add useEffect to fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/users/me', getAuthConfig());
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Add useEffect to fetch startup members
  useEffect(() => {
    const fetchStartupMembers = async () => {
      if (!startupId) return;
      
      try {
        const response = await axios.get(`/api/startups/${startupId}/members`, getAuthConfig());
        if (response.data && Array.isArray(response.data)) {
          setStartupMembers(response.data);
        }
      } catch (error) {
        console.error('Error fetching startup members:', error);
      }
    };

    fetchStartupMembers();
  }, [startupId]);

  // Add Task Form Component
  const AddTaskForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
    const [selectedAssignees, setSelectedAssignees] = useState<User[]>([]);
    const [isFreelance, setIsFreelance] = useState(false);
    const [estimatedHours, setEstimatedHours] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFormError(null);

      if (!title || !description || !startDate || !dueDate || !selectedStatus) {
        setFormError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      try {
        const taskData = {
          title,
          description,
          startDate,
          dueDate,
          priority,
          statusId: selectedStatus.id,
          assigneeIds: selectedAssignees.map(user => user.id),
          startupId,
          isFreelance,
          estimatedHours: isFreelance ? parseFloat(estimatedHours) : undefined,
          hourlyRate: isFreelance ? parseFloat(hourlyRate) : undefined,
        };

        await axios.post('/api/tasks', taskData, getAuthConfig());
        
        // Reset form
        setTitle('');
        setDescription('');
        setStartDate('');
        setDueDate('');
        setPriority('medium');
        setSelectedStatus(null);
        setSelectedAssignees([]);
        setIsFreelance(false);
        setEstimatedHours('');
        setHourlyRate('');
        
        // Refresh tasks list
        const tasksResponse = await axios.get(`/api/tasks/startup/${startupId}`, getAuthConfig());
        setTasks(tasksResponse.data);

        // Show success message or redirect
        setActivePage('tasks-board');
        } catch (err) {
        console.error('Error creating task:', err);
        setFormError(axios.isAxiosError(err) 
          ? err.response?.data?.message || 'Failed to create task'
          : 'Failed to create task');
      } finally {
        setSubmitting(false);
      }
      };

    return (
      <div className="add-task-form p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card" style={{ position: 'relative' }}>
          <div className="card-body" style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <h4 className="card-title mb-4">Create New Task</h4>
            
            {formError && (
              <div className="alert alert-danger d-flex align-items-center">
                <span className="flex-grow-1">{formError}</span>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setFormError(null)}
                  aria-label="Close"
                />
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
            </div>

              <div className="mb-3">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                  required
                />
          </div>
          
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                  </div>
                <div className="col">
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Priority *</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="col">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={selectedStatus?.id || ''}
                    onChange={(e) => {
                      const status = statuses.find(s => s.id === e.target.value);
                      setSelectedStatus(status || null);
                    }}
                    required
                  >
                    <option value="">Select status</option>
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                        </div>
            </div>
            
              <div className="mb-3">
                <label htmlFor="assignees" className="form-label">Assignees (Optional)</label>
                <select
                  className="form-select"
                  id="assignees"
                  multiple
                  value={selectedAssignees.map(user => user.id)}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    // Validate that all selected assignees are valid startup members
                    const validAssignees = selectedOptions.filter(id => 
                      members.some(member => member.id === id)
                    );
                    setSelectedAssignees(validAssignees.map(id => members.find(m => m.id === id)!));
                  }}
                >
                  {members.length > 0 ? (
                    members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No startup members available</option>
                  )}
                </select>
                <small className="form-text text-muted">
                  Hold Ctrl (Windows) or Command (Mac) to select multiple assignees. Only startup members can be assigned to tasks.
                </small>
                  </div>

              <div className="mb-3">
                <div className="form-check">
          <input
                    type="checkbox"
                    className="form-check-input"
                    id="isFreelance"
                    checked={isFreelance}
                    onChange={(e) => setIsFreelance(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="isFreelance">
                    This is a freelance task
                  </label>
                </div>
              </div>

              {isFreelance && (
                <div className="row mb-3">
                  <div className="col">
                    <label className="form-label">Estimated Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Hourly Rate ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                        </div>
                      )}

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActivePage('tasks-board')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Task...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
                </div>
            </form>
            </div>
          </div>
        </div>
      );
};

  // Lead Management Functions
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`/api/startups/${startupId}/leads`, getAuthConfig());
      console.log('Fetched leads:', response.data);
      setLeads(response.data || []);
        } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load leads. Please try again later.');
      setLeads([]);
      } finally {
        setLoading(false);
      }
    };

  const navigation = [
    {
      name: 'Tasks Board',
      icon: <FaClipboardList size={20} />,
      current: activePage === 'tasks-board',
      onClick: () => setActivePage('tasks-board')
    },
    {
      name: 'Calendar',
      icon: <CalendarIcon className="w-5 h-5" />,
      current: activePage === 'calendar',
      onClick: () => setActivePage('calendar')
    },
    {
      name: 'Add Task',
      icon: <FaPlus size={20} />,
      current: activePage === 'add-task',
      onClick: () => setActivePage('add-task')
    },
    {
      name: 'Task Analytics',
      icon: <FaChartLine size={20} />,
      current: activePage === 'task-analytics',
      onClick: () => setActivePage('task-analytics')
    },
    {
      name: 'Affiliate Analytics',
      icon: <FaChartBar size={20} />,
      current: activePage === 'affiliate-analytics',
      onClick: () => setActivePage('affiliate-analytics')
    },
    {
      name: 'Documents',
      icon: <FaFileAlt size={20} />,
      current: activePage === 'documents',
      onClick: () => setActivePage('documents')
    },
    {
      name: 'Chat',
      icon: <FaComments size={20} />,
      current: activePage === 'chat',
      onClick: () => setActivePage('chat')
    }
  ];

  const CalendarView: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [showMeetingForm, setShowMeetingForm] = useState(false);
    const [showMeetingDetails, setShowMeetingDetails] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [meetingAssignees, setMeetingAssignees] = useState<User[]>([]);
    const [formData, setFormData] = useState({
    title: '',
    description: '',
      startTime: '',
      endTime: '',
      meetingLink: ''
    });

  useEffect(() => {
      fetchMeetings();
    }, [startupId]);

    const fetchMeetings = async () => {
      try {
        const response = await axios.get(`/api/tasks/startup/${startupId}`, getAuthConfig());
        const tasks = response.data;
        const meetingTasks = tasks.filter((task: Task) => task.title.startsWith('Meeting:'));
        const formattedMeetings = meetingTasks.map((task: Task) => ({
          id: task.id,
          title: task.title.replace('Meeting: ', ''),
          description: task.description,
          start: new Date(task.startTime || task.dueDate),
          end: new Date(task.endTime || task.dueDate),
          assignees: task.assignees,
          meetingLink: task.description.match(/Meeting Link: (.*)/)?.[1]
        }));
        setMeetings(formattedMeetings);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setError('Failed to load meetings');
      }
    };

    const handleMeetingClick = (meeting: Meeting) => {
      setSelectedMeeting(meeting);
      setShowMeetingDetails(true);
    };

    const handleJoinMeeting = (meetingLink: string) => {
      if (meetingLink) {
        window.open(meetingLink, '_blank');
        } else {
        setError('No meeting link available');
      }
    };

    const handleDeleteMeeting = async (meetingId: string) => {
      try {
        await axios.delete(`/api/tasks/${meetingId}`, getAuthConfig());
        fetchMeetings(); // Refresh the meetings list
        setShowMeetingDetails(false); // Close the details modal
      } catch (error) {
        console.error('Error deleting meeting:', error);
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.message || error.response?.data?.msg || 'Failed to delete meeting';
          setError(errorMessage);
          } else {
          setError('Failed to delete meeting');
        }
      }
    };

    const handleMeetingSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Get the default To Do status ID
        const todoStatus = statuses.find(s => s.name === 'To Do');
        if (!todoStatus) {
          setError('No To Do status found. Please create a To Do status first.');
          return;
        }
        
        // Format the dates correctly
        const startDateTime = new Date(formData.startTime);
        const endDateTime = new Date(formData.endTime);

        const meetingData = {
          title: `Meeting: ${formData.title}`,
          description: `${formData.description}\nMeeting Link: ${formData.meetingLink}`,
          dueDate: startDateTime.toISOString(), // Use start time as due date
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          assigneeIds: meetingAssignees.map(user => user.id),
          startupId,
          statusId: todoStatus.id,
          priority: 'medium'
        };

        console.log('Sending meeting data:', meetingData);

        const response = await axios.post('/api/tasks', meetingData, getAuthConfig());
        
        if (response.data) {
          setShowMeetingForm(false);
          setFormData({
            title: '',
            description: '',
            startTime: '',
            endTime: '',
            meetingLink: ''
          });
          setMeetingAssignees([]);
          fetchMeetings();
        }
            } catch (error) {
        console.error('Error creating meeting:', error);
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.message || error.response?.data?.msg || 'Failed to create meeting';
          setError(errorMessage);
          console.error('Server response:', error.response?.data);
        } else {
          setError('Failed to create meeting');
        }
      }
    };

    const eventPropGetter = (event: Meeting) => {
      return {
        style: {
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer'
        }
      };
    };

    const EventComponent = ({ event }: { event: Meeting }) => {
    return (
        <div className="p-2" onClick={() => handleMeetingClick(event)}>
          <strong>{event.title}</strong>
          <div className="small">
            {event.assignees?.map(assignee => assignee.name).join(', ')}
            </div>
        </div>
      );
    };

    return (
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Calendar</h3>
                <button 
                  className="btn btn-primary" 
            onClick={() => setShowMeetingForm(true)}
                >
            Schedule Meeting
                </button>
          </div>
          
        {showMeetingForm && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Schedule Meeting</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowMeetingForm(false)}
                  ></button>
                  </div>
                <div className="modal-body">
                  <form onSubmit={handleMeetingSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                        </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                  </div>
                    <div className="mb-3">
                      <label className="form-label">Meeting Link</label>
                      <input
                        type="url"
                        className="form-control"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        required
                      />
                </div>
                    <div className="mb-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
              </div>
                    <div className="mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                  </div>
                    <div className="mb-3">
                      <label className="form-label">Assignees</label>
                      <Select
                        isMulti
                        options={members.map(member => ({
                          value: member.id,
                          label: member.name
                        }))}
                        value={meetingAssignees.map(assignee => ({
                          value: assignee.id,
                          label: assignee.name
                        }))}
                        onChange={(selected) => {
                          const selectedMembers = members.filter(member =>
                            selected.some(s => s.value === member.id)
                          );
                          setMeetingAssignees(selectedMembers);
                        }}
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                        </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowMeetingForm(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Schedule Meeting
                      </button>
                  </div>
                  </form>
                </div>
              </div>
                  </div>
                        </div>
                      )}

        {showMeetingDetails && selectedMeeting && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedMeeting.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowMeetingDetails(false)}
                  ></button>
                  </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Description:</strong>
                    <p>{selectedMeeting.description}</p>
                </div>
                  <div className="mb-3">
                    <strong>Start Time:</strong>
                    <p>{format(selectedMeeting.start, 'PPpp')}</p>
              </div>
                  <div className="mb-3">
                    <strong>End Time:</strong>
                    <p>{format(selectedMeeting.end, 'PPpp')}</p>
            </div>
                  <div className="mb-3">
                    <strong>Assignees:</strong>
                    <p>{selectedMeeting.assignees?.map(assignee => assignee.name).join(', ')}</p>
        </div>
                  <div className="d-flex justify-content-end gap-2">
                    {selectedMeeting.meetingLink && (
                  <button 
                        className="btn btn-success"
                        onClick={() => handleJoinMeeting(selectedMeeting.meetingLink!)}
                  >
                        Join Meeting
                  </button>
                )}
                          <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                    >
                      Delete Meeting
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
          </div>
        )}

        <div style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={meetings}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventPropGetter}
            views={['month', 'week', 'day']}
            defaultView="month"
            components={{
              event: EventComponent
            }}
          />
          </div>
        </div>
      );
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFormData.file) {
      alert('Please select a file to upload');
          return;
        }
        
    if (!startupId) {
      alert('No startup ID found. Please try again.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', uploadFormData.name);
      formData.append('description', uploadFormData.description);
      formData.append('file', uploadFormData.file);
      formData.append('startupId', startupId);

      console.log('Uploading document:', {
        name: uploadFormData.name,
        description: uploadFormData.description,
        file: uploadFormData.file.name,
        startupId
      });

      const response = await axios.post(
        '/api/documents/upload',
        formData,
        {
          ...getAuthConfig(),
          headers: {
            ...getAuthConfig().headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Upload response:', response.data);

      // Add the new document to the list
      setDocuments(prev => [...prev, response.data]);
      
      // Reset form
      setUploadFormData({
        name: '',
        description: '',
        file: null
      });
      setShowUploadForm(false);
            } catch (error) {
      console.error('Error uploading document:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        alert(`Failed to upload document: ${error.response?.data?.error || error.message}`);
      } else {
        alert('Failed to upload document. Please try again.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFormData(prev => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  const renderDocumentsPage = () => {
      return (
      <div className="container-fluid">
          <div className="row mb-4">
          <div className="col">
            <h2>Documents</h2>
                <button 
                  className="btn btn-primary" 
              onClick={() => setShowUploadForm(true)}
                >
              <FaFileUpload className="me-2" />
              Upload Document
                </button>
            </div>
          </div>
          
        {showUploadForm && (
                <div className="card mb-4">
                  <div className="card-body">
              <h5 className="card-title">Upload New Documents</h5>
              <form onSubmit={handleUploadSubmit}>
                <div className="mb-3">
                  <label htmlFor="documentName" className="form-label">Document Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="documentName"
                    value={uploadFormData.name}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                        </div>
                <div className="mb-3">
                  <label htmlFor="documentDescription" className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="documentDescription"
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                  </div>
                <div className="mb-3">
                  <label htmlFor="documentFile" className="form-label">File</label>
                  <input
                    type="file"
                    className="form-control"
                    id="documentFile"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Upload
                  </button>
                        </div>
              </form>
                  </div>
                </div>
        )}

        <div className="row">
          {documents.map((doc) => (
            <div key={doc.id} className="col-md-4 mb-4">
              <div className="card h-100">
                  <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{doc.name}</h6>
                      <small className="text-muted">
                        {doc.description || 'No description'} • {doc.fileType} • {new Date(doc.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <a 
                      href={`/uploads/documents/${doc.filePath.split('/').pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      <i className="fas fa-eye me-1"></i> View
                    </a>
                        </div>
                  </div>
                </div>
              </div>
          ))}
            </div>
        </div>
      );
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTimeTrackingModal(true);
  };

  const handleTimeUpdate = (taskId: string, timeSpent: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, totalTimeSpent: timeSpent }
          : task
      )
      );
  };

  const renderAffiliateAnalytics = () => {
    // Reset error state when retrying
    const handleRetry = () => {
      setRetryCount(0);
      setAffiliateError(null);
      fetchAffiliateData();
    };

    if (isAffiliateLoading) {
      return (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading analytics...</span>
          </div>
          <p className="mt-3">Loading affiliate analytics...</p>
        </div>
      );
    }

    if (affiliateError) {
      return (
        <div className="alert alert-danger m-3" role="alert">
          <div className="d-flex justify-content-between align-items-center">
            <span>{affiliateError}</span>
            <button 
              type="button" 
              className="btn btn-outline-danger btn-sm"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Format data for charts
    const prepareClicksByDateData = () => {
      // Group clicks by date
      const clicksByDate: Record<string, number> = {};
      
      if (Array.isArray(clicksData) && clicksData.length > 0) {
        clicksData.forEach(click => {
          const date = new Date(click.createdAt).toISOString().split('T')[0];
          clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });
      }
      
      // Sort by date
      const sortedDates = Object.keys(clicksByDate).sort();
      
      // Prepare data for Chart.js
      return {
        labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
        datasets: [
          {
            label: 'Clicks',
            data: sortedDates.map(date => clicksByDate[date]),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }
        ]
      };
    };

    const prepareReferrersData = () => {
      // Group clicks by referrer
      const referrerCounts: Record<string, number> = {};
      
      if (Array.isArray(clicksData) && clicksData.length > 0) {
        clicksData.forEach(click => {
          const referrer = click.referrer || 'Direct';
          referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
        });
      }
      
      // Sort by count in descending order
      const sortedReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 referrers
      
      // Prepare data for Chart.js
      return {
        labels: sortedReferrers.map(([referrer]) => referrer === '' ? 'Direct' : referrer),
        datasets: [
          {
            label: 'Clicks by Referrer',
            data: sortedReferrers.map(([, count]) => count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }
        ]
      };
    };

    // Calculate total statistics
    const totalLinks = affiliateLinksData.length;
    const totalClicks = affiliateLinksData.reduce((sum, link) => sum + link.clicks, 0);
    const totalConversions = affiliateLinksData.reduce((sum, link) => sum + link.conversions, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return (
      <div className="container-fluid p-4">
        <h2 className="mb-4">Affiliate Analytics Dashboard</h2>
        
        {/* Time Range Selector */}
        <div className="mb-4">
          <select 
            className="form-select w-auto" 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 365 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Total Links</h5>
                <h2 className="mb-0">{totalLinks}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Total Clicks</h5>
                <h2 className="mb-0">{totalClicks}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Total Conversions</h5>
                <h2 className="mb-0">{totalConversions}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark h-100">
              <div className="card-body">
                <h5 className="card-title">Conversion Rate</h5>
                <h2 className="mb-0">{conversionRate.toFixed(1)}%</h2>
              </div>
            </div>
          </div>
        </div>

        {affiliateLinksData.length > 0 ? (
          <>
            {/* Clicks Over Time */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Clicks Over Time</h5>
                    <div style={{ height: '300px' }}>
                      <Bar 
                        data={prepareClicksByDateData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Click Count'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Date'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">Top Referrers</h5>
                    <div style={{ height: '300px' }}>
                      <Pie 
                        data={prepareReferrersData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliate Links Table */}
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Affiliate Links</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Clicks</th>
                        <th>Conversions</th>
                        <th>Conversion Rate</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliateLinksData.map(link => (
                        <tr key={link.id}>
                          <td>{link.name || 'Unnamed Link'}</td>
                          <td>{link.code}</td>
                          <td>{link.clicks}</td>
                          <td>{link.conversions}</td>
                          <td>{link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : '0.0'}%</td>
                          <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="alert alert-info">
            <p className="mb-0">No affiliate links found for this startup. Create affiliate links to start tracking performance.</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!startupId) {
      return <div className="p-4"><h3>No startup selected</h3></div>;
    }

    switch (activePage) {
      case 'tasks-board':
        return (
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3>Tasks Board</h3>
              <div className="btn-group">
                  <button 
                  className={`btn ${activeView === 'kanban' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('kanban')}
                  >
                  Kanban Board
                  </button>
                <button 
                  className={`btn ${activeView === 'gantt' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('gantt')}
                >
                  Gantt Chart
                </button>
              </div>
            </div>
            {renderKanbanBoard()}
            {activeView === 'gantt' && <GanttChart />}
          </div>
        );
      case 'calendar':
        return <CalendarView />;
      case 'add-task':
        return <AddTaskForm />;
      case 'task-analytics':
        return renderAnalytics();
      case 'affiliate-analytics':
        return renderAffiliateAnalytics();
      case 'documents':
        return renderDocumentsPage();
      case 'chat':
        return <ChatPage startupId={startupId} members={startupMembers} />;
      default:
        return <div className="p-4"><h3>Page not found</h3></div>;
    }
  };

  const renderAnalytics = () => {
    return (
      <div className="p-4">
        <h3 className="mb-4">Task Analytics</h3>
        
        {/* Task Overview Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body">
                <h5 className="card-title">Total Tasks</h5>
                <h2 className="mb-0">{tasks.length}</h2>
            </div>
          </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white h-100">
                <div className="card-body">
                <h5 className="card-title">Completed Tasks</h5>
                <h2 className="mb-0">
                  {tasks.filter(task => task.status.name.toUpperCase() === 'DONE').length}
                </h2>
                  </div>
                </div>
                    </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark h-100">
              <div className="card-body">
                <h5 className="card-title">In Progress</h5>
                <h2 className="mb-0">
                  {tasks.filter(task => task.status.name.toUpperCase() === 'IN_PROGRESS').length}
                </h2>
                </div>
              </div>
            </div>
          <div className="col-md-3">
            <div className="card bg-info text-white h-100">
              <div className="card-body">
                <h5 className="card-title">To Do</h5>
                <h2 className="mb-0">
                  {tasks.filter(task => task.status.name.toUpperCase() === 'TODO').length}
                </h2>
      </div>
    </div>
          </div>
        </div>

        {/* Task Distribution Charts */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Tasks by Status</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statuses.map(status => {
                        const count = tasks.filter(task => task.status.id === status.id).length;
                        const percentage = tasks.length > 0 ? ((count / tasks.length) * 100).toFixed(1) : '0.0';
  return (
                          <tr key={status.id}>
                            <td>{status.name}</td>
                            <td>{count}</td>
                            <td>{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
    </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">Tasks by Priority</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['high', 'medium', 'low'].map(priority => {
                        const count = tasks.filter(task => task.priority === priority).length;
                        const percentage = tasks.length > 0 ? ((count / tasks.length) * 100).toFixed(1) : '0.0';
  return (
                          <tr key={priority}>
                            <td className="text-capitalize">{priority}</td>
                            <td>{count}</td>
                            <td>{percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Assignments */}
      <div className="row">
        <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Task Assignments</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Assignee</th>
                        <th>Total Tasks</th>
                        <th>Completed</th>
                        <th>In Progress</th>
                        <th>To Do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(member => {
                        const memberTasks = tasks.filter(task => 
                          task.assignees.some(assignee => assignee.id === member.id)
                        );
                        const completed = memberTasks.filter(task => 
                          task.status.name.toUpperCase() === 'DONE'
                        ).length;
                        const inProgress = memberTasks.filter(task => 
                          task.status.name.toUpperCase() === 'IN_PROGRESS'
                        ).length;
                        const todo = memberTasks.filter(task => 
                          task.status.name.toUpperCase() === 'TODO'
                        ).length;
return (
                          <tr key={member.id}>
                            <td>{member.name}</td>
                            <td>{memberTasks.length}</td>
                            <td>{completed}</td>
                            <td>{inProgress}</td>
                            <td>{todo}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
          </div>
        </div>
            </div>
          </div>
        </div>
  </div>
);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Side Navigation */}
        <div className="col-md-2 bg-white p-0 border-end" style={{ minHeight: '100vh' }}>
          <div className="p-3 border-bottom">
            <h5 className="text-primary mb-0">Task Management</h5>
          </div>
          <nav className="nav flex-column p-3">
            {navigation.map(item => (
              <button
                key={item.name}
                className={`nav-link btn btn-link text-start mb-2 d-flex align-items-center ${
                  item.current ? 'active bg-light rounded' : ''
                }`}
                onClick={item.onClick}
                style={{
                  color: item.current ? '#0d6efd' : '#6c757d',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="me-3" style={{ 
                  color: item.current ? '#0d6efd' : '#6c757d',
                  width: '24px',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </span>
                <span style={{ 
                  fontWeight: item.current ? '500' : 'normal',
                  fontSize: '0.95rem'
                }}>
                  {item.name}
                </span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="col-md-10 p-4">
          {renderContent()}
            </div>
          </div>
      {showTimeTrackingModal && selectedTask && (
        <TimeTrackingModal
          task={selectedTask}
          onClose={() => {
            setShowTimeTrackingModal(false);
            setSelectedTask(null);
          }}
          onTimeUpdate={handleTimeUpdate}
        />
      )}
    </div>
  );
};

export default TaskManagementPage;

// Add this CSS to your stylesheet
const styles = `
.hover-overlay:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.kanban-container {
  padding: 24px;
  overflow-x: auto;
  min-height: calc(100vh - 200px);
  display: flex;
  justify-content: center;
  width: 100%;
}

.kanban-board {
  display: flex;
  gap: 24px;
  min-width: fit-content;
  max-width: 1600px;
  margin: 0 auto;
}

.kanban-column {
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 350px;
  flex: 1;
  margin: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.kanban-column-header {
  padding: 12px 16px;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kanban-column-header h5 {
  margin: 0;
  font-weight: 600;
}

.task-count {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #495057;
}

.task-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.15);
}

.task-card h6 {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #212529;
}

.task-description {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.priority-badge {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.priority-high {
  background-color: #dc3545;
  color: white;
}

.priority-medium {
  background-color: #ffc107;
  color: #212529;
}

.priority-low {
  background-color: #198754;
  color: white;
}

.assignee-avatars {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dee2e6;
  color: #495057;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: -8px;
  border: 2px solid white;
}

.due-date {
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.due-date svg {
  margin-right: 4px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.bg-gray-400 {
  background-color: #6c757d;
}

.bg-blue-500 {
  background-color: #0d6efd;
}

.bg-green-500 {
  background-color: #198754;
}

/* Side Navigation Styles */
.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd !important;
}

.nav-link.active {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd !important;
}

.nav-link.active span {
  color: #0d6efd !important;
}

/* Main Content Area */
.col-md-10 {
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-dialog {
  position: relative;
  width: auto;
  max-width: 500px;
  margin: 1.75rem auto;
  pointer-events: none;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  outline: 0;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  border-top-left-radius: 0.3rem;
  border-top-right-radius: 0.3rem;
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 1rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  border-bottom-right-radius: 0.3rem;
  border-bottom-left-radius: 0.3rem;
}

.modal-title {
  margin-bottom: 0;
  line-height: 1.5;
}

.btn-close {
  padding: 0.5rem 0.5rem;
  margin: -0.5rem -0.5rem -0.5rem auto;
  background-color: transparent;
  border: 0;
  border-radius: 0.25rem;
  opacity: 0.5;
  cursor: pointer;
}

.btn-close:hover {
  opacity: 0.75;
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const getStatusColor = (statusName: string): string => {
  switch (statusName.toUpperCase()) {
    case 'TODO':
      return 'bg-gray-400';
    case 'IN_PROGRESS':
      return 'bg-blue-500';
    case 'DONE':
      return 'bg-green-500';
      default:
      return 'bg-gray-400';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

