import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Card, Spinner, Button, Form, Row, Col, Image,
  Badge, ListGroup, Accordion, Modal, Alert
} from 'react-bootstrap';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiClock,
  FiUsers, FiStar, FiBook, FiUser, FiMail, FiAward, FiInfo,
  FiPlay, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import API from '../../api';
import { API_BASE_URL } from '../../api';

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');
  const [status, setStatus] = useState({ show: false, variant: 'success', message: '' });

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/courses/${id}`);
      setCourse(res.data);
      setLessons(res.data.lessons?.map(lesson => ({
        ...lesson,
        video: null
      })) || []);
      setStatus({ show: false, variant: '', message: '' });
    } catch (err) {
      setStatus({
        show: true,
        variant: 'danger',
        message: 'Failed to fetch course: ' + (err.response?.data?.error || err.message)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const handleLessonChange = (idx, field, value) => {
    const updated = [...lessons];
    updated[idx] = { ...updated[idx], [field]: value };
    setLessons(updated);
  };

  const addLesson = () => setLessons([...lessons, { title: '', duration: '', video: null, videoUrl: '' }]);
  const removeLesson = (idx) => setLessons(lessons.filter((_, i) => i !== idx));

  const handleVideoPreview = (videoUrl) => {
    setCurrentVideo(videoUrl);
    setShowVideoModal(true);
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const formData = new FormData();

      // Append all editable fields
      formData.append('title', course.title);
      formData.append('description', course.description);
      formData.append('duration', course.duration);
      formData.append('students', course.students);
      formData.append('rating', course.rating);
      formData.append('price', course.price);
      formData.append('category', course.category);
      formData.append('field', course.field);
      formData.append('popular', course.popular);
      formData.append('isPaused', course.isPaused);

      // Handle image
      if (selectedImage) {
        formData.append('image', selectedImage);
      } else {
        formData.append('imagePath', course.image);
      }

      // Append instructor data
      if (course.instructor?._id) {
        formData.append('instructor_id', course.instructor._id);
        formData.append('instructor_name', course.instructor.name);
        formData.append('instructor_email', course.instructor.email);
        formData.append('instructor_title', course.instructor.title);
        formData.append('instructor_about', course.instructor.about);
      }

      // Prepare lessons data
      const updatedLessons = lessons.map(lesson => {
        const hasNewVideo = lesson.video instanceof File;
        return {
          title: lesson.title,
          duration: lesson.duration,
          videoUrl: hasNewVideo ? '' : lesson.videoUrl || '',
          watched: lesson.watched || false
        };
      });
      formData.append('lessons', JSON.stringify(updatedLessons));

      // Append new video files in order
      lessons.forEach(lesson => {
        if (lesson.video instanceof File) {
          formData.append('videos', lesson.video);
        }
      });

      await API.put(`/api/courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setStatus({
        show: true,
        variant: 'success',
        message: 'Course updated successfully!'
      });
      setEditing(false);
      setSelectedImage(null);
      fetchCourse();
    } catch (err) {
      setStatus({
        show: true,
        variant: 'danger',
        message: 'Failed to update course: ' + (err.response?.data?.error || err.message)
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await API.delete(`/api/courses/${id}`);
      setStatus({
        show: true,
        variant: 'success',
        message: 'Course deleted successfully!'
      });
      setTimeout(() => navigate('/admin/courses'), 1500);
    } catch (err) {
      setStatus({
        show: true,
        variant: 'danger',
        message: 'Failed to delete course: ' + (err.response?.data?.error || err.message)
      });
    }
  };

  if (loading) return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Loading Course Details...</p>
      </div>
    </Container>
  );

  return (
    <Container className="py-4">
      {/* Status Alerts */}
      {status.show && (
        <Alert
          variant={status.variant}
          className="mb-4"
          dismissible
          onClose={() => setStatus({ ...status, show: false })}
        >
          <div className="d-flex align-items-center">
            {status.variant === 'success' ? (
              <FiCheckCircle className="me-2" size={20} />
            ) : (
              <FiAlertCircle className="me-2" size={20} />
            )}
            {status.message}
          </div>
        </Alert>
      )}

      {/* Video Preview Modal */}
      <Modal
        show={showVideoModal}
        onHide={() => setShowVideoModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Video Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="ratio ratio-16x9">
            <video controls autoPlay style={{ width: '100%' }}>
              <source src={`${API_BASE_URL}${currentVideo}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </Modal.Body>
      </Modal>

      {/* Header with Back Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          variant="outline-primary"
          onClick={() => navigate(-1)}
          className="d-flex align-items-center"
        >
          <FiArrowLeft className="me-2" /> Back to Courses
        </Button>
        {!editing && (
          <div className="d-flex">
            <Button
              variant="warning"
              onClick={() => setEditing(true)}
              className="me-2 d-flex align-items-center"
            >
              <FiEdit2 className="me-1" /> Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="d-flex align-items-center"
            >
              <FiTrash2 className="me-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Course Header */}
        <div className="bg-light p-4 border-bottom">
          <Row className="align-items-center">
            <Col md="auto">
              <Image
                src={
                  editing && selectedImage
                    ? URL.createObjectURL(selectedImage)
                    : `${API_BASE_URL}${course.image}`
                }
                rounded
                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
              />
            </Col>
            <Col>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {editing ? (
                  <>
                    <Form.Control
                      type="text"
                      value={course.category}
                      onChange={e => setCourse({ ...course, category: e.target.value })}
                      size="sm"
                      style={{ width: 'auto', display: 'inline-block' }}
                      placeholder="Category"
                    />
                    <Form.Select
                      value={course.field}
                      onChange={e => setCourse({ ...course, field: e.target.value })}
                      size="sm"
                      style={{ width: 'auto' }}
                    >
                      <option value="IT">IT</option>
                      <option value="Non-IT">Non-IT</option>
                    </Form.Select>
                    <Form.Check
                      type="switch"
                      id="popular-switch"
                      label="Popular"
                      checked={course.popular}
                      onChange={e => setCourse({ ...course, popular: e.target.checked })}
                      className="ms-2 d-flex align-items-center"
                    />
                    <Form.Check
                      type="switch"
                      id="status-switch"
                      label="Active"
                      checked={!course.isPaused}
                      onChange={e => setCourse({ ...course, isPaused: !e.target.checked })}
                      className="ms-2 d-flex align-items-center"
                    />
                  </>
                ) : (
                  <>
                    <Badge bg="primary" className="d-flex align-items-center">
                      <FiBook className="me-1" /> {course.category}
                    </Badge>
                    <Badge bg={course.field === 'IT' ? "info" : "secondary"} className="text-capitalize">
                      {course.field}
                    </Badge>
                    {course.popular && <Badge bg="warning" text="dark">Popular</Badge>}
                    <Badge bg={course.isPaused ? "danger" : "success"}>
                      {course.isPaused ? 'Paused' : 'Active'}
                    </Badge>
                  </>
                )}
              </div>
              {editing && (
                <Form.Control
                  type="file"
                  onChange={e => setSelectedImage(e.target.files[0])}
                  size="sm"
                  className="mt-2"
                />
              )}
            </Col>
          </Row>
        </div>

        <Card.Body className="p-4">
          {/* Course Stats */}
          {editing ? (
            <Row className="mb-4 g-3">
              <Col md={3}>
                <div className="bg-primary bg-opacity-10 p-3 rounded text-center">
                  <FiClock size={24} className="text-primary mb-2" />
                  <h5 className="mb-1">{course.duration}</h5>
                  <small className="text-muted">Duration</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="bg-success bg-opacity-10 p-3 rounded text-center">
                  <FiUsers size={24} className="text-success mb-2" />
                  <h5 className="mb-1">{course.students}</h5>
                  <small className="text-muted">Students</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="bg-warning bg-opacity-10 p-3 rounded text-center">
                  <FiStar size={24} className="text-warning mb-2" />
                  <h5 className="mb-1">{course.rating}/5</h5>
                  <small className="text-muted">Rating</small>
                </div>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small text-muted">Price*</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={course.price}
                      onChange={e => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          ) : (
            <Row className="mb-4 g-3">
              <Col md={3}>
                <div className="bg-primary bg-opacity-10 p-3 rounded text-center">
                  <FiClock size={24} className="text-primary mb-2" />
                  <h5 className="mb-1">{course.duration}</h5>
                  <small className="text-muted">Duration</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="bg-success bg-opacity-10 p-3 rounded text-center">
                  <FiUsers size={24} className="text-success mb-2" />
                  <h5 className="mb-1">{course.students}</h5>
                  <small className="text-muted">Students</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="bg-warning bg-opacity-10 p-3 rounded text-center">
                  <FiStar size={24} className="text-warning mb-2" />
                  <h5 className="mb-1">{course.rating}/5</h5>
                  <small className="text-muted">Rating</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="bg-info bg-opacity-10 p-3 rounded text-center">
                  <FaRupeeSign size={24} className="text-info mb-2" />
                  <h5 className="mb-1">{course.price?.toFixed(2) || '0.00'}</h5>
                  <small className="text-muted">Price</small>
                </div>
              </Col>
            </Row>
          )}

          {/* Description */}
          <div className="mb-4">
            <h5 className="mb-3 d-flex align-items-center">
              <FiInfo className="me-2" /> Description
            </h5>
            {editing ? (
              <Form.Control
                as="textarea"
                rows={3}
                value={course.description}
                onChange={e => setCourse({ ...course, description: e.target.value })}
                className="border-0 bg-light p-3"
              />
            ) : (
              <Card className="bg-light border-0 p-3">
                <p className="mb-0">{course.description}</p>
              </Card>
            )}
          </div>

          {/* Instructor Info */}
          <div className="mb-4">
            <h5 className="mb-3 d-flex align-items-center">
              <FiUser className="me-2" /> Instructor
            </h5>
            <Card className="border-0 bg-light">
              <Card.Body>
                {editing ? (
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="small text-muted">Name</Form.Label>
                      <Form.Control
                        value={course.instructor?.name || ''}
                        onChange={e =>
                          setCourse({
                            ...course,
                            instructor: {
                              ...(course.instructor || {}),
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="small text-muted">Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={course.instructor?.email || ''}
                        onChange={e =>
                          setCourse({
                            ...course,
                            instructor: {
                              ...(course.instructor || {}),
                              email: e.target.value,
                            },
                          })
                        }
                      />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="small text-muted">Title</Form.Label>
                      <Form.Control
                        value={course.instructor?.title || ''}
                        onChange={e =>
                          setCourse({
                            ...course,
                            instructor: {
                              ...(course.instructor || {}),
                              title: e.target.value,
                            },
                          })
                        }
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small text-muted">About</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={1}
                        value={course.instructor?.about || ''}
                        onChange={e =>
                          setCourse({
                            ...course,
                            instructor: {
                              ...(course.instructor || {}),
                              about: e.target.value,
                            },
                          })
                        }
                      />
                    </Col>
                  </Row>
                ) : course.instructor ? (
                  <Row>
                    <Col md={6} className="mb-3">
                      <h6 className="d-flex align-items-center">
                        <FiUser className="me-2" /> {course.instructor.name}
                      </h6>
                      <small className="text-muted">{course.instructor.title}</small>
                    </Col>
                    <Col md={6} className="mb-3">
                      <h6 className="d-flex align-items-center">
                        <FiMail className="me-2" /> {course.instructor.email}
                      </h6>
                    </Col>
                    <Col md={12}>
                      <p className="mb-0">
                        <FiAward className="me-2" /> {course.instructor.about}
                      </p>
                    </Col>
                  </Row>
                ) : (
                  <Row>
                    <Col>
                      <p className="text-muted fst-italic">No instructor assigned.</p>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Lessons Section */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 d-flex align-items-center">
                <FiBook className="me-2" /> Lessons
              </h5>
              {editing && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addLesson}
                  className="d-flex align-items-center"
                >
                  <FiPlus className="me-1" /> Add Lesson
                </Button>
              )}
            </div>

            {lessons.length === 0 ? (
              <Card className="bg-light border-0 text-center p-4">
                <p className="text-muted mb-0">No lessons added yet</p>
              </Card>
            ) : editing ? (
              <ListGroup variant="flush">
                {lessons.map((lesson, idx) => (
                  <ListGroup.Item key={idx} className="py-3 px-0">
                    <Row className="align-items-center g-2">
                      <Col md={4}>
                        <Form.Control
                          placeholder="Lesson Title"
                          value={lesson.title}
                          onChange={e => handleLessonChange(idx, 'title', e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          placeholder="Duration"
                          value={lesson.duration}
                          onChange={e => handleLessonChange(idx, 'duration', e.target.value)}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          type="file"
                          onChange={e => handleLessonChange(idx, 'video', e.target.files[0])}
                          accept="video/*"
                        />
                        {lesson.videoUrl && !lesson.video && (
                          <div className="d-flex align-items-center mt-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleVideoPreview(lesson.videoUrl)}
                              className="me-2"
                            >
                              <FiPlay className="me-1" /> Preview
                            </Button>
                            <small className="text-muted">
                              {lesson.videoUrl.split('/').pop()}
                            </small>
                          </div>
                        )}
                      </Col>
                      <Col md={1} className="text-end">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeLesson(idx)}
                        >
                          <FiTrash2 />
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <Accordion>
                {lessons.map((lesson, idx) => (
                  <Accordion.Item key={idx} eventKey={idx.toString()}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-primary me-3">{idx + 1}</span>
                        <span className="fw-bold me-3">{lesson.title}</span>
                        <small className="text-muted d-flex align-items-center">
                          <FiClock className="me-1" /> {lesson.duration}
                        </small>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      {lesson.videoUrl && (
                        <div className="mb-3">
                          <div className="ratio ratio-16x9 mb-2">
                            <video controls style={{ width: '100%' }}>
                              <source src={lesson.videoUrl} type="video/mp4" />
                            </video>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => handleVideoPreview(lesson.videoUrl)}
                            className="d-flex align-items-center"
                          >
                            <FiPlay className="me-1" /> Open Fullscreen
                          </Button>
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </div>

          {/* Edit Mode Actions */}
          {editing && (
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setEditing(false);
                  setSelectedImage(null);
                  fetchCourse();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Custom Styles */}
      <style>{`
        .accordion-button:not(.collapsed) {
          background-color: rgba(13, 110, 253, 0.05);
          color: #0d6efd;
        }
        .list-group-item {
          border-left: 0;
          border-right: 0;
        }
        .list-group-item:first-child {
          border-top: 0;
        }
        video {
          background-color: #000;
          border-radius: 0.375rem;
        }
        .alert {
          border: none;
        }
        .form-switch .form-check-input {
          width: 2.5em;
          height: 1.5em;
          margin-left: 0;
          margin-right: 0.5em;
        }
      `}</style>
    </Container>
  );
}

export default CourseDetails;