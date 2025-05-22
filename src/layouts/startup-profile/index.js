import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Box, Typography, Card, CardContent, Button, Grid, Chip, Stack, Modal, TextField } from "@mui/material";
import { MdOutlineLocationOn, MdCalendarToday, MdPersonOutline } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Dummy startup data (same as in Discover for now, with added details)
const dummyStartups = [
  {
    id: 1,
    name: "Test DB",
    stage: "Idea",
    description: "Test DB",
    industry: "Technology",
    location: "Test DB",
    roles: 0,
    tasks: 0,
    views: 5,
    createdDate: "18/5/2025",
    foundedBy: "trial@sfm.com",
    availableRoles: [
      {
        id: 101,
        title: 'Admin',
        type: 'Volunteer',
        postedDate: '5/18/2025',
      },
       {
        id: 102,
        title: 'Developer',
        type: 'Paid',
        postedDate: '5/19/2025',
      },
    ]
  },
  {
    id: 2,
    name: "Manual Test Startup",
    stage: "Idea",
    description: "Testing full creation",
    industry: "Healthcare",
    location: "New York",
    roles: 0,
    tasks: 0,
    views: 0,
    createdDate: "18/5/2025",
    foundedBy: "trial@sfm.com",
    availableRoles: [
      {
        id: 201,
        title: 'Nurse',
        type: 'Paid',
        postedDate: '5/20/2025',
      },
    ]
  },
  {
    id: 3,
    name: "Another Startup",
    stage: "Seed",
    description: "Focusing on AI",
    industry: "Technology",
    location: "San Francisco",
    roles: 2,
    tasks: 5,
    views: 10,
    createdDate: "20/5/2025",
    foundedBy: "founder@example.com",
     availableRoles: [
      {
        id: 301,
        title: 'AI Engineer',
        type: 'Paid',
        postedDate: '5/21/2025',
      },
       {
        id: 302,
        title: 'Data Scientist',
        type: 'Paid',
        postedDate: '5/22/2025',
      },
    ]
  },
  {
    id: 4,
    name: "Beta Startup",
    stage: "Growth",
    description: "Expanding rapidly",
    industry: "Finance",
    location: "London",
    roles: 5,
    tasks: 15,
    views: 25,
    createdDate: "22/5/2025",
    foundedBy: "info@betastartup.com",
     availableRoles: [
      {
        id: 401,
        title: 'Financial Analyst',
        type: 'Paid',
        postedDate: '5/23/2025',
      },
       {
        id: 402,
        title: 'Marketing Specialist',
        type: 'Paid',
        postedDate: '5/24/2025',
      },
    ]
  },
];

function StartupProfile() {
  const { startupId } = useParams();
  const history = useHistory();
  const [startup, setStartup] = useState(null);
  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');

  useEffect(() => {
    // In a real application, fetch startup data by startupId
    console.log('StartupProfile useEffect: startupId from URL', startupId);
    console.log('StartupProfile useEffect: dummyStartups data', dummyStartups);
    const foundStartup = dummyStartups.find(s => s.id === parseInt(startupId));
    console.log('StartupProfile useEffect: foundStartup result', foundStartup);
    setStartup(foundStartup);
  }, [startupId]);

  const handleBackToStartups = () => {
    history.push('/discover');
  };

  const handleApplyForRole = (role) => {
    setSelectedRole(role);
    setOpenApplyModal(true);
  };

  const handleCloseModal = () => {
    setOpenApplyModal(false);
    setSelectedRole(null);
    setApplicationMessage('');
  };

  const handleSubmitApplication = () => {
    console.log(`Submitting application for role ${selectedRole.id} with message: ${applicationMessage}`);
    // TODO: Implement application submission logic (API call)
    handleCloseModal();
  };

  if (!startup) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <VuiBox py={3}>
          <VuiTypography color="white">Startup not found</VuiTypography>
        </VuiBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <Button
          startIcon={<FaArrowLeft />}
          onClick={handleBackToStartups}
          sx={{
            color: "white",
            mb: 3,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          Back to Startups
        </Button>

        <Card sx={{
          borderRadius: '12px',
          bgcolor: 'background.paper',
          border: '1px solid rgba(112, 144, 176, 0.1)',
          color: 'white',
          p: 3,
          mb: 3,
        }}>
          <VuiTypography variant="h5" color="white" fontWeight="bold" mb={1}>Startup Name: {startup.name}</VuiTypography>
          <Stack direction="row" spacing={3} mb={1}>
             <VuiTypography variant="body2" color="white">Stage: {startup.stage}</VuiTypography>
             <VuiTypography variant="body2" color="white">Industry: {startup.industry}</VuiTypography>
          </Stack>
          <VuiTypography variant="body2" color="white" mb={2}>{startup.description}</VuiTypography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} alignItems="flex-start">
             <Stack direction="row" alignItems="center" spacing={1}>
              <MdOutlineLocationOn style={{ color: 'white' }} />
              <VuiTypography variant="body2" color="white">Location: {startup.location}</VuiTypography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <MdCalendarToday style={{ color: 'white' }} />
              <VuiTypography variant="body2" color="white">Founded: {startup.createdDate}</VuiTypography>
            </Stack>
             <Stack direction="row" alignItems="center" spacing={1}>
              <MdPersonOutline style={{ color: 'white' }} />
              <VuiTypography variant="body2" color="white">Founded by: {startup.foundedBy}</VuiTypography>
            </Stack>
          </Stack>
        </Card>

        <VuiTypography variant="h5" color="white" fontWeight="bold" mb={2}>
           Available Roles
        </VuiTypography>

         <Grid container spacing={3}>
            {startup.availableRoles && startup.availableRoles.length > 0 ? (
              startup.availableRoles.map(role => (
                <Grid item xs={12} sm={6} md={4} key={role.id}>
                  <Card sx={{
                    borderRadius: '12px',
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(112, 144, 176, 0.1)',
                    color: 'white',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <VuiTypography variant="h6" color="white" fontWeight="bold" mb={0.5}>Role Name: {role.title}</VuiTypography>
                       <VuiTypography variant="body2" color="white" mb={1}>Type: {role.type}</VuiTypography>
                       <VuiTypography variant="caption" color="white">Posted: {role.postedDate}</VuiTypography>
                    </CardContent>
                     <Box px={3} pb={3}>
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            borderRadius: '4px',
                            bgcolor: '#4318FF',
                            color: 'white !important',
                            '&:hover': {
                              bgcolor: '#3311CC',
                              color: 'white !important',
                            }
                          }}
                          onClick={() => handleApplyForRole(role)}
                        >
                          Apply for Role
                        </Button>
                     </Box>
                  </Card>
                </Grid>
              ))
            ) : (
               <Grid item xs={12}>
                 <VuiTypography color="white">No available roles for this startup.</VuiTypography>
               </Grid>
            )}
         </Grid>

      </VuiBox>
      <Modal
        open={openApplyModal}
        onClose={handleCloseModal}
        aria-labelledby="apply-for-role-modal-title"
        aria-describedby="apply-for-role-modal-description"
      >
        <VuiBox sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '1px solid #000',
          borderRadius: '8px',
          boxShadow: 24,
          p: 4,
          color: 'white',
        }}>
          <VuiTypography id="apply-for-role-modal-title" variant="h6" component="h2" color="white" mb={2}>
            Apply for {selectedRole?.title} at {startup?.name}
          </VuiTypography>
          <VuiTypography id="apply-for-role-modal-description" sx={{ mt: 2, mb: 2 }} color="white">
            Why do you want to be part of our startup?\n            Please explain your interest and what you can bring to the team.\n          </VuiTypography>
          <TextField
            label="Your message"
            multiline
            rows={4}
            fullWidth
            value={applicationMessage}
            onChange={(e) => setApplicationMessage(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.4)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.8)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4318FF' },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#4318FF' },
            }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmitApplication}
            sx={{
              borderRadius: '4px',
              bgcolor: '#4318FF',
              color: 'white !important',
              '&:hover': {
                bgcolor: '#3311CC',
                color: 'white !important',
              }
            }}
          >
            Submit Application
          </Button>
        </VuiBox>
      </Modal>
    </DashboardLayout>
  );
}

export default StartupProfile; 