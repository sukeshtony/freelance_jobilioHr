import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Spinner,
    Badge,
    Tab,
    Tabs,
    Row,
    Col,
    Form,
    Alert,
    ListGroup
} from 'react-bootstrap';
import {
    FaArrowLeft,
    FaEnvelope,
    FaClipboardCheck,
    FaUserTie,
    FaKey,
    FaChartLine,
    FaSignOutAlt
} from 'react-icons/fa';
import API from '../../api';

const FeedbackerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Change password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/feedbackers/${id}/profile`);
                setProfile(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        try {
            setChanging(true);
            const res = await API.put(`/api/auth/change-password/feedbacker/${id}`, {
                currentPassword,
                newPassword
            });

            setPasswordSuccess(res.data?.message || "Password changed successfully.");
        } catch (err) {
            setPasswordError(err.response?.data?.error || "Failed to change password.");
        } finally {
            setChanging(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/bingus');
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="shadow-sm border-0">
                <Card.Body className="text-center py-5">
                    <h4 className="text-danger">{error}</h4>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="outline-primary" onClick={() => navigate(-1)}>
                            <FaArrowLeft className="me-2" /> Go Back
                        </Button>
                        <Button variant="outline-danger" onClick={handleLogout}>
                            <FaSignOutAlt className="me-2" /> Logout
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    if (!profile) return null;

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <div className="me-4">
                            <div
                                style={{
                                    width: 120,
                                    height: 120,
                                    backgroundColor: '#0d6efd',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '2.5rem'
                                }}
                            >
                                {profile.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-1">{profile.name}</h2>
                            <h5 className="text-muted mb-3">
                                <FaClipboardCheck className="me-2" /> Feedback Provider
                            </h5>

                            <div className="d-flex flex-wrap gap-2 mb-2">
                                <Badge bg="info" className="fs-6">
                                    Completed Feedbacks: {profile.completedFeedbacks || 0}
                                </Badge>
                                <Badge bg="secondary" className="fs-6">
                                    Assigned Feedbacks: {profile.assignedCount || 0}
                                </Badge>
                            </div>

                            <a href={`mailto:${profile.email}`} className="text-primary">
                                <FaEnvelope className="me-2" /> {profile.email}
                            </a>
                        </div>
                    </div>

                    <div>
                        <Button variant="outline-danger" onClick={handleLogout}>
                            <FaSignOutAlt className="me-2" /> Logout
                        </Button>
                    </div>
                </div>
            </Card.Header>

            <Card.Body>
                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4"
                >
                    <Tab eventKey="overview" title="Overview">
                        <Row className="mt-4">
                            <Col md={6}>
                                <Card className="mb-4">
                                    <Card.Header className="bg-light">
                                        <h5 className="mb-0">
                                            <FaChartLine className="me-2" /> Performance Stats
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="text-center py-4">
                                            <h4>Completed Feedbacks</h4>
                                            <div className="display-4">
                                                {profile.completedFeedbacks || 0}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h6>Assigned Feedbacks</h6>
                                            <p className="text-muted">
                                                {profile.assignedCount > 0
                                                    ? `${profile.assignedCount} feedbacks assigned`
                                                    : 'No feedbacks assigned yet'}
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card className="mb-4">
                                    <Card.Header className="bg-light">
                                        <h5 className="mb-0">
                                            <FaUserTie className="me-2" /> Profile Details
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-3">
                                            <h6>Account Created</h6>
                                            <p className="text-muted">
                                                {new Date(profile.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="mb-3">
                                            <h6>Last Updated</h6>
                                            <p className="text-muted">
                                                {new Date(profile.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div>
                                            <h6>Status</h6>
                                            <Badge bg={profile.assignedCount > 0 ? 'success' : 'warning'}>
                                                {profile.assignedCount > 0 ? 'Active' : 'Available'}
                                            </Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>

                    <Tab eventKey="password" title="Change Password">
                        <Row className="mt-4">
                            <Col md={6}>
                                <Card>
                                    <Card.Header className="bg-light">
                                        <h5 className="mb-0">
                                            <FaKey className="me-2" /> Change Password
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                                        {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

                                        <Form onSubmit={handlePasswordChange}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Current Password</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label>New Password</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label>Confirm New Password</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                            </Form.Group>

                                            <Button type="submit" variant="primary" disabled={changing}>
                                                {changing ? 'Changing...' : 'Change Password'}
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>
                </Tabs>
            </Card.Body>
        </Card>
    );
};

export default FeedbackerProfile;