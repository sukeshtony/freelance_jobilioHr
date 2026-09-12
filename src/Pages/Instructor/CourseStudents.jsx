import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Container, Table, Spinner, Button, Card,
    Form, InputGroup, Row, Col, Collapse, Badge
} from 'react-bootstrap';
import API from '../../api';

// Import Bootstrap Icons
import {
    ArrowLeft, Trash, Envelope, Person, Calendar,
    Search as SearchIcon, Funnel, X, ChevronDown, ChevronUp
} from 'react-bootstrap-icons';

const CourseStudents = () => {
    const { id: courseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const courseTitle = location.state?.courseTitle || 'Course';

    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        date: ''
    });

    // Apply filters whenever filters or students change
    useEffect(() => {
        const filtered = students.filter(student => {
            return (
                student.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                student.email.toLowerCase().includes(filters.email.toLowerCase()) &&
                student.enrolledAt.includes(filters.date)
            );
        });
        setFilteredStudents(filtered);
    }, [filters, students]);

    const handleUnroll = async (enrollmentId, studentName) => {
        if (!window.confirm(`Are you sure you want to unroll ${studentName}?`)) return;

        try {
            await API.delete(`/api/enrollments/${enrollmentId}`);
            setStudents(prev => prev.filter(s => s.enrollmentId !== enrollmentId));
            alert(`${studentName} has been unrolled successfully`);
        } catch (err) {
            alert('Failed to unroll student');
        }
    };

    const fetchEnrolledStudents = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/api/enrollments/course/${courseId}`);
            const formatted = res.data.map(e => ({
                enrollmentId: e._id,
                studentId: e.studentId?._id,
                name: e.studentId?.username || 'N/A',
                email: e.studentId?.email || 'N/A',
                enrolledAt: e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : 'N/A',
                timestamp: e.enrolledAt ? new Date(e.enrolledAt).getTime() : 0
            }));
            setStudents(formatted);
            setFilteredStudents(formatted);
        } catch (err) {
            alert('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            name: '',
            email: '',
            date: ''
        });
    };

    const handleSort = (key) => {
        const sorted = [...filteredStudents].sort((a, b) => {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        });
        setFilteredStudents(sorted);
    };

    useEffect(() => {
        fetchEnrolledStudents();
    }, [courseId]);

    return (
        <Container className="py-4">
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-0 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Button
                                variant="light"
                                onClick={() => navigate(-1)}
                                className="me-3 d-flex align-items-center"
                            >
                                <ArrowLeft className="me-2" />
                                Back
                            </Button>
                            <h4 className="d-inline-block mb-0">
                                Students Enrolled in <span className="text-primary">"{courseTitle}"</span>
                            </h4>
                        </div>
                        <Badge pill bg="light" className="text-dark fs-6">
                            {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
                        </Badge>
                    </div>
                </Card.Header>

                <Card.Body className="p-4">
                    {/* Filter Controls */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Button
                                variant="light"
                                onClick={() => setShowFilters(!showFilters)}
                                className="d-flex align-items-center"
                            >
                                {showFilters ? <ChevronUp className="me-2" /> : <ChevronDown className="me-2" />}
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
                            <div>
                                <Row className="g-3">
                                    <Col md={4}>
                                        <Form.Group>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <Person />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    placeholder="Filter by name"
                                                    value={filters.name}
                                                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <Envelope />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    placeholder="Filter by email"
                                                    value={filters.email}
                                                    onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <Calendar />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    placeholder="Filter by date (MM/DD/YYYY)"
                                                    value={filters.date}
                                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                        </Collapse>
                    </div>

                    {/* Students Table */}
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Loading students...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded">
                            <SearchIcon size={24} className="text-muted mb-3" />
                            <h5>No students found</h5>
                            <p className="text-muted">
                                {students.length === 0
                                    ? 'No students are enrolled in this course yet.'
                                    : 'No students match your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '5%' }}>#</th>
                                        <th style={{ width: '25%' }}>
                                            <Button
                                                variant="link"
                                                className="p-0 text-decoration-none"
                                                onClick={() => handleSort('name')}
                                            >
                                                Name
                                            </Button>
                                        </th>
                                        <th style={{ width: '30%' }}>
                                            <Button
                                                variant="link"
                                                className="p-0 text-decoration-none"
                                                onClick={() => handleSort('email')}
                                            >
                                                Email
                                            </Button>
                                        </th>
                                        <th style={{ width: '20%' }}>
                                            <Button
                                                variant="link"
                                                className="p-0 text-decoration-none"
                                                onClick={() => handleSort('timestamp')}
                                            >
                                                Enrolled Date
                                            </Button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student, idx) => (
                                        <tr key={student.enrollmentId}>
                                            <td className="text-muted">{idx + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                                        <Person className="text-primary" />
                                                    </div>
                                                    <span>{student.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <a href={`mailto:${student.email}`} className="text-decoration-none">
                                                    {student.email}
                                                </a>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <Calendar className="text-muted me-2" />
                                                    <span>{student.enrolledAt}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CourseStudents;