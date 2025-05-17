import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Container, Modal, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from 'react-router-dom';

const CreateExam = ({ mode = 'create', initialExam = null, examId = null }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Exam details, 2: Questions
  const [exam, setExam] = useState({
    title: '',
    description: '',
    duration: '',
    questions: [],
    instructions: '',
  });

  const [newQuestion, setNewQuestion] = useState({
    type: 'Subjective',
    text: '',
    options: [],
    related_theory: '',
    marks: '',
    marking_scheme: [], // Array of [criteria, score]
  });

  // Marking scheme state for current question
  const [markingScheme, setMarkingScheme] = useState([
    { criteria: '', score: '' }
  ]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
    // eslint-disable-next-line
  }, []);

  // Handlers for exam details
  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExam((prevExam) => ({
      ...prevExam,
      [name]: value,
    }));
  };

  // Handlers for question fields
  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion((prevQuestion) => ({
      ...prevQuestion,
      [name]: value,
    }));
  };

  // Marking scheme handlers
  const handleMarkingSchemeChange = (idx, field, value) => {
    const updated = markingScheme.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setMarkingScheme(updated);
  };

  const addMarkingSchemeRow = () => {
    setMarkingScheme([...markingScheme, { criteria: '', score: '' }]);
  };

  const removeMarkingSchemeRow = (idx) => {
    setMarkingScheme(markingScheme.filter((_, i) => i !== idx));
  };

  // Add question to exam
  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;
    const marking_scheme = markingScheme
      .filter(ms => ms.criteria.trim() && ms.score !== '')
      .map(ms => [ms.criteria, Number(ms.score)]);
    setExam((prevExam) => ({
      ...prevExam,
      questions: [
        ...prevExam.questions,
        { ...newQuestion, marking_scheme },
      ],
    }));
    setNewQuestion({
      type: 'Subjective',
      text: '',
      options: [],
      related_theory: '',
      marks: '',
      marking_scheme: [],
    });
    setMarkingScheme([{ criteria: '', score: '' }]);
  };

  // Remove question
  const deleteQuestion = (index) => {
    setExam((prevExam) => ({
      ...prevExam,
      questions: prevExam.questions.filter((_, i) => i !== index),
    }));
  };

  // Submit exam
  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5001/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
        credentials: 'include',
      });
      if (response.ok) {
        setExam({ title: '', duration: '', description: '', questions: [], instructions: '' });
        navigate('/teacher/exams');
      } else {
        alert('Failed to save exam');
      }
    } catch (error) {
      alert('Error: ' + error);
    }
  };

  return (
    <>
      <style>{`
        .exam-container input::placeholder, .exam-container textarea::placeholder {
          color: #888a8f !important;
          opacity: 1;
        }
      `}</style>
      <Container className="p-4 exam-container" style={{ marginTop: '100px' }}>
        <Card style={{ backgroundColor: 'black' }}>
          <Card.Body>
            {step === 1 && (
              <div style={{ maxWidth: 520, margin: '0 auto' }}>
                <div style={{ borderLeft: '6px solid #1e90ff', paddingLeft: 24, marginBottom: 32 }}>
                  <h2 style={{ color: '#1e90ff', fontWeight: 700, marginBottom: 6 }}>Create New Exam</h2>
                  <div style={{ color: '#bbb', fontSize: 17, marginBottom: 0 }}>
                    Enter the exam details below. You can add questions in the next step.
                  </div>
                </div>
                <Form>
                  <Form.Group className="exam-group mb-4" controlId="examTitle">
                    <Form.Label className='exam-label' style={{ fontWeight: 600, color: '#fff' }}>Exam Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      placeholder="Enter exam name"
                      value={exam.title}
                      onChange={handleExamChange}
                      style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 17 }}
                    />
                  </Form.Group>
                  <Form.Group className="exam-group mb-4" controlId="examDuration">
                    <Form.Label className='exam-label' style={{ fontWeight: 600, color: '#fff' }}>Duration (mins)</Form.Label>
                    <Form.Control
                      type="number"
                      name="duration"
                      placeholder="Enter duration in minutes"
                      value={exam.duration}
                      onChange={handleExamChange}
                      style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 17 }}
                    />
                  </Form.Group>
                  <Form.Group className="exam-group mb-4" controlId="examDescription">
                    <Form.Label className='exam-label' style={{ fontWeight: 600, color: '#fff' }}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={3}
                      placeholder="Enter exam description"
                      value={exam.description}
                      onChange={handleExamChange}
                      style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                    />
                  </Form.Group>
                  <Form.Group className="exam-group mb-4" controlId="examInstructions">
                    <Form.Label className='exam-label' style={{ fontWeight: 600, color: '#fff' }}>Instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="instructions"
                      rows={2}
                      placeholder="Enter exam instructions (optional)"
                      value={exam.instructions || ''}
                      onChange={handleExamChange}
                      style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    className='mt-2 w-100'
                    style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1 }}
                    onClick={() => setStep(2)}
                    disabled={!exam.title || !exam.duration}
                  >
                    Next
                  </Button>
                </Form>
              </div>
            )}

            {step === 2 && (
              <>
                <h3 className="mt-3 text-center" style={{ color: "white" }}>Add Questions</h3>
                <Form>
                  <Row className="mb-3">
                    <Col>
                      <Form.Group controlId="questionType">
                        <Form.Label className="exam-label">Question Type</Form.Label>
                        <Form.Select
                          value={newQuestion.type}
                          onChange={e => setNewQuestion(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="Subjective">Subjective</option>
                          <option value="MCQ">MCQ</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="marks">
                        <Form.Label className="exam-label">Marks</Form.Label>
                        <Form.Control
                          type="number"
                          name="marks"
                          value={newQuestion.marks}
                          onChange={handleQuestionChange}
                          style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3" controlId="questionText">
                    <Form.Label className="exam-label">Question Text</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="text"
                      placeholder="Question Text"
                      rows={2}
                      style={{ minHeight: 38, maxHeight: 120, overflowY: 'auto', background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                      value={newQuestion.text}
                      onChange={handleQuestionChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="relatedTheory">
                    <Form.Label className="exam-label">Relevant Theory</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="related_theory"
                      placeholder="Relevant Theory"
                      rows={3}
                      style={{ minHeight: 38, maxHeight: 120, overflowY: 'auto', background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                      value={newQuestion.related_theory}
                      onChange={handleQuestionChange}
                    />
                  </Form.Group>
                  {/* Marking Scheme UI */}
                  <Form.Label className="exam-label">Marking Scheme</Form.Label>
                  {markingScheme.map((ms, idx) => (
                    <Row key={idx} className="mb-2 align-items-center">
                      <Col md={7}>
                        <Form.Control
                          type="text"
                          placeholder="Criteria"
                          value={ms.criteria}
                          onChange={e => handleMarkingSchemeChange(idx, 'criteria', e.target.value)}
                          style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type="number"
                          placeholder="Score"
                          value={ms.score}
                          onChange={e => handleMarkingSchemeChange(idx, 'score', e.target.value)}
                          style={{ background: '#181824', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="danger" onClick={() => removeMarkingSchemeRow(idx)} disabled={markingScheme.length === 1}>-</Button>
                        <Button variant="success" onClick={addMarkingSchemeRow} className="ms-2">+</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button variant="secondary" className="mt-3" onClick={addQuestion}>
                    Add Question
                  </Button>
                  <Button
                    variant="success"
                    className="mt-3 ms-3"
                    onClick={handleSubmit}
                    disabled={exam.questions.length === 0}
                  >
                    Create Exam
                  </Button>
                  <Button
                    variant="outline-primary"
                    className="mt-3 ms-3"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                </Form>
                {/* List of added questions */}
                <div className="mt-4">
                  <h5 style={{ color: 'white' }}>Questions Added:</h5>
                  {exam.questions.map((q, idx) => (
                    <Card key={idx} className="mb-2">
                      <Card.Body>
                        <b>Q{idx + 1}:</b> {q.text} <br />
                        <b>Marks:</b> {q.marks} <br />
                        <b>Theory:</b> {q.related_theory} <br />
                        <b>Marking Scheme:</b>
                        <ul>
                          {q.marking_scheme && q.marking_scheme.map((ms, i) => (
                            <li key={i}>{ms[0]} ({ms[1]} marks)</li>
                          ))}
                        </ul>
                        <Button variant="danger" size="sm" onClick={() => deleteQuestion(idx)}>Delete</Button>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export const TeacherExamPage = () => <CreateExam mode="create" />;
export default CreateExam;