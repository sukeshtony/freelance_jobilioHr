import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import {
  Container, Card, Button, Row, Col,
  ListGroup, Badge, Modal
} from 'react-bootstrap';
import {
  ClockFill, PlayFill,
  StarFill, Clock, PeopleFill
} from 'react-bootstrap-icons';
import API from '../../../api';
import { API_BASE_URL } from '../../../api';
import { requireLogin } from '../../../utils/requireLogin';
import { requirePremium } from '../../../utils/requirePremium';

const MyCourses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const openCourseIdFromState = location.state && location.state.openCourseId;
  const origin = location.state && location.state.origin; // e.g., 'career-certificate'
  const originField = location.state && location.state.field; // IT | Non-IT
  const openCourseIdFromQuery = new URLSearchParams(location.search).get('courseId');
  const openCourseId = openCourseIdFromState || openCourseIdFromQuery;
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [instructors, setInstructors] = useState({});
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [activeLessonTitle, setActiveLessonTitle] = useState('');

  const studentId = localStorage.getItem('userId');

  const fetchInstructors = async (instructorIds) => {
    console.log('Fetching instructors for IDs:', instructorIds);
    try {
      setLoadingInstructors(true);
      const response = await API.post('/api/admin/instructors/batch', { ids: instructorIds });

      const instructorMap = {};
      response.data.forEach(instructor => {
        instructorMap[instructor._id] = instructor;
      });

      console.log('New instructors:', instructorMap);
      setInstructors(prev => ({ ...prev, ...instructorMap }));

    } catch (err) {
      console.error('Failed to fetch instructors', err);
    } finally {
      setLoadingInstructors(false);
    }
  };

  const fetchEnrolled = async () => {
    try {
      const res = await API.get(`/api/enrollments/student/${studentId}`);
      const courseList = res.data;

      const instructorIds = [...new Set(courseList.map(c => c.instructor))];
      await fetchInstructors(instructorIds);

      setCourses(courseList);
    } catch (err) {
      console.error('Failed to fetch enrollments', err);
    }
  };

  // Auth guard - check login first, then premium access
  // Only premium users can access enrolled courses
  useEffect(() => {
    (async () => {
      const isAuthenticated = await requireLogin(navigate);
      if (!isAuthenticated) return;
      
      const user = await requirePremium(navigate);
      if (!user) return;
      
      setIsAuthChecking(false);
    })();
  }, [navigate]);

  useEffect(() => {
    if (studentId) {
      fetchEnrolled();
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId && openCourseId) {
      selectCourse(openCourseId);
    }
  }, [studentId, openCourseId]);

  const selectCourse = async (courseId) => {
    try {
      const [courseRes, enrollmentRes] = await Promise.all([
        API.get(`/api/courses/${courseId}`),
        API.get(`/api/enrollments/student/${studentId}/course/${courseId}`)
      ]);

      const course = courseRes.data;
      const enrollment = enrollmentRes.data;

      if (course.instructor && !instructors[course.instructor]) {
        await fetchInstructors([course.instructor]);
      }

      setSelectedCourse({
        ...course,
        enrollmentStartDate: enrollment.enrolledAt || null,
      });

      setLessons(course.lessons.map(lesson => ({
        ...lesson,
        videoUrl: lesson.videoUrl
      })));
    } catch (err) {
      console.error('Failed to fetch course or enrollment', err);
    }
  };

  const handlePlayLesson = (lesson) => {
    setActiveLessonTitle(lesson.title);
    setActiveVideoUrl(lesson.videoUrl);
    setShowVideoModal(true);
  };

  const totalLessons = lessons.length;
  const currentInstructor = selectedCourse && selectedCourse.instructor
    ? instructors[selectedCourse.instructor._id]
    : null;

  if (isAuthChecking) {
    return <div className="text-center py-5">Checking access...</div>;
  }

  if (!selectedCourse) {
    return (
      <>
        <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
          <div className="container d-flex justify-content-between align-items-center">
            <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px' }} />
            <Button
              variant="primary"
              className="rounded-pill px-3 px-md-4 d-flex align-items-center ms-auto"
              onClick={() => navigate('/career-dashboard')}
              size="sm"
            >
              <FaHome className="me-1" />
              <span className="d-none d-sm-inline">Dashboard</span>
              <span className="d-inline d-sm-none">Home</span>
            </Button>
          </div>
        </nav>

        <Container className="py-5">
          <h3 className="mb-4">Your Enrolled Courses</h3>
          <Row>
            {courses.length === 0 ? (
              <Col><p>No courses enrolled yet.</p></Col>
            ) : (
              courses.map((c) => {
                const totalLessons = c.lessons?.length || 0;
                const instructor = instructors[c.instructor];

                return (
                  <Col key={c._id} md={6} lg={4} className="mb-4">
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Img
                        variant="top"
                        src={`${API_BASE_URL}${c.image}`}
                        style={{ height: '180px', objectFit: 'cover' }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <h5 className="fw-bold mb-2">{c.title}</h5>

                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">
                            <ClockFill size={12} className="me-1" />
                            {totalLessons} {totalLessons === 1 ? 'Lesson' : 'Lessons'}
                          </span>
                          <span className="text-warning">
                            <StarFill size={12} className="me-1" />
                            {c.rating || '4.5'}
                          </span>
                        </div>

                        <div className="d-flex align-items-center mb-3">
                          {instructor?.image ? (
                            <img
                              src={instructor.image}
                              alt={instructor.name}
                              className="rounded-circle me-2"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                              style={{ width: '40px', height: '40px', fontWeight: 'bold', fontSize: '16px' }}
                            >
                              {instructor?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <div className="fw-medium">{instructor?.name || 'Unknown Instructor'}</div>
                            <small className="text-muted">{instructor?.title || 'Teacher'}</small>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          onClick={() => selectCourse(c._id)}
                          className="mt-auto"
                        >
                          View Course
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        </Container>
      </>
    );
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
        <div className="container d-flex justify-content-between align-items-center">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px' }} />
          <Button
            variant="primary"
            className="rounded-pill px-3 px-md-4 d-flex align-items-center ms-auto"
            onClick={() => {
              if (origin === 'career-certificate') {
                navigate('/career-certificate', { state: { openField: originField || selectedCourse?.field } });
              } else {
                setSelectedCourse(null);
              }
            }}
            size="sm"
          >
            <FaHome className="me-1" />
            <span className="d-none d-sm-inline">Back</span>
            <span className="d-inline d-sm-none">Back</span>
          </Button>
        </div>
      </nav>

      <Container className="flex-grow-1 py-5 px-4">
        <div className="mb-5">
          <Badge bg="primary" pill className="px-3 py-2 mb-3">{selectedCourse.category}</Badge>
          <h1 className="fw-bold display-5 mb-3">{selectedCourse.title}</h1>
          <div className="d-flex align-items-center mb-4">
            {currentInstructor?.image ? (
              <img src={currentInstructor?.image} alt={currentInstructor?.name} className="rounded-circle me-2" width="40" height="40" />
            ) : (
              <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: '40px', height: '40px', fontWeight: 'bold' }}>
                {currentInstructor?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <span className="me-3 fw-medium">{currentInstructor?.name || 'Instructor'}</span>
            <div className="d-flex align-items-center text-warning me-3">
              <StarFill className="me-1" /> {selectedCourse.rating}
            </div>
            <div className="d-flex align-items-center text-muted">
              <Clock className="me-1" /> {selectedCourse.duration}
            </div>
          </div>
        </div>

        <Row>
          <Col lg={8}>
            <Card className="mb-4 border-0 rounded-4 shadow-sm">
              <Card.Img variant="top" src={`${API_BASE_URL}${selectedCourse.image}`} style={{ height: '350px', objectFit: 'cover' }} />
            </Card>

            <Card className="mb-4 border-0 rounded-4 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="fw-bold mb-4">About This Course</h3>
                <p style={{ lineHeight: '1.7' }}>{selectedCourse.description}</p>
              </Card.Body>
            </Card>

            <Card className="border-0 rounded-4 shadow-sm">
              <Card.Body className="p-4">
                <h3 className="fw-bold mb-4">Course Content</h3>
                <ListGroup variant="flush">
                  {lessons.map((lesson, idx) => (
                    <ListGroup.Item key={lesson._id || lesson.id} className="border-0 py-3 px-0 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="me-3" style={{ width: '32px' }}>
                            <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                              {idx + 1}
                            </div>
                          </div>
                          <div>
                            <h6>{lesson.title}</h6>
                            <small className="text-muted d-flex align-items-center">
                              <ClockFill className="me-1" size={12} /> {lesson.duration}
                            </small>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => handlePlayLesson(lesson)}
                        >
                          <PlayFill className="me-1" /> Watch
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <div className="sticky-top" style={{ top: '20px' }}>
              {/* Colorful Course Stats Card */}
              <Card className="mb-4 border-0 rounded-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <Card.Body className="p-4 text-center">
                  <h4 className="fw-bold mb-4">Course Stats</h4>
                  <Row className="g-3">
                    <Col xs={6}>
                      <div className="p-3 bg-white rounded-3 shadow-sm">
                        <div className="text-primary mb-2">
                          <ClockFill size={24} />
                        </div>
                        <h5 className="fw-bold mb-0">{totalLessons}</h5>
                        <small className="text-muted">Lessons</small>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-3 bg-white rounded-3 shadow-sm">
                        <div className="text-info mb-2">
                          <PeopleFill size={24} />
                        </div>
                        <h5 className="fw-bold mb-0">{selectedCourse.enrolledStudents || '100+'}</h5>
                        <small className="text-muted">Students</small>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-3 bg-white rounded-3 shadow-sm">
                        <div className="text-warning mb-2">
                          <StarFill size={24} />
                        </div>
                        <h5 className="fw-bold mb-0">{selectedCourse.rating}</h5>
                        <small className="text-muted">Rating</small>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-3 bg-white rounded-3 shadow-sm">
                        <div className="text-secondary mb-2">
                          <Clock size={24} />
                        </div>
                        <h5 className="fw-bold mb-0">{selectedCourse.duration}</h5>
                        <small className="text-muted">Duration</small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Instructor Info */}
              {currentInstructor ? (
                <Card className="border-0 rounded-4 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4">About Instructor</h5>
                    <div className="d-flex align-items-center mb-3">
                      {currentInstructor.image ? (
                        <img src={currentInstructor.image} alt={currentInstructor.name} className="rounded-circle me-3" width="64" height="64" />
                      ) : (
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '64px', height: '64px', fontWeight: 'bold', fontSize: '24px' }}>
                          {currentInstructor.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <h6>{currentInstructor.name || 'Instructor'}</h6>
                        <small className="text-muted">{currentInstructor.title || 'Teacher'}</small>
                      </div>
                    </div>
                    <p className="text-muted" style={{ lineHeight: '1.7' }}>
                      {currentInstructor.about || 'No information available about this instructor.'}
                    </p>
                  </Card.Body>
                </Card>
              ) : (
                <p>Loading instructor...</p>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showVideoModal} onHide={() => setShowVideoModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{activeLessonTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeVideoUrl ? (
            <video
              width="100%"
              height="auto"
              controls
              autoPlay
            >
              <source src={`${API_BASE_URL}${activeVideoUrl}`} type="video/mp4" />

              Your browser does not support the video tag.
            </video>
          ) : (
            <p>No video available for this lesson.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MyCourses;