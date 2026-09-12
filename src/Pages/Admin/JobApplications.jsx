import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api';
import {API_BASE_URL} from '../../api'
import {
  Table, Spinner, Alert, Button, Card,
  Container, Badge, Row, Col, InputGroup, Collapse, ButtonGroup,
  Form, Modal
} from 'react-bootstrap';
import {
  Person, Envelope, Calendar, FileEarmarkPdf,
  Eye, ArrowLeft, Funnel, X, CheckCircle,
  Clock, XCircle, QuestionCircle
} from 'react-bootstrap-icons';

const JobApplications = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    status: ''
  });
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/api/jobs/admin/applications/${jobId}`);
        setApplications(res.data.applications);
        setJobTitle(res.data.jobTitle);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId]);

  const handleViewResume = (filename) => {
    if (!filename) {
      setError('No resume available for this application');
      return;
    }
    window.open(`${API_BASE_URL}/api/jobs/resumes/${filename}`, '_blank');
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      email: '',
      status: ''
    });
  };

  const filteredApplications = applications.filter(app => 
    (app.userName || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    (app.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
    (app.status || 'Pending').toLowerCase().includes(filters.status.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch((status || 'Pending').toLowerCase()) {
      case 'approved': return <Badge bg="success" className="d-flex align-items-center"><CheckCircle className="me-1" /> Approved</Badge>;
      case 'rejected': return <Badge bg="danger" className="d-flex align-items-center"><XCircle className="me-1" /> Rejected</Badge>;
      case 'pending': return <Badge bg="warning" text="dark" className="d-flex align-items-center"><Clock className="me-1" /> Pending</Badge>;
      default: return <Badge bg="secondary" className="d-flex align-items-center"><QuestionCircle className="me-1" /> {status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="d-flex align-items-center">
          <XCircle className="me-2" size={24} />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      <Card className="shadow border-0">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button variant="light" className="me-3" onClick={() => window.history.back()}>
                <ArrowLeft className="me-2" />
                Back
              </Button>
              <h2 className="d-inline-block mb-0">Job Applications</h2>
            </div>
            <Badge pill bg="light" text="dark" className="fs-6">
              {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
            </Badge>
          </div>
          <h4 className="mt-2 text-primary">{jobTitle}</h4>
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
                <Funnel className="me-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              {Object.values(filters).some(Boolean) && (
                <Button 
                  variant="link" 
                  onClick={resetFilters}
                  className="text-danger p-0 d-flex align-items-center"
                >
                  <X className="me-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <Collapse in={showFilters}>
              <Row className="g-3">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <Person />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Filter by name"
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text className="bg-light">
                      <Envelope />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Filter by email"
                      value={filters.email}
                      onChange={(e) => handleFilterChange('email', e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending">Pending</option>
                  </Form.Select>
                </Col>
              </Row>
            </Collapse>
          </div>

          {/* Applications Table */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-5 bg-light rounded">
              <FileEarmarkPdf size={48} className="text-muted mb-3" />
              <h5>No applications found</h5>
              <p className="text-muted">
                {applications.length === 0 
                  ? 'No applications have been submitted yet.'
                  : 'No applications match your filters.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Candidate</th>
                    <th>Email</th>
                    <th>Applied At</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <Person className="text-primary" />
                          </div>
                          <span className="fw-semibold">{app.userName || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${app.email}`} className="text-decoration-none">
                          {app.email || 'N/A'}
                        </a>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar className="text-muted me-2" />
                          {new Date(app.appliedAt).toLocaleString()}
                        </div>
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td className="text-end">
                        <ButtonGroup size="sm">
                          <Button
                            variant="outline-primary"
                            className="me-2"
                            onClick={() => {
                              setSelectedApp(app);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="me-1" /> Details
                          </Button>
                          <Button
                            variant="outline-success"
                            onClick={() => handleViewResume(app.resume?.filename)}
                            disabled={!app.resume?.filename}
                          >
                            <FileEarmarkPdf className="me-1" /> Resume
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Application Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Application Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApp && (
            <div className="row">
              <div className="col-md-6">
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <Person size={24} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">{selectedApp.userName || 'N/A'}</h5>
                      <p className="text-muted mb-0">{selectedApp.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold mb-3">Application Information</h6>
                    <div className="d-flex mb-2">
                      <div className="me-4">
                        <p className="text-muted mb-1">Status</p>
                        <div>{getStatusBadge(selectedApp.status)}</div>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Applied On</p>
                        <p className="fw-semibold">
                          <Calendar className="me-2" />
                          {new Date(selectedApp.appliedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center">
                  <Button
                    variant="primary"
                    onClick={() => handleViewResume(selectedApp.resume?.filename)}
                    disabled={!selectedApp.resume?.filename}
                    className="d-flex align-items-center"
                  >
                    <FileEarmarkPdf className="me-2" />
                    {selectedApp.resume?.filename ? 'View Full Resume' : 'No Resume Available'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default JobApplications;