import React from "react";
import { Modal, Box, Typography, TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel, Paper } from "@mui/material";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

function AddStartupModal({ open, handleClose }) {
  const [name, setName] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [location, setLocation] = React.useState('');

  const handleSubmit = () => {
    // Handle the submission logic here, e.g., send data to an API
    console.log('New Startup Data:', { name, industry, stage, description, location });
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-startup-modal-title"
      aria-describedby="add-startup-modal-description"
    >
      <Paper sx={style}>
        <Typography id="add-startup-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
          Create New Startup
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Startup Name"
            variant="outlined"
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="industry-label">Industry</InputLabel>
            <Select
              labelId="industry-label"
              value={industry}
              label="Industry"
              onChange={(e) => setIndustry(e.target.value)}
            >
              <MenuItem value="">Select Industry</MenuItem>
              <MenuItem value="Technology">Technology</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
            </Select>
          </FormControl>
           <FormControl fullWidth size="small">
            <InputLabel id="stage-label">Stage</InputLabel>
            <Select
              labelId="stage-label"
              value={stage}
              label="Stage"
              onChange={(e) => setStage(e.target.value)}
            >
              <MenuItem value="">Select Stage</MenuItem>
              <MenuItem value="Idea">Idea</MenuItem>
              <MenuItem value="Seed">Seed</MenuItem>
              <MenuItem value="Growth">Growth</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Location"
            variant="outlined"
            fullWidth
            size="small"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
             <Button variant="contained" onClick={handleSubmit}>
              Create Startup
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Modal>
  );
}

export default AddStartupModal; 