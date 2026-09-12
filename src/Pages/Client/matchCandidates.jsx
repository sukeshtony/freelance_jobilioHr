import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Button, Card, Alert, Badge } from 'react-bootstrap';
import { FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaAward, FaCode, FaArrowLeft } from 'react-icons/fa';
import API from '../../api';

const matchCandidates = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/api/profile/by-user/${id}`);
      
      if (!res.data.success) {
        if (res.data.message.includes('not found')) {
          throw new Error(`User ${id} not found in database`);
        }
        throw new Error(res.data.message || 'Failed to load profile');
      }

      setProfile(
        res.data.profile || {
          ...res.data.user,
          isBasic: true
        }
      );

    } catch (err) {
      console.error("Profile load error:", err);
      setError(err.message);

      if (err.message.includes('not found')) {
        navigate('/admin/candidates', {
          state: { error: `Candidate ${id} not found` }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const renderSectionHeader = (title, icon) => (
    <div className="d-flex align-items-center mb-3">
      {React.createElement(icon, { className: "me-2 text-primary" })}
      <h5 className="mb-0 text-primary">{title}</h5>
    </div>
  );

  const renderDetailItem = (label, value, icon) => (
    <div className="d-flex align-items-start mb-2">
      {icon && React.createElement(icon, { className: "me-2 mt-1 text-muted", size: 14 })}
      <div>
        <small className="text-muted d-block">{label}</small>
        <div className="fw-semibold">{value || 'N/A'}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="text-center py-5">
          <Alert variant="danger">
            {error}
            <div className="mt-3">
              <Button variant="outline-primary" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-1" /> Go Back
              </Button>
            </div>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="shadow-sm border-0">
        <Card.Body className="text-center py-5">
          <Alert variant="warning">
            No profile data available for this user
            <div className="mt-3">
              <Button variant="outline-primary" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-1" /> Go Back
              </Button>
            </div>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 overflow-hidden">
      {/* Header Section */}
      <div className="bg-primary bg-opacity-10 p-4">
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex align-items-center">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="rounded-circle me-4"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  border: '4px solid white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div
                className="rounded-circle me-4 d-flex align-items-center justify-content-center"
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  border: '4px solid white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  textTransform: 'uppercase'
                }}
              >
                {profile.name?.[0] || 'U'}
              </div>
            )}

            <div>
              <h2 className="mb-1 fw-bold">{profile.name}</h2>
              <div className="d-flex align-items-center mb-2">
                <Badge bg="primary" className="me-2">
                  {profile.title || 'No Title'}
                </Badge>
                <Badge bg="secondary">
                  {profile.experience || 0} years experience
                </Badge>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="text-decoration-none d-flex align-items-center">
                    <FaEnvelope className="me-1" /> {profile.email}
                  </a>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="text-decoration-none d-flex align-items-center">
                    <FaPhone className="me-1" /> {profile.phone}
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center">
                    <FaLinkedin className="me-1" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline-primary"
            onClick={() => navigate(-1)}
            className="d-flex align-items-center"
          >
            <FaArrowLeft className="me-1" /> Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card.Body className="p-4">
        <div className="row">
          {/* Left Column */}
          <div className="col-lg-6">
            {/* Personal Details */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                {renderSectionHeader('Personal Details', FaMapMarkerAlt)}
                <div className="row">
                  <div className="col-md-6">
                    {renderDetailItem('Date of Birth', profile.dob)}
                    {renderDetailItem('Gender', profile.gender)}
                  </div>
                  <div className="col-md-6">
                    {renderDetailItem('Job Type', profile.jobType)}
                    {renderDetailItem('Work Mode', profile.workMode)}
                  </div>
                </div>
                {renderDetailItem('Address', profile.address)}
                <div className="row">
                  <div className="col-md-6">
                    {renderDetailItem('City', profile.city)}
                    {renderDetailItem('State', profile.state)}
                  </div>
                  <div className="col-md-6">
                    {renderDetailItem('Country', profile.country)}
                    {renderDetailItem('Zip Code', profile.zip)}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    {renderDetailItem('Expected Salary', profile.expectedSalary)}
                  </div>
                  <div className="col-md-6">
                    {renderDetailItem('Notice Period', profile.noticePeriod)}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Skills */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                {renderSectionHeader('Skills', FaCode)}
                {profile.skills?.length ? (
                  <div className="d-flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <Badge key={i} bg="light" text="dark" className="fw-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No skills listed</p>
                )}
              </Card.Body>
            </Card>

            {/* Certifications */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                {renderSectionHeader('Certifications', FaAward)}
                {profile.certifications?.length ? (
                  <ul className="list-unstyled">
                    {profile.certifications.map((cert, i) => (
                      <li key={i} className="mb-2 d-flex">
                        <div className="me-2 text-primary">•</div>
                        <div>{cert}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No certifications listed</p>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Right Column */}
          <div className="col-lg-6">
            {/* Objective */}
            {profile.objective && (
              <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                  {renderSectionHeader('Career Objective', FaBriefcase)}
                  <div className="p-3 bg-light rounded">
                    {profile.objective}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Work Experience */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body>
                {renderSectionHeader('Work Experience', FaBriefcase)}
                {profile.companies?.length ? (
                  <div className="timeline">
                    {profile.companies.map((comp, i) => (
                      <div key={i} className="timeline-item mb-4">
                        <div className="timeline-badge bg-primary"></div>
                        <div className="timeline-content p-3 bg-light rounded">
                          <div className="d-flex justify-content-between">
                            <h6 className="fw-bold mb-1">{comp.position}</h6>
                            <small className="text-muted">
                              {comp.startDate} - {comp.endDate || 'Present'}
                            </small>
                          </div>
                          <p className="mb-1 fw-semibold">{comp.name}</p>
                          {comp.location && (
                            <p className="small text-muted mb-2">
                              <FaMapMarkerAlt className="me-1" /> {comp.location}
                            </p>
                          )}
                          {comp.responsibilities && (
                            <>
                              <p className="small fw-bold mb-1">Responsibilities:</p>
                              <p className="small mb-2">{comp.responsibilities}</p>
                            </>
                          )}
                          {comp.achievements && (
                            <>
                              <p className="small fw-bold mb-1">Achievements:</p>
                              <p className="small">{comp.achievements}</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No work experience listed</p>
                )}
              </Card.Body>
            </Card>

            {/* Education */}
            <Card className="shadow-sm border-0">
              <Card.Body>
                {renderSectionHeader('Education', FaGraduationCap)}
                {profile.education?.length ? (
                  <div className="timeline">
                    {profile.education.map((edu, i) => (
                      <div key={i} className="timeline-item mb-4">
                        <div className="timeline-badge bg-success"></div>
                        <div className="timeline-content p-3 bg-light rounded">
                          <div className="d-flex justify-content-between">
                            <h6 className="fw-bold mb-1">{edu.degree}</h6>
                            <small className="text-muted">
                              {edu.startDate} - {edu.endDate || 'Present'}
                            </small>
                          </div>
                          <p className="mb-1 fw-semibold">{edu.institute}</p>
                          {edu.currentlyStudying && (
                            <Badge bg="info" className="mt-1">
                              Currently Studying
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No education history listed</p>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Card.Body>

      {/* Custom Styles */}
      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        .timeline-item {
          position: relative;
        }
        .timeline-badge {
          position: absolute;
          left: -15px;
          top: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          z-index: 1;
        }
        .timeline-content {
          position: relative;
        }
        .timeline-content:before {
          content: '';
          position: absolute;
          top: 0;
          left: -30px;
          height: 100%;
          width: 2px;
          background: #dee2e6;
        }
        .timeline-item:last-child .timeline-content:before {
          height: 20px;
        }
      `}</style>
    </Card>
  );
};

export default matchCandidates;