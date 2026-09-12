import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Button, Modal, Table, Form, Alert, Spinner, InputGroup, Card } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import { BsSearch, BsFilter } from 'react-icons/bs';

const FeedbackerManagement = () => {
  const [feedbackers, setFeedbackers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentFeedbacker, setCurrentFeedbacker] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  useEffect(() => {
    fetchFeedbackers();
  }, []);

  const fetchFeedbackers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/feedbackers');
      const sortedFeedbackers = Array.isArray(response.data.data) 
      ? response.data.data.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      : [];
    setFeedbackers(sortedFeedbackers);
    } catch (error) {
      showAlert('Failed to fetch feedbackers', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbackers = Array.isArray(feedbackers)
    ? feedbackers.filter(feedbacker => {
      const matchesSearch = searchTerm ?
        feedbacker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedbacker.email.toLowerCase().includes(searchTerm.toLowerCase()) : true;

      const matchesName = nameFilter ?
        feedbacker.name.toLowerCase().includes(nameFilter.toLowerCase()) : true;

      const matchesEmail = emailFilter ?
        feedbacker.email.toLowerCase().includes(emailFilter.toLowerCase()) : true;

      return matchesSearch && matchesName && matchesEmail;
    })
    : [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFeedbacker(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!currentFeedbacker.name || !currentFeedbacker.email) {
      showAlert('Name and email are required', 'danger');
      return false;
    }

    if (!isEditMode && (!currentFeedbacker.password || currentFeedbacker.password !== currentFeedbacker.confirmPassword)) {
      showAlert('Passwords do not match or are empty', 'danger');
      return false;
    }

    if (!isEditMode && currentFeedbacker.password.length < 6) {
      showAlert('Password must be at least 6 characters', 'danger');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        name: currentFeedbacker.name,
        email: currentFeedbacker.email,
        ...(currentFeedbacker.password && { password: currentFeedbacker.password })
      };

      if (isEditMode) {
        await API.put(`/api/feedbackers/${currentFeedbacker._id}`, payload);
        showAlert('Feedbacker updated successfully', 'success');
      } else {
        await API.post('/api/feedbackers', payload);
        showAlert('Feedbacker created successfully', 'success');
      }
      fetchFeedbackers();
      handleCloseModal();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Operation failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await API.delete(`/api/feedbackers/${currentFeedbacker._id}`);
      showAlert('Feedbacker deleted successfully', 'success');
      fetchFeedbackers();
      setShowDeleteModal(false);
    } catch (error) {
      showAlert('Failed to delete feedbacker', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feedbacker) => {
    setCurrentFeedbacker({
      ...feedbacker,
      password: '',
      confirmPassword: ''
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setCurrentFeedbacker({
      id: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{
            fontWeight: '600',
            color: '#1a1a1a',
            fontSize: '28px',
            marginBottom: '4px'
          }}>Feedbacker Management</h2>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '0'
          }}>Manage all feedback providers in your system</p>
        </div>
        <Button
          variant="primary"
          onClick={handleAddNew}
          style={{
            fontWeight: '500',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            border: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          }}
        >
          <FiUserPlus size={18} /> Add New Feedbacker
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible
          style={{
            borderRadius: '8px',
            marginBottom: '24px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            border: 'none'
          }}
        >
          {alert.message}
        </Alert>
      )}

      <Card style={{
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        borderRadius: '12px'
      }}>
        <Card.Body style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ flexGrow: 1, minWidth: '300px' }}>
              <InputGroup style={{ height: '40px' }}>
                <InputGroup.Text style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRight: 'none',
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px'
                }}>
                  <BsSearch color="#6b7280" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search feedbackers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderLeft: 'none',
                    background: '#f9fafb',
                    height: '40px',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                />
              </InputGroup>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <InputGroup style={{ height: '40px', minWidth: '200px' }}>
                <InputGroup.Text style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRight: 'none',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <BsFilter style={{ marginRight: '6px' }} /> Name
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Filter by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderLeft: 'none',
                    background: '#f9fafb',
                    height: '40px',
                    fontSize: '14px'
                  }}
                />
              </InputGroup>

              <InputGroup style={{ height: '40px', minWidth: '200px' }}>
                <InputGroup.Text style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRight: 'none',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  <BsFilter style={{ marginRight: '6px' }} /> Email
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Filter by email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderLeft: 'none',
                    background: '#f9fafb',
                    height: '40px',
                    fontSize: '14px'
                  }}
                />
              </InputGroup>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        borderRadius: '12px'
      }}>
        <Card.Body style={{ padding: '0' }}>
          {loading && !showModal && !showDeleteModal ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Spinner animation="border" variant="primary" style={{ width: '48px', height: '48px' }} />
              <p style={{
                marginTop: '16px',
                color: '#4b5563',
                fontSize: '15px',
                fontWeight: '500'
              }}>Loading feedbackers...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table hover style={{
                marginBottom: '0',
                borderCollapse: 'separate',
                borderSpacing: '0'
              }}>
                <thead style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <tr>
                    <th style={{
                      padding: '16px 20px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px',
                      borderTopLeftRadius: '12px'
                    }}>Name</th>
                    <th style={{
                      padding: '16px 20px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>Email</th>
                    <th style={{
                      padding: '16px 20px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>Students Assigned</th>
                    <th style={{
                      padding: '16px 20px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>Feedbacks Given</th>
                    <th style={{
                      padding: '16px 20px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px',
                      textAlign: 'right',
                      borderTopRightRadius: '12px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbackers.length > 0 ? (
                    filteredFeedbackers.map((feedbacker, index) => (
                      <tr key={feedbacker._id} style={{
                        borderBottom: index === filteredFeedbackers.length - 1 ? 'none' : '1px solid #e5e7eb',
                        backgroundColor: '#ffffff'
                      }}>
                        <td style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                              flexShrink: '0'
                            }}>
                              <span style={{
                                color: '#3b82f6',
                                fontWeight: '600',
                                fontSize: '16px'
                              }}>
                                {feedbacker.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h6 style={{
                                marginBottom: '0',
                                fontWeight: '500',
                                color: '#111827'
                              }}>{feedbacker.name}</h6>
                            </div>
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle',
                          color: '#4b5563',
                          fontSize: '14px'
                        }}>{feedbacker.email}</td>
                        <td style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle',
                          color: '#4b5563',
                          fontSize: '14px'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '16px',
                            fontWeight: '500',
                            fontSize: '13px',
                            color: '#374151'
                          }}>
                            {feedbacker.assignedCount || 0} assigned
                          </span>
                        </td>
                        <td style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle',
                          color: '#4b5563',
                          fontSize: '14px'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '16px',
                            fontWeight: '500',
                            fontSize: '13px',
                            color: '#374151'
                          }}>
                            {feedbacker.completedFeedbacks || 0}
                          </span>
                        </td>
                        <td style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle',
                          textAlign: 'right'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px'
                          }}>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit(feedbacker)}
                              style={{
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: '1px solid #e5e7eb',
                                background: 'white'
                              }}
                            >
                              <FiEdit2 size={14} /> Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setCurrentFeedbacker(feedbacker);
                                setShowDeleteModal(true);
                              }}
                              style={{
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: '1px solid #e5e7eb',
                                background: 'white'
                              }}
                            >
                              <FiTrash2 size={14} /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        backgroundColor: '#ffffff',
                        borderBottomLeftRadius: '12px',
                        borderBottomRightRadius: '12px'
                      }}>
                        {searchTerm || nameFilter || emailFilter ? (
                          <div style={{ color: '#6b7280' }}>
                            <p style={{
                              fontSize: '15px',
                              marginBottom: '8px',
                              fontWeight: '500'
                            }}>No feedbackers found matching your criteria</p>
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearchTerm('');
                                setNameFilter('');
                                setEmailFilter('');
                              }}
                              style={{
                                color: '#3b82f6',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                padding: '0'
                              }}
                            >
                              Clear filters
                            </Button>
                          </div>
                        ) : (
                          <div style={{ color: '#6b7280' }}>
                            <p style={{
                              fontSize: '15px',
                              marginBottom: '8px',
                              fontWeight: '500'
                            }}>No feedbackers available</p>
                            <Button
                              variant="primary"
                              onClick={handleAddNew}
                              style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <FiUserPlus size={16} /> Add your first feedbacker
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <Modal.Title style={{
            fontWeight: '600',
            fontSize: '18px',
            color: '#111827'
          }}>
            {isEditMode ? 'Edit Feedbacker' : 'Create New Feedbacker'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#374151'
              }}>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentFeedbacker.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
                style={{
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#374151'
              }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={currentFeedbacker.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                required
                style={{
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#374151'
              }}>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={currentFeedbacker.password}
                  onChange={handleInputChange}
                  placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                  style={{
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0'
                  }}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderLeft: 'none',
                    background: '#f9fafb',
                    padding: '0 12px',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                >
                  {showPassword ? <FiEyeOff color="#6b7280" /> : <FiEye color="#6b7280" />}
                </Button>
              </InputGroup>
              {!isEditMode && (
                <Form.Text className="text-muted" style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  Minimum 6 characters
                </Form.Text>
              )}
            </Form.Group>

            {!isEditMode && (
              <Form.Group className="mb-3">
                <Form.Label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Confirm Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={currentFeedbacker.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    style={{
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      borderTopRightRadius: '0',
                      borderBottomRightRadius: '0'
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderLeft: 'none',
                      background: '#f9fafb',
                      padding: '0 12px',
                      borderTopRightRadius: '8px',
                      borderBottomRightRadius: '8px'
                    }}
                  >
                    {showConfirmPassword ? <FiEyeOff color="#6b7280" /> : <FiEye color="#6b7280" />}
                  </Button>
                </InputGroup>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer style={{
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px'
        }}>
          <Button
            variant="light"
            onClick={handleCloseModal}
            style={{
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #e5e7eb',
              background: 'white'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" style={{ marginRight: '8px' }} />
                Processing...
              </>
            ) : isEditMode ? (
              'Update Feedbacker'
            ) : (
              'Create Feedbacker'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 24px'
        }}>
          <Modal.Title style={{
            fontWeight: '600',
            fontSize: '18px',
            color: '#111827'
          }}>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          <div style={{
            textAlign: 'center',
            padding: '8px'
          }}>
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiTrash2 size={36} style={{ color: '#dc3545' }} />
              </div>
            </div>
            <h5 style={{
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px',
              fontSize: '18px'
            }}>Are you sure?</h5>
            <p style={{
              color: '#6b7280',
              fontSize: '15px',
              lineHeight: '1.5',
              marginBottom: '0'
            }}>
              You are about to delete feedbacker <strong style={{ color: '#111827' }}>{currentFeedbacker.name}</strong>.
              This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px',
          justifyContent: 'center'
        }}>
          <Button
            variant="light"
            onClick={() => setShowDeleteModal(false)}
            style={{
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #e5e7eb',
              background: 'white',
              minWidth: '100px'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
            style={{
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              background: 'linear-gradient(135deg, #dc3545 0%, #b02a37 100%)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              minWidth: '100px'
            }}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" style={{ marginRight: '8px' }} />
                Deleting...
              </>
            ) : (
              'Yes, Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FeedbackerManagement;