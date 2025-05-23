import { Card, Button } from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { FaCalendarAlt } from "react-icons/fa";
import { useEffect, useState } from 'react';
import { getMyStartups } from '../../../../api/startup.js';

const dummyMeetings = [
  {
    id: 1,
    title: "Investor Pitch - TechVision AI",
    date: "2024-03-25",
    time: "10:00 AM",
    type: "Virtual",
    attendees: ["John Smith", "Sarah Johnson"]
  },
  {
    id: 2,
    title: "Board Meeting",
    date: "2024-03-26",
    time: "2:00 PM",
    type: "In-Person",
    attendees: ["Board Members", "Executive Team"]
  },
  {
    id: 3,
    title: "Product Strategy Review",
    date: "2024-03-27",
    time: "11:00 AM",
    type: "Hybrid",
    attendees: ["Product Team", "Design Team"]
  }
];

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const startups = await getMyStartups();
        setMeetings(startups);
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <VuiBox p={3}>
        <VuiBox display="flex" alignItems="center" mb={2}>
          <VuiBox
            bgColor="info"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ borderRadius: "6px", width: "40px", height: "40px" }}
          >
            <FaCalendarAlt color="#fff" size="20px" />
          </VuiBox>
          <VuiTypography variant="lg" color="white" fontWeight="bold" ml={2}>
            Upcoming Meetings
          </VuiTypography>
        </VuiBox>
        <VuiBox>
          {meetings.map((meeting) => (
            <VuiBox key={meeting.id} mb={2} p={2} sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <VuiTypography variant="button" color="white" fontWeight="bold">
                {meeting.title}
              </VuiTypography>
              <VuiBox display="flex" justifyContent="space-between" mt={1}>
                <VuiTypography variant="caption" color="text" fontWeight="regular">
                  {meeting.date} at {meeting.time}
                </VuiTypography>
                <VuiTypography variant="caption" color="info" fontWeight="regular">
                  {meeting.type}
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="caption" color="text" fontWeight="regular">
                Attendees: {meeting.attendees.join(", ")}
              </VuiTypography>
              <VuiBox mt={2}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  fullWidth
                  onClick={() => console.log(`Join meeting: ${meeting.title}`)}
                >
                  Join Meeting
                </Button>
              </VuiBox>
            </VuiBox>
          ))}
        </VuiBox>
      </VuiBox>
    </Card>
  );
}

export default Meetings; 