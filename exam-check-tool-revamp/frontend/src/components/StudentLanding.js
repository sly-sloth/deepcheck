import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Card } from 'react-bootstrap';

const StudentLanding = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const name = user && user.name ? user.name : (user && user.username ? user.username : 'Student');

  return (
    <Container className="p-4" style={{ marginTop: '100px' }}>
      <Card style={{ backgroundColor: 'black', color: 'white', border: 'solid #1e90ff' }}>
        <Card.Body className="text-center">
          <h2>Welcome, {name}!</h2>
          <p>Ready to take your exam?</p>
          <Button variant="primary" size="lg" className="me-3" onClick={() => navigate('/student/exams')}>
            Go to Available Exams
          </Button>
          <Button variant="info" size="lg" onClick={() => navigate('/student/history')}>
            Exam History
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StudentLanding; 