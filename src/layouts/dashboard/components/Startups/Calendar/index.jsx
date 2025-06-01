import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Chip,
  OutlinedInput,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from "@mui/material";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DesktopDateTimePicker } from '@mui/x-date-pickers';
import { createTask, deleteTask } from '../../../../../api/task.js';

const locales = {
  'en-US': import('date-fns/locale/en-US'),
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

function CustomToolbar(toolbar) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
      <Typography variant="h4" sx={{ fontWeight: 700, ml: 2 }}>Calendar</Typography>
      <Button
        variant="contained"
        sx={{
          bgcolor: "#4318FF",
          borderRadius: '20px',
          px: 3,
          py: 1,
          fontWeight: 600,
          boxShadow: '0px 4px 20px rgba(67, 24, 255, 0.15)',
          mr: 2,
          textTransform: 'none',
          '&:hover': { bgcolor: '#3311CC' }
        }}
        onClick={toolbar.onScheduleMeeting}
      >
        Schedule Meeting
      </Button>
    </Box>
  );
}

const Calendar = ({tasks, members, startupId, taskStatuses}) => {
  const statusId = taskStatuses.find(status => status.name === 'To Do').id;
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isNewMeeting, setIsNewMeeting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    desc: '',
    link: '',
    start: null,
    end: null,
    type: 'meeting',
    assignees: [],
    statusId: statusId,
  });


  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Filter for meeting tasks
        const isMeetingTask = (tasks) => {
          return tasks.isMeeting === 1 ||
          tasks.title.toLowerCase().includes("meeting") ||
            (tasks.description && tasks.description.toLowerCase().includes("meeting link"));
        };

        const meetingTasks = tasks.filter(isMeetingTask).map(task => ({
          id: task.id,
          title: task.title,
          start: new Date(task.dueDate),
          end: new Date(task.dueDate),
          desc: task.description,
          color: '#4318FF'
        }));

        setEvents(meetingTasks);
      } catch (error) {
        console.error('Error fetching startup tasks:', error);
      }
    };

    fetchTasks();
  }, [tasks, members]);

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({ ...newEvent, start, end });
    setIsNewMeeting(true);
    setSelectedEvent(null);
    setOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsNewMeeting(false);
    setOpen(true);
  };

  const handleScheduleMeeting = () => {
    setIsNewMeeting(true);
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      desc: '',
      link: '',
      start: null,
      end: null,
      type: 'meeting',
      assignees: [],
    });
    setOpen(true);
  };

  const handleAddEvent = async () => {
    try {
      // Create task data object matching the required API structure
      const taskData = {
        title: newEvent.title,
        description: newEvent.desc,
        dueDate: newEvent.start,
        startTime: newEvent.start,
        endTime: newEvent.end,
        assigneeIds: newEvent.assignees,
        startupId: startupId,
        statusId: statusId,
        priority: "medium",
        isMeeting: 1,
        meetingLink: newEvent.link
      };

      // Call the API to create the task
      const createdTask = await createTask(taskData);

      // Add the new event to the calendar
      setEvents([
        ...events,
        {
          ...newEvent,
          id: createdTask.id,
          color: '#4318FF',
        },
      ]);

      setOpen(false);
      setNewEvent({ title: '', desc: '', link: '', start: null, end: null, type: 'meeting', assignees: [] });
    } catch (error) {
      console.error('Error creating meeting:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      if (selectedEvent && selectedEvent.id) {
        await deleteTask(selectedEvent.id);
        // Remove the event from the calendar
        setEvents(events.filter(event => event.id !== selectedEvent.id));
        setOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      // You might want to show an error message to the user here
    }
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '8px',
        color: 'white',
        border: 'none',
        display: 'block',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '0px 2px 8px rgba(67, 24, 255, 0.10)'
      }
    };
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '80vh' }}>
      <Grid container>
        <Grid item xs={12}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700, background: 'white', borderRadius: 20, padding: 24 }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            selectable
            popup
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: (props) => <>
                <CustomToolbar {...props} onScheduleMeeting={handleScheduleMeeting} />
                {props.label && (
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <Button onClick={() => props.onNavigate('TODAY')} sx={{ mr: 1 }}>Today</Button>
                    <Button onClick={() => props.onNavigate('PREV')} sx={{ mr: 1 }}>Back</Button>
                    <Button onClick={() => props.onNavigate('NEXT')}>Next</Button>
                    <Typography variant="h6" sx={{ mx: 2 }}>{props.label}</Typography>
                    <Button onClick={() => props.onView('month')} sx={{ ml: 1 }}>Month</Button>
                    <Button onClick={() => props.onView('week')} sx={{ ml: 1 }}>Week</Button>
                    <Button onClick={() => props.onView('day')} sx={{ ml: 1 }}>Day</Button>
                  </Box>
                )}
              </>,
            }}
            messages={{
              month: 'Month',
              week: 'Week',
              day: 'Day',
              today: 'Today',
            }}
          />
        </Grid>
      </Grid>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 2
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: 22, pb: 0 }}>
            {isNewMeeting ? 'Schedule New Meeting' : selectedEvent?.title}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {!isNewMeeting && selectedEvent ? (
              <>
                <Typography variant="h6">Description:</Typography>
                <Typography>{selectedEvent.desc}</Typography>
                <Typography variant="h6">Start Time:</Typography>
                <Typography>{format(new Date(selectedEvent.start), 'dd-MM-yyyy HH:mm')}</Typography>
                <Typography variant="h6">End Time:</Typography>
                <Typography>{format(new Date(selectedEvent.end), 'dd-MM-yyyy HH:mm')}</Typography>
                {selectedEvent.link && (
                  <>
                    <Typography variant="h6">Meeting Link:</Typography>
                    <Typography>{selectedEvent.link}</Typography>
                  </>
                )}
                {selectedEvent.assignees && selectedEvent.assignees.length > 0 && (
                  <>
                    <Typography variant="h6">Assignees:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {selectedEvent.assignees.map((assigneeId) => {
                        const member = members.find(m => m.id === assigneeId);
                        return (
                          <Chip 
                            key={assigneeId} 
                            label={member?.name || assigneeId}
                            sx={{ bgcolor: '#F0F1F6', color: '#444' }}
                          />
                        );
                      })}
                    </Box>
                  </>
                )}
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Title"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  minRows={3}
                  value={newEvent.desc}
                  onChange={e => setNewEvent({ ...newEvent, desc: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Meeting Link"
                  value={newEvent.link}
                  onChange={e => setNewEvent({ ...newEvent, link: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <DesktopDateTimePicker
                  label="Start Time"
                  value={newEvent.start}
                  onChange={val => setNewEvent({ ...newEvent, start: val })}
                  inputFormat="dd-MM-yyyy HH:mm"
                  renderInput={(params) => <TextField fullWidth sx={{ mb: 2, input: { color: '#222' } }} {...params} />}
                />
                <DesktopDateTimePicker
                  label="End Time"
                  value={newEvent.end}
                  onChange={val => setNewEvent({ ...newEvent, end: val })}
                  inputFormat="dd-MM-yyyy HH:mm"
                  renderInput={(params) => <TextField fullWidth sx={{ mb: 2, input: { color: '#222' } }} {...params} />}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <label className="form-label">Assignees</label>
                  <select
                    multiple
                    name="assignees"
                    value={newEvent.assignees}
                    onChange={e => {
                      const { options } = e.target;
                      const value = [];
                      for (let i = 0, l = options.length; i < l; i++) {
                        if (options[i].selected) {
                          value.push(options[i].value);
                        }
                      }
                      setNewEvent({ ...newEvent, assignees: value });
                    }}
                    className="form-input"
                    style={{ minHeight: 40 }}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ pb: 2, pr: 3, pl: 3 }}>
            <Button
              onClick={() => {
                setOpen(false);
                setSelectedEvent(null);
                setIsNewMeeting(false);
              }}
              sx={{
                bgcolor: '#F0F1F6',
                color: '#444',
                borderRadius: '20px',
                px: 3,
                fontWeight: 600,
                mr: 1,
                '&:hover': { bgcolor: '#E0E1E6' }
              }}
            >
              Cancel
            </Button>
            {isNewMeeting ? (
              <Button
                onClick={handleAddEvent}
                variant="contained"
                sx={{
                  background: 'linear-gradient(90deg, #4318FF 0%, #1E1EFA 100%)',
                  color: 'white',
                  borderRadius: '20px',
                  px: 3,
                  fontWeight: 600,
                  boxShadow: '0px 4px 20px rgba(67, 24, 255, 0.15)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #3311CC 0%, #1E1EFA 100%)',
                  }
                }}
              >
                Schedule Meeting
              </Button>
            ) : (
              <Button
                onClick={handleDeleteMeeting}
                variant="contained"
                sx={{
                  bgcolor: '#FF4B4B',
                  color: 'white',
                  borderRadius: '20px',
                  px: 3,
                  fontWeight: 600,
                  boxShadow: '0px 4px 20px rgba(255, 75, 75, 0.15)',
                  '&:hover': {
                    bgcolor: '#CC3B3B',
                  }
                }}
              >
                Delete Meeting
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
};
  
export default Calendar;