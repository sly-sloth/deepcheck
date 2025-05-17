import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Spinner, Alert } from 'react-bootstrap';

const AdminAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAttempts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/admin/attempts', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch attempts');
      const data = await res.json();
      // Sort by start_time descending (latest first)
      data.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
      setAttempts(data);
    } catch (e) {
      setError('Could not load attempts.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
      navigate('/admin');
    } else {
      fetchAttempts();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <Container className="p-4" style={{ marginTop: '100px', maxWidth: 1400 }}>
      <Card style={{ background: 'black', color: 'white', border: 'solid #e74c3c', boxShadow: '0 4px 24px #e74c3c44' }}>
        <Card.Body>
          <h2 style={{ color: '#e74c3c', fontWeight: 700 }}>All Attempts</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <Spinner animation="border" variant="danger" />
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <Table striped bordered hover variant="dark" className="mt-3" style={{ minWidth: 800, width: '100%' }}>
                <thead>
                  <tr>
                    <th>Attempt ID</th>
                    <th>Exam ID</th>
                    <th>Student ID</th>
                    <th>Start Time</th>
                    <th>Submitted</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(a => (
                    <tr key={a.attempt_id}>
                      <td>{a.attempt_id}</td>
                      <td>{a.exam_id}</td>
                      <td>{a.student_id}</td>
                      <td>{a.start_time ? new Date(a.start_time * 1000).toLocaleString() : ''}</td>
                      <td>{a.submitted ? 'Yes' : 'No'}</td>
                      <td>{a.end_time ? new Date(a.end_time * 1000).toLocaleString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminAttempts; 