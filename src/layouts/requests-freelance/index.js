import React, { useState } from "react";
import { Box, Typography, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Paper, Card, CardContent, Chip, Button } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Dummy startup members (needed to display assignee names)
const startupMembers = [
  { id: 1, name: 'John Doe', role: 'Developer' },
  { id: 2, name: 'Jane Smith', role: 'Designer' },
  { id: 3, name: 'Mike Johnson', role: 'Product Manager' },
  { id: 4, name: 'Sarah Wilson', role: 'Developer' },
  { id: 5, name: 'Alex Brown', role: 'Designer' }
];

// Dummy available freelance tasks data
const dummyAvailableFreelanceTasks = [
  {
    id: '6',
    title: 'Develop Landing Page',
    description: 'Create a responsive landing page for the new product.',
    priority: 'High',
    startDate: '2024-04-10',
    dueDate: '2024-04-17',
    status: 'todo',
    assignees: [], // Available tasks have no assignees yet
    isFreelance: true,
    estimatedHours: 20,
    hourlyRate: 40
  },
  {
    id: '7',
    title: 'Write Blog Post',
    description: 'Draft a blog post about the latest feature release.',
    priority: 'Medium',
    startDate: '2024-04-11',
    dueDate: '2024-04-15',
    status: 'todo',
    assignees: [],
    isFreelance: true,
    estimatedHours: 5,
    hourlyRate: 30
  },
];

// Dummy freelance tasks data (My Tasks)
const dummyMyFreelanceTasks = [
  {
    id: '5',
    title: 'Setup CI/CD',
    description: 'Configure continuous integration pipeline',
    priority: 'Low',
    startDate: '2024-03-15',
    dueDate: '2024-03-20',
    status: 'done',
    assignees: [1, 3],
    isFreelance: true,
    estimatedHours: 10,
    hourlyRate: 50
  },
  // Add more dummy freelance tasks here if needed
];

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

const getCardBackground = (status) => {
  // Use a simple background color or gradient for freelance tasks, 
  // or map to freelance-specific states if they exist.
  return 'rgba(112, 144, 176, 0.1)'; // Example neutral background
};

const findAssigneeNames = (assigneeIds) => {
  return assigneeIds.map(id => startupMembers.find(member => member.id === id)?.name).filter(name => name !== undefined);
};

function FreelanceTasks() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortBy, setSortBy] = useState('dueDate');
  const [filterByPosition, setFilterByPosition] = useState('all');

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleSortByChange = (event) => {
    setSortBy(event.target.value);
    // Implement sorting logic here
  };

  const handleFilterByPositionChange = (event) => {
    setFilterByPosition(event.target.value);
    // Implement filtering logic here
  };

  const handleApply = (taskId) => {
    console.log(`Apply for task ${taskId}`);
    // Implement apply logic here
  };

  const handleComplete = (taskId) => {
    console.log(`Complete task ${taskId}`);
    // Implement complete logic here
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiTypography variant="h4" color="white" mb={3}>
          Freelance Tasks
        </VuiTypography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="freelance tasks tabs"
            sx={{
              ".MuiTab-textColorPrimary": {
                color: 'black !important',
              },
            }}
          >
            <Tab label="Available Tasks"/>
            <Tab label="My Tasks"/>
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={handleSortByChange}
              label="Sort by"
            >
              <MenuItem value="dueDate">Due Date</MenuItem>
              {/* Add other sorting options here */}
            </Select>
          </FormControl>

          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel>Filter by Position</InputLabel>
            <Select
              value={filterByPosition}
              onChange={handleFilterByPositionChange}
              label="Filter by Position"
            >
              <MenuItem value="all">All</MenuItem>
              {/* Add other position filter options here */}
            </Select>
          </FormControl>

          <VuiTypography variant="caption" color="text" sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <InfoOutlinedIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
            Points represent task value based on payment and completion time. Higher points = more valuable tasks.
          </VuiTypography>
        </Box>

        <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'background.paper', border: '1px solid rgba(112, 144, 176, 0.1)' }}>
          {selectedTab === 0 && (
            <VuiBox>
              <VuiTypography variant="h6" color="black" mb={2}>Available Freelance Tasks</VuiTypography>
              {
                dummyAvailableFreelanceTasks.length > 0 ? (
                  dummyAvailableFreelanceTasks.map(task => (
                    <Card
                      key={task.id}
                      sx={{
                        mb: 2,
                        borderRadius: '12px',
                        background: getCardBackground(task.status),
                        color: 'white',
                        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(112, 144, 176, 0.1)',
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
                          {/* No assignees for available tasks */}
                        </Box>
                         <Box mt={2}>
                            <Button
                              variant="contained"
                              color="info"
                              size="small"
                              onClick={() => handleApply(task.id)}
                            >
                              Apply
                            </Button>
                         </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <VuiTypography color="text">No available freelance tasks at the moment.</VuiTypography>
                )
              }
            </VuiBox>
          )}
          {selectedTab === 1 && (
            <VuiBox>
              <VuiTypography variant="h6" color="black" mb={2}>My Freelance Tasks</VuiTypography>
              {
                dummyMyFreelanceTasks.length > 0 ? (
                  dummyMyFreelanceTasks.map(task => (
                    <Card
                      key={task.id}
                      sx={{
                        mb: 2,
                        borderRadius: '12px',
                        background: getCardBackground(task.status),
                        color: 'white',
                        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(112, 144, 176, 0.1)',
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
                        <Box mt={2}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleComplete(task.id)}
                            >
                              Complete
                            </Button>
                         </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <VuiTypography color="text">You haven't accepted any freelance tasks yet.</VuiTypography>
                )
              }
            </VuiBox>
          )}
        </Paper>

      </VuiBox>
    </DashboardLayout>
  );
}

export default FreelanceTasks; 