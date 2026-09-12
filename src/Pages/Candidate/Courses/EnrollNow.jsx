import React, { useState, useEffect } from 'react';
import { requireLogin } from '../../../utils/requireLogin';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import {
  Container, Row, Col, Card, Button, Form, Alert, Modal, InputGroup
} from 'react-bootstrap';
import { CheckCircle } from 'react-bootstrap-icons';
import API from '../../../api';
import loadRazorpay from '../../../utils/loadRazorpay'; // Import the Razorpay loader

const EnrollNow = () => {
  const { id: courseId } = useParams(); 
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);

  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const studentId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/courses/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        console.error('Failed to fetch course', err);
        alert('Failed to load course details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const checkEnrollment = async () => {
      if (!studentId) {
        alert('Please login to enroll in courses.');
        navigate('/login');
        return;
      }

      try {
        const res = await API.get(`/api/enrollments/check/${studentId}/${courseId}`);
        setAlreadyEnrolled(!!res.data.enrolled);
      } catch (err) {
        console.error('Enrollment check failed', err);
      }
    };

    fetchCourse();
    if (studentId && courseId) {
      checkEnrollment();
    }
  }, [courseId, studentId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: digitsOnly }));
  };

  const applyCoupon = () => {
    if (coupon === 'LEARN20') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const initiatePayment = async () => {
    if (!studentId) {
      alert('Please login to enroll in courses.');
      navigate('/login');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    if (!course || !course.price) {
      alert('Course information is missing. Please refresh the page.');
      return;
    }
  
    setPaymentProcessing(true);
  
    try {
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) throw new Error('Payment gateway failed to load');
  
      // Calculate discount price (20% off for LEARN20 coupon)
      const discountPrice = couponApplied ? Math.round((course.price || 0) * 0.8) : (course.price || 0);
      
      // Validate amount
      if (discountPrice <= 0) {
        throw new Error('Invalid payment amount');
      }
  
      // Create order on backend
      console.log('Creating payment order with:', {
        amount: discountPrice,
        currency: 'INR',
        courseId,
        studentId
      });

      const orderResponse = await API.post('/api/payment/create-order', {
        amount: discountPrice,
        currency: 'INR',
        notes: {
          courseId,
          studentId,
          type: 'course_enrollment'
        }
      });

      console.log('Order response:', orderResponse.data);

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || 'Failed to create payment order');
      }

      // Check if we got a valid order ID
      if (!orderResponse.data.orderId) {
        throw new Error('Invalid order response - missing order ID');
      }

      // If it's a mock order, skip Razorpay and complete payment directly
      if (orderResponse.data.isMockOrder) {
        console.log('Mock order detected, completing payment directly...');
        
        try {
          // Verify mock payment
          console.log('Verifying mock payment...');
          const verifyResponse = await API.post('/api/payment/verify', {
            orderId: orderResponse.data.orderId,
            courseId,
            studentId,
            isMockOrder: true
          });

          console.log('Payment verification response:', verifyResponse.data);

          if (!verifyResponse.data.success) {
            throw new Error(verifyResponse.data.error || 'Payment verification failed');
          }

          // Complete enrollment
          console.log('Payment verified, completing enrollment...');
          await completeEnrollment();
          return;
        } catch (error) {
          console.error('Mock payment verification failed:', error);
          alert(`Payment verification failed: ${error.response?.data?.error || error.message}`);
          setPaymentProcessing(false);
          return;
        }
      }
  
      const options = {
        key: orderResponse.data.key || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: course.title || 'Course',
        description: `Payment for ${course.title || 'Course'}`,
        image: '/logo.jpeg',
        order_id: orderResponse.data.orderId,
        handler: async function(response) {
          try {
            console.log('Razorpay payment response:', response);
            
            // Validate Razorpay response
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Invalid payment response from Razorpay');
            }

            console.log('Verifying real payment...');
            // Verify payment
            const verifyResponse = await API.post('/api/payment/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderResponse.data.orderId,
              courseId,
              studentId,
              isMockOrder: orderResponse.data.isMockOrder
            });

            console.log('Payment verification response:', verifyResponse.data);

            if (!verifyResponse.data.success) {
              throw new Error(verifyResponse.data.error || 'Payment verification failed');
            }
  
            // Complete enrollment
            console.log('Payment verified, completing enrollment...');
            await completeEnrollment();
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert(`Payment verification failed: ${error.message}`);
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#3399cc'
        }
      };
  
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
        setPaymentProcessing(false);
      });
  
      rzp.open();
  
    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('Payment initialization failed. Please try again.');
      setPaymentProcessing(false);
    }
  };
  
  const completeEnrollment = async () => {
    try {
      console.log('Payment and enrollment completed successfully!');
      
      // Enrollment is already created in the payment verification route
      // No need to create it again here
      
      // Update UI state
      setPaymentSuccess(true);

      // Notify other parts of the app (e.g., course listings) to update button state
      try {
        window.dispatchEvent(new CustomEvent('course-enrolled', { detail: { courseId } }));
      } catch (eventError) {
        console.warn('Failed to dispatch course-enrolled event', eventError);
      }
    } catch (err) {
      console.error('Enrollment completion failed:', err);
      alert('Enrollment completion failed. Please contact support.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const navigateToMyCourses = () => {
    // preserve origin if user came from career-certificate
    navigate('/my-courses', { state: { openCourseId: courseId, origin: 'career-certificate' } });
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading course details...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <div className="text-center">
        <h4 className="text-danger">Course not found</h4>
        <p>Please check the course URL and try again.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
      </div>
    </div>
  );

  if (paymentSuccess) {
    return (
      <div>
        <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
          <div className="container d-flex justify-content-between align-items-center">
            <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
            <div className="ms-auto">
              <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
                <FaHome className="me-1" />
                <span className="d-none d-sm-inline">Dashboard</span>
                <span className="d-inline d-sm-none">Home</span>
              </Link>
            </div>
          </div>
        </nav>
        <Container className="my-5">
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <div className="p-5 bg-light rounded-3 shadow-sm">
                <CheckCircle className="text-success mb-4" size={48} />
                <h2 className="mb-3">Payment Successful!</h2>
                <p className="lead mb-4">
                  You've successfully enrolled in <strong>{course.title || 'Course'}</strong>.<br />
                  Course details sent to <strong>{formData.email}</strong>.
                </p>
                <Button variant="primary" size="lg" onClick={navigateToMyCourses}>
                  Go to My Courses
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Calculate discount price
  const discountPrice = couponApplied ? Math.round((course.price || 0) * 0.8) : (course.price || 0);
  const discountAmount = (course.price || 0) - discountPrice;

  // Check if course is free
  const isFreeCourse = (course.price || 0) === 0;

  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
        <div className="container d-flex justify-content-between align-items-center">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
          <div className="ms-auto">
            <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
              <FaHome className="me-1" />
              <span className="d-none d-sm-inline">Dashboard</span>
              <span className="d-inline d-sm-none">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      <Container className="my-5">
        <Row>
          <Col lg={8}>
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h2 className="mb-4 fw-bold">Enroll in {course.title || 'Course'}</h2>
                {alreadyEnrolled ? (
                  <Alert variant="success" className="mb-0">
                    You are already enrolled in this course.
                    <div className="mt-3">
                      <Button variant="success" onClick={navigateToMyCourses}>
                        Go to My Courses
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <>
                    <h5 className="fw-bold">Your Information</h5>
                    <Form>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Email *</Form.Label>
                          <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>Phone *</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>+91</InputGroup.Text>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handlePhoneChange}
                              placeholder="10-digit mobile number"
                              maxLength={10}
                              inputMode="numeric"
                              pattern="[0-9]{10}"
                              required
                            />
                          </InputGroup>
                        </Col>
                      </Row>
                    </Form>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm sticky-top" style={{ top: '20px', border: 'none' }}>
              <Card.Body className="p-4">
                <h5 className="mb-4 fw-bold">Order Summary</h5>
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Course Price:</span>
                    <span>{isFreeCourse ? 'Free' : `₹${course.price || 0}`}</span>
                  </div>
                  {couponApplied && !isFreeCourse && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount (LEARN20):</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total:</span>
                    <span>{isFreeCourse ? 'Free' : `₹${discountPrice}`}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold">What's included:</h6>
                  <ul className="list-unstyled small">
                    <li className="mb-2"><CheckCircle className="me-2 text-success" /> video lessons</li>
                    <li className="mb-2"><CheckCircle className="me-2 text-success" /> Certificate of completion</li>
                    <li className="mb-2"><CheckCircle className="me-2 text-success" /> Lifetime access</li>
                    <li><CheckCircle className="me-2 text-success" /> Instructor support</li>
                  </ul>
                </div>

                {alreadyEnrolled ? (
                  <Button 
                    variant="success" 
                    size="lg" 
                    className="w-100 py-3 fw-bold rounded-1" 
                    onClick={navigateToMyCourses}
                  >
                    Enrolled — Go to My Courses
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 py-3 fw-bold rounded-1" 
                    onClick={isFreeCourse ? completeEnrollment : initiatePayment}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? 'Processing...' : isFreeCourse ? 'Enroll for Free' : 'Pay Securely'}
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EnrollNow;