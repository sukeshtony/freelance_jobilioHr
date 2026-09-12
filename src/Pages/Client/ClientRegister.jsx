import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import {
  Form, Button, Card, Alert, Container, Row, Col, Spinner, Navbar, InputGroup, Modal
} from 'react-bootstrap';
import API from '../../api';

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  name,
  required,
  label,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-3">
      <label className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="input-group">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={togglePasswordVisibility}
          style={{ borderColor: error ? '#dc3545' : '#ced4da' }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
    </div>
  );
};

const ClientRegister = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Client',
    companyName: '',
    hrName: '',
    mobileNumber: '',
    pan: '',
    gst: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userToken, setUserToken] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const existingRole = params.get('existingRole');
    if (errorParam === 'email_exists_in_other_role') {
      setError(`Email already exists for role ${existingRole || ''}. Please sign in with that role or use a different email.`);
    }
  }, [location.search]);

  useEffect(() => {
    let timer;
    if (resendDisabled && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (resendTimer === 0) {
      setResendDisabled(false);
      setResendTimer(30);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, resendTimer]);

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'mobileNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, mobileNumber: digits });
    } else if (name === 'pan' || name === 'gst') {
      setForm({ ...form, [name]: value.toUpperCase() });
    } else {
      setForm({ ...form, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!form.hrName.trim()) newErrors.hrName = 'HR name is required';
    if (!form.mobileNumber) newErrors.mobileNumber = 'Mobile number is required';
    else if (form.mobileNumber.length !== 10) newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    if (!form.pan.trim()) newErrors.pan = 'PAN is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
    if (form.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gst)) {
      newErrors.gst = 'Invalid GST format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate step 2 first
    if (!validateStep2()) return;

    // Pre-flight availability checks (no side effects)
    try {
      const [emailCheck, panCheck] = await Promise.all([
        API.post('/api/auth/check-email', { email: form.email }),
        API.post('/api/company/check-pan', { pan: form.pan })
      ]);
      if (emailCheck.data?.exists) {
        setError('Email already exists');
        return;
      }
      if (panCheck.data?.exists) {
        setErrors(prev => ({ ...prev, pan: 'PAN number already exists' }));
        setError('PAN number already exists');
        return;
      }
    } catch (preErr) {
      // If pre-checks fail unexpectedly, surface a generic error and stop
      console.error('Availability pre-checks failed:', preErr);
      setError('Unable to validate email/PAN availability. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Register user (unverified)
      const authResponse = await API.post('/api/auth/clientRegister', {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role
      });

      if (authResponse.data.success && authResponse.data.token) {
        const token = authResponse.data.token;
        setUserToken(token);
        localStorage.setItem('tempToken', token); // Store temporary token

        setSuccess('Registration successful! Please check your email for verification code.');
        setShowVerificationModal(true);
        setResendDisabled(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async e => {
    e.preventDefault();
    setVerificationError('');
    setVerificationSuccess('');

    if (!verificationCode.trim()) {
      setVerificationError('Verification code is required');
      return;
    }

    if (verificationCode.length !== 6) {
      setVerificationError('Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const initialToken = localStorage.getItem('tempToken') || userToken;

      // Step 1: Verify email
      const verifyResponse = await API.post('/api/auth/verify-email', {
        code: verificationCode,
        email: form.email
      });

      if (verifyResponse.data.verified) {
        setVerificationSuccess('Email verified successfully!');

        // Clear temporary token
        localStorage.removeItem('tempToken');

        // Login to obtain a verified token and persist session
        const loginResponse = await API.post('/api/auth/login', {
          email: form.email,
          password: form.password,
          role: 'Client'
        });
        if (!loginResponse.data?.token) {
          throw new Error('Login failed after verification');
        }
        localStorage.setItem('token', loginResponse.data.token);
        if (loginResponse.data.user) {
          localStorage.setItem('role', loginResponse.data.user.role || 'Client');
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
          localStorage.setItem('username', loginResponse.data.user.username || '');
          localStorage.setItem('userId', loginResponse.data.user.id || loginResponse.data.user._id || '');
        } else {
          localStorage.setItem('role', 'Client');
        }

        // Submit company details using verified token (do not surface PAN errors here)
        try {
          const companyResponse = await API.post('/api/company', {
            companyName: form.companyName,
            hrName: form.hrName,
            mobileNumber: form.mobileNumber,
            pan: form.pan,
            gst: form.gst
          }, {
            headers: { Authorization: `Bearer ${loginResponse.data.token}` }
          });

          if (companyResponse.data?.success) {
            setVerificationSuccess('Company details registered successfully! Redirecting to dashboard...');
          }
        } catch (companyErr) {
          const msg = companyErr?.response?.data?.message || '';
          if (msg === 'PAN number already exists' || msg === 'Company with this PAN number already exists') {
            // Do not block verification step UI; just proceed to dashboard
          } else {
            // Other errors: show generic error in modal
            setVerificationError('Failed to save company details. You can update them later from settings.');
          }
        }

        setTimeout(() => {
          navigate('/naukri-client-portal');
        }, 1200);
      }
    } catch (err) {
      console.error('Verification error:', err);
      if (err.response?.data?.message) {
        setVerificationError(err.response.data.message);
      } else {
        setVerificationError('Verification failed. Please check your code and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      const token = localStorage.getItem('tempToken') || userToken;
      
      await API.post('/api/auth/resend-verification', { 
        email: form.email 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVerificationSuccess('Verification code resent successfully!');
      setResendDisabled(true);
      setResendTimer(30);
      setVerificationError('');
    } catch (err) {
      console.error('Resend error:', err);
      if (err.response?.data?.message) {
        setVerificationError(err.response.data.message);
      } else {
        setVerificationError('Failed to resend verification code. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API.defaults.baseURL}/api/auth/google/register/Client`;
  };

  const closeVerificationModal = () => {
    if (!verificationSuccess.includes('Redirecting')) {
      setShowVerificationModal(false);
      setVerificationCode('');
      setVerificationError('');
      setVerificationSuccess('');
    }
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingTop: '80px' }}>
      <Navbar bg="light" className="shadow-sm fixed-top">
        <Container>
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
          <Navbar.Collapse className="justify-content-end">
            <Link to="/" className="btn btn-outline-dark">Home</Link>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="rounded-4 overflow-hidden shadow-lg border-0">
              <Row className="g-0">
                {/* Left: Form Side */}
                <Col lg={6} className="bg-white p-5">
                  <h2 className="fw-bold text-primary mb-2">Client Register</h2>
                  <p className="text-muted mb-4">Create your account to start hiring top talent.</p>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && !showVerificationModal && <Alert variant="success">{success}</Alert>}

                  {step === 1 ? (
                    <Form onSubmit={handleNext}>
                      <Form.Group className="mb-3">
                        <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="username"
                          value={form.username}
                          onChange={handleChange}
                          isInvalid={!!errors.username}
                          placeholder="Enter username"
                        />
                        <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          isInvalid={!!errors.email}
                          placeholder="name@company.com"
                        />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                      </Form.Group>

                      <PasswordInput
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        name="password"
                        required
                        label="Password"
                        error={errors.password}
                      />

                      <PasswordInput
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        name="confirmPassword"
                        required
                        label="Confirm Password"
                        error={errors.confirmPassword}
                      />

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label={
                            <span>
                              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                            </span>
                          }
                          required
                        />
                      </Form.Group>

                      <Button variant="primary" type="submit" className="w-100 mb-3">
                        Next
                      </Button>

                      <div className="text-center my-3">
                        <span className="bg-white px-3 text-muted">or</span>
                      </div>

                      <Button
                        variant="outline-dark"
                        className="w-100 d-flex align-items-center justify-content-center"
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </Button>
                    </Form>
                  ) : (
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="companyName"
                          value={form.companyName}
                          onChange={handleChange}
                          isInvalid={!!errors.companyName}
                          placeholder="Enter company name"
                        />
                        <Form.Control.Feedback type="invalid">{errors.companyName}</Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>HR Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="hrName"
                          value={form.hrName}
                          onChange={handleChange}
                          isInvalid={!!errors.hrName}
                          placeholder="Enter HR representative name"
                        />
                        <Form.Control.Feedback type="invalid">{errors.hrName}</Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Mobile Number <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                          <InputGroup.Text>+91</InputGroup.Text>
                          <Form.Control
                            type="tel"
                            name="mobileNumber"
                            value={form.mobileNumber}
                            onChange={handleChange}
                            isInvalid={!!errors.mobileNumber}
                            placeholder="10-digit number"
                            maxLength="10"
                          />
                        </InputGroup>
                        <Form.Control.Feedback type="invalid">
                          {errors.mobileNumber}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>PAN Number <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              name="pan"
                              value={form.pan}
                              onChange={handleChange}
                              isInvalid={!!errors.pan}
                              placeholder="e.g., ABCDE1234F"
                              maxLength="10"
                            />
                            <Form.Control.Feedback type="invalid">{errors.pan}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>GST Number (Optional)</Form.Label>
                            <Form.Control
                              type="text"
                              name="gst"
                              value={form.gst}
                              onChange={handleChange}
                              isInvalid={!!errors.gst}
                              placeholder="Enter GST number"
                            />
                            <Form.Control.Feedback type="invalid">{errors.gst}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting}
                        className="w-100"
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Company Details'
                        )}
                      </Button>
                    </Form>
                  )}

                  <div className="text-center mt-3">
                    <small>
                      Already have an account? <Link to="/client/login">Sign in</Link>
                    </small>
                  </div>
                </Col>

                {/* Right: Info Side */}
                <Col lg={6} className="bg-primary text-white p-5 d-flex align-items-center">
                  <div>
                    <h3 className="fw-bold mb-4">Why register as a client?</h3>
                    <ul className="list-unstyled">
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">🔍</span>
                        <div>
                          <strong>Access to top talent:</strong>
                          <p className="mb-0">Connect with thousands of qualified candidates in our database.</p>
                        </div>
                      </li>
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">🤖</span>
                        <div>
                          <strong>AI-powered matching:</strong>
                          <p className="mb-0">Our smart algorithms find the perfect candidates for your needs.</p>
                        </div>
                      </li>
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">📊</span>
                        <div>
                          <strong>Streamlined hiring:</strong>
                          <p className="mb-0">Manage the entire recruitment process from a single dashboard.</p>
                        </div>
                      </li>
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">🌍</span>
                        <div>
                          <strong>Global reach:</strong>
                          <p className="mb-0">Post jobs and hire talent from anywhere in the world.</p>
                        </div>
                      </li>
                    </ul>
                    <p className="text-white-50 mt-4"><strong>TMS</strong> – Trusted by 10,000+ companies worldwide.</p>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Email Verification Modal */}
      <Modal 
        show={showVerificationModal} 
        centered 
        backdrop="static"
        onHide={closeVerificationModal}
        size="lg"
      >
        <Modal.Header closeButton={!verificationSuccess.includes('Redirecting')}>
          <Modal.Title className="d-flex align-items-center">
            <FaEnvelope className="text-primary me-2" />
            Email Verification Required
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-4">
          <div className="text-center">
            {!verificationSuccess.includes('Redirecting') ? (
              <>
                <div className="mb-4">
                  <FaEnvelope className="text-primary" style={{ fontSize: '3rem' }} />
                </div>
                
                <h4 className="mb-3">Check Your Email</h4>
                <p className="text-muted mb-4">
                  We've sent a 6-digit verification code to <strong>{form.email}</strong>
                </p>

                {verificationSuccess && (
                  <Alert variant="success" className="mb-3">
                    <FaCheckCircle className="me-2" />
                    {verificationSuccess}
                  </Alert>
                )}
                
                {verificationError && (
                  <Alert variant="danger" className="mb-3">
                    {verificationError}
                  </Alert>
                )}

                <Form onSubmit={handleVerification}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Verification Code</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength="6"
                      className="text-center"
                      style={{ fontSize: '1.2rem', letterSpacing: '0.5rem' }}
                    />
                    <Form.Text className="text-muted">
                      Enter the 6-digit code sent to your email
                    </Form.Text>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3"
                    disabled={isVerifying || !verificationCode.trim()}
                    size="lg"
                  >
                    {isVerifying ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Complete Registration'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="mb-2 text-muted">Didn't receive the code?</p>
                    <Button
                      variant="link"
                      onClick={resendVerificationCode}
                      disabled={resendDisabled}
                      className="text-decoration-none"
                    >
                      {resendDisabled ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                    </Button>
                  </div>
                </Form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <FaCheckCircle className="text-success" style={{ fontSize: '4rem' }} />
                </div>
                <h4 className="text-success mb-3">Registration Complete!</h4>
                <p className="text-muted mb-4">
                  Your email has been verified and company details have been registered successfully.
                </p>
                <div className="d-flex justify-content-center">
                  <Spinner animation="border" variant="primary" />
                  <span className="ms-2">Redirecting to dashboard...</span>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <footer className="text-center text-muted py-3">
        <p className="mb-0">© {new Date().getFullYear()} JobilioHR Client Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ClientRegister;