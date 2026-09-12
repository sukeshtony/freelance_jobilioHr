import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Modal, Form, Badge, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import { FaSearch, FaUser, FaEnvelope, FaBriefcase, FaStar, FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaUserTie } from 'react-icons/fa';
import { Eye, EyeSlash } from 'react-bootstrap-icons'; // Make sure to install react-bootstrap-icons if not already
import API from '../../api';
import { useNavigate } from 'react-router-dom';

const Interviewers = () => {
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalShow, setModalShow] = useState(false);
  const [edit, setEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    skills: '',
    category: '',
    rating: '',
    password: '', // ✅ new field
  });


  const [filters, setFilters] = useState({
    name: '',
    email: '',
    title: '',
    category: '',
    skills: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/interviewers');
      const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setList(sortedData);
      setFilteredList(sortedData);
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const { name, email, title, category, skills } = filters;
    const filtered = list.filter(iv =>
      iv.name?.toLowerCase().includes(name.toLowerCase()) &&
      iv.email?.toLowerCase().includes(email.toLowerCase()) &&
      iv.title?.toLowerCase().includes(title.toLowerCase()) &&
      iv.category?.toLowerCase().includes(category.toLowerCase()) &&
      iv.skills?.some(skill =>
        skill.toLowerCase().includes(skills.toLowerCase())
      )
    );
    setFilteredList(filtered);
  }, [filters, list]);

  const openModal = iv => {
    setSelected(iv);
    setForm({
      name: iv?.name || '',
      email: iv?.email || '',
      title: iv?.title || '',
      skills: iv?.skills?.join(', ') || '',
      category: iv?.category || '',
      avatar: iv?.avatar || '',
      password: '', // always blank on edit or add
    });
    setEdit(!!iv);
    setModalShow(true);
  };


  const handleSave = async () => {
    const payload = {
      ...form,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (edit) {
      if (form.password.trim() !== '') {
        payload.password = form.password;
      } else {
        delete payload.password;
      }
    }


    try {
      if (edit) {
        await API.put(`/api/admin/interviewers/${selected._id}`, payload);
      } else {
        await API.post('/api/admin/interviewers', payload);
      }
      setModalShow(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };


  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this interviewer?')) return;
    try {
      await API.delete(`/api/admin/interviewers/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting interviewer:', error);
    }
  };

  const getRatingBadge = (rating) => {
    if (!rating) return <Badge bg="secondary">N/A</Badge>;
    if (rating >= 4.5) return <Badge bg="success">{rating} ★</Badge>;
    if (rating >= 3.5) return <Badge bg="primary">{rating} ★</Badge>;
    if (rating >= 2.5) return <Badge bg="warning" text="dark">{rating} ★</Badge>;
    return <Badge bg="danger">{rating} ★</Badge>;
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
              <FaUserTie className="me-2" /> Interviewer Management
            </h4>
            <small className="text-muted">Manage all interviewers and their profiles</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant={showFilters ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaSearch className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openModal(null)}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-1" /> Add Interviewer
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3">
            <Row className="g-2">
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaUser /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Name"
                    value={filters.name}
                    onChange={e => setFilters({ ...filters, name: e.target.value })}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Email"
                    value={filters.email}
                    onChange={e => setFilters({ ...filters, email: e.target.value })}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaBriefcase /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Title"
                    value={filters.title}
                    onChange={e => setFilters({ ...filters, title: e.target.value })}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaStar /></InputGroup.Text>
                  <Form.Select
                    value={filters.category}
                    onChange={e => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="">All Categories</option>
                    <option value="IT">IT</option>
                    <option value="Non-IT">Non-IT</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaUserTie /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Skills"
                    value={filters.skills}
                    onChange={e => setFilters({ ...filters, skills: e.target.value })}
                  />
                </InputGroup>
              </Col>
            </Row>
          </div>
        )}
      </Card.Header>

      <Card.Body className="p-0">
        {filteredList.length === 0 ? (
          <div className="text-center py-5">
            <img
              src="/empty-interviewers.svg"
              alt="No interviewers found"
              style={{ height: '150px', opacity: 0.7 }}
              className="mb-3"
            />
            <h5 className="text-muted">No interviewers found</h5>
            <p className="text-muted">Try adjusting your search filters</p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setFilters({
                  name: '',
                  email: '',
                  title: '',
                  category: '',
                  skills: ''
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
                  <th style={{ width: '60px' }}></th>
                  <th>Interviewer</th>
                  <th>Contact</th>
                  <th>Expertise</th>
                  <th>Rating</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(iv => (
                  <tr key={iv._id}>
                    <td>
                      {iv.avatar ? (
                        <img
                          src={iv.avatar}
                          alt="avatar"
                          width={40}
                          height={40}
                          className="rounded-circle"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#0d6efd',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}
                        >
                          {iv.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{iv.name}</div>
                      <small className="text-muted">{iv.title}</small>
                    </td>
                    <td>
                      <a href={`mailto:${iv.email}`} className="text-primary d-block">
                        {iv.email}
                      </a>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {iv.skills?.map(skill => (
                          <Badge key={skill} bg="light" text="dark" className="fw-normal">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <small className="text-muted d-block mt-1">{iv.category}</small>
                    </td>
                    <td>
                      {getRatingBadge(iv.rating)}
                      <div className="text-muted small">
                        {iv.interviewCount} interviews
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {iv.availability?.map(day => (
                          <Badge key={day} bg="info" className="fw-normal">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => openModal(iv)}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleDelete(iv._id)}
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

      {filteredList.length > 0 && (
        <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Showing <strong>{filteredList.length}</strong> of <strong>{list.length}</strong> interviewers
          </small>
        </Card.Footer>
      )}

      {/* Add/Edit Modal */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <FaUserTie className="me-2" /> {edit ? 'Edit' : 'Add'} Interviewer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <h6 className="mb-3 text-primary fw-bold">Basic Information</h6>
              <Form.Group className="mb-3">
                <Form.Label>Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Professional Title *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="E.g. Senior Software Engineer"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                </Form.Select>
              </Form.Group>

              {/* Password field only when adding */}
              <Form.Group className="mb-3">
                <Form.Label>
                  {edit ? 'New Password (leave blank to keep existing)' : 'Password *'}
                </Form.Label>
                <div style={{ position: 'relative' }}>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder={edit ? 'Leave blank to keep current password' : 'Enter password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </div>
                </div>
              </Form.Group>

            </Col>
            <Col md={6}>
              <h6 className="mb-3 text-primary fw-bold">Professional Details</h6>
              <Form.Group className="mb-3">
                <Form.Label>Skills (comma separated) *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="E.g. JavaScript, React, Node.js"
                  value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="rating">
                <Form.Label>Rating</Form.Label>
                <Form.Control
                  type="number"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="Enter rating out of 5"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setModalShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {edit ? 'Update Interviewer' : 'Add Interviewer'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Card>
  );
};

export default Interviewers;