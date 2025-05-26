import { Card, Button } from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { FaTasks } from "react-icons/fa";
import { useState } from "react";
import TaskModal from "./TaskModal";


function Tasks({ tasks }) {
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

  return (
    <Card>
      <VuiBox p={3}>
        <VuiBox>
          {tasks.map((task) => (
            <VuiBox key={task.id} mb={2} p={2} sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <VuiTypography variant="button" color="white" fontWeight="bold">
                {task.title}
              </VuiTypography>
              <VuiBox display="flex" justifyContent="space-between" mt={1}>
                <VuiTypography variant="caption" color="text" fontWeight="regular">
                  Priority: {task.priority}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" fontWeight="regular">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="caption" color={task.statusName === "In Progress" ? "info" : task.statusName === "To Do" ? "warning" : "text"} fontWeight="regular">
                Status: {task.statusName}
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