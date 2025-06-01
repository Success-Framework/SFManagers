import { Modal, Box, Typography, Button } from "@mui/material";
import VuiBox from "@/components/VuiBox";
import VuiTypography from "@/components/VuiTypography";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

function TaskModal({ open, handleClose, task }) {
  if (!task) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="task-modal-title"
    >
      <Box sx={style}>
        <VuiTypography variant="h5" color="white" fontWeight="bold" mb={2}>
          Task Details
        </VuiTypography>
        
        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Startup Name: {task.startupName}
          </VuiTypography>
        </VuiBox>

        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Task Name: {task.title}
          </VuiTypography>
        </VuiBox>

        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Task Details: {task.details}
          </VuiTypography>
        </VuiBox>

        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Due Date: {new Date(task.dueDate).toLocaleDateString()}
          </VuiTypography>
        </VuiBox>

        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Priority: {task.priority}
          </VuiTypography>
        </VuiBox>

        {/* <VuiBox mb={3}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Assignees: {task.assignees?.join(", ")}
          </VuiTypography>
        </VuiBox> */}
        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Assignees: {task.assignees.map(assignee => assignee.name).join(", ")}
          </VuiTypography>
        </VuiBox>
        <VuiBox mb={2}>
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Created By: {task.creatorName}
          </VuiTypography>
        </VuiBox>

        <Button
          variant="contained"
          color="info"
          fullWidth
          onClick={handleClose}
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
}

export default TaskModal; 