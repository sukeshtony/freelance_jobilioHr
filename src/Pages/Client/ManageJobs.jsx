import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Pagination,
  Badge,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  InputGroup
} from 'react-bootstrap';
import {
  Briefcase,
  Funnel,
  FunnelFill,
  Search,
  ArrowClockwise,
  PeopleFill
} from 'react-bootstrap-icons';
import { FaHome } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api';

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    dateRange: 'all',
    minApplicants: '',
    maxApplicants: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await API.get('/api/jobs');
        if (res.data.success) {
          setJobs(res.data.jobs);
          setFilteredJobs(res.data.jobs);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  

  // Apply filters whenever jobs or filters change
  useEffect(() => {
    let result = [...jobs];

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(job => job.status === filters.status);
    }

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(job =>
        job.jobTitle.toLowerCase().includes(term) ||
        (job.description && job.description.toLowerCase().includes(term))
      );
    }

    // Date range filter
    const now = new Date();
    switch (filters.dateRange) {
      case '30':
        result = result.filter(job => {
          const jobDate = new Date(job.createdAt);
          return (now - jobDate) <= (30 * 24 * 60 * 60 * 1000);
        });
        break;
      case '14':
        result = result.filter(job => {
          const jobDate = new Date(job.createdAt);
          return (now - jobDate) <= (14 * 24 * 60 * 60 * 1000);
        });
        break;
      case '7':
        result = result.filter(job => {
          const jobDate = new Date(job.createdAt);
          return (now - jobDate) <= (7 * 24 * 60 * 60 * 1000);
        });
        break;
      case '1':
        result = result.filter(job => {
          const jobDate = new Date(job.createdAt);
          return (now - jobDate) <= (24 * 60 * 60 * 1000);
        });
        break;
      default:
        // 'all' - no date filtering
        break;
    }

    // Applicant count filters
    if (filters.minApplicants) {
      const min = parseInt(filters.minApplicants);
      result = result.filter(job => job.applications >= min);
    }

    if (filters.maxApplicants) {
      const max = parseInt(filters.maxApplicants);
      result = result.filter(job => job.applications <= max);
    }

    setFilteredJobs(result);
  }, [jobs, filters]);

  const handleStatusChange = async (jobId, newStatus) => {
    setActionLoading(jobId);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.put(`/api/jobs/${jobId}/status`, { status: newStatus });
      if (res.data.success) {
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job._id === jobId ? { ...job, status: newStatus } : job
          )
        );
        setMessage({
          type: 'success',
          text: `Job status successfully updated to ${newStatus}!`
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update job status';
      setMessage({
        type: 'danger',
        text: errorMessage
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId) => {
    setActionLoading(jobId);
    try {
      await API.delete(`/api/jobs/${jobId}`);
      setJobs(jobs => jobs.filter(job => job._id !== jobId));
    } catch (err) {
      console.error('Failed to delete job:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewResponses = (jobId) => {
    navigate(`/responses/${jobId}`);
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      searchTerm: '',
      dateRange: 'all',
      minApplicants: '',
      maxApplicants: ''
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading job postings...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0 px-md-3">
      {/* Responsive Navbar */}
      <nav className="navbar navbar-expand-lg shadow-sm bg-white fixed-top">
        <div className="container-fluid px-3 px-md-4 px-lg-5">
          <div className="d-flex align-items-center">
            <img
              src="/logo.jpeg"
              alt="Company Logo"
              className="img-fluid"
              style={{ height: '35px', maxWidth: '100%' }}
            />
          </div>
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
        </div>
      </nav>
      <div style={{ paddingTop: '70px' }}></div>

      <Row className="g-0 g-md-3">
        {/* Filters Sidebar - hidden on mobile, shown on md+ */}
        <Col md={3} lg={2} className="d-none d-md-block pe-md-3">
          <Card className="border-0 shadow-sm mb-4 h-100">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fs-6 fs-lg-5">Filters</h5>
              <Button
                variant="link"
                onClick={resetFilters}
                className="text-white p-0 fs-7 fs-lg-6"
                size="sm"
              >
                <ArrowClockwise /> Reset
              </Button>
            </Card.Header>
            <Card.Body className="p-3">
              <Form>
                {/* Search Filter */}
                <Form.Group className="mb-3 mb-lg-4">
                  <Form.Label className="fw-semibold fs-7 fs-lg-6">Search Jobs</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light">
                      <Search size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Title or description..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                      className="fs-7 fs-lg-6"
                    />
                  </InputGroup>
                </Form.Group>

                {/* Status Filter */}
                <Form.Group className="mb-3 mb-lg-4">
                  <Form.Label className="fw-semibold fs-7 fs-lg-6">Job Status</Form.Label>
                  <div className="border rounded p-2 bg-light">
                    {['all', 'active', 'paused', 'closed'].map((status) => (
                      <Form.Check
                        key={status}
                        type="radio"
                        id={`status-${status}`}
                        label={status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                        checked={filters.status === status}
                        onChange={() => setFilters({ ...filters, status })}
                        className="mb-1 fs-7 fs-lg-6"
                      />
                    ))}
                  </div>
                </Form.Group>

                {/* Date Range Filter */}
                <Form.Group className="mb-3 mb-lg-4">
                  <Form.Label className="fw-semibold fs-7 fs-lg-6">Posted Within</Form.Label>
                  <div className="border rounded p-2 bg-light">
                    {['all', '30', '14', '7', '1'].map((days) => (
                      <Form.Check
                        key={days}
                        type="radio"
                        id={`days-${days}`}
                        label={days === 'all' ? 'All Time' : `Last ${days} days`}
                        checked={filters.dateRange === days}
                        onChange={() => setFilters({ ...filters, dateRange: days })}
                        className="mb-1 fs-7 fs-lg-6"
                      />
                    ))}
                  </div>
                </Form.Group>

                {/* Applicant Count Filter */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold fs-7 fs-lg-6">Applicants</Form.Label>
                  <div className="border rounded p-2 bg-light">
                    <div className="d-flex align-items-center mb-2">
                      <PeopleFill size={14} className="me-2 text-muted" />
                      <span className="small text-muted fs-7 fs-lg-6">Filter by applicant count</span>
                    </div>
                    <div className="row g-2">
                      <div className="col">
                        <Form.Control
                          type="number"
                          placeholder="Min"
                          value={filters.minApplicants}
                          onChange={(e) => setFilters({ ...filters, minApplicants: e.target.value })}
                          min="0"
                          size="sm"
                          className="fs-7 fs-lg-6"
                        />
                      </div>
                      <div className="col">
                        <Form.Control
                          type="number"
                          placeholder="Max"
                          value={filters.maxApplicants}
                          onChange={(e) => setFilters({ ...filters, maxApplicants: e.target.value })}
                          min="0"
                          size="sm"
                          className="fs-7 fs-lg-6"
                        />
                      </div>
                    </div>
                  </div>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={12} md={9} lg={10}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 mb-md-4">
                <h2 className="mb-2 mb-md-0 fs-5 fs-md-4">Manage Job Postings</h2>

                <div className="d-flex gap-2">
                  <Button
                    variant={showFilters ? 'primary' : 'outline-secondary'}
                    onClick={() => setShowFilters(!showFilters)}
                    className="d-md-none flex-shrink-0"
                    size="sm"
                  >
                    {showFilters ? <FunnelFill size={14} className="me-1" /> : <Funnel size={14} className="me-1" />}
                    Filters
                  </Button>
                </div>
              </div>

              {/* Mobile Filters - shown when toggled */}
              {showFilters && (
                <Card className="mb-3 d-md-none">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center py-2">
                    <h6 className="mb-0 fs-6">Filters</h6>
                    <Button
                      variant="link"
                      onClick={resetFilters}
                      className="p-0 fs-7"
                      size="sm"
                    >
                      <ArrowClockwise size={12} /> Reset
                    </Button>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label className="fs-7">Search Jobs</Form.Label>
                        <InputGroup size="sm">
                          <InputGroup.Text>
                            <Search size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Title or description..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            className="fs-7"
                          />
                        </InputGroup>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fs-7">Job Status</Form.Label>
                        <div className="ms-2">
                          {['all', 'active', 'paused', 'closed'].map((status) => (
                            <Form.Check
                              key={status}
                              type="radio"
                              id={`mobile-status-${status}`}
                              label={status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                              checked={filters.status === status}
                              onChange={() => setFilters({ ...filters, status })}
                              className="mb-1 fs-7"
                            />
                          ))}
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fs-7">Posted Within</Form.Label>
                        <div className="ms-2">
                          {['all', '30', '14', '7', '1'].map((days) => (
                            <Form.Check
                              key={days}
                              type="radio"
                              id={`mobile-days-${days}`}
                              label={days === 'all' ? 'All Time' : `Last ${days} days`}
                              checked={filters.dateRange === days}
                              onChange={() => setFilters({ ...filters, dateRange: days })}
                              className="mb-1 fs-7"
                            />
                          ))}
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fs-7">Applicants</Form.Label>
                        <div className="row g-2">
                          <div className="col">
                            <Form.Control
                              type="number"
                              placeholder="Min"
                              value={filters.minApplicants}
                              onChange={(e) => setFilters({ ...filters, minApplicants: e.target.value })}
                              min="0"
                              size="sm"
                              className="fs-7"
                            />
                          </div>
                          <div className="col">
                            <Form.Control
                              type="number"
                              placeholder="Max"
                              value={filters.maxApplicants}
                              onChange={(e) => setFilters({ ...filters, maxApplicants: e.target.value })}
                              min="0"
                              size="sm"
                              className="fs-7"
                            />
                          </div>
                        </div>
                      </Form.Group>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {message.text && (
                <Alert variant={message.type} className="mb-3 mb-md-4 py-2 py-md-3" dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  <span className="fs-7 fs-md-6">{message.text}</span>
                </Alert>
              )}

              {filteredJobs.length === 0 ? (
                <div className="text-center py-4 py-md-5">
                  <img
                    src="/images/no-results.svg"
                    alt="No jobs found"
                    style={{ maxWidth: '150px', opacity: 0.7 }}
                    className="mb-3 img-fluid"
                  />
                  <h5 className="fs-5 fs-md-4">No jobs match your filters</h5>
                  <p className="text-muted fs-7 fs-md-6 mb-3">Try adjusting your search criteria</p>
                  <Button variant="outline-primary" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover bordered striped className="mb-0 align-middle table-sm">
                      <thead className="table-light">
                        <tr>
                          <th className="fs-7 fs-sm-6 fs-md-5">Job Title</th>
                          <th className="text-center fs-7 fs-sm-6 fs-md-5">Applies</th>
                          <th className="fs-7 fs-sm-6 fs-md-5 d-none d-md-table-cell">Posted on</th>
                          <th className="fs-7 fs-sm-6 fs-md-5">Status</th>
                          <th className="text-end fs-7 fs-sm-6 fs-md-5">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobs.map((job) => (
                          <tr key={job._id}>
                            <td className="align-middle">
                              <div className="fw-semibold fs-7 fs-sm-6">{job.jobTitle}</div>
                              <small className="text-muted fs-8 fs-sm-7 d-none d-md-block">
                                {job.description && job.description.substring(0, 50)}...
                              </small>
                            </td>
                            <td className="text-center align-middle">
                              <Button
                                variant="link"
                                onClick={() => handleViewResponses(job._id)}
                                className="p-0"
                                disabled={job.applications === 0}
                              >
                                <Badge
                                  bg={job.applications > 0 ? 'primary' : 'secondary'}
                                  pill
                                  className="fs-8 fs-sm-7"
                                >
                                  {job.applications || 0}
                                </Badge>
                              </Button>
                            </td>
                            <td className="fs-7 fs-sm-6 d-none d-md-table-cell align-middle">
                              {new Date(job.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="align-middle">
                              <Badge
                                bg={
                                  job.status === 'active'
                                    ? 'success'
                                    : job.status === 'paused'
                                      ? 'warning'
                                      : job.status === 'closed'
                                        ? 'secondary'
                                        : 'light'
                                }
                                className="text-capitalize fs-7 fs-sm-6"
                              >
                                {job.status}
                              </Badge>
                            </td>
                            <td className="text-end align-middle">
                              <div className="dropdown dropup position-static d-inline-block">
                                <button
                                  className="btn btn-sm btn-outline-secondary fs-7 fs-sm-6"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-label="Actions"
                                >
                                  <span className="d-none d-sm-inline">Actions</span>
                                  <span className="d-inline d-sm-none">•••</span>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end fs-7 fs-sm-6" data-bs-display="static" style={{ zIndex: 2000, minWidth: '220px' }}>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() => handleViewResponses(job._id)}
                                      disabled={job.applications === 0 || actionLoading === job._id}
                                    >
                                      <span className="d-none d-md-inline">View Responses ({job.applications || 0})</span>
                                      <span className="d-inline d-md-none">View ({job.applications || 0})</span>
                                    </button>
                                  </li>

                                  {job.status === 'active' && (
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => handleStatusChange(job._id, 'paused')}
                                        disabled={actionLoading === job._id}
                                      >
                                        {actionLoading === job._id ? (
                                          <Spinner size="sm" animation="border" />
                                        ) : (
                                          <span className="d-none d-md-inline">Pause Job</span>
                                        )}
                                      </button>
                                    </li>
                                  )}
                                  {job.status === 'paused' && (
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => handleStatusChange(job._id, 'active')}
                                        disabled={actionLoading === job._id}
                                      >
                                        {actionLoading === job._id ? (
                                          <Spinner size="sm" animation="border" />
                                        ) : (
                                          <span className="d-none d-md-inline">Activate Job</span>
                                        )}
                                      </button>
                                    </li>
                                  )}
                                  {job.status === 'closed' && (
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => handleStatusChange(job._id, 'active')}
                                        disabled={actionLoading === job._id}
                                      >
                                        {actionLoading === job._id ? (
                                          <Spinner size="sm" animation="border" />
                                        ) : (
                                          <span className="d-none d-md-inline">Reopen Job</span>
                                        )}
                                      </button>
                                    </li>
                                  )}

                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item text-danger"
                                      onClick={() => handleDelete(job._id)}
                                      disabled={actionLoading === job._id}
                                    >
                                      {actionLoading === job._id ? (
                                        <Spinner size="sm" animation="border" />
                                      ) : (
                                        <span className="d-none d-md-inline">Delete Job</span>
                                      )}
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

                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3">
                    <div className="text-muted mb-2 mb-md-0 fs-7 fs-md-6">
                      Showing {filteredJobs.length} of {jobs.length} jobs
                    </div>
                    <Pagination size="sm" className="mb-0">
                      <Pagination.Prev disabled />
                      <Pagination.Item active>{1}</Pagination.Item>
                      <Pagination.Next disabled />
                    </Pagination>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManageJobs;