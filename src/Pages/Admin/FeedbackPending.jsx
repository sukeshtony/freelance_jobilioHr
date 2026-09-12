import React, { useEffect, useState } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Button,
  Spinner,
  Badge,
  Alert,
  InputGroup,
  FormControl,
  Form,
  Collapse
} from "react-bootstrap";
import {
  Search,
  PersonFill,
  EnvelopeFill,
  EyeFill,
  PencilFill,
  ClockHistory,
  TelephoneFill,
  FunnelFill,
  Funnel,
  XCircleFill
} from "react-bootstrap-icons";

function FeedbackPending() {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackers, setFeedbackers] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedFeedbackerId, setSelectedFeedbackerId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    feedbackerName: "",
    feedbackerEmail: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [candidatesRes, feedbackersRes] = await Promise.all([
          API.get("/api/conducted-candidates"),
          API.get("/api/feedbackers")
        ]);

        const candidateData = candidatesRes.data.data.map(item => ({
          ...item.user,
          exams: item.exams,
          interviews: item.interviews,
          assignedFeedbacker: item.user.assignedFeedbacker || null
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setCandidates(candidateData);
        setFilteredCandidates(candidateData);
        setFeedbackers(Array.isArray(feedbackersRes.data.data) ? feedbackersRes.data.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = candidates.filter(candidate => {
      const matchesName = filters.name 
        ? candidate.username?.toLowerCase().includes(filters.name.toLowerCase())
        : true;
      
      const matchesEmail = filters.email 
        ? candidate.email?.toLowerCase().includes(filters.email.toLowerCase())
        : true;
      
      const matchesPhone = filters.phone 
        ? candidate.mobile?.toLowerCase().includes(filters.phone.toLowerCase())
        : true;
      
      const matchesFeedbackerName = filters.feedbackerName 
        ? candidate.assignedFeedbacker?.name?.toLowerCase().includes(filters.feedbackerName.toLowerCase())
        : true;
      
      const matchesFeedbackerEmail = filters.feedbackerEmail 
        ? candidate.assignedFeedbacker?.email?.toLowerCase().includes(filters.feedbackerEmail.toLowerCase())
        : true;

      return matchesName && matchesEmail && matchesPhone && 
             matchesFeedbackerName && matchesFeedbackerEmail;
    });

    setFilteredCandidates(filtered);
  }, [filters, candidates]);

  const handleAssign = async () => {
    if (!selectedCandidateId || !selectedFeedbackerId) return;

    try {
      await API.post("/api/assign-feedbacker", {
        candidateId: selectedCandidateId,
        feedbackerId: selectedFeedbackerId
      });

      const updatedRes = await API.get("/api/conducted-candidates");
      const updatedData = updatedRes.data.data.map(item => ({
        ...item.user,
        exams: item.exams,
        interviews: item.interviews,
        assignedFeedbacker: item.assignedFeedbacker || null
      }));

      setCandidates(updatedData);
      setFilteredCandidates(updatedData);
      setSelectedCandidateId(null);
      setSelectedFeedbackerId("");
    } catch (error) {
      setError("Assignment failed");
    }
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
      feedbackerName: "",
      feedbackerEmail: ""
    });
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== "");

  return (
    <Container className="py-4">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0 text-primary">
                <ClockHistory className="me-2" />
                Conducted Candidates
              </h4>
              <small className="text-muted">Manage feedback assignments</small>
            </div>
            <div>
              <Badge bg="primary" pill className="me-2">
                {filteredCandidates.length} Shown
              </Badge>
              <Badge bg="secondary" pill>
                {candidates.length} Total
              </Badge>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="d-flex align-items-center"
              >
                {showFilters ? <FunnelFill className="me-2" /> : <Funnel className="me-2" />}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={resetFilters}
                  className="d-flex align-items-center"
                >
                  <XCircleFill className="me-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <Collapse in={showFilters}>
              <div>
                <Card className="mb-3">
                  <Card.Body className="p-3">
                    <div className="row g-3">
                      <div className="col-md-6 col-lg-3">
                        <Form.Group>
                          <Form.Label>Candidate Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Filter by name"
                            value={filters.name}
                            onChange={(e) => setFilters({...filters, name: e.target.value})}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6 col-lg-3">
                        <Form.Group>
                          <Form.Label>Candidate Email</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Filter by email"
                            value={filters.email}
                            onChange={(e) => setFilters({...filters, email: e.target.value})}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6 col-lg-3">
                        <Form.Group>
                          <Form.Label>Candidate Phone</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Filter by phone"
                            value={filters.phone}
                            onChange={(e) => setFilters({...filters, phone: e.target.value})}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6 col-lg-3">
                        <Form.Group>
                          <Form.Label>Feedbacker Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Filter by feedbacker"
                            value={filters.feedbackerName}
                            onChange={(e) => setFilters({...filters, feedbackerName: e.target.value})}
                          />
                        </Form.Group>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Collapse>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading candidates...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-5">
              <PersonFill size={48} className="text-muted mb-3" />
              <h5 className="text-muted">
                {hasActiveFilters ? "No matching candidates found" : "No candidates found"}
              </h5>
              {hasActiveFilters ? (
                <Button variant="outline-primary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <p className="text-muted">There are currently no conducted candidates.</p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>
                      <PersonFill className="me-2" />
                      Candidate
                    </th>
                    <th>
                      <EnvelopeFill className="me-2" />
                      Contact
                    </th>
                    <th>
                      <PersonFill className="me-2" />
                      Assigned Feedbacker
                    </th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate._id}>
                      <td>
                        <div className="fw-semibold">
                          {candidate.username || "N/A"}
                        </div>
                        <small className="text-muted">
                          ID: {candidate._id}
                        </small>
                      </td>
                      <td>
                        <div>
                          {candidate.email ? (
                            <a
                              href={`mailto:${candidate.email}`}
                              className="text-decoration-none"
                            >
                              {candidate.email}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </div>
                        <div>
                          {candidate.mobile ? (
                            <a
                              href={`tel:${candidate.mobile}`}
                              className="text-decoration-none"
                            >
                              {candidate.mobile}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td>
                        {candidate.assignedFeedbacker ? (
                          <div>
                            <div className="fw-semibold">
                              {candidate.assignedFeedbacker.name}
                            </div>
                            <a 
                              href={`mailto:${candidate.assignedFeedbacker.email}`} 
                              className="text-decoration-none"
                            >
                              {candidate.assignedFeedbacker.email}
                            </a>
                          </div>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Not assigned
                          </Badge>
                        )}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() =>
                            navigate(`/admin/details/${candidate._id}`)
                          }
                        >
                          <EyeFill className="me-1" />
                          View
                        </Button>
                        <Button
                          variant={candidate.assignedFeedbacker ? "outline-success" : "success"}
                          size="sm"
                          onClick={() => setSelectedCandidateId(candidate._id)}
                        >
                          {candidate.assignedFeedbacker ? "Reassign" : "Assign"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {selectedCandidateId && (
            <Card className="mt-4 border-primary">
              <Card.Header className="bg-primary text-white py-2">
                Assign Feedbacker
              </Card.Header>
              <Card.Body className="p-3">
                <InputGroup className="mb-3">
                  <FormControl
                    as="select"
                    value={selectedFeedbackerId}
                    onChange={(e) => setSelectedFeedbackerId(e.target.value)}
                  >
                    <option value="">Select Feedbacker</option>
                    {feedbackers.map((fb) => (
                      <option key={fb._id} value={fb._id}>
                        {fb.name} ({fb.email})
                      </option>
                    ))}
                  </FormControl>
                  <Button
                    variant="primary"
                    onClick={handleAssign}
                    disabled={!selectedFeedbackerId}
                  >
                    Assign
                  </Button>
                </InputGroup>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedCandidateId(null);
                    setSelectedFeedbackerId("");
                  }}
                >
                  Cancel
                </Button>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FeedbackPending;