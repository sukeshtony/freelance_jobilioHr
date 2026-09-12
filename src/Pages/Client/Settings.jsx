import React, { useState, useEffect } from 'react';
import { Form, Card, Button, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API from '../../api'; 

const Settings = () => {
  const [activePage, setActivePage] = useState('company');
  const [company, setCompany] = useState({
    companyName: '',
    hrName: '',
    mobileNumber: '',
    pan: '',
    gst: '',
  });
  const [companyId, setCompanyId] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');
  const [companySaving, setCompanySaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Password change state
  const [userId, setUserId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      setCompanyLoading(true);
      setCompanyError('');
      try {
        const { data } = await API.get('/api/company/my');
        if (data.success && data.data) {
          const { companyName, hrName, mobileNumber, pan, gst, _id } = data.data;
          setCompany({ companyName, hrName, mobileNumber, pan, gst });
          setCompanyId(_id);
        }
      } catch (err) {
        setCompanyError(err.response?.data?.message || 'Could not load company profile.');
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompany();
  }, []);

  // Fetch current user id for password change
  useEffect(() => {
    const ensureUserId = async () => {
      try {
        const localUserId = localStorage.getItem('userId');
        if (localUserId) {
          setUserId(localUserId);
          return;
        }
        const { data } = await API.get('/api/auth/me');
        if (data?.user?._id) setUserId(data.user._id);
      } catch (err) {
        // silently ignore; password form will handle missing userId state
      }
    };
    ensureUserId();
  }, []);

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mobileNumber') {
      // Only allow digits and limit to 10 characters
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setCompany({ ...company, mobileNumber: digits });
    } else if (name === 'pan' || name === 'gst') {
      // Convert to uppercase as user types
      setCompany({ ...company, [name]: value.toUpperCase() });
    } else {
      setCompany({ ...company, [name]: value });
    }

    // Clear validation error if field is being edited
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateCompany = () => {
    const errors = {};
    if (!company.companyName.trim()) errors.companyName = 'Company name is required';
    if (!company.hrName.trim()) errors.hrName = 'HR name is required';
    if (!company.mobileNumber) errors.mobileNumber = 'Mobile number is required';
    else if (company.mobileNumber.length !== 10) errors.mobileNumber = 'Mobile number must be exactly 10 digits';
    if (!company.pan.trim()) errors.pan = 'PAN is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(company.pan)) errors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
    if (company.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(company.gst)) errors.gst = 'Invalid GST format';
    
    return errors;
  };

  const handleCompanySave = async (e) => {
    e.preventDefault();
    setCompanySaving(true);
    setCompanyError('');
    setCompanySuccess('');
    
    const errors = validateCompany();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setCompanySaving(false);
      return;
    }

    try {
      let res;
      if (companyId) {
        res = await API.put(`/api/company/${companyId}`, company);
      } else {
        res = await API.post('/api/company', company);
      }

      const { data } = res;
      setCompanySuccess(data.message || 'Company profile updated successfully!');
      if (data.data) {
        const returnedId = data.data._id || data.data.id;
        const { companyName, hrName, mobileNumber, pan, gst } = data.data;
        setCompany({ companyName, hrName, mobileNumber, pan, gst });
        if (returnedId) setCompanyId(returnedId);
      }
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validation = err.response?.data?.errors;
      if (validation && typeof validation === 'object') {
        setValidationErrors(validation);
        setCompanyError(apiMessage || 'Validation failed');
      } else {
        setCompanyError(apiMessage || err.message || 'Failed to save company profile');
      }
    } finally {
      setCompanySaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      setPasswordSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      setPasswordSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordSaving(false);
      return;
    }
    if (!userId) {
      setPasswordError('Unable to determine user. Please re-login and try again.');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await API.put(`/api/auth/change-password/${userId}`, {
        currentPassword,
        newPassword
      });
      setPasswordSuccess(res.data?.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        <Button
          variant={activePage === 'company' ? 'primary' : 'outline-primary'}
          onClick={() => setActivePage('company')}
        >
          Company Details
        </Button>
        <Button
          variant={activePage === 'security' ? 'primary' : 'outline-primary'}
          onClick={() => setActivePage('security')}
        >
          Security
        </Button>
      </div>

      {activePage === 'company' && (
        <Card className="shadow-sm">
          <Card.Header as="h5">Company Details</Card.Header>
          <Card.Body>
            {companyLoading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
              <>
                <p className="mb-4 text-muted">Change Company Details here</p>
                <Form onSubmit={handleCompanySave}>
                  {companyError && <Alert variant="danger">{companyError}</Alert>}
                  {companySuccess && <Alert variant="success">{companySuccess}</Alert>}
                  
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="companyName">
                        <Form.Label>Company Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="companyName"
                          value={company.companyName}
                          onChange={handleCompanyChange}
                          isInvalid={!!validationErrors.companyName}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.companyName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="hrName">
                        <Form.Label>HR Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="hrName"
                          value={company.hrName}
                          onChange={handleCompanyChange}
                          isInvalid={!!validationErrors.hrName}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.hrName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="mobileNumber">
                        <Form.Label>Mobile Number *</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>+91</InputGroup.Text>
                          <Form.Control
                            type="tel"
                            name="mobileNumber"
                            value={company.mobileNumber}
                            onChange={handleCompanyChange}
                            isInvalid={!!validationErrors.mobileNumber}
                            required
                            placeholder="10-digit number"
                            maxLength="10"
                          />
                        </InputGroup>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.mobileNumber}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="pan">
                        <Form.Label>PAN Number *</Form.Label>
                        <Form.Control
                          type="text"
                          name="pan"
                          value={company.pan}
                          onChange={handleCompanyChange}
                          isInvalid={!!validationErrors.pan}
                          required
                          placeholder="e.g., ABCDE1234F"
                          maxLength="10"
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.pan}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="gst">
                        <Form.Label>GST Number (Optional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="gst"
                          value={company.gst}
                          onChange={handleCompanyChange}
                          isInvalid={!!validationErrors.gst}
                          placeholder="Enter GST number"
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.gst}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} className="text-end">
                      <Button variant="primary" type="submit" disabled={companySaving}>
                        {companySaving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Company Details'
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {activePage === 'security' && (
        <Card className="shadow-sm">
          <Card.Header as="h5">Security</Card.Header>
          <Card.Body>
            <p className="mb-4 text-muted">Change your account password</p>
            <Form onSubmit={handlePasswordSave}>
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
              {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group controlId="currentPassword">
                    <Form.Label>Current Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        type="button"
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="newPassword">
                    <Form.Label>New Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        type="button"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="confirmPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        type="button"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col xs={12} className="text-end">
                  <Button variant="primary" type="submit" disabled={passwordSaving || !userId}>
                    {passwordSaving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Updating...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Settings;