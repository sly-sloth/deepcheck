import React, { useState, useEffect, useRef } from 'react';
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

  const [editIndex, setEditIndex] = useState(null); // Track which question is being edited
  const [editQuestionDraft, setEditQuestionDraft] = useState(null); // Store draft for editing
  const [editMarkingScheme, setEditMarkingScheme] = useState([{ criteria: '', score: '' }]);

  const editTextRef = useRef(null); // Ref for focusing edit textarea

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (mode === 'edit' && examId) {
      // Fetch exam data and pre-fill form
      const fetchExam = async () => {
        try {
          const res = await fetch(`http://localhost:5001/exams/${examId}`);
          if (!res.ok) throw new Error('Failed to fetch exam');
          const data = await res.json();
          setExam({
            title: data.title || '',
            description: data.description || '',
            duration: data.duration || '',
            questions: data.questions || [],
            instructions: data.instructions || '',
          });
        } catch (e) {
          // Optionally handle error
        }
      };
      fetchExam();
    }
  }, [mode, examId]);

  // Focus on edit text area when entering edit mode
  useEffect(() => {
    if (editIndex !== null && editTextRef.current) {
      editTextRef.current.focus();
    }
  }, [editIndex]);

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

  // Add or update question to exam
  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;
    const marking_scheme = markingScheme
      .filter(ms => ms.criteria.trim() && ms.score !== '')
      .map(ms => [ms.criteria, Number(ms.score)]);
    if (editIndex !== null) {
      // Update existing question
      setExam((prevExam) => {
        const updatedQuestions = prevExam.questions.map((q, i) =>
          i === editIndex ? { ...newQuestion, marking_scheme } : q
        );
        return { ...prevExam, questions: updatedQuestions };
      });
      setEditIndex(null);
    } else {
      // Add new question
      setExam((prevExam) => ({
        ...prevExam,
        questions: [
          ...prevExam.questions,
          { ...newQuestion, marking_scheme },
        ],
      }));
    }
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

  // Edit question (start editing)
  const editQuestion = (index) => {
    const q = exam.questions[index];
    setEditQuestionDraft({
      type: q.type || 'Subjective',
      text: q.text || '',
      options: q.options || [],
      related_theory: q.related_theory || '',
      marks: q.marks || '',
      marking_scheme: q.marking_scheme || [],
    });
    setEditMarkingScheme(
      (q.marking_scheme && q.marking_scheme.length > 0)
        ? q.marking_scheme.map(ms => ({ criteria: ms[0], score: ms[1] }))
        : [{ criteria: '', score: '' }]
    );
    setEditIndex(index);
  };

  // Save edited question
  const saveEditQuestion = () => {
    const marking_scheme = editMarkingScheme
      .filter(ms => ms.criteria.trim() && ms.score !== '')
      .map(ms => [ms.criteria, Number(ms.score)]);
    setExam((prevExam) => {
      const updatedQuestions = prevExam.questions.map((q, i) =>
        i === editIndex ? { ...editQuestionDraft, marking_scheme } : q
      );
      return { ...prevExam, questions: updatedQuestions };
    });
    setEditIndex(null);
    setEditQuestionDraft(null);
    setEditMarkingScheme([{ criteria: '', score: '' }]);
  };

  // Cancel editing
  const cancelEditQuestion = () => {
    setEditIndex(null);
    setEditQuestionDraft(null);
    setEditMarkingScheme([{ criteria: '', score: '' }]);
  };

  // Handlers for editing fields
  const handleEditQuestionChange = (e) => {
    const { name, value } = e.target;
    setEditQuestionDraft((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditMarkingSchemeChange = (idx, field, value) => {
    const updated = editMarkingScheme.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setEditMarkingScheme(updated);
  };
  const addEditMarkingSchemeRow = () => {
    setEditMarkingScheme([...editMarkingScheme, { criteria: '', score: '' }]);
  };
  const removeEditMarkingSchemeRow = (idx) => {
    setEditMarkingScheme(editMarkingScheme.filter((_, i) => i !== idx));
  };

  // Submit exam
  const handleSubmit = async () => {
    try {
      let response;
      if (mode === 'edit' && examId) {
        response = await fetch(`http://localhost:5001/exams/${examId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exam),
          credentials: 'include',
        });
      } else {
        response = await fetch('http://localhost:5001/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exam),
          credentials: 'include',
        });
      }
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
                      rows={2}
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
                      rows={3}
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
                    {editIndex !== null ? 'Update Question' : 'Add Question'}
                  </Button>
                  <Button
                    variant="success"
                    className="mt-3 ms-3"
                    onClick={handleSubmit}
                    disabled={exam.questions.length === 0}
                  >
                    {mode === 'edit' ? 'Update Exam' : 'Create Exam'}
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
                    <Card key={idx} className="mb-2" style={editIndex === idx ? { background: '#181824', color: '#fff', border: '2px solid #1e90ff' } : {}}>
                      <Card.Body>
                        {editIndex === idx ? (
                          <>
                            <b>Editing Q{idx + 1}:</b>
                            <Form className="mt-2">
                              <Row className="mb-3">
                                <Col>
                                  <Form.Group controlId={`editType${idx}`}>
                                    <Form.Label className="exam-label">Question Type</Form.Label>
                                    <Form.Select
                                      value={editQuestionDraft.type}
                                      onChange={e => setEditQuestionDraft(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                      <option value="Subjective">Subjective</option>
                                      <option value="MCQ">MCQ</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col>
                                  <Form.Group controlId={`editMarks${idx}`}>
                                    <Form.Label className="exam-label">Marks</Form.Label>
                                    <Form.Control
                                      type="number"
                                      name="marks"
                                      value={editQuestionDraft.marks}
                                      onChange={handleEditQuestionChange}
                                      style={{ background: '#232336', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Form.Group className="mb-3" controlId={`editText${idx}`}>
                                <Form.Label className="exam-label">Question Text</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  name="text"
                                  placeholder="Question Text"
                                  rows={2}
                                  style={{ minHeight: 38, maxHeight: 120, overflowY: 'auto', background: '#232336', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                                  value={editQuestionDraft.text}
                                  onChange={handleEditQuestionChange}
                                  ref={editTextRef}
                                />
                              </Form.Group>
                              <Form.Group className="mb-3" controlId={`editTheory${idx}`}>
                                <Form.Label className="exam-label">Relevant Theory</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  name="related_theory"
                                  placeholder="Relevant Theory"
                                  rows={3}
                                  style={{ minHeight: 38, maxHeight: 120, overflowY: 'auto', background: '#232336', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                                  value={editQuestionDraft.related_theory}
                                  onChange={handleEditQuestionChange}
                                />
                              </Form.Group>
                              <Form.Label className="exam-label">Marking Scheme</Form.Label>
                              {editMarkingScheme.map((ms, i) => (
                                <Row key={i} className="mb-2 align-items-center">
                                  <Col md={7}>
                                    <Form.Control
                                      type="text"
                                      placeholder="Criteria"
                                      value={ms.criteria}
                                      onChange={e => handleEditMarkingSchemeChange(i, 'criteria', e.target.value)}
                                      style={{ background: '#232336', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col md={3}>
                                    <Form.Control
                                      type="number"
                                      placeholder="Score"
                                      value={ms.score}
                                      onChange={e => handleEditMarkingSchemeChange(i, 'score', e.target.value)}
                                      style={{ background: '#232336', color: '#fff', border: '1.5px solid #1e90ff', borderRadius: 8, fontSize: 16 }}
                                    />
                                  </Col>
                                  <Col md={2}>
                                    <Button variant="danger" onClick={() => removeEditMarkingSchemeRow(i)} disabled={editMarkingScheme.length === 1}>-</Button>
                                    <Button variant="success" onClick={addEditMarkingSchemeRow} className="ms-2">+</Button>
                                  </Col>
                                </Row>
                              ))}
                              <div className="mt-3">
                                <Button variant="success" className="me-2" onClick={saveEditQuestion}>Save</Button>
                                <Button variant="secondary" onClick={cancelEditQuestion}>Cancel</Button>
                              </div>
                            </Form>
                          </>
                        ) : (
                          <>
                            <b>Q{idx + 1}:</b> {q.text} <br />
                            <b>Marks:</b> {q.marks} <br />
                            <div style={{ margin: '12px 0' }}>
                              <b>Theory:</b>
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
                            <Button variant="danger" size="sm" onClick={() => deleteQuestion(idx)}>Delete</Button>
                            <Button variant="primary" size="sm" className="ms-2" onClick={() => editQuestion(idx)} disabled={editIndex !== null}>Edit</Button>
                          </>
                        )}
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