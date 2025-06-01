import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { format, isSameDay, parseISO } from 'date-fns';
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import TaskIcon from "@mui/icons-material/Task";

// Sample data for meetings and tasks
const initialEvents = [
  {
    id: 1,
    title: "Team Standup",
    type: "meeting",
    date: "2024-03-20T10:00:00",
    duration: 30,
    description: "Daily team standup meeting",
    attendees: ["John Doe", "Jane Smith"],
    color: "#4318FF"
  },
  {
    id: 2,
    title: "Project Review",
    type: "meeting",
    date: "2024-03-21T14:00:00",
    duration: 60,
    description: "Quarterly project review meeting",
    attendees: ["John Doe", "Mike Johnson"],
    color: "#FFB547"
  },
  {
    id: 3,
    title: "Complete Documentation",
    type: "task",
    date: "2024-03-20T15:00:00",
    description: "Update project documentation",
    assignee: "Sarah Wilson",
    color: "#05CD99"
  }
];

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState(initialEvents);
  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting',
    date: '',
    time: '',
    duration: 30,
    description: '',
    attendees: [],
    assignee: '',
  });

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };

  const handleAddEvent = () => {
    const event = {
      id: Date.now(),
      ...newEvent,
      date: `${newEvent.date}T${newEvent.time}`,
      color: newEvent.type === 'meeting' ? '#4318FF' : '#05CD99'
    };

    setEvents([...events, event]);
    setOpen(false);
    setNewEvent({
      title: '',
      type: 'meeting',
      date: '',
      time: '',
      duration: 30,
      description: '',
      attendees: [],
      assignee: '',
    });
  };

  const handleClose = () => {
    setOpen(false);
    setNewEvent({
      title: '',
      type: 'meeting',
      date: '',
      time: '',
      duration: 30,
      description: '',
      attendees: [],
      assignee: '',
    });
  };

  return (
    <Box sx={{ p: 3, height: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ 
          color: "text.primary",
          fontWeight: 700,
          letterSpacing: '-0.5px',
          fontSize: '1.5rem'
        }}>
          Calendar
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
          sx={{ 
            bgcolor: "#4318FF",
            px: 3,
            py: 1,
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)',
            '&:hover': {
              bgcolor: "#3311CC",
              boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)',
            }
          }}
        >
          Add Event
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              bgcolor: 'background.paper',
              border: '1px solid rgba(112, 144, 176, 0.1)',
              height: '100%'
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={handleDateChange}
                sx={{
                  '& .MuiPickersDay-root': {
                    borderRadius: '12px',
                    '&.Mui-selected': {
                      bgcolor: '#4318FF',
                      '&:hover': {
                        bgcolor: '#3311CC',
                      }
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              bgcolor: 'background.paper',
              border: '1px solid rgba(112, 144, 176, 0.1)',
              height: '100%'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {getEventsForDate(selectedDate).map((event) => (
                <Paper
                  key={event.id}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: event.color,
                    color: 'white'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {event.type === 'meeting' ? <EventIcon /> : <TaskIcon />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {event.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    {event.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={event.type === 'meeting' ? 'Meeting' : 'Task'}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        borderRadius: '8px'
                      }}
                    />
                    {event.type === 'meeting' ? (
                      <Chip
                        label={`${event.duration} min`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          borderRadius: '8px'
                        }}
                      />
                    ) : (
                      <Chip
                        label={event.assignee}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          borderRadius: '8px'
                        }}
                      />
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)',
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(112, 144, 176, 0.1)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Add New Event
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box>
            <TextField
              fullWidth
              label="Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={newEvent.type}
                label="Event Type"
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              >
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="task">Task</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            {newEvent.type === 'meeting' && (
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={newEvent.duration}
                onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            {newEvent.type === 'meeting' ? (
              <TextField
                fullWidth
                label="Attendees"
                value={newEvent.attendees.join(', ')}
                onChange={(e) => setNewEvent({ 
                  ...newEvent, 
                  attendees: e.target.value.split(',').map(s => s.trim()) 
                })}
                helperText="Separate names with commas"
              />
            ) : (
              <TextField
                fullWidth
                label="Assignee"
                value={newEvent.assignee}
                onChange={(e) => setNewEvent({ ...newEvent, assignee: e.target.value })}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(112, 144, 176, 0.1)' }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddEvent}
            variant="contained"
            sx={{ 
              bgcolor: "#4318FF",
              px: 3,
              textTransform: 'none',
              borderRadius: '12px',
              boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.2)',
              '&:hover': {
                bgcolor: "#3311CC",
                boxShadow: '0px 18px 40px rgba(67, 24, 255, 0.3)',
              }
            }}
          >
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar; 