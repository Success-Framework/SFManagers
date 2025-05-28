import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Card, CardContent, Grid, Chip, Avatar, Divider, Tooltip } from "@mui/material";

// Vision UI Components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import Footer from "examples/Footer";

// Icons
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import LanguageIcon from "@mui/icons-material/Language";
import StarIcon from "@mui/icons-material/Star";

// API
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


  // IF NO USER ID, USE THIS MOCK DATA for checking UI
  // useEffect(() => {
  //   setUser({
  //     id: "123456789",
  //     fullName: 'John Developer',
  //     email: 'john@example.com',
  //     position: 'Full Stack Developer',
  //     userType: 'freelancer',
  //     location: 'San Francisco, CA',
  //     skills: [
  //       { name: 'React', level: 'expert' },
  //       { name: 'Node.js', level: 'advanced' },
  //       { name: 'TypeScript', level: 'intermediate' }
  //     ],
  //     bio: 'Passionate developer with 5+ years of experience building web applications.',
  //     followers: 120,
  //     projects: 15,
  //     availableForHire: true,
  //     hourlyRate: '$80',
  //     rating: 4.8,
  //     joinDate: '2023-01-15',
  //     links: {
  //       linkedIn: 'https://linkedin.com/in/johndeveloper',
  //       github: 'https://github.com/johndeveloper',
  //       portfolio: 'https://johndeveloper.com'
  //     },
  //     phone: '+1234567890'
  //   });
  // }, []);


  if (!user) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <VuiBox py={3}><VuiTypography color="error">User Data found</VuiTypography></VuiBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const {
    fullName,
    email,
    phone,
    location,
    bio,
    skills,
    position,
    userType,
    rating,
    availableForHire,
    hourlyRate,
    joinDate,
    followers,
    projects,
    links
  } = user;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox mt={5} mb={3}>
        <Card sx={{ p: 3, bgcolor: "background.paper" }}>
          <Grid container spacing={3}>
            {/* Profile Overview */}
            <Grid item xs={12} md={4} textAlign="center">
              <Avatar src="/profile-placeholder.png" sx={{ width: 120, height: 120, mx: "auto", mb: 2 }} />
              <VuiTypography variant="h5" fontWeight="bold">{fullName}</VuiTypography>
              <VuiTypography color="text">{position} • {userType}</VuiTypography>
              <VuiTypography color="info" mt={1}>{location}</VuiTypography>

              {/* Rating & Hourly */}
              <Box mt={2}>
                <Tooltip title={`Rating: ${rating}`}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <StarIcon sx={{ color: "#fbc02d", mr: 0.5 }} />
                    <Typography variant="body2">{rating}</Typography>
                  </Box>
                </Tooltip>
                <VuiTypography mt={1} color="success">
                  {availableForHire ? "✅ Available for hire" : "❌ Not available"}
                </VuiTypography>
                <VuiTypography variant="button" mt={1}>💰 {hourlyRate} / hr</VuiTypography>
              </Box>
            </Grid>

            {/* Info Section */}
            <Grid item xs={12} md={8}>
              <VuiTypography variant="lg" fontWeight="bold" mb={2}>About</VuiTypography>
              <Typography variant="body1" mb={2}>{bio}</Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}><strong>Email:</strong> {email}</Grid>
                <Grid item xs={6}><strong>Phone:</strong> {phone}</Grid>
                <Grid item xs={6}><strong>Followers:</strong> {followers}</Grid>
                <Grid item xs={6}><strong>Joined on:</strong> {new Date(joinDate).toLocaleDateString()}</Grid>
              </Grid>

              {/* Social Links */}
              <Box mt={2} display="flex" gap={2}>
                <Tooltip title="LinkedIn">
                  <a href={links.linkedIn} target="_blank" rel="noopener noreferrer"><LinkedInIcon color="primary" /></a>
                </Tooltip>
                <Tooltip title="GitHub">
                  <a href={links.github} target="_blank" rel="noopener noreferrer"><GitHubIcon /></a>
                </Tooltip>
                <Tooltip title="Portfolio">
                  <a href={links.portfolio} target="_blank" rel="noopener noreferrer"><LanguageIcon /></a>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Skills */}
        <VuiBox mt={4}>
          <Card sx={{ p: 3 }}>
            <VuiTypography variant="lg" fontWeight="bold" mb={2}>Skills</VuiTypography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {skills.map((skill, i) => (
                <Chip
                  key={i}
                  label={`${skill.name} (${skill.level})`}
                  sx={{ bgcolor: 'rgba(112,144,176,0.2)', color: 'white' }}
                />
              ))}
            </Box>
          </Card>
        </VuiBox>

        {/* Projects */}
        {projects && projects.length > 0 && (
          <VuiBox mt={4}>
            <VuiTypography variant="lg" fontWeight="bold" mb={2}>Projects</VuiTypography>
            <Grid container spacing={3}>
              {projects.map((project, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <DefaultProjectCard
                    image={project.image || "/project-placeholder.jpg"}
                    label={project.label || "Project"}
                    title={project.title}
                    description={project.description}
                    action={{
                      type: "internal",
                      route: "#",
                      color: "white",
                      label: "VIEW PROJECT",
                    }}
                    authors={project.authors || []}
                  />
                </Grid>
              ))}
            </Grid>
          </VuiBox>
        )}
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default UserDetails;
