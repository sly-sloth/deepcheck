import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Image } from 'react-bootstrap';

export const Homepage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isTeacher = user && user.role === 'teacher';
    const isStudent = user && user.role === 'student';
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };
    return (
        <Container className="p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
            <Card style={{ backgroundColor: 'black', color: 'white', border: 'solid #1e90ff', width: '100%', maxWidth: 1200, boxShadow: '0 4px 32px #1e90ff22', padding: '2.5rem 0' }}>
                <Row className="g-0 align-items-center">
                    <Col md={7} className="p-5">
                        <h1 style={{ color: '#1e90ff', fontWeight: 'bold', fontSize: '2.5rem' }}>Welcome to DeepCheck</h1>
                        <p className="mt-3" style={{ fontSize: '1.2rem', color: '#d1d1d1' }}>
                            A modern platform for teachers to create and manage exams, and for students to attempt and get instant feedback.
                        </p>
                        <div className="mt-4 d-flex gap-3">
                            {(!isStudent) && (
                                <Button
                                    size="lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #1e90ff 60%, #0056b3 100%)',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        color: '#fff',
                                        boxShadow: '0 2px 12px #1e90ff44, 0 1.5px 0 #fff2 inset'
                                    }}
                                    onClick={() => isTeacher ? navigate('/teacher/dashboard') : navigate('/login?role=teacher')}
                                >
                                    Teacher Panel
                                </Button>
                            )}
                            {(!isTeacher) && (
                                <Button
                                    size="lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #9B59B6 60%, #8f44ad 100%)',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        color: '#fff',
                                        boxShadow: '0 2px 12px #9B59B644, 0 1.5px 0 #fff2 inset'
                                    }}
                                    onClick={() => navigate('/login?role=student')}
                                >
                                    Student Panel
                                </Button>
                            )}
                        </div>
                    </Col>
                    <Col md={5} className="d-flex justify-content-center align-items-center p-4">
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/e/e4/NSUT_logo.png" alt="NSUT Logo" style={{ maxWidth: 300, width: '100%', height: 'auto', background: 'white', borderRadius: 20, padding: 32 }} />
                    </Col>
                </Row>
            </Card>
        </Container>
    );
}