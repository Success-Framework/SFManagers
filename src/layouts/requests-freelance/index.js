import React, { useState, useEffect } from "react";
import { Box, Typography, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Paper, Card, CardContent, Chip, Button } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { getFreelanceTasks, getMyFreelanceTasks, acceptFreelanceTask, cancelFreelanceTask } from '../../api/task.js'; // Import the API functions

// Dummy startup members (needed to display assignee names)
const startupMembers = [
  { id: 1, name: 'John Doe', role: 'Developer' },
  { id: 2, name: 'Jane Smith', role: 'Designer' },
  { id: 3, name: 'Mike Johnson', role: 'Product Manager' },
  { id: 4, name: 'Sarah Wilson', role: 'Developer' },
  { id: 5, name: 'Alex Brown', role: 'Designer' }
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
  if (!assigneeIds) return []; // Return an empty array if assigneeIds is undefined
  return assigneeIds.map(id => startupMembers.find(member => member.id === id)?.name).filter(name => name !== undefined);
};

const FreelanceTasks = () => {
  const [availableFreelanceTasks, setAvailableFreelanceTasks] = useState([]); // State for available tasks
  const [myFreelanceTasks, setMyFreelanceTasks] = useState([]); // State for my tasks
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortBy, setSortBy] = useState('dueDate');
  const [filterByPosition, setFilterByPosition] = useState('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const availableTasks = await getFreelanceTasks(); // Fetch available freelance tasks
        const myTasks = await getMyFreelanceTasks(); // Fetch my freelance tasks
        setAvailableFreelanceTasks(availableTasks); // Set available tasks state
        setMyFreelanceTasks(myTasks); // Set my tasks state
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks(); // Call the fetch function
  }, []); // Empty dependency array to run once on mount

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleSortByChange = (event) => {
    const value = event.target.value;
    setSortBy(value);

    // Sort the tasks based on the selected criteria
    const sortedTasks = [...availableFreelanceTasks].sort((a, b) => {
      if (value === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (value === 'priority') {
        return a.priority.localeCompare(b.priority); // Assuming priority is a string
      } else if (value === 'title') {
        return a.title.localeCompare(b.title); // Assuming title is a string
      }
      return 0; // Default case
    });

    setAvailableFreelanceTasks(sortedTasks);
  };

  const handleFilterByPositionChange = (event) => {
    const value = event.target.value;
    setFilterByPosition(value);

    // Implement filtering logic here
    // Assuming you have a way to filter tasks by position
    // For example, if tasks have a position property
    const filteredTasks = myFreelanceTasks.filter(task => {
      if (value === 'all') return true; // Show all tasks
      return task.position === value; // Adjust this based on your task structure
    });

    setMyFreelanceTasks(filteredTasks);
  };

  const handleApply = async (taskId) => {
    try {
      const result = await acceptFreelanceTask(taskId); // Call the API to accept the freelance task
      console.log(`Accepted task ${taskId}:`, result);
      
      // Remove the task from the available tasks
      setAvailableFreelanceTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Optionally, you can add the task to myFreelanceTasks if needed
      setMyFreelanceTasks(prevTasks => [...prevTasks, result]); // Assuming result contains the task details

    } catch (error) {
      console.error('Error applying for task:', error);
    }
  };

  const handleCancel = async (taskId) => {
    try {
      const result = await cancelFreelanceTask(taskId); // Call the API to cancel the freelance task
      console.log(`Cancelled task ${taskId}:`, result);
      
      // Remove the task from my freelance tasks
      setMyFreelanceTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      // Optionally, you can add the task to availableFreelanceTasks if needed
      setAvailableFreelanceTasks(prevTasks => [...prevTasks, result]); // Assuming result contains the task details
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
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
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="title">Title</MenuItem>
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
              <MenuItem value="developer">Developer</MenuItem>
              <MenuItem value="designer">Designer</MenuItem>
              <MenuItem value="productManager">Product Manager</MenuItem>
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
                availableFreelanceTasks.length > 0 ? (
                  availableFreelanceTasks.map(task => (
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
                             label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                            size="small"
                            icon={<CalendarTodayIcon style={{ color: 'blue' }} />}
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
                myFreelanceTasks.length > 0 ? (
                  myFreelanceTasks.map(task => (
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
                            label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                            size="small"
                            icon={<CalendarTodayIcon style={{ color: 'blue' }} />}
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
                              onClick={() => handleCancel(task.id)}
                            >
                              Cancel
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
};

export default FreelanceTasks; 