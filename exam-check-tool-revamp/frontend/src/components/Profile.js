import React, { useState, useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

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

function getInitials(name, username) {
  if (name && name.trim()) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  return (username || '?').slice(0, 2).toUpperCase();
}

const Profile = () => {
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    designation: user?.designation || '',
    branch: user?.branch || '',
    rollNo: user?.rollNo || '',
    degree: user?.degree || '',
    semester: user?.semester || '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5001/auth/me', {
          headers: {
            'Authorization': localStorage.getItem('token') || ''
          },
          credentials: 'include'
        });
        if (res.ok) {
          const me = await res.json();
          setUser(me);
          setForm({
            name: me?.name || '',
            department: me?.department || '',
            designation: me?.designation || '',
            branch: me?.branch || '',
            rollNo: me?.rollNo || '',
            degree: me?.degree || '',
            semester: me?.semester || '',
          });
          localStorage.setItem('user', JSON.stringify(me));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    // eslint-disable-next-line
  }, []);

  if (!user) {
    return (
      <Container className="p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
        <Card style={{ background: 'black', color: 'white', border: 'solid #1e90ff', minWidth: 350, maxWidth: 400 }}>
          <Card.Body>
            <h2 className="mb-4" style={{ color: '#1e90ff' }}>Profile</h2>
            <p>You are not logged in.</p>
            <Button variant="primary" onClick={() => navigate('/login')}>Login</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
        <div className="text-center text-light">Loading...</div>
      </Container>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    const updated = { ...user, ...form };
    try {
      const res = await fetch('http://localhost:5001/auth/update_profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || ''
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      // Fetch latest user data from backend
      const meRes = await fetch('http://localhost:5001/auth/me', {
        headers: {
          'Authorization': localStorage.getItem('token') || ''
        },
        credentials: 'include'
      });
      if (meRes.ok) {
        const me = await meRes.json();
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      }
      setEdit(false);
    } catch (e) {
      alert('Failed to update profile.');
    }
  };

  // --- Elegant Layout ---
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '90vh', background: 'transparent' }}>
      <Card style={{ background: '#181824', color: 'white', border: 'none', borderRadius: 18, minWidth: 320, maxWidth: 370, boxShadow: '0 8px 32px #1e90ff33', padding: 0 }}>
        <Card.Body className="px-4 py-4">
          <div className="d-flex flex-column align-items-center mb-4">
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1e90ff 60%, #0056b3 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 12, boxShadow: '0 2px 12px #1e90ff44'
            }}>{getInitials(user.name, user.username)}</div>
            <div className="text-center">
              <div style={{ fontWeight: 700, fontSize: 22 }}>{user.name || user.username}</div>
              <div style={{ color: '#1e90ff', fontWeight: 500, fontSize: 15 }}>{user.role?.toUpperCase()}</div>
            </div>
          </div>
          <hr style={{ borderColor: '#1e90ff33', margin: '18px 0 24px 0' }} />
          <div className="mb-3" style={{ fontSize: '1.08rem' }}>
            <div className="row g-2">
              <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Username:</div>
              <div className="col-6">{user.username}</div>
              {edit ? (
                <>
                  <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Name:</label><input name="name" value={form.name} onChange={handleChange} className="form-control form-control-sm w-100" /></div>
                  <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Department:</label><select name="department" value={form.department} onChange={handleChange} className="form-control form-control-sm w-100"><option value="" disabled>Select Department</option>{departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                  {user.role === 'teacher' ? (
                    <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Designation:</label><select name="designation" value={form.designation} onChange={handleChange} className="form-control form-control-sm w-100"><option value="" disabled>Select Designation</option>{designationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                  ) : (
                    <>
                      <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Branch:</label><input name="branch" value={form.branch} onChange={handleChange} className="form-control form-control-sm w-100" /></div>
                      <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Roll No.:</label><input name="rollNo" value={form.rollNo} onChange={handleChange} className="form-control form-control-sm w-100" /></div>
                      <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Degree:</label><select name="degree" value={form.degree} onChange={handleChange} className="form-control form-control-sm w-100">{degreeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                      <div className="col-12 mt-2"><label className="mb-1" style={{ color: '#bbb', fontWeight: 500 }}>Semester:</label><input name="semester" type="number" min="1" max="12" value={form.semester} onChange={handleChange} className="form-control form-control-sm w-100" /></div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Name:</div>
                  <div className="col-6">{user.name || '-'}</div>
                  <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Department:</div>
                  <div className="col-6">{user.department || '-'}</div>
                  {user.role === 'teacher' ? (
                    <>
                      <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Designation:</div>
                      <div className="col-6">{user.designation || '-'}</div>
                    </>
                  ) : (
                    <>
                      <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Branch:</div>
                      <div className="col-6">{user.branch || '-'}</div>
                      <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Roll No.:</div>
                      <div className="col-6">{user.rollNo || '-'}</div>
                      <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Degree:</div>
                      <div className="col-6">{user.degree || '-'}</div>
                      <div className="col-6 text-end pe-2" style={{ color: '#bbb' }}>Semester:</div>
                      <div className="col-6">{user.semester || '-'}</div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="d-flex justify-content-center mt-4 gap-3">
            {edit ? (
              <>
                <Button variant="success" size="sm" onClick={handleSave}>Save</Button>
                <Button variant="secondary" size="sm" onClick={() => setEdit(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="primary" size="md" onClick={() => setEdit(true)}>Edit</Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile; 