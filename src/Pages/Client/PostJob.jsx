import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Card, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Briefcase } from 'react-bootstrap-icons';
import { FaHome } from 'react-icons/fa';
import API from '../../api';

const PostJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // New structured fields
    position: '',
    band: '',
    qualification: '',
    essentialHiringSkills: '', // comma separated
    responsibility: '',
    shift: '',
    role: '',
    industryType: '',
    department: '',
    employmentType: '',
    roleCategory: '',
    education: '',
    keySkills: '', // comma separated
    aboutCompany: '',
    // Legacy/common fields
    jobTitle: '',
    jobType: '',
    location: '',
    salary: '',
    experienceLevel: 'Any',
    description: '',
    requirements: '',
    companyName: '',
    applicationDeadline: '',
    vacancies: 1,
    isFeatured: false
    ,
    // External link toggle + url
    isExternalLink: false,
    externalLink: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', message: '' });

    try {
      // If external link toggle is on, ensure a URL is provided
      if (formData.isExternalLink && !formData.externalLink?.trim()) {
        setSubmitMessage({ type: 'danger', message: 'Please provide the external application link or turn off the toggle.' });
        setIsSubmitting(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('token');
        setSubmitMessage({
          type: 'danger',
          message: 'Please login to post a job'
        });
        setIsSubmitting(false);
        return;
      }

      // ✅ Post using custom API instance
      const response = await API.post('/api/jobs', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSubmitMessage({
        type: 'success',
        message: 'Congratulations! Your job posted successfully.'
      });
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);

      // Clear form after successful submission
      setFormData({
        position: '',
        band: '',
        qualification: '',
        essentialHiringSkills: '',
        responsibility: '',
        shift: '',
        role: '',
        industryType: '',
        department: '',
        employmentType: '',
        roleCategory: '',
        education: '',
        keySkills: '',
        aboutCompany: '',
        jobTitle: '',
        jobType: '',
        location: '',
        salary: '',
        experienceLevel: 'Any',
        description: '',
        requirements: '',
        companyName: '',
        applicationDeadline: '',
        vacancies: 1,
        isFeatured: false,
        isExternalLink: false,
        externalLink: ''
      });
    } catch (error) {
      console.error('Error posting job:', error);

      const errorMessage =
        error.response?.data?.message ||
        (error.message === 'No authentication token found'
          ? 'Please login to post a job'
          : 'Network error. Please try again.');

      setSubmitMessage({
        type: 'danger',
        message: errorMessage
      });
      setShowSuccessPopup(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      

      <h4 className="mb-4">Post a New Job</h4>
      
      {submitMessage.message && submitMessage.type === 'danger' && (
        <Alert variant="danger" className="mb-4">
          {submitMessage.message}
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Body className="position-relative">
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              {/* Core identity */}
              <Col md={6}>
                <Form.Group controlId="position">
                  <Form.Label>Position *</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer"
                    required
                  />
                </Form.Group>
              </Col>

              {/* Naukri-like extra descriptors */}
              <Col md={6}>
                <Form.Group controlId="band">
                  <Form.Label>Band</Form.Label>
                  <Form.Control name="band" value={formData.band} onChange={handleChange} placeholder="e.g. Band 5" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="qualification">
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. B.Tech, MBA" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="essentialHiringSkills">
                  <Form.Label>Essential Hiring Skills</Form.Label>
                  <Form.Control name="essentialHiringSkills" value={formData.essentialHiringSkills} onChange={handleChange} placeholder="Comma separated (e.g. React, Node)" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="keySkills">
                  <Form.Label>Key Skills</Form.Label>
                  <Form.Control name="keySkills" value={formData.keySkills} onChange={handleChange} placeholder="Comma separated" />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group controlId="responsibility">
                  <Form.Label>Responsibilities</Form.Label>
                  <Form.Control as="textarea" rows={3} name="responsibility" value={formData.responsibility} onChange={handleChange} placeholder="Role responsibilities" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="shift">
                  <Form.Label>Shift</Form.Label>
                  <Form.Control name="shift" value={formData.shift} onChange={handleChange} placeholder="e.g. Day, Night, Rotational" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="role">
                  <Form.Label>Role</Form.Label>
                  <Form.Control name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Developer" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="industryType">
                  <Form.Label>Industry Type</Form.Label>
                  <Form.Control name="industryType" value={formData.industryType} onChange={handleChange} placeholder="e.g. IT Services" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="department">
                  <Form.Label>Department</Form.Label>
                  <Form.Control name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Engineering" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="employmentType">
                  <Form.Label>Employment Type</Form.Label>
                  <Form.Control name="employmentType" value={formData.employmentType} onChange={handleChange} placeholder="e.g. Permanent" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="roleCategory">
                  <Form.Label>Role Category</Form.Label>
                  <Form.Control name="roleCategory" value={formData.roleCategory} onChange={handleChange} placeholder="e.g. Software Development" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="education">
                  <Form.Label>Education</Form.Label>
                  <Form.Control name="education" value={formData.education} onChange={handleChange} placeholder="e.g. Graduate" />
                </Form.Group>
              </Col>

              {/* Common basics */}
              <Col md={6}>
                <Form.Group controlId="jobTitle">
                  <Form.Label>Job Title *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g. Senior React Developer" 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="jobType">
                  <Form.Label>Job Type *</Form.Label>
                  <Form.Select 
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select job type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Remote">Remote</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="location">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. New York, NY or Remote" 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="salary">
                  <Form.Label>Salary Range</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. $90,000 - $120,000" 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="experience">
                  <Form.Label>Experience Level</Form.Label>
                  <Form.Select 
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                  >
                    <option value="Any">Any</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="description">
                  <Form.Label>Job Description *</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={6} 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required 
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="requirements">
                  <Form.Label>Requirements *</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    required 
                  />
                </Form.Group>
              </Col>
              {showSuccessPopup && submitMessage.type === 'success' && (
                <Col xs={12}>
                  <div
                    className="w-100 text-center px-4 py-2 rounded shadow"
                    style={{ backgroundColor: '#ffe0ef', border: '1px solid #ffb3cf', color: '#a83e6a' }}
                    role="status"
                    aria-live="polite"
                  >
                    {submitMessage.message}
                  </div>
                </Col>
              )}
              <Col md={6}>
                <Form.Group controlId="companyName">
                  <Form.Label>Company Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter your company name" 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="applicationDeadline">
                  <Form.Label>Application Deadline</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="vacancies">
                  <Form.Label>Vacancies</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="vacancies"
                    value={formData.vacancies}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="isFeatured">
                  <Form.Check 
                    type="checkbox" 
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    label="Feature this job (will appear prominently)"
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="aboutCompany">
                  <Form.Label>About Company</Form.Label>
                  <Form.Control as="textarea" rows={3} name="aboutCompany" value={formData.aboutCompany} onChange={handleChange} placeholder="Tell candidates about your company" />
                </Form.Group>
              </Col>
                            {/* External link toggle + input */}
              <Col md={6} className="d-flex align-items-center">
                <Form.Group controlId="isExternalLink" className="mb-0 w-100">
                  <Form.Check
                    type="switch"
                    name="isExternalLink"
                    id="isExternalLink"
                    label="Accept applications via external link"
                    checked={formData.isExternalLink}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>

              {formData.isExternalLink && (
                <Col xs={12}>
                  <Form.Group controlId="externalLink">
                    <Form.Label>External Application Link *</Form.Label>
                    <Form.Control
                      type="url"
                      name="externalLink"
                      value={formData.externalLink}
                      onChange={handleChange}
                      placeholder="https://apply.example.com/job/123"
                      required
                    />
                    <Form.Text className="text-muted">Provide a full URL where candidates can apply.</Form.Text>
                  </Form.Group>
                </Col>
              )}
              <Col xs={12} className="text-end">
                <Button 
                  variant="primary" 
                  type="submit"
                  className="me-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Briefcase className="me-2" /> Post Job
                    </>
                  )}
                </Button>
                <Button variant="outline-secondary" type="button">Save Draft</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PostJob;