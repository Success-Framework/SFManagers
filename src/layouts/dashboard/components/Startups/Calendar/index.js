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


const locales = {
  'en-US': require('date-fns/locale/en-US'),
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

const Calendar = ({tasks , members}) => {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    desc: '',
    link: '',
    start: null,
    end: null,
    type: 'meeting',
    assignees: [],
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
          start: new Date(task.dueDate), // Adjust as necessary
          end: new Date(task.dueDate), // Adjust as necessary
          desc: task.description,
          color: '#4318FF' // Set color for meetings
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
    setOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setOpen(true);
  };

  const handleAddEvent = () => {
    setEvents([
      ...events,
      {
        ...newEvent,
        id: Date.now(),
        color: newEvent.type === 'meeting' ? '#4318FF' : '#05CD99',
      },
    ]);
    setOpen(false);
    setNewEvent({ title: '', desc: '', link: '', start: null, end: null, type: 'meeting', assignees: [] });
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '8px',
        color: 'black',
        border: 'none',
        display: 'block',
        fontWeight: 600,
        fontSize: '1rem',
        boxShadow: '0px 2px 8px rgba(67, 24, 255, 0.10)'
      }
    };
  };

  console.log('DEBUG: Calendar members prop:', members);
  console.log('DEBUG: newEvent.assignees:', newEvent.assignees);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '80vh' }}>
      <Grid container>
        <Grid item xs={12}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700, background: 'white', borderRadius: 20, padding: 24, color: 'black',fontPalette: 'dark' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            selectable
            popup
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: (props) => <>
                <CustomToolbar {...props} onScheduleMeeting={() => setOpen(true)} />
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
            {selectedEvent ? selectedEvent.title : 'Schedule Meeting'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedEvent ? (
              <>
                <Typography variant="h6">Description:</Typography>
                <Typography>{selectedEvent.desc}</Typography>
                <Typography variant="h6">Start Time:</Typography>
                <Typography>{format(new Date(selectedEvent.start), 'dd-MM-yyyy HH:mm')}</Typography>
                <Typography variant="h6">End Time:</Typography>
                <Typography>{format(new Date(selectedEvent.end), 'dd-MM-yyyy HH:mm')}</Typography>
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
                  format="MM/dd/yyyy HH:mm:ss"
                  slotProps={{
                    textField: { fullWidth: true, sx: { mb: 2, input: { color: '#222' } } }
                  }}
                />
                <DesktopDateTimePicker
                  label="End Time"
                  value={newEvent.end}
                  onChange={val => setNewEvent({ ...newEvent, end: val })}
                  format="MM/dd/yyyy HH:mm:ss"
                  slotProps={{
                    textField: { fullWidth: true, sx: { mb: 2, input: { color: 'black' } } }
                  }}
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
              onClick={() => setOpen(false)}
              sx={{
                bgcolor: '#F0F1F6',
                color: 'black',
                borderRadius: '20px',
                px: 3,
                fontWeight: 600,
                mr: 1,
                '&:hover': { bgcolor: '#E0E1E6' }
              }}
            >
              Cancel
            </Button>
            {!selectedEvent && (
              <Button
                onClick={handleAddEvent}
                variant="contained"
                sx={{
                  background: 'linear-gradient(90deg, #4318FF 0%, #1E1EFA 100%)',
                  color: 'black',
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
            )}
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
};

export default Calendar; 