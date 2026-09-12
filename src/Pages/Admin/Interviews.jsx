import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge, Spinner, Table, InputGroup } from 'react-bootstrap';
import { FaSearch, FaEye, FaEdit, FaTrash, FaCalendarAlt, FaUser, FaUserTie, FaLink, FaClipboardCheck, FaStar, FaThumbsUp, FaLightbulb, FaChartLine } from 'react-icons/fa';
import API from '../../api';

const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [filters, setFilters] = useState({
    candidate: '',
    interviewer: '',
    status: '',
    date: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    status: '',
    score: '',
    feedback: '',
    topics: '',
    strengths: '',
    areasToImprove: '',
    recommendations: '',
    passed: '',
    meetingLink: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, interviews]);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/interview/bookings?includeCancelled=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedInterviews = response.data
        .sort((a, b) => {
          // Combine date and time for accurate sorting (newest first)
          const parseDateTime = (d, t) => {
            try {
              if (!t) return new Date(d).getTime();
              // Normalize times like '02:00 PM' to 24h
              const [timePart, meridiem] = t.split(' ');
              let [h, m] = timePart.split(':').map(Number);
              if (meridiem === 'PM' && h !== 12) h += 12;
              if (meridiem === 'AM' && h === 12) h = 0;
              const dateObj = new Date(d);
              dateObj.setHours(h, m || 0, 0, 0);
              return dateObj.getTime();
            } catch {
              return new Date(d).getTime();
            }
          };
          return parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time);
        });
      setInterviews(sortedInterviews);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching interviews:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filteredList = interviews.filter(i => {
      const matchCandidate =
        i.candidate?.username?.toLowerCase().includes(filters.candidate.toLowerCase()) ||
        i.candidate?.email?.toLowerCase().includes(filters.candidate.toLowerCase());

      const matchInterviewer =
        i.interviewer?.name?.toLowerCase().includes(filters.interviewer.toLowerCase());

      const matchStatus = filters.status === '' || i.status === filters.status;

      const matchDate =
        filters.date === '' ||
        new Date(i.date).toISOString().split('T')[0] === filters.date;

      return matchCandidate && matchInterviewer && matchStatus && matchDate;
    });

    setFiltered(filteredList);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      await API.delete(`/api/interview/bookings/${id}`);
      const updated = interviews.filter(i => i._id !== id);
      setInterviews(updated);
    } catch (err) {
      alert('Failed to delete interview');
    }
  };

  const handleView = (interview) => {
    setSelectedInterview(interview);
    setShowDetailModal(true);
  };

  const handleEdit = (interview) => {
    setSelectedInterview(interview);
    setFormData({
      status: interview.status || '',
      score: interview.result?.score || '',
      feedback: interview.result?.feedback || '',
      topics: interview.result?.topics?.join(', ') || '',
      strengths: interview.result?.strengths?.join(', ') || '',
      areasToImprove: interview.result?.areasToImprove?.join(', ') || '',
      recommendations: interview.result?.recommendations?.join(', ') || '',
      passed: interview.result?.passed || '',
      meetingLink: interview.meetingLink || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        status: formData.status,
        meetingLink: formData.meetingLink,
        result: {
          score: Number(formData.score),
          feedback: formData.feedback,
          topics: formData.topics.split(',').map(t => t.trim()),
          strengths: formData.strengths.split(',').map(s => s.trim()),
          areasToImprove: formData.areasToImprove.split(',').map(a => a.trim()),
          recommendations: formData.recommendations.split(',').map(r => r.trim()),
          passed: formData.passed === 'Yes',
        }
      };
      const response = await API.patch(`/api/interview/bookings/${selectedInterview._id}`, payload);
      const updatedList = interviews.map(i => i._id === response.data._id ? response.data : i);
      setInterviews(updatedList);
      setShowEditModal(false);
    } catch (err) {
      alert('Failed to update interview');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      case 'No Show': return 'warning';
      case 'Conducted': return 'info';
      default: return 'secondary';
    }
  };

  const formatDateTime = (dateString, timeString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${timeString}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white border-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0 fw-bold text-primary">
              <FaClipboardCheck className="me-2" /> Interview Management
            </h4>
            <small className="text-muted">View and manage all interviews including cancelled ones</small>
          </div>
          <div>
            <Button
              variant={showFilters ? 'primary' : 'outline-primary'}
              size="sm"
              className="me-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaSearch className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={fetchInterviews}>
              Refresh
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3">
            <Row className="g-2">
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaUser /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Candidate"
                    name="candidate"
                    value={filters.candidate}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaUserTie /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Interviewer"
                    name="interviewer"
                    value={filters.interviewer}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaClipboardCheck /></InputGroup.Text>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Statuses</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                    <option value="Conducted">Conducted</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                  <Form.Control
                    type="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Col>
            </Row>
          </div>
        )}
      </Card.Header>

      <Card.Body className="p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-5">
            <img
              src="/empty-interviews.svg"
              alt="No interviews found"
              style={{ height: '150px', opacity: 0.7 }}
              className="mb-3"
            />
            <h5 className="text-muted">No interviews found</h5>
            <p className="text-muted">Try adjusting your search filters</p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setFilters({
                  candidate: '',
                  interviewer: '',
                  status: '',
                  date: ''
                });
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Candidate</th>
                  <th>Interviewer</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i._id}>
                    <td>
                      <div className="fw-semibold">{i.candidate?.username || 'N/A'}</div>
                      <small className="text-muted">{i.candidate?.email || ''}</small>
                    </td>
                    <td>
                      <div className="fw-semibold">{i.interviewer?.name || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="fw-semibold">{new Date(i.date).toLocaleDateString()}</div>
                      <small className="text-muted">{i.time}</small>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="fw-normal">
                        {i.interviewType || 'N/A'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusBadge(i.status)} className="text-capitalize">
                        {i.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleView(i)}
                        >
                          <FaEye className="me-1" /> View
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleEdit(i)}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleDelete(i._id)}
                        >
                          <FaTrash className="me-1" /> Delete
                        </Button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {filtered.length > 0 && (
        <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing <strong>{filtered.length}</strong> of <strong>{interviews.length}</strong> interviews
          </small>
        </Card.Footer>
      )}

      {/* View Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <FaClipboardCheck className="me-2" /> Interview Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInterview && (
            <div className="row">
              <div className="col-md-6">
                <h6 className="mb-3 text-primary fw-bold">Basic Information</h6>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaUser className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Candidate</small>
                      <div className="fw-semibold">
                        {selectedInterview.candidate?.username || selectedInterview.candidate?.email}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaUserTie className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Interviewer</small>
                      <div className="fw-semibold">
                        {selectedInterview.interviewer?.name || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaCalendarAlt className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Date & Time</small>
                      <div className="fw-semibold">
                        {formatDateTime(selectedInterview.date, selectedInterview.time)}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaClipboardCheck className="me-2 text-muted" />
                    <div>
                      <small className="text-muted d-block">Type</small>
                      <div className="fw-semibold">
                        {selectedInterview.interviewType || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <Badge bg={getStatusBadge(selectedInterview.status)} className="text-capitalize">
                      {selectedInterview.status}
                    </Badge>
                  </div>
                </div>

                {selectedInterview.meetingLink && (
                  <>
                    <h6 className="mb-3 text-primary fw-bold">Meeting Details</h6>
                    <div className="d-flex align-items-center mb-3">
                      <FaLink className="me-2 text-muted" />
                      <div>
                        <small className="text-muted d-block">Meeting Link</small>
                        <a href={selectedInterview.meetingLink} target="_blank" rel="noopener noreferrer" className="fw-semibold">
                          Join Meeting
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {selectedInterview.result && (
                <div className="col-md-6">
                  <h6 className="mb-3 text-primary fw-bold">Evaluation Results</h6>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaStar className="me-2 text-warning" />
                      <div>
                        <small className="text-muted d-block">Score</small>
                        <div className="fw-semibold">
                          {selectedInterview.result.score || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <FaThumbsUp className="me-2 text-success" />
                      <div>
                        <small className="text-muted d-block">Passed</small>
                        <div className="fw-semibold">
                          {selectedInterview.result.passed === true ? 'Yes' :
                            selectedInterview.result.passed === false ? 'No' : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted d-block">Feedback</small>
                      <div className="p-2 bg-light rounded">
                        {selectedInterview.result.feedback || 'No feedback provided'}
                      </div>
                    </div>
                  </div>

                  <h6 className="mb-3 text-primary fw-bold">Detailed Assessment</h6>
                  <div className="mb-3">
                    <div className="d-flex align-items-start mb-2">
                      <FaChartLine className="me-2 text-primary mt-1" />
                      <div>
                        <small className="text-muted d-block">Topics Covered</small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedInterview.result.topics?.map((topic, i) => (
                            <Badge key={i} bg="light" text="dark" className="fw-normal">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-start mb-2">
                      <FaThumbsUp className="me-2 text-success mt-1" />
                      <div>
                        <small className="text-muted d-block">Strengths</small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedInterview.result.strengths?.map((strength, i) => (
                            <Badge key={i} bg="success-light" text="success" className="fw-normal">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-start mb-2">
                      <FaLightbulb className="me-2 text-warning mt-1" />
                      <div>
                        <small className="text-muted d-block">Areas to Improve</small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedInterview.result.areasToImprove?.map((area, i) => (
                            <Badge key={i} bg="warning-light" text="warning" className="fw-normal">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-start">
                      <FaClipboardCheck className="me-2 text-info mt-1" />
                      <div>
                        <small className="text-muted d-block">Recommendations</small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedInterview.result.recommendations?.map((rec, i) => (
                            <Badge key={i} bg="info-light" text="info" className="fw-normal">
                              {rec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <FaEdit className="me-2" /> Edit Interview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3 text-primary fw-bold">Interview Details</h6>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select-lg"
                >
                  <option value="">Select Status</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                  <option value="Conducted">Conducted</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Meeting Link</Form.Label>
                <Form.Control
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleInputChange}
                  placeholder="Enter meeting URL"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 text-primary fw-bold">Evaluation Results</h6>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Score</Form.Label>
                    <Form.Control
                      name="score"
                      value={formData.score}
                      onChange={handleInputChange}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Passed</Form.Label>
                    <Form.Select
                      name="passed"
                      value={formData.passed}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                </Col>
              </Row>
            </div>
          </div>

          {/* Centered and larger feedback field */}
          <div className="row  mb-4">
            <div className="col-md-10">
              <h6 className="text-primary fw-bold mb-3">Feedback</h6>
              <Form.Control
                as="textarea"
                rows={5}
                name="feedback"
                value={formData.feedback}
                onChange={handleInputChange}
                placeholder="Enter detailed feedback here..."
                className="fs-5"
                style={{ minHeight: '150px' }}
              />
            </div>
          </div>

          <h6 className="mb-3 text-primary fw-bold">Detailed Assessment</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Topics Covered</Form.Label>
                <Form.Control
                  name="topics"
                  value={formData.topics}
                  onChange={handleInputChange}
                  placeholder="Comma separated topics"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Strengths</Form.Label>
                <Form.Control
                  name="strengths"
                  value={formData.strengths}
                  onChange={handleInputChange}
                  placeholder="Comma separated strengths"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Areas to Improve</Form.Label>
                <Form.Control
                  name="areasToImprove"
                  value={formData.areasToImprove}
                  onChange={handleInputChange}
                  placeholder="Comma separated areas"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Recommendations</Form.Label>
                <Form.Control
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleInputChange}
                  placeholder="Comma separated recommendations"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default Interviews;