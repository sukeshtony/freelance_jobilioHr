import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Badge, 
  Modal, 
  Alert, 
  Spinner,
  Container,
  Row,
  Col,
  ListGroup
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaEye, 
  FaEnvelope,
  FaFilePdf,
  FaCalendarAlt,
  FaUserFriends,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import API from '../../api';

const SentCandidates = () => {
  const [sentCandidates, setSentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSentCandidates = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/requirements/sent-candidates');
      setSentCandidates(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching sent candidates:', err);
      setError('Failed to fetch sent candidates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await API.get('/api/requirements/sent-candidates-count');
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    fetchSentCandidates();
    fetchUnreadCount();
  }, []);

  const handleViewDetails = async (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
    
    try {
      const response = await API.get(`/api/requirements/sent-candidates/${record._id}`);
      setSelectedRecord(response.data);
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Failed to fetch candidate details.');
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRecord(null);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isRead) => {
    return isRead ? (
      <Badge bg="success">Read</Badge>
    ) : (
      <Badge bg="warning">New</Badge>
    );
  };

  const getMatchBadge = (percentage) => {
    if (percentage >= 70) return <Badge bg="success">{percentage}%</Badge>;
    if (percentage >= 50) return <Badge bg="warning">{percentage}%</Badge>;
    return <Badge bg="info">{percentage}%</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h2 className="mb-0">Sent Candidates</h2>
          <p className="text-muted mb-0">
            View candidates sent by admin for your requirements
          </p>
        </Col>
        <Col md={6} className="text-md-end">
          {unreadCount > 0 && (
            <Badge bg="warning" className="me-2">
              {unreadCount} new
            </Badge>
          )}
          <Button 
            variant="outline-primary" 
            onClick={fetchSentCandidates}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {sentCandidates.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaUsers className="text-muted mb-3" style={{ fontSize: '3rem' }} />
            <h4>No Sent Candidates</h4>
            <p className="text-muted">
              No candidates have been sent by admin yet. Check back later!
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Job Requirement</th>
                    <th>Sent By</th>
                    <th>Candidates</th>
                    <th>Status</th>
                    <th>Sent Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sentCandidates.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div>
                          <strong>{record.requirementId?.jobTitle || 'Unknown'}</strong>
                          <div className="text-muted small">
                            {record.requirementId?.location} • {record.requirementId?.jobType}
                          </div>
                          <div className="text-muted small">
                            {record.requirementId?.experienceMin} - {record.requirementId?.experienceMax} yrs exp
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaUserFriends className="me-2 text-primary" />
                          {record.adminId?.username || 'Admin'}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaUsers className="me-1" />
                          <span className="fw-bold">{record.totalCandidates}</span>
                          <small className="text-muted ms-1">
                            / {record.requestedCount} requested
                          </small>
                        </div>
                        {record.totalCandidates < record.requestedCount && (
                          <small className="text-warning d-block">
                            <FaExclamationTriangle className="me-1" />
                            Limited candidates available
                          </small>
                        )}
                      </td>
                      <td>
                        {getStatusBadge(record.isRead)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="me-1 text-muted" />
                          {formatDate(record.sentAt)}
                        </div>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewDetails(record)}
                          className="d-flex align-items-center"
                        >
                          <FaEye className="me-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={handleCloseModal} 
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <h4 className="mb-0">
              Candidate Details
            </h4>
            {selectedRecord?.requirementId && (
              <div className="d-flex align-items-center mt-2">
                <Badge bg="light" text="dark" className="me-2">
                  {selectedRecord.requirementId.jobTitle}
                </Badge>
                <Badge bg="light" text="dark" className="me-2">
                  {selectedRecord.requirementId.jobType}
                </Badge>
                <Badge bg="light" text="dark">
                  {selectedRecord.totalCandidates} candidates
                </Badge>
              </div>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord ? (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="border-info">
                    <Card.Header className="bg-info text-white">
                      <FaUsers className="me-2" />
                      Summary
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Total Candidates:</span>
                          <Badge bg="primary">{selectedRecord.totalCandidates}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Requested:</span>
                          <Badge bg="secondary">{selectedRecord.requestedCount}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Sent By:</span>
                          <span>{selectedRecord.adminId?.username || 'Admin'}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Sent Date:</span>
                          <span>{formatDate(selectedRecord.sentAt)}</span>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-warning">
                    <Card.Header className="bg-warning text-dark">
                      <FaExclamationTriangle className="me-2" />
                      Note
                    </Card.Header>
                    <Card.Body>
                      {selectedRecord.totalCandidates < selectedRecord.requestedCount ? (
                        <Alert variant="warning">
                          <strong>Limited Candidates Available</strong>
                          <br />
                          Only {selectedRecord.totalCandidates} matching candidates found out of {selectedRecord.requestedCount} requested.
                          <br />
                          Consider broadening your requirements for better matches.
                        </Alert>
                      ) : (
                        <Alert variant="success">
                          <strong>Perfect Match!</strong>
                          <br />
                          Found {selectedRecord.totalCandidates} candidates matching your requirements.
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5 className="mb-3">Candidate Details</h5>
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th>Candidate</th>
                      <th>Experience</th>
                      <th>Location</th>
                      <th>Skills Match</th>
                      <th>Overall Match</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.candidates?.map((candidate, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{candidate.username}</h6>
                              <small className="text-muted">{candidate.email}</small>
                              {candidate.experienceMatch && (
                                <Badge bg="success" className="ms-2 small">✓ Experience Match</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{candidate.experience} yrs</strong>
                        </td>
                        <td>{candidate.location}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              {getMatchBadge(candidate.skillMatchPercentage)}
                              {candidate.matchedSkills?.length > 0 && (
                                <small className="text-muted d-block mt-1">
                                  {candidate.matchedSkills.slice(0, 3).join(', ')}
                                  {candidate.matchedSkills.length > 3 && '...'}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {getMatchBadge(candidate.matchPercentage)}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              href={`mailto:${candidate.email}`}
                            >
                              <FaEnvelope className="me-1" />
                              Email
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SentCandidates;
