import React, { useEffect, useState } from 'react';
import {
  Card, Table, Spinner, Button, Container, Form, Row, Col, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { API_BASE_URL } from '../../api';
import { FiPlus, FiTrash2, FiEye, FiUsers, FiFileText } from 'react-icons/fi';
import { BsStarFill, BsFilter } from 'react-icons/bs'

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addCourseLoading, setAddCourseLoading] = useState(false);
  const [filters, setFilters] = useState({ title: '', category: '', instructor: '', field: '', status: '' });

  const [lessons, setLessons] = useState([{ title: '', duration: '', video: null }]);
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [showInstructorDropdown, setShowInstructorDropdown] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const [newCourse, setNewCourse] = useState({
    title: '',
    category: '',
    description: '',
    field: '',
    price: 0,
    image: null,
    duration: '',
    rating: 0,
    popular: false,
    isPaused: false,
    instructorId: '',
    instructorDetails: { name: '', email: '', title: '', about: '' }
  });

  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const res = await API.get('/api/courses');
      const safeCourses = res.data.map(course => ({
        ...course,
        instructor: course.instructorDetails || { name: 'N/A' }
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setCourses(safeCourses);
    setFilteredCourses(safeCourses);

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await API.get('/api/admin/instructors');
      setInstructors(res.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, []);

  useEffect(() => {
    const { title, category, instructor, field, status } = filters;
    const filtered = courses.filter(course => {
      const matchTitle = course.title?.toLowerCase().includes(title.toLowerCase());
      const matchCategory = course.category?.toLowerCase().includes(category.toLowerCase());
      const matchInstructor = (course.instructor?.name || '').toLowerCase().includes(instructor.toLowerCase());
      const matchField = field === '' || course.field === field;
      const matchStatus = status === '' ||
        (status === 'active' && !course.isPaused) ||
        (status === 'paused' && course.isPaused);

      return matchTitle && matchCategory && matchInstructor && matchField && matchStatus;
    });
    setFilteredCourses(filtered);
  }, [filters, courses]);

  useEffect(() => {
    if (newCourse.field) {
      const filtered = instructors.filter(instructor =>
        instructor.field === newCourse.field
      );
      setFilteredInstructors(filtered);
    } else {
      setFilteredInstructors([]);
    }
  }, [newCourse.field, instructors]);

  const handleFieldChange = (value) => {
    setNewCourse(prev => ({
      ...prev,
      field: value,
      instructorId: '',
      instructorDetails: { name: '', email: '', title: '', about: '' }
    }));
    setSelectedInstructor(null);
  };

  const handleInstructorSelect = (instructor) => {
    setSelectedInstructor(instructor);
    setNewCourse(prev => ({
      ...prev,
      instructorId: instructor._id,
      instructorDetails: {
        name: instructor.name,
        email: instructor.email,
        title: instructor.title,
        about: instructor.about
      }
    }));
    setShowInstructorDropdown(false);
  };

  const handleAddCourse = async () => {
    const {
      title, category, description, field, price,
      image, duration, rating, popular, isPaused,
      instructorId, instructorDetails
    } = newCourse;

    // Validation checks
    if (
      !title || !category || !description || !field || !image ||
      !duration || rating <= 0 || !instructorId || price < 0
    ) {
      return alert('All required fields must be filled and price must be non-negative');
    }

    // Lessons are optional now; no client-side blocking validation for lesson fields.
    // (You may add a warning/confirm if lessons.length === 0)
    
    try {
      setAddCourseLoading(true);
      const formData = new FormData();

      // Append course details
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('field', field);
      formData.append('price', price);
      formData.append('image', image);
      formData.append('duration', duration);
      formData.append('rating', rating);
      formData.append('popular', popular);
      formData.append('isPaused', isPaused);
      formData.append('instructorId', instructorId);

      // Append instructor details
      formData.append('instructor_name', instructorDetails.name);
      formData.append('instructor_email', instructorDetails.email);
      formData.append('instructor_title', instructorDetails.title);
      formData.append('instructor_about', instructorDetails.about);

      // Append lessons
      formData.append('lessons', JSON.stringify(lessons.map(l => ({
        title: l.title,
        duration: l.duration
      }))));

      // Append lesson videos
      lessons.forEach(lesson => {
        formData.append('videos', lesson.video);
      });

      // Send to backend
      await API.post('/api/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset form on success
      alert("Course added successfully!");
      resetForm();
      await fetchCourses(); // Refresh the course list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add course');
    } finally {
      setAddCourseLoading(false);
    }
  };

  const resetForm = () => {
    setNewCourse({
      title: '',
      category: '',
      description: '',
      field: '',
      price: 0,
      image: null,
      duration: '',
      rating: 0,
      popular: false,
      isPaused: false,
      instructorId: '',
      instructorDetails: { name: '', email: '', title: '', about: '' }
    });
    setLessons([{ title: '', duration: '', video: null }]);
    setSelectedInstructor(null);
  };

  const handleLessonChange = (index, field, value) => {
    const updated = [...lessons];
    updated[index][field] = value;
    setLessons(updated);
  };

  const addLesson = () => {
    setLessons([...lessons, { title: '', duration: '', video: null }]);
  };

  const removeLesson = (index) => {
    const updated = [...lessons];
    updated.splice(index, 1);
    setLessons(updated);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading Courses...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4 py-4">
      {/* Courses Table Section */}
      <Card className="border-0 shadow-lg mb-4">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">Course Management</h5>
            <div className="d-flex align-items-center">
              <BsFilter className="me-2 text-primary" size={20} />
              <span className="text-muted small">Showing {filteredCourses.length} courses</span>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="p-3 border-bottom">
            <Row className="g-2 mb-3">
              <Col md={3}>
                <Form.Control
                  placeholder="Course title"
                  value={filters.title}
                  onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  placeholder="Category"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  placeholder="Instructor"
                  value={filters.instructor}
                  onChange={(e) => setFilters(prev => ({ ...prev, instructor: e.target.value }))}
                  size="sm"
                />
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filters.field}
                  onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))}
                  size="sm"
                >
                  <option value="">All Fields</option>
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  size="sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </Form.Select>
              </Col>
              <Col md={1}>
                <Button
                  variant="outline-secondary"
                  onClick={() => setFilters({ title: '', category: '', instructor: '', field: '', status: '' })}
                  size="sm"
                  className="w-100"
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-5">
              <img src="/empty-state.svg" alt="No courses" style={{ width: '200px', opacity: 0.7 }} />
              <h5 className="mt-3 text-muted">No matching courses found</h5>
              <Button variant="outline-primary" size="sm" className="mt-2">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="text-nowrap ps-4">Course</th>
                    <th>Category</th>
                    <th>Field</th>
                    <th>Students</th>
                    <th>Rating</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(course => (
                    <tr key={course._id} className="align-middle">
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          {course.image && (
                            <img
                            src={`${API_BASE_URL}${course.image}`}
                            alt={course.title}
                              className="rounded me-3"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <h6 className="mb-0 fw-semibold">{course.title}</h6>
                            <small className="text-muted">{course.lessons?.length || 0} lessons</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="text-uppercase">
                          {course.category}
                        </Badge>
                      </td>
                      <td>{course.field}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiUsers className="me-1 text-primary" />
                          <span>{course.students || 0}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <BsStarFill className="me-1 text-warning" />
                          <span>{course.rating || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2">
                            <span className="text-primary fw-bold">
                              {course.instructor?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span>{course.instructor?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <Badge bg={course.isPaused ? "danger" : "success"} className="text-uppercase">
                          {course.isPaused ? 'Paused' : 'Active'}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <Button
                          variant="light"
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/admin/courses/${course._id}`)}
                        >
                          <FiEye className="me-1" /> View
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/admin/courses/${course._id}/test`)}
                        >
                          <FiFileText className="me-1" /> Test
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/admin/courses/${course._id}/students`, { state: { courseTitle: course.title } })}
                        >
                          <FiUsers className="me-1" /> Students
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add New Course Section */}
      <Card className="border-0 shadow-lg">
        <Card.Header className="bg-white border-0 py-3">
          <h5 className="mb-0 fw-bold text-dark">Create New Course</h5>
          <p className="small text-muted mb-0">Fill in all required fields to add a new course</p>
        </Card.Header>
        <Card.Body>
          <Form className="row g-3">
            {/* Course Information */}
            <Col md={12}>
              <h6 className="fw-bold text-primary mb-3 border-bottom pb-2">
                Course Details
              </h6>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Course Title*</Form.Label>
                <Form.Control
                  placeholder="e.g., Advanced React Development"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Category*</Form.Label>
                <Form.Control
                  placeholder="e.g., Web Development"
                  value={newCourse.category}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Field*</Form.Label>
                <Form.Select
                  value={newCourse.field}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  required
                >
                  <option value="">Select field</option>
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Description*</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Course description..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Duration*</Form.Label>
                <Form.Control
                  placeholder="e.g., 6 weeks"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, duration: e.target.value }))}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Price*</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1"
                    placeholder="999"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Rating*</Form.Label>
                <div className="d-flex align-items-center">
                  <BsStarFill className="me-2 text-warning" />
                  <Form.Control
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="4.5"
                    value={newCourse.rating}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Popular*</Form.Label>
                <Form.Select
                  value={newCourse.popular ? 'true' : 'false'}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, popular: e.target.value === 'true' }))}
                  required
                >
                  <option value="false">Regular Course</option>
                  <option value="true">Popular Course</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Course Image*</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setNewCourse(prev => ({ ...prev, image: e.target.files[0] }))}
                  required
                />
              </Form.Group>
            </Col>

            {/* Instructor Information */}
            <Col md={12} className="mt-4">
              <h6 className="fw-bold text-primary mb-3 border-bottom pb-2">
                Instructor Details
              </h6>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Instructor*</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    placeholder="Search instructors..."
                    value={selectedInstructor?.name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setSelectedInstructor(null);
                        setNewCourse(prev => ({
                          ...prev,
                          instructorId: '',
                          instructorDetails: { name: '', email: '', title: '', about: '' }
                        }));
                      }
                    }}
                    onFocus={() => newCourse.field && setShowInstructorDropdown(true)}
                    onBlur={() => setTimeout(() => setShowInstructorDropdown(false), 200)}
                  />
                  {showInstructorDropdown && newCourse.field && (
                    <div className="position-absolute top-100 start-0 end-0 bg-white shadow-lg mt-1 rounded z-3 border">
                      <div className="p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredInstructors.length > 0 ? (
                          filteredInstructors.map(instructor => (
                            <div
                              key={instructor._id}
                              className="p-2 hover-bg cursor-pointer"
                              onMouseDown={() => handleInstructorSelect(instructor)}
                            >
                              <div className="fw-semibold">{instructor.name}</div>
                              <small className="text-muted">{instructor.title}</small>
                              <small className="d-block text-muted">
                                {instructor.courses?.length || 0} courses assigned
                              </small>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-muted">
                            {newCourse.field ? 'No instructors found for this field' : 'Please select a field first'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Email*</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Instructor email"
                  value={newCourse.instructorDetails.email}
                  onChange={(e) => setNewCourse(prev => ({
                    ...prev,
                    instructorDetails: {
                      ...prev.instructorDetails,
                      email: e.target.value
                    }
                  }))}
                  required
                  disabled={!!selectedInstructor}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Title*</Form.Label>
                <Form.Control
                  placeholder="e.g., Senior Developer"
                  value={newCourse.instructorDetails.title}
                  onChange={(e) => setNewCourse(prev => ({
                    ...prev,
                    instructorDetails: {
                      ...prev.instructorDetails,
                      title: e.target.value
                    }
                  }))}
                  required
                  disabled={!!selectedInstructor}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold small">About*</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Brief bio..."
                  value={newCourse.instructorDetails.about}
                  onChange={(e) => setNewCourse(prev => ({
                    ...prev,
                    instructorDetails: {
                      ...prev.instructorDetails,
                      about: e.target.value
                    }
                  }))}
                  required
                  disabled={!!selectedInstructor}
                />
              </Form.Group>
            </Col>

            {/* Lessons Section */}
            <Col md={12} className="mt-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <h6 className="fw-bold text-primary mb-0">Course Lessons</h6>
                <Button variant="outline-primary" size="sm" onClick={addLesson}>
                  <FiPlus className="me-1" /> Add Lesson
                </Button>
              </div>

              {lessons.map((lesson, index) => (
                <div key={index} className="row g-3 mb-3 p-3 bg-light rounded">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Lesson Title</Form.Label>
                      <Form.Control
                        placeholder="e.g., Introduction to React"
                        value={lesson.title}
                        onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Duration</Form.Label>
                      <Form.Control
                        placeholder="e.g., 45 minutes"
                        value={lesson.duration}
                        onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Video File</Form.Label>
                      <Form.Control
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleLessonChange(index, 'video', e.target.files[0])}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={1} className="d-flex align-items-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeLesson(index)}
                      className="w-100"
                    >
                      <FiTrash2 />
                    </Button>
                  </Col>
                </div>
              ))}
            </Col>

            {/* Submit Button */}
            <Col md={12} className="mt-4">
              <div className="d-flex justify-content-end">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddCourse}
                  disabled={addCourseLoading}
                  className="px-4"
                >
                  {addCourseLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Creating Course...
                    </>
                  ) : (
                    'Create Course'
                  )}
                </Button>
              </div>
            </Col>
          </Form>
        </Card.Body>
      </Card>

      {/* Custom Styles */}
      <style>{`
        .table thead th {
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
          border-bottom-width: 1px;
        }
        
        .table tbody tr {
          transition: all 0.2s ease;
        }
        
        .table tbody tr:hover {
          background-color: rgba(13, 110, 253, 0.05) !important;
        }
        
        .avatar-sm {
          width: 32px;
          height: 32px;
        }
        
        .form-control, .form-select {
          border-radius: 0.375rem;
          border-color: #dee2e6;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
        }
        
        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        
        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
        
        .btn-outline-primary:hover {
          background-color: rgba(13, 110, 253, 0.1);
        }

        .hover-bg:hover {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .z-3 {
          z-index: 3;
        }
      `}</style>
    </Container>
  );
};

export default Courses;