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
    Container,
    ListGroup,
    InputGroup
} from 'react-bootstrap';
import {
    FaArrowLeft,
    FaEnvelope,
    FaBriefcase,
    FaUserTie,
    FaKey,
    FaBook,
    FaChalkboardTeacher,
    FaInfoCircle,
    FaSignOutAlt,
    FaEdit,
    FaSave,
    FaTimes,
    FaClock,
    FaPlus,
    FaTrash
} from 'react-icons/fa';
import API from '../../api';

const InstructorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [changing, setChanging] = useState(false);

    // Availability edit states
    const [editAvailability, setEditAvailability] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [availability, setAvailability] = useState({
        days: [],
        timeSlots: [],
        duration: '60 minutes'
    });
    const [newTimeSlot, setNewTimeSlot] = useState('');
    const [availabilitySuccess, setAvailabilitySuccess] = useState(null);
    const [availabilityError, setAvailabilityError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/api/admin/instructors/${id}/profile`);
                const profileData = res.data;

                const data = {
                    ...profileData,
                    defaultSlots: profileData.defaultSlots?.length
                        ? profileData.defaultSlots
                        : ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"]
                };

                setProfile(data);
                const firstCourseId = data.courses?.[0]?._id || '';
                setSelectedCourseId(firstCourseId);
                if (firstCourseId) {
                    await fetchCourseAvailability(firstCourseId);
                } else {
                    setAvailability({
                        days: data.availability || [],
                        timeSlots: data.defaultSlots || [],
                        duration: data.examDuration || '60 minutes'
                    });
                }
                // Persist current instructor id for booking page to use
                try { localStorage.setItem('instructorId', id); } catch {}
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
            const res = await API.put(`/api/auth/change-password/instructor/${id}`, {
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
        if (newTimeSlot) {
            // Convert 24-hour format to 12-hour format
            const [hours, minutes] = newTimeSlot.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const formattedTime = `${displayHour}:${minutes} ${ampm}`;
            
            if (!availability.timeSlots.includes(formattedTime)) {
                setAvailability(prev => ({
                    ...prev,
                    timeSlots: [...prev.timeSlots, formattedTime].sort()
                }));
                setNewTimeSlot('');
            }
        }
    };

    const handleRemoveTimeSlot = (slot) => {
        setAvailability(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(s => s !== slot)
        }));
    };

    const fetchCourseAvailability = async (courseId) => {
        if (!courseId) return;
        try {
            setAvailabilityError(null);
            const res = await API.get(`/api/courses/${courseId}/availability`);
            const data = res.data || {};
            setAvailability({
                days: data.availability || [],
                timeSlots: (data.defaultSlots && data.defaultSlots.length) ? data.defaultSlots : [
                    "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"
                ],
                duration: data.examDuration || '60 minutes'
            });
        } catch (err) {
            setAvailabilityError(err.response?.data?.message || 'Failed to load course availability');
        }
    };

    const saveAvailability = async () => {
        setAvailabilitySuccess(null);
        setAvailabilityError(null);
        try {
            if (selectedCourseId) {
                const res = await API.put(`/api/courses/${selectedCourseId}/availability`, {
                    availability: availability.days,
                    defaultSlots: availability.timeSlots,
                    examDuration: availability.duration
                });
                setAvailabilitySuccess(res.data?.message || 'Availability updated successfully!');
            } else {
                const res = await API.put(`/api/admin/instructors/${id}/availability`, {
                    availability: availability.days,
                    defaultSlots: availability.timeSlots,
                    examDuration: availability.duration
                });
                setAvailabilitySuccess(res.data?.message || 'Availability updated successfully!');
            }
            setEditAvailability(false);
        } catch (err) {
            setAvailabilityError(err.response?.data?.error || err.response?.data?.message || 'Failed to update availability');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/bingus');
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3">Loading instructor profile...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <div className="mb-4">
                            <FaChalkboardTeacher size={48} className="text-danger" />
                        </div>
                        <h4 className="text-danger mb-4">{error}</h4>
                        <Button variant="primary" onClick={() => navigate(-1)}>
                            <FaArrowLeft className="me-2" /> Go Back
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    if (!profile) return null;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <FaChalkboardTeacher className="me-2 text-primary" />
                    Instructor Profile
                </h2>
                <Button variant="danger" onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Logout
                </Button>
            </div>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <Row className="align-items-center">
                        <Col md={2} className="mb-3 mb-md-0">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                                 style={{ width: '120px', height: '120px' }}>
                                <span className="text-white display-4">
                                    {profile.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                            </div>
                        </Col>
                        <Col md={10}>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                                <div>
                                    <h3 className="mb-1">{profile.name}</h3>
                                    <p className="text-muted mb-2">
                                        <FaBriefcase className="me-2" /> {profile.title}
                                    </p>
                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                        <Badge bg="info" className="fs-6">
                                            <FaBook className="me-1" /> {profile.courses?.length || 0} Courses
                                        </Badge>
                                        <Badge bg={profile.field === 'IT' ? 'primary' : 'secondary'} className="fs-6">
                                            {profile.field || 'Not specified'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="px-3 pt-3"
                        fill
                    >
                        <Tab eventKey="overview" title={
                            <span><FaInfoCircle className="me-2" /> Overview</span>
                        }>
                            <div className="p-4">
                                <Row>
                                    <Col md={6}>
                                        <Card className="border-0 shadow-sm mb-4">
                                            <Card.Header className="bg-light">
                                                <h5 className="mb-0">
                                                    <FaUserTie className="me-2" /> Instructor Details
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                                        <span className="fw-bold">Title:</span>
                                                        <span>{profile.title}</span>
                                                    </ListGroup.Item>
                                                    <ListGroup.Item>
                                                        <div className="fw-bold mb-2">About:</div>
                                                        <p className="mb-0">
                                                            {profile.about || <span className="text-muted">Not provided</span>}
                                                        </p>
                                                    </ListGroup.Item>
                                                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex flex-column w-100">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold">Courses Assigned:</span>
                                                                <Badge bg="info">{profile.courses?.length || 0}</Badge>
                                                            </div>
                                                            {Array.isArray(profile.courses) && profile.courses.length > 0 && (
                                                                <Form.Select
                                                                    value={selectedCourseId}
                                                                    onChange={async (e) => {
                                                                        const cid = e.target.value;
                                                                        setSelectedCourseId(cid);
                                                                        await fetchCourseAvailability(cid);
                                                                    }}
                                                                >
                                                                    <option value="" disabled>Select a course</option>
                                                                    {profile.courses.map(c => (
                                                                        <option key={c._id} value={c._id}>{c.title}</option>
                                                                    ))}
                                                                </Form.Select>
                                                            )}
                                                        </div>
                                                    </ListGroup.Item>
                                                </ListGroup>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col md={6}>
                                        <Card className="border-0 shadow-sm mb-4">
                                            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0">
                                                    <FaClock className="me-2" /> Availability
                                                </h5>
                                                {!editAvailability && (
                                                    <Button variant="outline-primary" size="sm" onClick={() => setEditAvailability(true)}>
                                                        <FaEdit className="me-1" /> Edit Availability
                                                    </Button>
                                                )}
                                            </Card.Header>
                                            <Card.Body>
                                                {availabilityError && <Alert variant="danger">{availabilityError}</Alert>}
                                                {availabilitySuccess && (
                                                    <Alert variant="success">
                                                        {availabilitySuccess}
                                                        <div className="mt-2">
                                                        </div>
                                                    </Alert>
                                                )}

                                                {editAvailability ? (
                                                    <>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Select Course</Form.Label>
                                                            <Form.Select
                                                                value={selectedCourseId}
                                                                onChange={async (e) => {
                                                                    const cid = e.target.value;
                                                                    setSelectedCourseId(cid);
                                                                    await fetchCourseAvailability(cid);
                                                                }}
                                                            >
                                                                <option value="" disabled>Select a course</option>
                                                                {(profile.courses || []).map(c => (
                                                                    <option key={c._id} value={c._id}>{c.title}</option>
                                                                ))}
                                                            </Form.Select>
                                                        </Form.Group>
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

                                                        <Form.Group className="mb-4">
                                                            <Form.Label>Exam Duration</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                value={availability.duration}
                                                                onChange={(e) => setAvailability(prev => ({
                                                                    ...prev,
                                                                    duration: e.target.value
                                                                }))}
                                                                placeholder="e.g., 60 minutes"
                                                            />
                                                            <Form.Text className="text-muted">
                                                                Set the default duration for assessments (e.g., 45 minutes, 60 minutes, 90 minutes)
                                                            </Form.Text>
                                                        </Form.Group>

                                                        <div className="d-flex gap-2">
                                                            <Button variant="success" onClick={saveAvailability}>
                                                                <FaSave className="me-1" /> Save Changes
                                                            </Button>
                                                            <Button variant="secondary" onClick={() => {
                                                                setEditAvailability(false);
                                                                setAvailability({
                                                                    days: profile.availability || [],
                                                                    timeSlots: profile.defaultSlots || [],
                                                                    duration: profile.examDuration || '60 minutes'
                                                                });
                                                            }}>
                                                                <FaTimes className="me-1" /> Cancel
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="mb-3">
                                                            <span className="fw-bold me-2">Course:</span>
                                                            <span>{(profile.courses || []).find(c => c._id === selectedCourseId)?.title || 'None'}</span>
                                                        </div>
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
                                                        <div className="d-flex flex-wrap gap-1 mb-3">
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

                                                        <h6>Exam Duration</h6>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            <Badge bg="success" className="fs-6">
                                                                <FaClock className="me-1" /> {availability.duration}
                                                            </Badge>
                                                        </div>
                                                    </>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Tab>

                        <Tab eventKey="password" title={
                            <span><FaKey className="me-2" /> Password</span>
                        }>
                            <div className="p-4">
                                <Row>
                                    <Col md={6}>
                                        <Card className="border-0 shadow-sm">
                                            <Card.Header className="bg-light">
                                                <h5 className="mb-0">
                                                    <FaKey className="me-2" /> Change Password
                                                </h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {passwordError && <Alert variant="danger" dismissible onClose={() => setPasswordError(null)}>{passwordError}</Alert>}
                                                {passwordSuccess && <Alert variant="success" dismissible onClose={() => setPasswordSuccess(null)}>{passwordSuccess}</Alert>}

                                                <Form onSubmit={handlePasswordChange}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Current Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            placeholder="Enter current password"
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>New Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            placeholder="Enter new password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Confirm New Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            placeholder="Confirm new password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>

                                                    <div className="d-flex justify-content-end">
                                                        <Button type="submit" variant="primary" disabled={changing} className="px-4">
                                                            {changing ? (
                                                                <>
                                                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                                    Changing...
                                                                </>
                                                            ) : 'Change Password'}
                                                        </Button>
                                                    </div>
                                                </Form>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default InstructorProfile;