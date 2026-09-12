import React, { useState } from 'react';
import { Container, Row, Col, Card, Tab, Nav, Button, Offcanvas } from 'react-bootstrap';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaBars, FaTimes } from 'react-icons/fa';

const SupportHelp = () => {
  const [activeTab, setActiveTab] = useState('contact');
  const [showSidebar, setShowSidebar] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowSidebar(false); // Close sidebar on mobile after tab selection
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <Container className="my-3 my-md-5 py-3 py-md-4 px-2 px-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-5">
        <h2 className="text-center text-md-start mb-3 mb-md-0 fw-bold fs-4 fs-md-3" style={{ color: '#2c3e50' }}>Support Center</h2>
        
        {/* Mobile Sidebar Toggle */}
        <Button
          variant="outline-primary"
          size="sm"
          className="d-md-none align-self-center"
          onClick={toggleSidebar}
        >
          {showSidebar ? <FaTimes className="me-1" /> : <FaBars className="me-1" />}
          Support Options
        </Button>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
        <Row className="g-0 g-md-3">
          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <Col md={3} className="d-none d-md-block">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold fs-6">Support Options</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="contact"
                      className="rounded-0 py-3 px-4 border-bottom"
                      style={{ 
                        backgroundColor: activeTab === 'contact' ? '#f8f9fa' : 'white',
                        color: activeTab === 'contact' ? '#2c3e50' : '#6c757d'
                      }}
                    >
                      Contact Support
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold fs-6">Quick Contact</h5>
              </Card.Header>
              <Card.Body className="p-3">
                <div className="mb-3 d-flex align-items-start">
                  <FaPhone className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                  <div className="min-w-0">
                    <p className="mb-1 text-muted small fs-8">Phone</p>
                    <p className="fw-semibold fs-7 fs-md-6">+91 7499482816</p>
                  </div>
                </div>
                
                <div className="mb-3 d-flex align-items-start">
                  <FaEnvelope className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                  <div className="min-w-0">
                    <p className="mb-1 text-muted small fs-8">Email</p>
                    <p className="fw-semibold fs-7 fs-md-6">info@jobiliohr.com</p>
                  </div>
                </div>
                
                <div className="mb-3 d-flex align-items-start">
                  <FaMapMarkerAlt className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                  <div className="min-w-0">
                    <p className="mb-1 text-muted small fs-8">Location</p>
                    <p className="fw-semibold fs-7 fs-md-6">Yewlewadi, Pune</p>
                  </div>
                </div>
                
                <div className="d-flex align-items-start">
                  <FaClock className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                  <div className="min-w-0">
                    <p className="mb-1 text-muted small fs-8">Working Hours</p>
                    <p className="fw-semibold fs-7 fs-md-6">Mon–Sat, 9am–7pm</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content Area */}
          <Col xs={12} md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="contact">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-bottom">
                    <h4 className="mb-0 fw-semibold fs-5 fs-md-4">Contact Our Support Team</h4>
                  </Card.Header>
                  <Card.Body className="p-3 p-md-4">
                    <p className="mb-3 mb-md-4 fs-7 fs-md-6">Our dedicated support team is available to assist you with any questions or issues during our working hours.</p>
                    
                    <Row className="g-3 g-md-4">
                      <Col xs={12} md={6} className="mb-3 mb-md-4">
                        <div className="p-3 p-md-4 border rounded">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary bg-opacity-10 p-2 p-md-3 rounded-circle me-3 flex-shrink-0">
                              <FaPhone className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h6 className="mb-0 fw-semibold fs-6 fs-md-5">Phone Support</h6>
                            </div>
                          </div>
                          <p className="mb-2 fs-7 fs-md-6">Call us directly at:</p>
                          <h5 className="fw-bold fs-5 fs-md-4">+91 7499482816</h5>
                          <p className="text-muted small mt-2 fs-8 fs-md-7">Available Mon–Sat, 9am–7pm</p>
                        </div>
                      </Col>
                      
                      <Col xs={12} md={6} className="mb-3 mb-md-4">
                        <div className="p-3 p-md-4 border rounded">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary bg-opacity-10 p-2 p-md-3 rounded-circle me-3 flex-shrink-0">
                              <FaEnvelope className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h6 className="mb-0 fw-semibold fs-6 fs-md-5">Email Support</h6>
                            </div>
                          </div>
                          <p className="mb-2 fs-7 fs-md-6">Send us an email at:</p>
                          <h5 className="fw-bold fs-5 fs-md-4">info@jobiliohr.com</h5>
                          <p className="text-muted small mt-2 fs-8 fs-md-7">Typically respond within 24 hours</p>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="mt-3 mt-md-4">
                      <h6 className="fw-semibold mb-3 fs-6 fs-md-5">Our Location</h6>
                      <div className="d-flex align-items-start">
                        <FaMapMarkerAlt className="mt-1 me-3 text-muted flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="fw-semibold mb-1 fs-7 fs-md-6">Yewlewadi, Pune</p>
                          <p className="text-muted small fs-8 fs-md-7">Visit our office during working hours</p>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* Mobile Sidebar Offcanvas */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fs-6">Support Options</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Card className="border-0 shadow-none mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold fs-6">Support Options</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    eventKey="contact"
                    className="rounded-0 py-3 px-4 border-bottom"
                    style={{ 
                      backgroundColor: activeTab === 'contact' ? '#f8f9fa' : 'white',
                      color: activeTab === 'contact' ? '#2c3e50' : '#6c757d'
                    }}
                  >
                    Contact Support
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-none mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold fs-6">Quick Contact</h5>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="mb-3 d-flex align-items-start">
                <FaPhone className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                <div className="min-w-0">
                  <p className="mb-1 text-muted small fs-8">Phone</p>
                  <p className="fw-semibold fs-7">+91 7499482816</p>
                </div>
              </div>
              
              <div className="mb-3 d-flex align-items-start">
                <FaEnvelope className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                <div className="min-w-0">
                  <p className="mb-1 text-muted small fs-8">Email</p>
                  <p className="fw-semibold fs-7">info@jobiliohr.com</p>
                </div>
              </div>
              
              <div className="mb-3 d-flex align-items-start">
                <FaMapMarkerAlt className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                <div className="min-w-0">
                  <p className="mb-1 text-muted small fs-8">Location</p>
                  <p className="fw-semibold fs-7">Yewlewadi, Pune</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start">
                <FaClock className="mt-1 me-3 flex-shrink-0" style={{ color: '#6c757d' }} />
                <div className="min-w-0">
                  <p className="mb-1 text-muted small fs-8">Working Hours</p>
                  <p className="fw-semibold fs-7">Mon–Sat, 9am–7pm</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default SupportHelp;