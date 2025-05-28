import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";



const TaskAnalytics = ({ tasks, members }) => {
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [taskPriorityData, setTaskPriorityData] = useState([]);
  const [taskTableData, setTaskTableData] = useState([]);


  useEffect(() => {
    setTaskStatusData(getTaskStatusData(tasks));
    setTaskPriorityData(getTaskPriorityData1(tasks));
    setTaskTableData(totalTaskCount(tasks));
  }, [tasks]);

  function getTaskStatusData(task) {
    const priorityCounts = {};
  
    task.forEach((data) => {
      const priority = data?.statusName;
      if (priority) {
        if (priorityCounts[priority]) {
          priorityCounts[priority] += 1;
        } else {
          priorityCounts[priority] = 1;
        }
      }
    });
  
    return Object.keys(priorityCounts).map((key) => ({
      name: key,
      value: priorityCounts[key],
    }));

  }

  function getTaskPriorityData1(tasks) {
    const priorityCounts = {};
  
    tasks.forEach((data) => {
      const priority = data?.priority;
      if (priority) {
        if (priorityCounts[priority]) {
          priorityCounts[priority] += 1;
        } else {
          priorityCounts[priority] = 1;
        }
      }
    });
  
    return Object.keys(priorityCounts).map((key) => ({
      name: key,
      value: priorityCounts[key],
    }));
  }
  
const COLORS = ["#4318FF", "#FFB547", "#05CD99", "#1E1EFA"];


function totalTaskCount(tasks) {
  return tasks.map(task => ({
    name: task.title,
    status: task.statusName,
    priority: task.priority,
    assignees: task.assignees,
    due: task.dueDate,
  }));
}



// Calculate user assignment analytics
const userTaskCount = {};
taskTableData.forEach(task => {
  // Check if assignees is an array and iterate over it
  task.assignees.forEach(user => {
    if (user && user.name) { // Ensure user object is valid and has a name
      if (!userTaskCount[user.name]) userTaskCount[user.name] = 0;
      userTaskCount[user.name] += 1;
    }
  });
});
// Convert userTaskCount to an array of objects
const userTaskData = Object.entries(userTaskCount).map(([user, count]) => ({ user, count }));
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={3} color="primary">Task Analytics</Typography>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 4 }}>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 320, flex: 1 }} elevation={3}>
          <Typography variant="h6" fontWeight={600} mb={2}>Task Status Distribution</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 320, flex: 1 }} elevation={3}>
          <Typography variant="h6" fontWeight={600} mb={2}>Task Priority</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskPriorityData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Bar dataKey="value" fill="#4318FF" radius={[8, 8, 0, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 320, flex: 1 }} elevation={3}>
          <Typography variant="h6" fontWeight={600} mb={2}>Tasks Assigned per User</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userTaskData}>
              <XAxis dataKey="user" />
              <YAxis allowDecimals={false} />
              <Bar dataKey="count" fill="#05CD99" radius={[8, 8, 0, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 4 }}>
        <Paper sx={{ p: 2, borderRadius: 3, minWidth: 320, flex: 1 }} elevation={3}>
          <Typography variant="h6" fontWeight={600} mb={2}>User Task Assignment</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Task Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userTaskData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell align="left">{row.user}</TableCell>
                    <TableCell align="left">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3, flex: 2 }} elevation={3}>
  <Typography variant="h6" fontWeight={600} mb={2}>Task Details</Typography>
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell><strong>Task Name</strong></TableCell>
          <TableCell><strong>Status</strong></TableCell>
          <TableCell><strong>Priority</strong></TableCell>
          <TableCell><strong>Assignees</strong></TableCell>
          <TableCell><strong>Due Date</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {taskTableData.map((task, idx) => (
          <TableRow key={idx}>
            <TableCell>{task.name}</TableCell>
            <TableCell>{task.status}</TableCell>
            <TableCell>{task.priority}</TableCell>
            <TableCell>
              {Array.isArray(task.assignees) && task.assignees.length > 0
                ? task.assignees.map(a => a?.name).join(", ")
                : "No Assignees"}
            </TableCell>
            <TableCell>{task.due}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Paper>

      </Box>
    </Box>
  );
};

export default TaskAnalytics; 