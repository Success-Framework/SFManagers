/*!

=========================================================
* Vision UI Free React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-free-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)
* Licensed under MIT (https://github.com/creativetimofficial/vision-ui-free-react/blob/master LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the software.

*/

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
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

export default function App() {
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();
  
  // Step 1: Check for token in local storage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

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
        {isAuthenticated ? ( // If authenticated, show the main app
          <>
            <Sidenav
              color={sidenavColor}
              brand=""
              brandName="VISION UI FREE"
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
