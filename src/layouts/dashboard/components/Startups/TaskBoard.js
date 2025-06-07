import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Paper,
  Divider,
  Stack,
  FormGroup,
  FormControlLabel,
  Switch,
  OutlinedInput,
  Snackbar,
  Alert,
  Checkbox,
  ListItemText,
  Avatar
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createTask, updateTaskStatus, updateTask, getStartupTasks, updateTaskStatusFast, getUserTasks } from "../../../../api/task.js"; // Adjust the import path as necessary
import { getStartupMembers } from "../../../../api/startup.js"; // Import for fetching startup members
import "./TaskBoard.css";
import TaskDetailsDialog from './TaskDetailsDialog';
import { Scale } from "lucide-react";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left',
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
  getContentAnchorEl: null,
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return '#FF4D4F'; // Red
    case 'Medium':
      return '#FAAD14'; // Orange
    case 'Low':
      return '#52C41A'; // Green
    default:
      return '#D9D9D9'; // Grey
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'todo':
      return '#4318FF'; // Blue
    case 'inprogress':
      return '#FFB547'; // Orange
    // case 'review':
    //   return '#05CD99'; // Green
    case 'done':
      return '#1E1EFA'; // Violet
    default:
      return '#D9D9D9'; // Grey
  }
};

const getCardGradient = (status) => {
  switch (status) {
    case 'todo':
      return 'linear-gradient(180deg, rgba(67, 24, 255, 0.3) 0%, rgba(67, 24, 255, 0) 100%)';
    case 'inprogress':
      return 'linear-gradient(180deg, rgba(255, 181, 71, 0.3) 0%, rgba(255, 181, 71, 0) 100%)';
    // case 'review':
    //   return 'linear-gradient(180deg, rgba(5, 205, 153, 0.3) 0%, rgba(5, 205, 153, 0) 100%)';
    case 'done':
      return 'linear-gradient(180deg, rgba(30, 30, 250, 0.3) 0%, rgba(30, 30, 250, 0) 100%)';
    default:
      return 'rgba(112, 144, 176, 0.1)';
  }
};

const TaskBoard = ({ startupId, tasks, members, taskStatuses }) => {
  const [columns, setColumns] = useState({
    todo: { id: 'todo', title: 'To Do', tasks: [] },
    inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
    // review: { id: 'review', title: 'Review', tasks: [] },
    done: { id: 'done', title: 'Done', tasks: [] },
  });
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Low',
    startDate: '',
    dueDate: '',
    status: 'To Do',
    assignees: [],
    isFreelance: false,
    estimatedHours: '',
    hourlyRate: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    vertical: 'top',
    horizontal: 'center'
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [openAssigneeDropdown, setOpenAssigneeDropdown] = useState(false);

  // State for storing fetched members and tasks if not provided via props
  const [localMembers, setLocalMembers] = useState([]);
  const [localTasks, setLocalTasks] = useState([]);
  
  // Define isMeetingTask at component scope so it's accessible everywhere
  const isMeetingTask = (task) => {
    // Only log in development mode and not in production
    const isDebugMode = false; // Set to false to disable logging
    
    // Only consider it a meeting task if:
    // 1. The isMeeting flag is explicitly set to 1, or
    // 2. The title contains specific meeting keywords
    
    if (task.isMeeting === 1 || task.isMeeting === true) {
      if (isDebugMode) console.log('Task identified as meeting by isMeeting flag');
      return true;
    }
    
    if (task.title) {
      const lowerTitle = task.title.toLowerCase();
      if (lowerTitle.includes("meeting") || lowerTitle.includes("call")) {
        if (isDebugMode) console.log('Task identified as meeting by title containing "meeting" or "call"');
        return true;
      }
      if (lowerTitle.includes("meeting with")) {
        if (isDebugMode) console.log('Task identified as meeting by title containing "meeting with"');
        return true;
      }
    }
    
    // Check description for meeting link
    if (task.description && task.description.toLowerCase().includes("meeting link")) {
      if (isDebugMode) console.log('Task identified as meeting by description containing "meeting link"');
      return true;
    }
    
    // Not a meeting task
    return false;
  };
  
  // Fetch startup members if not provided via props
  useEffect(() => {
    const fetchStartupMembers = async () => {
      if (!members || members.length === 0) {
        try {
          console.log('Fetching startup members for startup ID:', startupId);
          const response = await getStartupMembers(startupId);
          console.log('Fetched startup members:', response);
          setLocalMembers(response);
        } catch (error) {
          console.error('Error fetching startup members:', error);
          setError('Failed to load team members');
        }
      }
    };
    
    fetchStartupMembers();
  }, [startupId, members]);
  
  // Function to fetch startup tasks
  const fetchStartupTasks = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      // Only log in development mode
      const isDebugMode = false;
      
      if (isDebugMode) console.log('Fetching tasks for startup ID:', startupId);
      const response = await getStartupTasks(startupId);
      if (isDebugMode) console.log('Fetched startup tasks:', response);
      
      // Update local tasks state
      setLocalTasks(response);
      
      // Update the columns with the fetched tasks
      if (response && Array.isArray(response)) {
        if (isDebugMode) console.log(`Processing ${response.length} tasks for display`);
        
        // Create a new columns object with empty task arrays
        const newColumns = {
          todo: { id: 'todo', title: 'To Do', tasks: [] },
          inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
          // review: { id: 'review', title: 'Review', tasks: [] },
          done: { id: 'done', title: 'Done', tasks: [] },
        };
        
        // Distribute tasks to the appropriate columns
        response.forEach(task => {
          // Map task status to column ID
          let columnId = 'todo'; // Default column
          
          // Check if task has a status object with a name property
          if (task.status && typeof task.status === 'object' && task.status.name) {
            // Normalize status name for comparison
            const statusName = task.status.name.toLowerCase().replace(/\s+/g, '');
            
            if (statusName === 'inprogress' || statusName === 'in-progress' || statusName === 'progress') {
              columnId = 'inprogress';
            // } 
            // else if (statusName === 'review' || statusName === 'inreview') {
            //   columnId = 'review';
            } else if (statusName === 'done' || statusName === 'completed') {
              columnId = 'done';
            }
          } 
          // Check if task has a statusName property
          else if (task.statusName) {
            const statusName = task.statusName.toLowerCase().replace(/\s+/g, '');
            
            if (statusName === 'inprogress' || statusName === 'in-progress' || statusName === 'progress') {
              columnId = 'inprogress';
            // } else if (statusName === 'review' || statusName === 'inreview') {
            //   columnId = 'review';
            } else if (statusName === 'done' || statusName === 'completed') {
              columnId = 'done';
            }
          }
          // If task.status is a string, use it directly
          else if (typeof task.status === 'string') {
            const statusName = task.status.toLowerCase().replace(/\s+/g, '');
            
            if (statusName === 'inprogress' || statusName === 'in-progress' || statusName === 'progress') {
              columnId = 'inprogress';
            // } else if (statusName === 'review' || statusName === 'inreview') {
            //   columnId = 'review';
            } else if (statusName === 'done' || statusName === 'completed') {
              columnId = 'done';
            }
          }
          
          // Add task to the appropriate column
          if (newColumns[columnId]) {
            newColumns[columnId].tasks.push({
              ...task,
              status: columnId // Ensure the status matches the column
            });
          }
        });
        
        // Update columns state
        setColumns(newColumns);
        
        // Also update availableTasks for filtering
        setAvailableTasks(response);
      } else {
        console.warn('No tasks received or response is not an array:', response);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching startup tasks:', error);
      setError('Failed to load tasks');
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  
  // Fetch startup tasks if not provided via props
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      fetchStartupTasks();
    }
  }, [startupId, tasks]);
  
  // Set up automatic refresh every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing TaskBoard...');
      // Only refresh if we're not already loading and if we're using local tasks
      if (!loading && (!tasks || tasks.length === 0)) {
        fetchStartupTasks(false); // Don't show loading indicator for auto-refresh
      }
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [loading, tasks, startupId]);
  
  // Use provided members or fallback to locally fetched members
  const availableMembers = members && members.length > 0 ? members : localMembers;
  
  // Use provided tasks or fallback to locally fetched tasks
  const [availableTasks, setAvailableTasks] = useState([]);
  
  // Initialize availableTasks from props or local state
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setAvailableTasks(tasks);
    } else if (localTasks && localTasks.length > 0) {
      setAvailableTasks(localTasks);
    }
  }, [tasks, localTasks]);
  
  // Removed debug function
  
  useEffect(() => {
    // Removed debug logging
    
    const newColumns = {
      todo: { id: 'todo', title: 'To Do', tasks: [] },
      inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
      // review: { id: 'review', title: 'Review', tasks: [] },
      done: { id: 'done', title: 'Done', tasks: [] },
    };

    // isMeetingTask function is now defined at component scope

    // Use availableTasks instead of tasks
    if (!availableTasks || availableTasks.length === 0) {
      console.log('No tasks available to display');
      // Initialize empty columns but don't return early
      // This allows the component to render with empty columns
      setLoading(false);
      setColumns({
        todo: { id: 'todo', title: 'To Do', tasks: [] },
        inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
        // review: { id: 'review', title: 'Review', tasks: [] },
        done: { id: 'done', title: 'Done', tasks: [] },
      });
      return;
    }

    availableTasks.forEach(task => {
      if (isMeetingTask(task)) {
        // Skip meeting tasks silently without logging
        return;
      }
      const {
        id,
        title,
        description,
        priority,
        startTime,
        dueDate,
        statusName,
        assignees,
        isFreelance,
        estimatedHours,
        hourlyRate,
      } = task;

      // Map status ID or name to column key
      let statusKey = 'todo'; // Default to todo
      
      // Create a mapping between status names and column keys
      const statusNameMap = {
        'to do': 'todo',
        'in progress': 'inprogress',
        // 'review': 'review',
        'done': 'done'
      };
      
      // First try to map by statusName if available
      if (statusName) {
        const normalizedStatusName = statusName.toLowerCase();
        statusKey = statusNameMap[normalizedStatusName] || normalizedStatusName.replace(/ /g, "");
      }
      // If mapping by name failed and we have taskStatuses, try to find the status by ID
      else if (task.status_id && taskStatuses && taskStatuses.length > 0) {
        // Find the status object that matches the task's status_id
        const matchingStatus = taskStatuses.find(status => status.id === task.status_id);
        if (matchingStatus && matchingStatus.name) {
          // Use the name to determine the column
          const normalizedStatusName = matchingStatus.name.toLowerCase();
          statusKey = statusNameMap[normalizedStatusName] || normalizedStatusName.replace(/ /g, "");
        }
      }
      
      // If we have a statusName but no status_id, try to find the corresponding ID
      if (!task.status_id && statusName && taskStatuses && taskStatuses.length > 0) {
        const matchingStatus = taskStatuses.find(status => 
          status.name.toLowerCase() === statusName.toLowerCase());
        if (matchingStatus) {
          // Update the task with the correct status_id
          task.status_id = matchingStatus.id;
          console.log(`Found matching status_id ${matchingStatus.id} for statusName: ${statusName}`);
        }
      }
      
      // Special case handling for tasks with 'In Progress' status that are incorrectly mapped
      if (statusName === 'In Progress' && statusKey === 'todo') {
        console.log(`Correcting mapping for 'In Progress' task: ${title}`);
        statusKey = 'inprogress';
      }
      
      // Removed debug log
      const taskData = {
        id,
        title,
        description,
        priority: priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Low',
        startDate: startTime || '',
        dueDate,
        status: statusKey,
        assignees: assignees?.map(assignee => assignee?.id) || [],
        isFreelance: isFreelance === 1,
        estimatedHours,
        hourlyRate,
      };

      if (newColumns[statusKey]) {
        newColumns[statusKey].tasks.push(taskData);
      } else {
        // Fallback for unknown status
        // If we can't determine the status, put it in the To Do column
        newColumns.todo.tasks.push(taskData);
      }
    });

    setColumns(newColumns);
    setLoading(false);
  }, [availableTasks]); // Updated dependency to use availableTasks

  // Add state to store task status changes locally
  const [taskStatusChanges, setTaskStatusChanges] = useState({});

  // Load saved task status changes from localStorage on component mount
  useEffect(() => {
    const savedChanges = localStorage.getItem(`taskStatusChanges_${startupId}`);
    if (savedChanges) {
      try {
        const parsedChanges = JSON.parse(savedChanges);
        setTaskStatusChanges(parsedChanges);
        console.log('Loaded saved task status changes:', parsedChanges);
      } catch (error) {
        console.error('Error parsing saved task status changes:', error);
      }
    }
  }, [startupId]);

  // Apply saved task status changes when tasks are loaded or status changes are updated
  const [statusChangesApplied, setStatusChangesApplied] = useState(false);
  
  useEffect(() => {
    // Only apply changes if we have task status changes and columns with tasks,
    // and we haven't already applied these specific changes
    if (Object.keys(taskStatusChanges).length > 0 && 
        Object.keys(columns).length > 0 && 
        !statusChangesApplied) {
      
      // Only log in development mode
      const isDebugMode = false;
      
      if (isDebugMode) console.log('Applying saved task status changes to columns');
      
      // Create a deep copy of the columns
      const updatedColumns = JSON.parse(JSON.stringify(columns));
      
      // First, collect all tasks from all columns
      const allTasks = [];
      Object.values(updatedColumns).forEach(column => {
        column.tasks.forEach(task => allTasks.push({...task, originalColumn: column.id}));
        // Clear tasks from all columns - we'll redistribute them
        column.tasks = [];
      });
      
      // Now redistribute tasks based on their status or saved changes
      allTasks.forEach(task => {
        // Check if this task has a saved status change
        const newStatus = taskStatusChanges[task.id] || task.status || task.originalColumn || 'todo';
        
        // Make sure the column exists
        if (updatedColumns[newStatus]) {
          // Update the task's status property
          task.status = newStatus;
          // Add to the appropriate column
          updatedColumns[newStatus].tasks.push(task);
        } else {
          // Fallback to original column if the target column doesn't exist
          updatedColumns[task.originalColumn || 'todo'].tasks.push(task);
        }
      });
      
      // Mark that we've applied these changes to prevent infinite loop
      setStatusChangesApplied(true);
      
      // Update the columns state with the modified columns
      setColumns(updatedColumns);
    }
  }, [taskStatusChanges, statusChangesApplied]);
  
  // Update availableTasks when tasks are moved between columns
  useEffect(() => {
    // Only run this if columns have been initialized
    if (Object.keys(columns).length === 0) return;
    
    // Update availableTasks to reflect current status in columns
    setAvailableTasks(prevTasks => {
      if (!prevTasks || prevTasks.length === 0) return prevTasks;
      
      return prevTasks.map(task => {
        // Find which column this task is in
        for (const [columnId, column] of Object.entries(columns)) {
          const foundInColumn = column.tasks.find(t => t.id === task.id);
          if (foundInColumn) {
            // Update the task's status to match its column
            return {...task, status: columnId};
          }
        }
        return task;
      });
    });
  }, [columns]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceTasks = [...sourceColumn.tasks];
      const destTasks = [...destColumn.tasks];
      const [removed] = sourceTasks.splice(source.index, 1);

      // Update the status of the moved task
      const newStatus = destination.droppableId;
      removed.status = newStatus;
      
      // Update UI immediately for better user experience
      destTasks.splice(destination.index, 0, removed);
      const updatedColumns = {
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: sourceTasks,
        },
        [destination.droppableId]: {
          ...destColumn,
          tasks: destTasks,
        },
      };
      setColumns(updatedColumns);

      // Find the status object that matches the new column
      const statusObj = taskStatuses.find(status => {
        // Normalize both strings for comparison (remove spaces, lowercase)
        const normalizedStatusName = status.name?.toLowerCase().replace(/\s+/g, "");
        const normalizedNewStatus = newStatus.toLowerCase().replace(/\s+/g, "");
        
        // Special case for 'In Progress' mapping to 'inprogress'
        if (status.name === 'In Progress' && normalizedNewStatus === 'inprogress') {
          console.log('Found matching status_id', status.id, 'for statusName:', status.name);
          return true;
        }
        
        if (normalizedStatusName === normalizedNewStatus) {
          console.log('Found matching status_id', status.id, 'for statusName:', status.name);
          return true;
        }
        
        return false;
      });

      if (!statusObj) {
        console.error('Could not find matching status for', newStatus);
        return;
      }

      // Set loading state to indicate an update is in progress
      setLoading(true);

      // Update the task in availableTasks immediately for optimistic UI update
      setAvailableTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task.id === removed.id) {
            return {
              ...task,
              status: newStatus,
              statusId: statusObj.id,
              status_id: statusObj.id,
              statusName: statusObj.name
            };
          }
          return task;
        });
      });

      // Update the server
      try {
        await updateTaskStatusFast(removed.id, statusObj.id);
        setSnackbar({
          open: true,
          message: 'Task status updated successfully',
          severity: 'success',
          vertical: 'top',
          horizontal: 'center'
        });
        // DO NOT call fetchStartupTasks() here!
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to update task status. Please try again.',
          severity: 'error',
          vertical: 'top',
          horizontal: 'center'
        });
        // Optionally revert the UI change by calling fetchStartupTasks()
        await fetchStartupTasks();
      } finally {
        setLoading(false);
      }
    } else {
      // Same column reordering
      const column = columns[source.droppableId];
      const copiedTasks = [...column.tasks];
      const [removed] = copiedTasks.splice(source.index, 1);
      copiedTasks.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          tasks: copiedTasks,
        },
      });
    }
  };

  const handleOpen = (status) => {
    setNewTask(prevState => ({ ...prevState, status }));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'Low',
      startDate: '',
      dueDate: '',
      status: 'To Do',
      assignees: [],
      isFreelance: false,
      estimatedHours: '',
      hourlyRate: '',
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  const handleAssigneeChange = (event) => {
    const {
      target: { value },
    } = event;
    setNewTask({
      ...newTask,
      assignees: typeof value === 'string' ? value.split(',') : value,
    });
    setErrors({
      ...errors,
      assignees: value.length === 0 ? 'Please select at least one assignee' : ''
    });
  };

  const handleDateChange = (name, value) => {
    setNewTask({ ...newTask, [name]: value });
    if (name === 'startDate' && newTask.dueDate && value > newTask.dueDate) {
      setErrors(prevErrors => ({ ...prevErrors, startDate: 'Start date cannot be after due date.' }));
    } else if (name === 'dueDate' && newTask.startDate && value < newTask.startDate) {
      setErrors(prevErrors => ({ ...prevErrors, dueDate: 'Due date cannot be before start date.' }));
    } else {
      setErrors(prevErrors => {
        const { [name]: removedError, ...rest } = prevErrors;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!newTask.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!newTask.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!newTask.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    if (!newTask.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!newTask.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (newTask.startDate && new Date(newTask.dueDate) < new Date(newTask.startDate)) {
      newErrors.dueDate = 'Due date cannot be before start date';
    }
    
    if (!newTask.assignees || newTask.assignees.length === 0) {
      newErrors.assignees = 'At least one assignee is required';
    }
    
    if (newTask.isFreelance) {
      if (!newTask.estimatedHours || newTask.estimatedHours <= 0) {
        newErrors.estimatedHours = 'Valid estimated hours are required for freelance tasks';
      }
      
      if (!newTask.hourlyRate || newTask.hourlyRate <= 0) {
        newErrors.hourlyRate = 'Valid hourly rate is required for freelance tasks';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = async () => {
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      // Find the status ID based on the status name
      const statusObj = taskStatuses?.find(
        status =>
          status?.name?.replace(/\s+/g, '').toLowerCase() ===
          newTask.status?.replace(/\s+/g, '').toLowerCase()
      );
  
      if (!statusObj) {
        throw new Error('Invalid task status');
      }
  
      // Create base task data
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        startDate: newTask.startDate,
        dueDate: newTask.dueDate,
        statusId: statusObj.id,
        startupId: startupId,
        assigneeIds:
          newTask.assignees
            ?.map(id => members?.find(member => member?.id === id)?.id)
            .filter(Boolean) || [],
        isFreelance: newTask.isFreelance,
      };
  
      if (newTask.isFreelance) {
        taskData.estimatedHours = parseFloat(newTask.estimatedHours);
        taskData.hourlyRate = parseFloat(newTask.hourlyRate);
      }
  
      // Create task
      const createdTask = await createTask(taskData);
  
      // Map assignee IDs to names and create assignee objects
      const assigneeObjects = newTask.assignees.map(assigneeId => {
        const member = members.find(m => m.id === assigneeId);
        return {
          id: assigneeId,
          name: member ? member.name : 'Unknown User',
          avatar: member ? member.avatar : null,
        };
      });
  
      // Update local state
      const newTaskWithDetails = {
        ...createdTask,
        status: 'todo',
        assignees: assigneeObjects,
      };
  
      setColumns(prev => {
        const updatedTodoTasks = [...prev.todo.tasks, newTaskWithDetails];
        return {
          ...prev,
          todo: {
            ...prev.todo,
            tasks: updatedTodoTasks,
          },
        };
      });
  
      // Show success message
      setSnackbar({
        open: true,
        message: 'Task created successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'center',
      });
  
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'Low',
        startDate: '',
        dueDate: '',
        status: 'To Do',
        assignees: [],
        isFreelance: false,
        estimatedHours: '',
        hourlyRate: '',
      });
  
      // Close dialog
      handleClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create task: ' + (err.message || 'Unknown error'),
        severity: 'error',
        vertical: 'top',
        horizontal: 'center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const findAssigneeNames = (assigneeIds) => {
    return assigneeIds.map(id => availableMembers.find(member => member.id === id)?.name).filter(name => name !== undefined);
  };
  
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleCloseTaskDetails = () => {
    setTaskDetailsOpen(false);
    setSelectedTask(null);
  };

  // Function to handle assignee selection
  const handleAssigneeSelect = (assignee) => {
    setSelectedAssignee(assignee);
    setOpenAssigneeDropdown(false);
  };

  // Function to handle "All" selection
  const handleShowAllTasks = () => {
    setOpenAssigneeDropdown(false);
    setSelectedAssignee(null); // Reset selected assignee to show all tasks
  };

  // Function to filter tasks based on selected assignee and column
  const filterTasks = (column) => {
    const tasksInColumn = column.tasks;
    if (selectedAssignee) {
      return tasksInColumn.filter(task => task.assignees.includes(selectedAssignee.id));
    }
    return tasksInColumn;
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="task-board">
      <div className="task-board-header">
        <div className="header-left">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
            Task Board
          </Typography>
        </div>
        <div className="header-right">
        <Button onClick={handleShowAllTasks}>
            All
          </Button>
          <Button onClick={() => setOpenAssigneeDropdown(prev => !prev)}>
            Assignee
          </Button>
         
          {openAssigneeDropdown && (
            <div className="assignee-dropdown">
              {members.map(member => (
                <MenuItem key={member.id} onClick={() => handleAssigneeSelect(member)}>
                  {member.name}
                </MenuItem>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="task-board-container">
          {Object.values(columns).map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="task-column"
                >
                  <h3 className="task-column-header">
                    {column.title} ({filterTasks(column).length})
                  </h3>
                  <div className="task-column-content">
                    {filterTasks(column).map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card status-${task.status} ${snapshot.isDragging ? 'dragging' : ''}`}
                            onClick={() => handleTaskClick(task)}
                            style={{
                              cursor: 'pointer',
                              ...provided.draggableProps.style,
                              boxShadow: snapshot.isDragging ? '0 8px 24px rgba(67,24,255,0.25)' : '',
                              transform: snapshot.isDragging
                                ? `${provided.draggableProps.style?.transform || ''} scale(0.7)`
                                : provided.draggableProps.style?.transform,
                              zIndex: snapshot.isDragging ? 1000 : 'auto',
                              background: snapshot.isDragging ? '#fff' : '',
                              transition: 'box-shadow 0.2s, transform 0.2s',
                            }}
                          >
                            <div className="task-card-content">
                              <div className="task-header">
                                <h4 className="task-title">{task.title || "No Title"}</h4>
                                <span className={`task-chip priority-${task.priority.toLowerCase()}`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="task-description">{task.description || "No Description"}</p>
                              {task.isFreelance && (
                                <p className="task-description">
                                  Estimated: {task.estimatedHours} hours @ ${task.hourlyRate}/hr
                                </p>
                              )}
                              <div className="task-meta">
                                <span className="task-chip">
                                  <CalendarTodayIcon className="task-chip-icon" />
                                  Due: {task.dueDate}
                                </span>
                                {findAssigneeNames(task.assignees).map(assigneeName => (
                                  <span key={assigneeName} className="task-chip">
                                    <PersonIcon className="task-chip-icon" />
                                    {assigneeName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                  <button
                    onClick={() => handleOpen(column.id)}
                    className="add-task-button"
                  >
                    <AddIcon />
                    Add Task
                  </button>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {open && (
        <div className="task-dialog-overlay">
          <div className="task-dialog">
            <div className="task-dialog-header">
              <h2 className="task-dialog-title">Add New Task</h2>
              <button onClick={handleClose} className="close-button">
                <CloseIcon fontSize="large" />
              </button>
            </div>
            <div className="task-dialog-content">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="form-input"
                  maxLength={100}
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={3}
                  maxLength={500}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div className="form-row">
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={newTask.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="form-input"
                    />
                    {errors.startDate && <p className="form-error">{errors.startDate}</p>}
                  </div>
                  <div className="form-col">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={newTask.dueDate}
                      onChange={(e) => handleDateChange('dueDate', e.target.value)}
                      className="form-input"
                    />
                    {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assignees</label>
                <FormControl fullWidth className="mui-select-container">
                  <Select
                    multiple
                    value={newTask.assignees}
                    onChange={handleAssigneeChange}
                    input={<OutlinedInput />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <em>Select team members</em>;
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const member = availableMembers.find(m => m.id === value);
                            return (
                              <Chip 
                                key={value} 
                                label={member ? member.name : value}
                                avatar={member && member.avatar ? 
                                  <Avatar alt={member.name} src={member.avatar} /> : 
                                  <Avatar>{member ? member.name.charAt(0) : '?'}</Avatar>
                                }
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      );
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 224,
                          width: 250,
                        },
                      },
                    }}
                    className="assignee-select"
                  >
                    {availableMembers && availableMembers.length > 0 ? (
                      availableMembers.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          <Checkbox checked={newTask.assignees.indexOf(member.id) > -1} />
                          <ListItemText 
                            primary={member.name} 
                            secondary={member.role || 'Team Member'} 
                          />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No team members available</MenuItem>
                    )}
                  </Select>
                </FormControl>
                {errors.assignees && <p className="form-error">{errors.assignees}</p>}
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={newTask.isFreelance}
                    onChange={(e) => setNewTask({...newTask, isFreelance: e.target.checked})}
                    name="isFreelance"
                  />
                  This is a freelance task
                </label>
              </div>

              {newTask.isFreelance && (
                <div className="form-group">
                  <div className="form-row">
                    <div className="form-col">
                      <label className="form-label">Estimated Hours</label>
                      <input
                        type="number"
                        name="estimatedHours"
                        value={newTask.estimatedHours}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                      {errors.estimatedHours && <p className="form-error">{errors.estimatedHours}</p>}
                    </div>
                    <div className="form-col">
                      <label className="form-label">Hourly Rate ($)</label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={newTask.hourlyRate}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                      {errors.hourlyRate && <p className="form-error">{errors.hourlyRate}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="task-dialog-actions">
              <button onClick={handleClose} className="cancel-button">
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={isSubmitting}
                className="submit-button"
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className="snackbar">
          <div className={`snackbar-alert ${snackbar.severity}`}>
            <span>{snackbar.message}</span>
            <button onClick={handleCloseSnackbar} className="close-button">
              <CloseIcon />
            </button>
          </div>
        </div>
      )}


<TaskDetailsDialog
  isOpen={taskDetailsOpen} 
  onClose={handleCloseTaskDetails}
  task={selectedTask}
  findAssigneeNames={findAssigneeNames}
/>
    </div>
  );
};

export default TaskBoard;