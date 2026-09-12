import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Badge, ProgressBar, Button, Container, 
  Spinner, Alert, Modal, Form, Row, Col, Navbar, Nav
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  Eye, Pencil, Trash, ThreeDots, Briefcase, 
  PersonLinesFill, Star, CheckCircle, GeoAlt, CashStack, Clock,
  FileEarmark, Layers, Calendar, Building
} from 'react-bootstrap-icons';
import { FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const AllJobs = () => {
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
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchAllJobs();
  }, []);

  const fetchAllJobs = async (preserveSuccess = false) => {
    setLoading(true);
    setError('');
    if (!preserveSuccess) {
      setSuccessMessage('');
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await API.get('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;

      setJobs(result.jobs || []);
      if (!preserveSuccess && result.jobs && result.jobs.length > 0) {
        setSuccessMessage(`Successfully loaded ${result.jobs.length} job(s)`);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      if (error.response) {
        setError(error.response.data.message || 'Failed to fetch jobs');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  const handleEditJob = (job) => {
    console.log('Original job data:', job);
    console.log('Original applicationDeadline:', job.applicationDeadline);
    console.log('Type of applicationDeadline:', typeof job.applicationDeadline);
    
    let formattedDeadline = '';
    if (job.applicationDeadline) {
      try {
        // Handle different date formats
        if (typeof job.applicationDeadline === 'string') {
          if (job.applicationDeadline.includes('T')) {
            formattedDeadline = job.applicationDeadline.split('T')[0];
          } else {
            // If it's already in YYYY-MM-DD format
            formattedDeadline = job.applicationDeadline;
          }
        } else if (job.applicationDeadline instanceof Date) {
          formattedDeadline = job.applicationDeadline.toISOString().split('T')[0];
        } else {
          // Try to create a Date object
          const date = new Date(job.applicationDeadline);
          if (!isNaN(date.getTime())) {
            formattedDeadline = date.toISOString().split('T')[0];
          }
        }
      } catch (error) {
        console.error('Error formatting applicationDeadline:', error);
        formattedDeadline = '';
      }
    }
    
    console.log('Formatted deadline:', formattedDeadline);
    
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
      department: job.department || '',
      employmentType: job.employmentType || '',
      roleCategory: job.roleCategory || '',
      education: job.education || '',
      aboutCompany: job.aboutCompany || '',
      jobTitle: job.jobTitle,
      jobType: job.jobType,
      location: job.location,
      salary: job.salary || '',
      experienceLevel: job.experienceLevel || 'Any',
      description: job.description,
      requirements: job.requirements,
      companyName: job.companyName,
      applicationDeadline: formattedDeadline,
      vacancies: (job.vacancies ?? job.maxApplications ?? 1),
      isFeatured: job.isFeatured || false
    });
    setShowEditModal(true);
  };

  const handleDeleteJob = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Client-side validation
      const { jobTitle, jobType, location, description, requirements, companyName } = editFormData;
      if (!jobTitle?.trim() || !jobType?.trim() || !location?.trim() || 
          !description?.trim() || !requirements?.trim() || !companyName?.trim()) {
        setError('Please fill in all required fields.');
        return;
      }

      console.log('Submitting job update:', {
        jobId: selectedJob._id,
        formData: editFormData
      });

      const response = await API.put(`/api/jobs/${selectedJob._id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;

      console.log('Job update response:', result);
      setSuccessMessage('Job updated successfully!');
      setShowEditModal(false);
      fetchAllJobs(true);
      // Note: AllJobs doesn't have fetchActivities, so we'll need to navigate back to Dashboard to see updated activities
    } catch (error) {
      console.error('Error updating job:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.details?.join(', ') || 
                          'Failed to update job';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      console.log('Deleting job:', selectedJob._id);

      await API.delete(`/api/jobs/${selectedJob._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Job deleted successfully!');
      setShowDeleteModal(false);
      fetchAllJobs(true);
    } catch (error) {
      console.error('Error deleting job:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.details?.join(', ') || 
                          'Failed to delete job';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'Invalid Date';
    }
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.status !== 'closed').length;
  const totalApplications = jobs.reduce((sum, job) => sum + (job.applications || 0), 0);
  return (
    <>
      <Navbar expand="lg" className="shadow-sm bg-white sticky-top w-100" style={{ position: 'sticky', top: 0, zIndex: 1020 }}>
        <div className="container-fluid px-2 px-md-4">
          <Navbar.Brand 
            className="d-flex align-items-center"
            onClick={() => navigate('/NaukriClientPortal')}
            style={{ cursor: 'pointer' }}
          >
            <img 
              src="/logo.jpeg" 
              alt="JobilioHR Logo" 
              className="img-fluid me-2" 
              style={{ height: '35px', height: '40px' }} 
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
        </div>
      </Navbar>
      <Container className="py-3 py-md-4 px-2 px-md-4">

      {/* Stats Cards */}
      <Row className="mb-3 mb-md-4 g-2 g-md-3">
        <Col xs={6} md={4}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 mb-md-2 fs-8 fs-md-6">Total Jobs</h6>
                  <h3 className="mb-0 fs-5 fs-md-3">{totalJobs}</h3>
                </div>
                <div className="icon-circle bg-primary-light text-primary" style={{width: '35px', height: '35px'}}>
                  <Briefcase size={18} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 mb-md-2 fs-8 fs-md-6">Active Jobs</h6>
                  <h3 className="mb-0 fs-5 fs-md-3">{activeJobs}</h3>
                </div>
                <div className="icon-circle bg-success-light text-success" style={{width: '35px', height: '35px'}}>
                  <CheckCircle size={18} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body className="p-2 p-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 mb-md-2 fs-8 fs-md-6">Total Applications</h6>
                  <h3 className="mb-0 fs-5 fs-md-3">{totalApplications}</h3>
                </div>
                <div className="icon-circle bg-warning-light text-warning" style={{width: '35px', height: '35px'}}>
                  <PersonLinesFill size={18} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4">
            <h2 className="mb-2 mb-md-0 fs-4 fs-md-3">All Job Postings</h2>
            <div className="d-flex flex-column flex-sm-row gap-2">
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3 py-2 py-md-3">
              <span className="fs-6 fs-md-5">{error}</span>
            </Alert>
          )}
          
          {successMessage && (
            <Alert variant="success" className="mb-3 py-2 py-md-3" onClose={() => setSuccessMessage('')} dismissible>
              <span className="fs-6 fs-md-5">{successMessage}</span>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-4 py-md-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2 text-muted fs-7 fs-md-6">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-4 py-md-5">
              <Briefcase size={40} className="text-muted mb-3" />
              <h6 className="text-muted fs-6 fs-md-5">No jobs posted yet</h6>
              <p className="text-muted fs-7 fs-md-6">Start by posting your first job to see it here.</p>
              <Link to="/post-job">
                <Button variant="primary" size="sm">
                  <span className="d-none d-sm-inline">Post Your First Job</span>
                  <span className="d-inline d-sm-none">Post Job</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 table-sm">
                <thead>
                  <tr>
                    <th className="fs-7 fs-md-6">Job Title</th>
                    <th className="d-none d-md-table-cell fs-7 fs-md-6">Location</th>
                    <th className="fs-7 fs-md-6">Type</th>
                    <th className="fs-7 fs-md-6">Status</th>
                    <th className="d-none d-lg-table-cell fs-7 fs-md-6">Applications</th>
                    <th className="d-none d-md-table-cell fs-7 fs-md-6">Posted Date</th>
                    <th className="fs-7 fs-md-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <div className="fw-semibold fs-7 fs-md-6">{job.jobTitle}</div>
                        <small className="text-muted fs-8 fs-md-7">{job.companyName}</small>
                        {/* Mobile-only info */}
                        <div className="d-md-none mt-1">
                          <small className="text-muted fs-8">
                            📍 {job.location} • 📅 {formatDate(job.createdAt)}
                          </small>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="text-muted fs-8 fs-md-7">{job.location}</span>
                      </td>
                      <td>
                        <Badge bg="primary" className="text-capitalize fs-8 fs-md-7">
                          {job.jobType}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={
                          job.status === 'active' ? 'success' : 
                          job.status === 'paused' ? 'warning' : 'secondary'
                        } className="text-capitalize fs-8 fs-md-7">
                          {job.status || 'active'}
                        </Badge>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <div className="d-flex align-items-center">
                          <div className="progress-wrapper me-2" style={{width: '60px'}}>
                            <ProgressBar 
                              now={job.applications ? (job.applications / 50) * 100 : 0} 
                              variant="primary" 
                              style={{height: '6px'}} 
                            />
                          </div>
                          <span className="fs-8 fs-md-7">{job.applications || 0}</span>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <small className="text-muted fs-8 fs-md-7">
                          {formatDate(job.createdAt)}
                        </small>
                      </td>
                      <td>
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
                              <button className="dropdown-item fs-7 fs-md-6" onClick={() => handleViewJob(job)}>
                                <Eye className="me-2" />
                                <span className="d-none d-sm-inline">View Details</span>
                                <span className="d-inline d-sm-none">View</span>
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item fs-7 fs-md-6" onClick={() => handleEditJob(job)}>
                                <Pencil className="me-2" />
                                <span className="d-none d-sm-inline">Edit Job</span>
                                <span className="d-inline d-sm-none">Edit</span>
                              </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button className="dropdown-item text-danger fs-7 fs-md-6" onClick={() => handleDeleteJob(job)}>
                                <Trash className="me-2" />
                                <span className="d-none d-sm-inline">Delete Job</span>
                                <span className="d-inline d-sm-none">Delete</span>
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

      <style jsx>{`
        .stat-card {
          border-radius: 10px;
          transition: transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-5px);
        }
        .icon-circle {
          width: 40px;
          height: 40px;
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
      `}</style>

      {/* View Job Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="modal-responsive">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fs-md-4">Job Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && (
            <div>
              <h4 className="fw-bold mb-1 fs-5 fs-md-4">{selectedJob.jobTitle}</h4>
              {selectedJob.companyName && (
                <p className="text-muted mb-3 fs-7 fs-md-6">{selectedJob.companyName}</p>
              )}

              <Row className="mb-3 g-2 g-md-3">
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <GeoAlt className="me-2 text-primary" /> <strong className="me-1">Location:</strong> {selectedJob.location}
                  </span>
                </Col>
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <Briefcase className="me-2 text-primary" /> <strong className="me-1">Job Type:</strong> {selectedJob.jobType}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3 g-2 g-md-3">
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <Layers className="me-2 text-primary" /> <strong className="me-1">Department:</strong> {selectedJob.department || 'Not specified'}
                  </span>
                </Col>
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <Star className="me-2 text-warning" /> <strong className="me-1">Experience:</strong> {selectedJob.experienceLevel || 'Any'}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3 g-2 g-md-3">
                {selectedJob.employmentType && (
                  <Col xs={12} md={6}>
                    <span className="d-flex align-items-center small">
                      <Briefcase className="me-2 text-secondary" /> <strong className="me-1">Employment Type:</strong> {selectedJob.employmentType}
                    </span>
                  </Col>
                )}
                {selectedJob.industryType && (
                  <Col xs={12} md={6}>
                    <span className="d-flex align-items-center small">
                      <Building className="me-2 text-secondary" /> <strong className="me-1">Industry:</strong> {selectedJob.industryType}
                    </span>
                  </Col>
                )}
              </Row>

              <Row className="mb-3 g-2 g-md-3">
                {selectedJob.role && (
                  <Col xs={12} md={6}>
                    <span className="d-flex align-items-center small">
                      <PersonLinesFill className="me-2 text-secondary" /> <strong className="me-1">Role:</strong> {selectedJob.role}
                    </span>
                  </Col>
                )}
                {selectedJob.roleCategory && (
                  <Col xs={12} md={6}>
                    <span className="d-flex align-items-center small">
                      <Layers className="me-2 text-secondary" /> <strong className="me-1">Role Category:</strong> {selectedJob.roleCategory}
                    </span>
                  </Col>
                )}
              </Row>

              <Row className="mb-3 g-2 g-md-3">
                {selectedJob.band && (
                  <Col xs={12} md={6}>
                    <span className="d-flex align-items-center small">
                      <Star className="me-2 text-secondary" /> <strong className="me-1">Band:</strong> {selectedJob.band}
                    </span>
                  </Col>
                )}
                {selectedJob.qualification && (
                  <Col xs={12} md={6}>
                    <span className="d-flex align-items-center small">
                      <CheckCircle className="me-2 text-success" /> <strong className="me-1">Qualification:</strong> {selectedJob.qualification}
                    </span>
                  </Col>
                )}
              </Row>

              <Row className="mb-3 g-2 g-md-3">
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <CashStack className="me-2 text-success" /> <strong className="me-1">Salary:</strong> {selectedJob.salary || 'Not specified'}
                  </span>
                </Col>
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <Clock className="me-2 text-secondary" /> <strong className="me-1">Posted:</strong> {formatDate(selectedJob.createdAt)}
                  </span>
                </Col>
              </Row>

              <Row className="mb-3 g-2 g-md-3">
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <Calendar className="me-2 text-primary" /> <strong className="me-1">Application Deadline:</strong> {formatDate(selectedJob.applicationDeadline)}
                  </span>
                </Col>
                <Col xs={12} md={6}>
                  <span className="d-flex align-items-center small">
                    <PersonLinesFill className="me-2 text-primary" /> <strong className="me-1">Vacancies:</strong> {selectedJob.vacancies || 'Not specified'}
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
        <Modal.Footer className="d-flex flex-column flex-sm-row gap-2">
          <Button variant="secondary" onClick={() => setShowViewModal(false)} className="btn-responsive fs-7 fs-md-6">
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowViewModal(false);
            handleEditJob(selectedJob);
          }} className="btn-responsive fs-7 fs-md-6">
            Edit Job
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Job Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fs-md-4">Edit Job</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Row className="g-2 g-md-3">
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Position *</Form.Label>
                  <Form.Control type="text" name="position" value={editFormData.position || ''} onChange={handleEditChange} placeholder="e.g. Software Engineer" required size="sm" />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Type *</Form.Label>
                  <Form.Select name="type" value={editFormData.type || ''} onChange={handleEditChange} required size="sm">
                    <option value="">Select type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Job Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="jobTitle"
                    value={editFormData.jobTitle || ''}
                    onChange={handleEditChange}
                    required
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Job Type *</Form.Label>
                  <Form.Select
                    name="jobType"
                    value={editFormData.jobType || ''}
                    onChange={handleEditChange}
                    required
                    size="sm"
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

            {/* Extended Fields (similar to Post Job) */}
            <Row className="g-2 g-md-3">
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Band</Form.Label>
                  <Form.Control
                    type="text"
                    name="band"
                    value={editFormData.band || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. L3, Band 4"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    name="qualification"
                    value={editFormData.qualification || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. B.Tech, MCA"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Essential Hiring Skills (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="essentialHiringSkills"
                    value={editFormData.essentialHiringSkills || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. React, Node.js, SQL"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Key Skills (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="keySkills"
                    value={editFormData.keySkills || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Git, REST APIs, Docker"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Responsibilities</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="responsibility"
                    value={editFormData.responsibility || ''}
                    onChange={handleEditChange}
                    placeholder="Outline the responsibilities for the role"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Shift</Form.Label>
                  <Form.Control
                    type="text"
                    name="shift"
                    value={editFormData.shift || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Day shift, Night shift"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Role</Form.Label>
                  <Form.Control
                    type="text"
                    name="role"
                    value={editFormData.role || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Frontend Developer"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Industry Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="industryType"
                    value={editFormData.industryType || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. IT Services, FinTech"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Employment Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="employmentType"
                    value={editFormData.employmentType || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Permanent, Contract"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Role Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="roleCategory"
                    value={editFormData.roleCategory || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. Software Development"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Education</Form.Label>
                  <Form.Control
                    type="text"
                    name="education"
                    value={editFormData.education || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. B.Sc, M.Tech"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 g-md-3">
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={editFormData.location || ''}
                    onChange={handleEditChange}
                    required
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Department</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={editFormData.department || ''}
                    onChange={handleEditChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-2 g-md-3">
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Salary</Form.Label>
                  <Form.Control
                    type="text"
                    name="salary"
                    value={editFormData.salary || ''}
                    onChange={handleEditChange}
                    placeholder="e.g. $90,000 - $120,000"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Experience Level</Form.Label>
                  <Form.Select
                    name="experienceLevel"
                    value={editFormData.experienceLevel || 'Any'}
                    onChange={handleEditChange}
                    size="sm"
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
              <Form.Label className="fs-7 fs-md-6">Job Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={editFormData.description || ''}
                onChange={handleEditChange}
                required
                size="sm"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Requirements *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="requirements"
                value={editFormData.requirements || ''}
                onChange={handleEditChange}
                required
                size="sm"
              />
            </Form.Group>
            
            <Row className="g-2 g-md-3">
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Company Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={editFormData.companyName || ''}
                    onChange={handleEditChange}
                    required
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Application Deadline</Form.Label>
                  <Form.Control
                    type="date"
                    name="applicationDeadline"
                    value={editFormData.applicationDeadline || ''}
                    onChange={handleEditChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-2 g-md-3">
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fs-7 fs-md-6">Vacancies</Form.Label>
                  <Form.Control
                    type="number"
                    name="vacancies"
                    value={editFormData.vacancies || 1}
                    onChange={handleEditChange}
                    min="1"
                    max="1000"
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isFeatured"
                    checked={editFormData.isFeatured || false}
                    onChange={handleEditChange}
                    label={<span className="fs-7 fs-md-6">Feature this job</span>}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">About Company</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="aboutCompany"
                value={editFormData.aboutCompany || ''}
                onChange={handleEditChange}
                placeholder="Describe the company, culture, and benefits"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="d-flex flex-column flex-sm-row gap-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting} className="fs-7 fs-md-6">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="fs-7 fs-md-6">
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
          <Modal.Title className="fs-5 fs-md-4">Delete Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="fs-7 fs-md-6">Are you sure you want to delete the job "<strong>{selectedJob?.jobTitle}</strong>"?</p>
          <p className="text-muted fs-8 fs-md-7">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="d-flex flex-column flex-sm-row gap-2">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isSubmitting} className="fs-7 fs-md-6">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={isSubmitting} className="fs-7 fs-md-6">
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
      </Container>
    </>
  );
};

export default AllJobs;