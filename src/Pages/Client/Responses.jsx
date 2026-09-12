import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Download, Envelope, PersonCheck, PersonX, ThreeDotsVertical, Telephone, Search, StarFill } from 'react-bootstrap-icons';
import { useParams, useLocation } from 'react-router-dom';
import API from '../../api';
import { Navbar, Container } from "react-bootstrap";
import { FaHome, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../../api';

const Responses = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State declarations
  const [showResume, setShowResume] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  
  // Define isFromSidebar at the top level
  const isFromSidebar = location.state?.fromSidebar === true || 
                       window.location.pathname.includes('naukri-client-portal');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        let data;
        if (jobId) {
          const res = await API.get(`/api/jobs/${jobId}/applications`);
          data = res.data;
          if (data.success) {
            const applicationsWithPremium = data.applications.map(app => ({
              ...app,
              isPremium: app.applicantId?.isPremium || false
            }));
            setCandidates(applicationsWithPremium);
            if (data.applications.length > 0 && data.applications[0].jobId?.jobTitle) {
              setJobTitle(data.applications[0].jobId.jobTitle);
            }
          }
        } else {
          const res = await API.get('/api/applications/company');
          data = res.data;
          if (data.success) {
            const applicationsWithPremium = data.applications.map(app => ({
              ...app,
              isPremium: app.applicantId?.isPremium || false
            }));
            setCandidates(applicationsWithPremium);
          } else {
            console.error('Failed to fetch applications:', data);
          }
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [jobId]);

  const handleViewResume = (filename) => {
    if (!filename) {
      setError('No resume available for this candidate');
      return;
    }
    const resumeUrl = `${API_BASE_URL}/api/jobs/resumes/${filename}`;
    window.open(resumeUrl, '_blank');
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setActionLoading(applicationId);
      const { data } = await API.patch(`/api/applications/${applicationId}/status`, {
        status: newStatus
      });
      setCandidates(prev =>
        prev.map(app =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Update error:', err);
      setError(`Error updating status: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCandidates = candidates
    .filter(app => {
      if (showPremiumOnly && !app.isPremium) return false;
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        (app.userName && app.userName.toLowerCase().includes(searchLower)) ||
        (app.email && app.email.toLowerCase().includes(searchLower)) ||
        (app.jobId?.jobTitle && app.jobId.jobTitle.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      // Premium candidates first, then by application date
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-4">
      {/* Only show navbar if not accessed from sidebar */}
      {!isFromSidebar && (
        <Navbar expand="lg" className="shadow-sm bg-white sticky-top">
          <Container>
            <Navbar.Brand 
              className="d-flex align-items-center"
              onClick={() => navigate('/NaukriClientPortal')}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src="/logo.jpeg" 
                alt="JobilioHR Logo" 
                className="img-fluid me-2" 
                style={{ height: '35px' }} 
              />
            </Navbar.Brand>
            <Button 
              variant="primary" 
              className="rounded-pill px-3 px-md-4"
              onClick={() => navigate('/naukri-client-portal')}
            >
              <FaHome className="me-1 d-none d-sm-inline" />
              <span>Dashboard</span>
            </Button>
          </Container>
        </Navbar>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible className={isFromSidebar ? "mt-0" : "mt-3"}>
          {error}
        </Alert>
      )}

      <div className={`d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 ${isFromSidebar ? "mt-0" : "mt-3 mt-md-4"}`}>
        <h2 className="mb-2 mb-md-0 text-primary fs-5 fs-md-4">
          {jobId ? `Candidates for: ${jobTitle}` : 'Candidate Applications'}
        </h2>
        <div className="d-flex align-items-center w-100 w-md-auto">
          {!jobId && (
            <div className="position-relative me-3 w-100">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <Form.Control
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ps-5"
                style={{ minWidth: '250px', maxWidth: '100%' }}
              />
            </div>
          )}
          <Form.Check
            type="switch"
            id="premium-only"
            label="Premium Only"
            checked={showPremiumOnly}
            onChange={(e) => setShowPremiumOnly(e.target.checked)}
            className="ms-3 small"
          />
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-3">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle table-sm">
              <thead className="bg-light">
                <tr>
                  <th className="py-3 px-2 px-md-4 text-uppercase fw-semibold small">Candidate</th>
                  <th className="py-3 px-2 px-md-4 text-uppercase fw-semibold small d-none d-md-table-cell">Contact</th>
                  <th className="py-3 px-2 px-md-4 text-uppercase fw-semibold small d-none d-lg-table-cell">Applied On</th>
                  <th className="py-3 px-2 px-md-4 text-uppercase fw-semibold small">Status</th>
                  <th className="py-3 px-2 px-md-4 text-uppercase fw-semibold small text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map(app => (
                    <tr key={app._id} className="border-top">
                      <td className="px-2 px-md-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className={`${app.isPremium ? 'bg-warning' : 'bg-primary'} text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 position-relative`} 
                               style={{ width: '35px', height: '35px' }}>
                            {app.userName?.charAt(0).toUpperCase()}
                            {app.isPremium && (
                              <StarFill className="position-absolute bottom-0 end-0 translate-x-1/4 translate-y-1/4 text-warning" size={10} />
                            )}
                          </div>
                          <div className="ms-2 ms-md-3 min-w-0">
                            <div className="d-flex align-items-center">
                              <h6 className="mb-0 fw-semibold fs-6 fs-md-5 text-truncate">{app.userName}</h6>
                              {app.isPremium && (
                                <Badge pill bg="warning" text="dark" className="ms-2">
                                  <StarFill className="me-1" size={10} /> Premium
                                </Badge>
                              )}
                            </div>
                            {app.jobId?.jobTitle && (
                              <small className="text-muted d-none d-md-block">{app.jobId.jobTitle}</small>
                            )}
                            <div className="d-md-none">
                              <small className="text-muted d-block text-truncate">
                                {app.applicantId?.email || app.email}
                              </small>
                              {app.applicantId?.mobile && (
                                <small className="text-muted d-block text-truncate">
                                  {app.applicantId.mobile}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 px-md-4 py-3 d-none d-md-table-cell">
                        <div>
                          <a href={`mailto:${app.applicantId?.email || app.email}`} 
                             className="text-decoration-none d-block">
                            {app.applicantId?.email || app.email}
                          </a>
                          {app.applicantId?.mobile && (
                            <small className="text-muted d-block">{app.applicantId.mobile}</small>
                          )}
                        </div>
                      </td>
                      <td className="px-2 px-md-4 py-3 d-none d-lg-table-cell">
                        {new Date(app.appliedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-2 px-md-4 py-3">
                        <Badge pill bg={
                          app.status === 'pending' ? 'info' :
                          app.status === 'reviewed' ? 'primary' :
                          app.status === 'shortlisted' ? 'success' :
                          app.status === 'rejected' ? 'danger' :
                          app.status === 'hired' ? 'dark' : 'warning'
                        } className="text-capitalize fs-7 fs-md-6">
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-2 px-md-4 py-3 text-end">
                        <div className="d-flex justify-content-end gap-1 gap-md-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewResume(app.resume?.filename)}
                            disabled={!app.resume?.filename}
                            className="d-flex align-items-center"
                          >
                            <Download size={14} className="me-1 d-none d-md-inline" />
                            <span className="d-none d-md-inline">Resume</span>
                            <span className="d-inline d-md-none">CV</span>
                          </Button>
                          
                          <div className="dropdown dropup position-static">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              aria-label="Actions"
                            >
                              <ThreeDotsVertical size={14} />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" data-bs-display="static" style={{ zIndex: 2000, minWidth: '220px' }}>
                              <li><h6 className="dropdown-header">Change Status</h6></li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleStatusChange(app._id, 'shortlisted')}
                                  disabled={actionLoading === app._id}
                                >
                                  <PersonCheck className="me-2 text-success" />
                                  Shortlist
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleStatusChange(app._id, 'rejected')}
                                  disabled={actionLoading === app._id}
                                >
                                  <PersonX className="me-2 text-danger" />
                                  Reject
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleStatusChange(app._id, 'hired')}
                                  disabled={actionLoading === app._id}
                                >
                                  <PersonCheck className="me-2 text-primary" />
                                  Hire
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <a className="dropdown-item" href={`mailto:${app.applicantId?.email || app.email}`}>
                                  <Envelope className="me-2" />
                                  Send Email
                                </a>
                              </li>
                              {app.applicantId?.mobile && (
                                <li>
                                  <a className="dropdown-item" href={`tel:${app.applicantId.mobile}`}>
                                    <Telephone className="me-2" />
                                    Call Candidate
                                  </a>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="py-4">
                        <img 
                          src="/images/empty-state.svg" 
                          alt="No candidates found" 
                          style={{ width: '150px', maxWidth: '100%', opacity: 0.7 }}
                          className="img-fluid"
                        />
                        <h5 className="mt-3 text-muted fs-5 fs-md-4">No candidates found</h5>
                        <p className="text-muted fs-7 fs-md-6">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Resume Modal */}
      <Modal show={showResume} onHide={() => setShowResume(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5">Candidate Resume</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCandidate && selectedCandidate.resume && (
            <div>
              <Row className="mb-4">
                <Col xs={12} md={6}>
                  <div className="d-flex align-items-center">
                    <div className={`${selectedCandidate.isPremium ? 'bg-warning' : 'bg-primary'} text-white rounded-circle d-flex align-items-center justify-content-center me-3 position-relative`} 
                         style={{ width: '50px', height: '50px' }}>
                      {selectedCandidate.userName?.charAt(0).toUpperCase()}
                      {selectedCandidate.isPremium && (
                        <StarFill className="position-absolute bottom-0 end-0 translate-x-1/4 translate-y-1/4 text-warning" size={12} />
                      )}
                    </div>
                    <div>
                      <h5 className="fs-5 fs-md-4">{selectedCandidate.userName}</h5>
                      <p className="text-muted mb-0 fs-7 fs-md-6">{selectedCandidate.email}</p>
                      {selectedCandidate.isPremium && (
                        <Badge pill bg="warning" text="dark" className="mt-1">
                          <StarFill className="me-1" size={10} /> Premium Candidate
                        </Badge>
                      )}
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={6} className="d-flex align-items-center justify-content-start justify-content-md-end mt-3 mt-md-0">
                  <a 
                    href={`${API.defaults.baseURL}/${selectedCandidate.resume.path}`} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" size="sm" className="w-100 w-md-auto">
                      <Download className="me-1" /> Download Resume
                    </Button>
                  </a>
                </Col>
              </Row>
              <div className="border rounded p-3 bg-light">
                <h6 className="fs-6 fs-md-5">Resume Preview</h6>
                <iframe 
                  src={`${API.defaults.baseURL}/${selectedCandidate.resume.path}`} 
                  style={{ width: '100%', height: '400px', border: 'none' }}
                  title="Resume Preview"
                  className="d-none d-md-block"
                />
                <div className="d-block d-md-none text-center py-4">
                  <p className="text-muted">Resume preview not available on mobile</p>
                  <a 
                    href={`${API.defaults.baseURL}/${selectedCandidate.resume.path}`} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <Download className="me-1" /> Download to View
                  </a>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Responses;