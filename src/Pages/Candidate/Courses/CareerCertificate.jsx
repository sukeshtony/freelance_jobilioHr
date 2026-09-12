import React, { useState, useEffect } from 'react';
import { requireLogin } from '../../../utils/requireLogin';
import { useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import {
  Card, Button, Container, Row, Col, Form, Badge, Alert, Modal, Image, ListGroup, Accordion
} from 'react-bootstrap';
import {
  CodeSlash, Briefcase, Search, XCircle,
  StarFill, ClockFill, PeopleFill
} from 'react-bootstrap-icons';
import { FaRupeeSign } from 'react-icons/fa';
import API from '../../../api';
import { API_BASE_URL } from '../../../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useLocation } from 'react-router-dom';

const CareerCertificate = () => {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);
  const [showModal, setShowModal] = useState(false);
  const [modalCourse, setModalCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [enrollmentStatus, setEnrollmentStatus] = useState({}); // Track enrollment status per course
  const [statusFilter, setStatusFilter] = useState('All'); // All | Enrolled | Enroll Now
  const [selectedEnrolledCourse, setSelectedEnrolledCourse] = useState(null); // Track specific enrolled course
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null); // You'll need to get this from auth/user context

  const location = useLocation();

  useEffect(() => {
    // Preselect track if provided via navigation state
    const fld = location.state && location.state.openField;
    if (fld) {
      setSelectedField(fld);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student ID (replace with your actual auth logic)
        const userRes = await API.get('/api/auth/me');
        const me = userRes.data && (userRes.data.user || userRes.data);
        const id = me?.id || me?._id;
        setStudentId(id || localStorage.getItem('userId'));

        // Fetch courses
        const coursesRes = await API.get('/api/courses');
        setCourses(coursesRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check enrollment status for each course
  useEffect(() => {
    if (!studentId || courses.length === 0) return;

    const checkEnrollments = async () => {
      try {
        const status = {};
        await Promise.all(
          courses.map(async (course) => {
            const res = await API.get(`/api/enrollments/check/${studentId}/${course._id}`);
            status[course._id] = res.data.enrolled;
          })
        );
        setEnrollmentStatus(status);
      } catch (error) {
        console.error('Failed to check enrollments:', error);
      }
    };

    checkEnrollments();
  }, [studentId, courses]);

  // Listen for enrollment completion to update button state without reload
  useEffect(() => {
    const onCourseEnrolled = (e) => {
      const newlyEnrolledCourseId = e.detail?.courseId;
      if (!newlyEnrolledCourseId) return;
      setEnrollmentStatus(prev => ({ ...prev, [newlyEnrolledCourseId]: true }));
    };
    window.addEventListener('course-enrolled', onCourseEnrolled);
    return () => window.removeEventListener('course-enrolled', onCourseEnrolled);
  }, []);

  const currentCourses = selectedField
    ? courses.filter(c => c.field === selectedField)
    : [];

  const categories = ['All', ...new Set(currentCourses.map(course => course.category))].map(cat => 
    cat === 'All' ? 'All' : cat.toLowerCase()
  );

  const filteredCourses = currentCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || course.category.toLowerCase() === selectedCategory.toLowerCase();
    const isEnrolled = enrollmentStatus[course._id] || false;
    
    // If a specific enrolled course is selected, show only that course
    if (selectedEnrolledCourse) {
      return course._id === selectedEnrolledCourse;
    }
    
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Enrolled' && isEnrolled) ||
      (statusFilter === 'Enroll Now' && !isEnrolled);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEnroll = (courseTitle) => {
    navigate(`/enroll/${encodeURIComponent(courseTitle)}`);
  };

  const resetSelection = () => {
    setSelectedField(null);
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedEnrolledCourse(null);
  };

  const openModal = (course) => {
    setModalCourse(course);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setModalCourse(null);
  };

  // Render long free-form description into structured JSX (modules, lists, paragraphs)
  const renderDescription = (text) => {
    if (!text) return null;
    // normalize bullets / newlines
    const normalized = text.replace(/\r\n/g, '\n').replace(/\u2022/g, '\n•').replace(/·/g, '\n•');

    // split by Module headings (keep the heading token)
    const parts = normalized.split(/(Module\s*\d+[:\)\-]*)/i).map(p => p.trim()).filter(Boolean);

    const result = [];
    let skipNext = false;

    parts.forEach((part, idx) => {
      if (skipNext) {
        skipNext = false;
        return;
      }

      // Module heading followed by content
      if (/^Module\s*\d+/i.test(part)) {
        const title = part;
        const content = parts[idx + 1] || '';
        skipNext = true; // Skip the next iteration as we're processing it here
        
        // split module content into bullets by newline or bullet character or semicolon
        const bullets = content.split(/\n+|•|;/).map(s => s.trim()).filter(Boolean);
        result.push(
          <div key={idx} className="mb-2">
            <div className="fw-semibold small mb-1">{title}</div>
            <ul className="small mb-2">
              {bullets.map((b, bi) => <li key={bi}>{b}</li>)}
            </ul>
          </div>
        );
      }
      // If contains explicit bullets, render as list
      else if (part.includes('•') || /\n/.test(part) && part.split(/\n/).length > 1) {
        const bullets = part.split(/\n+|•/).map(s => s.trim()).filter(Boolean);
        result.push(
          <ul className="small mb-2" key={idx}>
            {bullets.map((b, bi) => <li key={bi}>{b}</li>)}
          </ul>
        );
      }
      // fallback: render as paragraph
      else {
        result.push(<p className="text-muted small mb-2" key={idx}>{part}</p>);
      }
    });

    return result;
  };


  if (!selectedField) {
    return (
      <div>
        <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
          <div className="container d-flex justify-content-between align-items-center">
            <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
            <div className="ms-auto">
              <Button
                variant="primary"
                className="rounded-pill px-3 px-md-4 d-flex align-items-center"
                onClick={() => navigate('/career-dashboard')}
                size="sm"
              >
                <FaHome className="me-1" />
                <span className="d-none d-sm-inline">Dashboard</span>
                <span className="d-inline d-sm-none">Home</span>
              </Button>
            </div>
          </div>
        </nav>

        <Container className="py-5 my-5">
          <div className="text-center mb-5">
            <h1 className="fw-bold mb-4">Choose Your Career Path</h1>
            <p className="text-muted fs-5">Select your field to explore relevant certification programs</p>
          </div>

          <Row className="g-4 justify-content-center">
            <Col md={6} lg={5}>
              <Card className="h-100 border-0 shadow-sm p-4 text-center">
                <div className="bg-primary bg-opacity-10 p-4 rounded-circle d-flex align-items-center justify-content-center mb-4 mx-auto" style={{ width: '100px', height: '100px' }}>
                  <CodeSlash size={48} className="text-primary" />
                </div>
                <Card.Body>
                  <Card.Title className="fw-bold fs-3 mb-3">Information Technology</Card.Title>
                  <Card.Text className="text-muted mb-4 fs-5">
                    Explore courses in software development, data science, cloud computing, and more.
                  </Card.Text>
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-4 py-2 rounded-pill"
                    onClick={() => setSelectedField('IT')}
                  >
                    View IT Courses
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={5}>
              <Card className="h-100 border-0 shadow-sm p-4 text-center">
                <div className="bg-success bg-opacity-10 p-4 rounded-circle d-flex align-items-center justify-content-center mb-4 mx-auto" style={{ width: '100px', height: '100px' }}>
                  <Briefcase size={48} className="text-success" />
                </div>
                <Card.Body>
                  <Card.Title className="fw-bold fs-3 mb-3">Non-Technical Fields</Card.Title>
                  <Card.Text className="text-muted mb-4 fs-5">
                    Discover programs in business, marketing, healthcare, finance, and more.
                  </Card.Text>
                  <Button
                    variant="success"
                    size="lg"
                    className="px-4 py-2 rounded-pill"
                    onClick={() => setSelectedField('Non-IT')}
                  >
                    View Non-IT Courses
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }


  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading courses...</p>
      </Container>
    );
  }


  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
        <div className="container d-flex justify-content-between align-items-center">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
          <div className="ms-auto d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={resetSelection}
              className="rounded-pill px-3"
              size="sm"
            >
              Switch Track
            </Button>
            <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
              <FaHome className="me-1" />
              <span className="d-none d-sm-inline">Dashboard</span>
              <span className="d-inline d-sm-none">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      <Container className="py-4">
        {/* Search */}
        <div className="mb-4">
          <Form>
            <div className="position-relative">
              <Form.Control
                type="search"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5 border-2 shadow-none"
                style={{ height: '45px', borderRadius: '22px', paddingLeft: '2.5rem' }}
              />
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              {searchTerm && (
                <XCircle
                  className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
          </Form>
        </div>

        {/* Categories and Enrollment Status Filter */}
        <div className="mb-4">
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div className="d-flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-pill px-3 py-2"
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="d-flex flex-wrap gap-2">
              {['All', 'Enrolled', 'Enroll Now'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="rounded-pill px-3 py-2"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0 fw-semibold">
            {selectedEnrolledCourse ? 'Selected Enrolled Course' : `${filteredCourses.length} ${filteredCourses.length === 1 ? 'Course' : 'Courses'} Found`}
          </h5>
          <div className="d-flex align-items-center gap-2">
            {selectedEnrolledCourse && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setSelectedEnrolledCourse(null)}
                className="rounded-pill"
              >
                ← Back to All Courses
              </Button>
            )}
            <small className="text-muted">
              {selectedField === 'IT' ? 'Information Technology' : 'Non-Technical'} Track
            </small>
          </div>
        </div>

        {/* Courses */}
       {filteredCourses.length > 0 ? (
      <Row className="g-4">
        {filteredCourses.map((course) => {
          const isEnrolled = enrollmentStatus[course._id] || false;
          
          return (
            <Col key={course._id} xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm overflow-hidden">
                {/* Course image and popular badge */}
                <div className="position-relative">
                  <div
                    className="bg-secondary"
                    style={{
                      height: '180px',
                      backgroundImage: `url(${API_BASE_URL}${course.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  {course.popular && (
                    <Badge bg="warning" className="position-absolute top-2 end-2 shadow-sm d-flex align-items-center">
                      <StarFill className="me-1" size={12} /> Popular
                    </Badge>
                  )}
                </div>

                <Card.Body className="p-4">
                  <Badge bg="light" text="dark" className="mb-3 fw-normal">
                    {course.category}
                  </Badge>
                  <Card.Title className="fs-5 fw-bold mb-3">{course.title}</Card.Title>
                  <Card.Text className="text-muted small mb-4"></Card.Text>

                  <div className="d-flex justify-content-between text-muted small mb-4">
                    <span className="d-flex align-items-center">
                      <ClockFill className="me-1" size={12} /> {course.duration}
                    </span>
                    {/* <span className="d-flex align-items-center">
                      <PeopleFill className="me-1" size={12} /> {course.students}
                    </span> */}
                    <span className="d-flex align-items-center">
                      <StarFill className="text-warning me-1" size={12} /> {course.rating}
                    </span>
                  </div>

                  {/* Price - always show to keep consistent height */}
                  {(course.price || course.price === 0) && (
                    <div className="d-flex align-items-center mb-3">
                      <span className="fw-bold me-2">Price:</span>
                      <span className="text-success fw-bold">
                        {course.price === 0 ? (
                          'Free'
                        ) : (
                          <>
                            <FaRupeeSign className="me-1" size={14} />
                            {course.price.toLocaleString('en-IN')}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Enroll button - do not disable when enrolled */}
                  <div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="w-100 mb-2 d-flex align-items-center justify-content-center"
                      onClick={() => openModal(course)}
                      style={{ padding: '8px 16px' }}
                    >
                      View Details
                    </Button>
                  </div>
                   {isEnrolled ? (
                     <Button
                       variant="success"
                       size="sm"
                       className="w-100 d-flex align-items-center justify-content-center"
                       onClick={() => navigate('/my-courses', { state: { openCourseId: course._id, origin: 'career-certificate', field: selectedField } })}
                       style={{ padding: '8px 16px' }}
                     >
                       <i className="bi bi-check-circle me-2"></i>
                       Enrolled
                     </Button>
                   ) : (
                     <Link 
                       to={`/enroll/${course._id}`} 
                       className="btn btn-primary w-100 btn-sm d-flex align-items-center justify-content-center"
                       style={{ padding: '8px 16px' }}
                     >
                       Enroll Now
                     </Link>
                   )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    ) : (
          <Alert variant="light" className="text-center py-5 my-4 border rounded-3">
            <div className="mb-4">
              <XCircle size={48} className="text-muted" />
            </div>
            <h5 className="text-muted mb-3">No matching courses found</h5>
            <p className="text-muted mb-4">Try adjusting your search or filter criteria</p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="rounded-pill px-4 py-2"
            >
              Clear all filters
            </Button>
          </Alert>
        )}
      </Container>

      {/* Course Details Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalCourse?.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {modalCourse && (
            <>
              <Row>
                <Col md={5}>
                  <Image src={`${API_BASE_URL}${modalCourse.image}`} alt={modalCourse.title} fluid rounded />
                  <ListGroup variant="flush" className="mt-3">
                    <ListGroup.Item><strong>Duration:</strong> {modalCourse.duration || '—'}</ListGroup.Item>
                    <ListGroup.Item><strong>Rating:</strong> {modalCourse.rating ?? '—'}</ListGroup.Item>
                    {modalCourse.price !== undefined && (
                      <ListGroup.Item>
                        <strong>Price:</strong>{' '}
                        {modalCourse.price === 0 ? 'Free' : (<><FaRupeeSign className="me-1" size={12} />{modalCourse.price.toLocaleString('en-IN')}</>)}
                      </ListGroup.Item>
                    )}
                    {modalCourse.mode && <ListGroup.Item><strong>Mode:</strong> {modalCourse.mode}</ListGroup.Item>}
                    {modalCourse.eligibility && <ListGroup.Item><strong>Eligibility:</strong> {modalCourse.eligibility}</ListGroup.Item>}
                  </ListGroup>
                  <ListGroup variant="flush" className="mt-3">
                    {modalCourse && (enrollmentStatus[modalCourse._id] ? (
                      <Button variant="success" onClick={() => { closeModal(); navigate('/my-courses', { state: { openCourseId: modalCourse._id, origin: 'career-certificate', field: selectedField } }); }}>
                        Open Course
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={() => { closeModal(); navigate(`/enroll/${modalCourse._id}`); }}>
                        Enroll Now
                      </Button>
                    ))}
                  </ListGroup>
                </Col>

                <Col md={7}>
                  <h6>Overview</h6>
                  {renderDescription(modalCourse.description)}

                  {modalCourse.objectives && modalCourse.objectives.length > 0 && (
                    <>
                      <h6 className="mt-3">Learning outcomes</h6>
                      <ul className="small">
                        {modalCourse.objectives.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </>
                  )}
                </Col>
              </Row>

              {modalCourse.curriculum && modalCourse.curriculum.length > 0 && (
                <>
                  <h6 className="mt-3">Curriculum</h6>
                  <Accordion flush>
                    {modalCourse.curriculum.map((mod, idx) => (
                      <Accordion.Item eventKey={String(idx)} key={idx}>
                        <Accordion.Header>
                          <div className="d-flex justify-content-between w-100">
                            <span>{mod.title}</span>
                            <small className="text-muted">{mod.duration || ''}</small>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body>
                          {mod.description && <p className="small text-muted">{mod.description}</p>}
                          {mod.lessons && mod.lessons.length > 0 && (
                            <ul className="small">
                              {mod.lessons.map((lesson, li) => <li key={li}>{lesson}</li>)}
                            </ul>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </>
              )}

              {modalCourse.instructor && (
                <>
                  <h6 className="mt-3">Instructor</h6>
                  <div className="d-flex gap-3 align-items-center">
                    {modalCourse.instructor.avatar && (
                      <img src={`${API_BASE_URL}${modalCourse.instructor.avatar}`} alt="instr" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                    )}
                    <div>
                      <div className="fw-bold">{modalCourse.instructor.name}</div>
                      <div className="text-muted small">{modalCourse.instructor.bio}</div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
};

export default CareerCertificate;