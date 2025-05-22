import React, { useState } from "react";
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

const startupMembers = [
  'trial@sfm.com',
  'john@sfm.com',
  'jane@sfm.com',
  'alex@sfm.com',
  'emma@sfm.com',
];

const initialEvents = [
  {
    id: 1,
    title: "Team Standup",
    start: new Date(2025, 4, 29, 10, 0),
    end: new Date(2025, 4, 29, 10, 30),
    desc: "Daily team standup meeting",
    type: "meeting",
    color: "#4318FF"
  },
  {
    id: 2,
    title: "Project Review",
    start: new Date(2025, 4, 29, 14, 0),
    end: new Date(2025, 4, 29, 15, 0),
    desc: "Quarterly project review meeting",
    type: "meeting",
    color: "#FFB547"
  },
  {
    id: 3,
    title: "Complete Documentation",
    start: new Date(2025, 4, 29, 15, 0),
    end: new Date(2025, 4, 29, 16, 0),
    desc: "Update project documentation",
    type: "task",
    color: "#05CD99"
  }
];

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

const Calendar = () => {
  const [events, setEvents] = useState(initialEvents);
  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    desc: '',
    link: '',
    start: null,
    end: null,
    type: 'meeting',
    assignees: [],
  });

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({ ...newEvent, start, end });
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
          <DialogTitle sx={{ fontWeight: 600, fontSize: 22, pb: 0 }}>Schedule Meeting</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
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
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={newEvent.assignees}
                onChange={e => setNewEvent({ ...newEvent, assignees: e.target.value })}
                input={<OutlinedInput label="Assignees" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {startupMembers.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ pb: 2, pr: 3, pl: 3 }}>
            <Button
              onClick={() => setOpen(false)}
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
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
};

export default Calendar; 