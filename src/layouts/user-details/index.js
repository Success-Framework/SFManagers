import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";

// Images
import team1 from "assets/images/avatar1.png";
import team2 from "assets/images/avatar2.png";
import team3 from "assets/images/avatar3.png";
import team4 from "assets/images/avatar4.png";
import profile1 from "assets/images/profile-1.png";
import profile2 from "assets/images/profile-2.png";
import profile3 from "assets/images/profile-3.png";

// Vision UI Dashboard React example components
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import Footer from "examples/Footer";

// Overview page components
import Header from "layouts/profile/components/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings";
import Welcome from "../profile/components/Welcome/index";
import CarInformations from "../profile/components/CarInformations";

// API functions
import { getProfileById } from "api/profile";

function UserDetails() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const fetchedUser = await getProfileById(userId);
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [userId]);

  // Map API response to the structure used in the component
  const userProfileInfo = user ? {
    fullName: user.fullName,
    mobile: user.phone,
    email: user.email,
    location: user.location,
  } : null;

  // Update social links based on API data
  const userSocialLinks = user ? [
    {
      link: user.links.linkedIn,
      icon: <FacebookIcon />,
      color: "facebook",
    },
    {
      link: user.links.github,
      icon: <TwitterIcon />,
      color: "twitter",
    },
    {
      link: user.links.portfolio,
      icon: <InstagramIcon />,
      color: "instagram",
    },
  ] : [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
       {user ? (
         <VuiBox mt={5} mb={3}>
        <Grid
          container
          spacing={3}
          sx={({ breakpoints }) => ({
            [breakpoints.only("xl")]: {
              gridTemplateColumns: "repeat(2, 1fr)",
            },
          })}
        >
          <Grid
            item
            xs={12}
            xl={4}
            xxl={3}
            sx={({ breakpoints }) => ({
              minHeight: "400px",
              [breakpoints.only("xl")]: {
                gridArea: "1 / 1 / 2 / 2",
              },
            })}
          >
            {/* Welcome section - likely not relevant for another user */}
            {/* <Welcome /> */}
          </Grid>
          <Grid
            item
            xs={12}
            xl={5}
            xxl={6}
            sx={({ breakpoints }) => ({
              [breakpoints.only("xl")]: {
                gridArea: "2 / 1 / 3 / 3",
              },
            })}
          >
             {/* Car Informations section - likely not relevant for another user */}
             {/* <CarInformations /> */}
          </Grid>
          <Grid
            item
            xs={12}
            xl={3}
            xxl={3}
            sx={({ breakpoints }) => ({
              [breakpoints.only("xl")]: {
                gridArea: "1 / 2 / 2 / 3",
              },
            })}
          >
            <ProfileInfoCard
              title="User Information"
              description={user.bio}
              info={userProfileInfo}
              social={userSocialLinks}
            />
          </Grid>
        </Grid>
      </VuiBox>
       ) : (
         <VuiBox py={3}><VuiTypography color="error">User not found</VuiTypography></VuiBox>
       )}

      {/* Skills Section */}
       {user && user.skills && user.skills.length > 0 && (
         <VuiBox mb={3}>
           <Card>
             <VuiBox display="flex" flexDirection="column" height="100%" p={3}>
               <VuiTypography color="white" variant="lg" fontWeight="bold" mb="15px">
                 Skills
               </VuiTypography>
               <Box>
                 {user.skills.map((skill, index) => (
                   <Chip key={index} label={skill} sx={{ mr: 1, mb: 1, bgcolor: 'rgba(112, 144, 176, 0.2)', color: 'white' }} />
                 ))}
               </Box>
             </VuiBox>
           </Card>
         </VuiBox>
       )}

      {/* Projects section */}
       {user && user.projects && user.projects.length > 0 && (
         <VuiBox mb="30px">
          <Card>
            <VuiBox display="flex" flexDirection="column" height="100%">
              <VuiBox display="flex" flexDirection="column" mb="24px" p={3}>
                <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
                  Projects
                </VuiTypography>
                <VuiTypography color="text" variant="button" fontWeight="regular">
                  User's projects
                </VuiTypography>
              </VuiBox>
              <Grid container spacing={3} px={3} pb={3}>
                 {user.projects.map(project => (
                   <Grid item xs={12} md={6} xl={4} key={project.id}>
                     <DefaultProjectCard
                       image={project.image}
                       label={project.label}
                       title={project.title}
                       description={project.description}
                       action={{
                         type: "internal",
                         route: "#", // Update route to project details if needed
                         color: "white",
                         label: "VIEW PROJECT",
                       }}
                       authors={[] // Add project authors if available
                       }
                     />
                   </Grid>
                 ))}
              </Grid>
            </VuiBox>
          </Card>
        </VuiBox>
       )}

       {/* Platform Settings - likely not relevant for another user */}
        {/* <Grid container spacing={3} mb="30px">
           <Grid item xs={12} xl={3} height="100%">
            <PlatformSettings />
          </Grid>
        </Grid> */}

      <Footer />
    </DashboardLayout>
  );
}

export default UserDetails; 