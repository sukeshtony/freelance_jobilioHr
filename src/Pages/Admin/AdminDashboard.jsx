import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
    localStorage.removeItem('name');
    navigate('/Bingus');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-nav-toggle d-md-none position-fixed top-0 start-0 m-3 z-3"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ zIndex: 1001 }}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Sidebar (fixed) */}
      <div
        className={`p-3 sidebar-responsive ${sidebarOpen ? 'active' : ''}`}
        style={{
          width: '220px',
          position: 'fixed',
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
      >
        <div className="d-flex flex-column h-100">
          <div className="mb-4 text-center">
            <img
              src="/logo.jpeg"
              alt="Company Logo"
              style={{
                height: "50px",
                borderRadius: '50%',
                border: '2px solid #e9ecef',
                padding: '2px',
                backgroundColor: 'white'
              }}
            />
            <h5 className="mt-3 mb-0" style={{ color: '#343a40', fontWeight: '600' }}>Admin Panel</h5>
          </div>

          <ul className="nav flex-column flex-grow-1">
            <li className="nav-item mb-1">
              <Link
                to="/admin/candidates"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/candidates') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-users mr-2"></i>
                Candidates
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="clients"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/clients') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-building mr-2"></i>
                Clients
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/contactus"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/contactus') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-envelope mr-2"></i>
                Contact Us
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/interviews"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/interviews') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-calendar-check mr-2"></i>
                Scheduled Interviews
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/interviewers"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/interviewers') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-user-tie mr-2"></i>
                Interviewers
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/Instructors"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/Instructors') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-book mr-2"></i>
                Instructors
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/courses"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/courses') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-book mr-2"></i>
                Courses
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/exams"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/exams') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-clipboard-list mr-2"></i>
                Scheduled Exams
              </Link>
            </li>
            
            <li className="nav-item mb-1">
              <Link
                to="/admin/Conducted-Candidates"
                className={`nav-link py-2 px-3 rounded ${location.pathname === '/admin/Conducted-Candidates' ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-briefcase mr-2"></i>
                Feedback Pending
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/Feedback_Providers"
                className={`nav-link py-2 px-3 rounded ${location.pathname === '/admin/Feedback_Providers' ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-briefcase mr-2"></i>
                Feedback Providers
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/jobs"
                className={`nav-link py-2 px-3 rounded ${location.pathname === '/admin/jobs' ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-briefcase mr-2"></i>
                All Jobs
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/requirements"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/requirements') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-file-alt mr-2"></i>
                 Jobs Requirements
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/credit-requests"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/credit-requests') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-credit-card mr-2"></i>
                Credit Requests
              </Link>
            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/user-credits"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/user-credits') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-coins mr-2"></i>
                User Credits
              </Link>

            </li>
            <li className="nav-item mb-1">
              <Link
                to="/admin/profile"
                className={`nav-link py-2 px-3 rounded ${location.pathname.includes('/profile') ? 'active-nav-link' : 'nav-link-hover'}`}
              >
                <i className="fas fa-coins mr-2"></i>
                Update Profile
              </Link>
            </li>
          </ul>

          {/* Logout Button */}
          <div className="mt-auto p-3">
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
              style={{ 
                border: '1px solid #dc3545',
                color: '#dc3545',
                backgroundColor: 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#dc3545';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#dc3545';
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>

          <div className="p-3 text-center">
            <small className="text-muted">Admin Dashboard v1.0</small>
          </div>
        </div>
      </div>

      {/* Main content with navbar */}
      <div className="main-content" style={{ marginLeft: '220px', flex: 1 }}>
        {/* Page Content */}
        <div className="p-3 p-md-4" style={{ minHeight: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>

      {/* Global styles for this component */}
      <style jsx>{`
        .active-nav-link {
          background-color: #e9f7fe;
          color: #0d6efd !important;
          font-weight: 500;
          border-left: 3px solid #0d6efd;
        }
        
        .nav-link {
          color: #495057 !important;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }
        
        .nav-link-hover:hover {
          background-color: #f1f1f1;
          color: #0d6efd !important;
          transform: translateX(2px);
        }
        
        .nav-item {
          transition: transform 0.2s ease;
        }
        
        .nav-item:hover {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;