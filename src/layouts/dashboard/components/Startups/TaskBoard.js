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
  OutlinedInput
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { getStartupMembers } from "../../../../api/startup.js"; // Adjust the import path as necessary
import { getStartupTasks, createTask, getTaskStatuses, updateTaskStatus } from "../../../../api/task.js"; // Adjust the import path as necessary  



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

const TaskBoard = ({ startupId }) => {
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
    status: 'To Do' || 'In Progress' || 'Review' || 'Done',
    assignees: [],
    isFreelance: false,
    estimatedHours: '',
    hourlyRate: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);

  const fetchData = async () => {
    try {
      const [tasks, membersData, statuses] = await Promise.all([
        getStartupTasks(startupId),
        getStartupMembers(startupId),
        getTaskStatuses(startupId),
      ]);
  
      console.log("Fetched task statuses:", statuses);
  
      if (!Array.isArray(tasks)) {
        throw new Error("Expected tasks to be an array");
      }
  
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
  
        // Skip task if statusName is null or not a string
        if (typeof statusName !== 'string') {
          console.warn(`Skipping task with invalid statusName:`, task);
          return;
        }
  
        const statusKey = statusName.toLowerCase().replace(" ", "");
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
      setMembers(membersData);
      setTaskStatuses(statuses);
    } catch (err) {
      console.error("Error fetching tasks, members, or statuses:", err);
      setError("Error fetching tasks, members, or statuses.");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchData();
  }, [startupId]);

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
      status:'To Do' || 'In Progress' || 'Review' || 'Done',
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
    if (!newTask.title) newErrors.title = 'Title is required';
    if (!newTask.description) newErrors.description = 'Description is required';
    if (!newTask.startDate) newErrors.startDate = 'Start Date is required';
    if (!newTask.dueDate) newErrors.dueDate = 'Due Date is required';
    if (newTask.startDate && newTask.dueDate && newTask.startDate > newTask.dueDate) {
      newErrors.startDate = 'Start date cannot be after due date.';
      newErrors.dueDate = 'Due date cannot be before start date.';
    }
    if (newTask.isFreelance) {
      if (!newTask.estimatedHours) newErrors.estimatedHours = 'Estimated Hours is required for freelance tasks';
      if (!newTask.hourlyRate) newErrors.hourlyRate = 'Hourly Rate is required for freelance tasks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {

        // Find the status ID based on the status name
        const statusObj = taskStatuses.find(status => 
          status.name.replace(/\s+/g, '').toLowerCase() === newTask.status.replace(/\s+/g, '').toLowerCase()
        );
        const statusId = statusObj ? statusObj.id : null;


        const taskData = {
          title: newTask.title,
          description: newTask.description,
          startDate: newTask.startDate,
          dueDate: newTask.dueDate,
          priority: newTask.priority.toLowerCase(),
          statusId: statusId,
          assigneeIds: newTask.assignees?.map(id => members?.find(member => member.id === id)?.id).filter(id => id !== undefined),
          startupId: startupId,
          isFreelance: newTask.isFreelance,
        };


        const createdTask = await createTask(taskData);
        setColumns(prevColumns => ({
          ...prevColumns,
          [statusId]: {
            ...prevColumns[statusId],
            tasks: [...prevColumns[statusId].tasks, createdTask],
          },
        }));
        handleClose();
      } catch (error) {
        console.error("Error creating task:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const findAssigneeNames = (assigneeIds) => {
    return assigneeIds.map(id => members.find(member => member.id === id)?.name).filter(name => name !== undefined);
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Box sx={{ p: 3, height: '100%', bgcolor: 'background.default' }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2 }}>
          {Object.values(columns).map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minWidth: 300,
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(112, 144, 176, 0.1)',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'calc(100vh - 200px)',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {column.title} ({column.tasks.length})
                  </Typography>
                  <Box sx={{ overflowY: 'auto', flexGrow: 1,
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(112, 144, 176, 0.1)',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(112, 144, 176, 0.3)',
                      borderRadius: '3px',
                      '&:hover': {
                        background: 'rgba(112, 144, 176, 0.5)',
                      },
                    },
                  }}>
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 2,
                              borderRadius: '12px',
                              background: getCardGradient(task.status),
                              color: 'white',
                              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(112, 144, 176, 0.1)',
                              '&:hover': {
                                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
                              },
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>{task.title}</Typography>
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  sx={{
                                    bgcolor: getPriorityColor(task.priority),
                                    color: 'white',
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                {task.description}
                              </Typography>
                              {task.isFreelance && (
                                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                  Estimated: {task.estimatedHours} hours @ ${task.hourlyRate}/hr
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={`Due: ${task.dueDate}`}
                                  size="small"
                                  icon={<CalendarTodayIcon style={{ color: 'white' }} />}
                                  sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    '.MuiChip-icon': { color: 'white' }
                                  }}
                                />
                                {findAssigneeNames(task.assignees).map(assigneeName => (
                                  <Chip
                                    key={assigneeName}
                                    label={assigneeName}
                                    size="small"
                                    icon={<PersonIcon style={{ color: 'white' }} />}
                                    sx={{
                                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                                      color: 'white',
                                      borderRadius: '8px',
                                      '.MuiChip-icon': { color: 'white' }
                                    }}
                                  />
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                  <Button
                    onClick={() => handleOpen(column.id)}
                    startIcon={<AddIcon />}
                    sx={{
                      mt: 2,
                      bgcolor: "#4318FF",
                      px: 3,
                      py: 1,
                      borderRadius: '12px',
                      textTransform: 'none',
                      color: 'white',
                      boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)',
                      '&:hover': {
                        bgcolor: "#3311CC",
                        boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)',
                      }
                    }}
                  >
                    Add Task
                  </Button>
                </Paper>
              )}
            </Droppable>
          ))}
        </Box>
      </DragDropContext>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', bgcolor: 'background.paper' } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Add New Task</Typography>
          <IconButton onClick={handleClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Task Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newTask.title}
            onChange={handleInputChange}
            error={!!errors.title}
            helperText={errors.title}
            inputProps={{ maxLength: 100 }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Task Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTask.description}
            onChange={handleInputChange}
            error={!!errors.description}
            helperText={errors.description}
            inputProps={{ maxLength: 500 }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              name="priority"
              value={newTask.priority}
              label="Priority"
              onChange={handleInputChange}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              name="startDate"
              label="Start Date"
              type="date"
              value={newTask.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate}
            />
            <TextField
              fullWidth
              margin="dense"
              name="dueDate"
              label="Due Date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => handleDateChange('dueDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={!!errors.dueDate}
              helperText={errors.dueDate}
            />
          </Box>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
             <InputLabel id="assignees-label">Assignees</InputLabel>
             <Select
               labelId="assignees-label"
               multiple
               name="assignees"
               value={newTask.assignees}
               onChange={handleAssigneeChange}
               input={<OutlinedInput id="select-multiple-chip" label="Assignees" />}
               renderValue={(selected) => (
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                   {selected.map((value) => (
                     <Chip key={value} label={members.find(member => member.id === value)?.name || value} />
                   ))}
                 </Box>
               )}
               MenuProps={MenuProps}
             >
               {members.map((member) => (
                 <MenuItem key={member.id} value={member.id}>
                   {member.name}
                 </MenuItem>
               ))}
             </Select>
           </FormControl>
           <FormGroup>
                <FormControlLabel
                    control={
                        <Switch
                            checked={newTask.isFreelance}
                            onChange={(e) => setNewTask({...newTask, isFreelance: e.target.checked})}
                            name="isFreelance"
                        />
                    }
                    label="This is a freelance task"
                />
           </FormGroup>
            {newTask.isFreelance && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        fullWidth
                        margin="dense"
                        name="estimatedHours"
                        label="Estimated Hours"
                        type="number"
                        value={newTask.estimatedHours}
                        onChange={handleInputChange}
                        error={!!errors.estimatedHours}
                        helperText={errors.estimatedHours}
                    />
                    <TextField
                        fullWidth
                        margin="dense"
                        name="hourlyRate"
                        label="Hourly Rate ($)"
                        type="number"
                        value={newTask.hourlyRate}
                        onChange={handleInputChange}
                        error={!!errors.hourlyRate}
                        helperText={errors.hourlyRate}
                    />
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>Cancel</Button>
          <Button onClick={handleAddTask} variant="contained" disabled={isSubmitting} sx={{ bgcolor: "#4318FF", px: 3, textTransform: 'none', borderRadius: '12px', boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)', '&:hover': { bgcolor: "#3311CC", boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)' } }}>
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskBoard; 