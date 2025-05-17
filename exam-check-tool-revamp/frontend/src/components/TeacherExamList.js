import React, { useEffect, useState } from 'react';
import { Card, Container, Row, Col, Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const TeacherExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/exams', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setExams(data);
      } else if (data && data.error) {
        setError(data.error);
        setExams([]);
      } else {
        setError('Unexpected response from server.');
        setExams([]);
      }
    } catch (err) {
      setExams([]);
      setError('Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await fetch(`http://localhost:5001/exams/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchExams();
      else alert('Failed to delete exam');
    } catch {
      alert('Failed to delete exam');
    }
  };

  return (
    <Container className="p-4" style={{ marginTop: '100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: 'white' }}>Created Exams</h2>
        <Button variant="success" size="lg" onClick={() => navigate('/create-exam')}>
          + Create Exam
        </Button>
      </div>
      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : error ? (
        <p style={{ color: 'orange' }}>{error}</p>
      ) : exams.length === 0 ? (
        <p style={{ color: 'white' }}>No exams found.</p>
      ) : (
        <Row>
          {exams.map((exam) => (
            <Col md={6} lg={4} key={exam.id} className="mb-4">
              <Card style={{ backgroundColor: 'black', color: 'white', border: 'solid #1e90ff' }}>
                <Card.Body>
                  <Card.Title>{exam.title}</Card.Title>
                  <Card.Subtitle className="mb-2" style={{ color: '#e0e0e0' }}>Duration: {exam.duration} mins</Card.Subtitle>
                  <Card.Text>
                    <b>Description:</b> {exam.description}<br />
                    <b>Questions:</b> {exam.questions ? exam.questions.length : 0}
                  </Card.Text>
                  <div className="d-flex gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={() => navigate(`/edit-exam/${exam.id}`)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(exam.id)}>Delete</Button>
                    <Button variant="info" size="sm" onClick={() => navigate(`/view-exam/${exam.id}`)}>View</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default TeacherExamList; 