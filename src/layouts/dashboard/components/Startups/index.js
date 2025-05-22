import { Card, Button } from "@mui/material";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import { FaBuilding } from "react-icons/fa";
import { useHistory } from "react-router-dom";

const dummyStartups = [
  {
    id: 1,
    name: "TechVision AI",
    industry: "Artificial Intelligence",
    stage: "Seed",
    funding: "$500K"
  },
  {
    id: 2,
    name: "GreenEnergy Solutions",
    industry: "Clean Energy",
    stage: "Series A",
    funding: "$2M"
  },
  {
    id: 3,
    name: "HealthTech Plus",
    industry: "Healthcare",
    stage: "Pre-seed",
    funding: "$250K"
  }
];

function Startups() {
  const history = useHistory();

  const handleDashboardClick = (startup) => {
    history.push(`/startup/${startup.id}/tasks`);
  };

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
            <FaBuilding color="#fff" size="20px" />
          </VuiBox>
          <VuiTypography variant="lg" color="white" fontWeight="bold" ml={2}>
            My Startups
          </VuiTypography>
        </VuiBox>
        <VuiBox>
          {dummyStartups.map((startup) => (
            <VuiBox key={startup.id} mb={2} p={2} sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <VuiTypography variant="button" color="white" fontWeight="bold">
                {startup.name}
              </VuiTypography>
              <VuiTypography variant="caption" color="text" fontWeight="regular">
                Industry: {startup.industry}
              </VuiTypography>
              <VuiBox display="flex" justifyContent="space-between" mt={1}>
                <VuiTypography variant="caption" color="text" fontWeight="regular">
                  Stage: {startup.stage}
                </VuiTypography>
                <VuiTypography variant="caption" color="success" fontWeight="regular">
                  Funding: {startup.funding}
                </VuiTypography>
              </VuiBox>
              <VuiBox mt={2}>
                <Button
                  variant="contained"
                  color="info"
                  size="small"
                  fullWidth
                  onClick={() => handleDashboardClick(startup)}
                  sx={{
                    background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                    boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)",
                    }
                  }}
                >
                  Dashboard
                </Button>
              </VuiBox>
            </VuiBox>
          ))}
        </VuiBox>
      </VuiBox>
    </Card>
  );
}

export default Startups; 