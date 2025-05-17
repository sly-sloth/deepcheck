import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Button, Spinner } from 'react-bootstrap';

const StudentExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5001/student/exams');
        const data = await res.json();
        setExams(data);
      } catch (err) {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <Container className="p-4" style={{ marginTop: '100px' }}>
      <h2 className="mb-4" style={{ color: 'white' }}>Available Exams</h2>
      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : exams.length === 0 ? (
        <p style={{ color: 'white' }}>No exams available.</p>
      ) : (
        <Row>
          {exams.map((exam) => (
            <Col md={6} lg={4} key={exam.id} className="mb-4">
              <Card style={{ backgroundColor: 'black', color: 'white', border: 'solid #1e90ff' }}>
                <Card.Body>
                  <Card.Title>{exam.title}</Card.Title>
                  <Card.Subtitle className="mb-2" style={{ color: '#bbb' }}>Duration: {exam.duration} mins</Card.Subtitle>
                  <Card.Text>
                    <b>Description:</b> {exam.description}<br />
                    <b>Questions:</b> {exam.questions ? exam.questions.length : 0}
                  </Card.Text>
                  <Button variant="success" onClick={() => {
                    // Check for unfinished attempt in localStorage
                    const saved = JSON.parse(localStorage.getItem(`student_attempt_${exam.id}`) || '{}');
                    if (saved.attemptId && !saved.submitted) {
                      window.location.href = `/student/exam/${exam.id}`;
                    } else {
                      navigate(`/student/exam/${exam.id}`);
                    }
                  }}>
                    Start Exam
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default StudentExamList; 