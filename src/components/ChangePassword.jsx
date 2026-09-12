import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { requireLogin } from '../utils/requireLogin';
import { BiKey, BiShow, BiHide } from 'react-icons/bi';
import API from '../api';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      const response = await API.put(
        `/api/auth/change-password/${user.id}`,
        {
          currentPassword,
          newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(response.data.message || 'Password updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message || 'Failed to update password. Try again.'
      );
    }
  };


  return (
    <div className="bg-light" style={{ minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg shadow-sm">
        <div className="container">
          <img
            src="/logo.jpeg"
            alt="Company Logo"
            style={{ height: '35px', marginRight: '10px' }}
          />

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
          </button>

          <div className="d-flex">
            <button onClick={() => navigate(-1)} className="btn btn-outline-dark">
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
          </div>
        </div>
      </nav>

      <div className="container d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="card p-4 shadow-sm rounded-4 border-0" style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
              <BiKey size={28} className="text-primary" style={{ transform: 'translateY(2px)' }} />
            </div>
            <h4 className="fw-bold text-dark mb-1">Change Password</h4>
            <p className="text-muted small mb-0">Ensure your new password is strong & secure.</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            {/* Current Password */}
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label small fw-semibold text-muted">Current Password</label>
              <div className="input-group rounded" style={{ boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control border-end-0"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    padding: '12px 16px',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {showCurrentPassword ? <BiHide /> : <BiShow />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label small fw-semibold text-muted">New Password</label>
              <div className="input-group rounded" style={{ boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control border-end-0"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    padding: '12px 16px',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {showNewPassword ? <BiHide /> : <BiShow />}
                </button>
              </div>
              <div className="form-text text-end small mt-1">
                Minimum 6 characters with numbers & symbols
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label small fw-semibold text-muted">Confirm New Password</label>
              <div className="input-group rounded" style={{ boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control border-end-0"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    padding: '12px 16px',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {showConfirmPassword ? <BiHide /> : <BiShow />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary py-2 fw-semibold"
                style={{
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  transform: 'translateY(0)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Change Password
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary py-2"
                onClick={() => navigate('/profile')}
                style={{
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  transform: 'translateY(0)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;