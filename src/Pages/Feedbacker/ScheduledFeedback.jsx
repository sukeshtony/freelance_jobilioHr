import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  Form,
  InputGroup
} from "react-bootstrap";
import {
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaInfoCircle,
  FaCheck,
  FaSearch
} from "react-icons/fa";
import API from "../../api";

export default function FeedbackerAssignedUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [searchNameEmail, setSearchNameEmail] = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const navigate = useNavigate();
  const feedbackerId = localStorage.getItem("id");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await API.get(`/api/feedbackers/${feedbackerId}/with-users-results`);
        if (res.data.success) {
          setUsers(res.data.data.assignedUsers);
          setFilteredUsers(res.data.data.assignedUsers);
        }
      } catch (err) {
        setError("Failed to fetch assigned users");
        console.error("Error fetching assigned users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [feedbackerId]);

  useEffect(() => {
    const filtered = users.filter(user => {
      const nameEmailMatch =
        user.username.toLowerCase().includes(searchNameEmail.toLowerCase()) ||
        user.email.toLowerCase().includes(searchNameEmail.toLowerCase());
      const mobileMatch =
        searchMobile.trim() === "" ||
        (user.mobile && user.mobile.includes(searchMobile));
      return nameEmailMatch && mobileMatch;
    });
    setFilteredUsers(filtered);
  }, [searchNameEmail, searchMobile, users]);

  const handleMarkComplete = async (userId) => {
    try {
      setError(null);
      setSuccess(null);
      setCompletingId(userId);

      const res = await API.put(`/api/${userId}/complete`, { feedbackerId });

      if (res.data.success) {
        setSuccess("Feedback completed and student unassigned!");
        setUsers(users.map(user => {
          if (user._id === userId) {
            return {
              ...user,
              assignedFeedbacker: null,
              exams: user.exams.map(exam => ({
                ...exam,
                status: exam.score / exam.totalMarks >= 0.4 ? "Passed" : "Failed"
              })),
              interviews: user.interviews.map(interview => ({
                ...interview,
                status: "Completed"
              }))
            };
          }
          return user;
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setCompletingId(null);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-gradient-primary text-dark py-3">
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0 d-flex align-items-center">
                <FaUserTie className="me-3" style={{ fontSize: '1.5rem' }} />
                <span>Assigned Students</span>
              </h3>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Separate Filters */}
          <div className="p-4 border-bottom">
            <Row className="g-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email..."
                    className="border-start-0"
                    value={searchNameEmail}
                    onChange={(e) => setSearchNameEmail(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaPhone className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by mobile..."
                    className="border-start-0"
                    value={searchMobile}
                    onChange={(e) => setSearchMobile(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>
          </div>

          {error && (
            <Alert variant="danger" className="m-4" onClose={() => setError(null)} dismissible>
              <strong>Error!</strong> {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="m-4" onClose={() => setSuccess(null)} dismissible>
              <strong>Success!</strong> {success}
            </Alert>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <img
                src="/images/no-data.svg"
                alt="No students found"
                style={{ width: '200px', opacity: 0.7 }}
                className="mb-4"
              />
              <h4 className="text-muted">No students found</h4>
              <p className="text-muted">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 ps-4" style={{ width: '30%' }}>Student Information</th>
                    <th className="py-3">Contact Details</th>
                    <th className="py-3 pe-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isAssigned = user.assignedFeedbacker !== null;

                    return (
                      <tr key={user._id} className="align-middle">
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px' }}>
                              <span className="text-white fw-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0 d-flex align-items-center">
                                {user.username}
                                {!isAssigned && (
                                  <Badge bg="light" text="dark" className="ms-2 fs-3">
                                    Unassigned
                                  </Badge>
                                )}
                              </h6>
                              <small className="text-muted">ID: {user._id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="d-flex align-items-center mb-2">
                              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{ width: '30px', height: '30px' }}>
                                <FaEnvelope className="text-primary" />
                              </div>
                              <span>{user.email}</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{ width: '30px', height: '30px' }}>
                                <FaPhone className="text-primary" />
                              </div>
                              <span>{user.mobile || "Not provided"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="pe-4">
                          <div className="d-flex justify-content-end gap-3">
                            <Button
                              variant="outline-primary"
                              className="d-flex align-items-center px-3"
                              onClick={() => navigate(`/feedbacker/details/${user._id}`)}
                            >
                              <FaInfoCircle className="me-2" />
                              View Details
                            </Button>
                            <Button
                              variant="success"
                              className="d-flex align-items-center px-3"
                              onClick={() => handleMarkComplete(user._id)}
                              disabled={completingId === user._id}
                            >
                              {completingId === user._id ? (
                                <>
                                  <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FaCheck className="me-2" />
                                  Mark Complete
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
