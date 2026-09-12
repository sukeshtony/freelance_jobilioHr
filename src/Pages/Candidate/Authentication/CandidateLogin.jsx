import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import API from '../../../api';

function CandidateLogin() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const handleGoogleSignIn = () => {
    window.location.href = `${API.defaults.baseURL}/api/auth/google/login/Candidate`;
  };

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

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      const res = await API.post('/api/auth/login', {
        email: form.email,
        password: form.password,
        role: 'Candidate'
      });

      // Store token and user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('username', res.data.user.username);
      localStorage.setItem('userId', res.data.user.id);

      // If "Remember Me" is checked, store credentials in localStorage
      if (form.rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
        localStorage.setItem('rememberedPassword', form.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      // Redirect to the return path if provided, otherwise to dashboard
      const returnPath = location.state?.from;
      if (returnPath) {
        navigate(returnPath, { replace: true });
      } else if (res.data.user.isPremium) {
        navigate('/career-dashboard');
      } else {
        navigate('/dashboard/candidate');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };


  // Check for remembered credentials on component mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    if (rememberedEmail && rememberedPassword) {
      setForm({
        email: rememberedEmail,
        password: rememberedPassword,
        rememberMe: true
      });
    }
    const urlError = searchParams.get('error');
    if (urlError === 'user_not_found') {
      setError('User is not registered');
    } else if (urlError === 'wrong_role') {
      const actual = searchParams.get('actual');
      setError(actual ? `This email is registered as ${actual}. Please use the appropriate login.` : 'Wrong role for this account');
    }
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: '#f4f8fb' }}>
      {/* Header */}
      <header
        className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3 shadow-sm bg-white"
        style={{ position: 'sticky', top: 0, zIndex: 1000 }}
      >
        <div className="d-flex align-items-center">
          <img src="/logo.jpeg" alt="Logo" style={{ height: 35, marginRight: 12 }} className="responsive-img" />
        </div>
        <nav>
          <Link to="/" className="btn btn-link text-success fw-bold">Home</Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center p-3">
        <div
          className="card shadow-lg my-3 my-md-5 p-0 form-responsive"
          style={{ maxWidth: 900, width: '100%', borderRadius: '1.5rem', overflow: 'hidden' }}
        >
          <div className="row g-0">
            {/* Form Side */}
            <div className="col-md-6 p-5 d-flex flex-column justify-content-center bg-white">
              <h2 className="fw-bold mb-3 text-success text-center">Candidate Login</h2>
              <p className="text-muted mb-4 text-center">
                Log in to apply for jobs, access tests, and track your progress.
              </p>
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
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      name="password"
                      required
                      placeholder="Enter your password"
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
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="rememberMe"
                        name="rememberMe"
                        checked={form.rememberMe}
                        onChange={handleChange}
                      />
                      <label className="form-check-label small" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <Link to="/candidate/forgot-password" className="text-decoration-none small">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <button type="submit" className="btn btn-success w-100 mb-3">
                  Login
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M21.35 11.1H12v2.9h5.3c-.23 1.5-1.8 4.3-5.3 4.3-3.19 0-5.8-2.64-5.8-5.9s2.61-5.9 5.8-5.9c1.82 0 3.04.77 3.74 1.44l2.55-2.46C16.5 3.78 14.42 2.9 12 2.9 6.94 2.9 2.9 6.94 2.9 12s4.04 9.1 9.1 9.1c5.24 0 8.67-3.67 8.67-8.84 0-.59-.06-1.04-.15-1.16z" />
                    <path fill="#34A853" d="M3.53 7.15l2.39 1.75C6.87 7.2 8.8 6 12 6c1.82 0 3.04.77 3.74 1.44l2.55-2.46C16.5 3.78 14.42 2.9 12 2.9 8.24 2.9 5.1 5.08 3.53 7.15z" />
                    <path fill="#FBBC05" d="M12 21.1c3.48 0 6.39-2.3 7.3-5.8l-2.95-2.3c-.79 2.4-3 3.9-5.35 3.9-2.61 0-4.82-1.76-5.6-4.12l-2.9 2.24C3.96 18.84 7.7 21.1 12 21.1z" />
                    <path fill="#EA4335" d="M21.35 11.1H12v2.9h5.3c-.37 2.4-2.23 3.9-5.3 3.9-3.19 0-5.8-2.64-5.8-5.9 0-1.09.31-2.11.85-2.98l-2.9-2.24C3.36 8.1 2.9 9.99 2.9 12c0 5.06 4.04 9.1 9.1 9.1 5.24 0 8.67-3.67 8.67-8.84 0-.59-.06-1.04-.15-1.16z" />
                  </svg>
                  Continue with Google
                </button>
              </form>
              <div className="text-center">
                <small>
                  Don't have an account? <Link to="/candidate/register">Register here</Link>
                </small>
              </div>
            </div>

            {/* Image Side */}
            <div className="col-md-6 d-none d-md-block">
              <img
                src="https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=900&q=80"
                alt="Login Visual"
                className="img-fluid h-100"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="bg-dark text-white text-center py-3 mt-auto"
        style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}
      >
        <div>© {new Date().getFullYear()} JobilioHR. All rights reserved.Powered by Rokoso Technology Service Pvt Ltd.</div>
      </footer>
    </div>
  );
}

export default CandidateLogin;