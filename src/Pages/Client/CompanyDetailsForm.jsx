// src/components/CompanyDetailsForm.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api'; 
import {
  Form, Button, Card, Alert, Container, Row, Col, Spinner, Navbar, InputGroup
} from 'react-bootstrap';

const CompanyDetailsForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    hrName: '',
    mobileNumber: '',
    pan: '',
    gst: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobileNumber') {
      // Only allow digits and limit to 10 characters
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, mobileNumber: digits });
    } else if (name === 'pan') {
      // Convert PAN to uppercase as user types
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else if (name === 'gst') {
      // Convert GST to uppercase as user types
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.hrName.trim()) {
      newErrors.hrName = 'HR name is required';
    }

    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }

    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
    }

    if (formData.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst)) {
      newErrors.gst = 'Invalid GST format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (validateForm()) {
    setIsSubmitting(true);
    setSubmitMessage({ type: '', message: '' });

    try {
      const response = await API.post('/api/company', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 200 || response.status === 201) {
        setSubmitMessage({
          type: 'success',
          message: response.data?.message || 'Company details submitted successfully!'
        });

        setTimeout(() => {
          navigate('/naukri-client-portal');
        }, 2000);
      } else {
        setSubmitMessage({
          type: 'danger',
          message: response.data?.message || 'Failed to submit company details'
        });

        if (response.data?.errors) {
          setErrors(response.data.errors);
        }
      }
    } catch (error) {
      setSubmitMessage({
        type: 'danger',
        message: error.response?.data?.message || error.message || 'Network error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }
};

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingTop: '80px' }}>
      <Navbar bg="light" className="shadow-sm fixed-top">
        <Container>
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
          <Navbar.Collapse className="justify-content-end">
            <Link to="/" className="btn btn-outline-dark">Logout</Link>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="rounded-4 overflow-hidden shadow-lg border-0">
              <Row className="g-0">
                <Col lg={6} className="bg-white p-5">
                  <h2 className="fw-bold text-primary mb-2">Client Register</h2>
                  <p className="text-muted mb-4">Create your account to start hiring top talent.</p>

                  {submitMessage.message && (
                    <Alert variant={submitMessage.type}>{submitMessage.message}</Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="companyName"
                        value={formData.companyName}
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
                        value={formData.hrName}
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
                          value={formData.mobileNumber}
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
                            value={formData.pan}
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
                            value={formData.gst}
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
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Company Detail'
                      )}
                    </Button>
                  </Form>
                </Col>

                <Col lg={6} className="bg-primary text-white p-5 d-flex align-items-center">
                  <div>
                    <h3 className="fw-bold mb-4">Why register as a client?</h3>
                    <ul className="list-unstyled">
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">🔍</span>
                        <div>
                          <strong>Access to top talent:</strong>
                          <p className="mb-0">Connect with thousands of qualified candidates.</p>
                        </div>
                      </li>
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">🤖</span>
                        <div>
                          <strong>AI-powered matching:</strong>
                          <p className="mb-0">Smart algorithms find perfect candidates.</p>
                        </div>
                      </li>
                      <li className="mb-4 d-flex">
                        <span className="me-3 fs-4">📊</span>
                        <div>
                          <strong>Streamlined hiring:</strong>
                          <p className="mb-0">Manage recruitment from one dashboard.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>

      <footer className="text-center text-muted py-3">
        <p className="mb-0">© {new Date().getFullYear()} JobilioHR. All rights reserved. Powered by Rokoso Technology Service Pvt Ltd.</p>
      </footer>
    </div>
  );
};

export default CompanyDetailsForm;