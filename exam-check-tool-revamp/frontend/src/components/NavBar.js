import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from './useAuth';
import logo from '../assets/deepcheck-logo.jpg';

export const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, role, logout } = useAuth();
  const isTeacher = user && user.role === 'teacher';
  const isStudent = user && user.role === 'student';
  const isAdmin = user && user.role === 'admin';
  const inAdmin = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className="custom-navbar-black"
      style={{
        borderBottom: '2px solid #1e90ff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        zIndex: 1000,
      }}
    >
      <Container>
        <Navbar.Brand style={{ cursor: 'pointer', color: '#1e90ff', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
          <img src={logo} alt="DeepCheck Logo" style={{ height: 36, width: 36, marginRight: 12, borderRadius: 4, objectFit: 'cover', background: '#fff' }} />
          DeepCheck Exam Portal
        </Navbar.Brand>
        <Nav className="ms-auto" style={{ alignItems: 'center' }}>
          <Button variant="outline-primary" className="me-2" onClick={() => { if (!inAdmin) navigate('/'); }} disabled={inAdmin}>Home</Button>
          {!(isAdmin || inAdmin) && !isStudent && (
            <Button
              className="me-2 glossy-blue-btn"
              onClick={() => navigate('/teacher/dashboard')}
            >
              Teacher
            </Button>
          )}
          {!(isAdmin || inAdmin) && !isTeacher && (
            <Button
              className="student-navbar-btn"
              style={{
                background: 'transparent',
                color: '#5f259f',
                border: '2px solid #5f259f',
                transition: 'all 0.2s',
              }}
              onClick={() => navigate('/student')}
            >
              Student
            </Button>
          )}
          {role === 'admin' && (
            <Nav.Link href="/admin" style={{ color: '#e74c3c', fontWeight: 700 }}>Admin Panel</Nav.Link>
          )}
          <Dropdown align="end" className="ms-3 profile-dropdown">
            <Dropdown.Toggle
              variant="link"
              id="dropdown-profile"
              style={{
                padding: 0,
                border: 'none',
                background: 'none',
                boxShadow: 'none',
                outline: 'none',
                minWidth: 0,
                minHeight: 0,
              }}
            >
              <span className="profile-circle">
                <FaUserCircle size={38} color="#1e90ff" />
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="profile-dropdown-menu">
              <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
              {!user ? (
                <Dropdown.Item onClick={() => navigate('/login')}>Login</Dropdown.Item>
              ) : (
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};