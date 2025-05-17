import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Table, Spinner, Alert, Form, Modal } from 'react-bootstrap';

const ROLES = ['student', 'teacher', 'admin'];

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleModal, setRoleModal] = useState({ show: false, user: null, newRole: '' });
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/admin/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError('Could not load users.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:5001/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess('User deleted.');
      fetchUsers();
    } catch (e) {
      setError('Could not delete user.');
    }
  };

  const handleChangeRole = async () => {
    if (!roleModal.user || !roleModal.newRole) return;
    try {
      const res = await fetch(`http://localhost:5001/admin/users/${roleModal.user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: roleModal.newRole })
      });
      if (!res.ok) throw new Error('Role update failed');
      setSuccess('Role updated.');
      setRoleModal({ show: false, user: null, newRole: '' });
      fetchUsers();
    } catch (e) {
      setError('Could not update role.');
    }
  };

  return (
    <Container className="p-4" style={{ marginTop: '100px', maxWidth: 900 }}>
      <Card style={{ background: 'black', color: 'white', border: 'solid #e74c3c', boxShadow: '0 4px 24px #e74c3c44' }}>
        <Card.Body>
          <h2 style={{ color: '#e74c3c', fontWeight: 700 }}>Admin Panel</h2>
          <div className="mb-3" style={{ color: '#e74c3c', fontWeight: 500 }}>
            <span>⚠️ Admin access only. Actions are irreversible!</span>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {loading ? (
            <Spinner animation="border" variant="danger" />
          ) : (
            <Table striped bordered hover variant="dark" className="mt-3">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>
                      <Button variant="outline-warning" size="sm" className="me-2" onClick={() => setRoleModal({ show: true, user: u, newRole: u.role })}>Change Role</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(u.id)} disabled={u.role === 'admin'}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <div className="mt-4 d-flex gap-3">
            <Button variant="outline-info" href="/admin/exams">View All Exams</Button>
            <Button variant="outline-info" href="/admin/attempts">View All Attempts</Button>
          </div>
        </Card.Body>
      </Card>
      <Modal show={roleModal.show} onHide={() => setRoleModal({ show: false, user: null, newRole: '' })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Select value={roleModal.newRole} onChange={e => setRoleModal(r => ({ ...r, newRole: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRoleModal({ show: false, user: null, newRole: '' })}>Cancel</Button>
          <Button variant="primary" onClick={handleChangeRole}>Update Role</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel; 