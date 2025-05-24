import { Card, Button } from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { FaCalendarAlt } from "react-icons/fa";
import { useEffect, useState } from 'react';

function Meetings({ meetings }) {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <VuiBox p={3}>
          <VuiTypography variant="h6" color="textSecondary" align="center">
            No meetings available.
          </VuiTypography>
        </VuiBox>
      </Card>
    );
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
                  {new Date(meeting.dueDate).toLocaleString()}
                </VuiTypography>
                <VuiTypography variant="caption" color="info" fontWeight="regular">
                  {meeting.statusName}
                </VuiTypography>
              </VuiBox>
              <VuiTypography variant="caption" color="text" fontWeight="regular">
                {meeting.description}
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