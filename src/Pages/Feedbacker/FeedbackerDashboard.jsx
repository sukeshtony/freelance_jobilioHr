import React from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';

const FeedbackerDashboard = () => {
    const location = useLocation();
    const id = localStorage.getItem("id");  // ✅ Now 'id' will always be available

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Sidebar (fixed) */}
            <div
                className="p-3"
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
                        <h5 className="mt-3 mb-0" style={{ color: '#343a40', fontWeight: '600' }}>Feedbacker Panel</h5>
                    </div>

                    <ul className="nav flex-column flex-grow-1">
                        <li className="nav-item mb-1">
                            <Link
                                to="/feedbacker/scheduled"
                                className={`nav-link py-2 px-3 rounded ${
                                    location.pathname.includes('/scheduled') 
                                        ? 'active-nav-link' 
                                        : 'nav-link-hover'
                                }`}
                            >
                                <i className="fas fa-calendar-check mr-2"></i>
                                Scheduled Feedback
                            </Link>
                        </li>
                        <li className="nav-item mb-1">
                            <Link
                                to={`/feedbacker/profile/${id}`}  // Changed to consistent path pattern
                                className={`nav-link py-2 px-3 rounded ${
                                    location.pathname.includes('/profile') 
                                        ? 'active-nav-link' 
                                        : 'nav-link-hover'
                                }`}
                            >
                                <i className="fas fa-user mr-2"></i>  {/* Changed to user icon */}
                                Profile
                            </Link>
                        </li>
                    </ul>

                    <div className="mt-auto p-3 text-center">
                        <small className="text-muted">Feedbacker Dashboard v1.0</small>
                    </div>
                </div>
            </div>

            {/* Main content with navbar */}
            <div style={{ marginLeft: '220px', flex: 1 }}>
                {/* Page Content */}
                <div className="p-4" style={{ minHeight: 'calc(100vh - 56px)', overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </div>

            {/* Global styles for this component */}
            <style >{`
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

export default FeedbackerDashboard;