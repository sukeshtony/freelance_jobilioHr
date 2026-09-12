import React, { useState, useEffect } from 'react';
import {
  Card, Button, Form, InputGroup, ListGroup, Pagination,
  Spinner, Alert, Badge, Row, Col, Container
} from 'react-bootstrap';
import {
  Search, Filter, XCircle, Download, Person, Calendar,
  Briefcase, Star, StarFill, Eye, FileEarmarkText
} from 'react-bootstrap-icons';
import API from '../../api';
import { API_BASE_URL } from '../../api';

const SearchResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    experience: 'all'
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchResumes = async () => {
      setLoading(true);
      try {
        const res = await API.get('/api/applications/company', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.success) {
          setResumes(res.data.applications);
        }
      } catch (err) {
        console.error('Error fetching resumes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, [token]);

  const handleShortlist = async (applicationId) => {
    setActionLoading(applicationId);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.put(`/api/applications/${applicationId}/status`, {
        status: 'shortlisted'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setResumes((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status: 'shortlisted' } : app
          )
        );

        setMessage({
          type: 'success',
          text: '🎉 Candidate shortlisted successfully!'
        });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Error shortlisting:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to shortlist candidate';
      setMessage({
        type: 'danger',
        text: `❌ ${errorMessage}`
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnshortlist = async (applicationId) => {
    setActionLoading(applicationId);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.put(`/api/applications/${applicationId}/status`, {
        status: 'pending'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setResumes((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status: 'pending' } : app
          )
        );

        setMessage({
          type: 'success',
          text: '✅ Candidate removed from shortlist successfully!'
        });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Error unshortlisting:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to remove candidate from shortlist';
      setMessage({
        type: 'danger',
        text: `❌ ${errorMessage}`
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadResume = (resume) => {
    if (resume && resume.filename) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/uploads/${resume.filename}`;
      link.download = resume.originalName || 'resume.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'secondary', icon: '⏳', text: 'Pending' },
      'shortlisted': { variant: 'success', icon: '⭐', text: 'Shortlisted' },
      'rejected': { variant: 'danger', icon: '❌', text: 'Rejected' },
      'hired': { variant: 'primary', icon: '🎯', text: 'Hired' }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <Badge bg={config.variant} className="fs-6 px-3 py-2">
        {config.icon} {config.text}
      </Badge>
    );
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedFilters.status === 'all' || resume.status === selectedFilters.status;

    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <Container className="text-center py-5">
      <div className="d-flex flex-column align-items-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <h4 className="mt-3 text-muted">Loading amazing candidates...</h4>
      </div>
    </Container>
  );

  return (
    <Container fluid className="py-3 py-md-4 px-2 px-md-4 px-lg-5">
      {/* Header Section */}
      <div className="mb-3 mb-md-4">
        <Row className="align-items-center">
          <Col xs={12} md className="mb-2 mb-md-0">
            <h1 className="display-6 text-primary mb-2 fs-4 fs-md-3">
              <FileEarmarkText className="me-2 me-md-3" />
              Search Resumes
            </h1>
            <p className="text-muted fs-6 fs-md-5 mb-0">Discover talented candidates and manage applications</p>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row className="mb-3 mb-md-4 g-2 g-md-3">
        <Col xs={6} md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-2 p-md-4">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 mb-md-3" style={{ width: '40px', height: '40px' }}>
                <Person size={20} className="text-primary" />
              </div>
              <h2 className="text-primary mb-1 fs-5 fs-md-3">{filteredResumes.length}</h2>
              <p className="text-muted mb-0 fw-semibold fs-8 fs-md-6">Total Candidates</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-2 p-md-4">
              <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 mb-md-3" style={{ width: '40px', height: '40px' }}>
                <Star size={20} className="text-warning" />
              </div>
              <h2 className="text-warning mb-1 fs-5 fs-md-3">
                {filteredResumes.filter(r => r.status === 'shortlisted').length}
              </h2>
              <p className="text-muted mb-0 fw-semibold fs-8 fs-md-6">Shortlisted</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-2 p-md-4">
              <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 mb-md-3" style={{ width: '40px', height: '40px' }}>
                <Briefcase size={20} className="text-info" />
              </div>
              <h2 className="text-info mb-1 fs-5 fs-md-3">
                {filteredResumes.filter(r => r.status === 'pending').length}
              </h2>
              <p className="text-muted mb-0 fw-semibold fs-8 fs-md-6">Pending Review</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={6} lg={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body className="p-2 p-md-4">
              <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2 mb-md-3" style={{ width: '40px', height: '40px' }}>
                <Eye size={20} className="text-success" />
              </div>
              <h2 className="text-success mb-1 fs-5 fs-md-3">
                {filteredResumes.filter(r => r.resume).length}
              </h2>
              <p className="text-muted mb-0 fw-semibold fs-8 fs-md-6">With Resume</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alert Messages */}
      {message.text && (
        <Alert variant={message.type} className="mb-3 mb-md-4 shadow-sm py-2 py-md-3" dismissible>
          <span className="fs-6 fs-md-5">{message.text}</span>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm mb-3 mb-md-4">
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={8}>
              <div className="d-flex">
                <InputGroup size="lg" className="shadow-sm">
                  <InputGroup.Text className="bg-white border-end-0">
                    <Search className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by candidate name or email..."
                    className="border-start-0"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" size="lg" className="px-2 px-md-4">
                    <span className="d-none d-sm-inline">Search</span>
                    <span className="d-inline d-sm-none">Go</span>
                  </Button>
                </InputGroup>
              </div>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select
                size="lg"
                value={selectedFilters.status}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                className="shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Section */}
      <div>
        <div className="mb-3 mb-md-4">
          <h4 className="text-dark mb-0 fs-6 fs-md-4">
            <Star className="me-2 text-warning" />
            {filteredResumes.length} Matching Profiles
          </h4>
        </div>

        {filteredResumes.length === 0 ? (
          <Card className="text-center py-4 py-md-5 border-0 shadow-sm">
            <Card.Body>
              <XCircle size={40} className="text-muted mb-3" />
              <h4 className="fs-5 fs-md-4">No matching candidates found</h4>
              <p className="text-muted fs-7 fs-md-6">Try adjusting your search criteria or filters</p>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-2 g-md-4">
            {filteredResumes.map(resume => (
              <Col xs={12} sm={6} lg={4} xl={3} key={resume._id}>
                <Card className="h-100 border-0 shadow-sm hover-shadow overflow-hidden">
                  <Card.Body className="p-3 p-md-3 d-flex flex-column">
                    {/* Header */}
                    <div className="d-flex align-items-start mb-3">
                      <div className="position-relative me-3 flex-shrink-0">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold fs-5" style={{ width: '45px', height: '45px' }}>
                          {resume.userName.split(' ').map(n => n[0]).join('')}
                        </div>
                        {resume.status === 'shortlisted' && (
                          <div className="position-absolute top-0 start-100 translate-middle">
                            <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '18px', height: '18px' }}>
                              <StarFill className="text-white" size={8} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <h5 className="mb-1 fw-bold text-dark fs-6 text-truncate">
                          {resume.userName}
                        </h5>
                        <p className="text-muted mb-0 small text-truncate" style={{ fontSize: '0.8rem' }}>
                          {resume.email}
                        </p>
                      </div>
                    </div>

                    {/* Status and Date */}
                    <div className="mb-3">
                      {getStatusBadge(resume.status)}
                      <small className="text-muted d-block mt-2" style={{ fontSize: '0.8rem' }}>
                        <Calendar className="me-1" size={12} />
                        Applied {new Date(resume.appliedAt).toLocaleDateString()}
                      </small>
                    </div>

                    {/* Actions - pushed to bottom with margin-top auto */}
                    <div className="mt-auto">
                      {resume.resume && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100 mb-2"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => handleDownloadResume(resume.resume)}
                        >
                          <Download className="me-1" size={14} />
                          <span className="d-none d-sm-inline">Download Resume</span>
                          <span className="d-inline d-sm-none">Download</span>
                        </Button>
                      )}

                      {resume.status === 'shortlisted' ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="w-100"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => handleUnshortlist(resume._id)}
                          disabled={actionLoading === resume._id}
                        >
                          {actionLoading === resume._id ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <>
                              <Star className="me-1" size={14} />
                              <span className="d-none d-sm-inline">Remove from Shortlist</span>
                              <span className="d-inline d-sm-none">Remove</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="w-100"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => handleShortlist(resume._id)}
                          disabled={actionLoading === resume._id}
                        >
                          {actionLoading === resume._id ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <>
                              <Star className="me-1" size={14} />
                              <span className="d-none d-sm-inline">Shortlist</span>
                              <span className="d-inline d-sm-none">Short</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {filteredResumes.length > 0 && (
          <div className="d-flex justify-content-center mt-3 mt-md-5">
            <Pagination className="shadow-sm">
              <Pagination.Prev disabled />
              <Pagination.Item active>{1}</Pagination.Item>
              <Pagination.Next disabled />
            </Pagination>
          </div>
        )}
      </div>
    </Container>
  );
};

export default SearchResumes;