import React, { useEffect, useState } from 'react';
import {
    Card, Table, Spinner, Button, Container, Form, Row, Col, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { API_BASE_URL } from '../../api';
import { FiPlus, FiTrash2, FiEye, FiUsers, FiFileText } from 'react-icons/fi';
import { BsStarFill, BsFilter } from 'react-icons/bs'

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ title: '', category: '', instructor: '', field: '', status: '' });

    const navigate = useNavigate();
    const instructorId = localStorage.getItem('id');
    const token = localStorage.getItem('token');

    const fetchCourses = async () => {
        if (!instructorId) {
            console.error('Instructor ID not found');
            return;
        }

        try {
            const res = await API.get(`/api/admin/instructors/${instructorId}/courses`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const coursesWithInstructor = res.data.map(course => ({
                ...course,
                instructor: course.instructorDetails || { name: 'You' }
            }));

            setCourses(coursesWithInstructor);
            setFilteredCourses(coursesWithInstructor);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to fetch instructor courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        const { title, category, instructor, field, status } = filters;
        const filtered = courses.filter(course => {
            const matchTitle = course.title?.toLowerCase().includes(title.toLowerCase());
            const matchCategory = course.category?.toLowerCase().includes(category.toLowerCase());
            const matchField = field === '' || course.field === field;
            const matchStatus = status === '' ||
                (status === 'active' && !course.isPaused) ||
                (status === 'paused' && course.isPaused);

            return matchTitle && matchCategory && matchField && matchStatus;
        });
        setFilteredCourses(filtered);
    }, [filters, courses]);



    return (
        <Container fluid className="px-4 py-4">
            {/* Courses Table Section */}
            <Card className="border-0 shadow-lg mb-4">
                <Card.Header className="bg-white border-0 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-dark">Course Management</h5>
                        <div className="d-flex align-items-center">
                            <BsFilter className="me-2 text-primary" size={20} />
                            <span className="text-muted small">Showing {filteredCourses.length} courses</span>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom">
                        <Row className="g-2 mb-3">
                            <Col md={3}>
                                <Form.Control
                                    placeholder="Course title"
                                    value={filters.title}
                                    onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                                    size="sm"
                                />
                            </Col>
                            <Col md={2}>
                                <Form.Control
                                    placeholder="Category"
                                    value={filters.category}
                                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    size="sm"
                                />
                            </Col>
                            <Col md={2}>
                                <Form.Select
                                    value={filters.field}
                                    onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))}
                                    size="sm"
                                >
                                    <option value="">All Fields</option>
                                    <option value="IT">IT</option>
                                    <option value="Non-IT">Non-IT</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    size="sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                </Form.Select>
                            </Col>
                            <Col md={1}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setFilters({ title: '', category: '', instructor: '', field: '', status: '' })}
                                    size="sm"
                                    className="w-100"
                                >
                                    Clear
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-5">
                            <img src="/empty-state.svg" alt="No courses" style={{ width: '200px', opacity: 0.7 }} />
                            <h5 className="mt-3 text-muted">No matching courses found</h5>
                            <Button variant="outline-primary" size="sm" className="mt-2">
                                Reset Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="text-nowrap ps-4">Course</th>
                                        <th>Category</th>
                                        <th>Field</th>
                                        <th>Students</th>
                                        <th>Rating</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses.map(course => (
                                        <tr key={course._id} className="align-middle">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    {course.image && (
                                                        <img
                                                        src={`${API_BASE_URL}${course.image}`}
                                                        alt={course.title}
                                                            className="rounded me-3"
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <div>
                                                        <h6 className="mb-0 fw-semibold">{course.title}</h6>
                                                        <small className="text-muted">{course.lessons?.length || 0} lessons</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark" className="text-uppercase">
                                                    {course.category}
                                                </Badge>
                                            </td>
                                            <td>{course.field}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <FiUsers className="me-1 text-primary" />
                                                    <span>{course.students || 0}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <BsStarFill className="me-1 text-warning" />
                                                    <span>{course.rating || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={course.isPaused ? "danger" : "success"} className="text-uppercase">
                                                    {course.isPaused ? 'Paused' : 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => navigate(`/instructor/details/${course._id}`)}                                                >
                                                    <FiEye className="me-1" /> View
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => navigate(`/instructor/details/${course._id}/test`)}
                                                >
                                                    <FiFileText className="me-1" /> Test
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => navigate(`/instructor/details/${course._id}/students`, { state: { courseTitle: course.title } })}
                                                >
                                                    <FiUsers className="me-1" /> Students
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

            {/* Custom Styles */}
            <style>{`
        .table thead th {
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6c757d;
          border-bottom-width: 1px;
        }
        
        .table tbody tr {
          transition: all 0.2s ease;
        }
        
        .table tbody tr:hover {
          background-color: rgba(13, 110, 253, 0.05) !important;
        }
        
        .avatar-sm {
          width: 32px;
          height: 32px;
        }
        
        .form-control, .form-select {
          border-radius: 0.375rem;
          border-color: #dee2e6;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
        }
        
        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        
        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
        
        .btn-outline-primary:hover {
          background-color: rgba(13, 110, 253, 0.1);
        }

        .hover-bg:hover {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .z-3 {
          z-index: 3;
        }
      `}</style>
        </Container>
    );
};

export default Courses;