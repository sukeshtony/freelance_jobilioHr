import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSquare,
  FaCircle,
  FaPlay,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";

const AboutUs = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <Container>
          <div className="d-flex align-items-center">
            <img src="/logo.jpeg" alt="Logo" style={{ height: "35px", marginRight: "10px" }} />
            <span className="navbar-brand fw-bold text-primary mb-0 h1"></span>
          </div>
          <div className="ms-auto">
            <button className="btn btn-outline-primary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <header className="bg-primary text-white text-center py-6" style={{ padding: '100px 0' }}>
        <Container>
          <h1 className="display-4 fw-bold">Empowering Job Seekers</h1>
          <h2 className="h4 my-3 bg-white text-primary px-4 py-2 d-inline-block rounded">
            No placement? No problem.
          </h2>
          <p className="lead">Your career success is our mission.</p>
        </Container>
      </header>

      {/* Core Values */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold">Our Core Values</h2>
              <p className="text-muted">Driving your career forward with comprehensive support.</p>
            </Col>
          </Row>
          <Row className="g-4">
            {[
              {
                icon: <FaCircle className="fs-3 mt-3" />,
                title: "Mission",
                text: "Equal opportunities and skill support for all deserving candidates in India.",
                bg: "primary",
              },
              {
                icon: <FaSquare className="fs-3 mt-3" />,
                title: "Vision",
                text: "India's most trusted job and training platform for motivated students and freshers.",
                bg: "success",
              },
              {
                icon: <FaPlay className="fs-3 mt-3" />,
                title: "Offerings",
                text: "Resume building, internships, IT/Non-IT training, performance tracking, and EMI help.",
                bg: "warning",
              },
            ].map((item, i) => (
              <Col md={4} key={i}>
                <Card className="h-100 border-0 shadow-sm rounded-4 text-center hover-shadow">
                  <Card.Body>
                    <div
                      className={`icon-box bg-${item.bg} bg-opacity-10 text-${item.bg} rounded-circle mb-4 mx-auto`}
                      style={{ width: "70px", height: "70px" }}
                    >
                      {item.icon}
                    </div>
                    <Card.Title>{item.title}</Card.Title>
                    <Card.Text className="text-muted">{item.text}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Why Choose Us */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <h2 className="fw-bold mb-4">Why Choose Us?</h2>
              <p className="text-muted mb-4">
                We provide comprehensive support to help you land your dream job.
              </p>

              {[
                {
                  icon: <FaSquare className="fs-5 mt-1 text-primary" />,
                  title: "150+ Reputed Company Tie-ups",
                  text: "Direct access to top employers across industries.",
                },
                {
                  icon: <FaPlay className="fs-5 mt-1 text-danger" />,
                  title: "Real Job Opportunities",
                  text: "Genuine openings for qualified candidates.",
                },
                {
                  icon: <FaCircle className="fs-5 mt-1 text-success" />,
                  title: "Diverse Industries",
                  text: "Across IT, BPO, Marketing, EdTech and more.",
                },
                {
                  icon: <FaSquare className="fs-5 mt-1 text-warning" />,
                  title: "Top Placement Support",
                  text: "Dedicated partners to guide you through the process.",
                },
              ].map((feature, i) => (
                <div className="d-flex mb-3" key={i}>
                  <div className="me-3">{feature.icon}</div>
                  <div>
                    <h6 className="mb-1">{feature.title}</h6>
                    <p className="text-muted small mb-0">{feature.text}</p>
                  </div>
                </div>
              ))}
            </Col>
            <Col lg={6}>
              <div className="bg-white rounded-4 overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=60"
                  alt="Career"
                  className="img-fluid w-100"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Jobiliohr */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} className="text-center">
              <div className="bg-light p-5 rounded-4">
                <h3 className="fw-bold mb-3">Why JobilioHR?</h3>
                <p className="lead text-muted mb-3">
                  Support for IT & Non-IT, offline helpdesk, live feedback and results tracking.
                </p>
                <p className="text-muted mb-0">
                  Weekly interviews, retry post-training, direct referrals, and certificate system keep you in the hiring loop.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

     

      {/* Footer */}
{/* Footer */}
<footer className="bg-dark text-white pt-5 pb-3">
  <Container>
    <Row className="mb-4 text-center text-md-start">
      <Col md={4} className="mb-4 mb-md-0">
        <h5 className="text-uppercase mb-3">Contact</h5>
        <p className="mb-1"> +91 74994 32816</p>
        <p className="mb-1"> info@jobiliohr.com</p>
      </Col>
      <Col md={4} className="mb-4 mb-md-0">
        <h5 className="text-uppercase mb-3">Location</h5>
        <p className="mb-1"> Magarpatta City, Hadapsar, Pune, Maharashtra - 411013</p>
        <p className="mb-1"> Mon–Sat, 9am–7pm</p>
      </Col>
      <Col md={4}>
        <h5 className="text-uppercase mb-3">Follow Us</h5>
         <div className="d-flex gap-3">
  <a
    href="https://www.facebook.com/JobioHR"
    className="text-decoration-none text-white"
    aria-label="JobioHR on Facebook"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="bi bi-facebook fs-5"></i>
  </a>
  <a
    href="https://www.linkedin.com/company/jobiohr"
    className="text-decoration-none text-white"
    aria-label="JobioHR on LinkedIn"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="bi bi-linkedin fs-5"></i>
  </a>
  <a
    href="https://twitter.com/JobioHR"
    className="text-decoration-none text-white"
    aria-label="JobioHR on Twitter"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="bi bi-twitter-x fs-5"></i>
  </a>
  <a
    href="https://www.instagram.com/jobiliohr?igsh=MTYyc2k4NDkwaXhmZQ=="
    className="text-decoration-none text-white"
    aria-label="JobioHR on Instagram"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="bi bi-instagram fs-5"></i>
  </a>
</div>

      </Col>
    </Row>
    <hr className="border-top border-secondary" />
    <Col xs={12} className="text-center">
  <small>JobilioHR &copy;{new Date().getFullYear()} . All rights reserved. Powered by Rokoso Technology Service Pvt Ltd.</small>
</Col>

    
  </Container>
</footer>

    </>
  );
};

export default AboutUs;
