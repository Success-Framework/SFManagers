import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Icon from "@mui/material/Icon";
import VuiBox from "components/VuiBox";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";
import theme from "assets/theme";
import routes from "routes";
import UserDetails from "layouts/user-details";
import StartupProfile from "layouts/startup-profile";
import StartupDashboard from "layouts/dashboard/components/Startups/StartupDashboard";
import Login from "layouts/Login";
import { useVisionUIController, setMiniSidenav, setOpenConfigurator } from "context";
import './config/axiosConfig'; // Add this at the top of your imports

export default function App() {
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();
  
  // Step 1: Check for token in local storage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  // Add this useEffect for initial auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // You might want to validate the token here
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return (
          <Route 
            exact 
            path={route.route} 
            component={route.component} 
            key={route.key}
          />
        );
      }

      return null;
    });

  const configsButton = (
    <VuiBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="info"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="white"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </VuiBox>
  );

  // Step 2: Conditional rendering based on authentication status
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        {isAuthenticated ? ( // If authenticated, show the main app
          <>
            <Sidenav
              color={sidenavColor}
              brand=""
              brandName="SF Managers"
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
            <Switch>
              <Route path="/user-details/:userId" component={UserDetails} key="user-details" />
              <Route path="/startup/:startupId/tasks" component={StartupDashboard} key="startup-dashboard" />
              {getRoutes(routes)}
              <Route path="*">
                <Redirect to="/dashboard" />
              </Route>
            </Switch>
          </>
        ) : ( // If not authenticated, show the login page
          <Switch>
            <Route path="/login">
              <Login setIsAuthenticated={setIsAuthenticated} />
            </Route>
            <Route path="*">
              <Redirect to="/login" />
            </Route>
          </Switch>
        )}
      </ThemeProvider>
    </Router>
  );
}
