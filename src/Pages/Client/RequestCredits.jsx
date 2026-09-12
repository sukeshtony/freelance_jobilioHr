import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Send, CreditCard } from 'react-bootstrap-icons';
import API from '../../api';

const RequestCredits = () => {
  const [form, setForm] = useState({ phone: '', reason: '', creditsRequested: 10 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      setCompanyLoading(true);
      setCompanyError('');
      try {
        const { data } = await API.get('/api/company/my');
        if (data.success && data.data) {
          const { companyName, hrName, mobileNumber, pan, gst, _id } = data.data;
          setCompany({ companyName, hrName, mobileNumber, pan, gst });
          
          // Pre-fill the phone number if available
          if (mobileNumber) {
            // Remove the +91 prefix if present
            const phoneWithoutPrefix = mobileNumber.replace(/^\+91/, '');
            setForm(prev => ({ ...prev, phone: phoneWithoutPrefix }));
          }
        }
      } catch (err) {
        setCompanyError(err.response?.data?.message || 'Could not load company profile.');
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompany();
  }, []);

  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    
    // Remove all non-digit characters
    const digitsOnly = inputValue.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digitsOnly.slice(0, 10);
    
    setForm((prev) => ({ ...prev, phone: limitedDigits }));
    
    // Validate immediately for better UX
    if (limitedDigits.length === 0) {
      setPhoneError('Phone number is required');
    } else if (limitedDigits.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleKeyDown = (e) => {
    // Allow navigation and control keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 
      'Home', 'End', 'Enter', 'Shift'
    ];
    
    // Prevent typing if we already have 10 digits (unless it's a control key)
    if (form.phone.length >= 10 && 
        !allowedKeys.includes(e.key) &&
        !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleOtherChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Clear previous errors
    setPhoneError('');
    
    let isValid = true;
    
    if (!form.phone) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (form.phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      isValid = false;
    }
    
    return isValid;
  };

  const onSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSuccess('');
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const phoneWithPrefix = `+91${form.phone}`; // Add +91 prefix
      
      await API.post(
        '/api/credits/request',
        {
          phone: phoneWithPrefix,
          reason: form.reason,
          creditsRequested: form.creditsRequested,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Credit request submitted successfully! Our team will review it shortly.');
      setForm({ phone: form.phone, reason: '', creditsRequested: 10 }); // Keep the phone number
    } catch (err) {
      console.error('Error submitting credit request:', err);
      setError(err.response?.data?.error || 'Failed to submit credit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4" style={{ marginTop: '2%' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
              <h4 className="mb-0 d-flex align-items-center">
                <CreditCard className="me-2" /> Request Credits
              </h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                You can request additional credits for free. Our team will review your request and approve it shortly.
              </Alert>

              {success && (
                <Alert 
                  variant="success" 
                  onClose={() => setSuccess('')} 
                  dismissible
                  style={{ 
                    position: 'fixed',
                    top: '2%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    minWidth: '300px',
                    maxWidth: '90vw'
                  }}
                >
                  {success}
                </Alert>
              )}
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              {companyError && (
                <Alert variant="warning" onClose={() => setCompanyError('')} dismissible>
                  {companyError}
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                  {companyLoading ? (
                    <div className="text-muted">Loading phone number...</div>
                  ) : company && company.mobileNumber ? (
                    <InputGroup>
                      <InputGroup.Text>+91</InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={form.phone}
                        readOnly
                        disabled
                      />
                    </InputGroup>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <div 
                        style={{ 
                          backgroundColor: '#6c757d',
                          border: '1px solid #6c757d',
                          borderRight: 'none',
                          color: 'white',
                          fontWeight: '600',
                          padding: '0.375rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '60px',
                          borderTopLeftRadius: '0.375rem',
                          borderBottomLeftRadius: '0.375rem',
                          fontSize: '14px'
                        }}
                      >
                        +91
                      </div>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handlePhoneChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          // Validate when user leaves the field
                          if (form.phone && form.phone.length !== 10) {
                            setPhoneError('Phone number must be exactly 10 digits');
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text');
                          const digitsOnly = pastedData.replace(/[^0-9]/g, '').slice(0, 10);
                          setForm((prev) => ({ ...prev, phone: digitsOnly }));
                          
                          // Validate immediately after paste
                          if (digitsOnly.length !== 10) {
                            setPhoneError('Phone number must be exactly 10 digits');
                          } else {
                            setPhoneError('');
                          }
                        }}
                        placeholder="10-digit number"
                        required
                        isInvalid={!!phoneError}
                        style={{ 
                          borderLeft: 'none',
                          borderTopLeftRadius: '0',
                          borderBottomLeftRadius: '0'
                        }}
                      />
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {phoneError}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    {company && company.mobileNumber 
                      ? "This is your registered company phone number" 
                      : "Enter exactly 10 digits (e.g., 9876543210)"}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Credits Requested <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="creditsRequested" value={form.creditsRequested} onChange={handleOtherChange} required>
                    <option value="10">10 Credits</option>
                    <option value="25">25 Credits</option>
                    <option value="50">50 Credits</option>
                    <option value="100">100 Credits</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason for Request</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="reason"
                    value={form.reason}
                    onChange={handleOtherChange}
                    placeholder="Please describe why you need additional credits..."
                  />
                </Form.Group>
              </Form>
            </Card.Body>
            <Card.Footer className="bg-white border-0 d-flex justify-content-end">
              <Button variant="primary" onClick={onSubmit} disabled={submitting}>
                <Send className="me-1" /> {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RequestCredits;