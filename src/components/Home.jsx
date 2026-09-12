import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import API from '../api';
import DOMPurify from 'dompurify';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Featured Jobs state
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  
  // Login/Signup Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch featured jobs
  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError('');

        // ONLY fetch jobs from our database (website jobs)
        const websiteJobsRes = await API.get('/api/jobs/public?limit=6');
        console.debug('fetchFeaturedJobs response:', websiteJobsRes);

        // Support multiple possible response shapes from backend
        const raw = websiteJobsRes?.data?.jobs
          || websiteJobsRes?.data?.data
          || websiteJobsRes?.data
          || [];

        // If wrapper object, try to pull array (e.g. { data: { jobs: [...] } })
        const websiteJobs = Array.isArray(raw) ? raw : (raw.jobs || raw.data || []);

        // Normalize minimal fields so UI doesn't break
        const normalized = websiteJobs.map(j => ({
          _id: j._id || j.id || j.jobId || null,
          id: j.id || j._id || null,
          jobTitle: j.jobTitle || j.title || j.name || 'Untitled',
          companyName: j.companyName || j.company || j.employer || '',
          jobType: j.jobType || j.type || '',
          location: j.location || j.city || '',
          description: j.description || j.summary || '',
          isExternal: Boolean(j.isExternal || j.source),
          applyUrl: j.applyUrl || j.url || j.externalLink || null,
          applicationDeadline: j.applicationDeadline || j.deadline || null,
          salary: j.salary || null
        }));

        // Shuffle and pick up to 6 featured jobs from DB
        const shuffled = normalized.sort(() => Math.random() - 0.5);
        setFeaturedJobs(shuffled.slice(0, 6));
      } catch (error) {
        console.error('Error fetching featured jobs (DB only):', error);
        setJobsError('Failed to load featured jobs');
      } finally {
        setJobsLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  
  const handleJobAction = (e) => {
    e.preventDefault();
    setShowLoginModal(true);
  };

  return (
    <div className="overflow-hidden">
      {/* --- **Enhanced Responsive Header** --- */}
      <header 
        className={`d-flex align-items-center justify-content-between px-3 px-md-4 py-2 transition-all ${
          scrolled ? 'header-scrolled' : ''
        }`}
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: scrolled ? '60px' : '70px',
          zIndex: 1000,
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: scrolled ? '0 2px 20px rgba(0, 0, 0, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="d-flex align-items-center">
          <div className="me-2 me-md-3">
            <img 
              src="/logo.jpeg" 
              alt="JobilioHR Logo" 
              style={{ 
                height: scrolled ? '30px' : '35px', 
                objectFit: 'contain',
                transition: 'height 0.3s ease'
              }} 
              className="responsive-img" 
            />
          </div>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-nav-toggle d-md-none touch-target" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <i className="bi bi-list"></i>
        </button>
        
        {/* Desktop Navigation */}
        <nav className="d-none d-md-flex align-items-center gap-3">
          <div className="dropdown me-2">
            <button 
              className="btn btn-outline-dark rounded-pill px-3 px-md-4 py-1 dropdown-toggle touch-target" 
              type="button" 
              id="loginDropdown" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
            >
              Login
            </button>
            <ul className="dropdown-menu shadow border-0" aria-labelledby="loginDropdown">
              <li><Link className="dropdown-item rounded-3" to="/candidate/login" onClick={closeMobileMenu}>For Candidates</Link></li>
              <li><Link className="dropdown-item rounded-3" to="/client/login" onClick={closeMobileMenu}>For Employers</Link></li>
            </ul>
          </div>
          <div className="dropdown">
            <button 
              className="btn btn-dark rounded-pill px-3 px-md-4 py-1 dropdown-toggle touch-target" 
              type="button" 
              id="signupDropdown" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
            >
              Sign Up
            </button>
            <ul className="dropdown-menu shadow border-0" aria-labelledby="signupDropdown">
              <li><Link className="dropdown-item rounded-3" to="/candidate/register" onClick={closeMobileMenu}>For Candidates</Link></li>
              <li><Link className="dropdown-item rounded-3" to="/client/register" onClick={closeMobileMenu}>For Employers</Link></li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Enhanced Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <img 
              src="/logo.jpeg" 
              alt="JobilioHR Logo" 
              style={{ height: '40px', objectFit: 'contain' }} 
              className="responsive-img"
            />
            <button 
              className="btn-close touch-target" 
              onClick={closeMobileMenu}
              aria-label="Close mobile menu"
            ></button>
          </div>
          <div className="d-flex flex-column gap-3">
            <div className="dropdown">
              <button 
                className="btn btn-outline-dark w-100 dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                Login
              </button>
              <ul className="dropdown-menu w-100">
                <li><Link className="dropdown-item" to="/candidate/login" onClick={closeMobileMenu}>For Candidates</Link></li>
                <li><Link className="dropdown-item" to="/client/login" onClick={closeMobileMenu}>For Employers</Link></li>
              </ul>
            </div>
            <div className="dropdown">
              <button 
                className="btn btn-dark w-100 dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                Sign Up
              </button>
              <ul className="dropdown-menu w-100">
                <li><Link className="dropdown-item" to="/candidate/register" onClick={closeMobileMenu}>For Candidates</Link></li>
                <li><Link className="dropdown-item" to="/client/register" onClick={closeMobileMenu}>For Employers</Link></li>
              </ul>
            </div>
            <hr className="my-3" />
            <div className="d-flex flex-column gap-2">
              <Link to="/about" className="btn btn-link text-dark text-decoration-none p-2" onClick={closeMobileMenu}>
                About Us
              </Link>
              <Link to="/contact" className="btn btn-link text-dark text-decoration-none p-2" onClick={closeMobileMenu}>
                Contact Us
              </Link>
              <Link to="/how-it-works" className="btn btn-link text-dark text-decoration-none p-2" onClick={closeMobileMenu}>
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* --- **Enhanced Hero Section** --- */}
      <section 
        className="position-relative overflow-hidden hero-section" 
        style={{
          marginTop: scrolled ? '70px' : '80px', 
          backgroundColor: '#f8f9fa',
          transition: 'margin-top 0.3s ease'
        }}
      >
        <div className="container py-4 py-md-5">
          <div className="row align-items-center py-3 py-md-5">
            <div className="col-lg-6 mb-4 mb-lg-0 text-center text-lg-start">
              <h1 className="display-4 display-md-3 fw-bold mb-3 mb-md-4 hero-title" style={{lineHeight: '1.2'}}>
                <span className="text-primary">No Campus? No Problem!</span> <br />
                <span className="text-dark">Guiding You to Your Dream Job</span>
              </h1>
              <p className="lead text-muted mb-3 mb-md-4 hero-subtitle">
                JobilioHR bridges the gap between talent and opportunity with personalized career guidance.
              </p>
              <div className="d-flex flex-column flex-sm-row flex-wrap gap-3 mt-4 justify-content-center justify-content-lg-start hero-buttons">
                <Link 
                  to="/candidate/register" 
                  className="btn btn-primary rounded-pill px-4 py-3 fw-bold shadow-sm hover-scale btn-responsive"
                  onClick={closeMobileMenu}
                >
                  Get Started
                </Link>
                <Link 
                  to="/how-it-works" 
                  className="btn btn-outline-dark rounded-pill px-4 py-3 fw-bold hover-scale btn-responsive"
                  onClick={closeMobileMenu}
                >
                  How It Works
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="position-relative hero-image-container">
                <div className="gradient-circle-1 d-none d-md-block"></div>
                <div className="gradient-circle-2 d-none d-md-block"></div>
                <img 
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80" 
                  alt="Happy professionals" 
                  className="img-fluid rounded-4 shadow-lg floating-animation responsive-img hero-main-image" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- **Enhanced Process Steps** --- */}
      <section className="py-4 py-md-5 bg-white process-section">
        <div className="container py-3 py-md-5">
          <div className="text-center mb-4 mb-md-5">
            <h2 className="fw-bold display-5 display-md-4 mb-3 process-title">
              Our <span className="text-gradient-blue">Process</span>
            </h2>
            <p className="text-muted lead mx-auto process-subtitle" style={{maxWidth: '600px'}}>
              Simple steps to your dream job
            </p>
          </div>
          
          <div className="row g-4 justify-content-center">
            {[
              {title: 'Easy Registration', desc: 'Register simply with a nominal fee covering your full evaluation and support.', icon: '📝'},
              {title: 'Assessment & Interview', desc: 'Online skills test and a personal interview to assess readiness and communication.', icon: '💡'},
              {title: 'Feedback & Training', desc: 'Get feedback and either job referral or tailored upskilling before a second free interview.', icon: '🔄'},
              {title: 'Job Placement', desc: 'Direct interview calls with employers matched to your skills and aspirations.', icon: '🎯'}
            ].map((step, index) => (
              <div className="col-12 col-sm-6 col-lg-3" key={index}>
                <div className="process-card hover-scale h-100 process-step-card">
                  <div className="process-icon mb-3" style={{fontSize: '2rem'}}>{step.icon}</div>
                  <h5 className="fw-bold mb-2 process-step-title">{step.title}</h5>
                  <p className="text-muted mb-0 process-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- **Enhanced Benefits Section** --- */}
      <section className="py-5 bg-light benefits-section">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-5 mb-3 benefits-title">
              What You Get With <span className="text-gradient-blue">JobilioHR</span>
            </h2>
            <p className="lead text-muted mx-auto benefits-subtitle" style={{ maxWidth: '700px' }}>
              We aim to organize as many interviews as possible locally, often from offices near your city.
            </p>
          </div>

          <div className="row justify-content-center g-4">
            {[
              { icon: '📄', title: 'Free resume building', desc: 'Professional resume crafted by our experts' },
              { icon: '🧠', title: 'Skill assessment', desc: 'Comprehensive evaluation of your abilities' },
              { icon: '💬', title: '1-on-1 interview', desc: 'Personalized mock interview sessions' },
              { icon: '📝', title: 'Detailed feedback', desc: 'Constructive feedback to improve' },
              { icon: '🎓', title: 'Affordable courses', desc: 'Job-focused training programs' },
              { icon: '📞', title: 'Interview calls', desc: 'Direct interviews with employers' },
              { icon: '🤝', title: 'Ongoing support', desc: 'Career guidance even after placement' },
              { icon: '💳', title: 'No Cost EMI', desc: 'Flexible payment options available' }
            ].map((item, index) => (
              <div key={index} className="col-10 col-sm-6 col-md-4 col-lg-3">
                <div className="feature-card h-100 p-4 text-center bg-white rounded-4 shadow-sm benefits-feature-card">
                  <div className="icon-wrapper mx-auto mb-3">
                    <div className="icon-circle d-flex align-items-center justify-content-center">
                      {item.icon}
                    </div>
                  </div>
                  <h5 className="fw-bold mb-2 benefits-feature-title">{item.title}</h5>
                  <p className="text-muted mb-0 benefits-feature-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- **Featured Jobs Section** --- */}
      <section className="py-5 bg-white featured-jobs-section">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-5 mb-3 featured-jobs-title">
              Featured <span className="text-gradient-blue">Jobs</span>
            </h2>
            <p className="lead text-muted mx-auto featured-jobs-subtitle" style={{ maxWidth: '700px' }}>
              Discover exciting career opportunities from top companies
            </p>
          </div>

          {jobsLoading ? (
            <div className="row g-4">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100 featured-job-card">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-start mb-3">
                        <div className="me-3">
                          <div className="placeholder-glow">
                            <div className="placeholder bg-secondary" style={{ width: '50px', height: '50px', borderRadius: '12px' }}></div>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="placeholder-glow">
                            <div className="placeholder bg-secondary mb-2" style={{ width: '80%', height: '20px' }}></div>
                            <div className="placeholder bg-secondary" style={{ width: '60%', height: '16px' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="placeholder-glow">
                        <div className="placeholder bg-secondary mb-2" style={{ width: '100%', height: '14px' }}></div>
                        <div className="placeholder bg-secondary mb-2" style={{ width: '90%', height: '14px' }}></div>
                        <div className="placeholder bg-secondary" style={{ width: '70%', height: '14px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobsError ? (
            <div className="text-center">
              <div className="alert alert-warning" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {jobsError}
              </div>
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="text-center">
              <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                No featured jobs available at the moment.
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {featuredJobs.map((job) => (
                <div key={job._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100 hover-scale featured-job-card">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-start mb-3">
                        <div className="me-3">
                          <div className="company-icon d-flex align-items-center justify-content-center" style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'rgba(0, 102, 255, 0.1)',
                            borderRadius: '12px',
                            fontSize: '1.5rem',
                            color: '#0066ff'
                          }}>
                            <i className="bi bi-building"></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="fw-bold mb-1 featured-job-title" style={{ fontSize: '1.1rem', color: '#2c3e50' }}>
                            {job.jobTitle}
                          </h5>
                          {job.companyName && (
                            <p className="text-muted mb-1 small fw-medium featured-job-company">{job.companyName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        {job.jobType && (
                          <span className="badge bg-primary bg-opacity-10 text-primary me-2 mb-2 featured-job-type">
                            {job.jobType}
                          </span>
                        )}
                        {job.location && (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary me-2 mb-2 featured-job-location">
                            <i className="bi bi-geo-alt me-1"></i>
                            {job.location}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p
                          className="text-muted small featured-job-description"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4'
                          }}
                          // sanitize HTML before injecting to avoid XSS
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || '') }}
                        />
                      )}
                    </div>
                    
                    <div className="card-footer bg-white border-0 pt-0 pb-3 px-3">
                      <div className="d-flex justify-content-between align-items-center pt-3" style={{
                        borderTop: '1px solid transparent',
                        borderImage: 'linear-gradient(to right, transparent, #dee2e6, transparent) 1'
                      }}>
                        {job.isExternal ? (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-link text-decoration-none p-0 d-flex align-items-center text-primary fw-medium featured-job-external-link"
                          >
                            {/* View & Apply <i className="bi bi-arrow-right ms-1"></i> */}
                          </a>
                        ) : (
                          <button
                            onClick={handleJobAction}
                            className="btn btn-link text-decoration-none p-0 d-flex align-items-center text-primary fw-medium featured-job-view-link"
                          >
                            View details <i className="bi bi-arrow-right ms-1"></i>
                          </button>
                        )}
                        
                        <button
                          onClick={handleJobAction}
                          className="btn btn-primary rounded-pill px-3 py-2 fw-medium d-flex align-items-center featured-job-apply-btn"
                          style={{
                            background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)',
                            border: 'none',
                            minWidth: '100px',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="bi bi-briefcase me-2"></i> Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-5">
            <button 
              onClick={handleJobAction}
              className="btn btn-outline-primary rounded-pill px-4 py-3 fw-bold hover-scale featured-jobs-cta-btn"
            >
              View All Jobs
            </button>
          </div>
        </div>
      </section>

      {/* --- **Enhanced Corporate Training Section** --- */}
      <section className="py-5 bg-white corporate-training-section">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold mb-3 corporate-training-title">
              Corporate-Style Training & <span className="text-gradient-blue">Live Internships</span>
            </h2>
            <p className="lead text-muted mx-auto corporate-training-subtitle" style={{maxWidth: '800px'}}>
              Real-world experience that prepares you for the professional environment
            </p>
          </div>
          
          <div className="row g-4 mb-5">
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100 hover-scale corporate-training-card">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-circle me-3" style={{backgroundColor: 'rgba(0, 102, 255, 0.1)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.5rem'}}>
                      🌐
                    </div>
                    <h5 className="fw-bold mb-0">Real-World Projects</h5>
                  </div>
                  <p className="text-muted">
                    All our students work on live, real-world market projects sourced from actual clients or businesses – not simulated assignments. This gives you hands-on experience that gets noticed by future employers.
                  </p>
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                    alt="Team working" 
                    className="img-fluid rounded-3 mt-3 responsive-img" 
                  />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100 hover-scale corporate-training-card">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-circle me-3" style={{backgroundColor: 'rgba(0, 102, 255, 0.1)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '1.5rem'}}>
                      🏢
                    </div>
                    <h5 className="fw-bold mb-0">Corporate Environment</h5>
                  </div>
                  <p className="text-muted">
                    Our internship program replicates a true corporate environment: you'll adhere to office-like schedules, manage deadlines, submit task reports, work in teams, develop leadership, and use industry-standard tools.
                  </p>
                  <div className="mt-4">
                    <h6 className="fw-bold mb-3">Tools & Methodologies:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {['Jira', 'Slack', 'Git', 'Excel', 'Agile', 'Scrum'].map((tool, index) => (
                        <span key={index} className="badge bg-light text-dark px-3 py-2 corporate-tools-badge">{tool}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- **Enhanced Local Opportunities Section** --- */}
      <section className="py-5 bg-primary text-white local-opportunities-section">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <h2 className="display-5 fw-bold mb-4 local-opportunities-title">Start Your Journey</h2>
              <p className="lead mb-4 opacity-75 local-opportunities-subtitle">
                Join our platform, get expert guidance & unlock job opportunities— even without on-campus support.
              </p>
              <p className="mb-4 local-opportunities-desc">
                We aim to organize as many interviews as possible locally, often from offices near your city.
              </p>
              <Link 
                to="/candidate/register" 
                className="btn btn-light rounded-pill px-4 py-3 fw-bold shadow hover-scale local-opportunities-btn"
                onClick={closeMobileMenu}
              >
                Register Now
              </Link>
            </div>
            <div className="col-lg-6">
              <img 
                src="https://images.unsplash.com/photo-1579389083078-4e7018379f7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                alt="Learning and growth" 
                className="img-fluid rounded-4 shadow-lg responsive-img local-opportunities-image" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- **Enhanced Footer** --- */}
      <footer className="bg-white text-black pt-5 pb-4 border-top footer-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-lg-3">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3">
                  <img 
                    src="/logo.jpeg" 
                    alt="JobilioHR Logo" 
                    style={{ height: '40px', objectFit: 'contain' }} 
                    className="responsive-img"
                  />
                </div>
                <span className="fs-5 fw-bold"></span>
              </div>
              <div className="mb-4">
                <p className="mb-1 d-flex align-items-center footer-contact-info">
                  <i className="bi bi-geo-alt me-2"></i> Magarpatta City, Hadapsar, Pune, Maharashtra - 411013
                </p>
                <p className="mb-0 d-flex align-items-center footer-contact-info">
                  <i className="bi bi-clock me-2"></i> Mon–Sat, 9am–7pm
                </p>
              </div>
            </div>
            <div className="col-6 col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 footer-section-title">Quick Links</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link
                    to="/about"
                    className="text-dark text-decoration-none opacity-75 hover-opacity-100 footer-link"
                    onClick={closeMobileMenu}
                  >
                    About us
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/contact"
                    className="text-dark text-decoration-none opacity-75 hover-opacity-100 footer-link"
                    onClick={closeMobileMenu}
                  >
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-6 col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 footer-section-title">Legal</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link 
                    to="/privacy" 
                    className="text-dark text-decoration-none opacity-75 hover-opacity-100 footer-link"
                    onClick={closeMobileMenu}
                  >
                    Privacy policy
                  </Link>
                </li>
                <li className="mb-2">
                  <Link 
                    to="/terms" 
                    className="text-dark text-decoration-none opacity-75 hover-opacity-100 footer-link"
                    onClick={closeMobileMenu}
                  >
                    Terms & conditions
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-6 col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 footer-section-title">Connect With Us</h6>
              <ul className="list-unstyled">
                <li className="mb-2 d-flex align-items-center footer-contact-info">
                  <i className="bi bi-envelope me-2"></i>
                  info@jobiliohr.com
                </li>
                <li className="mb-2 d-flex align-items-center footer-contact-info">
                  <i className="bi bi-telephone me-2"></i>
                  +91 74994 32816
                </li>
              </ul>
            </div>
            <div className="col-6 col-lg-3 col-md-4">
              <h6 className="fw-bold mb-3 footer-section-title">Follow Us</h6>
              <div className="d-flex gap-3 footer-social-links">
                <a
                  href="https://www.facebook.com/JobioHR"
                  className="text-decoration-none text-dark footer-social-link"
                  aria-label="JobioHR on Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a
                  href="https://www.linkedin.com/company/jobiohr"
                  className="text-decoration-none text-dark footer-social-link"
                  aria-label="JobioHR on LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-linkedin fs-5"></i>
                </a>
                <a
                  href="https://twitter.com/JobioHR"
                  className="text-decoration-none text-dark footer-social-link"
                  aria-label="JobioHR on Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter-x fs-5"></i>
                </a>
                <a
                  href="https://www.instagram.com/jobiliohr?igsh=MTYyc2k4NDkwaXhmZQ=="
                  className="text-decoration-none text-dark footer-social-link"
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
            <p className="mb-0 footer-copyright">
              © {new Date().getFullYear()} JobilioHR — All rights reserved. Powered by Rokoso Technology Service Pvt Ltd.
            </p>
          </div>
        </div>
      </footer>

      {/* --- **Login/Signup Modal** --- */}
      {showLoginModal && (
        <div 
          className="modal fade show d-block login-modal-overlay" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoginModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg login-modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-0 pb-0">
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowLoginModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center px-4 pb-4">
                <div className="mb-4">
                  <div className="mx-auto mb-3" style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(0, 102, 255, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-person-lock" style={{ fontSize: '1.5rem', color: '#0066ff' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3" style={{ color: '#2c3e50' }}>
                    Login Required
                  </h4>
                  <p className="text-muted mb-4">
                    To view more job postings and apply, please log in to your account.
                  </p>
                  <p className="text-muted mb-4">
                    Don't have an account yet?
                  </p>
                </div>
                
                <div className="d-flex flex-column gap-3">
                  <Link 
                    to="/candidate/login" 
                    className="btn btn-primary rounded-pill px-4 py-3 fw-bold login-modal-btn"
                    style={{
                      background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)',
                      border: 'none'
                    }}
                    onClick={() => setShowLoginModal(false)}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </Link>
                  <Link 
                    to="/candidate/register" 
                    className="btn btn-outline-primary rounded-pill px-4 py-3 fw-bold login-modal-btn"
                    onClick={() => setShowLoginModal(false)}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- **Enhanced Custom CSS** --- */}
      <style>{`
        /* **Enhanced Gradients** */
        .text-gradient-blue {
          background: linear-gradient(135deg, #0066ff, #00ccff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* **Enhanced Card Designs** */
        .process-card {
          padding: 1.5rem;
          border-radius: 1rem;
          background: white;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .process-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }
        
        .process-icon {
          width: 60px;
          height: 60px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 102, 255, 0.1);
          border-radius: 12px;
          margin: 0 auto;
        }
        
        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05);
          height: 100%;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        .icon-wrapper {
          width: 70px;
          height: 70px;
          margin: 0 auto;
        }
        
        .icon-circle {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 204, 255, 0.1) 100%);
          border-radius: 18px;
          font-size: 2rem;
          color: #0066ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* **Enhanced Animations** */
        .hover-scale {
          transition: all 0.3s ease;
        }
        
        .hover-scale:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        /* **Enhanced Gradient Circles** */
        .gradient-circle-1 {
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(0, 102, 255, 0.2) 0%, transparent 70%);
          top: -50px;
          left: -50px;
          z-index: -1;
        }
        
        .gradient-circle-2 {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(0, 204, 255, 0.1) 0%, transparent 70%);
          bottom: -100px;
          right: -100px;
          z-index: -1;
        }
        
        /* **Enhanced Hover Effects** */
        .hover-opacity-100:hover {
          opacity: 1 !important;
        }
        
        /* **Enhanced Icon Circles** */
        .icon-circle {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 1.5rem;
          background-color: rgba(0, 102, 255, 0.1);
        }
        
        /* **Enhanced Header Transitions** */
        .header-scrolled {
          background-color: rgba(255, 255, 255, 0.98) !important;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* **Enhanced Mobile Menu** */
        .mobile-menu {
          backdrop-filter: blur(10px);
        }
        
        .mobile-menu-content {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.95);
        }
        
        /* **Enhanced Responsive Typography** */
        @media (max-width: 767.98px) {
          .hero-title {
            font-size: 2rem;
            line-height: 1.3;
          }
          
          .hero-subtitle {
            font-size: 1rem;
          }
          
          .process-title {
            font-size: 1.75rem;
          }
          
          .benefits-title {
            font-size: 1.75rem;
          }
          
          .corporate-training-title {
            font-size: 1.75rem;
          }
          
          .local-opportunities-title {
            font-size: 1.75rem;
          }
        }
        
        /* **Enhanced Responsive Spacing** */
        @media (max-width: 767.98px) {
          .hero-section {
            padding: 2rem 0;
          }
          
          .process-section {
            padding: 2rem 0;
          }
          
          .benefits-section {
            padding: 2rem 0;
          }
          
          .corporate-training-section {
            padding: 2rem 0;
          }
          
          .local-opportunities-section {
            padding: 2rem 0;
          }
        }
        
        /* **Enhanced Responsive Cards** */
        @media (max-width: 767.98px) {
          .process-step-card {
            margin-bottom: 1rem;
          }
          
          .benefits-feature-card {
            margin-bottom: 1rem;
          }
          
          .corporate-training-card {
            margin-bottom: 1rem;
          }
        }
        
        /* **Enhanced Responsive Images** */
        @media (max-width: 767.98px) {
          .hero-main-image {
            max-width: 100%;
            height: auto;
          }
          
          .local-opportunities-image {
            max-width: 100%;
            height: auto;
          }
        }
        
        /* **Enhanced Footer Responsiveness** */
        @media (max-width: 767.98px) {
          .footer-section {
            text-align: center;
          }
          
          .footer-social-links {
            justify-content: center;
          }
          
          .footer-contact-info {
            justify-content: center;
          }
        }
        
        /* **Enhanced Touch Targets** */
        @media (hover: none) and (pointer: coarse) {
          .btn {
            min-height: 48px;
            min-width: 48px;
          }
          
          .nav-link {
            padding: 0.75rem 1rem;
          }
        }
        
        /* **Enhanced Accessibility** */
        @media (prefers-reduced-motion: reduce) {
          .floating-animation {
            animation: none;
          }
          
          .hover-scale:hover {
            transform: none;
          }
        }
        
        /* **Enhanced Dark Mode Support** */
        @media (prefers-color-scheme: dark) {
          .auto-dark {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
          }
        }
        
        /* **Enhanced High Contrast Support** */
        @media (prefers-contrast: high) {
          .btn {
            border-width: 2px !important;
          }
          
          .card {
            border-width: 2px !important;
          }
        }
        
        /* **Enhanced Print Styles** */
        @media print {
          .mobile-menu,
          .mobile-nav-toggle {
            display: none !important;
          }
          
          .hero-section {
            margin-top: 0 !important;
          }
        }
        
        /* **Featured Jobs Section Styles** */
        .featured-job-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
        }
        
        .featured-job-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .featured-job-title {
          line-height: 1.3;
        }
        
        .featured-job-company {
          line-height: 1.2;
        }
        
        .featured-job-description {
          line-height: 1.5;
        }
        
        .featured-job-source {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        
        .featured-job-type,
        .featured-job-location {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        
        .featured-job-external-link:hover,
        .featured-job-view-link:hover {
          color: #0056b3 !important;
        }
        
        .featured-job-apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(58, 123, 213, 0.3);
        }
        
        .featured-jobs-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 110, 253, 0.3);
        }
        
        /* **Featured Jobs Responsive Styles** */
        @media (max-width: 767.98px) {
          .featured-jobs-title {
            font-size: 1.75rem;
          }
          
          .featured-jobs-subtitle {
            font-size: 1rem;
          }
          
          .featured-job-card {
            margin-bottom: 1rem;
          }
          
          .featured-job-title {
            font-size: 1rem;
          }
          
          .featured-job-apply-btn {
            min-width: 80px !important;
            font-size: 0.875rem;
          }
        }
        
        /* **Loading Placeholder Animation** */
        .placeholder-glow .placeholder {
          animation: placeholder-glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes placeholder-glow {
          50% {
            opacity: 0.2;
          }
        }
        
        /* **Login Modal Styles** */
        .login-modal-overlay {
          z-index: 9999;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backdrop-filter: blur(5px);
        }
        
        .login-modal-content {
          animation: modalSlideIn 0.3s ease-out;
          max-width: 400px;
          margin: 0 auto;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .login-modal-btn {
          transition: all 0.3s ease;
          min-height: 48px;
        }
        
        .login-modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        /* **Modal Responsive Styles** */
        @media (max-width: 576px) {
          .login-modal-content {
            margin: 1rem;
            max-width: none;
          }
          
          .login-modal-btn {
            font-size: 0.9rem;
            padding: 0.75rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;