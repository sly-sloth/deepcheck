import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Button, Form, Alert } from 'react-bootstrap';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roleParam = params.get('role');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      if (user.role === 'teacher') navigate('/teacher/exams');
      else if (user.role === 'student') navigate('/student');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      if (data.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Container className="p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <Card style={{ background: 'black', color: 'white', border: 'solid #1e90ff', minWidth: 350, maxWidth: 400 }}>
        <Card.Body>
          <h2 className="mb-4" style={{ color: '#1e90ff' }}>Login</h2>
          {roleParam && (
            <Alert variant="info" className="mb-3" style={{ fontWeight: 'bold' }}>
              {roleParam === 'teacher' ? 'Teacher Panel Login' : roleParam === 'student' ? 'Student Panel Login' : ''}
            </Alert>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading} className="w-100">{loading ? 'Logging in...' : 'Login'}</Button>
          </Form>
          <div className="mt-3 text-center">
            <span>Don't have an account? </span>
            <Button variant="link" style={{ color: '#9B59B6', textDecoration: 'underline', fontWeight: 'bold', textShadow: '0 1px 6px #9B59B644' }} onClick={() => navigate('/signup')}>Sign up</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login; 