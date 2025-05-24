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
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import { Card, LinearProgress, Stack } from "@mui/material";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";

// Vision UI Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import linearGradient from "assets/theme/functions/linearGradient";

// Vision UI Dashboard React base styles
import typography from "assets/theme/base/typography";
import colors from "assets/theme/base/colors";

// Dashboard layout components
import WelcomeMark from "layouts/dashboard/components/WelcomeMark";
import Startups from "layouts/dashboard/components/Startups";
import Tasks from "layouts/dashboard/components/Tasks";
import Meetings from "layouts/dashboard/components/Meetings";

// React icons
import { IoIosRocket } from "react-icons/io";
import { IoGlobe } from "react-icons/io5";
import { IoBuild } from "react-icons/io5";
import { IoWallet } from "react-icons/io5";
import { IoDocumentText } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";

// Data
import LineChart from "examples/Charts/LineCharts/LineChart";
import BarChart from "examples/Charts/BarCharts/BarChart";
import { lineChartDataDashboard } from "layouts/dashboard/data/lineChartData";
import { lineChartOptionsDashboard } from "layouts/dashboard/data/lineChartOptions";
import { barChartDataDashboard } from "layouts/dashboard/data/barChartData";
import { barChartOptionsDashboard } from "layouts/dashboard/data/barChartOptions";

import React, { useEffect, useState } from 'react';
import { getMyStartups } from '../../api/startup'; // Adjust the import path as necessary
import { getNotifications } from '../../api/notification'; // Adjust the import path as necessary
import { getJoinedStartups } from '../../api/auth'; // Adjust the import path as necessary
import { getUserTasks } from '../../api/task'; // Import the getUserTasks function
import { getCurrentUser } from '../../api/auth'; // Import the getCurrentUser function
import { useHistory } from 'react-router-dom'; // Import useHistory for navigation

function Dashboard() {
  const history = useHistory(); // Initialize history for navigation
  const { gradients } = colors;
  const { cardContent } = gradients;
  const [startups, setStartups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]); // State for meetings
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // State for current user
  const [joinedStartups, setJoinedStartups] = useState([]); // State for joined startups
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser(); // Fetch current user data
        setCurrentUser(userData); // Set the current user state

        const startupsData = await getMyStartups();
        const notificationsData = await getNotifications();
        const tasksData = await getUserTasks(); // Fetch user tasks

        setStartups(startupsData);
        setNotifications(notificationsData);
        setMeetings(tasksData); // Set the meetings state with fetched tasks

        // Call joinStartup API if needed
        const joinResponse = await getJoinedStartups(); // Call joinStartup
        setJoinedStartups(joinResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // const handleStartupClick = async (startupId) => {
  //   try {
  //     const startupData = await getStartupById(startupId); // Fetch startup details by ID
  //     console.log('Startup Data:', startupData); // Handle the startup data as needed
  //     history.push(`/startup/${startupId}/tasks`); // Navigate to the startup tasks page
  //   } catch (error) {
  //     console.error('Error fetching startup details:', error);
  //   }
  // };

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a loading spinner or skeleton
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "My Startups", fontWeight: "regular" }}
                count={startups.length}
                // percentage={{ color: "success", text: `+${startups.length - 1}` }}
                icon={{ color: "info", component: <IoBuild size="22px" color="white" /> }}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Pending Tasks" }}
                count={meetings.length}
                // percentage={{ color: "error", text: "-2" }}
                icon={{ color: "info", component: <IoDocumentText size="22px" color="white" /> }}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}> 
              <MiniStatisticsCard
                title={{ text: "Today's Meetings" }}
                count={meetings.length}
                // percentage={{ color: "success", text: `+${meetings?.length || 0}` }}
                icon={{ color: "info", component: <IoGlobe size="22px" color="white" /> }}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Completed Tasks" }}
                count="12"
                percentage={{ color: "success", text: "+3" }}
                icon={{ color: "info", component: <IoIosRocket size="20px" color="white" /> }}
              />
            </Grid>
          </Grid>
        </VuiBox>
        <VuiBox mb={3}>
          <Grid container spacing="18px">
            <Grid item xs={12} lg={12} xl={5}>
              <WelcomeMark name={currentUser?.name} />
            </Grid>
            <Grid item xs={12} lg={6} xl={3}>
              <Tasks />
            </Grid>
            <Grid item xs={12} lg={6} xl={4}>
              <Meetings meetings={meetings} />
            </Grid>
          </Grid>
        </VuiBox>
        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={12} xl={12}>
              <Startups startups={startups} notifications={notifications} joinedStartups={joinedStartups} />
            </Grid>
          </Grid>
        </VuiBox>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
