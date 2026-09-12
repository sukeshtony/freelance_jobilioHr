import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import API from '../../api';
import { API_BASE_URL } from '../../api';
import { requireLogin } from '../../utils/requireLogin';
import { requirePremium } from '../../utils/requirePremium';

const GenerateResume = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const resumeRef = useRef();
  const [selectedTemplate, setSelectedTemplate] = useState('template2');
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const isAuthenticated = await requireLogin(navigate);
        if (!isAuthenticated) { setIsAuthChecking(false); setIsLoading(false); return; }
        
        const result = await requirePremium(navigate);
        if (!result?.user) { setIsAuthChecking(false); setIsLoading(false); return; }
        setIsAuthChecking(false);
        setIsPremium(true);
        const token = localStorage.getItem('token');
        const res = await API.get('/api/profile/draft', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData({
          ...res.data,
          skills: res.data.skills || [],
          languages: res.data.languages || [],
          companies: res.data.companies || [],
          education: res.data.education || [],
          projects: res.data.projects || [],
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        if (err.response?.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          navigate('/candidate/login');
        } else if (err.response?.status === 403) {
          alert('⭐ Premium Feature Only!\n\nThis AI Resume Builder is exclusively for premium members.');
          navigate('/career-dashboard');
        } else {
          alert('Failed to load profile data. Please try again.');
          navigate('/career-dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (isLoading) {
    return (
      <div 
        className="d-flex flex-column justify-content-center align-items-center"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="text-center">
          <div className="mb-4">
            <div
              className="spinner-border text-white"
              role="status"
              style={{ width: "4rem", height: "4rem", borderWidth: "0.4rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
          
          <h2 className="text-white fw-bold mb-3">
            <i className="bi bi-shield-check me-2"></i>
            {isAuthChecking ? 'Checking Access' : 'Loading Resume'}
          </h2>
          
          <p className="text-white mb-4 opacity-90">
            {isAuthChecking ? 'Verifying your premium access...' : 'Loading your profile data...'}
          </p>
          
          <div className="d-flex justify-content-center gap-3 mt-4">
            <div className="d-flex align-items-center text-white">
              <div className="spinner-grow spinner-grow-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Checking credentials</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isPremium || !profileData) {
    return (
      <div 
        className="d-flex flex-column justify-content-center align-items-center"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }}
      >
        <div className="text-center text-white">
          <div className="mb-4">
            <i className="bi bi-lock-fill" style={{ fontSize: '5rem' }}></i>
          </div>
          <h2 className="fw-bold mb-3">Premium Feature</h2>
          <p className="mb-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const downloadPDF = async () => {
    const element = resumeRef.current;

    // 1. Freeze the template's exact layout
    const originalStyles = {
      width: element.style.width,
      height: element.style.height,
      overflow: element.style.overflow
    };

    element.style.width = '794px';
    element.style.height = 'auto';
    element.style.overflow = 'visible';

    // 2. Wait for all assets to load
    await Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );

    // 3. Calculate precise dimensions
    const pxToMm = 0.264583;
    const contentWidth = element.scrollWidth;
    const contentHeight = element.scrollHeight;
    const pdfWidth = 210; // A4 width in mm
    const scale = pdfWidth / (contentWidth * pxToMm);

    // 4. Capture with exact dimensions
    const baseCanvas = await html2canvas(element, {
      scale: scale * 2, // Double scale for higher quality
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      letterRendering: true,
      allowTaint: true
    });

    // 4b. Trim trailing white space at the bottom to avoid near-empty last page
    let canvas = baseCanvas;
    try {
      const ctx = baseCanvas.getContext('2d');
      const cw = baseCanvas.width;
      const ch = baseCanvas.height;
      const imageData = ctx.getImageData(0, 0, cw, ch).data;
      let lastNonWhiteRow = -1;
      outer: for (let y = ch - 1; y >= 0; y--) {
        for (let x = 0; x < cw; x++) {
          const offset = (y * cw + x) * 4;
          const r = imageData[offset];
          const g = imageData[offset + 1];
          const b = imageData[offset + 2];
          const a = imageData[offset + 3];
          if (a !== 0 && (r < 250 || g < 250 || b < 250)) {
            lastNonWhiteRow = y;
            break outer;
          }
        }
      }
      if (lastNonWhiteRow > -1 && lastNonWhiteRow < ch - 1) {
        const effectiveHeight = lastNonWhiteRow + 1;
        const trimmed = document.createElement('canvas');
        trimmed.width = cw;
        trimmed.height = effectiveHeight;
        const tctx = trimmed.getContext('2d');
        tctx.drawImage(baseCanvas, 0, 0, cw, effectiveHeight, 0, 0, cw, effectiveHeight);
        canvas = trimmed;
      }
    } catch (e) {
      // If trimming fails, fall back to original canvas
      console.warn('Canvas trim skipped:', e);
    }

    // 5. Create PDF and add image pages without trailing blank page
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const imgProps = pdf.getImageProperties(imgDataUrl);
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const mmPerPx = pdfWidth / imgProps.width; // scale used to fit width
    const pageHeightPx = Math.floor(pageHeightMm / mmPerPx);

    if ((imgProps.height * mmPerPx) <= pageHeightMm + 0.5) {
      // Single-page fits without overflow
      const singlePageHeightMm = (imgProps.height * mmPerPx);
      pdf.addImage(imgDataUrl, 'JPEG', 0, 0, pdfWidth, singlePageHeightMm);
    } else {
      // Multi-page: slice canvas into page-sized segments
      let renderedHeightPx = 0;
      while (renderedHeightPx < imgProps.height) {
        const sliceHeightPx = Math.min(pageHeightPx, imgProps.height - renderedHeightPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgProps.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0,
          renderedHeightPx,
          imgProps.width,
          sliceHeightPx,
          0,
          0,
          imgProps.width,
          sliceHeightPx
        );
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const currentPageHeightMm = sliceHeightPx * mmPerPx;
        pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, currentPageHeightMm);
        renderedHeightPx += sliceHeightPx;
        if (renderedHeightPx < imgProps.height) {
          pdf.addPage();
        }
      }
    }

    // 6. Restore original styles
    Object.assign(element.style, originalStyles);

    pdf.save(`${profileData.name.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  const Template1 = () => (
    <div className="container-fluid p-0 bg-white resume-professional" style={{
      maxWidth: '794px',
      width: '100%',
      margin: '0 auto',
      overflowX: 'hidden',
      minHeight: '1123px',
      position: 'relative'
    }} ref={resumeRef}>
      {/* Left full-height background overlay */}
      <div
        className="rp-overlay d-none d-md-block"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '33.3333%',
          background: 'linear-gradient(180deg, #eef1f4 0%, #cfd6df 100%)',
          borderRight: '1px solid #bfc5cb',
          zIndex: 0
        }}
      />
      <div className="row g-0 flex-column flex-md-row align-items-stretch" style={{ position: 'relative', zIndex: 1 }}>
        {/* Left Sidebar */}
        <div className="col-12 col-md-4 bg-transparent text-dark p-3 d-flex flex-column h-100 order-2 order-md-1">
          <div className="text-center mb-4">
            {profileData.avatarUrl ? (
              <img
                src={`${API_BASE_URL}${profileData.avatarUrl}`}
                alt="Profile"
                className="rounded-circle mx-auto mb-2 img-fluid"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  background: '#fff',
                  maxWidth: '100%'
                }}
              />
            ) : (
              <div className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: '#6b7280',
                  fontSize: 'clamp(24px, 10vw, 40px)',
                  fontWeight: 'bold'
                }}
              >
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
  
          <div className="mb-4">
            <h3 className="h5 fw-bold mb-3 pb-1 text-uppercase border-bottom border-dark"
              style={{ color: '#000', fontSize: 'clamp(12px, 2.5vw, 16px)', borderColor: '#343a40' }}>
              Contact
            </h3>
            <div className="mb-2">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-telephone-fill me-2 fs-6"></i>
                <span className="fs-6 text-break">+91 {profileData.phone}</span>
              </div>
              <div className="d-flex align-items-start mb-2">
                <i className="bi bi-envelope-fill me-2 mt-1 fs-6"></i>
                <span className="fs-6 text-break">{profileData.email}</span>
              </div>
              <div className="d-flex align-items-start mb-2">
                <i className="bi bi-geo-alt-fill me-2 mt-1 fs-6"></i>
                <span className="fs-6 text-break">{profileData.address}</span>
              </div>
              {profileData.linkedin && (
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-linkedin me-2 fs-6"></i>
                  <span className="fs-6 text-break">{profileData.linkedin}</span>
                </div>
              )}
            </div>
          </div>
  
          <div className="mb-4">
            <h3 className="h5 fw-bold mb-3 pb-1 text-uppercase border-bottom border-dark"
              style={{ color: '#000', fontSize: 'clamp(12px, 2.5vw, 16px)', borderColor: '#343a40' }}>
              Expertise
            </h3>
            <ul className="list-unstyled">
              {profileData.skills?.slice(0, 8).map((skill, index) => (
                <li key={index} className="mb-2">
                  <div className="d-flex align-items-center">
                    <div className="me-2 text-dark" style={{ fontSize: '10px' }}>●</div>
                    <span className="fs-6 text-break">{skill}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
  
          {profileData.languages?.length > 0 && (
            <div className="mb-4">
              <h3 className="h5 fw-bold mb-3 pb-1 text-uppercase border-bottom border-dark"
                style={{ color: '#000', fontSize: 'clamp(12px, 2.5vw, 16px)', borderColor: '#343a40' }}>
                Languages
              </h3>
              <div>
                {profileData.languages.map((language, index) => (
                  <div key={index} className="fw-bold mb-2 fs-6 text-break">
                    {language}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
  
        {/* Right Content */}
        <div className="col-12 col-md-8 p-3 p-md-4 d-flex flex-column order-1 order-md-2">
          <div className="mb-4">
            <h1 className="display-6 fw-bold mb-2 text-dark" style={{ fontSize: 'clamp(18px, 4.5vw, 28px)' }}>{profileData.name}</h1>
            <h2 className="h5 mb-3 text-muted fw-normal" style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>{profileData.title}</h2>
            <p className="text-muted lh-base text-break" style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
              {profileData.objective}
            </p>
          </div>
  
          <div className="mb-4">
            <h3 className="h5 fw-bold mb-4 text-uppercase border-bottom pb-2 text-dark"
              style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>
              Professional Experience
            </h3>
  
            {profileData.companies?.map((exp, index) => (
              <div key={index} className="mb-4 position-relative ps-3">
                <div className="position-absolute rounded-circle bg-dark"
                  style={{
                    width: '8px',
                    height: '8px',
                    left: '0',
                    top: '8px',
                  }}></div>
  
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-baseline mb-2">
                  <h4 className="h6 fw-bold mb-1 text-dark text-break" style={{ fontSize: 'clamp(13px, 2.5vw, 16px)' }}>{exp.position}</h4>
                  <span className="text-body-tertiary mt-1 mt-md-0" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                    {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                  </span>
                </div>
                <p className="text-muted mb-2 text-break" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                  <em>{exp.name} | {exp.location || 'Location'}</em>
                </p>
                <div className="text-body-secondary lh-base" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                  {exp.responsibilities && (
                    <>
                      <h5 className="h6 fw-bold mb-1">Responsibilities:</h5>
                      <ul className="mb-3">
                        {exp.responsibilities.split('. ').filter(Boolean).map((point, i) => (
                          <li key={i} className="text-break">{point.replace(/\.$/, '')}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {exp.achievements && (
                    <>
                      <h5 className="h6 fw-bold mb-1">Achievements:</h5>
                      <ul className="mb-0">
                        {exp.achievements.split('. ').filter(Boolean).map((point, i) => (
                          <li key={i} className="text-break">{point.replace(/\.$/, '')}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <h3 className="h5 fw-bold mb-4 text-uppercase border-bottom pb-2 text-dark"
            style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>
            Education
          </h3>
          {profileData.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="d-flex flex-column flex-md-row justify-content-between">
                <div>
                  <h3 className="h6 mb-1 text-break" style={{ fontWeight: '600', fontSize: 'clamp(13px, 2.5vw, 16px)' }}>{edu.degree}</h3>
                  <p className="text-muted mb-0 text-break" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                    <em>{edu.institute === "Others" ? edu.customInstitute : edu.institute}</em>
                  </p>
                </div>
                <span className="text-muted mt-1 mt-md-0" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                  {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                </span>
              </div>
            </div>
          ))}
  
          {profileData.projects?.length > 0 && (
            <div className="mb-4">
              <h3 className="h5 fw-bold mb-4 text-uppercase border-bottom pb-2 text-dark"
                style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>
                Projects
              </h3>
              {profileData.projects.map((project, index) => (
                <div key={index} className="mb-3">
                  <h4 className="h6 fw-bold mb-2 text-dark text-break" style={{ fontSize: 'clamp(13px, 2.5vw, 16px)' }}>{project.name}</h4>
                  <p className="text-body-secondary lh-base text-break" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Template2 = () => (
    <div className="container-fluid p-0 resume-modern" style={{
      maxWidth: '794px',
      width: '100%',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      overflowX: 'hidden',
      minHeight: '1123px',
      position: 'relative'
    }} ref={resumeRef}>
      <div className="p-3 p-md-4 bg-dark text-white text-center">
        <h1 className="display-6 mb-1" style={{
          fontWeight: '600',
          fontSize: 'clamp(20px, 5vw, 28px)',
          wordWrap: 'break-word'
        }}>{profileData.name}</h1>
        <h2 className="h5 text-light mb-0" style={{
          fontSize: 'clamp(14px, 3vw, 18px)',
          wordWrap: 'break-word'
        }}>{profileData.title}</h2>
      </div>
      {/* Content area with left light overlay under header */}
      <div style={{ position: 'relative' }}>
        <div
          className="rm-overlay"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '33.3333%',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e9ecef',
            zIndex: 0
          }}
        />
        <div className="row g-0 flex-column flex-md-row align-items-stretch" style={{ position: 'relative', zIndex: 1 }}>
          <div className="col-12 col-md-4 p-3 p-md-4 bg-transparent d-flex flex-column h-100 order-2 order-md-1">
          <div className="mb-4">
            <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
              style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Contact</h2>
            <p className="mb-2"><strong>Email:</strong> {profileData.email}</p>
            <p className="mb-2"><strong>Phone:</strong> +91 {profileData.phone}</p>
            <p className="mb-2"><strong>Location:</strong> {profileData.address}</p>
            {profileData.linkedin && (
              <p className="mb-2"><strong>LinkedIn:</strong> {profileData.linkedin}</p>
            )}
          </div>
          <div className="mb-4">
            <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
              style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Skills</h2>
            <div className="d-flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <span key={index} className="badge bg-dark text-white px-2 px-md-3 py-1 py-md-2"
                  style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          {profileData.languages?.length > 0 && (
            <div className="mb-4">
              <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
                style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Languages</h2>
              <div className="d-flex flex-wrap gap-2">
                {profileData.languages.map((language, index) => (
                  <span key={index} className="badge bg-secondary text-white px-2 px-md-3 py-1 py-md-2"
                    style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="col-12 col-md-8 p-3 p-md-4 bg-white d-flex flex-column order-1 order-md-2">
          <div className="mb-4">
            <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
              style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Objective</h2>
            <p className="text-dark" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>{profileData.objective}</p>
          </div>
          {profileData.experience !== undefined && (
            <div className="mb-4">
              <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
                style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Total Experience</h2>
              <p className="text-dark" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                {(profileData.experience === 0 || profileData.experience === "0") ? "Fresh Graduate" : `${profileData.experience} year${profileData.experience !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}
          <div className="mb-4">
            <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
              style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Professional Experience</h2>
            {profileData.companies?.map((exp, index) => (
              <div key={index}>
                {index > 0 && <hr className="my-3" style={{ borderTop: '1px solid #0d7ae8c4' }} />}
                <div className="mb-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between">
                    <div>
                      <h3 className="h6 mb-1" style={{ fontWeight: '600', fontSize: 'clamp(14px, 3vw, 16px)' }}>{exp.position}</h3>
                      <p className="text-muted mb-2" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}><em>{exp.name}</em></p>
                    </div>
                    <span className="text-muted" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                    </span>
                  </div>

                  {exp.responsibilities && (
                    <div className="mb-2">
                      <h4 className="h6 mb-1" style={{ fontWeight: '500', fontSize: 'clamp(13px, 3vw, 14px)' }}>Responsibilities</h4>
                      <p className="text-dark" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>{exp.responsibilities}</p>
                    </div>
                  )}

                  {exp.achievements && (
                    <div className="mb-2">
                      <h4 className="h6 mb-1" style={{ fontWeight: '500', fontSize: 'clamp(13px, 3vw, 14px)' }}>Achievements</h4>
                      <p className="text-dark" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>{exp.achievements}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <h2 className="h5 text-uppercase border-bottom border-dark pb-2 mb-3"
              style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>Education</h2>
            {profileData.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex flex-column flex-md-row justify-content-between">
                  <div>
                    <h3 className="h6 mb-1" style={{ fontWeight: '600', fontSize: 'clamp(14px, 3vw, 16px)' }}>{edu.degree}</h3>
                    <p className="text-muted mb-0" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      <em>{edu.institute === "Others" ? edu.customInstitute : edu.institute}</em>
                    </p>
                  </div>
                  <span className="text-muted" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                    {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Template3 = () => (
    <div className="container-fluid p-0" style={{
      maxWidth: '794px',
      width: '100%',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      overflowX: 'hidden',
      minHeight: '1123px',
      display: 'flex',
      flexDirection: 'column'
    }} ref={resumeRef}>
      <div className="p-3 p-md-4">
        {/* Header - Full Width */}
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-1" style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}>{profileData.name}</h1>
          <h2 className="h4 text-muted mb-3" style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>{profileData.title}</h2>
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3 mt-2" style={{ color: '#6c757d', fontSize: 'clamp(12px, 3vw, 14px)' }}>
            <span className="d-flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
              <i className="bi bi-telephone me-1"></i> +91 {profileData.phone}
            </span>
            <span className="d-none d-md-inline mx-2" style={{ opacity: 0.5 }}>|</span>
            <span className="d-flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
              <i className="bi bi-envelope me-1"></i> {profileData.email}
            </span>
            <span className="d-none d-md-inline mx-2" style={{ opacity: 0.5 }}>|</span>
            <span className="d-flex align-items-center">
              <i className="bi bi-geo-alt me-1"></i> {profileData.address}
            </span>
          </div>
        </div>

        <hr className="my-4" style={{ borderTop: '2px solid #dee2e6' }} />

        {/* Two Column Layout */}
        <div className="row flex-column flex-md-row align-items-stretch" style={{ flex: 1 }}>
          {/* Left Column - Experience only, wider to emphasize */}
          <div className="col-12 col-md-7 pe-md-4 d-flex flex-column h-100">
            {profileData.companies?.length > 0 && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>EXPERIENCE</h3>
                {profileData.companies.map((exp, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between">
                      <h4 className="h6 fw-bold mb-1"
                        style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>{exp.position}</h4>
                      <span className="text-muted" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                        {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                      </span>
                    </div>
                    <p className="text-muted mb-2" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      <em>{exp.name} - {exp.location}</em>
                    </p>
                    <ul className="mb-0 ps-3" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      {exp.responsibilities?.split(/[\.\n]+/).map((point, i) => (
                        point.trim() && <li key={i}>{point.trim().replace(/\.$/, '')}</li>
                      ))}
                    </ul>
                    {exp.achievements && (
                      <div className="mt-2">
                        <h6 className="mb-1" style={{ fontWeight: '500', fontSize: 'clamp(13px, 3vw, 14px)' }}>Achievements</h6>
                        <ul className="mb-0 ps-3" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                          {exp.achievements.split(/[\.\n]+/).map((point, i) => (
                            point.trim() && <li key={i}>{point.trim().replace(/\.$/, '')}</li>
                      ))}
                    </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Objective, Total Experience, Skills, Education, Projects, Languages, Certifications */}
          <div className="col-12 col-md-5 ps-md-4 d-flex flex-column h-100">
            {profileData.objective && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>SUMMARY</h3>
                <p className="mb-0" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>{profileData.objective}</p>
          </div>
            )}
            {profileData.experience !== undefined && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>TOTAL EXPERIENCE</h3>
                <p className="mb-0" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                  {(profileData.experience === 0 || profileData.experience === "0") ? "Fresh Graduate" : `${profileData.experience} year${profileData.experience !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}

            {profileData.skills?.length > 0 && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>SKILLS</h3>
                <div className="d-flex flex-wrap gap-2">
                  {profileData.skills.map((skill, index) => (
                    <span key={index} className="badge bg-light text-dark border" style={{ fontSize: 'clamp(12px, 3vw, 13px)' }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {profileData.education?.length > 0 && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>EDUCATION</h3>
                {profileData.education.map((edu, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between">
                      <h4 className="h6 fw-bold mb-1" style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>{edu.degree}</h4>
                      <span className="text-muted" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                        {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                      </span>
                        </div>
                    <p className="text-muted mb-1" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      <em>{edu.institute === "Others" ? edu.customInstitute : edu.institute}</em>
                    </p>
                    </div>
                  ))}
                </div>
            )}

            {profileData.projects?.length > 0 && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>PROJECTS</h3>
                {profileData.projects.map((project, index) => (
                  <div key={index} className="mb-2">
                    <h4 className="h6 fw-bold mb-1" style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>{project.name}</h4>
                    <p className="mb-0 text-muted" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>{project.description}</p>
                  </div>
                ))}
              </div>
            )}

            {profileData.certifications?.length > 0 && (
              <div className="mb-4">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>CERTIFICATIONS</h3>
                <ul style={{ fontSize: 'clamp(12px, 3vw, 14px)' }} className="mb-0 ps-3">
                  {profileData.certifications.map((cert, i) => (
                    <li key={i}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}

            {profileData.languages?.length > 0 && (
              <div className="mb-2">
                <h3 className="h5 fw-bold border-bottom pb-2"
                  style={{ fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '0.06em' }}>LANGUAGES</h3>
                <div className="d-flex flex-wrap gap-2">
                  {profileData.languages.map((language, index) => (
                    <span key={index} className="badge bg-light text-dark border" style={{ fontSize: 'clamp(12px, 3vw, 13px)' }}>{language}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'template1':
        return <Template1 />;
      case 'template2':
        return <Template2 />;
      case 'template3':
        return <Template3 />;
      default:
        return <Template2 />;
    }
  };

  return (
    <>
      {/* Responsive Navbar - full width, sticky */}
      <nav className="navbar navbar-expand-md shadow-sm bg-white py-1 px-0 w-100 position-sticky top-0 border-bottom" style={{ zIndex: 1050 }}>
        <div className="w-100 d-flex align-items-center px-2 px-md-4">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '32px' }} />
          <div className="ms-auto">
            <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
              <FaHome className="me-1" />
              <span className="d-none d-sm-inline">Dashboard</span>
              <span className="d-inline d-sm-none">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4" style={{ minHeight: '50px', width: '100%' }}>
        {/* Template Selection */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 bg-light rounded shadow-sm">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <span className="badge bg-warning text-dark me-3 px-3 py-2">
                <i className="bi bi-star-fill me-1"></i>
                Premium Feature
              </span>
              <Link to="/update-profile" className="btn btn-dark">
                <i className="bi bi-pencil-square me-2"></i>Edit Profile Data
              </Link>
            </div>
            <div className="btn-group shadow">
              <button
                className={`btn ${selectedTemplate === 'template1' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setSelectedTemplate('template1')}
              >
                <i className="bi bi-person-badge me-2"></i>Professional
              </button>
              <button
                className={`btn ${selectedTemplate === 'template2' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setSelectedTemplate('template2')}
              >
                <i className="bi bi-file-earmark-break me-2"></i>Modern
              </button>
              <button
                className={`btn ${selectedTemplate === 'template3' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setSelectedTemplate('template3')}
              >
                <i className="bi bi-file-earmark me-2"></i>Minimalist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="row justify-content-center">
        <div className="col">{renderTemplate()}</div>
      </div>

      {/* Download Button */}
      <div className="row mt-4">
        <div className="col">
          <div className="d-flex justify-content-center p-3 bg-light rounded shadow-sm">
            <button onClick={downloadPDF} className="btn btn-dark">
              <i className="bi bi-file-earmark-pdf me-2"></i>Download PDF
            </button>
          </div>
        </div>
        </div>
        <style>{`
          /* Mobile tweaks for Professional template */
          @media (max-width: 576px) {
            .resume-professional {
              padding-left: 8px;
              padding-right: 8px;
            }
            .resume-professional .rp-overlay {
              width: 0 !important; /* hide decorative left overlay to avoid overlap on small screens */
              border-right: 0 !important;
            }
            .resume-professional .rounded-circle.mx-auto {
              width: 80px !important;
              height: 80px !important;
            }
            .resume-professional .mb-4 { margin-bottom: 1rem !important; }
            .resume-professional .pb-2 { padding-bottom: .5rem !important; }
          }

          /* Mobile tweaks for Modern template */
          @media (max-width: 576px) {
            .resume-modern {
              padding-left: 8px;
              padding-right: 8px;
            }
            .resume-modern .rm-overlay {
              width: 0 !important; /* hide decorative left overlay on small screens */
              border-right: 0 !important;
            }
            .resume-modern .badge { font-size: 12px !important; }
            .resume-modern .mb-4 { margin-bottom: 1rem !important; }
            .resume-modern .pb-2 { padding-bottom: .5rem !important; }
          }
        `}</style>
      </div>
    </>
  );
};

export default GenerateResume;