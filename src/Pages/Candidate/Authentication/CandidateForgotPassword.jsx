import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CandidateForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email,
        role: 'Candidate'
      });

      setSuccess('Verification code sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/auth/verify-code', {
        email,
        verificationCode,
        role: 'Candidate'
      });

      setSuccess('Code verified successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/reset-password', {
        email,
        verificationCode,
        newPassword,
        role: 'Candidate'
      });

      setSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        window.location.href = '/candidate/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: '#f4f8fb' }}>
      <header className="d-flex align-items-center justify-content-between px-4 py-3 shadow-sm bg-white">
        <div className="d-flex align-items-center">
          <img src="/logo.jpeg" alt="Logo" style={{ height: 40, marginRight: 12 }} />
        </div>
        <nav>
          <Link to="/candidate/login" className="btn btn-link text-success fw-bold">Back to Login</Link>
        </nav>
      </header>

      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card shadow-lg p-0 my-5" style={{ maxWidth: 500, width: '100%', borderRadius: '1.5rem' }}>
          <div className="p-5">
            <h2 className="fw-bold mb-3 text-success text-center">Reset Password</h2>
            
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}

            {step === 1 && (
              <form onSubmit={handleSendVerificationCode}>
                <p className="text-muted mb-4 text-center">
                  Enter your email address and we'll send you a verification code.
                </p>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode}>
                <p className="text-muted mb-4 text-center">
                  Enter the 6-digit verification code sent to your email.
                </p>
                <div className="mb-3">
                  <label className="form-label">Verification Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <div className="text-center mt-3">
                  <button 
                    type="button" 
                    className="btn btn-link"
                    onClick={() => setStep(1)}
                  >
                    Back to Email
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <p className="text-muted mb-4 text-center">
                  Enter your new password.
                </p>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <div className="text-center mt-3">
                  <button 
                    type="button" 
                    className="btn btn-link"
                    onClick={() => setStep(2)}
                  >
                    Back to Verification
                  </button>
                </div>
              </form>
            )}

            <div className="text-center mt-4">
              <small className="text-muted">
                Remember your password? <Link to="/candidate/login">Login here</Link>
              </small>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div>© {new Date().getFullYear()} JobilioHR. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default CandidateForgotPassword;
