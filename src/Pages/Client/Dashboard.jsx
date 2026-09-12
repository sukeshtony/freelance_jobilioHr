import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Row, Col, Card, Badge, Button, Table,
  ListGroup, Spinner, Alert, Modal, Form, Offcanvas  
} from 'react-bootstrap';
import { 
  Briefcase, PersonLinesFill, Star, CheckCircle,
  Clock, Eye, Pencil, Trash, ThreeDots, Plus, CreditCard, ExclamationTriangle, List,
  GeoAlt, CashStack, Layers, Calendar, Building
} from 'react-bootstrap-icons';
import API from '../../api';
import JobRequirementsForm from './JobRequirementsForm';

const Dashboard = ({ credits }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [stats, setStats] = useState({
    activeJobsCount: 0,
    totalApplications: 0,
    shortlistedCount: 0,
    hiredCount: 0
  });
  const [period, setPeriod] = useState('30');
  const [showJobReqModal, setShowJobReqModal] = useState(false);
  const [showLegalWarning, setShowLegalWarning] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const legalNoticeKey = `clientLegalNoticeShown_${token || 'no_token'}`;
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Static legal warning content
  const legalWarningContent = {
    title: "Important Legal Notice",
    message: "Any irrelevant, inappropriate, or fraudulent content posted on this platform will result in immediate account suspension and may lead to legal action against the user. By using this platform, you agree to comply with all applicable laws and regulations.",
    actions: [
      "Post only legitimate job requirements",
      "Do not share false or misleading information",
      "Respect privacy and data protection laws"
    ]
  };

  useEffect(() => {
    fetchJobs();
    fetchActivities();
  }, [period]);

  // Show legal notice only once per login (per token, per session)
  useEffect(() => {
    try {
      const alreadyShown = sessionStorage.getItem(legalNoticeKey) === 'true';
      if (alreadyShown) {
        setShowLegalWarning(false);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalNoticeKey]);

  const fetchJobs = async (preserveSuccess = false) => {
    setLoading(true);
    setError('');
    if (!preserveSuccess) {
      setSuccessMessage('');
    }

    try {
      const response = await API.get(`/api/jobs?period=${period}`);
      const result = response.data;

      setJobs(result.jobs || []);
      setStats({
        activeJobsCount: result.activeJobsCount || 0,
        totalApplications: result.totalApplications || 0,
        shortlistedCount: result.shortlistedCount || 0,
        hiredCount: result.hiredCount || 0
      });

      if (!preserveSuccess && result.jobs?.length > 0) {
        setSuccessMessage(`Successfully loaded ${result.jobs.length} job(s)`);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (forceRefresh = false) => {
    if (forceRefresh) {
      setLoadingActivities(true);
    }
    try {
      const response = await API.get(`/api/jobs/activity?period=${period}&t=${Date.now()}`);
      const data = response.data;

      const baseActivities = data.success
        ? (data.activities || []).map((act) => ({
            ...act,
            id: act._id || `${act.type || 'base'}-${new Date(act.timeRaw || act.time || act.createdAt).getTime()}`,
            time: act.time || formatDate(act.timeRaw || act.createdAt),
            originalTime: act.timeRaw || act.time || act.createdAt
          }))
        : [];

      let sentCandidateActivities = [];
      try {
        const sentRes = await API.get('/api/requirements/sent-candidates');
        const sentList = Array.isArray(sentRes.data) ? sentRes.data : [];

        sentCandidateActivities = sentList
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
          .map((record) => ({
            id: record._id,
            text: record.creditIssue
              ? `Insufficient credits to receive candidates for ${record.requirementId?.jobTitle || 'a requirement'}.`
              : `Admin sent ${record.totalCandidates} matching candidate(s) for ${record.requirementId?.jobTitle || 'a requirement'}.`,
            time: formatDate(record.sentAt),
            originalTime: record.sentAt,
            link: record.creditIssue
              ? null
              : record.requirementId?._id
                ? `/my-requirements?openRequirement=${record.requirementId._id}`
                : '/sent-candidates',
            linkText: record.creditIssue ? null : 'Click here',
            showRequestCredits: !!record.creditIssue
          }));
      } catch {
        sentCandidateActivities = [];
      }

      let creditRequestActivities = [];
      try {
        const creditRes = await API.get('/api/credits/user-requests');
        const creditList = Array.isArray(creditRes.data) ? creditRes.data : [];

        creditRequestActivities = creditList
          .filter(request => request.adminNotes && request.adminNotes.trim() !== '')
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .map((request) => ({
            id: `credit-${request._id}`,
            text: `Credit request for ${request.creditsRequested} credits ${request.status === 'approved' ? 'approved' : request.status === 'rejected' ? 'rejected' : 'updated'}: ${request.adminNotes}`,
            time: formatDate(request.updatedAt),
            originalTime: request.updatedAt,
            link: null,
            linkText: null,
            showRequestCredits: false,
            type: 'credit-request',
            status: request.status,
            creditsRequested: request.creditsRequested
          }));
      } catch (error) {
        console.error('Error fetching credit requests:', error);
        creditRequestActivities = [];
      }

      let requirementsActivities = [];
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const requirementsRes = await API.get('/api/requirements/my', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const requirementsList = Array.isArray(requirementsRes.data) ? requirementsRes.data : [];
          
          requirementsActivities = requirementsList
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .map((requirement) => {
              let message = '';
              let timeToUse = requirement.createdAt;
              
              if (requirement.status === 'deleted') {
                message = `Requirements for ${requirement.jobTitle} deleted`;
                timeToUse = requirement.deletedAt || requirement.updatedAt;
              } else {
                message = `New job requirements posted for ${requirement.jobTitle}`;
                timeToUse = requirement.createdAt;
              }
              
              return {
                id: `requirement-${requirement._id}`,
                text: message,
                time: formatDate(timeToUse),
                originalTime: timeToUse,
                link: null,
                linkText: null,
                type: 'requirement',
                jobTitle: requirement.jobTitle,
                status: requirement.status
              };
            });
        }
      } catch (error) {
        console.error('Error fetching requirements:', error);
        requirementsActivities = [];
      }

      const allActivities = [...sentCandidateActivities, ...creditRequestActivities, ...requirementsActivities, ...baseActivities]
        .map(activity => ({
          ...activity,
          sortTime: new Date(activity.originalTime || activity.time || activity.createdAt || activity.sentAt || activity.updatedAt)
        }))
        .sort((a, b) => b.sortTime - a.sortTime)
        .map(({ sortTime, ...activity }) => activity);

      setActivities(allActivities);
    } catch {
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setEditFormData({
      position: job.position || job.jobTitle || '',
      type: job.jobType || '',
      band: job.band || '',
      qualification: job.qualification || '',
      essentialHiringSkills: Array.isArray(job.essentialHiringSkills) ? job.essentialHiringSkills.join(', ') : (job.essentialHiringSkills || ''),
      keySkills: Array.isArray(job.keySkills) ? job.keySkills.join(', ') : (job.keySkills || ''),
      responsibility: job.responsibility || '',
      shift: job.shift || '',
      role: job.role || '',
      industryType: job.industryType || '',
      employmentType: job.employmentType || '',
      roleCategory: job.roleCategory || '',
      education: job.education || '',
      aboutCompany: job.aboutCompany || '',
      jobTitle: job.jobTitle,
      jobType: job.jobType,
      location: job.location,
      department: job.department || '',
      salary: job.salary || '',
      experienceLevel: job.experienceLevel || 'Any',
      description: job.description,
      requirements: job.requirements,
      companyName: job.companyName,
      applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '',
      vacancies: job.vacancies ?? job.maxApplications ?? 1,
      isFeatured: job.isFeatured || false
    });
    setShowEditModal(true);
  };

  const handleDeleteJob = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await API.put(`/api/jobs/${selectedJob._id}`, editFormData);
      setSuccessMessage('Job updated successfully!');
      setShowEditModal(false);
      fetchJobs(true);
    } catch (error) {
      console.error('Error updating job:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await API.delete(`/api/jobs/${selectedJob._id}`);
      setSuccessMessage('Job deleted successfully!');
      setShowDeleteModal(false);
      fetchJobs(true);
    } catch (error) {
      console.error('Error deleting job:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Report option removed per request

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <div className="d-lg-none mb-3">
        <Button 
          variant="outline-secondary" 
          onClick={() => setShowMobileMenu(true)}
          className="d-flex align-items-center"
        >
          <List className="me-2" /> Menu
        </Button>
      </div>

      {/* Mobile Menu Offcanvas */}
      <div className="d-lg-none">
        <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Dashboard Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex flex-column gap-3 mb-4">
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowJobReqModal(true);
                  setShowMobileMenu(false);
                }}
              >
                <Plus className="me-2" /> New Job Requirement
              </Button>
              
              <div className="d-flex align-items-center gap-2">
                <Form.Select 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  size="sm"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">This Year</option>
                </Form.Select>
                
                <Button 
                  variant="outline-secondary" 
                  size="xs"
                  onClick={() => {
                    fetchJobs();
                    fetchActivities();
                  }}
                >
                  ↻
                </Button>
              </div>
            </div>
            
            <div className="bg-light p-3 rounded mb-3">
              <h6 className="mb-2">Credits Available</h6>
              <div className="d-flex align-items-center justify-content-between">
                <Badge bg="info" className="fs-6">
                  <CreditCard className="me-1" /> {credits}
                </Badge>
                <Button variant="outline-primary" size="sm">
                  Request More
                </Button>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </div>

      {/* Legal Warning Banner */}
      {showLegalWarning && (
        <Alert
          variant="danger"
          className="mb-4"
          onClose={() => {
            setShowLegalWarning(false);
            try { sessionStorage.setItem(legalNoticeKey, 'true'); } catch {}
          }}
          dismissible
        >
          <div className="d-flex align-items-center">
            <ExclamationTriangle className="me-2" size={24} />
            <div>
              <h5 className="mb-1">{legalWarningContent.title}</h5>
              <p className="mb-2">{legalWarningContent.message}</p>
              <ul className="mb-0 ps-3">
                {legalWarningContent.actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard Overview</h2>
        <div className="d-none d-lg-flex">
          <Button 
            variant="primary" 
            size="sm" 
            className="me-2"
            style={{ backgroundColor: '#e74c3c', borderColor: '#e74c3c' }}
            onClick={() => setShowJobReqModal(true)}
          >
            New Job Requirement
          </Button>
          <Form.Select 
            size="sm" 
            className="d-inline-block" 
            style={{ width: '150px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </Form.Select>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        {[
          { 
            title: 'Active Jobs', 
            value: stats.activeJobsCount, 
            subtitle: 'Currently posted', 
            icon: <Briefcase size={20} />,
            bg: 'primary'
          },
          { 
            title: 'Applications', 
            value: stats.totalApplications, 
            subtitle: 'Total received', 
            icon: <PersonLinesFill size={20} />,
            bg: 'success'
          },
          { 
            title: 'Shortlisted', 
            value: stats.shortlistedCount, 
            subtitle: 'In review', 
            icon: <Star size={20} />,
            bg: 'warning'
          },
          { 
            title: 'Hired', 
            value: stats.hiredCount, 
            subtitle: 'Successful placements', 
            icon: <CheckCircle size={20} />,
            bg: 'info'
          }
        ].map((stat, index) => (
          <Col xs={6} md={6} lg={3} key={index}>
            <Card className="stat-card border-0 shadow-sm h-100">
              <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2">{stat.title}</h6>
                    <h3 className="mb-0">{stat.value}</h3>
                    <small className="text-muted">{stat.subtitle}</small>
                  </div>
                  <div className={`icon-circle bg-${stat.bg}-light text-${stat.bg}`}>
                    {stat.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Jobs and Activity */}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center flex-nowrap mb-3">
                <h5 className="mb-0 me-2 flex-grow-1">Recent Job Postings</h5>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={fetchJobs}
                    disabled={loading}
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : '↻'}
                  </Button>
                  <Link to="/all-jobs" className="d-inline-flex text-decoration-none align-items-center" style={{ textDecoration: 'none' }}>
                    <Button variant="outline-primary" size="sm">All</Button>
                  </Link>
                </div>
              </div>

              {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
              {successMessage && (
                <Alert variant="success" className="mb-3" onClose={() => setSuccessMessage('')} dismissible>
                  {successMessage}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2 text-muted">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-4">
                  <Briefcase size={48} className="text-muted mb-3" />
                  <h6 className="text-muted">No jobs posted yet</h6>
                  <p className="text-muted">Start by posting your first job to see it here.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Job Title</th>
                        <th className="d-none d-md-table-cell">Location</th>
                        <th>Type</th>
                        <th className="d-none d-sm-table-cell">Posted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job._id}>
                          <td>
                            <div className="fw-semibold">{job.jobTitle}</div>
                            <small className="text-muted d-block d-md-none">{job.location}</small>
                            <small className="text-muted">{job.companyName}</small>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <span className="text-muted">{job.location}</span>
                          </td>
                          <td>
                            <Badge bg="primary" className="text-capitalize">
                              {job.jobType}
                            </Badge>
                          </td>
                          <td className="d-none d-sm-table-cell">
                            <small className="text-muted">
                              {formatDate(job.createdAt)}
                            </small>
                          </td>
                          <td className="position-relative">
                            <div className="dropdown dropup position-static">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                aria-label="Actions"
                              >
                                <ThreeDots />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end" data-bs-display="static" style={{ zIndex: 2000, minWidth: '180px' }}>
                                <li>
                                  <button className="dropdown-item" onClick={() => handleViewJob(job)}>
                                    <Eye className="me-2" /> View Details
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => handleEditJob(job)}>
                                    <Pencil className="me-2" /> Edit Job
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item text-danger" onClick={() => handleDeleteJob(job)}>
                                    <Trash className="me-2" /> Delete Job
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recent Activity</h5>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={fetchActivities}
                  disabled={loadingActivities}
                >
                  Refresh
                </Button>
              </div>
              {loadingActivities ? (
                <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
              ) : (
                <ListGroup variant="flush" className="activity-list">
                  {activities.length > 0 ? activities.map((activity, index) => (
                    <ListGroup.Item key={activity.id || index} className="border-0 px-0 py-3">
                      <div className="d-flex align-items-start">
                        <div className={`icon-circle-sm me-3 ${
                          activity.type === 'credit-request' 
                            ? activity.status === 'approved' 
                              ? 'bg-success-light' 
                              : activity.status === 'rejected' 
                                ? 'bg-danger-light' 
                                : 'bg-warning-light'
                            : activity.type === 'requirement'
                              ? activity.status === 'deleted'
                                ? 'bg-danger-light'
                                : 'bg-info-light'
                            : 'bg-light'
                        }`}>
                          {activity.type === 'credit-request' ? (
                            <CreditCard className={
                              activity.status === 'approved' 
                                ? 'text-success' 
                                : activity.status === 'rejected' 
                                  ? 'text-danger' 
                                  : 'text-warning'
                            } />
                          ) : activity.type === 'requirement' ? (
                            <Briefcase className={
                              activity.status === 'deleted' 
                                ? 'text-danger' 
                                : 'text-info'
                            } />
                          ) : (
                            <Briefcase className="text-primary" />
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-start justify-content-between">
                            <p className="mb-1 flex-grow-1">
                              {activity.text}
                              {activity.link && (
                                <Link to={activity.link} className="ms-2 text-primary">
                                  {activity.linkText || 'View details'}
                                </Link>
                              )}
                            </p>
                            {activity.type === 'credit-request' && (
                              <Badge 
                                bg={activity.status === 'approved' ? 'success' : activity.status === 'rejected' ? 'danger' : 'warning'}
                                className="ms-2"
                              >
                                {activity.status}
                              </Badge>
                            )}
                          </div>
                          <small className="text-muted d-flex align-items-center">
                            <Clock size={12} className="me-1" /> {activity.time}
                          </small>
                          {activity.showRequestCredits && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="mt-2"
                              onClick={() => {
                                window.location.href = '/request-credits';
                              }}
                            >
                              Request Credits
                            </Button>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  )) : (
                    <ListGroup.Item className="border-0 px-0 py-2 text-muted text-center">
                      No recent activity
                    </ListGroup.Item>
                  )}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* View Job Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Job Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && (
            <div>
              <h4 className="fw-bold mb-1">{selectedJob.jobTitle}</h4>
              {selectedJob.companyName && (
                <p className="text-muted mb-3">{selectedJob.companyName}</p>
              )}

              <Row className="mb-3 g-2">
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <GeoAlt className="me-2 text-primary" /> <strong className="me-1">Location:</strong> {selectedJob.location}
                  </span>
                </Col>
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <Briefcase className="me-2 text-primary" /> <strong className="me-1">Job Type:</strong> {selectedJob.jobType}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3 g-2">
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <Layers className="me-2 text-primary" /> <strong className="me-1">Department:</strong> {selectedJob.department || 'Not specified'}
                  </span>
                </Col>
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <Star className="me-2 text-warning" /> <strong className="me-1">Experience:</strong> {selectedJob.experienceLevel || 'Any'}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3 g-2">
                {selectedJob.employmentType && (
                  <Col md={6}>
                    <span className="d-flex align-items-center small">
                      <Briefcase className="me-2 text-secondary" /> <strong className="me-1">Employment Type:</strong> {selectedJob.employmentType}
                    </span>
                  </Col>
                )}
                {selectedJob.industryType && (
                  <Col md={6}>
                    <span className="d-flex align-items-center small">
                      <Building className="me-2 text-secondary" /> <strong className="me-1">Industry:</strong> {selectedJob.industryType}
                    </span>
                  </Col>
                )}
              </Row>

              <Row className="mb-3 g-2">
                {selectedJob.role && (
                  <Col md={6}>
                    <span className="d-flex align-items-center small">
                      <PersonLinesFill className="me-2 text-secondary" /> <strong className="me-1">Role:</strong> {selectedJob.role}
                    </span>
                  </Col>
                )}
                {selectedJob.roleCategory && (
                  <Col md={6}>
                    <span className="d-flex align-items-center small">
                      <Layers className="me-2 text-secondary" /> <strong className="me-1">Role Category:</strong> {selectedJob.roleCategory}
                    </span>
                  </Col>
                )}
              </Row>

              <Row className="mb-3 g-2">
                {selectedJob.band && (
                  <Col md={6}>
                    <span className="d-flex align-items-center small">
                      <Star className="me-2 text-secondary" /> <strong className="me-1">Band:</strong> {selectedJob.band}
                    </span>
                  </Col>
                )}
                {selectedJob.qualification && (
                  <Col md={6}>
                    <span className="d-flex align-items-center small">
                      <CheckCircle className="me-2 text-success" /> <strong className="me-1">Qualification:</strong> {selectedJob.qualification}
                    </span>
                  </Col>
                )}
              </Row>

              <Row className="mb-3 g-2">
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <CashStack className="me-2 text-success" /> <strong className="me-1">Salary:</strong> {selectedJob.salary || 'Not specified'}
                  </span>
                </Col>
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <Clock className="me-2 text-secondary" /> <strong className="me-1">Posted:</strong> {formatDate(selectedJob.createdAt)}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3 g-2">
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <Calendar className="me-2 text-primary" /> <strong className="me-1">Application Deadline:</strong> {formatDate(selectedJob.applicationDeadline)}
                  </span>
                </Col>
                <Col md={6}>
                  <span className="d-flex align-items-center small">
                    <PersonLinesFill className="me-2 text-primary" /> <strong className="me-1">Vacancies:</strong> {selectedJob.vacancies ?? selectedJob.maxApplications ?? 'Not specified'}
                  </span>
                </Col>
              </Row>

              {selectedJob.responsibility && (
                <div className="mb-3">
                  <h6 className="fw-bold">Responsibilities</h6>
                  <div className="bg-light rounded p-3 small">
                    {selectedJob.responsibility.split('\n').map((line, idx) => (
                      line.trim() && <div key={idx}>• {line.trim()}</div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedJob.essentialHiringSkills) && selectedJob.essentialHiringSkills.length > 0 && (
                <div className="mb-3">
                  <h6 className="fw-bold">Essential Hiring Skills</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedJob.essentialHiringSkills.map((s, idx) => (
                      <Badge key={idx} bg="primary" pill className="px-3 py-2">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedJob.keySkills) && selectedJob.keySkills.length > 0 && (
                <div className="mb-3">
                  <h6 className="fw-bold">Key Skills</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedJob.keySkills.map((s, idx) => (
                      <Badge key={idx} bg="info" pill className="px-3 py-2">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <h6 className="fw-bold">Description</h6>
                <p className="small mb-0">{selectedJob.description}</p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">Requirements</h6>
                <p className="small mb-0">{selectedJob.requirements}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowViewModal(false);
            handleEditJob(selectedJob);
          }}>
            Edit Job
          </Button>
          {/* Report button removed */}
        </Modal.Footer>
      </Modal>

      {/* Edit Job Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Alert variant="warning" className="mb-4">
              <ExclamationTriangle className="me-2" />
              <strong>Important:</strong> Ensure all job details are accurate and comply with our terms of service.
              Misrepresentation may lead to account suspension.
            </Alert>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="jobTitle"
                    value={editFormData.jobTitle || ''}
                    onChange={handleEditChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Type *</Form.Label>
                  <Form.Select
                    name="jobType"
                    value={editFormData.jobType || ''}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select job type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Remote">Remote</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Extended Fields */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Band</Form.Label>
                  <Form.Control
                    type="text"
                    name="band"
                    value={editFormData.band || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. L3, Band 4"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    name="qualification"
                    value={editFormData.qualification || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. B.Tech, MCA"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Essential Hiring Skills (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="essentialHiringSkills"
                    value={editFormData.essentialHiringSkills || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. React, Node.js, SQL"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Key Skills (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="keySkills"
                    value={editFormData.keySkills || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Git, REST APIs, Docker"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Responsibilities</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="responsibility"
                    value={editFormData.responsibility || ''}
                    onChange={handleEditChange}
                    placeholder="Outline the responsibilities for the role"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Shift</Form.Label>
                  <Form.Control
                    type="text"
                    name="shift"
                    value={editFormData.shift || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Day shift, Night shift"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control
                    type="text"
                    name="role"
                    value={editFormData.role || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Frontend Developer"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="industryType"
                    value={editFormData.industryType || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. IT Services, FinTech"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employment Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="employmentType"
                    value={editFormData.employmentType || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Permanent, Contract"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="roleCategory"
                    value={editFormData.roleCategory || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Software Development"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Education</Form.Label>
                  <Form.Control
                    type="text"
                    name="education"
                    value={editFormData.education || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. B.Sc, M.Tech"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={editFormData.location || ''}
                    onChange={handleEditChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={editFormData.department || ''}
                    onChange={handleEditChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="text"
                    name="salary"
                    value={editFormData.salary || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. $90,000 - $120,000"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience Level</Form.Label>
                  <Form.Select
                    name="experienceLevel"
                    value={editFormData.experienceLevel || 'Any'}
                    onChange={handleEditChange}
                  >
                    <option value="Any">Any</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Job Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={editFormData.description || ''}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Requirements *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="requirements"
                value={editFormData.requirements || ''}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={editFormData.companyName || ''}
                    onChange={handleEditChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Application Deadline</Form.Label>
                  <Form.Control
                    type="date"
                    name="applicationDeadline"
                    value={editFormData.applicationDeadline || ''}
                    onChange={handleEditChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vacancies</Form.Label>
                  <Form.Control
                    type="number"
                    name="vacancies"
                    value={editFormData.vacancies || 1}
                    onChange={handleEditChange}
                    min="1"
                    max="1000"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isFeatured"
                    checked={editFormData.isFeatured || false}
                    onChange={handleEditChange}
                    label="Feature this job"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>About Company</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="aboutCompany"
                value={editFormData.aboutCompany || ''}
                onChange={handleEditChange}
                placeholder="Describe the company, culture, and benefits"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                'Update Job'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the job "<strong>{selectedJob?.jobTitle}</strong>"?</p>
          <p className="text-muted">This action cannot be undone.</p>
          <Alert variant="warning" className="mt-3">
            <ExclamationTriangle className="me-2" />
            <strong>Warning:</strong> Deleting jobs frequently may affect your account standing.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Job'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Job Requirements Form Modal */}
      <JobRequirementsForm 
        show={showJobReqModal} 
        onHide={() => setShowJobReqModal(false)} 
        onSuccess={() => {
          fetchJobs();
          fetchActivities();
          setTimeout(() => {
            fetchActivities();
          }, 1000);
        }}
      />

      <style jsx>{`
        .stat-card {
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
        }
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-circle-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-primary-light {
          background-color: rgba(13, 110, 253, 0.1);
        }
        .bg-success-light {
          background-color: rgba(25, 135, 84, 0.1);
        }
        .bg-warning-light {
          background-color: rgba(255, 193, 7, 0.1);
        }
        .bg-info-light {
          background-color: rgba(13, 202, 240, 0.1);
        }
        .bg-success-light {
          background-color: rgba(25, 135, 84, 0.1);
        }
        .bg-danger-light {
          background-color: rgba(220, 53, 69, 0.1);
        }
        .activity-list {
          max-height: 500px;
          overflow-y: auto;
        }
        .activity-list::-webkit-scrollbar {
          width: 6px;
        }
        .activity-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .activity-list::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 3px;
        }
        .dropdown-menu {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
        }

        .table td:last-child {
          position: static !important;
        }
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
        }
      `}</style>
    </>
  );
};

export default Dashboard;