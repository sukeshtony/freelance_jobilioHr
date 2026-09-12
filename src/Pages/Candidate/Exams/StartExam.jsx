import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../../api";
import { Container, Card, Button, Form, Alert, Navbar, Nav, Modal, ProgressBar, Badge } from "react-bootstrap";
import { requireLogin } from '../../../utils/requireLogin';

function StartExam() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    (async () => {
      await requireLogin(navigate);
    })();
  }, [navigate]);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem(`examAnswers_${bookingId}`);
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(() => {
    const savedCount = localStorage.getItem(`tabSwitchCount_${bookingId}`);
    return savedCount !== null ? parseInt(savedCount) : 0;
  });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showRemainingModal, setShowRemainingModal] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState([]);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleSubmit = async (autoSubmit = false) => {
    if (submitted) return;

    const unansweredQuestions = questions.map((_, index) => index).filter(index => answers[index] === undefined);

    if (unansweredQuestions.length > 0 && !autoSubmit) {
      setRemainingQuestions(unansweredQuestions);
      setShowRemainingModal(true);
      return;
    }

    try {
      const response = await API.post(`/api/exams/submit/${bookingId}`, {
        answers: Object.values(answers),
        tabSwitchCount: tabSwitchCount,
        autoSubmitted: autoSubmit
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      // Clear saved answers and violation count on successful submission
      localStorage.removeItem(`examAnswers_${bookingId}`);
      localStorage.removeItem(`tabSwitchCount_${bookingId}`);

      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed", err);
      if (!autoSubmit) alert("Failed to submit exam.");
    }
  };

  const jumpToFirstUnanswered = () => {
    const firstUnanswered = remainingQuestions[0];
    if (firstUnanswered !== undefined) {
      setCurrentQuestionIndex(firstUnanswered);
      setShowRemainingModal(false);
    }
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const bookingRes = await API.get(`/api/exams/booking-details/${bookingId}`);
        const { date, time } = bookingRes.data;

        const [rawTime, modifier] = time.split(" ");
        let [hours, minutes] = rawTime.split(":").map(Number);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        const examStart = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
        const examEnd = new Date(examStart.getTime() + 45 * 60 * 1000);
        const now = new Date();

        const remainingSeconds = Math.floor((examEnd - now) / 1000);

        if (remainingSeconds <= 0) {
          await handleSubmit(true);
        } else {
          setTimeLeft(remainingSeconds);
        }

        const testRes = await API.get(`/api/exams/test-by-booking/${bookingId}`);
        setQuestions(testRes.data.questions);

        setLoading(false);
      } catch (err) {
        console.error("Failed to load exam:", err);
      }
    };

    fetchExam();
  }, [bookingId]);

  useEffect(() => {
    let cancelled = false;
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    };

    if (!submitted) {
      startCamera();

      const requestFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setFullscreenEnabled(true);
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
            setFullscreenEnabled(true);
          } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
            setFullscreenEnabled(true);
          }
        } catch (err) {
          console.log("Fullscreen request failed:", err);
        }
      };

      setTimeout(requestFullscreen, 1000);
    }

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [submitted]);

  useEffect(() => {
    if (submitted) return;

    const interval = setInterval(() => {
      setLastActiveTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Check if this is likely a refresh (time since last active is very short)
        const timeSinceLastActive = Date.now() - lastActiveTime;
        if (timeSinceLastActive < 100) { // Less than 100ms is probably a refresh
          return;
        }

        if (!isTabActive) return;

        setIsTabActive(false);
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        localStorage.setItem(`tabSwitchCount_${bookingId}`, newCount.toString());

        if (newCount === 1) {
          setWarningMessage("⚠️ WARNING: You have switched tabs/windows. This is your first warning. If you switch tabs again, your exam will be automatically submitted.");
          setShowWarningModal(true);
        } else if (newCount >= 2) {
          setWarningMessage("🚫 EXAM TERMINATED: You have switched tabs/windows multiple times. Your exam is being automatically submitted.");
          setShowWarningModal(true);
          setTimeout(() => {
            setShowWarningModal(false);
            handleSubmit(true);
          }, 3000);
        }
      } else {
        setIsTabActive(true);
        setLastActiveTime(Date.now());
      }
    };


    const handleBlur = () => { };

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Tab' || e.key === 'w' || e.key === 'n' || e.key === 't') {
          e.preventDefault();
          const newCount = tabSwitchCount + 1;
          setTabSwitchCount(newCount);
          localStorage.setItem(`tabSwitchCount_${bookingId}`, newCount.toString());

          if (newCount === 1) {
            setWarningMessage("⚠️ WARNING: Keyboard shortcut detected. This is your first warning. Next violation will terminate your exam.");
            setShowWarningModal(true);
          } else if (newCount >= 2) {
            setWarningMessage("🚫 EXAM TERMINATED: Multiple keyboard shortcuts detected. Your exam is being automatically submitted.");
            setShowWarningModal(true);
            setTimeout(() => {
              setShowWarningModal(false);
              handleSubmit(true);
            }, 3000);
          }
        }
      }

      if (e.key === 'F11') {
        e.preventDefault();
        setWarningMessage("⚠️ WARNING: Fullscreen toggle attempted. This is not allowed during exams.");
        setShowWarningModal(true);
      }
    };


    const handleContextMenu = (e) => {
      e.preventDefault();
      setWarningMessage("⚠️ WARNING: Right-click context menu is disabled during exams.");
      setShowWarningModal(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [submitted, tabSwitchCount, isTabActive]);

  useEffect(() => {
    if (submitted || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleOptionChange = (qIndex, optionIndex) => {
    const newAnswers = { ...answers, [qIndex]: optionIndex };
    setAnswers(newAnswers);
    localStorage.setItem(`examAnswers_${bookingId}`, JSON.stringify(newAnswers));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionJump = (index) => {
    setCurrentQuestionIndex(index);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgressPercentage = () => {
    return questions.length > 0 ? (getAnsweredCount() / questions.length) * 100 : 0;
  };

  return (
    <>
      {/* Warning Modal */}
      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header className="bg-warning text-dark">
          <Modal.Title>⚠️ Exam Violation Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">{warningMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="warning" onClick={() => setShowWarningModal(false)}>
            I Understand
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Remaining Questions Modal */}
      <Modal show={showRemainingModal} onHide={() => setShowRemainingModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header className="bg-danger text-white">
          <Modal.Title>⚠️ Incomplete Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <h5 className="text-danger">You cannot submit the exam yet!</h5>
            <p className="mb-3">You have <strong>{remainingQuestions.length}</strong> unanswered question(s).</p>

            <div className="mb-3">
              <h6>Unanswered Questions:</h6>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {remainingQuestions.map((qIndex) => (
                  <Badge
                    key={qIndex}
                    bg="danger"
                    className="fs-6 px-3 py-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCurrentQuestionIndex(qIndex);
                      setShowRemainingModal(false);
                    }}
                  >
                    Q{qIndex + 1}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-muted">Click on any question number above to jump to it, or use the button below to go to the first unanswered question.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowRemainingModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={jumpToFirstUnanswered}>
            Jump to First Unanswered
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Navbar */}
      <Navbar bg="light" expand="lg" className="px-3 px-md-4 shadow-sm">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img src="/logo.jpeg" alt="Logo" height="40" className="me-2" />
        </Navbar.Brand>

        {/* Always visible elements (mobile and desktop) */}
        <div className="d-flex align-items-center ms-auto">
          {/* Timer - always visible */}
          <div className="me-3 text-center">
            <div className="text-muted small">Time</div>
            <div className="fs-4 fw-bold text-danger">
              {timeLeft !== null && !submitted ? formatTime(timeLeft) : '--:--'}
            </div>
          </div>

          {/* Camera - always visible */}
          <div className="me-3">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              style={{
                width: 60,
                height: 45,
                borderRadius: 4,
                border: '2px solid #ddd',
                background: '#000'
              }}
            />
          </div>

          {/* Violation badge - always visible */}
          <Badge
            bg={tabSwitchCount === 0 ? "success" : tabSwitchCount === 1 ? "warning" : "danger"}
            className="fs-6"
          >
            {tabSwitchCount === 0 ? "Secure" : `Violations: ${tabSwitchCount}`}
          </Badge>
        </div>
      </Navbar>
      <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
        <div className="d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
          </svg>
          <div>
            <strong>Important:</strong> Do not switch tabs or windows or refresh the page during the exam.
            <span className="text-danger fw-bold"> Switching tabs more than once will automatically terminate your exam.</span>
          </div>
        </div>
        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>

      <Container className="py-4">
        {!submitted ? (
          <div className="row">
            {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
            <div className="col-md-3 mb-4 d-none d-md-block">
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Question Navigator</h5>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="d-flex flex-wrap gap-2">
                    {questions.map((_, index) => (
                      <Button
                        key={index}
                        variant={
                          currentQuestionIndex === index
                            ? "primary"
                            : answers[index] !== undefined
                              ? "success"
                              : "outline-secondary"
                        }
                        size="sm"
                        className="px-3 py-2"
                        onClick={() => handleQuestionJump(index)}
                        style={{
                          minWidth: '40px',
                          fontWeight: currentQuestionIndex === index ? 'bold' : 'normal'
                        }}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-3 small text-muted">
                    <div className="d-flex align-items-center mb-1">
                      <div className="bg-primary rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <span>Current Question</span>
                    </div>
                    <div className="d-flex align-items-center mb-1">
                      <div className="bg-success rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <span>Answered</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-outline-secondary rounded-circle me-2" style={{
                        width: '12px',
                        height: '12px',
                        border: '1px solid #6c757d'
                      }}></div>
                      <span>Unanswered</span>
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small">Progress:</span>
                    <span className="fw-bold">
                      {getAnsweredCount()}/{questions.length}
                    </span>
                  </div>
                  <ProgressBar
                    now={getProgressPercentage()}
                    variant={getProgressPercentage() === 100 ? "success" : "primary"}
                    className="mt-2"
                    style={{ height: '6px' }}
                  />
                </Card.Footer>
              </Card>
            </div>

            {/* Main Question Area */}
            <div className="col-12 col-md-9">
              {loading ? (
                <Card className="shadow-sm">
                  <Card.Body className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading exam questions...</p>
                  </Card.Body>
                </Card>
              ) : (
                <>
                  {/* Mobile Question Navigator - Hidden on desktop */}
                  <div className="d-md-none mb-3">
                    <Card className="shadow-sm">
                      <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">Question Navigation</h5>
                      </Card.Header>
                      <Card.Body className="p-2">
                        <div className="d-flex flex-wrap gap-1">
                          {questions.map((_, index) => (
                            <Button
                              key={index}
                              variant={
                                currentQuestionIndex === index
                                  ? "primary"
                                  : answers[index] !== undefined
                                    ? "success"
                                    : "outline-secondary"
                              }
                              size="sm"
                              className="px-2 py-1"
                              onClick={() => handleQuestionJump(index)}
                              style={{
                                minWidth: '30px',
                                fontWeight: currentQuestionIndex === index ? 'bold' : 'normal'
                              }}
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-light p-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small">Progress: {getAnsweredCount()}/{questions.length}</span>
                          <ProgressBar
                            now={getProgressPercentage()}
                            variant={getProgressPercentage() === 100 ? "success" : "primary"}
                            style={{ width: '60%', height: '6px' }}
                          />
                        </div>
                      </Card.Footer>
                    </Card>
                  </div>

                  <Card className="shadow-sm">
                    <Card.Header className="bg-light d-flex flex-column flex-md-row justify-content-between align-items-center">
                      <h5 className="mb-2 mb-md-0">
                        Question {currentQuestionIndex + 1} of {questions.length}
                        {answers[currentQuestionIndex] !== undefined && (
                          <Badge bg="success" className="ms-2">Answered</Badge>
                        )}
                      </h5>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={handlePrevQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          ← Previous
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={handleNextQuestion}
                          disabled={currentQuestionIndex === questions.length - 1}
                        >
                          Next →
                        </Button>
                      </div>
                    </Card.Header>

                    <Card.Body className="p-3 p-md-4">
                      <h5 className="mb-4 fw-bold">{questions[currentQuestionIndex]?.questionText}</h5>

                      <Form>
                        {questions[currentQuestionIndex]?.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`mb-2 mb-md-3 p-2 p-md-3 border rounded ${answers[currentQuestionIndex] === i ? 'bg-light-primary border-primary' : 'bg-light'}`}
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleOptionChange(currentQuestionIndex, i)}
                          >
                            <Form.Check
                              type="radio"
                              name={`q-${currentQuestionIndex}`}
                              label={opt}
                              checked={answers[currentQuestionIndex] === i}
                              onChange={() => handleOptionChange(currentQuestionIndex, i)}
                              className="m-0"
                            />
                          </div>
                        ))}
                      </Form>
                    </Card.Body>

                    <Card.Footer className="bg-light">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <div className="mb-2 mb-md-0">
                          {currentQuestionIndex < questions.length - 1 ? (
                            <Button variant="outline-primary" onClick={handleNextQuestion}>
                              Save & Next Question
                            </Button>
                          ) : (
                            <Button variant="success" onClick={() => handleSubmit(false)}>
                              Review & Submit Exam
                            </Button>
                          )}
                        </div>
                        <div className="text-center text-md-end">
                          <Button
                            variant={getAnsweredCount() === questions.length ? "success" : "secondary"}
                            onClick={() => handleSubmit(false)}
                            disabled={getAnsweredCount() !== questions.length}
                          >
                            Final Submit
                          </Button>
                          {getAnsweredCount() !== questions.length && (
                            <div className="small text-muted mt-1">
                              {questions.length - getAnsweredCount()} unanswered questions
                            </div>
                          )}
                        </div>
                      </div>
                    </Card.Footer>
                  </Card>
                </>
              )}
            </div>
          </div>
        ) : (
          <Card className="shadow-lg">
            <Card.Body className="text-center py-5">
              <div className="mb-4">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#28a745" stroke="#28a745" strokeWidth="2" />
                  <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="fw-bold text-success mb-3">Exam Submitted Successfully!</h3>
              <p className="fs-5 text-muted mb-4">
                Your answers have been recorded. You answered {getAnsweredCount()} out of {questions.length} questions.
              </p>
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Button variant="outline-primary" size="lg" onClick={() => navigate("/career-dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
}

export default StartExam;