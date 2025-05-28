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
  Alert
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import { createTask, updateTaskStatus, getStartupTasks } from "../../../../api/task.js"; // Adjust the import path as necessary  
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

  useEffect(() => {
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

    tasks.forEach(task => {
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

      const statusKey = statusName ? statusName.toLowerCase().replace(" ", "") : 'unknown';
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
        console.warn(`Unknown status: ${statusKey}`);
      }
    });

    setColumns(newColumns);
    setLoading(false);
  }, [tasks]);

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

  const handleAssigneeChange = (e) => {
    const { value } = e.target;
    setNewTask({
      ...newTask,
      assignees: typeof value === 'string' ? value.split(',') : value,
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
    
    if (!newTask.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!newTask.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!newTask.startDate) {
      newErrors.startDate = 'Start Date is required';
    }
    
    if (!newTask.dueDate) {
      newErrors.dueDate = 'Due Date is required';
    }
    
    if (newTask.startDate && newTask.dueDate && new Date(newTask.startDate) > new Date(newTask.dueDate)) {
      newErrors.startDate = 'Start date cannot be after due date.';
      newErrors.dueDate = 'Due date cannot be before start date.';
    }
    
    if (newTask.isFreelance) {
      if (!newTask.estimatedHours || newTask.estimatedHours <= 0) {
        newErrors.estimatedHours = 'Estimated Hours must be greater than 0';
      }
      if (!newTask.hourlyRate || newTask.hourlyRate <= 0) {
        newErrors.hourlyRate = 'Hourly Rate must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Find the status ID based on the status name
        const statusObj = taskStatuses?.find(status => 
          status?.name?.replace(/\s+/g, '').toLowerCase() === newTask.status?.replace(/\s+/g, '').toLowerCase()
        );
        
        if (!statusObj) {
          throw new Error('Invalid task status');
        }

        const taskData = {
          title: newTask.title?.trim(),
          description: newTask.description?.trim(),
          startDate: newTask.startDate,
          dueDate: newTask.dueDate,
          priority: newTask.priority?.toLowerCase(),
          statusId: statusObj.id,
          assigneeIds: newTask.assignees?.map(id => members?.find(member => member?.id === id)?.id).filter(Boolean) || [],
          startupId: startupId,
          isFreelance: newTask.isFreelance,
          estimatedHours: newTask.isFreelance ? newTask.estimatedHours : null,
          hourlyRate: newTask.isFreelance ? newTask.hourlyRate : null,
        };

        const createdTask = await createTask(taskData);
        await getStartupTasks(startupId);
        
        if (!createdTask) {
          throw new Error('Failed to create task');
        }

        // Update the columns with the new task
        setColumns(prevColumns => {
          const statusKey = statusObj.name?.toLowerCase().replace(/\s+/g, '');
          if (!prevColumns[statusKey]) {
            console.warn(`Unknown status key: ${statusKey}`);
            return prevColumns;
          }

          return {
            ...prevColumns,
            [statusKey]: {
              ...prevColumns[statusKey],
              tasks: [...prevColumns[statusKey].tasks, createdTask],
            },
          };
        });

        // Show success message with more prominent styling
        setSnackbar({
          open: true,
          message: '🎉 Task created successfully!',
          severity: 'success',
          vertical: 'top',
          horizontal: 'center'
        });

        handleClose();
      } catch (error) {
        console.error("Error creating task:", error);
        setError(error.message || 'Failed to create task. Please try again.');
        // Show error message
        setSnackbar({
          open: true,
          message: '❌ ' + (error.message || 'Failed to create task. Please try again.'),
          severity: 'error',
          vertical: 'top',
          horizontal: 'center'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const findAssigneeNames = (assigneeIds) => {
    return assigneeIds.map(id => members.find(member => member.id === id)?.name).filter(name => name !== undefined);
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
                <CloseIcon />
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
                <select
                  multiple
                  name="assignees"
                  value={newTask.assignees}
                  onChange={handleAssigneeChange}
                  className="form-input"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
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