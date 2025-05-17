import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Button, Spinner, Nav, Form, Alert, Modal, Toast } from 'react-bootstrap';
import { FaFlag, FaRegFlag } from 'react-icons/fa';

const LS_KEY = (examId) => `student_attempt_${examId}`;

const StudentExamWindow = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerWarning, setTimerWarning] = useState(0); // 0: none, 1: 5min, 2: 1min
  const timerRef = useRef();
  const beepRef = useRef();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [flagged, setFlagged] = useState({});
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const username = user?.username;

  // Load or create attempt
  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }
    const loadAttempt = async () => {
      setLoading(true);
      setError('');
      // Check localStorage for attemptId
      const saved = JSON.parse(localStorage.getItem(LS_KEY(examId)) || '{}');
      let attId = saved.attemptId;
      let ans = saved.answers || {};
      let stTime = saved.startTime;
      let examData = saved.exam;
      let dur = saved.duration;
      if (attId) {
        // Resume attempt
        try {
          const res = await fetch(`http://localhost:5001/student/attempts/${attId}`);
          if (!res.ok) throw new Error('Attempt not found');
          const data = await res.json();
          setAttemptId(attId);
          setStartTime(data.start_time);
          setDuration(examData ? examData.duration : dur);
          setExam(examData || data.exam);
          setAnswers(ans);
        } catch (e) {
          // Fallback: create new attempt
          attId = null;
        }
      }
      if (!attId) {
        // Create new attempt
        try {
          const res = await fetch('http://localhost:5001/student/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam_id: examId, student_id: username }),
          });
          if (!res.ok) throw new Error('Could not start attempt');
          const data = await res.json();
          setAttemptId(data.attempt_id);
          setStartTime(data.start_time);
          setExam(data.exam);
          setDuration(data.exam.duration);
          setAnswers({});
          // Save to localStorage
          localStorage.setItem(LS_KEY(examId), JSON.stringify({
            attemptId: data.attempt_id,
            startTime: data.start_time,
            exam: data.exam,
            duration: data.exam.duration,
            answers: {},
          }));
        } catch (e) {
          setError('Could not start exam.');
        }
      }
      setLoading(false);
    };
    loadAttempt();
    // eslint-disable-next-line
  }, [examId]);

  // Timer logic
  useEffect(() => {
    if (!startTime || !duration || !attemptId) return;
    let intervalId;
    let backendIntervalId;
    let stopped = false;

    // Poll backend every 10 seconds for remaining time (for anti-cheat)
    const pollBackend = async () => {
      try {
        const res = await fetch(`http://localhost:5001/student/attempts/${attemptId}/remaining_time`);
        if (!res.ok) throw new Error('Could not fetch remaining time');
        const data = await res.json();
        if (data.expired) {
          setTimeLeft(0);
          clearInterval(intervalId);
          clearInterval(backendIntervalId);
          handleSubmit();
        } else {
          setTimeLeft(data.remaining_time);
        }
      } catch (e) {
        // fallback: do nothing
      }
    };

    // Local timer for smooth countdown
    const updateTimer = () => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        // Timer warnings
        if (prev <= 60 && timerWarning < 2) {
          setTimerWarning(2);
          if (beepRef.current) beepRef.current.play();
        } else if (prev <= 300 && timerWarning < 1) {
          setTimerWarning(1);
          if (beepRef.current) beepRef.current.play();
        }
        if (prev <= 1) {
          clearInterval(intervalId);
          clearInterval(backendIntervalId);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    };

    // Initial backend poll to get accurate time
    pollBackend();
    backendIntervalId = setInterval(pollBackend, 10000); // every 10s
    intervalId = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(backendIntervalId);
    };
    // eslint-disable-next-line
  }, [startTime, duration, attemptId, timerWarning]);

  // Save answers to localStorage
  useEffect(() => {
    if (attemptId && exam) {
      localStorage.setItem(LS_KEY(examId), JSON.stringify({
        attemptId,
        startTime,
        exam,
        duration,
        answers,
      }));
    }
  }, [answers, attemptId, exam, startTime, duration, examId]);

  // On mount, check for unfinished attempt in localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY(examId)) || '{}');
    if (saved.attemptId && !saved.submitted) {
      setResumeData(saved);
      setShowResumeModal(true);
    }
    // eslint-disable-next-line
  }, [examId]);

  // Load flagged state from localStorage on mount
  useEffect(() => {
    const savedFlags = JSON.parse(localStorage.getItem(`flags_${examId}`) || '{}');
    setFlagged(savedFlags);
  }, [examId]);

  // Save flagged state to localStorage
  useEffect(() => {
    localStorage.setItem(`flags_${examId}`, JSON.stringify(flagged));
  }, [flagged, examId]);

  // Show instructions modal when exam is loaded and not started
  useEffect(() => {
    if (exam && typeof exam.instructions === 'string' && exam.instructions.trim().length > 0 && !examStarted) {
      setShowInstructions(true);
    } else if (exam && (!exam.instructions || exam.instructions.trim().length === 0) && !examStarted) {
      setExamStarted(true);
    }
  }, [exam, examStarted]);

  useEffect(() => {
    setTimerWarning(0);
  }, [examId, attemptId, startTime]);

  if (loading) {
    return <div style={{ color: 'white', marginTop: '100px' }}><Spinner animation="border" variant="primary" /></div>;
  }
  if (error) {
    if (error.includes('auto-submitted')) {
      return <Alert variant="danger" style={{ marginTop: '100px', fontWeight: 'bold', fontSize: 20 }}>{error}</Alert>;
    }
    return <Alert variant="danger" style={{ marginTop: '100px' }}>{error}</Alert>;
  }
  if (!exam) {
    return <div style={{ color: 'white', marginTop: '100px' }}>Exam not found.</div>;
  }

  const questions = exam.questions || [];

  // Timer display
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;

  // Handle answer change
  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  // Handle submit
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5001/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId, answers }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data && data.error && data.error.includes('Time is up')) {
          setError('Time is up! Your exam was auto-submitted.');
          localStorage.removeItem(LS_KEY(examId));
          setTimeout(() => {
            navigate(`/student/exam/${examId}/loading?attemptId=${attemptId}`);
          }, 2000);
          setSubmitting(false);
          return;
        } else {
          throw new Error('Submission failed');
        }
      }
      // Clear localStorage for this exam
      localStorage.removeItem(LS_KEY(examId));
      let navAttemptId = attemptId;
      try {
        const data = await res.json();
        if (data && data.attempt_id) navAttemptId = data.attempt_id;
      } catch (e) {}
      navigate(`/student/exam/${examId}/loading?attemptId=${navAttemptId}`);
    } catch (e) {
      setError('Could not submit exam.');
    }
    setSubmitting(false);
  };

  const handleResume = () => {
    if (resumeData) {
      setAttemptId(resumeData.attemptId);
      setStartTime(resumeData.startTime);
      setExam(resumeData.exam);
      setDuration(resumeData.duration);
      setAnswers(resumeData.answers || {});
      setShowResumeModal(false);
      setLoading(false);
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem(LS_KEY(examId));
    setShowResumeModal(false);
    setLoading(true);
    window.location.reload();
  };

  const handleSaveProgress = () => {
    if (attemptId && exam) {
      localStorage.setItem(LS_KEY(examId), JSON.stringify({
        attemptId,
        startTime,
        exam,
        duration,
        answers,
        submitted: false
      }));
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    }
  };

  const toggleFlag = (idx) => {
    setFlagged(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredQuestions = showOnlyFlagged ? questions.filter((_, idx) => flagged[idx]) : questions;
  const filteredIndexes = showOnlyFlagged ? questions.map((_, idx) => idx).filter(idx => flagged[idx]) : questions.map((_, idx) => idx);
  const displayQ = filteredIndexes[currentQ] ?? 0;

  const handleStartExam = () => {
    setShowInstructions(false);
    setExamStarted(true);
  };

  if (!examStarted && exam && typeof exam.instructions === 'string' && exam.instructions.trim()) {
    return (
      <Modal show={showInstructions} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title style={{ color: '#222' }}>Exam Instructions</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#222' }}>
          <div style={{ whiteSpace: 'pre-line' }}>{exam.instructions}</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleStartExam}>Start Exam</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Container className="p-4" style={{ marginTop: '110px' }}>
      <Card style={{ backgroundColor: 'black', color: 'white', border: 'solid #1e90ff' }}>
        <Card.Body>
          <Row>
            <Col md={3} className="mb-3">
              <h5>Questions</h5>
              <Button
                variant={showOnlyFlagged ? 'warning' : 'outline-warning'}
                size="sm"
                className="mb-2"
                onClick={() => setShowOnlyFlagged(f => !f)}
                style={{ width: '100%' }}
              >
                {showOnlyFlagged ? 'Show All Questions' : 'Show Only Flagged'}
              </Button>
              <Nav variant="pills" className="flex-column">
                {questions.map((q, idx) => (
                  <Nav.Item key={idx}>
                    <Nav.Link
                      active={displayQ === idx}
                      onClick={() => setCurrentQ(filteredIndexes.indexOf(idx))}
                      style={{ color: displayQ === idx ? '#1e90ff' : 'white', background: displayQ === idx ? 'white' : 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>Q{idx + 1}</span>
                      <span style={{ marginLeft: 8 }}>
                        {flagged[idx] ? <FaFlag color="gold" title="Flagged" /> : <FaRegFlag color="#888" title="Not flagged" />}
                      </span>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
              <div className="mt-4">
                <b>Time Left:</b> <span style={{
                  color: timerWarning === 2 ? 'red' : timerWarning === 1 ? 'orange' : 'white',
                  fontWeight: timerWarning ? 'bold' : 'normal',
                  fontSize: timerWarning === 2 ? '1.5em' : '1.1em',
                  transition: 'color 0.3s, font-size 0.3s'
                }}>{mins}:{secs.toString().padStart(2, '0')}</span>
                {timerWarning === 2 && <div style={{color:'red',fontWeight:'bold'}}>⚠️ Less than 1 minute left!</div>}
                {timerWarning === 1 && <div style={{color:'orange',fontWeight:'bold'}}>⚠️ 5 minutes remaining</div>}
                <audio ref={beepRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />
              </div>
            </Col>
            <Col md={9}>
              <h4>Question {displayQ + 1}</h4>
              <div style={{ marginBottom: '1rem' }}>
                <b>Marks:</b> {questions[displayQ].marks}<br />
                <b>Question:</b> {questions[displayQ].text}
                <Button
                  variant={flagged[displayQ] ? 'warning' : 'outline-warning'}
                  size="sm"
                  className="ms-3"
                  onClick={() => toggleFlag(displayQ)}
                  style={{ verticalAlign: 'middle' }}
                >
                  {flagged[displayQ] ? <><FaFlag style={{marginBottom:2}}/> Unflag</> : <><FaRegFlag style={{marginBottom:2}}/> Flag</>}
                </Button>
              </div>
              <Form.Group controlId={`answer${displayQ}`}>
                <Form.Label>Your Answer</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  style={{ minHeight: 120, maxHeight: 200, overflowY: 'auto', resize: 'vertical' }}
                  value={answers[displayQ] || ''}
                  onChange={e => handleAnswerChange(displayQ, e.target.value)}
                  disabled={submitting}
                />
              </Form.Group>
              <div className="mt-3">
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => setCurrentQ((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                  disabled={currentQ === filteredQuestions.length - 1}
                >
                  Next
                </Button>
                <Button
                  variant="secondary"
                  className="ms-2"
                  onClick={handleSaveProgress}
                  disabled={submitting}
                >
                  Save Progress
                </Button>
                <Button
                  variant="success"
                  className="ms-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  Submit Exam
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Toast show={showSaveToast} onClose={() => setShowSaveToast(false)} delay={2000} autohide style={{ position: 'fixed', top: 80, right: 30, zIndex: 9999 }} bg="success">
        <Toast.Body style={{ color: 'white' }}>Progress saved!</Toast.Body>
      </Toast>
      <Modal show={showResumeModal} onHide={() => setShowResumeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: '#222' }}>Resume Attempt?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ color: '#222' }}>
            You have an unfinished attempt for this exam. Would you like to resume where you left off or start a new attempt?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleStartFresh}>Start Fresh</Button>
          <Button variant="primary" onClick={handleResume}>Resume</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentExamWindow; 