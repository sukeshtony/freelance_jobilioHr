import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API from '../../../api';

function CandidateRegister() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    role: 'Candidate',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const existingRole = params.get('existingRole');
    if (errorParam === 'email_exists_in_other_role') {
      setError(`Email already exists for role ${existingRole || ''}. Please sign in with that role or use a different email.`);
    }
  }, [location.search]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    if (!form.agreeToTerms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Register the user
      await API.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        role: 'Candidate'
      });

      // Login the user after registration
      const loginRes = await API.post('/api/auth/login', {
        email: form.email,
        password: form.password,
        role: 'Candidate'
      });

      if (loginRes.data && loginRes.data.token) {
        localStorage.setItem('token', loginRes.data.token);
        localStorage.setItem('role', loginRes.data.user?.role || 'Candidate');
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
        localStorage.setItem("username", loginRes.data.user.username);
        localStorage.setItem("userId", loginRes.data.user.id);
        navigate('/dashboard/candidate');
      } else {
        setError('Login failed after registration.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed'
      );
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API.defaults.baseURL}/api/auth/google/register/Candidate`;
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: '#f4f8fb' }}>
      {/* Header */}
      <header className="d-flex align-items-center justify-content-between px-4 py-3 shadow-sm bg-white" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="d-flex align-items-center">
          <img src="/logo.jpeg" alt="Logo" style={{ height: 40, marginRight: 12 }} />
        </div>
        <nav>
          <Link to="/" className="btn btn-link text-success fw-bold">Home</Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card shadow-lg my-5 p-0" style={{ maxWidth: 900, width: '100%', borderRadius: '1.5rem', overflow: 'hidden' }}>
          <div className="row g-0">
            {/* Form */}
            <div className="col-md-6 p-5 d-flex flex-column justify-content-center bg-white">
              <h2 className="fw-bold mb-3 text-success text-center">Candidate Register</h2>
              <p className="text-muted mb-4 text-center">Create your profile to access exclusive job opportunities.</p>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    required
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    required
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      name="password"
                      required
                      placeholder="Create a password"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      name="confirmPassword"
                      required
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="agreeToTerms" 
                      name="agreeToTerms"
                      checked={form.agreeToTerms}
                      onChange={handleChange}
                      required
                    />
                    <label className="form-check-label small" htmlFor="agreeToTerms">
                      I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-decoration-none">Terms & Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-decoration-none">Privacy Policy</a>
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-success w-100 mb-3">Register</button>
                
                {/* Divider */}
                <div className="text-center my-3">
                  <span className="bg-white px-3 text-muted">or</span>
                </div>
                
                {/* Google OAuth Button */}
                <button 
                  type="button" 
                  className="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>
              <div className="text-center">
                <small>
                  Already have an account? <Link to="/candidate/login">Login here</Link>
                </small>
              </div>
            </div>

            {/* Right image */}
            <div className="col-md-6 d-none d-md-block">
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80"
                alt="Career journey"
                className="img-fluid h-100"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
        <div>© {new Date().getFullYear()} JobilioHR. All rights reserved.Powered by Rokoso Technology Service Pvt Ltd.</div>
      </footer>
    </div>
  );
}

export default CandidateRegister;