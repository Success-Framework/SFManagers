import React from "react";
import { Box, Typography, Card, CardContent, Button, Grid } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import { useHistory } from "react-router-dom";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Vision UI Dashboard React base styles
import colors from "assets/theme/base/colors";
import linearGradient from "assets/theme/functions/linearGradient";

// Dummy user data
const dummyUsers = [
  {
    id: 1,
    name: 'Alice Smith',
    role: 'Frontend Developer',
    bio: 'Passionate about building beautiful and user-friendly interfaces.',
  },
  {
    id: 2,
    name: 'Bob Johnson',
    role: 'Backend Developer',
    bio: 'Experienced in building scalable server-side applications.',
  },
  {
    id: 3,
    name: 'Charlie Brown',
    role: 'UI/UX Designer',
    bio: 'Creating intuitive and engaging user experiences.',
  },
  {
    id: 4,
    name: 'Diana Prince',
    role: 'Fullstack Developer',
    bio: 'Versatile developer with experience in both frontend and backend.',
  },
];

function ProfilesList() {
  const history = useHistory();

  const handleViewProfile = (userId) => {
    // Navigate to the user details page with the user ID
    history.push(`/user-details/${userId}`);
  };

  const handleSendRequest = (userId) => {
    console.log(`Send request to user ${userId}`);
    // TODO: Implement send request logic
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiTypography variant="h4" color="white" mb={3}>
          Profiles List
        </VuiTypography>

        <Grid container spacing={3}>
          {dummyUsers.map(user => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card
                sx={{
                  borderRadius: '12px',
                  background: linearGradient(
                    colors.gradients.card.main,
                    colors.gradients.card.state,
                    colors.gradients.card.deg
                  ),
                  border: '1px solid rgba(112, 144, 176, 0.1)',
                  color: 'white',
                  height: '100%',
                }}
              >
                <CardContent>
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ mr: 1 }} />
                      <VuiTypography variant="h6" color="white" fontWeight="bold">{user.name}</VuiTypography>
                   </Box>
                  <VuiTypography variant="body2" color="white" mb={1}>{user.role}</VuiTypography>
                  <VuiTypography variant="body2" color="white">{user.bio}</VuiTypography>
                  <Box mt={3} display="flex" gap={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleViewProfile(user.id)}
                      sx={{
                        backgroundColor: '#01B574 !important',
                        color: 'white !important',
                      }}
                    >
                      View Profile
                    </Button>
                     <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSendRequest(user.id)}
                      sx={{
                        backgroundColor: '#0075ff !important',
                        color: 'white !important',
                      }}
                    >
                      Send Request
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ProfilesList; 