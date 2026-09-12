import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Form, Modal, Spinner, Alert, 
  Container, Card, InputGroup, Badge, Row, Col, Collapse
} from 'react-bootstrap';
import { 
  Search, Filter, XCircle, Calendar as CalendarIcon,
  Person, Mailbox, CheckCircle, Clock, PersonCheck
} from 'react-bootstrap-icons';
import API from '../../api';

function AdminCallBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    date: '',
    status: '',
    expert: ''
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/bookings');
      setBookings(res.data);
      setFilteredBookings(res.data);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const res = await API.get('/api/admin/interviewers');
      setInterviewers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchInterviewers();
  }, []);

  useEffect(() => {
    const filtered = bookings.filter(booking => {
      return (
        booking.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        booking.email.toLowerCase().includes(filters.email.toLowerCase()) &&
        (filters.date === '' || new Date(booking.date).toISOString().split('T')[0] === filters.date) &&
        (filters.status === '' || booking.status.toLowerCase() === filters.status.toLowerCase()) &&
        (filters.expert === '' || (booking.expert && booking.expert.toLowerCase().includes(filters.expert.toLowerCase())))
      );
    });
    setFilteredBookings(filtered);
  }, [filters, bookings]);

  const handleEdit = (booking) => {
    setForm({ ...booking });
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/api/admin/bookings/${form._id}`, form);
      setShowModal(false);
      fetchBookings();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await API.delete(`/api/admin/bookings/${id}`);
      fetchBookings();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      email: '',
      date: '',
      status: '',
      expert: ''
    });
  };

  if (loading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2">Loading bookings...</p>
    </div>
  );

  return (
    <Container fluid className="py-4 px-4">
      <Card className="shadow border-0">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 fw-bold">Call Bookings</h2>
              <small className="text-muted">Manage all scheduled calls</small>
            </div>
            <Badge pill bg="light" text="dark" className="fs-6">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'Booking' : 'Bookings'}
            </Badge>
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
                <Filter className="me-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              {Object.values(filters).some(Boolean) && (
                <Button 
                  variant="link" 
                  onClick={resetFilters}
                  className="text-danger p-0 d-flex align-items-center"
                >
                  <XCircle className="me-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <Collapse in={showFilters}>
              <div>
                <Row className="g-3">
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Person />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Filter by name"
                        name="name"
                        value={filters.name}
                        onChange={(e) => setFilters({...filters, name: e.target.value})}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Mailbox />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Filter by email"
                        name="email"
                        value={filters.email}
                        onChange={(e) => setFilters({...filters, email: e.target.value})}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <CalendarIcon />
                      </InputGroup.Text>
                      <Form.Control
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={(e) => setFilters({...filters, date: e.target.value})}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      name="status"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <PersonCheck />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Filter by expert"
                        name="expert"
                        value={filters.expert}
                        onChange={(e) => setFilters({...filters, expert: e.target.value})}
                      />
                    </InputGroup>
                  </Col>
                </Row>
              </div>
            </Collapse>
          </div>

          {/* Bookings Table */}
          {error && <Alert variant="danger">{error}</Alert>}

          {filteredBookings.length === 0 ? (
            <div className="text-center py-5 bg-light rounded">
              <Search size={48} className="text-muted mb-3" />
              <h5>No bookings found</h5>
              <p className="text-muted">
                {bookings.length === 0 
                  ? 'No bookings have been scheduled yet.'
                  : 'No bookings match your filters.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Expert</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <Person className="text-primary" />
                          </div>
                          <span>{booking.name}</span>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${booking.email}`} className="text-decoration-none">
                          {booking.email}
                        </a>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <CalendarIcon className="text-muted me-2" />
                          {new Date(booking.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Clock className="text-muted me-2" />
                          {booking.time}
                        </div>
                      </td>
                      <td>{getStatusBadge(booking.status)}</td>
                      <td>{booking.expert || 'Not assigned'}</td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(booking)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(booking._id)}
                        >
                          Delete
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

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={form.date?.split('T')[0] || ''}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={form.status || 'scheduled'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign Expert</Form.Label>
              <Form.Select
                value={form.expert || ''}
                onChange={(e) => setForm({ ...form, expert: e.target.value })}
              >
                <option value="">Select expert</option>
                {interviewers.map((int) => (
                  <option key={int._id} value={int.name}>{int.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate}>Update Booking</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

function getStatusBadge(status) {
  switch ((status || '').toLowerCase()) {
    case 'completed': 
      return <Badge bg="success" className="d-flex align-items-center"><CheckCircle className="me-1" /> Completed</Badge>;
    case 'cancelled': 
      return <Badge bg="danger" className="d-flex align-items-center"><XCircle className="me-1" /> Cancelled</Badge>;
    case 'scheduled': 
      return <Badge bg="primary" className="d-flex align-items-center"><Clock className="me-1" /> Scheduled</Badge>;
    default: 
      return <Badge bg="secondary" className="d-flex align-items-center"><Clock className="me-1" /> Pending</Badge>;
  }
}

export default AdminCallBookings;