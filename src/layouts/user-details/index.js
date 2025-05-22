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

// Dummy user data (same as in ProfilesList for now)
const dummyUsers = [
  {
    id: 1,
    name: 'Alice Smith',
    role: 'Frontend Developer',
    bio: 'Passionate about building beautiful and user-friendly interfaces.',
    mobile: '(111) 111-1111',
    email: 'alice.smith@example.com',
    location: 'New York, USA',
    skills: ['React', 'JavaScript', 'CSS', 'HTML'],
    projects: [
      { id: 101, title: 'Project Alpha', description: 'A web application for task management.', image: profile1, label: 'Web Dev' },
      { id: 102, title: 'Project Beta', description: 'Mobile app development.', image: profile2, label: 'Mobile Dev' },
    ],
  },
  {
    id: 2,
    name: 'Bob Johnson',
    role: 'Backend Developer',
    bio: 'Experienced in building scalable server-side applications.',
    mobile: '(222) 222-2222',
    email: 'bob.johnson@example.com',
    location: 'London, UK',
    skills: ['Python', 'Django', 'REST APIs', 'Databases'],
    projects: [
      { id: 103, title: 'Project Gamma', description: 'Building a microservices architecture.', image: profile3, label: 'Backend' },
    ],
  },
  {
    id: 3,
    name: 'Charlie Brown',
    role: 'UI/UX Designer',
    bio: 'Creating intuitive and engaging user experiences.',
    mobile: '(333) 333-3333',
    email: 'charlie.b@example.com',
    location: 'Paris, France',
    skills: ['Figma', 'Sketch', 'User Research', 'Prototyping'],
    projects: [
      { id: 104, title: 'Project Delta', description: 'Designing a new user interface.', image: profile1, label: 'UI/UX' },
      { id: 105, title: 'Project Epsilon', description: 'Creating wireframes and prototypes.', image: profile2, label: 'UI/UX' },
    ],
  },
  {
    id: 4,
    name: 'Diana Prince',
    role: 'Fullstack Developer',
    bio: 'Versatile developer with experience in both frontend and backend.',
    mobile: '(444) 444-4444',
    email: 'diana.p@example.com',
    location: 'Tokyo, Japan',
    skills: ['React', 'Node.js', 'GraphQL', 'MongoDB'],
    projects: [
      { id: 106, title: 'Project Zeta', description: 'Fullstack e-commerce platform.', image: profile3, label: 'Fullstack' },
      { id: 107, title: 'Project Eta', description: 'Building a real-time chat application.', image: profile1, label: 'Fullstack' },
      { id: 108, title: 'Project Theta', description: 'Developing a content management system.', image: profile2, label: 'Fullstack' },
    ],
  },
];

function UserDetails() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch user data by userId here
    const foundUser = dummyUsers.find(u => u.id === parseInt(userId));
    setUser(foundUser);
  }, [userId]);

  // Assuming the dummyUser structure can map to ProfileInfoCard props
  const userProfileInfo = user ? {
    fullName: user.name,
    mobile: user.mobile,
    email: user.email,
    location: user.location,
  } : null;

  // Placeholder social links - replace with actual user social links if available
   const userSocialLinks = user ? [
                {
                  link: "#", // Replace with actual link
                  icon: <FacebookIcon />,
                  color: "facebook",
                },
                {
                  link: "#", // Replace with actual link
                  icon: <TwitterIcon />,
                  color: "twitter",
                },
                {
                  link: "#", // Replace with actual link
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