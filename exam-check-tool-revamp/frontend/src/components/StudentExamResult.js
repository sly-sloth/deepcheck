import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, Container, Spinner, Button, Alert } from 'react-bootstrap';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Donut chart SVG component
function DonutChart({ score, total }) {
  const radius = 24;
  const stroke = 7;
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
        fontSize="1em"
        fill="#fff"
        fontWeight="bold"
      >
        {total > 0 ? `${score}/${total}` : 'N/A'}
      </text>
    </svg>
  );
}

const StudentExamResult = () => {
  const { examId } = useParams();
  const query = useQuery();
  const attemptId = query.get('attemptId');
  const fromHistory = query.get('fromHistory') === 'true';
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://127.0.0.1:5001/student/attempts/${attemptId}/result`);
        if (!res.ok) throw new Error('Result not found');
        const data = await res.json();
        setResult(data);
      } catch (e) {
        setError('Could not fetch result.');
      }
      setLoading(false);
    };
    if (attemptId) fetchResult();
  }, [attemptId]);

  if (loading) return <div style={{ color: 'white', marginTop: '100px' }}><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger" style={{ marginTop: '100px' }}>{error}</Alert>;
  if (!result) return <div style={{ color: 'white', marginTop: '100px' }}>No result found.</div>;

  // Calculate maximum marks from all questions
  const maxMarks = result.results && result.results.length > 0
    ? result.results.reduce((sum, q) => sum + (parseFloat(q.total_score_question) || 0), 0)
    : 0;

  return (
    <Container className="p-4" style={{ marginTop: '100px', maxWidth: 900 }}>
      <Card style={{ backgroundColor: 'black', color: 'white', border: 'solid #1e90ff' }}>
        <Card.Body>
          <h2 style={{ color: '#1e90ff' }}>Exam Result</h2>
          <div className="mb-3">
            <h4>Total Score: <span style={{ color: '#00e676' }}>{result.total_score}</span></h4>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              Maximum Marks: <span style={{ color: '#1e90ff', fontWeight: 700 }}>{maxMarks}</span>
            </div>
          </div>
          <div className="mb-4" style={{ borderBottom: '1px solid #333' }}></div>
          <div className="mt-4">
            <h5 style={{ color: '#1e90ff' }}>Per Question Feedback</h5>
            {result.results && result.results.map((q, idx) => (
              <Card key={idx} className="mb-3" style={{ backgroundColor: '#181824', color: 'white', borderLeft: '4px solid #1e90ff' }}>
                <Card.Body>
                  <div className="d-flex flex-row align-items-center justify-content-between flex-wrap mb-2">
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 600, color: '#1e90ff', fontSize: 18 }}>Q{idx + 1}</div>
                      <div style={{ color: '#bbb', fontSize: 14, marginBottom: 4 }}>
                        Score: <span style={{ color: '#00e676', fontWeight: 600 }}>{q.total_score_gained}</span> / <span style={{ color: '#ffd54f', fontWeight: 600 }}>{q.total_score_question}</span>
                      </div>
                    </div>
                    <div style={{ minWidth: 60, marginLeft: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DonutChart score={Number(q.total_score_gained)} total={Number(q.total_score_question)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}><b>Question:</b> {q.question}</div>
                  <div style={{
                    marginBottom: 16,
                    background: '#232336',
                    color: '#ffd54f',
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontSize: 16,
                    fontWeight: 500,
                    boxShadow: '0 2px 8px #1e90ff22',
                    borderLeft: '4px solid #ffd54f',
                    marginTop: 8
                  }}>
                    <div style={{ color: '#bbb', fontWeight: 600, marginBottom: 4 }}>Your Answer:</div>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: 'none', border: 'none', margin: 0, padding: 0 }}>{q.student_answer}</pre>
                  </div>
                  <div style={{ marginBottom: 8 }}><b>Feedback:</b>
                    <ul style={{ marginBottom: 0 }}>
                      {q.teacher_reasoning && q.teacher_reasoning.map((fb, i) => {
                        let displayText = fb;
                        if (typeof fb === 'string' && fb.includes('</think>')) {
                          displayText = fb.split('</think>').pop().trim();
                        }
                        // Parse for **bold** pairs and add <br/> after each pair, and before each (except the first), but only one newline between consecutive bolds
                        const parts = [];
                        let lastIndex = 0;
                        const regex = /\*\*(.+?)\*\*/g;
                        let match;
                        let key = 0;
                        let boldCount = 0;
                        while ((match = regex.exec(displayText)) !== null) {
                          // Text before bold
                          if (match.index > lastIndex) {
                            parts.push(displayText.slice(lastIndex, match.index));
                          }
                          // Add newline before bold (except first bold), but only if previous part is not already a <br/>
                          if (boldCount > 0) {
                            const prev = parts[parts.length - 1];
                            if (!(prev && prev.type === 'br')) {
                              parts.push(<br key={key++}/>);
                            }
                          }
                          // Bold text
                          parts.push(<b key={key++}>{match[1]}</b>);
                          // Add newline after bold
                          parts.push(<br key={key++}/>);
                          lastIndex = match.index + match[0].length;
                          boldCount++;
                        }
                        // Remaining text
                        if (lastIndex < displayText.length) {
                          parts.push(displayText.slice(lastIndex));
                        }
                        // Add two <br/> after each feedback chunk except the last
                        return <React.Fragment key={i}>
                          <li>{parts}</li>
                          {i < q.teacher_reasoning.length - 1 && <><br/><br/></>}
                        </React.Fragment>;
                      })}
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
          <Button variant="primary" className="mt-3" onClick={() => fromHistory ? navigate('/student/history') : navigate('/student/exams')}>
            {fromHistory ? 'Back to History' : 'Back to Exams'}
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StudentExamResult; 