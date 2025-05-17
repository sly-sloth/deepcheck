import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Button, Spinner, Alert } from 'react-bootstrap';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/admin/exams', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch exams');
      const data = await res.json();
      setExams(data);
    } catch (e) {
      setError('Could not load exams.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
      navigate('/admin');
    } else {
      fetchExams();
    }
    // eslint-disable-next-line
  }, []);

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await fetch(`http://localhost:5001/exams/${examId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess('Exam deleted.');
      fetchExams();
    } catch (e) {
      setError('Could not delete exam.');
    }
  };

  return (
    <Container className="p-4" style={{ marginTop: '100px', maxWidth: 900 }}>
      <Card style={{ background: 'black', color: 'white', border: 'solid #e74c3c', boxShadow: '0 4px 24px #e74c3c44' }}>
        <Card.Body>
          <h2 style={{ color: '#e74c3c', fontWeight: 700 }}>All Exams</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {loading ? (
            <Spinner animation="border" variant="danger" />
          ) : (
            <Table striped bordered hover variant="dark" className="mt-3">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Duration (min)</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => (
                  <tr key={e.id}>
                    <td>{e.title}</td>
                    <td>{e.description}</td>
                    <td>{e.duration}</td>
                    <td>{e.teacher}</td>
                    <td>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(e.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminExams; 