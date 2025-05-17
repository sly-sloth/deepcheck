import React, { useEffect, useState } from 'react';
import { Container, Card, Spinner, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date: Latest First' },
  { value: 'date_asc', label: 'Date: Earliest First' },
  { value: 'score_desc', label: 'Score: High to Low' },
  { value: 'score_asc', label: 'Score: Low to High' },
];

const StudentExamHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examMap, setExamMap] = useState({});
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const username = user?.username;

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('Please log in to view your exam history.');
      return;
    }
    const fetchAttempts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:5001/student/attempts?username=${username}`);
        if (!res.ok) throw new Error('Failed to fetch attempts');
        let data = await res.json();
        // Default sort: date descending
        data = data.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
        setAttempts(data);
        // Fetch all exams to map exam_id to full exam object
        const resExams = await fetch('http://localhost:5001/student/exams');
        if (!resExams.ok) throw new Error('Failed to fetch exams');
        const exams = await resExams.json();
        const map = {};
        exams.forEach(e => { map[e.id] = e; });
        setExamMap(map);
      } catch (err) {
        setAttempts([]);
        setExamMap({});
        setError('Failed to load exam history.');
      }
      setLoading(false);
    };
    fetchAttempts();
    // Listen for history navigation to refresh
    window.addEventListener('popstate', fetchAttempts);
    return () => window.removeEventListener('popstate', fetchAttempts);
  }, [username]);

  // Sorting logic
  const getSortedAttempts = () => {
    let sorted = [...attempts];
    if (sortOption === 'date_desc') {
      sorted.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
    } else if (sortOption === 'date_asc') {
      sorted.sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
    } else if (sortOption === 'score_desc') {
      sorted.sort((a, b) => {
        const aScore = a.evaluation_result ? a.evaluation_result.total_score : 0;
        const bScore = b.evaluation_result ? b.evaluation_result.total_score : 0;
        return bScore - aScore;
      });
    } else if (sortOption === 'score_asc') {
      sorted.sort((a, b) => {
        const aScore = a.evaluation_result ? a.evaluation_result.total_score : 0;
        const bScore = b.evaluation_result ? b.evaluation_result.total_score : 0;
        return aScore - bScore;
      });
    }
    return sorted;
  };

  // Donut chart SVG component
  function DonutChart({ score, total }) {
    const radius = 32;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const percent = total > 0 ? Math.max(0, Math.min(1, score / total)) : 0;
    const strokeDashoffset = circumference * (1 - percent);
    return (
      <svg width={radius * 2} height={radius * 2}>
        <circle
          stroke="#333"
          fill="none"
          strokeWidth={stroke}
          cx={radius}
          cy={radius}
          r={normalizedRadius}
        />
        <circle
          stroke="#00e676"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s', transform: `rotate(-90deg)`, transformOrigin: '50% 50%' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          fontSize="1.1em"
          fill="#fff"
          fontWeight="bold"
        >
          {total > 0 ? `${score}/${total}` : 'N/A'}
        </text>
      </svg>
    );
  }

  return (
    <Container className="p-4" style={{ marginTop: '100px', maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-4" style={{ color: 'white' }}>Exam History</h2>
        <div className="d-flex align-items-center gap-3">
          <Form.Select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            style={{ width: 180, fontWeight: 500, fontSize: 15, background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8 }}
            className="me-2"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Form.Select>
          <Button variant="outline-info" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : error ? (
        <p style={{ color: 'orange' }}>{error}</p>
      ) : attempts.length === 0 ? (
        <p style={{ color: 'white' }}>No attempts found.</p>
      ) : (
        getSortedAttempts().map((a, idx) => {
          const exam = examMap[a.exam_id];
          const totalMarks = exam && Array.isArray(exam.questions)
            ? exam.questions.reduce((sum, q) => sum + Number(q.marks || 0), 0)
            : 0;
          const score = a.evaluation_result ? a.evaluation_result.total_score : 0;
          return (
            <Card key={a.attempt_id || idx} className="mb-3" style={{ background: '#181824', color: 'white', border: 'none', boxShadow: '0 2px 16px #1e90ff22', borderRadius: 18 }}>
              <Card.Body>
                <div className="d-flex flex-row align-items-center justify-content-between flex-wrap">
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#1e90ff', marginBottom: 4 }}>{exam ? exam.title : a.exam_id}</div>
                    <div style={{ color: '#bbb', fontSize: 14, marginBottom: 8 }}>{a.start_time ? new Date(a.start_time * 1000).toLocaleString() : 'N/A'}</div>
                    <div className="mb-2">
                      <span style={{ fontWeight: 500 }}>Score:</span> <span style={{ color: '#00e676', fontWeight: 600 }}>{score}</span> / <span style={{ color: '#ffd54f', fontWeight: 600 }}>{totalMarks}</span>
                    </div>
                    <div className="mb-2">
                      <span style={{ fontWeight: 500 }}>Status:</span> <span style={{ color: a.submitted ? '#00e676' : '#ffd54f', fontWeight: 600 }}>{a.submitted ? 'Submitted' : 'In Progress'}</span>
                    </div>
                    <Button
                      variant="info"
                      className="mt-2"
                      onClick={() => navigate(`/student/exam/${a.exam_id}/result?attemptId=${a.attempt_id}&fromHistory=true`)}
                      disabled={!a.submitted}
                    >
                      View Result
                    </Button>
                  </div>
                  <div style={{ minWidth: 90, marginLeft: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DonutChart score={score} total={totalMarks} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })
      )}
    </Container>
  );
};

export default StudentExamHistory; 