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
import { createTask, updateTaskStatus, getStartupTasks } from "../../../../api/task.js"; // Adjust the import path as necessary
import { getStartupMembers } from "../../../../api/startup.js"; // Import for fetching startup members
import "./TaskBoard.css";
import TaskDetailsDialog from './TaskDetailsDialog';

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
    case 'review':
      return '#05CD99'; // Green
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
    case 'review':
      return 'linear-gradient(180deg, rgba(5, 205, 153, 0.3) 0%, rgba(5, 205, 153, 0) 100%)';
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
    review: { id: 'review', title: 'Review', tasks: [] },
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

  // State for storing fetched members and tasks if not provided via props
  const [localMembers, setLocalMembers] = useState([]);
  const [localTasks, setLocalTasks] = useState([]);
  
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
  
  // Fetch startup tasks if not provided via props
  useEffect(() => {
    const fetchStartupTasks = async () => {
      if (!tasks || tasks.length === 0) {
        try {
          setLoading(true);
          console.log('Fetching tasks for startup ID:', startupId);
          const response = await getStartupTasks(startupId);
          console.log('Fetched startup tasks:', response);
          setLocalTasks(response);
        } catch (error) {
          console.error('Error fetching startup tasks:', error);
          setError('Failed to load tasks');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchStartupTasks();
  }, [startupId, tasks]);
  
  // Use provided members or fallback to locally fetched members
  const availableMembers = members && members.length > 0 ? members : localMembers;
  
  // Use provided tasks or fallback to locally fetched tasks
  const availableTasks = tasks && tasks.length > 0 ? tasks : localTasks;
  
  useEffect(() => {
    // Log members to debug
    console.log('Members available for task assignment:', availableMembers);
    
    // Debug logging for tasks
    console.log('Tasks received by TaskBoard component:', tasks);
    console.log('Local tasks fetched:', localTasks);
    console.log('Available tasks to display:', availableTasks);
    
    const newColumns = {
      todo: { id: 'todo', title: 'To Do', tasks: [] },
      inprogress: { id: 'inprogress', title: 'In Progress', tasks: [] },
      review: { id: 'review', title: 'Review', tasks: [] },
      done: { id: 'done', title: 'Done', tasks: [] },
    };

    const isMeetingTask = (task) => {
      return task.isMeeting === 1 ||
        task.title?.toLowerCase().includes("meeting") ||
        task.description?.toLowerCase().includes("meeting link");
    };

    // Use availableTasks instead of tasks
    if (!availableTasks || availableTasks.length === 0) {
      console.warn('No tasks available to display');
      setLoading(false);
      return;
    }

    availableTasks.forEach(task => {
      if (isMeetingTask(task)) {
        console.log("Skipping meeting task:", task.title);
        return; // ❌ Skip meeting tasks
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
      
      // First try to map by statusName if available
      if (statusName) {
        statusKey = statusName.toLowerCase().replace(/ /g, "");
      } 
      // If no statusName, try to map by status ID
      else if (task.status_id) {
        // Map status_id to column keys
        const statusMap = {
          1: 'todo',        // To Do
          2: 'inprogress', // In Progress
          3: 'review',     // Review
          4: 'done'        // Done
        };
        statusKey = statusMap[task.status_id] || 'todo';
      }
      
      console.log(`Task ${title} has status_id: ${task.status_id}, statusName: ${statusName}, mapped to: ${statusKey}`);
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
        console.warn(`Unknown status: ${statusKey}, placing task in 'To Do' column`);
        // If we can't determine the status, put it in the To Do column
        newColumns.todo.tasks.push(taskData);
      }
    });

    setColumns(newColumns);
    setLoading(false);
  }, [availableTasks]); // Updated dependency to use availableTasks

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

      // Call the API to update the task status
      try {
        const statusObj = taskStatuses.find(
          status => status.name?.toLowerCase().replace(" ", "") === newStatus.toLowerCase().replace(" ", "")
        );
        if (statusObj) {
          console.log(`Updating task ID: ${removed.id} to status ID: ${statusObj.id}`);
          const response = await updateTaskStatus(removed.id, statusObj.id);
          await getStartupTasks(startupId);
          console.log('API Response:', response);
        } else {
          console.warn(`Status object not found for status: ${newStatus}`);
        }
      } catch (error) {
        console.error("Error updating task status:", error);
      }

      destTasks.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          tasks: sourceTasks,
        },
        [destination.droppableId]: {
          ...destColumn,
          tasks: destTasks,
        },
      });
    } else {
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
      // Create base task data
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        startDate: newTask.startDate,
        dueDate: newTask.dueDate,
        statusId: 1, // Default to 'To Do' status
        startupId: startupId,
        assignees: newTask.assignees, // Send all assignees as an array
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
          avatar: member ? member.avatar : null
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
            tasks: updatedTodoTasks
          }
        };
      });
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Task created successfully!',
        severity: 'success',
        vertical: 'top',
        horizontal: 'center'
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
        horizontal: 'center'
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
          {/* Additional header controls could go here */}
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
                    {column.title} ({column.tasks.length})
                  </h3>
                  <div className="task-column-content">
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card status-${task.status}`}
                            onClick={() => handleTaskClick(task)}
                            style={{ cursor: 'pointer' }}
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
                <div className="form-col">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={newTask.status}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
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