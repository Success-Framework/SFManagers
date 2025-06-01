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
import Dashboard from "@/layouts/dashboard/index.jsx";
// import Tables from "@/layouts/tables/index.js";
// import Billing from "@/layouts/billing/index.js";
// import RTL from "@/layouts/rtl/index.js";
import Profile from "@/layouts/profile/index.jsx";
// import SignIn from "@/layouts/authentication/sign-in/index.js";
// import SignUp from "@/layouts/authentication/sign-up/index.js";
// import StartupDashboard from "@/layouts/dashboard/components/Startups/StartupDashboard.js";
import FreelanceTasks from "@/layouts/requests-freelance/index.jsx";
import ProfilesList from "@/layouts/profiles-list/index.jsx";
import UserDetails from "@/layouts/user-details/index.jsx";

// Vision UI Dashboard React icons
import { IoRocketSharp } from "react-icons/io5";
import { IoIosDocument } from "react-icons/io";
import { BsFillPersonFill } from "react-icons/bs";
import { IoBuild } from "react-icons/io5";
import { BsCreditCardFill } from "react-icons/bs";
import { IoStatsChart } from "react-icons/io5";
import { IoHome } from "react-icons/io5";

// Placeholder components for new routes
import Discover from "@/layouts/discover/index.jsx";
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
import MyJoinRequests from "@/layouts/my-join-requests/index.jsx";

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
