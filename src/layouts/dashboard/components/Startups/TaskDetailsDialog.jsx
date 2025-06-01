import React, { useState, useEffect } from 'react';
import { Play, Square, Pause } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Box,
  Typography,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { startTaskTimer, stopTaskTimer, getTaskTimeLogs, pauseTaskTimer } from '../../../../api/taskTime';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return '#FF4D4F';
    case 'Medium':
      return '#FAAD14';
    case 'Low':
      return '#52C41A';
    default:
      return '#D9D9D9';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'todo':
      return '#4318FF';
    case 'inprogress':
      return '#FFB547';
    case 'review':
      return '#05CD99';
    case 'done':
      return '#1E1EFA';
    default:
      return '#D9D9D9';
  }
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TaskDetailsDialog = ({ isOpen, onClose, task, findAssigneeNames }) => {
  if (!task) return null;
  console.log(findAssigneeNames)
  
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLogs, setTimeLogs] = useState([]);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date();
        const sessionTime = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000);
        setElapsedTime(sessionTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentSessionStart]);

  useEffect(() => {
    if (isOpen && task) {
      fetchTimeLogs();
    }
  }, [isOpen, task]);

  const fetchTimeLogs = async () => {
    try {
      const logs = await getTaskTimeLogs(task.id);
      console.log(123098, logs.timeLogs);
      setTimeLogs(Array.isArray(logs.timeLogs) ? logs.timeLogs : []);
    } catch (error) {
      console.error('Error fetching time logs:', error);
      setTimeLogs([]);
    }
  };
  console.log(345, timeLogs);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    if (isRunning && !isPaused) {
      try {
        await pauseTaskTimer(task.id);
        setIsPaused(true);
        setIsRunning(false);
      } catch (error) {
        console.error('Error pausing timer:', error);
      }
    }
  };

  const handleStart = async () => {
    try {
      await startTaskTimer(task.id);
      setIsRunning(true);
      setIsPaused(false);
      setCurrentSessionStart(new Date());
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = async () => {
    if (currentSessionStart && isRunning) {
      try {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - currentSessionStart.getTime()) / 1000);
        
        await stopTaskTimer(task.id, {
          note: "Timer stopped manually",
          timeSpent: duration
        });

        const newLog = {
          id: (timeLogs?.length || 0) + 1,
          startTime: currentSessionStart,
          endTime,
          duration,
        };
        setTimeLogs((prev) => Array.isArray(prev) ? [...prev, newLog] : [newLog]);
        setIsRunning(false);
        setElapsedTime(0);
        setCurrentSessionStart(null);
        fetchTimeLogs(); // Refresh time logs after stopping
      } catch (error) {
        console.error('Error stopping timer:', error);
      }
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Task Details
        </Typography>
        <IconButton 
          onClick={onClose} 
          sx={{ color: 'white' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {task.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {task.description}
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip 
              label={task.priority}
              sx={{ 
                bgcolor: getPriorityColor(task.priority),
                color: 'white',
                fontWeight: 500
              }}
            />
            <Chip 
              label={task.status}
              sx={{ 
                bgcolor: getStatusColor(task.status),
                color: 'white',
                fontWeight: 500
              }}
            />
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Task Information
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body2">
                      {task.dueDate}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Assignees
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {findAssigneeNames(task.assignees).map(name => (
                        <Chip 
                          key={name}
                          label={name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Box>


        </Stack>
        <div className="text-center py-6 bg-gray-50 rounded-lg mt-4">
          <div className="text-4xl font-mono font-bold text-gray-800 mb-4">
            {formatTime(elapsedTime)}
          </div>
          <div className="flex justify-center gap-3">
            <Button
              onClick={handleStart}
              disabled={isRunning && !isPaused}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
              startIcon={<Play className="h-4 w-4" />}
            >
              Start
            </Button>
            <Button
              onClick={handlePause}
              disabled={!isRunning || isPaused}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
              startIcon={<Pause className="h-4 w-4" />}
            >
              Pause
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isRunning && !isPaused}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
              startIcon={<Square className="h-4 w-4" />}
            >
              Stop
            </Button>
          </div>
        </div>

        <div>
          <div className="font-semibold text-gray-700 mb-3 flex justify-between">
            <span>Time Logs</span>
            <span className="text-sm text-gray-500">Total: {formatTime(elapsedTime)}</span>
          </div>
          <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
            {!timeLogs || timeLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No time logs available</div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(timeLogs) && timeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col bg-white p-3 rounded-md shadow-sm"
                  >
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div className="col-span-1">
                        <div className="font-medium text-gray-900">User</div>
                        <div className="text-gray-600">{log.user?.name || '-'}</div>
                      </div>
                      <div className="col-span-1">
                        <div className="font-medium text-gray-900">Start Time</div>
                        <div className="text-gray-600">{formatDateTime(log.startTime)}</div>
                      </div>
                      <div className="col-span-1">
                        <div className="font-medium text-gray-900">End Time</div>
                        <div className="text-gray-600">{formatDateTime(log.endTime)}</div>
                      </div>
                      <div className="col-span-1">
                        <div className="font-medium text-gray-900">Duration</div>
                        <div className="font-mono font-semibold text-blue-600">
                          {formatTime(log.duration)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <div className="font-medium text-gray-900">Note</div>
                        <div className="text-gray-600">{log.note || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          color="primary"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsDialog;

        