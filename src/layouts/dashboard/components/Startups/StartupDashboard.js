import { Card, Box, Button } from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { useHistory, useParams } from "react-router-dom";
import {
  FaTasks,
  FaCalendarAlt,
  FaChartBar,
  FaUsers,
  FaFileAlt,
  FaArrowLeft
} from "react-icons/fa";
import { useState, useEffect } from "react";
import TaskBoard from "./TaskBoard";
import Calendar from "./Calendar";
import TaskAnalytics from "./TaskAnalytics";
import Documents from "./Documents";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { getStartupById } from '../../../../api/startup';

const menuItems = [
  { id: "tasks", label: "Task Board", icon: <FaTasks /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "analytics", label: "Task Analytics", icon: <FaChartBar /> },
  { id: "affiliate", label: "Affiliate Tracker", icon: <FaUsers /> },
  { id: "documents", label: "Documents", icon: <FaFileAlt /> }
];

function StartupDashboard() {
  const { startupId } = useParams();
  const history = useHistory();
  const [selectedSection, setSelectedSection] = useState("tasks");
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const data = await getStartupById(startupId);
        setStartup(data);
      } catch (error) {
        console.error('Error fetching startup data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStartup();
  }, [startupId]);

  // console.log("startup11111111111111111111111111111", startup);

  const handleMenuClick = (itemId) => {
    setSelectedSection(itemId);
  };

  const handleBack = () => {
    history.push('/dashboard');
  };

  const renderSection = () => {
    switch (selectedSection) {
      case "tasks":
        return <TaskBoard startupId={startupId} />;
      case "calendar":
        return <Calendar />;
      case "analytics":
        return <TaskAnalytics />;
      case "affiliate":
        return <VuiTypography color="white">Affiliate Tracker</VuiTypography>;
      case "documents":
        return <Documents />;
      default:
        return <TaskBoard startupId={startupId} />;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Card>
          <VuiBox p={3}>
            <VuiTypography color="error">Startup not found</VuiTypography>
          </VuiBox>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Card>
        <VuiBox p={3}>
          <VuiBox display="flex" alignItems="center" mb={3}>
            <Button
              startIcon={<FaArrowLeft />}
              onClick={handleBack}
              sx={{ color: "white", mr: 2 }}
            >
              Back
            </Button>
            <VuiTypography variant="h5" color="white" fontWeight="bold">
              {startup.name} Dashboard
            </VuiTypography>
          </VuiBox>

          <Box 
            sx={{ 
              display: 'flex',
              gap: 1,
              width: '100%',
              overflowX: 'auto',
              pb: 1,
              mb: 3,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
              },
            }}
          >
            {menuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                startIcon={item.icon}
                sx={{
                  color: 'white',
                  backgroundColor: selectedSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderRadius: '8px',
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 2,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <VuiBox mt={2}>
            {renderSection()}
          </VuiBox>
        </VuiBox>
      </Card>
    </DashboardLayout>
  );
}

export default StartupDashboard;