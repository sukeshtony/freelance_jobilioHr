import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Tab, Table, Dropdown,
  ListGroup, Badge, Button, Form, Modal,
  Row, Col, Alert, Spinner, Navbar,
  Container, Accordion, Offcanvas
} from 'react-bootstrap';
import {
  Envelope, Telephone, Download,
  PersonCircle, FileEarmarkText,
  Search, Plus, Send, CreditCard, People,
  Filter, X
} from 'react-bootstrap-icons';
import { FaSearch, FaEye, FaEyeSlash, FaTrash, FaEdit, FaFilter, FaSync, FaHome } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

import API from '../../api';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [showCreditRequestModal, setShowCreditRequestModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [credits, setCredits] = useState(5);
  const [confirmAction, setConfirmAction] = useState({ callback: null, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [viewedResumes, setViewedResumes] = useState(new Set());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    skills: [],
    location: '',
    experienceMin: '',
    experienceMax: '',
    salaryMin: '',
    salaryMax: '',
    jobType: [],
    searchQuery: ''
  });

  const [creditRequest, setCreditRequest] = useState({
    phone: '',
    reason: '',
    creditsRequested: 10
  });

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote'];
  const popularSkills = ['React', 'Node.js', 'JavaScript', 'Python', 'Java', 'Angular', 'Vue', 'PHP', 'AWS', 'Docker'];

  const handleCreditRequestChange = (e) => {
    const { name, value } = e.target;
    setCreditRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        [name]: checked 
          ? [...prev[name], value]
          : prev[name].filter(item => item !== value)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillSelect = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const resetFilters = () => {
    setFilters({
      skills: [],
      location: '',
      experienceMin: '',
      experienceMax: '',
      salaryMin: '',
      salaryMax: '',
      jobType: [],
      searchQuery: ''
    });
  };

  const ConfirmationModal = ({ show, message, onConfirm, onCancel }) => (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const fetchCandidates = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await API.get('/api/candidates');
      setCandidates(res.data);
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to fetch candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await API.get('/api/requirements');
      setRequirements(res.data);
    } catch (err) {
      console.error('Error fetching requirements:', err);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/api/user/credits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredits(res.data.credits);
      setViewedResumes(new Set(res.data.viewedResumes || []));
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchRequirements();
    fetchUserCredits();
  }, []);

  useEffect(() => {
    if (searchParams.get('openCreditRequest') === 'true') {
      setShowCreditRequestModal(true);
    }
  }, [searchParams]);

  const handleResumeView = async (candidate) => {
    if (viewedResumes.has(candidate.id)) {
      navigate(`/CandidateResume/${candidate.userId}`);
      return;
    }

    // All candidates returned from backend are non-applied, so always check credits
    if (credits <= 0) {
      setShowCreditRequestModal(true);
      return;
    }

    // Always deduct credit for viewing non-applied candidates
    setConfirmAction({
      callback: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await API.post('/api/user/deduct-credit', 
            { candidateId: candidate.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setCredits(response.data.remainingCredits);
          setViewedResumes(prev => new Set(prev).add(candidate.id));
          navigate(`/CandidateResume/${candidate.userId}`);
        } catch (error) {
          console.error('Error deducting credit:', error);
          if (error.response?.status === 400) {
            alert(error.response.data.error || 'Failed to deduct credit. Please try again.');
          } else {
            alert('Failed to deduct credit. Please try again.');
          }
        }
      },
      message: 'Viewing this resume will use 1 credit. Proceed?'
    });
    setShowConfirmModal(true);
  };

  const handleCreditRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      await API.post('/api/credits/request', {
        phone: creditRequest.phone,
        reason: creditRequest.reason,
        creditsRequested: creditRequest.creditsRequested
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreditRequestModal(false);
      setCreditRequest({
        phone: '',
        reason: '',
        creditsRequested: 10
      });
      
      setNotification({
        show: true,
        message: 'Credit request submitted successfully! Our team will review it shortly.',
        type: 'success'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'info' });
      }, 5000);
    } catch (error) {
      console.error('Error submitting credit request:', error);
      setError('Failed to submit credit request. Please try again.');
    }
  };

  const applyFilters = () => {
    const filtered = candidates.filter(candidate => {
      // Filter by skills
      if (filters.skills.length > 0) {
        const candidateSkills = candidate.skills.map(s => s.toLowerCase());
        const hasSkills = filters.skills.every(skill => 
          candidateSkills.some(cs => cs.includes(skill.toLowerCase()))
        );
        if (!hasSkills) return false;
      }

      // Filter by location
      if (filters.location && !candidate.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Filter by experience
      const candidateExp = candidate.experience || 0;
      if (filters.experienceMin && candidateExp < parseInt(filters.experienceMin)) return false;
      if (filters.experienceMax && candidateExp > parseInt(filters.experienceMax)) return false;

      // Filter by salary
      if (candidate.expectedSalary) {
        const candidateSalary = parseInt(candidate.expectedSalary);
        if (filters.salaryMin && candidateSalary < parseInt(filters.salaryMin)) return false;
        if (filters.salaryMax && candidateSalary > parseInt(filters.salaryMax)) return false;
      }

      // Filter by job type
      if (filters.jobType.length > 0 && candidate.jobType) {
        if (!filters.jobType.some(type => candidate.jobType.includes(type))) return false;
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!candidate.name.toLowerCase().includes(query) && 
            !candidate.skills.join(' ').toLowerCase().includes(query) &&
            !candidate.location.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  };

  const filteredCandidates = applyFilters();
  // Backend now only returns non-applied candidates, so no need to filter by type
  const nonAppliedCandidates = filteredCandidates;

  return (
    <>
      <Navbar expand="lg" className="shadow-sm bg-white fixed-top">
        <Container fluid>
          <Navbar.Brand 
            className="d-flex align-items-center"
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

      <div className="container-fluid mt-5 pt-4 px-2 px-md-4">
        <div className="row g-0 g-md-3">
          {/* Filters Sidebar - Hidden on mobile, shown on desktop */}
          <div className="col-lg-3 d-none d-lg-block">
            <Card className="border-0 shadow-sm sticky-top" style={{ top: '80px' }}>
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fs-6">Filters</h5>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-decoration-none fs-7"
                  >
                    Clear all
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-3">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fs-7">Search Candidates</Form.Label>
                    <div className="input-group input-group-sm">
                      <Form.Control
                        type="text"
                        placeholder="Name, skills, location..."
                        name="searchQuery"
                        value={filters.searchQuery}
                        onChange={handleFilterChange}
                        size="sm"
                        className="fs-7"
                      />
                      <Button variant="outline-secondary" size="sm">
                        <FaSearch size={14} />
                      </Button>
                    </div>
                  </Form.Group>

                  <Accordion>
                    <Accordion.Item eventKey="0" className="mb-2 border-0">
                      <Accordion.Header className="p-0">
                        <span className="fw-semibold fs-7">Skills</span>
                      </Accordion.Header>
                      <Accordion.Body className="p-0 pt-2">
                        <div className="mb-2">
                          {popularSkills.map(skill => (
                            <Badge
                              key={skill}
                              pill
                              bg={filters.skills.includes(skill) ? "primary" : "secondary"}
                              className="me-1 mb-1 cursor-pointer fs-8"
                              onClick={() => handleSkillSelect(skill)}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Form.Control
                          type="text"
                          placeholder="Add custom skills"
                          name="customSkills"
                          size="sm"
                          className="fs-7"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                              handleSkillSelect(e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1" className="mb-2 border-0">
                      <Accordion.Header className="p-0">
                        <span className="fw-semibold fs-7">Location</span>
                      </Accordion.Header>
                      <Accordion.Body className="p-0 pt-2">
                        <Form.Control
                          type="text"
                          placeholder="City, state or remote"
                          name="location"
                          value={filters.location}
                          onChange={handleFilterChange}
                          size="sm"
                          className="fs-7"
                        />
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2" className="mb-2 border-0">
                      <Accordion.Header className="p-0">
                        <span className="fw-semibold fs-7">Experience</span>
                      </Accordion.Header>
                      <Accordion.Body className="p-0 pt-2">
                        <div className="d-flex align-items-center mb-2">
                          <Form.Control
                            type="number"
                            placeholder="Min"
                            name="experienceMin"
                            value={filters.experienceMin}
                            onChange={handleFilterChange}
                            className="me-2"
                            size="sm"
                          />
                          <span className="me-2 fs-7">to</span>
                          <Form.Control
                            type="number"
                            placeholder="Max"
                            name="experienceMax"
                            value={filters.experienceMax}
                            onChange={handleFilterChange}
                            size="sm"
                            className="fs-7"
                          />
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="3" className="mb-2 border-0">
                      <Accordion.Header className="p-0">
                        <span className="fw-semibold fs-7">Salary (₹/year)</span>
                      </Accordion.Header>
                      <Accordion.Body className="p-0 pt-2">
                        <div className="d-flex align-items-center mb-2">
                          <Form.Control
                            type="number"
                            placeholder="Min"
                            name="salaryMin"
                            value={filters.salaryMin}
                            onChange={handleFilterChange}
                            className="me-2"
                            size="sm"
                          />
                          <span className="me-2 fs-7">to</span>
                          <Form.Control
                            type="number"
                            placeholder="Max"
                            name="salaryMax"
                            value={filters.salaryMax}
                            onChange={handleFilterChange}
                            size="sm"
                            className="fs-7"
                          />
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="4" className="mb-2 border-0">
                      <Accordion.Header className="p-0">
                        <span className="fw-semibold fs-7">Job Type</span>
                      </Accordion.Header>
                      <Accordion.Body className="p-0 pt-2">
                        <div className="d-flex flex-column">
                          {jobTypes.map(type => (
                            <Form.Check
                              key={type}
                              type="checkbox"
                              id={`jobType-${type}`}
                              label={type}
                              name="jobType"
                              value={type}
                              checked={filters.jobType.includes(type)}
                              onChange={handleFilterChange}
                              className="mb-1 fs-7"
                            />
                          ))}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Form>
              </Card.Body>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-12 col-lg-9">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-3 p-md-4">
                {notification.show && (
                  <Alert 
                    variant={notification.type} 
                    dismissible 
                    onClose={() => setNotification({ show: false, message: '', type: 'info' })}
                    className="mb-3 py-2 py-md-3"
                  >
                    <span className="fs-7 fs-md-6">{notification.message}</span>
                  </Alert>
                )}
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4">
                  <div className="mb-2 mb-md-0">
                    <h2 className="mb-0 fs-5 fs-md-4">Candidate Management</h2>
                                         <small className="text-muted fs-7 fs-md-6">
                       Showing {nonAppliedCandidates.length} available candidates
                       {lastRefreshTime && (
                         <span className="ms-2 d-none d-md-inline">
                           Last updated: {lastRefreshTime.toLocaleTimeString()}
                         </span>
                       )}
                     </small>
                  </div>
                  
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="d-lg-none"
                      onClick={() => setShowFilters(true)}
                    >
                      <Filter className="me-1" /> Filters
                    </Button>
                    
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-credits">
                        <CreditCard className="me-1" /> 
                        <span className="d-none d-sm-inline">Credits:</span>
                        <span className="d-inline d-sm-none">Cred:</span>
                        {credits}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setShowCreditRequestModal(true)}>
                          Request More Credits
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => navigate('/credit-history')}>
                          View Credit History
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                <div className="table-responsive">
                  <Table hover className="mb-0 table-sm">
                    <thead className="table-light">
                      <tr>
                        <th className="fs-7 fs-md-6">Candidate</th>
                        <th className="fs-7 fs-md-6 d-none d-md-table-cell">Skills/Experience</th>
                        <th className="text-end fs-7 fs-md-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4">
                            <Spinner animation="border" className="me-2" />
                            <span className="fs-7 fs-md-6">Loading candidates...</span>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4">
                            <Alert variant="danger" className="fs-7 fs-md-6">{error}</Alert>
                            <Button variant="outline-primary" size="sm" onClick={fetchCandidates} className="mt-2">
                              Try Again
                            </Button>
                          </td>
                        </tr>
                      ) : nonAppliedCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4">
                            <span className="fs-7 fs-md-6">
                              No candidates found matching your filters.
                              <Button variant="link" size="sm" onClick={resetFilters}>Clear filters</Button>
                            </span>
                          </td>
                        </tr>
                      ) : (
                        nonAppliedCandidates.map((candidate) => (
                          <tr key={candidate.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2 flex-shrink-0" 
                                     style={{ width: '32px', height: '32px' }}>
                                  <PersonCircle size={16} className="text-secondary" />
                                </div>
                                <div className="min-w-0">
                                  <div className="fw-semibold fs-7 fs-md-6 text-truncate">
                                    {candidate.name}
                                  </div>
                                  <div className="small text-muted fs-8 fs-md-7">
                                    {candidate.location}
                                  </div>
                                  {/* Mobile skills display */}
                                  <div className="d-md-none mt-1">
                                    <div className="mb-1">
                                      {candidate.skills.slice(0, 3).map(skill => (
                                        <Badge key={skill} bg="info" className="me-1 mb-1 fs-8">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {candidate.skills.length > 3 && (
                                        <Badge bg="secondary" className="fs-8">+{candidate.skills.length - 3}</Badge>
                                      )}
                                    </div>
                                    <div className="small text-muted fs-8">
                                      {candidate.experience} years exp
                                      {candidate.expectedSalary && ` • ₹${candidate.expectedSalary}/year`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                              <div>
                                <div className="mb-1">
                                  {candidate.skills.slice(0, 4).map(skill => (
                                    <Badge key={skill} bg="info" className="me-1 mb-1 fs-8">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="small text-muted fs-8">
                                  {candidate.experience} years exp • 
                                  {candidate.jobType && ` ${candidate.jobType} •`}
                                  {candidate.expectedSalary && ` ₹${candidate.expectedSalary}/year`}
                                </div>
                              </div>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-1 gap-md-2">
                                <Button
                                  variant={viewedResumes.has(candidate.id) ? "outline-success" : "outline-primary"}
                                  size="sm"
                                  onClick={() => handleResumeView(candidate)}
                                  className="fs-7 fs-md-6"
                                > 
                                  {viewedResumes.has(candidate.id) ? (
                                    <FaEye className="me-1" />
                                  ) : (
                                    <FaEyeSlash className="me-1" />
                                  )}
                                  <span className="d-none d-sm-inline">Resume</span>
                                  <span className="d-inline d-sm-none">CV</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Filters Offcanvas */}
      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fs-6">Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Card className="border-0 shadow-none">
            <Card.Body className="p-3">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7">Search Candidates</Form.Label>
                  <div className="input-group input-group-sm">
                    <Form.Control
                      type="text"
                      placeholder="Name, skills, location..."
                      name="searchQuery"
                      value={filters.searchQuery}
                      onChange={handleFilterChange}
                      size="sm"
                      className="fs-7"
                    />
                    <Button variant="outline-secondary" size="sm">
                      <FaSearch size={14} />
                    </Button>
                  </div>
                </Form.Group>

                <Accordion>
                  <Accordion.Item eventKey="0" className="mb-2 border-0">
                    <Accordion.Header className="p-0">
                      <span className="fw-semibold fs-7">Skills</span>
                    </Accordion.Header>
                    <Accordion.Body className="p-0 pt-2">
                      <div className="mb-2">
                        {popularSkills.map(skill => (
                          <Badge
                            key={skill}
                            pill
                            bg={filters.skills.includes(skill) ? "primary" : "secondary"}
                            className="me-1 mb-1 cursor-pointer fs-8"
                            onClick={() => handleSkillSelect(skill)}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Add custom skills"
                        name="customSkills"
                        size="sm"
                        className="fs-7"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value) {
                            handleSkillSelect(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="1" className="mb-2 border-0">
                    <Accordion.Header className="p-0">
                      <span className="fw-semibold fs-7">Location</span>
                    </Accordion.Header>
                    <Accordion.Body className="p-0 pt-2">
                      <Form.Control
                        type="text"
                        placeholder="City, state or remote"
                        name="location"
                        value={filters.location}
                        onChange={handleFilterChange}
                        size="sm"
                        className="fs-7"
                      />
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="2" className="mb-2 border-0">
                    <Accordion.Header className="p-0">
                      <span className="fw-semibold fs-7">Experience</span>
                    </Accordion.Header>
                    <Accordion.Body className="p-0 pt-2">
                      <div className="d-flex align-items-center mb-2">
                        <Form.Control
                          type="number"
                          placeholder="Min"
                          name="experienceMin"
                          value={filters.experienceMin}
                          onChange={handleFilterChange}
                          className="me-2"
                          size="sm"
                        />
                        <span className="me-2 fs-7">to</span>
                        <Form.Control
                          type="number"
                          placeholder="Max"
                          name="experienceMax"
                          value={filters.experienceMax}
                          onChange={handleFilterChange}
                          size="sm"
                          className="fs-7"
                        />
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="3" className="mb-2 border-0">
                    <Accordion.Header className="p-0">
                      <span className="fw-semibold fs-7">Salary (₹/year)</span>
                    </Accordion.Header>
                    <Accordion.Body className="p-0 pt-2">
                      <div className="d-flex align-items-center mb-2">
                        <Form.Control
                          type="number"
                          placeholder="Min"
                          name="salaryMin"
                          value={filters.salaryMin}
                          onChange={handleFilterChange}
                          className="me-2"
                          size="sm"
                        />
                        <span className="me-2 fs-7">to</span>
                        <Form.Control
                          type="number"
                          placeholder="Max"
                          name="salaryMax"
                          value={filters.salaryMax}
                          onChange={handleFilterChange}
                          size="sm"
                          className="fs-7"
                        />
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="4" className="mb-2 border-0">
                    <Accordion.Header className="p-0">
                      <span className="fw-semibold fs-7">Job Type</span>
                    </Accordion.Header>
                    <Accordion.Body className="p-0 pt-2">
                      <div className="d-flex flex-column">
                        {jobTypes.map(type => (
                          <Form.Check
                            key={type}
                            type="checkbox"
                            id={`mobile-jobType-${type}`}
                            label={type}
                            name="jobType"
                            value={type}
                            checked={filters.jobType.includes(type)}
                            onChange={handleFilterChange}
                            className="mb-1 fs-7"
                          />
                        ))}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                <div className="d-flex gap-2 mt-3">
                  <Button variant="primary" size="sm" onClick={() => setShowFilters(false)} className="flex-grow-1">
                    Apply Filters
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Credit Request Modal */}
      <Modal show={showCreditRequestModal} onHide={() => setShowCreditRequestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">Request Additional Credits</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="fs-7 fs-md-6">
            You can request additional credits for free. Our team will review your request and approve it shortly.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Phone Number *</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={creditRequest.phone}
                onChange={handleCreditRequestChange}
                placeholder="Enter your phone number"
                required
                size="sm"
                className="fs-7 fs-md-6"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Credits Requested *</Form.Label>
              <Form.Select 
                name="creditsRequested" 
                value={creditRequest.creditsRequested} 
                onChange={handleCreditRequestChange}
                required
                size="sm"
                className="fs-7 fs-md-6"
              >
                <option value="10">10 Credits</option>
                <option value="25">25 Credits</option>
                <option value="50">50 Credits</option>
                <option value="100">100 Credits</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Reason for Request</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="reason"
                value={creditRequest.reason}
                onChange={handleCreditRequestChange}
                placeholder="Please describe why you need additional credits..."
                size="sm"
                className="fs-7 fs-md-6"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowCreditRequestModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreditRequest}>
            <Send className="me-1" /> Submit Request
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmationModal
        show={showConfirmModal}
        message={confirmAction.message}
        onConfirm={() => {
          confirmAction.callback?.();
          setShowConfirmModal(false);
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};

export default Candidates;