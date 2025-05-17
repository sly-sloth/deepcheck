import React, { useState } from 'react';
import { Card, Col, Row, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const chicletWidth = 320;
const chicletStyle = {
  background: '#000',
  color: '#fff',
  borderRadius: 0,
  boxShadow: '0 8px 24px 0 #1e90ff33',
  cursor: 'pointer',
  minHeight: 160,
  minWidth: chicletWidth,
  maxWidth: chicletWidth,
  width: chicletWidth,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2.2rem',
  fontWeight: 700,
  transition: 'transform 0.32s cubic-bezier(.4,2,.6,1), box-shadow 0.32s cubic-bezier(.4,2,.6,1)',
  border: 'none',
  margin: '0 18px',
};
const chicletHover = {
  transform: 'translateY(-10px) scale(1.04)',
  boxShadow: '0 16px 32px 0 #1e90ff55',
};

function TeacherDashboard() {
  const navigate = useNavigate();
  const [hoverIdx, setHoverIdx] = useState(-1);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const name = user && user.name ? user.name : (user && user.username ? user.username : 'Teacher');

  return (
    <Container className="p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <Row className="w-100 justify-content-center align-items-center" style={{ maxWidth: 800 }}>
        <Col xs={12} className="mb-5 text-center">
          <h1 style={{ color: '#1e90ff', fontWeight: 'bold', fontSize: '2.5rem' }}>Welcome, {name}!</h1>
        </Col>
        <Col md={6} className="mb-4 d-flex justify-content-center">
          <Card
            style={hoverIdx === 0 ? { ...chicletStyle, ...chicletHover } : chicletStyle}
            onClick={() => navigate('/create-exam')}
            onMouseEnter={() => setHoverIdx(0)}
            onMouseLeave={() => setHoverIdx(-1)}
          >
            + Create Exam
          </Card>
        </Col>
        <Col md={6} className="mb-4 d-flex justify-content-center">
          <Card
            style={hoverIdx === 1 ? { ...chicletStyle, ...chicletHover } : chicletStyle}
            onClick={() => navigate('/teacher/exams')}
            onMouseEnter={() => setHoverIdx(1)}
            onMouseLeave={() => setHoverIdx(-1)}
          >
            My Exams
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TeacherDashboard; 