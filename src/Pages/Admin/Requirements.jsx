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
  Form
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaTrash, 
  FaFileAlt,
  FaBriefcase,
  FaUserFriends,
  FaBuilding,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaEye,
  FaFilePdf,
  FaCheck
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import {API_BASE_URL} from '../../api'

const Requirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [sendingCandidates, setSendingCandidates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJobType, setFilterJobType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Remote', 'Contract', 'Internship', 'Freelance'];
  const statusTypes = ['All', 'active', 'closed', 'draft'];

  const isClientDeleted = (client) => {
    // Check if client is null/undefined or has properties indicating it's deleted
    return !client || 
           client.username === 'Unknown' || 
           client.email === 'No email' ||
           client.isDeleted === true;
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/requirements');
      // Filter out requirements with deleted clients
      const filteredRequirements = response.data.filter(req => 
        !isClientDeleted(req.clientId)
      );
      
      // Fetch matching counts for all requirements
      const requirementsWithCounts = await Promise.all(
        filteredRequirements.map(async (req) => {
          try {
            const candidatesResponse = await API.get(`/api/requirements/${req._id}/candidates/admin`);
            const candidatesData = (candidatesResponse.data.candidates || candidatesResponse.data).filter(c => (c.matchPercentage ?? 0) > 0);
            return {
              ...req,
              matchingCount: candidatesData.length,
              candidatesSent: req.candidatesSent
            };
          } catch (err) {
            console.error(`Error fetching candidates for requirement ${req._id}:`, err);
            return {
              ...req,
              matchingCount: 0,
              candidatesSent: req.candidatesSent
            };
          }
        })
      );
      
      setRequirements(requirementsWithCounts);
      setError('');
    } catch (err) {
      console.error('Error fetching requirements:', err);
      setError('Failed to fetch requirements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleViewCandidates = async (requirement) => {
    setSelectedRequirement(requirement);
    setShowCandidatesModal(true);
    setCandidatesLoading(true);
    setError(''); // Clear any previous errors

    try {
      const response = await API.get(`/api/requirements/${requirement._id}/candidates/admin`);
      // Backend now returns candidates with at least 30% match; ensure we drop any 0% just in case
      const candidatesData = (response.data.candidates || response.data).filter(c => (c.matchPercentage ?? 0) > 0);
      setCandidates(candidatesData);
      
      // Update the requirement with matching count and sent status
      setRequirements(prev => prev.map(req => 
        req._id === requirement._id 
          ? { 
              ...req, 
              matchingCount: candidatesData.length,
              candidatesSent: response.data.candidatesSent || req.candidatesSent
            } 
          : req
      ));
    } catch (err) {
      console.error('Error fetching candidates:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch candidates. Please try again.';
      setError(errorMessage);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleViewCandidateProfile = (candidateId) => {
    navigate(`/admin/candidates/${candidateId}`);
  };

  const handleCloseModal = () => {
    setShowCandidatesModal(false);
    setError('');
    setCandidates([]);
  };

  const handleSendToClient = async (requirement) => {
    if (!window.confirm(`Send ${candidates.length} matching candidates to client for "${requirement.jobTitle}"?`)) {
      return;
    }

    setSendingCandidates(true);
    try {
      const response = await API.post(`/api/requirements/${requirement._id}/send-candidates`);
      const { totalSent, requested, availableMatches, notificationCreated, error, message } = response.data;
      
      if (notificationCreated && error === 'CLIENT_NO_CREDITS') {
        alert('Client has no credits. Notification created for client to request credits.');
      } else {
        alert(`Sent ${totalSent}/${requested} candidates.` + (availableMatches !== undefined ? ` Available matches: ${availableMatches}.` : ''));
      }
      
      // Update the requirement to mark candidates as sent
      setRequirements(prev => prev.map(req => 
        req._id === requirement._id 
          ? { ...req, candidatesSent: true, sentDate: new Date().toISOString() }
          : req
      ));
      
      // Close modal after sending
      handleCloseModal();
    } catch (err) {
      console.error('Error sending candidates:', err);
      const errorMessage = err.response?.data?.error || 'Failed to send candidates to client.';
      setError(errorMessage);
    } finally {
      setSendingCandidates(false);
    }
  };

  const handleDeleteRequirement = async (requirementId) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;

    try {
      await API.delete(`/api/requirements/${requirementId}`);
      
      setRequirements(prev => prev.filter(req => req._id !== requirementId));
    } catch (err) {
      console.error('Error deleting requirement:', err);
      setError('Failed to delete requirement. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      closed: 'secondary',
      draft: 'warning'
    };
    return <Badge bg={variants[status] || 'primary'}>{status}</Badge>;
  };

  const getJobTypeBadge = (type) => {
    const variants = {
      'Full-time': 'primary',
      'Part-time': 'info',
      'Remote': 'success',
      'Contract': 'warning',
      'Internship': 'danger',
      'Freelance': 'dark'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const filteredRequirements = requirements.filter(requirement => {
    // First make sure the client isn't deleted
    if (isClientDeleted(requirement.clientId)) {
      return false;
    }

    const matchesSearch = 
      requirement.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      requirement.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      requirement.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesJobType = 
      filterJobType === 'all' || 
      requirement.jobType === filterJobType;

    const matchesStatus = 
      filterStatus === 'all' || 
      requirement.status === filterStatus;

    return matchesSearch && matchesJobType && matchesStatus;
  });

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
          <h2 className="mb-0">Job Requirements</h2>
          <p className="text-muted mb-0">
            Manage all job requirements posted by clients
          </p>
        </Col>
        <Col md={6} className="text-md-end">
          <Button 
            variant="outline-primary" 
            onClick={fetchRequirements}
            disabled={loading}
            className="me-2"
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters Section */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FaSearch className="me-2" />
                  Search
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by job title, skills or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FaFilter className="me-2" />
                  Job Type
                </Form.Label>
                <Form.Select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type === 'All' ? 'all' : type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FaFilter className="me-2" />
                  Status
                </Form.Label>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statusTypes.map(type => (
                    <option key={type} value={type === 'All' ? 'all' : type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredRequirements.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <FaFileAlt className="text-muted mb-3" style={{ fontSize: '3rem' }} />
            <h4>No Requirements Found</h4>
            <p className="text-muted">
              {requirements.length === 0 
                ? "No job requirements have been posted yet." 
                : "No requirements match your filters."}
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
                    <th>Client</th>
                    <th>Job Title</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th className="text-center">Applicants</th>
                    <th>Status</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((requirement) => (
                    <tr key={requirement._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-light rounded p-1 me-2">
                            <FaBuilding className="text-primary fs-4" />
                          </div>
                          <div>
                            <h6 className="mb-0">{requirement.clientId?.username || 'Unknown'}</h6>
                            <small className="text-muted">{requirement.clientId?.email || 'No email'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{requirement.jobTitle}</strong>
                        {requirement.salaryBudget && (
                          <div className="text-muted small">
                            {requirement.salaryBudget}
                          </div>
                        )}
                        <div className="mt-1">
                          {requirement.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-1 small">
                              {skill}
                            </Badge>
                          ))}
                          {requirement.skills.length > 3 && (
                            <Badge bg="light" text="dark" className="small">
                              +{requirement.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        {getJobTypeBadge(requirement.jobType)}
                      </td>
                      <td>{requirement.location}</td>
                      <td>
                        {requirement.experienceMin} - {requirement.experienceMax} yrs
                      </td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center">
                          <FaUserFriends className="me-1" />
                          <span className="fw-bold">{requirement.applicantsCount || 0}</span>
                          <small className="text-muted ms-1">
                            (matching: {requirement.matchingCount || 0})
                          </small>
                        </div>
                      </td>
                      <td>{getStatusBadge(requirement.status)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="me-1 text-muted" />
                          {formatDate(requirement.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleViewCandidates(requirement)}
                            className="d-flex align-items-center"
                          >
                            <FaUsers className="me-1" />
                            <span className="d-none d-md-inline">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteRequirement(requirement._id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
          <Card.Footer className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {filteredRequirements.length} of {requirements.length} requirements
              </small>
              <Button 
                variant="link" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterJobType('all');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}

      {/* Candidates Modal */}
       <Modal 
        show={showCandidatesModal} 
        onHide={handleCloseModal} 
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <h4 className="mb-0">
              Matching Candidates for: {selectedRequirement?.jobTitle}
            </h4>
            <div className="d-flex align-items-center mt-2">
              <Badge bg="light" text="dark" className="me-2">
                {selectedRequirement?.jobType}
              </Badge>
              <Badge bg="light" text="dark" className="me-2">
                {selectedRequirement?.location}
              </Badge>
              <Badge bg="light" text="dark">
                {selectedRequirement?.experienceMin} - {selectedRequirement?.experienceMax} yrs exp
              </Badge>
              {selectedRequirement?.candidatesSent && (
                <Badge bg="success" className="ms-2">
                  <FaCheck className="me-1" />
                  Sent to Client
                </Badge>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {candidatesLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : error ? (
            <Alert variant="danger">
              {error}
            </Alert>
          ) : candidates.length === 0 ? (
            <Alert variant="info">
              No matching candidates found for this requirement.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>Candidate</th>
                    <th>Experience</th>
                    <th>Location</th>
                    <th>Skills Match</th>
                    <th>Overall Match</th>
                    <th>Resume</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate._id}>
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
                            <Badge 
                              bg={candidate.skillMatchPercentage >= 70 ? "success" : 
                                  candidate.skillMatchPercentage >= 50 ? "warning" : "info"} 
                              className="me-2"
                            >
                              {candidate.skillMatchPercentage}%
                            </Badge>
                            {candidate.matchedSkills.length > 0 && (
                              <small className="text-muted d-block mt-1">
                                {candidate.matchedSkills.slice(0, 3).join(', ')}
                                {candidate.matchedSkills.length > 3 && '...'}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={candidate.matchPercentage >= 70 ? "success" : 
                              candidate.matchPercentage >= 50 ? "warning" : "info"}
                        >
                          {candidate.matchPercentage}%
                        </Badge>
                      </td>
                      <td>
                        {candidate.resume ? (
                          <div className="d-flex align-items-center">
                            <i className="bi bi-file-earmark-text text-success me-2"></i>
                            <a 
                              href={`${API_BASE_URL}${candidate.resume}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                            >
                              View
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted">No resume</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            href={`mailto:${candidate.email}`}
                          >
                            Email
                          </Button>
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewCandidateProfile(candidate._id)}
                        >
                          <FaEye className="me-1" />
                          Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <div className="d-flex justify-content-between w-100">
            <div>
              {selectedRequirement && (
                <small className="text-muted">
                  {selectedRequirement.candidatesSent ? (
                    <>
                      Candidates were sent to client on {formatDate(selectedRequirement.sentDate || selectedRequirement.updatedAt)}
                    </>
                  ) : (
                    <>
                      Showing {candidates.length} matching candidates for "{selectedRequirement.jobTitle}"
                    </>
                  )}
                </small>
              )}
            </div>
            <div className="d-flex gap-2">
              {selectedRequirement?.candidatesSent ? (
                <Button variant="success" disabled>
                  <FaCheck className="me-1" />
                  Already Sent
                </Button>
              ) : (
                <Button 
                  variant="success"
                  onClick={() => handleSendToClient(selectedRequirement)}
                  disabled={sendingCandidates || candidates.length === 0}
                >
                  {sendingCandidates ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaUsers className="me-1" />
                      Send to Client
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setShowCandidatesModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Requirements;