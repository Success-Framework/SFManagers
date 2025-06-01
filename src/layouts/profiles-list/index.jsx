import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Button, Grid } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import { useHistory } from "react-router-dom";
import { getProfiles } from "../../api/profile";

// Vision UI Dashboard React components
import VuiBox from "@/components/VuiBox";
import VuiTypography from "@/components/VuiTypography";
import DashboardLayout from "@/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "@/examples/Navbars/DashboardNavbar";

// Vision UI Dashboard React base styles
import colors from "@/assets/theme/base/colors";
import linearGradient from "@/assets/theme/functions/linearGradient";

function ProfilesList() {
  const history = useHistory();
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await getProfiles();
        setProfiles(data?.profiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

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
          {profiles?.map(user => (
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
                      <VuiTypography variant="h6" color="white" fontWeight="bold">{user.fullName}</VuiTypography>
                   </Box>
                  <VuiTypography variant="body2" color="white" mb={1}>{user.position}</VuiTypography>
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