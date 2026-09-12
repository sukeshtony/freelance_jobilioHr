import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Modal, Form, Row, Col, Alert, InputGroup, Card, Badge } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrash, FaBuilding, FaUserTie, FaIdCard, FaCalendarAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import API from '../../api';

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    companyName: '',
    hrName: '',
    pan: '',
    createdAt: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, filters]);

  const fetchClients = async () => {
    try {
      const res = await API.get('/api/admin/clients');
      const sortedClients = (res.data.data || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setClients(sortedClients);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setLoading(false);
    }
  };


  const applyFilters = () => {
    const result = clients.filter(client => {
      const created = new Date(client.createdAt).toLocaleDateString();
      return (
        client.username.toLowerCase().includes(filters.username.toLowerCase()) &&
        client.email.toLowerCase().includes(filters.email.toLowerCase()) &&
        (client.company?.companyName || '').toLowerCase().includes(filters.companyName.toLowerCase()) &&
        (client.company?.hrName || '').toLowerCase().includes(filters.hrName.toLowerCase()) &&
        (client.company?.pan || '').toLowerCase().includes(filters.pan.toLowerCase()) &&
        (!filters.createdAt || created.includes(filters.createdAt))
      );
    });
    setFilteredClients(result);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this client and company?')) return;
    try {
      await API.delete(`/api/admin/clients/${userId}`);
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const handleShowModal = (client) => {
    setSelectedClient(client);
    setFormData({
      username: client.username || '',
      email: client.email || '',
      mobile: client.mobile || '',
      companyName: client.company?.companyName || '',
      hrName: client.company?.hrName || '',
      mobileNumber: client.company?.mobileNumber || '',
      pan: client.company?.pan || '',
      gst: client.company?.gst || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Client name is required';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.hrName.trim()) newErrors.hrName = 'HR name is required';
    if (!formData.mobileNumber || !/^\d{11}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Valid 11-digit company mobile required';
    if (!formData.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan)) newErrors.pan = 'Valid PAN format: 5 letters + 4 digits + 1 letter';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      await API.put(`/api/admin/clients/${selectedClient.userId}`, formData);
      setShowModal(false);
      fetchClients();
    } catch (err) {
      console.error('Error updating client:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white border-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0 fw-bold text-primary">
              <FaBuilding className="me-2" /> Client & Company Management
            </h4>
            <small className="text-muted">Manage all registered clients and their companies</small>
          </div>
          <div>
            <Button 
              variant={showFilters ? 'primary' : 'outline-primary'} 
              size="sm" 
              className="me-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaSearch className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={fetchClients}>
              Refresh
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3">
            <Row className="g-2">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text><FaUserTie /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Filter by Name" 
                    onChange={(e) => handleFilterChange('username', e.target.value)} 
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Filter by Email" 
                    onChange={(e) => handleFilterChange('email', e.target.value)} 
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text><FaBuilding /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Filter by Company" 
                    onChange={(e) => handleFilterChange('companyName', e.target.value)} 
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text><FaUserTie /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Filter by HR Name" 
                    onChange={(e) => handleFilterChange('hrName', e.target.value)} 
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text><FaIdCard /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Filter by PAN" 
                    onChange={(e) => handleFilterChange('pan', e.target.value)} 
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Filter by Date" 
                    onChange={(e) => handleFilterChange('createdAt', e.target.value)} 
                  />
                </InputGroup>
              </Col>
            </Row>
          </div>
        )}
      </Card.Header>

      <Card.Body className="p-0">
        {filteredClients.length === 0 ? (
          <div className="text-center py-5">
            <img 
              src="/empty-state.svg" 
              alt="No clients found" 
              style={{ height: '150px', opacity: 0.7 }} 
              className="mb-3"
            />
            <h5 className="text-muted">No clients found</h5>
            <p className="text-muted">Try adjusting your search filters</p>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setFilters({
                  username: '',
                  email: '',
                  companyName: '',
                  hrName: '',
                  pan: '',
                  createdAt: ''
                });
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>HR Details</th>
                  <th>Documents</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.userId}>
                    <td>
                      <div className="fw-semibold">{client.username}</div>
                      <small className="text-muted">ID: {client.userId}</small>
                    </td>
                    <td>
                      <div>
                        <a href={`mailto:${client.email}`} className="text-primary d-block">
                          {client.email}
                        </a>
                        {client.mobile && (
                          <a href={`tel:${client.mobile}`} className="text-decoration-none d-block">
                            {client.mobile}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{client.company?.companyName || '—'}</div>
                      {client.company?.mobileNumber && (
                        <div className="d-flex align-items-center">
                          <FaPhone className="me-1 text-muted" size={12} />
                          <small>{client.company.mobileNumber}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      {client.company?.hrName || '—'}
                    </td>
                    <td>
                      {client.company?.pan ? (
                        <Badge bg="light" text="dark" className="fw-normal">
                          PAN: {client.company.pan}
                        </Badge>
                      ) : '—'}
                      {client.company?.gst && (
                        <Badge bg="light" text="dark" className="fw-normal ms-1">
                          GST: {client.company.gst}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <small>{formatDate(client.createdAt)}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleShowModal(client)}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleDelete(client.userId)}
                        >
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {filteredClients.length > 0 && (
        <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing <strong>{filteredClients.length}</strong> of <strong>{clients.length}</strong> clients
          </small>
        </Card.Footer>
      )}

      {/* Update Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <FaEdit className="me-2" /> Update Client & Company
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger" className="mb-4">
              <strong>Please fix the following errors:</strong>
              <ul className="mb-0 mt-2">
                {Object.values(errors).map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
            </Alert>
          )}
          
          <h6 className="mb-3 text-primary fw-bold">Client Information</h6>
          <Row className="mb-4 g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Client Name *</Form.Label>
                <Form.Control 
                  placeholder="Enter client name" 
                  value={formData.username} 
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={errors.username ? 'is-invalid' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Enter email" 
                  value={formData.email} 
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'is-invalid' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mobile</Form.Label>
                <Form.Control 
                  placeholder="Enter mobile" 
                  value={formData.mobile} 
                  onChange={(e) => handleChange('mobile', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3 text-primary fw-bold">Company Information</h6>
          <Row className="mb-4 g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Company Name *</Form.Label>
                <Form.Control 
                  placeholder="Enter company name" 
                  value={formData.companyName} 
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className={errors.companyName ? 'is-invalid' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>HR Name *</Form.Label>
                <Form.Control 
                  placeholder="Enter HR name" 
                  value={formData.hrName} 
                  onChange={(e) => handleChange('hrName', e.target.value)}
                  className={errors.hrName ? 'is-invalid' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Company Mobile *</Form.Label>
                <Form.Control 
                  placeholder="Enter company mobile" 
                  value={formData.mobileNumber} 
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  className={errors.mobileNumber ? 'is-invalid' : ''}
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3 text-primary fw-bold">Legal Documents</h6>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>PAN Number *</Form.Label>
                <Form.Control 
                  placeholder="Enter PAN (e.g. ABCDE1234F)" 
                  value={formData.pan} 
                  onChange={(e) => handleChange('pan', e.target.value)}
                  className={errors.pan ? 'is-invalid' : ''}
                />
                <Form.Text className="text-muted">
                  Format: 5 letters + 4 digits + 1 letter
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>GST Number</Form.Label>
                <Form.Control 
                  placeholder="Enter GST (optional)" 
                  value={formData.gst} 
                  onChange={(e) => handleChange('gst', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AdminClients;