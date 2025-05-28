/*!

=========================================================
* Vision UI Free React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-free-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)
* Licensed under MIT (https://github.com/creativetimofficial/vision-ui-free-react/blob/master LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

// @mui material components
// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import team1 from "assets/images/avatar1.png";
import team2 from "assets/images/avatar2.png";
import team3 from "assets/images/avatar3.png";
import team4 from "assets/images/avatar4.png";
// Images
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";
// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import Footer from "examples/Footer";
// Vision UI Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
// Overview page components
// import Header from "layouts/profile/components/Header";  
import PlatformSettings from "layouts/profile/components/PlatformSettings";
import Welcome from "../profile/components/Welcome/index";
// Import the Tasks component
import Tasks from "layouts/dashboard/components/Tasks";
import { getCurrentUser } from "api/auth";
import { useState, useEffect } from "react";

function Overview() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getCurrentUser();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const socialLinks = [
    {
      link: userData?.github || "#",
      icon: <GitHubIcon />,
      color: "github",
    },
    {
      link: userData?.linkedin || "#",
      icon: <LinkedInIcon />,
      color: "linkedin",
    },
    {
      link: userData?.portfolio || "#",
      icon: <LanguageIcon />,
      color: "portfolio",
    },
  ];



  return (
    <DashboardLayout>
      {/* <Header /> */}
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
            <Welcome userName={userData?.name || "Loading..."} />
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
            <Tasks  />
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
              title="profile information"
              description={userData?.bio || "Loading..."}
              info={{
                fullName: userData?.name || "Loading...",
                mobile: userData?.mobile || "Loading...",
                email: userData?.email || "Loading...",
                location: userData?.location || "Loading...",
                github: userData?.github || "Loading...",
                linkedin: userData?.linkedin || "Loading...",
                availability: userData?.availability || "Loading...",
              }}
              social={socialLinks}
            />
          </Grid>
        </Grid>
      </VuiBox>
      <Grid container spacing={3} mb="30px">
        <Grid item xs={12} xl={3} height="100%">
          <PlatformSettings />
        </Grid>
        <Grid item xs={12} xl={9}>  
          <Card>
            <VuiBox display="flex" flexDirection="column" height="100%">
              <VuiBox display="flex" flexDirection="column" mb="24px">
                <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
                  Projects
                </VuiTypography>
                <VuiTypography color="text" variant="button" fontWeight="regular">
                  My All Startups
                </VuiTypography>
              </VuiBox>
              <Grid container spacing={3}>
                {userData?.ownedStartups?.map((project) => (
                  <Grid item xs={12} md={6} xl={4} key={project.id}>
                    <DefaultProjectCard
                      image={project.banner_url}
                      label={project.label}
                      title={project.name}
                      description={project.details}
                      stage={project.stage}
                      startDate={new Date(project.createdAt).toLocaleDateString()}
                      viewCount={project.view}
                      action={{
                        type: "internal",
                        route: `/startup-profile/${project.id}`,
                        color: "white",
                        label: "VIEW ALL",
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </VuiBox>
          </Card>
        </Grid>
      </Grid>

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
