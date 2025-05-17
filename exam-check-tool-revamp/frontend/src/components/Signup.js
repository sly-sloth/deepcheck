import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, Alert } from 'react-bootstrap';

const degreeOptions = [
  'B.Tech.', 'M.Tech.', 'BBA', 'MBA', 'BFTech', 'PhD'
];

const departmentOptions = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Biotechnology',
  'Mechanical Engineering',
  'Physics',
  'Chemistry',
  'Mathematics',
];

const designationOptions = [
  'Professor',
  'Assistant Professor',
  'HOD',
  'Teaching Assistant',
];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // Step 2 fields
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('');
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('');
  const [designation, setDesignation] = useState('');
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password || !confirm) {
      setError('Please fill all fields');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (role === 'teacher') {
      if (!name || !department || !designation) {
        setError('Please fill all details');
        return;
      }
    } else {
      if (!name || !branch || !rollNo || !department || !degree || !semester) {
        setError('Please fill all details');
        return;
      }
    }
    setLoading(true);
    try {
      const body = role === 'teacher'
        ? { username, password, role, name, department, designation }
        : { username, password, role, name, branch, rollNo, department, degree, semester };
      const res = await fetch('http://127.0.0.1:5001/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setSuccess('Signup successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Container className="p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <Card style={{ background: 'black', color: 'white', border: 'solid #1e90ff', minWidth: step === 2 ? 600 : 350, maxWidth: step === 2 ? 700 : 400 }}>
        <Card.Body>
          <h2 className="mb-4" style={{ color: '#1e90ff' }}>Sign Up</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {step === 1 ? (
            <Form onSubmit={handleNext}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select value={role} onChange={e => setRole(e.target.value)} required>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Form.Select>
              </Form.Group>
              <Button type="submit" variant="primary" disabled={loading} className="w-100">Next</Button>
            </Form>
          ) : (
            <Form onSubmit={handleSubmit}>
              {role === 'teacher' ? (
                <>
                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} required />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Department</Form.Label>
                        <Form.Select value={department} onChange={e => setDepartment(e.target.value)} required>
                          <option value="" disabled>Select Department</option>
                          {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Designation</Form.Label>
                        <Form.Select value={designation} onChange={e => setDesignation(e.target.value)} required>
                          <option value="" disabled>Select Designation</option>
                          {designationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>
                </>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Branch</Form.Label>
                      <Form.Control type="text" value={branch} onChange={e => setBranch(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Roll No.</Form.Label>
                      <Form.Control type="text" value={rollNo} onChange={e => setRollNo(e.target.value)} required />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Department</Form.Label>
                      <Form.Select value={department} onChange={e => setDepartment(e.target.value)} required>
                        <option value="" disabled>Select Department</option>
                        {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Degree</Form.Label>
                      <Form.Select value={degree} onChange={e => setDegree(e.target.value)} required>
                        <option value="" disabled>Select Degree</option>
                        {degreeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Semester</Form.Label>
                      <Form.Control type="number" min="1" max="12" value={semester} onChange={e => setSemester(e.target.value)} required />
                    </Form.Group>
                  </div>
                </div>
              )}
              <div className="d-flex justify-content-center mt-3 gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>Back</Button>
                <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</Button>
              </div>
            </Form>
          )}
          <div className="mt-3 text-center">
            <span>Already have an account? </span>
            <Button variant="link" style={{ color: '#5f259f', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Login</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Signup; 