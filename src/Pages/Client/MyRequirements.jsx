import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  Navbar,
  Nav,
  Form,
  InputGroup,
  Accordion,
  ListGroup
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaTrash, 
  FaFileAlt,
  FaCreditCard,
  FaUserFriends,
  FaHome,
  FaFilter,
  FaSearch,
  FaBriefcase,
  FaMoneyBillWave,
  FaChevronUp,
  FaUserTie
} from 'react-icons/fa';
import API from '../../api';

const MyRequirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [salaryRange, setSalaryRange] = useState([0, 100]);
  const [experienceRange, setExperienceRange] = useState([0, 30]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await API.get('/api/requirements/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequirements(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching requirements:', err);
      setError('Failed to fetch requirements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/api/credits/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredits(response.data.credits || 0);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  useEffect(() => {
    fetchRequirements();
    fetchCredits();
  }, []);

  // Auto-open matching candidates modal when navigated with openRequirement query param
  useEffect(() => {
    const openRequirementId = searchParams.get('openRequirement');
    if (!openRequirementId || requirements.filter(r => r.status !== 'deleted').length === 0) return;

    const match = requirements.find(r => r._id === openRequirementId && r.status !== 'deleted');
    if (match) {
      handleViewCandidates(match);
    }
  }, [searchParams, requirements]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter(requirement => {
      // Exclude deleted requirements
      if (requirement.status === 'deleted') {
        return false;
      }

      // Search term filter (searches job title, skills, and location)
      const matchesSearchTerm = 
        !searchTerm ||
        requirement.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (requirement.location && 
         requirement.location.toLowerCase().includes(searchTerm.toLowerCase()));

      // Job type filter
      const matchesJobType = 
        selectedJobTypes.length === 0 ||
        selectedJobTypes.includes(requirement.jobType);

      // Status filter
      const matchesStatus = 
        selectedStatus.length === 0 ||
        selectedStatus.includes(requirement.status);

      // Salary filter - extract numeric value from salary string
      const salaryMatch = () => {
        if (salaryRange[0] === 0 && salaryRange[1] === 100) return true; // No filter applied
        if (!requirement.salaryBudget) return false;
        
        // Extract first numeric value from salary string (e.g., "₹10-15 LPA" -> 10)
        const matches = requirement.salaryBudget.match(/\d+/);
        if (!matches) return false;
        
        const numericValue = parseInt(matches[0], 10);
        return numericValue >= salaryRange[0] && numericValue <= salaryRange[1];
      };

      // Experience filter
      const matchesExperience = 
        (requirement.experienceMin >= experienceRange[0] && 
         requirement.experienceMin <= experienceRange[1]) ||
        (requirement.experienceMax >= experienceRange[0] && 
         requirement.experienceMax <= experienceRange[1]);

      return (
        matchesSearchTerm &&
        matchesJobType &&
        matchesStatus &&
        salaryMatch() &&
        matchesExperience
      );
    });
  }, [requirements, searchTerm, selectedJobTypes, selectedStatus, salaryRange, experienceRange]);

  const handleViewCandidates = async (requirement) => {
    setSelectedRequirement(requirement);
    setShowCandidatesModal(true);
    setCandidatesLoading(true);

    try {
      const token = localStorage.getItem('token');
      const sentListRes = await API.get('/api/requirements/sent-candidates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sentList = Array.isArray(sentListRes.data) ? sentListRes.data : [];
      const recordForRequirement = sentList.find(r => r.requirementId?._id === requirement._id);
      setCandidates(recordForRequirement?.candidates || []);
    } catch (err) {
      console.error('Error fetching sent candidates:', err);
      setError('Failed to fetch sent candidates. Please try again.');
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleViewResume = async (candidateId) => {
    navigate(`/CandidateResume/${candidateId}`);
  };

  const handleDeleteRequirement = async (requirementId) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;

    try {
      const token = localStorage.getItem('token');
      await API.delete(`/api/requirements/${requirementId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

  // Filter toggle functions
  const toggleJobType = (type) => {
    setSelectedJobTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
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
    <div className="recruiter-portal-enhanced" style={{ minHeight: '100vh' }}>
      {/* Fixed Navbar */}
      <Navbar expand="lg" className="shadow-sm bg-white fixed-top">
        <Container fluid>
          <Navbar.Brand 
            className="d-flex align-items-center"
            onClick={() => navigate('/NaukriClientPortal')}
            style={{ cursor: 'pointer' }}
          >
            <img 
              src="/logo.jpeg" 
              alt="JobilioHR Logo" 
              className="img-fluid me-2" 
              style={{ height: '35px', maxWidth: '100%' }} 
            />
          </Navbar.Brand>
          <div className="ms-auto">
            <Button 
              variant="primary" 
              size="sm"
              className="rounded-pill px-3 px-md-4"
              onClick={() => navigate('/naukri-client-portal')}
            >
              <FaHome className="me-1 d-none d-sm-inline" />
              <span>Dashboard</span>
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* Main Content with Sidebar */}
      <div style={{ paddingTop: '80px' }}>
        <Container fluid className="px-2 px-lg-5">
          <Row className="g-0 g-md-3">
            {/* Filters Sidebar - Fixed position */}
            <Col lg={3} className={`mb-4 ${!showFilters ? 'd-none d-lg-block' : ''}`} style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fs-6">
                    <FaFilter className="me-2 text-primary" />
                    Filters
                  </h5>
                  <Button 
                    variant="link" 
                    className="d-lg-none p-0"
                    onClick={() => setShowFilters(false)}
                  >
                    <FaChevronUp />
                  </Button>
                </Card.Header>
                <Card.Body className="p-3">
                  <Form.Group className="mb-4">
                    <Form.Label className="fs-7">Search Jobs</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        placeholder="Job title, skills or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="fs-7"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Accordion defaultActiveKey={['0', '1', '2', '3']} alwaysOpen>
                    {/* Job Type Filter */}
                    <Accordion.Item eventKey="0" className="mb-3 border-0">
                      <Accordion.Header className="p-0 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <FaBriefcase className="me-2 text-muted" />
                          <span className="fs-7">Job Type</span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="px-0 py-2">
                        <ListGroup variant="flush">
                          {['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship', 'Freelance'].map(type => (
                            <ListGroup.Item key={type} action className="border-0 py-2">
                              <Form.Check
                                type="checkbox"
                                id={`job-type-${type}`}
                                label={
                                  <>
                                    <span className="fs-7">{type}</span>
                                    <Badge pill bg="light" text="dark" className="ms-2 fs-8">
                                      {requirements.filter(r => r.jobType === type && r.status !== 'deleted').length}
                                    </Badge>
                                  </>
                                }
                                checked={selectedJobTypes.includes(type)}
                                onChange={() => toggleJobType(type)}
                                className="fs-7"
                              />
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Salary Range Filter */}
                    <Accordion.Item eventKey="1" className="mb-3 border-0">
                      <Accordion.Header className="p-0 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <FaMoneyBillWave className="me-2 text-muted" />
                          <span className="fs-7">Salary Range (LPA)</span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="px-0 py-2">
                        <div className="px-3">
                          <Form.Label className="fs-7">
                            ₹{salaryRange[0]} - ₹{salaryRange[1]} LPA
                          </Form.Label>
                          <Form.Range 
                            min="0" 
                            max="100" 
                            value={salaryRange[1]} 
                            onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value)])}
                          />
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Experience Filter */}
                    <Accordion.Item eventKey="2" className="mb-3 border-0">
                      <Accordion.Header className="p-0 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <FaUserTie className="me-2 text-muted" />
                          <span className="fs-7">Experience (years)</span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="px-0 py-2">
                        <div className="px-3">
                          <Form.Label className="fs-7">
                            {experienceRange[0]} - {experienceRange[1]} years
                          </Form.Label>
                          <Form.Range 
                            min="0" 
                            max="30" 
                            value={experienceRange[1]} 
                            onChange={(e) => setExperienceRange([experienceRange[0], parseInt(e.target.value)])}
                          />
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Status Filter */}
                    <Accordion.Item eventKey="3" className="mb-3 border-0">
                      <Accordion.Header className="p-0 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <FaFileAlt className="me-2 text-muted" />
                          <span className="fs-7">Status</span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body className="px-0 py-2">
                        <ListGroup variant="flush">
                          {['active', 'closed', 'draft'].map(status => (
                            <ListGroup.Item key={status} action className="border-0 py-2">
                              <Form.Check
                                type="checkbox"
                                id={`status-${status}`}
                                label={
                                  <>
                                    <span className="fs-7">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                    <Badge pill bg="light" text="dark" className="ms-2 fs-8">
                                      {requirements.filter(r => r.status === status).length}
                                    </Badge>
                                  </>
                                }
                                checked={selectedStatus.includes(status)}
                                onChange={() => toggleStatus(status)}
                                className="fs-7"
                              />
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="w-100 mt-2 fs-7"
                    onClick={() => {
                      setSelectedJobTypes([]);
                      setSelectedStatus([]);
                      setSalaryRange([0, 100]);
                      setExperienceRange([0, 30]);
                      setSearchTerm('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* Main Content Area */}
            <Col xs={12} lg={9}>
              <Row className="mb-3 mb-md-4">
                <Col>
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 mb-md-3">
                    <div>
                      <h2 className="mb-2 mb-md-3 fs-5 fs-md-4">My Job Requirements</h2>
                      <p className="text-muted mb-0 fs-7 fs-md-6">
                      Manage your posted job requirements and view matching candidates
                    </p>
                    </div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-lg-none mt-2 mt-md-0"
                      onClick={() => setShowFilters(true)}
                    >
                      <FaFilter className="me-1" /> Filters
                    </Button>
                  </div>
                </Col>
              </Row>

              {error && <Alert variant="danger" className="fs-7 fs-md-6">{error}</Alert>}

              {filteredRequirements.length === 0 ? (
                <Card>
                  <Card.Body className="text-center py-4 py-md-5">
                    <FaFileAlt className="text-muted mb-3" style={{ fontSize: '2.5rem' }} />
                    <h4 className="fs-5 fs-md-4">No Matching Requirements Found</h4>
                    <p className="text-muted fs-7 fs-md-6">
                      {requirements.filter(r => r.status !== 'deleted').length === 0 
                        ? "You haven't posted any job requirements yet."
                        : "No requirements match your current filters."}
                    </p>
                  </Card.Body>
                </Card>
              ) : (
                <Card>
                  <Card.Body className="p-3 p-md-4">
                    <div className="table-responsive">
                      <Table responsive hover className="table-sm">
                      <thead>
                        <tr>
                            <th className="fs-7 fs-md-6">Job Title</th>
                            <th className="fs-7 fs-md-6">Type</th>
                            <th className="fs-7 fs-md-6 d-none d-md-table-cell">Skills</th>
                            <th className="fs-7 fs-md-6 d-none d-lg-table-cell">Location</th>
                            <th className="fs-7 fs-md-6 d-none d-lg-table-cell">Experience</th>
                            <th className="fs-7 fs-md-6 d-none d-lg-table-cell">Salary</th>
                            <th className="fs-7 fs-md-6">Status</th>
                            <th className="fs-7 fs-md-6 d-none d-md-table-cell">Posted</th>
                            <th className="fs-7 fs-md-6 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequirements.map((requirement) => (
                          <tr key={requirement._id}>
                            <td>
                                <div className="min-w-0">
                                  <strong className="fs-7 fs-md-6 text-truncate d-block">{requirement.jobTitle}</strong>
                                  {/* Mobile skills display */}
                                  <div className="d-md-none mt-1">
                                    <div className="mb-1">
                                      {requirement.skills.slice(0, 2).map((skill, index) => (
                                        <Badge key={index} bg="light" text="dark" className="me-1 mb-1 fs-8">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {requirement.skills.length > 2 && (
                                        <Badge bg="light" text="dark" className="fs-8">+{requirement.skills.length - 2}</Badge>
                                      )}
                                    </div>
                                    <div className="small text-muted fs-8">
                                      {requirement.location} • {requirement.experienceMin}-{requirement.experienceMax} years
                                      {requirement.salaryBudget && ` • ${requirement.salaryBudget}`}
                                    </div>
                                  </div>
                                </div>
                            </td>
                            <td>
                              {getJobTypeBadge(requirement.jobType)}
                            </td>
                              <td className="d-none d-md-table-cell">
                              <div className="d-flex flex-wrap gap-1">
                                {requirement.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} bg="light" text="dark" className="small fs-8">
                                    {skill}
                                  </Badge>
                                ))}
                                {requirement.skills.length > 3 && (
                                    <Badge bg="light" text="dark" className="small fs-8">
                                    +{requirement.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </td>
                              <td className="d-none d-lg-table-cell">{requirement.location}</td>
                              <td className="d-none d-lg-table-cell">
                              {requirement.experienceMin} - {requirement.experienceMax} years
                            </td>
                              <td className="d-none d-lg-table-cell">
                              {requirement.salaryBudget || 'Not specified'}
                            </td>
                            <td>{getStatusBadge(requirement.status)}</td>
                              <td className="d-none d-md-table-cell fs-7 fs-md-6">{formatDate(requirement.createdAt)}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-1 gap-md-2">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleViewCandidates(requirement)}
                                    className="fs-7 fs-md-6"
                                >
                                    <FaUsers className="me-1 d-none d-sm-inline" />
                                    <span className="d-none d-sm-inline">View Candidates</span>
                                    <span className="d-inline d-sm-none">View</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDeleteRequirement(requirement._id)}
                                    className="fs-7 fs-md-6"
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
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Candidates Modal */}
      <Modal 
        show={showCandidatesModal} 
        onHide={() => setShowCandidatesModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">
            Matching Candidates for: {selectedRequirement?.jobTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {candidatesLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : candidates.length === 0 ? (
            <Alert variant="info" className="fs-7 fs-md-6">
              No candidates have been sent by admin for this requirement yet.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table responsive className="table-sm">
              <thead>
                <tr>
                    <th className="fs-7 fs-md-6">Name</th>
                    <th className="fs-7 fs-md-6 d-none d-md-table-cell">Experience</th>
                    <th className="fs-7 fs-md-6 d-none d-lg-table-cell">Location</th>
                    <th className="fs-7 fs-md-6 d-none d-lg-table-cell">Skills Match</th>
                    <th className="fs-7 fs-md-6 d-none d-md-table-cell">Overall Match</th>
                    <th className="fs-7 fs-md-6 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={candidate.candidateId || candidate._id || index}>
                    <td>
                        <div className="min-w-0">
                          <strong className="fs-7 fs-md-6">{candidate.username}</strong>
                          <div className="text-muted small fs-8">{candidate.email}</div>
                      {candidate.experienceMatch && (
                            <Badge bg="success" className="ms-2 small fs-8">✓ Experience Match</Badge>
                          )}
                          {/* Mobile experience and location */}
                          <div className="d-md-none mt-1">
                            <div className="small text-muted fs-8">
                              {candidate.experience} years exp • {candidate.location}
                            </div>
                            <div className="mt-1">
                              <Badge bg={candidate.skillMatchPercentage >= 70 ? "success" : candidate.skillMatchPercentage >= 50 ? "warning" : "info"} className="small fs-8">
                                {candidate.skillMatchPercentage}% skills
                              </Badge>
                              <Badge bg={candidate.matchPercentage >= 70 ? "success" : candidate.matchPercentage >= 50 ? "warning" : "info"} className="small fs-8 ms-1">
                                {candidate.matchPercentage}% overall
                              </Badge>
                            </div>
                          </div>
                        </div>
                    </td>
                      <td className="d-none d-md-table-cell fs-7 fs-md-6">{candidate.experience} years</td>
                      <td className="d-none d-lg-table-cell fs-7 fs-md-6">{candidate.location}</td>
                      <td className="d-none d-lg-table-cell">
                        <Badge bg={candidate.skillMatchPercentage >= 70 ? "success" : candidate.skillMatchPercentage >= 50 ? "warning" : "info"} className="small fs-8">
                        {candidate.skillMatchPercentage}% skills
                      </Badge>
                      {candidate.matchedSkills.length > 0 && (
                          <div className="small text-muted mt-1 fs-8">
                          Matched: {candidate.matchedSkills.join(', ')}
                        </div>
                      )}
                    </td>
                      <td className="d-none d-md-table-cell">
                        <Badge bg={candidate.matchPercentage >= 70 ? "success" : candidate.matchPercentage >= 50 ? "warning" : "info"} className="small fs-8">
                        {candidate.matchPercentage}% overall
                      </Badge>
                    </td>
                      <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleViewResume(candidate.candidateId || candidate._id)}
                          className="fs-7 fs-md-6"
                      >
                          <span className="d-none d-sm-inline">View Resume</span>
                          <span className="d-inline d-sm-none">Resume</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowCandidatesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyRequirements;