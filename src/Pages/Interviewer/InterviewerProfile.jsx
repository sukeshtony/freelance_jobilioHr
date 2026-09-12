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
    ListGroup,
    InputGroup
} from 'react-bootstrap';
import {
    FaArrowLeft,
    FaEnvelope,
    FaBriefcase,
    FaStar,
    FaChartLine,
    FaUserTie,
    FaKey,
    FaEdit,
    FaSave,
    FaTimes,
    FaClock,
    FaPlus,
    FaTrash
} from 'react-icons/fa';
import { FaSignOutAlt } from 'react-icons/fa';
import API from '../../api';

const InterviewerProfile = () => {
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

    // Availability edit states
    const [editAvailability, setEditAvailability] = useState(false);
    const [availability, setAvailability] = useState({
        days: [],
        timeSlots: []
    });
    const [newTimeSlot, setNewTimeSlot] = useState('');
    const [availabilitySuccess, setAvailabilitySuccess] = useState(null);
    const [availabilityError, setAvailabilityError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/admin/interviewers/${id}/profile`);
                const profileData = res.data._doc ? res.data._doc : res.data;

                const data = {
                    ...profileData,
                    defaultSlots: profileData.defaultSlots?.length
                        ? profileData.defaultSlots
                        : ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"]
                };

                setProfile(data);
                setAvailability({
                    days: data.availability || [],
                    timeSlots: data.defaultSlots || []
                });

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
            const res = await API.put(`/api/auth/change-password/interviewer/${id}`, {
                currentPassword,
                newPassword
            });

            setPasswordSuccess(res.data?.message || "Password changed successfully.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.error || "Failed to change password.");
        } finally {
            setChanging(false);
        }
    };

    const handleDayToggle = (day) => {
        setAvailability(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const handleAddTimeSlot = () => {
        if (newTimeSlot && !availability.timeSlots.includes(newTimeSlot)) {
            setAvailability(prev => ({
                ...prev,
                timeSlots: [...prev.timeSlots, newTimeSlot].sort()
            }));
            setNewTimeSlot('');
        }
    };

    const handleLogout = () => {
        // Clear any authentication data (adjust based on your auth setup)
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/bingus'); // Redirect to login page
    };

    const handleRemoveTimeSlot = (slot) => {
        setAvailability(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(s => s !== slot)
        }));
    };

    const saveAvailability = async () => {
        setAvailabilitySuccess(null);
        setAvailabilityError(null);
        try {
            const res = await API.put(`/api/admin/interviewers/${id}/availability`, {
                availability: availability.days,
                defaultSlots: availability.timeSlots
            });
            setAvailabilitySuccess(res.data?.message || 'Availability updated successfully!');
            setProfile(prev => ({
                ...prev,
                availability: availability.days,
                defaultSlots: availability.timeSlots
            }));
            setEditAvailability(false);
        } catch (err) {
            setAvailabilityError(err.response?.data?.error || 'Failed to update availability');
        }
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
                    <Button variant="outline-primary" onClick={() => navigate(-1)}>
                        <FaArrowLeft className="me-2" /> Go Back
                    </Button>
                </Card.Body>
            </Card>
        );
    }

    if (!profile) return null;

    const renderStars = (rating) => {
        const rounded = Math.round(rating || 0);
        return [...Array(5)].map((_, i) => (
            <FaStar
                key={i}
                color={i < rounded ? '#ffc107' : '#e4e5e9'}
                size={24}
                className="me-1"
            />
        ));
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
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
                                <FaBriefcase className="me-2" /> {profile.title}
                            </h5>

                            <div className="d-flex flex-wrap gap-2 mb-2">
                                <Badge bg="info" className="fs-6">
                                    <FaStar className="me-1" /> Rating: {profile.rating || 'N/A'}
                                </Badge>
                                <Badge bg="secondary" className="fs-6">
                                    {profile.interviewCount || 0} Total Interviews
                                </Badge>
                            </div>

                            <a href={`mailto:${profile.email}`} className="text-primary">
                                <FaEnvelope className="me-2" /> {profile.email}
                            </a>
                        </div>
                    </div>

                    <Button variant="danger" onClick={handleLogout}>
                        <FaSignOutAlt className="me-2" /> Logout
                    </Button>
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
                                            <h4>Average Rating: {profile.rating || 'N/A'}</h4>
                                            <div className="d-flex justify-content-center mt-3">
                                                {renderStars(profile.rating)}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h6>Interview Completion</h6>
                                            <p className="text-muted">
                                                {profile.interviewCount > 0
                                                    ? `${profile.interviewCount} interviews conducted`
                                                    : 'No stats available'}
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card className="mb-4">
                                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">
                                            <FaUserTie className="me-2" /> Profile Details
                                        </h5>
                                        {!editAvailability && (
                                            <Button variant="outline-primary" size="sm" onClick={() => setEditAvailability(true)}>
                                                <FaEdit className="me-1" /> Edit Availability
                                            </Button>
                                        )}
                                    </Card.Header>

                                    <Card.Body>
                                        <div className="mb-3">
                                            <h6>Skills</h6>
                                            <div className="d-flex flex-wrap gap-1">
                                                {profile.skills?.map(skill => (
                                                    <Badge key={skill} bg="light" text="dark" className="fs-6">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <h6>Availability</h6>

                                            {availabilityError && <Alert variant="danger">{availabilityError}</Alert>}
                                            {availabilitySuccess && <Alert variant="success">{availabilitySuccess}</Alert>}

                                            {editAvailability ? (
                                                <>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Available Days</Form.Label>
                                                        <div className="d-flex flex-wrap gap-3">
                                                            {daysOfWeek.map(day => (
                                                                <Form.Check
                                                                    key={day}
                                                                    type="checkbox"
                                                                    id={`day-${day}`}
                                                                    label={day}
                                                                    checked={availability.days.includes(day)}
                                                                    onChange={() => handleDayToggle(day)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </Form.Group>

                                                    <Form.Group className="mb-4">
                                                        <Form.Label>Time Slots</Form.Label>
                                                        <ListGroup className="mb-3">
                                                            {availability.timeSlots.map(slot => (
                                                                <ListGroup.Item key={slot} className="d-flex justify-content-between align-items-center">
                                                                    <span><FaClock className="me-2" />{slot}</span>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveTimeSlot(slot)}
                                                                    >
                                                                        <FaTrash />
                                                                    </Button>
                                                                </ListGroup.Item>
                                                            ))}
                                                        </ListGroup>
                                                        <InputGroup>
                                                            <Form.Control
                                                                type="time"
                                                                value={newTimeSlot}
                                                                onChange={(e) => setNewTimeSlot(e.target.value)}
                                                                placeholder="HH:MM"
                                                            />
                                                            <Button
                                                                variant="outline-primary"
                                                                onClick={handleAddTimeSlot}
                                                                disabled={!newTimeSlot}
                                                            >
                                                                <FaPlus /> Add Slot
                                                            </Button>
                                                        </InputGroup>
                                                    </Form.Group>

                                                    <div className="d-flex gap-2">
                                                        <Button variant="success" onClick={saveAvailability}>
                                                            <FaSave className="me-1" /> Save Changes
                                                        </Button>
                                                        <Button variant="secondary" onClick={() => {
                                                            setEditAvailability(false);
                                                            setAvailability({
                                                                days: profile.availability || [],
                                                                timeSlots: profile.defaultSlots || []
                                                            });
                                                        }}>
                                                            <FaTimes className="me-1" /> Cancel
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <h6>Available Days</h6>
                                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                                        {availability.days.length > 0 ? (
                                                            availability.days.map(day => (
                                                                <Badge key={day} bg="info" className="fs-6">
                                                                    {day}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted">Not specified</span>
                                                        )}
                                                    </div>

                                                    <h6>Available Time Slots</h6>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {availability.timeSlots.length > 0 ? (
                                                            availability.timeSlots.map(slot => (
                                                                <Badge key={slot} bg="primary" className="fs-6">
                                                                    <FaClock className="me-1" /> {slot}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted">Not specified</span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div>
                                            <h6>Category</h6>
                                            <Badge bg={profile.category === 'IT' ? 'primary' : 'secondary'}>
                                                {profile.category || 'Not specified'}
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

export default InterviewerProfile;