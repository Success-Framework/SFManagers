import React from 'react';
import { Link } from 'react-router-dom';
import {
  Navbar,
  Nav,
  NavItem,
  NavLink,
  Container,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import { useAuth } from '../../context/AuthContext';

const AuthNavbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <Navbar className="navbar-top navbar-dark" expand="md" id="navbar-main">
      <Container fluid>
        <Link className="h4 mb-0 text-white text-uppercase d-none d-lg-inline-block" to="/">
          SFManagers
        </Link>
        <Nav className="align-items-center d-none d-md-flex" navbar>
          {user ? (
            <UncontrolledDropdown nav>
              <DropdownToggle className="pr-0" nav>
                <span className="avatar avatar-sm rounded-circle">
                  {user.firstName ? user.firstName.charAt(0) : 'U'}
                </span>
                <span className="ml-2 d-none d-lg-block">
                  <span className="mb-0 text-sm font-weight-bold">
                    {user.firstName} {user.lastName}
                  </span>
                </span>
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-arrow" right>
                <DropdownItem to="/profile" tag={Link}>
                  <i className="ni ni-single-02" />
                  <span>My profile</span>
                </DropdownItem>
                <DropdownItem to="/settings" tag={Link}>
                  <i className="ni ni-settings-gear-65" />
                  <span>Settings</span>
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={handleLogout}>
                  <i className="ni ni-user-run" />
                  <span>Logout</span>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          ) : (
            <>
              <NavItem>
                <NavLink to="/login" tag={Link}>
                  Login
                </NavLink>
              </NavItem>
              <NavItem>
                <Button color="primary" to="/register" tag={Link}>
                  Register
                </Button>
              </NavItem>
            </>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default AuthNavbar;
