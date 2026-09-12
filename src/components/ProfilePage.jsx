import { useEffect, useState } from 'react';
import { requireLogin } from '../utils/requireLogin';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { BiArrowBack, BiKey, BiUser } from 'react-icons/bi';
import API from '../api';
import { API_BASE_URL } from '../api';


const ProfilePage = () => {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);
  const [profile, setProfile] = useState({
    username: '',
    mobile: '',
    email: '',
    profileImage: ''
  });
  const [mobileError, setMobileError] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await API.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Handle mobile number - remove +91 prefix if present
        let mobileNumber = res.data.user.mobile || '';
        if (mobileNumber.startsWith('+91')) {
          mobileNumber = mobileNumber.substring(3);
        }
        
        setProfile({
          username: res.data.user.username || '',
          email: res.data.user.email || '',
          mobile: mobileNumber,
          profileImage: res.data.user.profileImage || ''
        });

        setUserId(res.data.user._id);

        // Fetch profile avatar from draft first, then fall back to final
        try {
          const draft = await API.get('/api/profile/draft', { headers: { Authorization: `Bearer ${token}` } });
          if (draft?.data?.avatarUrl) {
            setProfile(prev => ({ ...prev, profileImage: draft.data.avatarUrl }));
            return;
          }
        } catch (_) {
          // ignore and try final
        }
        try {
          const finalRes = await API.get('/api/profile/final', { headers: { Authorization: `Bearer ${token}` } });
          if (finalRes?.data?.avatarUrl) {
            setProfile(prev => ({ ...prev, profileImage: finalRes.data.avatarUrl }));
          } else if (finalRes?.data?.profile?.avatarUrl) {
            setProfile(prev => ({ ...prev, profileImage: finalRes.data.profile.avatarUrl }));
          }
        } catch (_) {
          // no profile yet; keep initials avatar
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mobile') {
      // Accept only digits and limit to exactly 10 digits while typing
      const cleaned = String(value || '').replace(/\D/g, '').slice(0, 10);
      setProfile((prev) => ({ ...prev, [name]: cleaned }));
      setMobileError('');
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNavigateToPassword = () => {
    navigate('/change-password');
  };

  const handleSave = async () => {
    // Validate mobile number
    if (profile.mobile && profile.mobile.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      return;
    }
    
    if (profile.mobile && !/^[6-9]\d{9}$/.test(profile.mobile)) {
      setMobileError('Mobile number must start with 6, 7, 8, or 9');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await API.put(
        `/api/auth/update-profile/${userId}`,
        {
          username: profile.username,
          mobile: profile.mobile ? `+91${profile.mobile}` : profile.mobile
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    }
  };

  return (
    <div className="bg-light" style={{ minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg shadow-sm">
        <div className="container">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px', marginRight: '10px' }} />
          <button onClick={() => navigate(-1)} className="btn btn-outline-dark">
            Back
          </button>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="card-header bg-white py-3 border-bottom">
                <h4 className="mb-0 d-flex align-items-center">
                  <BiUser className="me-2 text-primary" />
                  Profile Settings
                </h4>
              </div>

              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-4 text-center mb-4 mb-md-0">
                    <div className="position-relative mb-3">
                      {profile.profileImage ? (
                        <img
                          src={`${API_BASE_URL}${profile.profileImage}`} alt="Profile"
                          className="border shadow-sm"
                          style={{ 
                            width: 'clamp(100px, 25vw, 140px)', 
                            height: 'clamp(100px, 25vw, 140px)', 
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '3px solid #fff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        />
                      ) : (
                        <div
                          className="bg-primary bg-opacity-10 d-flex justify-content-center align-items-center text-primary mx-auto"
                          style={{
                            width: 'clamp(100px, 25vw, 140px)',
                            height: 'clamp(100px, 25vw, 140px)',
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            border: '2px dashed rgba(13, 110, 253, 0.3)',
                            borderRadius: '50%'
                          }}
                        >
                          {profile.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-semibold">Username</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        id="username"
                        name="username"
                        value={profile.username}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        id="email"
                        name="email"
                        value={profile.email}
                        disabled
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="mobile" className="form-label fw-semibold">Mobile Number</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-end-0" style={{ borderColor: '#dee2e6' }}>
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="\d*"
                          className={`form-control border-start-0 ${mobileError ? 'is-invalid' : ''}`}
                          id="mobile"
                          name="mobile"
                          value={profile.mobile}
                          onChange={handleInputChange}
                          placeholder="Enter 10-digit mobile number"
                          maxLength="10"
                        />
                      </div>
                      {mobileError && (
                        <div className="invalid-feedback d-block">
                          {mobileError}
                        </div>
                      )}
                      <small className="text-muted">
                        Enter 10-digit mobile number (e.g., 9876543210)
                      </small>
                    </div>

                    <div className="d-flex justify-content-between align-items-center border-top pt-3">
                      <button className="btn btn-outline-primary d-flex align-items-center" onClick={handleNavigateToPassword}>
                        <BiKey className="me-2" />
                        Change Password
                      </button>
                      <button className="btn btn-primary px-4" onClick={handleSave}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          box-shadow: 0 2px 15px rgba(0,0,0,0.1);
          padding: 0.8rem 0;
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1) !important;
        }
        .form-control:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
        }
        .btn-outline-primary:hover {
          background: rgba(13, 110, 253, 0.05);
        }
        
        /* Responsive Profile Picture Styles */
        @media (max-width: 768px) {
          .card-body {
            padding: 1.5rem !important;
          }
          
          .col-md-4 {
            margin-bottom: 2rem !important;
          }
          
          .d-flex.justify-content-between {
            flex-direction: column !important;
            gap: 1rem;
          }
          
          .d-flex.justify-content-between .btn {
            width: 100%;
          }
        }
        
        @media (max-width: 576px) {
          .card-body {
            padding: 1rem !important;
          }
          
          .col-md-4 {
            margin-bottom: 1.5rem !important;
          }
          
          .form-control-lg {
            font-size: 1rem !important;
            padding: 0.75rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .card-body {
            padding: 0.75rem !important;
          }
          
          .py-5 {
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;