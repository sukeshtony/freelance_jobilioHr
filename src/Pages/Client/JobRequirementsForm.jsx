import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Button, 
  Alert, 
  Spinner,
  Row,
  Col
} from 'react-bootstrap';
import API from '../../api';

const JobRequirementsForm = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobType: 'Full-time', // Default job type
    skills: '',
    location: '',
    salaryBudget: '',
    experienceMin: '',
    experienceMax: '',
    applicantsCount: 1, // Default to 1
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const jobTypes = ['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship', 'Freelance'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to submit job requirements.');
        return;
      }

      const response = await API.post('/api/requirements', {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0),
        applicantsCount: parseInt(formData.applicantsCount) || 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Job requirement posted successfully!');
      setFormData({
        jobTitle: '',
        jobType: 'Full-time',
        skills: '',
        location: '',
        salaryBudget: '',
        experienceMin: '',
        experienceMax: '',
        applicantsCount: 1,
        notes: ''
      });
      
      setTimeout(() => {
        onSuccess();
        onHide();
      }, 2000);
    } catch (err) {
      console.error('Error posting requirement:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.join(', ') || 
                          'Failed to post requirement. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      jobTitle: '',
      jobType: 'Full-time',
      skills: '',
      location: '',
      salaryBudget: '',
      experienceMin: '',
      experienceMax: '',
      applicantsCount: 1,
      notes: ''
    });
    setError('');
    setSuccess('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>New Job Requirement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Job Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior React Developer"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Job Type *</Form.Label>
                <Form.Select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleInputChange}
                  required
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Skills Required *</Form.Label>
                <Form.Control
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g. React, Node.js, MongoDB"
                  required
                />
                <Form.Text className="text-muted">
                  Separate skills with commas
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Location *</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Mumbai, Remote"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Salary Budget</Form.Label>
                <Form.Control
                  type="text"
                  name="salaryBudget"
                  value={formData.salaryBudget}
                  onChange={handleInputChange}
                  placeholder="e.g. ₹10,00,000 - ₹15,00,000"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Experience Range (Years) *</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    name="experienceMin"
                    value={formData.experienceMin}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    required
                  />
                  <div className="d-flex align-items-center">to</div>
                  <Form.Control
                    type="number"
                    name="experienceMax"
                    value={formData.experienceMax}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    required
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Applicants Needed</Form.Label>
                <Form.Control
                  type="number"
                  name="applicantsCount"
                  value={formData.applicantsCount}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Number of positions"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional requirements or notes..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
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
            'Post Requirement'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default JobRequirementsForm;