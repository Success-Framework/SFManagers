// @mui material components
import Grid from "@mui/material/Grid";

// Vision UI Dashboard React components
import VuiBox from "components/VuiBox";


// Vision UI Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";


// Dashboard layout components
import WelcomeMark from "layouts/dashboard/components/WelcomeMark";
import Startups from "layouts/dashboard/components/Startups";
import Tasks from "layouts/dashboard/components/Tasks";
import Meetings from "layouts/dashboard/components/Meetings";

// React icons
import { IoIosRocket } from "react-icons/io";
import { IoGlobe } from "react-icons/io5";
import { IoBuild } from "react-icons/io5";
import { IoDocumentText } from "react-icons/io5";

import React, { useEffect, useState } from 'react';
import { getMyStartups } from '../../api/startup'; // Adjust the import path as necessary
import { getNotifications } from '../../api/notification'; // Adjust the import path as necessary
import { getJoinedStartups } from '../../api/auth'; // Adjust the import path as necessary
import { getUserTasks } from '../../api/task'; // Import the getUserTasks function
import { getCurrentUser } from '../../api/auth'; // Import the getCurrentUser function

function Dashboard() {
  const [startups, setStartups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedStartups, setJoinedStartups] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setCurrentUser(userData);

        const startupsData = await getMyStartups();
        const notificationsData = await getNotifications();
        const tasksData = await getUserTasks(); // Fetch user tasks
        console.log('Tasks data:', tasksData);
        console.log('Startups data:', startupsData);
        console.log('Notifications data:', notificationsData);

        // Filter meetings and tasks
        const meetingTasks = tasksData.filter(item =>
          item.title.toLowerCase().includes("meeting") ||
          (item.description && item.description.toLowerCase().includes("meeting link"))
        );
        
        const normalTasks = tasksData.filter(item =>
          !item.title.toLowerCase().includes("meeting") &&
          !(item.description && item.description.toLowerCase().includes("meeting link"))
        );
        setTasks(normalTasks);
        setMeetings(meetingTasks);
        setStartups(startupsData);
        setNotifications(notificationsData);

        // Call joinStartup API if needed
        const joinResponse = await getJoinedStartups();
        setJoinedStartups(joinResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              <Tasks tasks={tasks
                ?.slice()
                ?.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                ?.slice(0, 5)
              } />
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
