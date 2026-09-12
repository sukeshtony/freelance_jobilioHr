import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api';
import {
  Container, Card, Button, Form, Row, Col, Spinner, Alert
} from 'react-bootstrap';

function CourseTest() {
  const { id } = useParams(); // course ID
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [editing, setEditing] = useState(false);
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/admin/tests/${id}`);
      setTest(res.data);
      setQuestions(res.data.questions);
      setError(null);
    } catch (err) {
      setTest(null); // No test exists
      setError('No Test for this Course. Lets create a new one.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);
  };

  const handleDeleteQuestion = (index) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this question?');
    if (!confirmDelete) return;
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    try {
      if (questions.length === 0) {
        setError('At least one question is required.');
        return;
      }
      
      if (questions.some(q => !q.questionText || q.options.some(o => !o))) {
        setError('Please fill in all questions and options.');
        return;
      }

      setLoading(true);
      
      if (test) {
        await API.put(`/api/admin/tests/${id}`, { questions });
        setSuccess('Test updated successfully.');
      } else {
        await API.post('/api/admin/tests', { courseId: id, questions });
        setSuccess('Test created successfully.');
      }

      setError(null);
      setEditing(false);
      fetchTest();
    } catch (err) {
      setError('Failed to save test. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  useEffect(() => {
    fetchTest();
  }, [id]);

  return (
    <Container className="py-4">
      {/* Back button with improved styling */}
      <Button 
        variant="light" 
        onClick={() => navigate(-1)} 
        className="mb-4 d-flex align-items-center"
        style={{ border: '1px solid #dee2e6' }}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back
      </Button>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0 py-3">
          <h4 className="mb-0 fw-bold">MCQ Test for This Course</h4>
        </Card.Header>
        
        <Card.Body className="p-4">
          {loading && !editing ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading test...</p>
            </div>
          ) : (
            <>
              {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
              {success && <Alert variant="success" className="mb-4">{success}</Alert>}

              {test && !editing ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Existing Test Questions</h5>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setEditing(true)}
                      className="px-4"
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit Test
                    </Button>
                  </div>

                  <div className="test-questions">
                    {test.questions.map((q, index) => (
                      <div key={index} className="mb-4 p-3 bg-light rounded">
                        <div className="d-flex">
                          <span className="badge bg-primary me-2 align-self-start">{index + 1}</span>
                          <h6 className="mb-3 flex-grow-1">{q.questionText}</h6>
                        </div>
                        
                        <div className="options-container ps-4">
                          {q.options.map((opt, i) => (
                            <div 
                              key={i} 
                              className={`option py-2 px-3 mb-2 rounded ${q.correctAnswer === i ? 'bg-success bg-opacity-10 border border-success' : 'bg-white'}`}
                            >
                              <span className={`me-2 fw-bold ${q.correctAnswer === i ? 'text-success' : 'text-muted'}`}>
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                              {q.correctAnswer === i && (
                                <span className="ms-2 text-success">
                                  <i className="bi bi-check-circle-fill"></i> Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">{test ? 'Edit Test Questions' : 'Create New Test'}</h5>
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        onClick={handleAddQuestion}
                        className="me-2"
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Question
                      </Button>
                    </div>
                  </div>

                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="mb-4 border rounded p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 text-primary">Question {qIndex + 1}</h6>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDeleteQuestion(qIndex)}
                        >
                          <i className="bi bi-trash"></i> Remove
                        </Button>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Enter question text"
                          value={q.questionText}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].questionText = e.target.value;
                            setQuestions(updated);
                          }}
                          className="border-0 shadow-sm"
                        />
                      </Form.Group>

                      <Row className="g-3 mb-3">
                        {q.options.map((opt, optIdx) => (
                          <Col key={optIdx} md={6}>
                            <div className="d-flex align-items-center">
                              <span className="badge bg-secondary me-2">{String.fromCharCode(65 + optIdx)}</span>
                              <Form.Control
                                type="text"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[qIndex].options[optIdx] = e.target.value;
                                  setQuestions(updated);
                                }}
                                className="flex-grow-1 shadow-sm"
                              />
                            </div>
                          </Col>
                        ))}
                      </Row>

                      <Form.Select
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].correctAnswer = parseInt(e.target.value);
                          setQuestions(updated);
                        }}
                        className="shadow-sm"
                      >
                        <option value={0}>Option A is correct</option>
                        <option value={1}>Option B is correct</option>
                        <option value={2}>Option C is correct</option>
                        <option value={3}>Option D is correct</option>
                      </Form.Select>
                    </div>
                  ))}

                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <Button 
                      variant="primary" 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4"
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          {test ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          {test ? 'Update Test' : 'Save Test'}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CourseTest;