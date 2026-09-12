import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Tab, Tabs, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaClipboardCheck, FaUserTie, FaBook, FaChartBar } from 'react-icons/fa';
import API from '../../api';

const Details = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [interviewerDetails, setInterviewerDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('exams');

    useEffect(() => {
        const fetchCandidateDetails = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/conducted-candidates/${id}`);
                const candidateData = res.data.data[0];
                setCandidate(candidateData);
                
                // Fetch interviewer details for each interview
                const interviews = candidateData?.interviews || [];
                const interviewerIds = interviews.map(i => i.interviewer).filter(id => id);
                
                if (interviewerIds.length > 0) {
                    try {
                        const interviewersRes = await API.post('/api/admin/interviewers/batch', { ids: interviewerIds });
                        // The API returns data in the format: { data: { [id]: interviewer } }
                        setInterviewerDetails(interviewersRes.data.data);
                    } catch (err) {
                        console.error('Failed to fetch interviewers:', err);
                        // Continue even if interviewer fetch fails
                        setInterviewerDetails({});
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load candidate details');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidateDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="m-3">
                {error}
            </Alert>
        );
    }

    if (!candidate) return null;

    return (
        <Container className="py-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
                <FaArrowLeft className="me-2" /> Back
            </Button>

            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                    <h4 className="mb-0">
                        <FaUserTie className="me-2" />
                        {candidate.user.username}
                    </h4>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3 mb-4">
                        <div>
                            <h6>Email</h6>
                            <p>{candidate.user.email || 'N/A'}</p>
                        </div>
                        <div>
                            <h6>Phone</h6>
                            <p>{candidate.user.mobile || 'N/A'}</p>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab eventKey="exams" title={
                    <span><FaBook className="me-2" /> Exams</span>
                }>
                    <Card className="mt-3 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5>Exam Results</h5>
                        </Card.Header>
                        <Card.Body>
                            {candidate.exams.length === 0 ? (
                                <Alert variant="info">No exam records found</Alert>
                            ) : (
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Date</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidate.exams.map((exam) => (
                                            <tr key={exam._id}>
                                                <td>{exam.courseName}</td>
                                                <td>{new Date(exam.date).toLocaleDateString()}</td>
                                                <td>
                                                    <Badge bg={exam.score === exam.totalMarks ? 'success' : 'warning'}>
                                                        {exam.score}/{exam.totalMarks}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={exam.status === 'Conducted' ? 'primary' : 'secondary'}>
                                                        {exam.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="interviews" title={
                    <span><FaClipboardCheck className="me-2" /> Interviews</span>
                }>
                    <Card className="mt-3 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5>Interview Results</h5>
                        </Card.Header>
                        <Card.Body>
                            {candidate.interviews.length === 0 ? (
                                <Alert variant="info">No interview records found</Alert>
                            ) : (
                                <div>
                                    {candidate.interviews.map((interview) => {
                                        const interviewer = interviewerDetails[interview.interviewer] || {};
                                        return (
                                            <div key={interview._id} className="mb-4">
                                                <h6 className="mb-3">
                                                    {interview.interviewType} Interview - {new Date(interview.date).toLocaleDateString()}
                                                </h6>
                                                <Table striped bordered>
                                                    <tbody>
                                                        <tr>
                                                            <th width="30%">Interviewer Name</th>
                                                            <td>
                                                                {interviewer.name || 'N/A'} 
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                        <th width="30%">Interviewer Email</th>
                                                            <td>
                                                                 {interviewer.email || 'N/A'}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Status</th>
                                                            <td>
                                                                <Badge bg="primary">{interview.status}</Badge>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Result</th>
                                                            <td>
                                                                <Badge bg={interview.result.passed ? 'success' : 'danger'}>
                                                                    {interview.result.passed ? 'Passed' : 'Failed'}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Score</th>
                                                            <td>{interview.result.score}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Feedback</th>
                                                            <td>{interview.result.feedback || 'No feedback provided'}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Strengths</th>
                                                            <td>
                                                                <ul className="mb-0">
                                                                    {interview.result.strengths.map((strength, i) => (
                                                                        strength && <li key={i}>{strength}</li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Areas to Improve</th>
                                                            <td>
                                                                <ul className="mb-0">
                                                                    {interview.result.areasToImprove.map((area, i) => (
                                                                        area && <li key={i}>{area}</li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Recommendations</th>
                                                            <td>
                                                                <ul className="mb-0">
                                                                    {interview.result.recommendations.map((rec, i) => (
                                                                        rec && <li key={i}>{rec}</li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default Details;