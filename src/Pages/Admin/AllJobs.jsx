import React, { useEffect, useState } from 'react';
import API from '../../api';
import {
  Table, Spinner, Form, Row, Col, Button,
  Modal, Card, Badge, Container,
  InputGroup, Collapse, ButtonGroup
} from 'react-bootstrap';
import {
  FileText,
  Calendar,
  Layers,
  FileEarmark,
  FileEarmarkPdf,
  Star,
  CheckCircle,
} from 'react-bootstrap-icons';
import {
  Search, Filter, Eye, People, Trash, X,
  ChevronDown, ChevronUp, Briefcase, Building,
  Person, Envelope, GeoAlt, Clock, CashStack
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';

const AllJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobTitle: '',
    companyName: '',
    username: '',
    email: '',
    jobType: '',
    location: '',
    status: ''
  });

  // Lead-specific filters
  const [leadFilters, setLeadFilters] = useState({
    name: '',
    email: '',
    status: ''
  });

  // Leads state
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadStats, setLeadStats] = useState(null);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'leads'

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const navigate = useNavigate();


  useEffect(() => {
    fetchJobs();
    fetchLeads();
    fetchLeadStats();
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    API.get('/api/jobs/admin/jobs')
      .then((res) => {
        setJobs(res.data.jobs);
      })
      .catch((err) => {
        console.error('Error fetching all jobs:', err);
      })
      .finally(() => setLoading(false));
  };

  const fetchLeads = () => {
    setLeadsLoading(true);
    console.log('Fetching leads...');
    console.log('Current token:', localStorage.getItem('token'));
    console.log('Current role:', localStorage.getItem('role'));
    
    API.get('/api/leads')
      .then((res) => {
        console.log('Leads API response:', res.data);
        setLeads(res.data.leads);
      })
      .catch((err) => {
        console.error('Error fetching leads:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
      })
      .finally(() => setLeadsLoading(false));
  };

  const fetchLeadStats = () => {
    API.get('/api/leads/stats')
      .then((res) => {
        setLeadStats(res.data.stats);
      })
      .catch((err) => {
        console.error('Error fetching lead stats:', err);
      });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLeadFilterChange = (field, value) => {
    setLeadFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      jobTitle: '',
      companyName: '',
      username: '',
      email: '',
      jobType: '',
      location: '',
      status: ''
    });
  };

  const resetLeadFilters = () => {
    setLeadFilters({
      name: '',
      email: '',
      status: ''
    });
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await API.delete(`/api/jobs/${jobId}`);
      fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleView = (job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleRedirectApplicants = (jobId) => {
    navigate(`/admin/jobs/Applications/${jobId}`);
  };

  // Lead handler functions
  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setShowLeadsModal(true);
  };

  const handleUpdateLeadStatus = async (leadId, status) => {
    try {
      await API.put(`/api/leads/${leadId}`, { status });
      fetchLeads(); // Refresh leads list
      alert(`Lead status updated to ${status}`);
    } catch (err) {
      console.error('Error updating lead status:', err);
      alert('Failed to update lead status');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await API.delete(`/api/leads/${leadId}`);
      fetchLeads(); // Refresh leads list
      alert('Lead deleted successfully');
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Failed to delete lead');
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.jobTitle.toLowerCase().includes(filters.jobTitle.toLowerCase()) &&
    job.companyName.toLowerCase().includes(filters.companyName.toLowerCase()) &&
    (job.postedBy?.username || '').toLowerCase().includes(filters.username.toLowerCase()) &&
    (job.postedBy?.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
    job.jobType.toLowerCase().includes(filters.jobType.toLowerCase()) &&
    job.location.toLowerCase().includes(filters.location.toLowerCase()) &&
    job.status.toLowerCase().includes(filters.status.toLowerCase())
  );

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(leadFilters.name.toLowerCase()) &&
    lead.email.toLowerCase().includes(leadFilters.email.toLowerCase()) &&
    (lead.status || '').toLowerCase().includes(leadFilters.status.toLowerCase()) &&
    // Only show external job leads (filter out internal jobs)
    (lead.source === 'external_job_application' || lead.externalJobUrl)
  );

  // Count only external leads with "new" status
  const newExternalLeadsCount = leads.filter(lead => 
    lead.status === 'new' && 
    (lead.source === 'external_job_application' || lead.externalJobUrl)
  ).length;

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'closed': return <Badge bg="danger">Closed</Badge>;
      case 'draft': return <Badge bg="warning" text="dark">Draft</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading jobs...</p>
      </div>
    );
  }

  return (
    <Container fluid className="py-4 px-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <Card className="shadow border-0">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 fw-bold">
                {activeTab === 'jobs' ? 'All Job Listings' : 'Job Application Leads'}
              </h2>
              <small className="text-muted">
                {activeTab === 'jobs' ? 'Manage all job postings from clients' : 'Track leads from job applications'}
              </small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Badge pill bg="light" text="dark" className="fs-6">
                {activeTab === 'jobs' 
                  ? `${filteredJobs.length} ${filteredJobs.length === 1 ? 'Job' : 'Jobs'}`
                  : `${filteredLeads.length} ${filteredLeads.length === 1 ? 'Lead' : 'Leads'}`
                }
              </Badge>
              {activeTab === 'leads' && newExternalLeadsCount > 0 && (
                <Badge pill bg="success" className="fs-6">
                  {newExternalLeadsCount} New
                </Badge>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-3">
            <ButtonGroup>
              <Button
                variant={activeTab === 'jobs' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('jobs')}
                className="d-flex align-items-center gap-2"
              >
                <Briefcase size={16} />
                Jobs ({filteredJobs.length})
              </Button>
              <Button
                variant={activeTab === 'leads' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('leads')}
                className="d-flex align-items-center gap-2"
              >
                <Person size={16} />
                Leads ({filteredLeads.length})
                {newExternalLeadsCount > 0 && (
                  <Badge bg="danger" className="ms-1" style={{ fontSize: '0.6rem' }}>
                    {newExternalLeadsCount}
                  </Badge>
                )}
              </Button>
            </ButtonGroup>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Filter Controls */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button
                variant="outline-primary"
                onClick={() => setShowFilters(!showFilters)}
                className="d-flex align-items-center"
              >
                {showFilters ? <ChevronUp className="me-2" /> : <ChevronDown className="me-2" />}
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>

              {((activeTab === 'jobs' && Object.values(filters).some(Boolean)) || 
                (activeTab === 'leads' && Object.values(leadFilters).some(Boolean))) && (
                <Button
                  variant="link"
                  onClick={activeTab === 'jobs' ? resetFilters : resetLeadFilters}
                  className="text-danger p-0 d-flex align-items-center"
                >
                  <X className="me-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <Collapse in={showFilters}>
              <div>
                {activeTab === 'jobs' ? (
                  <Row className="g-3">
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <Briefcase />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Job Title"
                          value={filters.jobTitle}
                          onChange={(e) => handleFilterChange('jobTitle', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <Building />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Company"
                          value={filters.companyName}
                          onChange={(e) => handleFilterChange('companyName', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <Person />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Username"
                          value={filters.username}
                          onChange={(e) => handleFilterChange('username', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <Envelope />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Email"
                          value={filters.email}
                          onChange={(e) => handleFilterChange('email', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={filters.jobType}
                        onChange={(e) => handleFilterChange('jobType', e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <GeoAlt />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Location"
                          value={filters.location}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="draft">Draft</option>
                      </Form.Select>
                    </Col>
                  </Row>
                ) : (
                  <Row className="g-3">
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <Person />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Lead Name"
                          value={leadFilters.name}
                          onChange={(e) => handleLeadFilterChange('name', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <Envelope />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Email"
                          value={leadFilters.email}
                          onChange={(e) => handleLeadFilterChange('email', e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={leadFilters.status}
                        onChange={(e) => handleLeadFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="closed_won">Closed Won</option>
                        <option value="closed_lost">Closed Lost</option>
                      </Form.Select>
                    </Col>
                  </Row>
                )}
              </div>
            </Collapse>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'jobs' ? (
            <>
              {/* Jobs Table */}
              {filteredJobs.length === 0 ? (
            <div className="text-center py-5 bg-light rounded">
              <Search size={48} className="text-muted mb-3" />
              <h5>No jobs found</h5>
              <p className="text-muted">
                {jobs.length === 0
                  ? 'No jobs have been posted yet.'
                  : 'No jobs match your filters.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <Table hover className="align-middle" style={{ tableLayout: 'fixed' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '22%' }}>Title</th>
                    <th style={{ width: '16%' }}>Company</th>
                    <th style={{ width: '20%' }}>Posted By</th>
                    <th style={{ width: '10%' }}>Type</th>
                    <th style={{ width: '12%' }}>Location</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '6%' }}>Apps</th>
                    <th className="text-end" style={{ width: '14%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <Briefcase className="text-primary" />
                          </div>
                          <span className="fw-semibold">{job.jobTitle}</span>
                        </div>
                      </td>
                      <td>{job.companyName}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{job.postedBy?.username}</span>
                          <small className="text-muted">{job.postedBy?.email}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="text-capitalize">
                          {job.jobType}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <GeoAlt className="text-muted me-2" size={14} />
                          <span>{job.location}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td>
                        <Badge bg="info" pill>
                          {job.applications || 0}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <div className="dropdown dropup position-static d-inline-block">
                          <button
                            className="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            Actions
                          </button>
                          <ul
                            className="dropdown-menu dropdown-menu-end"
                            data-bs-display="static"
                            style={{ zIndex: 2000, minWidth: '180px' }}
                          >
                            <li>
                              <button className="dropdown-item d-flex align-items-center" onClick={() => handleView(job)}>
                                <Eye className="me-2" size={14} /> View
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item d-flex align-items-center" onClick={() => handleRedirectApplicants(job._id)}>
                                <People className="me-2" size={14} /> Applicants
                              </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <button className="dropdown-item text-danger d-flex align-items-center" onClick={() => handleDelete(job._id)}>
                                <Trash className="me-2" size={14} /> Delete
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
            </>
          ) : (
            <>
              {/* Leads Table */}
              {leadsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-5 bg-light rounded">
                  <Person size={48} className="text-muted mb-3" />
                  <h5>No leads found</h5>
                  <p className="text-muted">
                    Job application leads will appear here when candidates apply for website jobs.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Job Applied</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Applied Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                <Person size={16} className="text-primary" />
                              </div>
                              <div>
                                <div className="fw-medium">{lead.name}</div>
                                {lead.phone && (
                                  <small className="text-muted">{lead.phone}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Envelope size={14} className="text-muted me-2" />
                              <span>{lead.email}</span>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{lead.jobTitle}</div>
                            {lead.externalJobUrl && (
                              <small className="text-primary">
                                <a 
                                  href={lead.externalJobUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                >
                                  🔗 External Job Link
                                </a>
                              </small>
                            )}
                            {lead.resume && (
                              <small className="text-success d-block">
                                <FileEarmarkPdf size={12} className="me-1" />
                                Resume uploaded
                              </small>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Building size={14} className="text-muted me-2" />
                              <span>{lead.companyName}</span>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={
                                lead.status === 'new' ? 'primary' :
                                lead.status === 'contacted' ? 'info' :
                                lead.status === 'qualified' ? 'warning' :
                                lead.status === 'closed_won' ? 'success' :
                                lead.status === 'closed_lost' ? 'danger' : 'secondary'
                              }
                              className="text-capitalize"
                            >
                              {lead.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Calendar size={14} className="text-muted me-2" />
                              <span>{formatDate(lead.createdAt)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="dropdown">
                              <button
                                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                Actions
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <button 
                                    className="dropdown-item d-flex align-items-center" 
                                    onClick={() => handleUpdateLeadStatus(lead._id, 'contacted')}
                                  >
                                    <CheckCircle className="me-2" size={14} /> Mark as Contacted
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item d-flex align-items-center" 
                                    onClick={() => handleUpdateLeadStatus(lead._id, 'qualified')}
                                  >
                                    <Star className="me-2" size={14} /> Mark as Qualified
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button 
                                    className="dropdown-item text-danger d-flex align-items-center" 
                                    onClick={() => handleDeleteLead(lead._id)}
                                  >
                                    <Trash className="me-2" size={14} /> Delete
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
            </>
          )}
        </Card.Body>
      </Card>

      {/* Job Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        fullscreen="md-down"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <div className="d-flex align-items-start">
            <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 flex-shrink-0">
              <Building size={32} className="text-primary" />
            </div>
            <div>
              <Modal.Title
                className="fw-bold mb-1"
                style={{ fontSize: '1.5rem', color: '#2c3e50' }}
              >
                {selectedJob?.jobTitle}
              </Modal.Title>
              {selectedJob?.companyName && (
                <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                  {selectedJob.companyName}
                </p>
              )}
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-4">
          {selectedJob && (
            <>
              {/* Key Details Ribbon */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                  <Briefcase className="text-primary me-2" size={16} />
                  <span className="fw-medium">{selectedJob?.jobType}</span>
                </div>
                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                  <GeoAlt className="text-primary me-2" size={16} />
                  <span className="fw-medium">{selectedJob?.location}</span>
                </div>
                {selectedJob?.salary && (
                  <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                    <CashStack className="text-primary me-2" size={16} />
                    <span className="fw-medium text-success">{selectedJob.salary}</span>
                  </div>
                )}
                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                  <Clock className="text-primary me-2" size={16} />
                  <span className="fw-medium">
                    Apply by {formatDate(selectedJob?.applicationDeadline)}
                  </span>
                </div>
              </div>

              {/* Job Information */}
              <div className="mb-4">
                <h4 className="mb-3 d-flex align-items-center">
                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <FileText size={18} className="text-primary" />
                  </span>
                  Job Information
                </h4>

                <div className="ps-4 ms-3">
                  <div className="mb-3">
                    <div className="mb-2">
                      <span className="fw-medium me-2">Department:</span>
                      <span>{selectedJob?.department || 'Not specified'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-medium me-2">Experience Level:</span>
                      <span>{selectedJob?.experienceLevel || 'Any'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-medium me-2">Employment Type:</span>
                      <span>{selectedJob?.employmentType || 'Not specified'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-medium me-2">Industry Type:</span>
                      <span>{selectedJob?.industryType || 'Not specified'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-medium me-2">Role:</span>
                      <span>{selectedJob?.role || 'Not specified'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-medium me-2">Role Category:</span>
                      <span>{selectedJob?.roleCategory || 'Not specified'}</span>
                    </div>
                    {selectedJob?.band && (
                      <div className="mb-2">
                        <span className="fw-medium me-2">Band:</span>
                        <span>{selectedJob.band}</span>
                      </div>
                    )}
                    {selectedJob?.qualification && (
                      <div className="mb-2">
                        <span className="fw-medium me-2">Qualification:</span>
                        <span>{selectedJob.qualification}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-4">
                <h4 className="mb-3 d-flex align-items-center">
                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <Calendar size={18} className="text-primary" />
                  </span>
                  Additional Information
                </h4>

                <div className="ps-4 ms-3">
                  <div className="mb-2">
                    <span className="fw-medium me-2">Posted On:</span>
                    <span>{formatDate(selectedJob?.createdAt)}</span>
                  </div>
                  <div className="mb-2">
                    <span className="fw-medium me-2">Application Deadline:</span>
                    <span>{formatDate(selectedJob?.applicationDeadline)}</span>
                  </div>
                  {selectedJob?.shift && (
                    <div className="mb-2">
                      <span className="fw-medium me-2">Shift:</span>
                      <span>{selectedJob.shift}</span>
                    </div>
                  )}
                  {(selectedJob?.vacancies || selectedJob?.maxApplications) && (
                    <div className="mb-2">
                      <span className="fw-medium me-2">Vacancies:</span>
                      <span>{selectedJob.vacancies ?? selectedJob.maxApplications}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-4">
                <h4 className="mb-3 d-flex align-items-center">
                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <FileText size={18} className="text-primary" />
                  </span>
                  Job Description
                </h4>
                <div className="bg-light p-4 rounded-3">
                  {selectedJob?.description || 'No description provided.'}
                </div>
              </div>

              {/* Responsibilities */}
              <div className="mb-4">
                <h4 className="mb-3 d-flex align-items-center">
                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <Layers size={18} className="text-primary" />
                  </span>
                  Responsibilities
                </h4>
                <div className="bg-light p-4 rounded-3">
                  {selectedJob?.responsibility ? (
                    <ul className="mb-0">
                      {selectedJob.responsibility.split('\n').map(
                        (item, index) =>
                          item.trim() && <li key={index} className="mb-2">{item}</li>
                      )}
                    </ul>
                  ) : (
                    'No responsibilities provided.'
                  )}
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-4">
                <h4 className="mb-3 d-flex align-items-center">
                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                    <FileEarmark size={18} className="text-primary" />
                  </span>
                  Requirements
                </h4>
                <div className="bg-light p-4 rounded-3">
                  {selectedJob?.requirements ? (
                    <ul className="mb-0">
                      {selectedJob.requirements.split('\n').map(
                        (item, index) =>
                          item.trim() && <li key={index} className="mb-2">{item}</li>
                      )}
                    </ul>
                  ) : (
                    'No specific requirements listed.'
                  )}
                </div>
              </div>

              {/* Essential Skills */}
              {selectedJob?.essentialHiringSkills?.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <Star size={18} className="text-primary" />
                    </span>
                    Essential Hiring Skills
                  </h4>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedJob.essentialHiringSkills.map((s, idx) => (
                      <Badge key={`ess-${idx}`} bg="primary" pill className="px-3 py-2">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Skills */}
              {selectedJob?.keySkills?.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <Layers size={18} className="text-primary" />
                    </span>
                    Key Skills
                  </h4>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedJob.keySkills.map((s, idx) => (
                      <Badge key={`key-${idx}`} bg="info" pill className="px-3 py-2">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* About Company */}
              {selectedJob?.aboutCompany && (
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <Building size={18} className="text-primary" />
                    </span>
                    About Company
                  </h4>
                  <div className="bg-light p-4 rounded-3">
                    {selectedJob.aboutCompany}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="d-flex justify-content-between align-items-center mt-4">
                <Badge bg="info" pill className="fs-6">
                  {selectedJob?.applications || 0} Applications
                </Badge>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowModal(false);
                    handleRedirectApplicants(selectedJob?._id);
                  }}
                >
                  View Applicants
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Lead Details Modal */}
      <Modal
        show={showLeadsModal}
        onHide={() => setShowLeadsModal(false)}
        size="lg"
        fullscreen="md-down"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <div className="d-flex align-items-start">
            <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 flex-shrink-0">
              <Person size={32} className="text-primary" />
            </div>
            <div>
              <Modal.Title className="fw-bold mb-1">
                {selectedLead?.name}
              </Modal.Title>
              <p className="text-muted mb-0">{selectedLead?.email}</p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-3">
          {/* Lead Information */}
          <div className="mb-4">
            <h4 className="mb-3 d-flex align-items-center">
              <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                <Person size={18} className="text-primary" />
              </span>
              Lead Information
            </h4>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3">
                  <small className="text-muted d-block">Name</small>
                  <div className="fw-medium">{selectedLead?.name}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3">
                  <small className="text-muted d-block">Email</small>
                  <div className="fw-medium">{selectedLead?.email}</div>
                </div>
              </div>
              {selectedLead?.phone && (
                <div className="col-md-6">
                  <div className="bg-light p-3 rounded-3">
                    <small className="text-muted d-block">Phone</small>
                    <div className="fw-medium">{selectedLead.phone}</div>
                  </div>
                </div>
              )}
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3">
                  <small className="text-muted d-block">Applied Date</small>
                  <div className="fw-medium">{formatDate(selectedLead?.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="mb-4">
            <h4 className="mb-3 d-flex align-items-center">
              <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                <Briefcase size={18} className="text-primary" />
              </span>
              Job Applied For
            </h4>
            <div className="bg-light p-4 rounded-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="fw-medium">{selectedLead?.jobTitle}</div>
                  <small className="text-muted">Job Title</small>
                </div>
                <div className="col-md-6">
                  <div className="fw-medium">{selectedLead?.companyName}</div>
                  <small className="text-muted">Company</small>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Status */}
          <div className="mb-4">
            <h4 className="mb-3 d-flex align-items-center">
              <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                <CheckCircle size={18} className="text-primary" />
              </span>
              Lead Status
            </h4>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3">
                  <small className="text-muted d-block">Status</small>
                  <Badge 
                    bg={
                      selectedLead?.status === 'new' ? 'primary' :
                      selectedLead?.status === 'contacted' ? 'info' :
                      selectedLead?.status === 'qualified' ? 'warning' :
                      selectedLead?.status === 'closed_won' ? 'success' :
                      selectedLead?.status === 'closed_lost' ? 'danger' : 'secondary'
                    }
                    className="text-capitalize"
                  >
                    {selectedLead?.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-light p-3 rounded-3">
                  <small className="text-muted d-block">Priority</small>
                  <Badge 
                    bg={
                      selectedLead?.priority === 'low' ? 'secondary' :
                      selectedLead?.priority === 'medium' ? 'primary' :
                      selectedLead?.priority === 'high' ? 'warning' :
                      selectedLead?.priority === 'urgent' ? 'danger' : 'secondary'
                    }
                    className="text-capitalize"
                  >
                    {selectedLead?.priority}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* External Job Information */}
          {selectedLead?.source === 'external_job_application' && selectedLead?.externalJobUrl && (
            <div className="mb-4">
              <h4 className="mb-3 d-flex align-items-center">
                <span className="bg-info bg-opacity-10 p-2 rounded-circle me-2">
                  <Briefcase size={18} className="text-info" />
                </span>
                External Job Details
              </h4>
              <div className="bg-light p-3 rounded-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Job Title</small>
                    <div className="fw-medium">{selectedLead.jobTitle}</div>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Company</small>
                    <div className="fw-medium">{selectedLead.companyName}</div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">External Job Link</small>
                    <a 
                      href={selectedLead.externalJobUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-info btn-sm d-inline-flex align-items-center"
                    >
                      <Briefcase size={14} className="me-2" />
                      View External Job
                    </a>
                  </div>
                  {selectedLead?.notes && (
                    <div className="col-12">
                      <small className="text-muted d-block">Notes</small>
                      <div className="text-muted">{selectedLead.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resume Information */}
          {selectedLead?.resume && (
            <div className="mb-4">
              <h4 className="mb-3 d-flex align-items-center">
                <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                  <FileEarmarkPdf size={18} className="text-primary" />
                </span>
                Resume
              </h4>
              <div className="bg-light p-3 rounded-3">
                <div className="d-flex align-items-center">
                  <FileEarmarkPdf size={20} className="text-danger me-2" />
                  <div>
                    <div className="fw-medium">{selectedLead.resume.originalName}</div>
                    <small className="text-muted">
                      {(selectedLead.resume.size / 1024).toFixed(1)} KB
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowLeadsModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedLead?.status === 'new') {
                handleUpdateLeadStatus(selectedLead._id, 'contacted');
              }
              setShowLeadsModal(false);
            }}
          >
            {selectedLead?.status === 'new' ? 'Mark as Contacted' : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default AllJobs;