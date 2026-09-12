import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container, Row, Col, Nav, Button, Badge,
  Alert, Modal, Form, Offcanvas, Navbar, InputGroup
} from 'react-bootstrap';
import {
  BarChart, Search, Briefcase, ListUl, PersonLinesFill,
  Star, Gear, QuestionCircle, CreditCard
} from 'react-bootstrap-icons';
import { FaBars } from "react-icons/fa";
import API from '../../api';
import JobRequirementsForm from './JobRequirementsForm';

import Dashboard from '../../Pages/Client/Dashboard';
import SearchResumes from '../../Pages/Client/SearchResumes';
import PostJob from '../../Pages/Client/PostJob';
import Responses from '../../Pages/Client/Responses';

import Settings from '../../Pages/Client/Settings';
import SupportHelp from '../../Pages/Client/SupportHelp';

const ClientDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showRequirementsForm, setShowRequirementsForm] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showCreditRequestModal, setShowCreditRequestModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [creditRequest, setCreditRequest] = useState({
    phone: '',
    reason: '',
    creditsRequested: 10
  });
  const [creditRequestError, setCreditRequestError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    const openCreditRequest = searchParams.get('openCreditRequest');
    if (openCreditRequest) {
      navigate('/candidates?openCreditRequest=true');
    }
  }, [searchParams, navigate]);

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/api/user/credits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredits(res.data.credits);
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  useEffect(() => {
    fetchUserCredits();
  }, []);

  const handleCreditRequestChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Remove any non-digit characters and limit to 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setCreditRequest(prev => ({ ...prev, phone: digitsOnly }));
      
      // Clear error when user starts typing
      if (digitsOnly.length === 10) {
        setCreditRequestError('');
      }
    } else {
      setCreditRequest(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreditRequest = async () => {
    // Validate phone number
    if (creditRequest.phone.length !== 10) {
      setCreditRequestError('Phone number must be exactly 10 digits');
      return;
    }
    
    setCreditRequestError('');
    
    try {
      const token = localStorage.getItem('token');
      await API.post('/api/credits/request', {
        phone: `+91${creditRequest.phone}`, // Add +91 prefix
        reason: creditRequest.reason,
        creditsRequested: creditRequest.creditsRequested
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreditRequestModal(false);
      setCreditRequest({
        phone: '',
        reason: '',
        creditsRequested: 10
      });
      
      setNotification({
        show: true,
        message: 'Credit request submitted successfully! Our team will review it shortly.',
        type: 'success'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'info' });
      }, 5000);
    } catch (error) {
      console.error('Error submitting credit request:', error);
      setNotification({
        show: true,
        message: error.response?.data?.error || 'Failed to submit credit request. Please try again.',
        type: 'danger'
      });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowSidebar(false); // Close sidebar on mobile after tab selection
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard credits={credits} />;
      case 'search': return <SearchResumes credits={credits} />;
      case 'post': return <PostJob />;
      case 'responses': return <Responses />;
      case 'settings': return <Settings />;
      case 'support': return <SupportHelp />;
      default: return <Dashboard credits={credits} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/'); 
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <Navbar expand="lg" className="navbar-light bg-white shadow-sm fixed-top">
        <Container fluid className="px-3 px-md-4">
          <div className="d-flex justify-content-between align-items-center w-100">
            {/* Left side - Menu button and Logo */}
            <div className="d-flex align-items-center">
              <Button
                variant="link"
                className="d-lg-none p-0 me-2 me-md-3"
                onClick={() => setShowSidebar(true)}
                style={{ minWidth: '44px' }}
              >
                <FaBars size={20} />
              </Button>
              <img 
                src="/logo.jpeg" 
                alt="Company Logo" 
                style={{ 
                  height: '35px', 
                  maxWidth: '120px',
                  objectFit: 'contain'
                }} 
                className="me-2"
              />
            </div>
            
            {/* Right side - Actions and Logout */}
            <div className="d-flex gap-1 gap-md-2 align-items-center">
              {/* Desktop-only elements */}
              <Badge bg="info" className="me-1 me-md-2 d-none d-sm-inline">
                <CreditCard className="me-1" /> 
                <span className="d-none d-md-inline">Credits:</span>
                <span className="d-inline d-md-none">Cred:</span>
                {credits}
              </Badge>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowCreditRequestModal(true)}
                className="d-none d-sm-inline"
              >
                <span className="d-none d-md-inline">Request Credits</span>
                <span className="d-inline d-md-none">Credits</span>
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => handleTabChange('settings')}
                className="d-none d-sm-inline"
              >
                <span className="d-none d-md-inline">Update Profile</span>
                <span className="d-inline d-md-none">Profile</span>
              </Button>
              
              {/* Logout button - Always visible */}
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={handleLogout}
                className="ms-1 ms-md-2"
                style={{ 
                  minWidth: '60px',
                  fontSize: '0.875rem'
                }}
              >
                <span className="d-none d-sm-inline">Logout</span>
                <span className="d-inline d-sm-none">Out</span>
              </Button>
            </div>
          </div>
        </Container>
      </Navbar>

      {/* Notification Alert - Fixed position below navbar */}
      {notification.show && (
        <div 
          style={{ 
            position: 'fixed', 
            top: '76px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1040, 
            width: '90%', 
            maxWidth: '600px', 
            marginBottom: '20px'
          }}
        >
          <Alert 
            variant={notification.type} 
            dismissible 
            onClose={() => setNotification({ show: false, message: '', type: 'info' })}
            className="m-0"
          >
            <span className="fs-7 fs-md-6">{notification.message}</span>
          </Alert>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="sidebar d-none d-md-block">
        <div className="d-flex flex-column p-3">
          <Nav variant="pills" className="flex-column mt-2">
            <Nav.Item>
              <Nav.Link 
                eventKey="dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => handleTabChange('dashboard')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6"
              >
                <BarChart className="me-2" /> Dashboard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="search" 
                active={activeTab === 'search'} 
                onClick={() => handleTabChange('search')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6 text-nowrap"
              >
                <Search className="me-2" /> Search Resumes
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="post" 
                active={activeTab === 'post'} 
                onClick={() => handleTabChange('post')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6 text-nowrap"
              >
                <Briefcase className="me-2" /> Post a Job
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="manage" 
                onClick={() => navigate('/manage-jobs')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6"
              >
                <ListUl className="me-2" /> Manage Jobs
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="responses" 
                active={activeTab === 'responses'} 
                onClick={() => handleTabChange('responses')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6"
              >
                <PersonLinesFill className="me-2" /> Responses
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => navigate('/candidates')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6"
              >
                <Star className="me-2" /> Candidates
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="requirements" 
                onClick={() => navigate('/my-requirements')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6 text-nowrap"
              >
                <Briefcase className="me-2" /> My Requirements
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="support" 
                active={activeTab === 'support'} 
                onClick={() => handleTabChange('support')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6 text-nowrap"
              >
                <QuestionCircle className="me-2" /> Support & Help
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="settings" 
                active={activeTab === 'settings'} 
                onClick={() => handleTabChange('settings')} 
                className="d-flex align-items-center rounded-pill fs-7 fs-md-6"
              >
                <Gear className="me-2" /> Settings
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <div className="mt-auto">
            <hr />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content" style={{ paddingTop: notification.show ? '120px' : '76px' }}>
        {renderContent()}
      </div>

      {/* Mobile Sidebar Offcanvas */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fs-6">Navigation Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* Credits Section for Mobile */}
          <div className="mb-4 p-3 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Badge bg="info" className="fs-7">
                <CreditCard className="me-1" /> Credits: {credits}
              </Badge>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => {
                  setShowCreditRequestModal(true);
                  setShowSidebar(false);
                }}
                className="fs-7"
              >
                Request Credits
              </Button>
            </div>
            <small className="text-muted fs-8">Use credits to view candidate resumes</small>
          </div>

          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <Nav.Link 
                eventKey="dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => handleTabChange('dashboard')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <BarChart className="me-2" /> Dashboard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="search" 
                active={activeTab === 'search'} 
                onClick={() => handleTabChange('search')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <Search className="me-2" /> Search Resumes
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="post" 
                active={activeTab === 'post'} 
                onClick={() => handleTabChange('post')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <Briefcase className="me-2" /> Post a Job
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="manage" 
                onClick={() => navigate('/manage-jobs')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <ListUl className="me-2" /> Manage Jobs
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="responses" 
                active={activeTab === 'responses'} 
                onClick={() => handleTabChange('responses')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <PersonLinesFill className="me-2" /> Responses
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => navigate('/candidates')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <Star className="me-2" /> Candidates
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="requirements" 
                onClick={() => navigate('/my-requirements')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <Briefcase className="me-2" /> My Requirements
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="support" 
                active={activeTab === 'support'} 
                onClick={() => handleTabChange('support')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <QuestionCircle className="me-2" /> Support & Help
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="settings" 
                active={activeTab === 'settings'} 
                onClick={() => handleTabChange('settings')} 
                className="d-flex align-items-center rounded-pill fs-7"
              >
                <Gear className="me-2" /> Settings
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
      
      {/* Job Requirements Form Modal */}
      <JobRequirementsForm
        show={showRequirementsForm}
        onHide={() => setShowRequirementsForm(false)}
        onSuccess={() => {
          console.log('Requirement posted successfully');
        }}
      />

      {/* Credit Request Modal */}
      <Modal show={showCreditRequestModal} onHide={() => setShowCreditRequestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">Request Additional Credits</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="fs-7 fs-md-6">
            You can request additional credits for free. Our team will review your request and approve it shortly.
          </Alert>
          
          {creditRequestError && (
            <Alert variant="danger" className="fs-7 fs-md-6">
              {creditRequestError}
            </Alert>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Phone Number *</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text className="fs-7 fs-md-6">+91</InputGroup.Text>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={creditRequest.phone}
                  onChange={handleCreditRequestChange}
                  onKeyPress={(e) => {
                    // Only allow numbers
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 10);
                    setCreditRequest(prev => ({ ...prev, phone: digitsOnly }));
                  }}
                  placeholder="10-digit number"
                  required
                  maxLength={10}
                  isInvalid={creditRequest.phone.length > 0 && creditRequest.phone.length !== 10}
                  className="fs-7 fs-md-6"
                />
              </InputGroup>
              <Form.Text className="text-muted fs-7 fs-md-6">
                Enter exactly 10 digits without +91 prefix
              </Form.Text>
              {creditRequest.phone.length > 0 && creditRequest.phone.length !== 10 && (
                <Form.Control.Feedback type="invalid" className="fs-7 fs-md-6">
                  Phone number must be exactly 10 digits
                </Form.Control.Feedback>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Credits Requested *</Form.Label>
              <Form.Select 
                name="creditsRequested" 
                value={creditRequest.creditsRequested} 
                onChange={handleCreditRequestChange}
                required
                size="sm"
                className="fs-7 fs-md-6"
              >
                <option value="10">10 Credits</option>
                <option value="25">25 Credits</option>
                <option value="50">50 Credits</option>
                <option value="100">100 Credits</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fs-7 fs-md-6">Reason for Request</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="reason"
                value={creditRequest.reason}
                onChange={handleCreditRequestChange}
                placeholder="Please describe why you need additional credits..."
                size="sm"
                className="fs-7 fs-md-6"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowCreditRequestModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleCreditRequest}
            disabled={creditRequest.phone.length !== 10}
          >
            <CreditCard className="me-1" /> Submit Request
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClientDashboard;