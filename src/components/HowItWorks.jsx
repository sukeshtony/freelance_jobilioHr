import React from 'react';
import { FaUserTie, FaBuilding, FaRocket, FaGraduationCap, FaChartLine, FaCertificate, FaSearch, FaFileAlt, FaClipboardCheck } from 'react-icons/fa';
import { MdOutlineWorkOutline, MdOutlineVerifiedUser, MdOutlineFeaturedPlayList } from 'react-icons/md';
import { RiFeedbackLine, RiCustomerService2Line } from 'react-icons/ri';
import { BiMoney, BiSupport } from 'react-icons/bi';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import { BsTelephoneOutbound } from 'react-icons/bs';
import { Link, useNavigate } from 'react-router-dom';

const HowItWorks = () => {
  const navigate = useNavigate();
  return (
    <div className="how-it-works">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg shadow-sm">
        <div className="container">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
          <nav className="navbar px-4">
            <div className="ms-auto">
              <button className="btn btn-outline-dark" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </nav>
        </div>
      </nav>

      {/* Rest of your component remains the same, just changing the BiAssessment icon to FaClipboardCheck */}


      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            <span className="gradient-text">Your Career</span> 
            <span className="highlight">Accelerator</span>
          </h1>
          <p className="subtitle">A revolutionary approach to connecting talent with opportunity</p>
          <div className="hero-buttons">
            <button className="primary-btn pulse"><Link className="dropdown-item rounded-3" to="/candidate/register">For Candidates</Link></button>
            <button className="primary-btn pulse"><Link className="dropdown-item rounded-3" to="/client/register">For Employers</Link></button>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="floating-elements">
            <div className="circle-element blue"></div>
            <div className="circle-element purple"></div>
            <div className="square-element"></div>
          </div>
        </div>
      </section>

      {/* For Companies */}
      <section className="section companies-section">
        <div className="section-header">
          <FaBuilding className="section-icon" />
          <h2>For <span className="highlight">Companies</span></h2>
         
          <p>First Sign Up add your company Deatail then find the perfect candidates faster than ever with our comprehensive hiring solutions</p>
        </div>

        <div className="flowing-cards">
          <div className="flow-card">
            <div className="card-icon">
              <MdOutlineWorkOutline />
            </div>
            <h3>Post Jobs Instantly</h3>
            <p>Create detailed job listings that attract top talent with our intelligent templates</p>
            <div className="card-decoration"></div>
          </div>

          <div className="flow-card highlighted">
            <div className="card-icon">
              <FaSearch />
            </div>
            <h3>Smart Candidate Matching</h3>
            <p>Our AI analyzes thousands of profiles to surface the best matches for your roles</p>
            <div className="card-decoration"></div>
          </div>

          <div className="flow-card">
            <div className="card-icon">
              <MdOutlineVerifiedUser />
            </div>
            <h3>Verified Talent Pool</h3>
            <p>All candidates are pre-verified through our rigorous screening process</p>
            <div className="card-decoration"></div>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <FaSearch />
            </div>
            <h4>Access Passive Candidates</h4>
            <p>Discover professionals who haven't applied but match your requirements through our premium search</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">
              <MdOutlineFeaturedPlayList />
            </div>
            <h4>Comprehensive Dashboard</h4>
            <p>Manage all your hiring activities in one place - posted jobs, active positions, hired candidates, and applicants</p>
          </div>
          
        
          
          <div className="feature-item">
            <div className="feature-icon">
              <HiOutlineEmojiHappy />
            </div>
            <h4>Help And Support</h4>
            <p>Help and Support system to Contact our team</p>
          </div>
        </div>
      </section>

      {/* For Candidates */}
      <section className="section candidates-section">
        <div className="section-header">
          <FaUserTie className="section-icon" />
          <h2>For <span className="highlight">Professionals</span></h2>
          <p>Take control of your career trajectory with our end-to-end support </p>
        </div>

        <div className="benefits-container">
          <div className="benefit-card">
            <div className="benefit-icon">
              <FaFileAlt />
            </div>
            <h3>Free Resume Building</h3>
            <p>Professional resume crafted by our experts to highlight your strengths</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <MdOutlineWorkOutline />
            </div>
            <h3>Skill Assessment</h3>
            <p>Comprehensive evaluation of your abilities with detailed reports</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <RiFeedbackLine />
            </div>
            <h3>1-on-1 Interview Prep</h3>
            <p>Personalized mock interview sessions with industry experts</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <RiFeedbackLine />
            </div>
            <h3>Detailed Feedback</h3>
            <p>Constructive feedback to improve your interview performance</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <FaGraduationCap />
            </div>
            <h3>Affordable Courses</h3>
            <p>Job-focused training programs to enhance your skills</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <BsTelephoneOutbound />
            </div>
            <h3>Interview Calls</h3>
            <p>Direct interviews with top employers in your field</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <BiSupport />
            </div>
            <h3>Ongoing Support</h3>
            <p>Career guidance even after you get placed</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              
      
          <FaClipboardCheck />
            </div>
            <h3>No Cost EMI</h3>
            <p>Flexible payment options for our premium services</p>
          </div>
        </div>
      </section>

      {/* Paid Courses Section */}
      <section className="section courses-section">
        <div className="section-header">
          <FaGraduationCap className="section-icon" />
          <h2>Boost Your Career With <span className="highlight">Paid Courses</span></h2>
          <p>Invest in your future with our industry-recognized certification programs</p>
        </div>

        <div className="course-bubbles">
          <div className="course-bubble">
            <div className="bubble-icon">
              <FaCertificate />
            </div>
            <h3>Certification Programs</h3>
            <p>Earn credentials that make you stand out to employers</p>
          </div>

          <div className="course-bubble primary">
            <div className="bubble-icon">
              <FaChartLine />
            </div>
            <h3>Skill Development</h3>
            <p>Master in-demand skills with expert-led courses</p>
          </div>

          <div className="course-bubble">
            <div className="bubble-icon">
              <MdOutlineFeaturedPlayList />
            </div>
            <h3>Career Specializations</h3>
            <p>Deep dive into specific career paths and industries</p>
          </div>
        </div>

        <div className="course-highlight">
          <div className="highlight-content">
            <FaRocket className="highlight-icon" />
            <h3>Ready to accelerate your career?</h3>
            <p>Our premium courses have helped thousands of professionals land their dream jobs</p>
          </div>
          <div className="highlight-decoration"></div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Start Your Journey Today</h2>
        <p>Whether you're hiring or looking for your next opportunity, we've got you covered</p>
        <p>Start Your Jounrney with Us</p>
      </section>
      <footer className="bg-white text-black pt-5 pb-4 border-top">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3">
                  <img src="/logo.jpeg" alt="JobilioHR Logo" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                <span className="fs-5 fw-bold"></span>
              </div>
            <div className="mb-4">
                <p className="mb-1 d-flex align-items-center">
                  <i className="bi bi-geo-alt me-2"></i> Yewlewadi, Pune
                </p>
                <p className="mb-0 d-flex align-items-center">
                  <i className="bi bi-clock me-2"></i> Mon–Sat, 9am–7pm
                </p>
              </div>
             
             
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link
                    to="/about"
                    className="text-dark text-decoration-none opacity-75 hover-opacity-100"
                  >
                    About us
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/contact"
                    className="text-dark text-decoration-none opacity-75 hover-opacity-100"
                  >
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3">Legal</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/privacy" className="text-dark text-decoration-none opacity-75 hover-opacity-100">
                    Privacy policy
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/terms" className="text-dark text-decoration-none opacity-75 hover-opacity-100">
                    Terms & conditions
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3">Connect With Us</h6>
              <ul className="list-unstyled">
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-envelope me-2"></i>
                  info@jobiliohr.com
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-telephone me-2"></i>
                  +91 7499482816
                </li>
                
              </ul>
            </div>
            <div className="col-lg-3 col-md-4">
              <h6 className="fw-bold mb-3">Follow Us</h6>
              <div className="d-flex gap-3">
                <a
                  href="https://www.facebook.com/JobioHR"
                  className="text-decoration-none text-dark"
                  aria-label="JobioHR on Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a
                  href="https://www.linkedin.com/company/jobiohr"
                  className="text-decoration-none text-dark"
                  aria-label="JobioHR on LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-linkedin fs-5"></i>
                </a>
                <a
                  href="https://twitter.com/JobioHR"
                  className="text-decoration-none text-dark"
                  aria-label="JobioHR on Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter-x fs-5"></i>
                </a>
                <a
                  href="https://www.instagram.com/jobiohr"
                  className="text-decoration-none text-dark"
                  aria-label="JobioHR on Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-instagram fs-5"></i>
                </a>
              </div>
            </div>
          </div>
          <hr className="my-4" />
          <div className="text-center text-secondary">
            <p className="mb-0">Jobiliohr © {new Date().getFullYear()}.All rights reserved.</p>
            
          </div>
        </div>
      </footer>
      

      <style jsx>{`
        .how-it-works {
          font-family: 'Inter', sans-serif;
          color: #333;
          overflow-x: hidden;
        }
        
        /* Navbar Styles */
        .navbar {
          background-color: white;
          padding: 15px 0;
        }
        
        .navbar img {
          height: 35px;
          margin-right: 10px;
        }
        
        /* Hero Section */
        .hero {
          display: flex;
          align-items: center;
          padding: 80px 5%;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          position: relative;
        }
        
        .hero-content {
          flex: 1;
          max-width: 600px;
        }
        
        .hero h1 {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 20px;
        }
        
        .gradient-text {
          background: linear-gradient(90deg, #3f51b5, #e91e63);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .highlight {
          color: #3f51b5;
          font-weight: 700;
        }
        
        .subtitle {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 30px;
        }
        
        .hero-buttons {
          display: flex;
          gap: 15px;
        }
        
        button {
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .primary-btn {
          background: #3f51b5;
          color: white;
          border: none;
        }
        
        .primary-btn:hover {
          background: #303f9f;
          transform: translateY(-2px);
        }
        
        .outline-btn {
          background: transparent;
          border: 2px solid #3f51b5;
          color: #3f51b5;
        }
        
        .outline-btn:hover {
          background: rgba(63, 81, 181, 0.1);
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(63, 81, 181, 0); }
          100% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0); }
        }
        
        .hero-illustration {
          flex: 1;
          position: relative;
          height: 400px;
        }
        
        .floating-elements {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .circle-element {
          position: absolute;
          border-radius: 50%;
          opacity: 0.8;
        }
        
        .circle-element.blue {
          width: 200px;
          height: 200px;
          background: rgba(63, 81, 181, 0.1);
          top: 50px;
          right: 50px;
          animation: float 6s ease-in-out infinite;
        }
        
        .circle-element.purple {
          width: 150px;
          height: 150px;
          background: rgba(156, 39, 176, 0.1);
          bottom: 30px;
          right: 150px;
          animation: float 8s ease-in-out infinite reverse;
        }
        
        .square-element {
          position: absolute;
          width: 100px;
          height: 100px;
          background: rgba(233, 30, 99, 0.1);
          top: 150px;
          right: 200px;
          transform: rotate(45deg);
          animation: float 7s ease-in-out infinite 1s;
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        /* Sections */
        .section {
          padding: 80px 5%;
          position: relative;
        }
        
        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 60px;
        }
        
        .section-icon {
          font-size: 2.5rem;
          color: #3f51b5;
          margin-bottom: 20px;
        }
        
        .section h2 {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }
        
        .section p {
          font-size: 1.1rem;
          color: black
          ;
        }
        
        /* Companies Section */
        .companies-section {
          background: white;
        }
        
        .flowing-cards {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
          margin-bottom: 50px;
        }
        
        .flow-card {
          background: white;
          border-radius: 20px;
          padding: 40px 30px;
          width: 280px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .flow-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.1);
        }
        
       
        .card-icon {
          font-size: 2rem;
          color: #3f51b5;
          margin-bottom: 20px;
        }
        
        .flow-card h3 {
          font-size: 1.3rem;
          margin-bottom: 15px;
        }
        
        .flow-card p {
          font-size: 1rem;
          color: #666;
        }
        
        .card-decoration {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(63, 81, 181, 0.05);
          top: -30px;
          right: -30px;
          z-index: -1;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .feature-item {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 30px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .feature-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .feature-icon {
          font-size: 2rem;
          color: #3f51b5;
          margin-bottom: 20px;
        }
        
        .feature-item h4 {
          font-size: 1.2rem;
          margin-bottom: 15px;
          color: #3f51b5;
        }
        
        .feature-item p {
          font-size: 0.95rem;
          color: #666;
        }
        
        /* Candidates Section */
        .candidates-section {
          background: #f8f9fa;
        }
        
        .benefits-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .benefit-card {
          background: white;
          border-radius: 15px;
          padding: 30px;
          text-align: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        
        .benefit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .benefit-icon {
          font-size: 2rem;
          color: #3f51b5;
          margin-bottom: 20px;
        }
        
        .benefit-card h3 {
          font-size: 1.2rem;
          margin-bottom: 15px;
          color: #3f51b5;
        }
        
        .benefit-card p {
          font-size: 0.95rem;
          color: #666;
        }
        
        /* Courses Section */
        .courses-section {
          background: white;
        }
        
        .course-bubbles {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
          margin-bottom: 60px;
        }
        
        .course-bubble {
          background: #f8f9fa;
          border-radius: 50%;
          width: 220px;
          height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          transition: all 0.3s ease;
        }
        
        .course-bubble:hover {
          transform: scale(1.05);
        }
        
        .course-bubble.primary {
          background: #3f51b5;
          color: white;
        }
        
        .course-bubble.primary .bubble-icon {
          color: white;
        }
        
        .course-bubble.primary p {
          color: rgba(255,255,255,0.8);
        }
        
        .bubble-icon {
          font-size: 2rem;
          color: #3f51b5;
          margin-bottom: 15px;
        }
        
        .course-bubble h3 {
          font-size: 1.1rem;
          margin-bottom: 10px;
        }
        
        .course-bubble p {
          font-size: 0.9rem;
          color: #666;
        }
        
        .course-highlight {
          background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%);
          color: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .highlight-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }
        
        .highlight-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          color: rgba(255,255,255,0.2);
        }
        
        .highlight-content h3 {
          font-size: 1.8rem;
          margin-bottom: 15px;
        }
        
        .highlight-decoration {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          top: -100px;
          right: -100px;
        }
        
        /* Final CTA */
        .final-cta {
          background: #f3f4f5ff;
          padding: 80px 5%;
          text-align: center;
        }
        
        .final-cta h2 {
          font-size: 2.5rem;
          margin-bottom: 20px;
        }
        
        .final-cta p {
          font-size: 1.2rem;
          color: #666;
          max-width: 600px;
          margin: 0 auto 30px;
        }
        
        .large {
          padding: 15px 30px;
          font-size: 1.1rem;
        }
        
        /* Enhanced Mobile Responsive Styles */
        @media (max-width: 768px) {
          .hero {
            flex-direction: column;
            text-align: center;
            padding: 40px 20px;
          }
          
          .hero h1 {
            font-size: 2.5rem;
            line-height: 1.1;
          }
          
          .subtitle {
            font-size: 1rem;
            margin-bottom: 20px;
          }
          
          .hero-buttons {
            justify-content: center;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }
          
          .hero-buttons button {
            width: 100%;
            padding: 15px 20px;
            font-size: 1rem;
          }
          
          .hero-illustration {
            margin-top: 30px;
            height: 250px;
          }
          
          .section {
            padding: 40px 20px;
          }
          
          .section h2 {
            font-size: 2rem;
          }
          
          .section p {
            font-size: 1rem;
          }
          
          .flowing-cards {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          
          .flow-card {
            width: 100%;
            max-width: 350px;
            padding: 30px 20px;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .feature-item {
            padding: 25px 20px;
          }
          
          .benefits-container {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .benefit-card {
            padding: 25px 20px;
          }
          
          .course-bubbles {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          
          .course-bubble {
            width: 200px;
            height: 200px;
            padding: 25px;
          }
          
          .course-highlight {
            padding: 30px 20px;
            margin: 0 10px;
          }
          
          .highlight-content h3 {
            font-size: 1.5rem;
          }
          
          .final-cta {
            padding: 40px 20px;
          }
          
          .final-cta h2 {
            font-size: 2rem;
          }
          
          .final-cta p {
            font-size: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .hero h1 {
            font-size: 2rem;
          }
          
          .section h2 {
            font-size: 1.75rem;
          }
          
          .final-cta h2 {
            font-size: 1.75rem;
          }
          
          .flow-card {
            padding: 25px 15px;
          }
          
          .feature-item,
          .benefit-card {
            padding: 20px 15px;
          }
          
          .course-bubble {
            width: 180px;
            height: 180px;
            padding: 20px;
          }
          
          .course-bubble h3 {
            font-size: 1rem;
          }
          
          .course-bubble p {
            font-size: 0.85rem;
          }
          
          .highlight-content h3 {
            font-size: 1.3rem;
          }
          
          .navbar .container {
            padding: 0 15px;
          }
          
          .navbar img {
            height: 30px;
          }
        }
        
        @media (max-width: 375px) {
          .hero h1 {
            font-size: 1.8rem;
          }
          
          .section h2 {
            font-size: 1.5rem;
          }
          
          .hero-buttons button {
            padding: 12px 16px;
            font-size: 0.9rem;
          }
          
          .flow-card {
            padding: 20px 12px;
          }
          
          .feature-item,
          .benefit-card {
            padding: 18px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default HowItWorks;