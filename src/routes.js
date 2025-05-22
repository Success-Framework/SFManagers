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

/** 
  All of the routes for the Vision UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Vision UI Dashboard React layouts
import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import RTL from "layouts/rtl";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import StartupDashboard from "layouts/dashboard/components/Startups/StartupDashboard";
import FreelanceTasks from "layouts/requests-freelance";
import ProfilesList from "layouts/profiles-list";
import UserDetails from "layouts/user-details";

// Vision UI Dashboard React icons
import { IoRocketSharp } from "react-icons/io5";
import { IoIosDocument } from "react-icons/io";
import { BsFillPersonFill } from "react-icons/bs";
import { IoBuild } from "react-icons/io5";
import { BsCreditCardFill } from "react-icons/bs";
import { IoStatsChart } from "react-icons/io5";
import { IoHome } from "react-icons/io5";

// Placeholder components for new routes
import Discover from "layouts/discover";
const AffiliateLinks = () => (
  <div style={{ padding: '20px' }}>
    <h2>Affiliate Links</h2>
    <p>This page is currently under construction.</p>
  </div>
);
const RequestsFreelance = () => (
  <div style={{ padding: '20px' }}>
    <h2>Requests Freelance</h2>
    <p>This page is currently under construction.</p>
  </div>
);
const ChatBox = () => (
  <div style={{ padding: '20px' }}>
    <h2>Chat Box</h2>
    <p>This page is currently under construction.</p>
  </div>
);

// New placeholder component for Profiles
const Profiles = () => (
  <div style={{ padding: '20px' }}>
    <h2>Profiles</h2>
    <p>This page is currently under construction.</p>
  </div>
);

// New placeholder component for detailed User Profile
/*
const UserDetails = () => (
  <div style={{ padding: '20px' }}>
    <h2>User Details</h2>
    <p>Loading user profile...</p>
  </div>
);
*/

// New placeholder component for Startup Profile
const StartupProfile = () => (
  <div style={{ padding: '20px' }}>
    <h2>Startup Profile</h2>
    <p>Loading startup details...</p>
  </div>
);

// New component for My Join Requests
const MyJoinRequests = () => {
  // Dummy data for demonstration
  const appliedRequests = [
    {
      id: 1,
      startupName: "TechVision AI",
      role: "Frontend Developer",
      appliedDate: "2024-03-15",
      status: "Pending",
      message: "Looking forward to joining your team!"
    },
    {
      id: 2,
      startupName: "GreenEnergy Solutions",
      role: "UI/UX Designer",
      appliedDate: "2024-03-10",
      status: "Under Review",
      message: "Excited about the opportunity!"
    }
  ];

  const receivedRequests = [
    {
      id: 1,
      startupName: "HealthTech Plus",
      role: "Backend Developer",
      appliedDate: "2024-03-14",
      message: "We need your expertise in Node.js"
    },
    {
      id: 2,
      startupName: "FinTech Innovations",
      role: "Full Stack Developer",
      appliedDate: "2024-03-12",
      message: "Looking for someone with React and Python experience"
    }
  ];

  return (
    <div style={{ 
      padding: '20px',
      marginLeft: '250px', // Add margin to account for fixed Sidenav
      width: 'calc(100% - 250px)', // Adjust width to account for Sidenav
      minHeight: '100vh',
      backgroundColor: '#0f1535' // Match the dashboard background
    }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>My Join Requests</h2>
      
      {/* Applied For Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Applied For</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          {appliedRequests.map((request) => (
            <div
              key={request.id}
              style={{
                background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                padding: '20px',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>{request.startupName}</h4>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  backgroundColor: request.status === 'Pending' ? '#ffa726' : '#66bb6a',
                  fontSize: '0.875rem'
                }}>
                  {request.status}
                </span>
              </div>
              <p style={{ margin: '5px 0' }}><strong>Role:</strong> {request.role}</p>
              <p style={{ margin: '5px 0' }}><strong>Applied:</strong> {request.appliedDate}</p>
              <p style={{ margin: '5px 0' }}><strong>Message:</strong> {request.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requests Received Section */}
      <div>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Requests Received</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          {receivedRequests.map((request) => (
            <div
              key={request.id}
              style={{
                background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                padding: '20px',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0' }}>{request.startupName}</h4>
              <p style={{ margin: '5px 0' }}><strong>Role:</strong> {request.role}</p>
              <p style={{ margin: '5px 0' }}><strong>Received:</strong> {request.appliedDate}</p>
              <p style={{ margin: '5px 0' }}><strong>Message:</strong> {request.message}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onClick={() => console.log('Accept', request.id)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#388e3c'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4caf50'}
                >
                  Accept
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#f44336',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onClick={() => console.log('Reject', request.id)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <IoHome size="15px" color="inherit" />,
    component: Dashboard,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Discover",
    key: "discover",
    route: "/discover",
    icon: <IoRocketSharp size="15px" color="inherit" />,
    component: Discover,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "My Join Requests",
    key: "my-join-requests",
    route: "/my-join-requests",
    icon: <IoIosDocument size="15px" color="inherit" />,
    component: MyJoinRequests,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Profiles",
    key: "new-profiles",
    route: "/profiles-list",
    icon: <BsFillPersonFill size="15px" color="inherit" />,
    component: ProfilesList,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Affiliate Links",
    key: "affiliate-links",
    route: "/affiliate-links",
    icon: <IoStatsChart size="15px" color="inherit" />,
    component: AffiliateLinks,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Requests Freelance",
    key: "requests-freelance",
    route: "/requests-freelance",
    icon: <IoIosDocument size="15px" color="inherit" />,
    component: FreelanceTasks,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Chat Box",
    key: "chat-box",
    route: "/chat-box",
    icon: <IoBuild size="15px" color="inherit" />,
    component: ChatBox,
    noCollapse: true,
  },
  { type: "title", title: "Account Pages", key: "account-pages" },
  {
    type: "collapse",
    name: "User Information",
    key: "user-profiles",
    route: "/profiles",
    icon: <BsFillPersonFill size="15px" color="inherit" />,
    component: Profile,
    noCollapse: true,
  },
  {
    // This route is hidden from the sidebar but used for navigation
    type: "no-collapse",
    name: "User Details",
    key: "user-details",
    route: "/user-details/:userId",
    icon: <BsFillPersonFill size="15px" color="inherit" />,
    component: UserDetails,
    noCollapse: true,
    hidden: true,
  },
  {
    // This route is hidden from the sidebar but used for navigation
    type: "no-collapse",
    name: "Startup Profile",
    key: "startup-profile",
    route: "/startup-profile/:startupId",
    icon: <IoBuild size="15px" color="inherit" />,
    component: StartupProfile,
    noCollapse: true,
    hidden: true,
  },
];

export default routes;
