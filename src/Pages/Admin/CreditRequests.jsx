import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Badge, 
  Modal, 
  Form, 
  Alert, 
  Spinner,
  Container,
  Row,
  Col,
  InputGroup
} from 'react-bootstrap';
import { 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSync, 
  FaInfoCircle,
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaCreditCard,
  FaClipboard,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import API from '../../api';

const CreditRequests = () => {
  const [creditRequests, setCreditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchCreditRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await API.get('/api/admin/credit-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out deleted users (where username is "N/A") immediately
      const filteredData = response.data.filter(request => 
        request.userId?.username !== 'N/A' && 
        request.userId?.username !== undefined
      );
      setCreditRequests(filteredData);
      setError('');
    } catch (err) {
      console.error('Error fetching credit requests:', err);
      setError('Failed to fetch credit requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditRequests();
  }, []);

  const handleShowModal = (requestId) => {
    setSelectedRequest(creditRequests.find(req => req._id === requestId));
    setShowModal(true);
  };

  const handleSubmitDecision = async (status) => {
    if (!selectedRequest) return;

    try {
      setProcessingAction(status === 'approved' ? 'approve' : 'reject');
      const token = localStorage.getItem('token');
      await API.put(`/api/admin/credit-requests/${selectedRequest._id}`, {
        status,
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCreditRequests(prev => prev.map(req => 
        req._id === selectedRequest._id 
          ? { ...req, status, adminNotes, approvedAt: new Date() }
          : req
      ));

      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating credit request:', err);
      setError('Failed to process request. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredRequests = creditRequests.filter(request => {
    // Skip deleted users (marked with N/A)
    if (request.userId?.username === 'N/A') return false;
    
    const matchesSearch = request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         request.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const variants = {
      pending: { bg: 'warning', icon: <FaInfoCircle />, text: 'Pending' },
      approved: { bg: 'success', icon: <FaCheck />, text: 'Approved' },
      rejected: { bg: 'danger', icon: <FaTimes />, text: 'Rejected' }
    };
    
    const { bg, icon, text } = variants[status] || { bg: 'secondary', icon: null, text: 'Unknown' };
    
    return (
      <Badge bg={bg} className="d-flex align-items-center gap-2 py-2 px-3 rounded-pill">
        {icon} {text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading credit requests...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
              <FaCreditCard className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="fw-bold mb-1">Credit Requests</h2>
              <p className="text-muted mb-0">Review and manage user credit requests</p>
            </div>
          </div>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-lg">
        <Card.Header className="bg-white border-0 py-3">
          <Row className="align-items-center g-3">
            <Col md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by email, name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} lg={3}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaFilter className="text-muted" />
                </InputGroup.Text>
                <Form.Select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border-start-0"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={12} lg={5} className="d-flex justify-content-lg-end">
              <Button 
                variant="outline-primary"
                className="d-flex align-items-center"
                onClick={fetchCreditRequests}
                disabled={loading}
              >
                <FaSync className={`me-2 ${loading ? 'spin' : ''}`} />
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-5">
              <img 
                src="/images/empty-state.svg" 
                alt="No requests" 
                style={{ width: '180px', opacity: 0.7 }}
                className="mb-4"
              />
              <h5 className="text-muted mb-2">
                {creditRequests.some(r => r.userId?.username === 'N/A') 
                  ? 'No active credit requests found (deleted users hidden)' 
                  : 'No credit requests found'}
              </h5>
              <p className="text-muted mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'When users request credits, they will appear here'}
              </p>
              {(searchTerm || filterStatus !== 'all') && (
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="text-center" style={{ width: '30%' }}>User</th>
                    <th className="text-center" style={{ width: '30%' }}>Request Details</th>
                    <th className="text-center" style={{ width: '15%' }}>Status</th>
                    <th className="text-center" style={{ width: '15%' }}>Dates</th>
                    <th className="text-center" style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(request => (
                    <tr key={request._id}>
                      <td>
                        <div className="d-flex flex-column align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 mb-2">
                            <FaUser className="text-primary" size={16} />
                          </div>
                          <div className="text-center">
                            <h6 className="mb-1 fw-semibold">{request.userId?.username || 'N/A'}</h6>
                            <p className="text-muted small mb-0">{request.userEmail}</p>
                            {request.phone && (
                              <p className="text-muted small mb-0">
                                <FaPhone className="me-1" /> {request.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column align-items-center">
                          <div className="bg-info bg-opacity-10 rounded-circle p-2 mb-2">
                            <FaCreditCard className="text-info" size={16} />
                          </div>
                          <div className="text-center">
                            <h6 className="mb-1 fw-semibold">{request.creditsRequested} Credits</h6>
                            <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                              <FaClipboard className="me-1" /> {request.reason}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column align-items-center">
                          {getStatusBadge(request.status)}
                          {request.status !== 'pending' && request.approvedBy?.username && (
                            <p className="small text-muted mt-2 mb-0">By: {request.approvedBy.username}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column align-items-center">
                          <div className="bg-secondary bg-opacity-10 rounded-circle p-2 mb-2">
                            <FaCalendarAlt className="text-secondary" size={16} />
                          </div>
                          <div className="text-center">
                            <p className="mb-1 small">
                              <strong>Requested:</strong> {formatDate(request.createdAt)}
                            </p>
                            {request.approvedAt && (
                              <p className="mb-0 small">
                                <strong>Processed:</strong> {formatDate(request.approvedAt)}
                              </p>
                            )}
                          </div>
                          </div>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleShowModal(request._id)}
                        >
                          <FaEye className="me-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Request Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
              <FaCreditCard className="text-primary" />
            </div>
            <div>
              Credit Request Details
              {selectedRequest && (
                <p className="text-muted small mb-0">Request ID: {selectedRequest._id.substring(0, 8)}</p>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-0">
          {selectedRequest && (
            <Row>
              <Col md={6}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <span className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                        <FaUser className="text-primary" />
                      </span>
                      User Information
                    </h6>
                    <div className="ps-4">
                      <div className="mb-3">
                        <p className="small text-muted mb-1">Name</p>
                        <p className="mb-0 fw-semibold">{selectedRequest.userId?.username || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <p className="small text-muted mb-1">Email</p>
                        <p className="mb-0 fw-semibold">{selectedRequest.userEmail}</p>
                      </div>
                      <div>
                        <p className="small text-muted mb-1">Phone</p>
                        <p className="mb-0 fw-semibold">{selectedRequest.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <span className="bg-info bg-opacity-10 rounded-circle p-2 me-2">
                        <FaCreditCard className="text-info" />
                      </span>
                      Request Information
                    </h6>
                    <div className="ps-4">
                      <div className="mb-3">
                        <p className="small text-muted mb-1">Credits Requested</p>
                        <p className="mb-0 fw-semibold">
                          <Badge bg="info" className="py-2 px-3">
                            {selectedRequest.creditsRequested}
                          </Badge>
                        </p>
                      </div>
                      <div className="mb-3">
                        <p className="small text-muted mb-1">Status</p>
                        <p className="mb-0">{getStatusBadge(selectedRequest.status)}</p>
                      </div>
                      <div>
                        <p className="small text-muted mb-1">Requested On</p>
                        <p className="mb-0 fw-semibold">{formatDate(selectedRequest.createdAt)}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={12}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <span className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
                        <FaClipboard className="text-warning" />
                      </span>
                      Request Reason
                    </h6>
                    <div className="ps-4">
                      <div className="border rounded p-3 bg-light">
                        {selectedRequest.reason}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              {selectedRequest.adminNotes && (
                <Col md={12}>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                      <h6 className="fw-bold mb-3 d-flex align-items-center">
                        <span className="bg-secondary bg-opacity-10 rounded-circle p-2 me-2">
                          <FaInfoCircle className="text-secondary" />
                        </span>
                        Admin Notes
                      </h6>
                      <div className="ps-4">
                        <div className="border rounded p-3 bg-light">
                          {selectedRequest.adminNotes}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              
              {selectedRequest.status === 'pending' && (
                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="fw-bold mb-3 d-flex align-items-center">
                        <span className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                          <FaClipboard className="text-primary" />
                        </span>
                        Add Admin Notes
                      </h6>
                      <div className="ps-4">
                        <Form.Group>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Enter notes about this request (visible to user)..."
                            className="border-2"
                          />
                          <Form.Text className="text-muted">
                            These notes will be visible to the user and included in any approval/rejection notification.
                          </Form.Text>
                        </Form.Group>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="light" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button
                variant="success"
                className="d-flex align-items-center"
                onClick={() => handleSubmitDecision('approved')}
                disabled={processingAction === 'reject'}
              >
                {processingAction === 'approve' ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <FaCheck className="me-2" /> Approve Request
                  </>
                )}
              </Button>
              <Button
                variant="danger"
                className="d-flex align-items-center"
                onClick={() => handleSubmitDecision('rejected')}
                disabled={processingAction === 'approve'}
              >
                {processingAction === 'reject' ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <FaTimes className="me-2" /> Reject Request
                  </>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
      
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .table-responsive {
          min-height: 300px;
        }
        .card {
          border-radius: 12px;
        }
        .badge {
          font-weight: 500;
        }
        .table th {
          border-top: none;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }
        .table td {
          vertical-align: middle;
          padding: 1rem;
          border-top: 1px solid #f0f2f5;
        }
        .table tr:hover {
          background-color: #f8f9fa;
        }
        .modal-header .close {
          padding: 1rem 1rem;
          margin: -1rem -1rem -1rem auto;
        }
        .rounded-lg {
          border-radius: 16px !important;
        }

        /* Force icon container to be circular */
        .rounded-circle {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% !important;
        }

        /* Optional: make all icon containers consistent size */
        .icon-circle-sm {
          width: 40px;
          height: 40px;
        }
      `}</style>
    </Container>
  );
};

export default CreditRequests;