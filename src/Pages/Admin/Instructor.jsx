import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Modal, Form, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { FaSearch, FaUser, FaEnvelope, FaChalkboardTeacher, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import API from '../../api';
import { useNavigate } from 'react-router-dom';

const Instructors = () => {
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalShow, setModalShow] = useState(false);
  const [edit, setEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    about: '',
    field: 'IT',
    password: ''
  });

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    title: '',
    field: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/instructors');
      const sortedInstructors = res.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setList(sortedInstructors);
      setFilteredList(sortedInstructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const { name, email, title, field } = filters;
    const filtered = list.filter(instructor =>
      instructor.name?.toLowerCase().includes(name.toLowerCase()) &&
      instructor.email?.toLowerCase().includes(email.toLowerCase()) &&
      instructor.title?.toLowerCase().includes(title.toLowerCase()) &&
      instructor.field?.toLowerCase().includes(field.toLowerCase())
    );
    setFilteredList(filtered);
  }, [filters, list]);

  const openModal = (instructor) => {
    setSelected(instructor);
    setForm({
      name: instructor?.name || '',
      email: instructor?.email || '',
      title: instructor?.title || '',
      about: instructor?.about || '',
      field: instructor?.field || 'IT',
      password: ''
    });
    setEdit(!!instructor);
    setModalShow(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form
    };

    try {
      if (edit) {
        await API.put(`/api/admin/instructors/${selected._id}`, payload);
      } else {
        await API.post('/api/admin/instructors', payload);
      }
      setModalShow(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving instructor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instructor?')) return;
    try {
      await API.delete(`/api/admin/instructors/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting instructor:', error);
    }
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
              <FaChalkboardTeacher className="me-2" /> Instructor Management
            </h4>
            <small className="text-muted">Manage all instructors and their profiles</small>
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
              <FaPlus className="me-1" /> Add Instructor
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
                  <InputGroup.Text><FaChalkboardTeacher /></InputGroup.Text>
                  <Form.Control
                    placeholder="Filter by Title"
                    value={filters.title}
                    onChange={e => setFilters({ ...filters, title: e.target.value })}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaChalkboardTeacher /></InputGroup.Text>
                  <Form.Select
                    value={filters.field}
                    onChange={e => setFilters({ ...filters, field: e.target.value })}
                  >
                    <option value="">All Fields</option>
                    <option value="IT">IT</option>
                    <option value="Non-IT">Non-IT</option>
                  </Form.Select>
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
              src="/empty-instructors.svg"
              alt="No instructors found"
              style={{ height: '150px', opacity: 0.7 }}
              className="mb-3"
            />
            <h5 className="text-muted">No instructors found</h5>
            <p className="text-muted">Try adjusting your search filters</p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setFilters({
                  name: '',
                  email: '',
                  title: '',
                  field: ''
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
                  <th>Instructor</th>
                  <th>Contact</th>
                  <th>Title</th>
                  <th>Field</th>
                  <th>Assigned Courses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(instructor => (
                  <tr key={instructor._id}>
                    <td>
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
                        {instructor.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{instructor.name}</div>
                      <small className="text-muted">{instructor.about?.substring(0, 50)}{instructor.about?.length > 50 ? '...' : ''}</small>
                    </td>
                    <td>
                      <a href={`mailto:${instructor.email}`} className="text-primary d-block">
                        {instructor.email}
                      </a>
                    </td>
                    <td>
                      <div className="fw-semibold">{instructor.title}</div>
                    </td>
                    <td>
                      <Badge bg={instructor.field === 'IT' ? 'primary' : 'secondary'}>
                        {instructor.field}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {instructor.courses?.length > 0 ? (
                          instructor.courses.map(course => (
                            <Badge key={course._id} bg="light" text="dark" className="fw-normal">
                              {course.title}
                            </Badge>
                          ))
                        ) : (
                          <Badge bg="secondary" className="fw-normal">
                            No courses assigned
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => openModal(instructor)}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleDelete(instructor._id)}
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
            Showing <strong>{filteredList.length}</strong> of <strong>{list.length}</strong> instructors
          </small>
        </Card.Footer>
      )}

      {/* Add/Edit Modal */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <FaChalkboardTeacher className="me-2" /> {edit ? 'Edit' : 'Add'} Instructor
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
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={edit}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Title *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="E.g. Senior Developer, Professor"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Field *</Form.Label>
                <Form.Select
                  value={form.field}
                  onChange={e => setForm({ ...form, field: e.target.value })}
                  required
                >
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <h6 className="mb-3 text-primary fw-bold">Additional Information</h6>
              <Form.Group className="mb-3">
                <Form.Label>About</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Tell us about the instructor"
                  value={form.about}
                  onChange={e => setForm({ ...form, about: e.target.value })}
                />
              </Form.Group>
              {!edit && (
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
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
              )}
              {edit && (
                <Form.Group className="mb-3">
                  <Form.Label>New Password (leave blank to keep current)</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      minLength={6}
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
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setModalShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {edit ? 'Update Instructor' : 'Add Instructor'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default Instructors;