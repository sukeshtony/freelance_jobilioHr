import React, { useEffect, useState } from 'react';
import { 
  Container, Card, Table, Spinner, Form, 
  InputGroup, Button, Badge, Row, Col, Alert, Collapse  
} from 'react-bootstrap';
import { 
  Search, Filter, Calendar as CalendarIcon, 
  Person, Book, Award, Clock, XCircle, CheckCircle, CalendarEvent
} from 'react-bootstrap-icons';
import API from '../../api';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    username: '',
    category: '',
    courseName: '',
    date: '',
    status: ''
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      console.log('Fetching exams from /api/exams/bookings...');
      const token = localStorage.getItem('token');
      const res = await API.get('/api/exams/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Raw response:', res);
      console.log('Response data:', res.data);
      
      if (Array.isArray(res.data)) {
        const sortedExams = res.data
          .filter(e => e.status !== 'Canceled')
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log('Sorted exams:', sortedExams);
        setExams(sortedExams);
        setFiltered(sortedExams);
      } else {
        console.error('Response data is not an array:', typeof res.data, res.data);
        setExams([]);
        setFiltered([]);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      console.error('Error details:', err.response?.data);
      setExams([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filteredList = exams.filter(exam => {
      const matchUsername = exam.username?.toLowerCase().includes(filters.username.toLowerCase());
      const matchCategory = exam.category?.toLowerCase().includes(filters.category.toLowerCase());
      const matchCourse = exam.courseName?.toLowerCase().includes(filters.courseName.toLowerCase());
      const matchDate = filters.date === '' || new Date(exam.date).toISOString().split('T')[0] === filters.date;
      const matchStatus = filters.status === '' || (exam.status || 'Pending') === filters.status;

      return matchUsername && matchCategory && matchCourse && matchDate && matchStatus;
    });

    setFiltered(filteredList);
  }, [filters, exams]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      username: '',
      category: '',
      courseName: '',
      date: '',
      status: ''
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Passed':
        return <Badge bg="success" className="d-flex align-items-center"><CheckCircle className="me-1" /> Passed</Badge>;
      case 'Failed':
        return <Badge bg="danger" className="d-flex align-items-center"><XCircle className="me-1" /> Failed</Badge>;
      case 'Scheduled':
        return <Badge bg="primary" className="d-flex align-items-center"><CalendarEvent className="me-1" /> Scheduled</Badge>;
      case 'Missed':
        return <Badge bg="warning" text="dark" className="d-flex align-items-center"><Clock className="me-1" /> Missed</Badge>;
      case 'Conducted':
        return <Badge bg="info" className="d-flex align-items-center"><CheckCircle className="me-1" /> Conducted</Badge>;
      default:
        return <Badge bg="secondary" className="d-flex align-items-center"><Clock className="me-1" /> Pending</Badge>;
    }
  };
  

  return (
    <Container fluid className="py-4 px-4">
      <Card className="shadow border-0">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 fw-bold">Exam Schedule</h2>
              <small className="text-muted">Manage and monitor all exam bookings</small>
            </div>
            <Badge pill bg="light" text="dark" className="fs-6">
              {filtered.length} {filtered.length === 1 ? 'Exam' : 'Exams'}
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
                        placeholder="Username"
                        name="username"
                        value={filters.username}
                        onChange={handleFilterChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Book />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Category"
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Award />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Course"
                        name="courseName"
                        value={filters.courseName}
                        onChange={handleFilterChange}
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
                        onChange={handleFilterChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Statuses</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Missed">Missed</option>
                      <option value="Conducted">Conducted</option>
                    </Form.Select>
                  </Col>
                </Row>
              </div>
            </Collapse>
          </div>

          {/* Exams Table */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading exams...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 bg-light rounded">
              <Search size={48} className="text-muted mb-3" />
              <h5>No exams found</h5>
              <p className="text-muted">
                {exams.length === 0 
                  ? 'No exams have been scheduled yet. Check if candidates have booked any exams.'
                  : 'No exams match your filters.'}
              </p>
              {exams.length === 0 && (
                <div className="mt-3">
                  <small className="text-muted">
                    Debug info: Total exams in database: {exams.length}
                  </small>
                </div>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Category</th>
                    <th>Course</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam) => (
                    <tr key={exam._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <Person className="text-primary" />
                          </div>
                          <span>{exam.username}</span>
                        </div>
                      </td>
                      <td>{exam.category}</td>
                      <td className="fw-semibold">{exam.courseName}</td>
                      <td>
                        {exam.status === 'Failed' || exam.status === 'Passed' || exam.status === 'Conducted'
                          ? <Badge bg="light" text="dark">{exam.score}</Badge> 
                          : 'N/A'}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <CalendarIcon className="text-muted me-2" />
                          {new Date(exam.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Clock className="text-muted me-2" />
                          {exam.time}
                        </div>
                      </td>
                      <td>{getStatusBadge(exam.status || 'Pending')}</td>
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

export default Exams;