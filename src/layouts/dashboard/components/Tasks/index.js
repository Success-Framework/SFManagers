import { Card, Button } from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { FaTasks } from "react-icons/fa";
import { useState } from "react";
import TaskModal from "./TaskModal";

const dummyTasks = [
  {
    id: 1,
    title: "Review pitch deck",
    priority: "High",
    dueDate: "2024-03-25",
    status: "In Progress",
    startupName: "TechVision AI",
    details: "Review and provide feedback on the latest pitch deck for investor meetings",
    assignees: ["John Smith", "Sarah Johnson"]
  },
  {
    id: 2,
    title: "Schedule investor meetings",
    priority: "Medium",
    dueDate: "2024-03-28",
    status: "Pending",
    startupName: "GreenEnergy Solutions",
    details: "Coordinate with potential investors and schedule follow-up meetings",
    assignees: ["Mike Brown", "Emma Wilson"]
  },
  {
    id: 3,
    title: "Update financial projections",
    priority: "High",
    dueDate: "2024-03-30",
    status: "Not Started",
    startupName: "HealthTech Plus",
    details: "Update Q2 financial projections based on latest market data",
    assignees: ["David Lee", "Lisa Chen"]
  },
  {
    id: 4,
    title: "Prepare quarterly report",
    priority: "Low",
    dueDate: "2024-04-01",
    status: "Not Started",
    startupName: "TechVision AI",
    details: "Compile and prepare the quarterly performance report",
    assignees: ["Alex Turner", "Rachel Green", "Mark Johnson"]
  }
];

function Tasks({ title, userId }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const filteredTasks = dummyTasks.filter(task =>
    task.assignees.includes(userId)
  );

  return (
    <Card>
      <VuiBox p={3}>
        <VuiBox display="flex" alignItems="center" mb={2}>
          <VuiBox
            bgColor="info"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ borderRadius: "6px", width: "40px", height: "40px" }}
          >
            <FaTasks color="#fff" size="20px" />
          </VuiBox>
          <VuiTypography variant="lg" color="white" fontWeight="bold" ml={2}>
            {title}
          </VuiTypography>
        </VuiBox>
        <VuiBox>
          {filteredTasks.map((task) => (
            <VuiBox key={task.id} mb={2} p={2} sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <VuiTypography variant="button" color="white" fontWeight="bold">
                {task.title}
              </VuiTypography>
              <VuiBox display="flex" justifyContent="space-between" mt={1}>
                <VuiTypography variant="caption" color="text" fontWeight="regular">
                  Priority: {task.priority}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" fontWeight="regular">
                  Due: {task.dueDate}
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="caption" color={task.status === "In Progress" ? "info" : task.status === "Pending" ? "warning" : "text"} fontWeight="regular">
                Status: {task.status}
              </VuiTypography>
              <VuiBox mt={2}>
                <Button
                  variant="contained"
                  color="info"
                  size="small"
                  fullWidth
                  onClick={() => handleViewDetails(task)}
                  sx={{
                    background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                    boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)",
                    }
                  }}
                >
                  View Details
                </Button>
              </VuiBox>
            </VuiBox>
          ))}
        </VuiBox>
      </VuiBox>
      <TaskModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        task={selectedTask}
      />
    </Card>
  );
}

export default Tasks;