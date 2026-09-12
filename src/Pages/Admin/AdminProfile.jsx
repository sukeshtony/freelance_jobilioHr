// components/AdminProfileUpdate.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import { Form, Button, Alert, Spinner, Card, Container, Row, Col } from "react-bootstrap";
import { FaEye, FaEyeSlash, FaSignOutAlt, FaUserEdit, FaShieldAlt } from "react-icons/fa";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }

        const res = await API.get("/api/admin/me", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setFormData((prev) => ({
          ...prev,
          name: res.data.username,
          email: res.data.email
        }));
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 401) {
          setError("Authentication failed. Please login again.");
        } else if (err.response?.status === 404) {
          setError("Admin profile not found. Please contact support.");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error messages when user starts typing
    if (error) setError("");
    if (message) setMessage("");
  };

  const validateForm = () => {
    // Check if new password is provided
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password");
        return false;
      }
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters long");
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New password and confirm password do not match");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email
      };

      // Only include password fields if new password is provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const res = await API.put("/api/admin/update", updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMessage(res.data.message || "Profile updated successfully!");
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (err) {
      console.error("Update error:", err);
      if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (err.response?.status === 404) {
        setError("Admin profile not found. Please contact support.");
      } else {
        setError(err.response?.data?.message || "Update failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
    localStorage.removeItem('name');
    sessionStorage.removeItem('token');
    
    // Redirect to bingus page
    navigate('/bingus');
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaUserEdit className="me-2" />
                <h4 className="mb-0">Update Admin Profile</h4>
              </div>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={handleLogout}
                className="d-flex align-items-center"
              >
                <FaSignOutAlt className="me-1" />
                Logout
              </Button>
            </Card.Header>
            
            <Card.Body className="p-4">
              {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
              {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUserEdit className="me-2" />
                    Name
                  </Form.Label>
                  <Form.Control 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUserEdit className="me-2" />
                    Email
                  </Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </Form.Group>

                <hr className="my-4" />
                
                <div className="mb-3">
                  <h6 className="text-muted">
                    <FaShieldAlt className="me-2" />
                    Change Password (Optional)
                  </h6>
                  <small className="text-muted">Leave blank if you don't want to change your password</small>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control 
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword" 
                      value={formData.currentPassword} 
                      onChange={handleChange}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y pe-3"
                      onClick={() => togglePasswordVisibility('current')}
                      style={{ zIndex: 10, border: 'none', background: 'none', color: '#6c757d' }}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control 
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword" 
                      value={formData.newPassword} 
                      onChange={handleChange}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y pe-3"
                      onClick={() => togglePasswordVisibility('new')}
                      style={{ zIndex: 10, border: 'none', background: 'none', color: '#6c757d' }}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control 
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleChange}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y pe-3"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{ zIndex: 10, border: 'none', background: 'none', color: '#6c757d' }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    variant="primary"
                    size="lg"
                    className="d-flex align-items-center justify-content-center"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaUserEdit className="me-2" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
