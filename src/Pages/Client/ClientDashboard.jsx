import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Badge, 
  Navbar, 
  Nav, 
  Button,
  Card,
  ListGroup,
  Alert,
  Collapse
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaBell, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaUserTie, 
  FaFileAlt, 
  FaCog, 
  FaSignOutAlt, 
  FaChevronDown, 
  FaChevronRight,
  FaSearch,
  FaBriefcase,
  FaClipboardList,
  FaUserFriends,
  FaQuestionCircle,
  FaCreditCard,
  FaUserEdit
} from 'react-icons/fa';
import JobRequirementsForm from './JobRequirementsForm';
import API from '../../api';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const [showRequirementsForm, setShowRequirementsForm] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
      dashboard: true, // Dashboard open by default
      jobManagement: false,
      candidateManagement: false,
      account: false
    });

    useEffect(() => {
      fetchUnreadCount();
      
      const handleScroll = () => {
        const isScrolled = window.scrollY > 10;
        setScrolled(isScrolled);
      };

      window.addEventListener('scroll', handleScroll);
      
      // Force show notification for testing after 2 seconds
      setTimeout(() => {
        console.log('Forcing notification for testing...');
        setUnreadCount(2);
        setShowNotification(true);
      }, 2000);

      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchUnreadCount = async () => {
      try {
        console.log('Fetching unread count...');
        console.log('User token:', localStorage.getItem('token'));
        
        const response = await API.get('/api/requirements/sent-candidates-count');
        console.log('Unread count response:', response.data);
        
        if (response.data && typeof response.data.unreadCount === 'number') {
          setUnreadCount(response.data.unreadCount);
          if (response.data.unreadCount > 0) {
            console.log('Setting notification to true');
            setShowNotification(true);
          }
        } else {
          console.log('Invalid response format:', response.data);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
        console.error('Error details:', err.response?.data);
        // Set a default value for testing
        setUnreadCount(0);
      }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    // Close sidebar when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-nav-toggle')) {
          setSidebarOpen(false);
        }
      };

      if (sidebarOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        // Prevent body scroll on mobile when sidebar is open
        document.body.style.overflow = 'hidden';
      } else {
        // Restore body scroll when sidebar is closed
        document.body.style.overflow = 'auto';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'auto';
      };
    }, [sidebarOpen]);

    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };
    
  // Feature Card Component
  const FeatureCard = ({ icon, title, description }) => (
    <Card className="h-100 border-0 shadow-sm hover-shadow transition-all feature-card-responsive">
      <Card.Body className="p-3 p-md-4">
        <div className="icon-circle-enhanced bg-primary text-white mb-3 mb-md-4">
          {icon}
        </div>
        <h3 className="h5 h4-md mb-2 mb-md-3 feature-card-title">{title}</h3>
        <p className="mb-0 text-muted feature-card-text">{description}</p>
      </Card.Body>
    </Card>
  );

  // Sidebar Navigation Item Component
  const SidebarItem = ({ icon, title, onClick, isActive = false, hasDropdown = false, isExpanded = false, children, badge = null }) => (
    <div className="sidebar-item">
      <button
        className={`sidebar-link w-100 d-flex align-items-center justify-content-between p-3 ${isActive ? 'active' : ''}`}
        onClick={onClick}
      >
        <div className="d-flex align-items-center gap-3">
          {icon}
          <span className="sidebar-text">{title}</span>
          {badge && <span className="sidebar-badge">{badge}</span>}
        </div>
        {hasDropdown && (
          <span className="sidebar-chevron">
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        )}
      </button>
      {hasDropdown && (
        <Collapse in={isExpanded}>
          <div className="sidebar-dropdown">
            {children}
          </div>
        </Collapse>
      )}
    </div>
  );

  // Sidebar Link Item Component
  const SidebarLinkItem = ({ icon, title, onClick, isActive = false, badge = null }) => (
    <button
      className={`sidebar-link-item w-100 d-flex align-items-center justify-content-between p-3 ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="d-flex align-items-center gap-3">
        {icon}
        <span className="sidebar-text">{title}</span>
        {badge && <span className="sidebar-badge">{badge}</span>}
      </div>
    </button>
  );

  return (
    <div className="recruiter-portal-enhanced">
      {/* Enhanced Responsive Navbar */}
      <Navbar 
        expand="lg" 
        className={`shadow-sm bg-white transition-all ${scrolled ? 'navbar-scrolled' : ''}`}
        style={{
          transition: 'all 0.3s ease',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
      >
        <Container fluid className="px-3 px-md-4">
          <Navbar.Brand href="#" className="d-flex align-items-center">
            <img 
              src="/logo.jpeg" 
              alt="JobilioHR Logo" 
              className="img-fluid me-2 me-md-3" 
              style={{ 
                height: scrolled ? '35px' : '40px',
                transition: 'height 0.3s ease'
              }} 
            />
            <span className="fw-bold text-primary d-none d-md-block">Client Portal</span>
          </Navbar.Brand>
          
          {/* Mobile Sidebar Toggle */}
          <button 
            className="mobile-nav-toggle d-lg-none touch-target" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list"></i>
          </button>
          
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end d-none d-lg-flex">
            <Nav className="gap-2">
              <Button 
                variant="outline-primary" 
                className="rounded-pill px-3 px-md-4 btn-responsive"
                onClick={() => navigate('/my-requirements')}
              >
                My Requirements
              </Button>
              <Button 
                variant="outline-success" 
                className="rounded-pill px-3 px-md-4 btn-responsive"
                onClick={() => navigate('/sent-candidates')}
              >
                Sent Candidates
              </Button>
              <Button 
                variant="outline-info" 
                className="rounded-pill px-3 px-md-4 btn-responsive"
                onClick={() => navigate('/request-credits')}
              >
                Credit Request
              </Button>
              <Button 
                variant="outline-warning" 
                className="rounded-pill px-3 px-md-4 btn-responsive"
                onClick={() => navigate('/update-profile')}
              >
                Update Profile
              </Button>
              <Button 
                variant="outline-dark" 
                className="rounded-pill px-3 px-md-4 btn-responsive"
                onClick={() => navigate('/naukri-client-portal')}
              >
                Back to Portal
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Professional Responsive Sidebar */}
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
          <div className="sidebar-header">
            <div className="d-flex align-items-center mb-4">
              <img 
                src="/logo.jpeg" 
                alt="JobilioHR Logo" 
                style={{ height: '40px', objectFit: 'contain' }} 
                className="responsive-img me-2"
              />
              <span className="fw-bold text-primary">Client Portal</span>
            </div>
            <button 
              className="btn-close d-lg-none touch-target" 
              onClick={closeSidebar}
              aria-label="Close sidebar"
            ></button>
          </div>
          
          <nav className="sidebar-nav">
            {/* Dashboard Section - Open by default */}
            <SidebarItem
              icon={<FaHome />}
              title="Dashboard"
              onClick={() => toggleSection('dashboard')}
              hasDropdown={true}
              isExpanded={expandedSections.dashboard}
              isActive={true}
            >
              <div className="sidebar-dropdown-items">
                <button 
                  className="sidebar-dropdown-item active"
                  onClick={() => {
                    navigate('/dashboard');
                    closeSidebar();
                  }}
                >
                  <FaHome className="me-2" />
                  Dashboard
                </button>
              </div>
            </SidebarItem>

            {/* Job Management Section */}
            <SidebarItem
              icon={<FaBriefcase />}
              title="Job Management"
              onClick={() => toggleSection('jobManagement')}
              hasDropdown={true}
              isExpanded={expandedSections.jobManagement}
            >
              <div className="sidebar-dropdown-items">
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/post-job');
                    closeSidebar();
                  }}
                >
                  <FaFileAlt className="me-2" />
                  Post a Job
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/manage-jobs');
                    closeSidebar();
                  }}
                >
                  <FaCog className="me-2" />
                  Manage Jobs
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/responses');
                    closeSidebar();
                  }}
                >
                  <FaClipboardList className="me-2" />
                  Responses
                </button>
              </div>
            </SidebarItem>

            {/* Candidate Management Section */}
            <SidebarItem
              icon={<FaUsers />}
              title="Candidate Management"
              onClick={() => toggleSection('candidateManagement')}
              hasDropdown={true}
              isExpanded={expandedSections.candidateManagement}
            >
              <div className="sidebar-dropdown-items">
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/search-resumes');
                    closeSidebar();
                  }}
                >
                  <FaSearch className="me-2" />
                  Search Resumes
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/candidates');
                    closeSidebar();
                  }}
                >
                  <FaUserFriends className="me-2" />
                  Candidates
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/my-requirements');
                    closeSidebar();
                  }}
                >
                  <FaFileAlt className="me-2" />
                  My Requirements
                </button>
              </div>
            </SidebarItem>

            {/* Account & Support Section */}
            <SidebarItem
              icon={<FaUserTie />}
              title="Account & Support"
              onClick={() => toggleSection('account')}
              hasDropdown={true}
              isExpanded={expandedSections.account}
            >
              <div className="sidebar-dropdown-items">
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/request-credits');
                    closeSidebar();
                  }}
                >
                  <FaCreditCard className="me-2" />
                  Request Credits
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/update-profile');
                    closeSidebar();
                  }}
                >
                  <FaUserEdit className="me-2" />
                  Update Profile
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/support-help');
                    closeSidebar();
                  }}
                >
                  <FaQuestionCircle className="me-2" />
                  Support & Help
                </button>
                <button 
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    navigate('/settings');
                    closeSidebar();
                  }}
                >
                  <FaCog className="me-2" />
                  Settings
                </button>
              </div>
            </SidebarItem>

            {/* Logout Section */}
            <div className="sidebar-section mt-4">
              <SidebarLinkItem
                icon={<FaSignOutAlt />}
                title="Logout"
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/client/login');
                  closeSidebar();
                }}
                isActive={false}
              />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {/* Enhanced Responsive Notification */}
          {(showNotification && unreadCount > 0) && (
            <Container className="py-3 notification-container">
              <Alert 
                variant="info" 
                className="border-0 shadow-sm notification-alert"
                onClose={() => setShowNotification(false)}
                dismissible
              >
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                  <div className="d-flex align-items-center">
                    <FaBell className="me-3 text-info notification-icon" size={20} />
                    <div className="flex-grow-1">
                      <strong className="notification-title">New Candidates Available!</strong>
                      <br />
                      <span className="text-muted notification-text">
                        Admin has sent {unreadCount} matching candidate(s) for your requirements.
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    onClick={() => navigate('/sent-candidates')}
                    className="ms-md-3 notification-btn"
                  >
                    <FaUsers className="me-1" />
                    View Candidates
                  </Button>
                </div>
              </Alert>
            </Container>
          )}

          {/* Enhanced Responsive Dashboard Content */}
          <Container className="py-4 py-md-5">
            <Row className="g-4">
              {/* Welcome Section */}
              <Col xs={12}>
                <div className="text-center text-md-start mb-4 mb-md-5">
                  <h1 className="display-4 fw-bold mb-3 dashboard-title">
                    Welcome to Your <span className="text-primary">Client Dashboard</span>
                  </h1>
                  <p className="lead text-muted dashboard-subtitle">
                    Manage your job requirements, view candidates, and track your hiring progress.
                  </p>
                </div>
              </Col>

              {/* Quick Actions */}
              <Col xs={12} md={6} lg={4}>
                <FeatureCard
                  icon={<FaUsers size={24} />}
                  title="Post New Job"
                  description="Create and publish new job requirements to attract top talent."
                />
              </Col>
              <Col xs={12} md={6} lg={4}>
                <FeatureCard
                  icon={<FaBell size={24} />}
                  title="View Responses"
                  description="Check candidate responses and manage applications efficiently."
                />
              </Col>
              <Col xs={12} md={6} lg={4}>
                <FeatureCard
                  icon={<FaUsers size={24} />}
                  title="Manage Jobs"
                  description="Update, pause, or close existing job postings as needed."
                />
              </Col>

              {/* Dashboard Stats */}
              <Col xs={12}>
                <Row className="g-4 mt-4">
                  <Col xs={12} sm={6} md={3}>
                    <Card className="text-center border-0 shadow-sm stats-card">
                      <Card.Body className="p-3 p-md-4">
                        <div className="stats-icon mb-3">
                          <FaUsers size={32} className="text-primary" />
                        </div>
                        <h3 className="h4 mb-2 stats-number">0</h3>
                        <p className="text-muted mb-0 stats-label">Active Jobs</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
                    <Card className="text-center border-0 shadow-sm stats-card">
                      <Card.Body className="p-3 p-md-4">
                        <div className="stats-icon mb-3">
                          <FaBell size={32} className="text-success" />
                        </div>
                        <h3 className="h4 mb-2 stats-number">{unreadCount}</h3>
                        <p className="text-muted mb-0 stats-label">New Candidates</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
                    <Card className="text-center border-0 shadow-sm stats-card">
                      <Card.Body className="p-3 p-md-4">
                        <div className="stats-icon mb-3">
                          <FaUsers size={32} className="text-warning" />
                        </div>
                        <h3 className="h4 mb-2 stats-number">0</h3>
                        <p className="text-muted mb-0 stats-label">Total Responses</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
                    <Card className="text-center border-0 shadow-sm stats-card">
                      <Card.Body className="p-3 p-md-4">
                        <div className="stats-icon mb-3">
                          <FaUsers size={32} className="text-info" />
                        </div>
                        <h3 className="h4 mb-2 stats-number">0</h3>
                        <p className="text-muted mb-0 stats-label">Hired Candidates</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>

              {/* Recent Activity */}
              <Col xs={12} lg={8}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="mb-0 fw-bold">Recent Activity</h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      <ListGroup.Item className="d-flex justify-content-between align-items-center p-3 p-md-4">
                        <div>
                          <h6 className="mb-1">New job posted</h6>
                          <small className="text-muted">Software Developer position</small>
                        </div>
                        <Badge bg="success" className="rounded-pill">New</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center p-3 p-md-4">
                        <div>
                          <h6 className="mb-1">Candidate response</h6>
                          <small className="text-muted">John Doe applied for Frontend Developer</small>
                        </div>
                        <Badge bg="info" className="rounded-pill">1 hour ago</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center p-3 p-md-4">
                        <div>
                          <h6 className="mb-1">Interview scheduled</h6>
                          <small className="text-muted">Sarah Wilson - UI/UX Designer</small>
                        </div>
                        <Badge bg="warning" className="rounded-pill">Tomorrow</Badge>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>

              {/* Quick Links */}
              <Col xs={12} lg={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0">
                    <h5 className="mb-0 fw-bold">Quick Links</h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      <ListGroup.Item action className="p-3 p-md-4" onClick={() => navigate('/post-job')}>
                        <div className="d-flex align-items-center">
                          <FaUsers className="me-3 text-primary" />
                          <span>Post New Job</span>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item action className="p-3 p-md-4" onClick={() => navigate('/manage-jobs')}>
                        <div className="d-flex align-items-center">
                          <FaUsers className="me-3 text-success" />
                          <span>Manage Jobs</span>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item action className="p-3 p-md-4" onClick={() => navigate('/sent-candidates')}>
                        <div className="d-flex align-items-center">
                          <FaBell className="me-3 text-warning" />
                          <span>View Candidates</span>
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item action className="p-3 p-md-4" onClick={() => navigate('/request-credits')}>
                        <div className="d-flex align-items-center">
                          <FaUsers className="me-3 text-info" />
                          <span>Request Credits</span>
                        </div>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </main>
      </div>

      {/* Enhanced Responsive Requirements Form Modal */}
      <JobRequirementsForm 
        show={showRequirementsForm} 
        onHide={() => setShowRequirementsForm(false)} 
      />

      {/* Enhanced Responsive CSS */}
      <style>{`
        /* Enhanced Responsive Styles */
        .recruiter-portal-enhanced {
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .navbar-scrolled {
          background-color: rgba(255, 255, 255, 0.98) !important;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1) !important;
        }

        /* Mobile Nav Toggle Button */
        .mobile-nav-toggle {
          display: block;
          border: none;
          background: none;
          font-size: 1.5rem;
          padding: 0.5rem;
          color: #6c757d;
          cursor: pointer;
          transition: color 0.2s ease;
          min-height: 44px;
          min-width: 44px;
        }

        .mobile-nav-toggle:hover {
          color: #0066ff;
        }

        @media (min-width: 992px) {
          .mobile-nav-toggle {
            display: none;
          }
        }

        /* Dashboard Layout */
        .dashboard-layout {
          display: flex;
          min-height: calc(100vh - 70px);
          margin-top: 70px;
          position: relative;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e9ecef;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          z-index: 999;
          overflow-y: auto;
          position: sticky;
          top: 70px;
          left: 0;
          height: calc(100vh - 70px);
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }

        .sidebar-nav {
          padding: 1rem 0;
        }

        .sidebar-item {
          margin-bottom: 0.5rem;
        }

        .sidebar-link {
          background: none;
          border: none;
          text-align: left;
          color: #495057;
          font-weight: 500;
          transition: all 0.2s ease;
          border-radius: 0;
          border-left: 3px solid transparent;
        }

        .sidebar-link:hover {
          background-color: #f8f9fa;
          color: #0066ff;
          border-left-color: #0066ff;
        }

        .sidebar-link.active {
          background-color: #e3f2fd;
          color: #0066ff;
          border-left-color: #0066ff;
        }

        .sidebar-text {
          font-size: 0.95rem;
        }

        .sidebar-chevron {
          color: #6c757d;
          font-size: 0.8rem;
          transition: transform 0.2s ease;
        }

        .sidebar-badge {
          background-color: #dc3545;
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 10px;
          margin-left: auto;
        }

        .sidebar-dropdown {
          background-color: #f8f9fa;
          border-left: 3px solid #e9ecef;
          margin-left: 1rem;
        }

        .sidebar-dropdown-items {
          padding: 0.5rem 0;
        }

        .sidebar-dropdown-item {
          background: none;
          border: none;
          text-align: left;
          color: #6c757d;
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
          width: 100%;
          transition: all 0.2s ease;
          border-radius: 0;
        }

        .sidebar-dropdown-item:hover {
          background-color: #e9ecef;
          color: #495057;
        }

        .sidebar-dropdown-item.active {
          background-color: #e3f2fd;
          color: #0066ff;
        }

        .sidebar-dropdown-item.text-danger:hover {
          background-color: #f8d7da;
          color: #721c24;
        }

        /* Sidebar Link Items */
        .sidebar-link-item {
          background: none;
          border: none;
          text-align: left;
          color: #495057;
          font-weight: 500;
          transition: all 0.2s ease;
          border-radius: 0;
          border-left: 3px solid transparent;
        }

        .sidebar-link-item:hover {
          background-color: #f8f9fa;
          color: #0066ff;
          border-left-color: #0066ff;
        }

        .sidebar-link-item.active {
          background-color: #e3f2fd;
          color: #0066ff;
          border-left-color: #0066ff;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          background-color: #f8f9fa;
          transition: margin-left 0.3s ease;
          overflow-y: auto;
          height: calc(100vh - 70px);
        }

        /* Mobile Responsiveness */
        @media (max-width: 991.98px) {
          .sidebar {
            position: fixed;
            top: 70px;
            left: -100%;
            height: calc(100vh - 70px);
            z-index: 999;
            width: 280px;
            transition: left 0.3s ease;
            box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
          }

          .sidebar.active {
            left: 0;
          }

          .main-content {
            margin-left: 0;
            width: 100%;
          }

          .main-content.sidebar-open {
            margin-left: 0;
          }

          /* Mobile overlay background */
          .sidebar.active::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
          }

          /* Ensure sidebar is above overlay */
          .sidebar.active {
            z-index: 1000;
          }
        }

        @media (min-width: 992px) {
          .sidebar {
            position: fixed;
            top: 70px;
            left: 0;
          }

          .main-content {
            margin-left: 280px;
          }
        }

        .feature-card-responsive {
          transition: all 0.3s ease;
        }

        .feature-card-responsive:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .feature-card-title {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .feature-card-text {
          font-size: 0.9rem;
          line-height: 1.5;
        }

        @media (min-width: 768px) {
          .feature-card-title {
            font-size: 1.25rem;
          }
          
          .feature-card-text {
            font-size: 1rem;
          }
        }

        .stats-card {
          transition: all 0.3s ease;
        }

        .stats-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12) !important;
        }

        .stats-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 123, 255, 0.1);
          border-radius: 50%;
          margin: 0 auto;
        }

        .stats-number {
          color: #495057;
          font-weight: 700;
        }

        .stats-label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .notification-container {
          max-width: 100%;
        }

        .notification-alert {
          border-radius: 12px;
        }

        .notification-icon {
          flex-shrink: 0;
        }

        .notification-title {
          font-size: 1rem;
          font-weight: 600;
        }

        .notification-text {
          font-size: 0.9rem;
        }

        .notification-btn {
          white-space: nowrap;
          min-width: 140px;
        }

        .dashboard-title {
          font-size: 2rem;
          line-height: 1.2;
        }

        .dashboard-subtitle {
          font-size: 1.1rem;
        }

        @media (min-width: 768px) {
          .dashboard-title {
            font-size: 2.5rem;
          }
          
          .dashboard-subtitle {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 767.98px) {
          .dashboard-title {
            font-size: 1.75rem;
          }
          
          .dashboard-subtitle {
            font-size: 1rem;
          }
          
          .stats-card {
            margin-bottom: 1rem;
          }
          
          .notification-container {
            padding: 0 1rem;
          }
        }

        /* Enhanced Touch Targets */
        @media (hover: none) and (pointer: coarse) {
          .btn {
            min-height: 48px;
            min-width: 48px;
          }
          
          .ListGroup.Item {
            min-height: 48px;
          }
          
          .sidebar-link,
          .sidebar-dropdown-item,
          .sidebar-link-item {
            min-height: 48px;
          }

          /* Mobile sidebar touch improvements */
          .sidebar {
            -webkit-overflow-scrolling: touch;
          }

          .sidebar-dropdown-item {
            padding: 0.75rem 1rem;
          }
        }

        /* Enhanced Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .feature-card-responsive:hover,
          .stats-card:hover {
            transform: none;
          }
        }

        /* Enhanced Print Styles */
        @media print {
          .sidebar {
            display: none !important;
          }
          
          .notification-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientDashboard;