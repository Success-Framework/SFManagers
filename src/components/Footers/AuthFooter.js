import React from 'react';
import { Row, Col, Nav, NavItem, NavLink } from 'reactstrap';

const AuthFooter = () => {
  return (
    <footer className="py-5">
      <Row className="align-items-center justify-content-xl-between">
        <Col xl="6">
          <div className="copyright text-center text-xl-left text-muted">
            © {new Date().getFullYear()}{' '}
            <a
              className="font-weight-bold ml-1"
              href="https://sfmanagers.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              SFManagers
            </a>
          </div>
        </Col>
        <Col xl="6">
          <Nav className="nav-footer justify-content-center justify-content-xl-end">
            <NavItem>
              <NavLink
                href="https://sfmanagers.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                SFManagers
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                href="https://sfmanagers.com/about"
                target="_blank"
                rel="noopener noreferrer"
              >
                About Us
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                href="https://sfmanagers.com/blog"
                target="_blank"
                rel="noopener noreferrer"
              >
                Blog
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                href="https://sfmanagers.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </NavLink>
            </NavItem>
          </Nav>
        </Col>
      </Row>
    </footer>
  );
};

export default AuthFooter;
