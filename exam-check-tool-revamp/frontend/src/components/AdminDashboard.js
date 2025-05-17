import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col } from 'react-bootstrap';

const chicletStyle = {
  background: 'black',
  color: 'white',
  fontWeight: 700,
  fontSize: 36,
  borderRadius: 0,
  boxShadow: '0 8px 16px 0 #e74c3c66',
  padding: '36px 24px',
  minHeight: 200,
  minWidth: 320,
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  cursor: 'pointer',
  border: 'none',
  transition: 'transform 0.45s cubic-bezier(.4,2,.6,1), box-shadow 0.45s cubic-bezier(.4,2,.6,1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1.2,
  wordBreak: 'break-word',
  whiteSpace: 'normal',
};

const chicletHover = {
  transform: 'translateY(-10px) scale(1.04)',
  boxShadow: '0 16px 32px 0 #e74c3c99',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  // Track hover state for each chiclet
  const [hovered, setHovered] = React.useState([false, false, false]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container className="p-4" style={{ maxWidth: 1300 }}>
        <h1 style={{ color: '#e74c3c', fontWeight: 900, marginBottom: 40, textAlign: 'center', letterSpacing: 2 }}>Admin Dashboard</h1>
        <Row className="g-4 justify-content-center">
          {['Manage Users', 'View All Exams', 'View All Attempts'].map((label, i) => (
            <Col xs={12} md={4} key={label} className="d-flex justify-content-center">
              <Card
                style={{ ...chicletStyle, ...(hovered[i] ? chicletHover : {}) }}
                onClick={() => {
                  if (i === 0) navigate('/admin/dashboard/users');
                  if (i === 1) navigate('/admin/exams');
                  if (i === 2) navigate('/admin/attempts');
                }}
                onMouseEnter={() => setHovered(h => h.map((v, idx) => idx === i ? true : v))}
                onMouseLeave={() => setHovered(h => h.map((v, idx) => idx === i ? false : v))}
              >
                <span style={{ display: 'block', width: '100%', wordBreak: 'break-word', whiteSpace: 'normal' }}>{label}</span>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard; 