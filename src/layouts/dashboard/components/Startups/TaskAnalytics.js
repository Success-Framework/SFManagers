import React from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Dummy data for analytics
const taskStatusData = [
  { name: "To Do", value: 8 },
  { name: "In Progress", value: 5 },
  { name: "Review", value: 3 },
  { name: "Done", value: 14 },
];
const COLORS = ["#4318FF", "#FFB547", "#05CD99", "#1E1EFA"];

const taskPriorityData = [
  { name: "High", value: 7 },
  { name: "Medium", value: 10 },
  { name: "Low", value: 13 },
];

const taskTableData = [
  { name: "Market Research", status: "To Do", priority: "High", assignees: "John, Jane", due: "2024-05-25" },
  { name: "User Testing", status: "In Progress", priority: "Medium", assignees: "Mike", due: "2024-05-28" },
  { name: "API Integration", status: "Review", priority: "High", assignees: "John, Sarah", due: "2024-05-24" },
  { name: "Code Review", status: "Review", priority: "Medium", assignees: "Jane, Alex", due: "2024-05-23" },
  { name: "Setup CI/CD", status: "Done", priority: "Low", assignees: "John, Mike", due: "2024-05-20" },
];

// Calculate user assignment analytics
const userTaskCount = {};
taskTableData.forEach(task => {
  task.assignees.split(',').map(a => a.trim()).forEach(user => {
    if (!userTaskCount[user]) userTaskCount[user] = 0;
    userTaskCount[user] += 1;
  });
});
const userTaskData = Object.entries(userTaskCount).map(([user, count]) => ({ user, count }));

const TaskAnalytics = () => {
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assignees</TableCell>
                  <TableCell>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taskTableData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell align="left">{row.name}</TableCell>
                    <TableCell align="left">{row.status}</TableCell>
                    <TableCell align="left">{row.priority}</TableCell>
                    <TableCell align="left">{row.assignees}</TableCell>
                    <TableCell align="left">{row.due}</TableCell>
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