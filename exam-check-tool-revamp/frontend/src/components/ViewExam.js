import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Spinner, Button } from 'react-bootstrap';

const ViewExam = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:5001/exams/${examId}`);
        const data = await res.json();
        setExam(data);
      } catch {
        setExam(null);
      }
      setLoading(false);
    };
    fetchExam();
  }, [examId]);

  if (loading) return <div style={{ color: 'white', marginTop: '100px' }}><Spinner animation="border" variant="primary" /></div>;
  if (!exam) return <div style={{ color: 'white', marginTop: '100px' }}>Exam not found.</div>;

  // Calculate total maximum marks
  const maxMarks = exam.questions && exam.questions.length > 0
    ? exam.questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0)
    : 0;

  return (
    <Container className="p-4" style={{ marginTop: '100px', maxWidth: 900 }}>
      <Card style={{ background: 'black', color: 'white', border: 'solid #1e90ff' }}>
        <Card.Body>
          <h2 style={{ color: '#1e90ff' }}>{exam.title}</h2>
          <div className="mb-3">
            <b>Duration:</b> {exam.duration} mins<br />
            <b>Description:</b> {exam.description}<br />
            <b>Maximum Marks:</b> <span style={{ color: '#1e90ff', fontWeight: 600 }}>{maxMarks}</span>
            {exam.instructions && (
              <div style={{ background: '#232336', color: '#fff', borderRadius: 8, padding: '0.75rem 1rem', marginTop: 12, borderLeft: '4px solid #1e90ff' }}>
                <b>Instructions:</b>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: 'none', border: 'none', margin: 0, padding: 0 }}>{exam.instructions}</pre>
              </div>
            )}
          </div>
          <h4 className="mt-4">Questions</h4>
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((q, idx) => (
              <Card key={idx} className="mb-3" style={{ background: '#181824', color: 'white' }}>
                <Card.Body>
                  <b>Q{idx + 1}:</b> {q.text}<br />
                  <b>Type:</b> {q.type}<br />
                  <b>Marks:</b> {q.marks}<br />
                  <div style={{ margin: '12px 0' }}>
                    <b>Relevant Theory:</b>
                    <Card style={{ background: '#f8f9fa', color: '#222', border: '1px solid #e0e0e0', marginTop: 6, marginBottom: 6 }}>
                      <Card.Body style={{ padding: '10px 14px' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: 'none', border: 'none', margin: 0, padding: 0 }}>{q.related_theory}</pre>
                      </Card.Body>
                    </Card>
                  </div>
                  <b>Marking Scheme:</b>
                  <ul>
                    {q.marking_scheme && q.marking_scheme.map((ms, i) => (
                      <li key={i}>{ms[0]} ({ms[1]} marks)</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            ))
          ) : (
            <div>No questions found.</div>
          )}
          <Button variant="secondary" className="mt-3" onClick={() => navigate(-1)}>Back</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ViewExam; 