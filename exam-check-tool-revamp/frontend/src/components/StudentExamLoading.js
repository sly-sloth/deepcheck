import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';

const POLL_INTERVAL = 1500;

const statusColor = status => {
  if (status === 'done') return '#00e676';
  if (status === 'in_progress') return '#ffd54f';
  if (status === 'error') return '#ff1744';
  return '#bbb';
};

const statusText = status => {
  if (status === 'done') return 'Done';
  if (status === 'in_progress') return 'Evaluating...';
  if (status === 'error') return 'Error';
  return 'Pending';
};

const formatOverallStatus = status => {
  if (status === 'in_progress') return 'In Progress';
  if (status === 'done') return 'Done';
  if (status === 'error') return 'Error';
  return status;
};

const StudentExamLoading = () => {
  const { examId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const attemptId = query.get('attemptId');
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [resultReady, setResultReady] = useState(false);

  // Poll for status
  useEffect(() => {
    if (!attemptId) return;
    let interval;
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:5001/student/attempts/${attemptId}/status`);
        if (!res.ok) throw new Error('Status not found');
        const data = await res.json();
        setStatus(data);
        if (data.overall === 'done') {
          setResultReady(true);
        }
        if (data.overall === 'error') {
          setError('Evaluation failed. Please try again.');
        }
      } catch (e) {
        setError('Could not fetch evaluation status.');
      }
    };
    poll();
    interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [attemptId]);

  // Redirect to result when done
  useEffect(() => {
    if (resultReady) {
      setTimeout(() => {
        navigate(`/student/exam/${examId}/result?attemptId=${attemptId}`);
      }, 1200);
    }
  }, [resultReady, navigate, examId, attemptId]);

  if (error) return <Alert variant="danger" style={{ marginTop: '100px' }}>{error}</Alert>;

  return (
    <div style={{ marginTop: 100, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', color: 'white' }}>
      <h3>Evaluating your answers...</h3>
      {!status ? (
        <div className="d-flex align-items-center mt-4">
          <Spinner animation="border" variant="primary" />
          <span className="ms-3">Starting evaluation...</span>
        </div>
      ) : (
        <div>
          <div className="mt-4 mb-2" style={{ fontWeight: 500 }}>
            Overall Status: <span style={{ color: statusColor(status.overall) }}>{formatOverallStatus(status.overall)}</span>
          </div>
          <div>
            {status.questions.map((q, idx) => (
              <div key={idx} className="d-flex align-items-center mb-2" style={{ background: '#222', borderRadius: 8, padding: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: statusColor(q.status), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', fontWeight: 700, marginRight: 16
                }}>
                  {q.status === 'done' ? '✓' : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>Question {idx + 1}</div>
                  <div style={{ fontSize: 14, color: '#bbb' }}>{statusText(q.status)} {q.step && <span>({q.step})</span>}</div>
                </div>
                {q.status === 'in_progress' && <Spinner animation="border" size="sm" variant="warning" />}
                {q.status === 'error' && <span style={{ color: '#ff1744', fontWeight: 600 }}>!</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamLoading; 