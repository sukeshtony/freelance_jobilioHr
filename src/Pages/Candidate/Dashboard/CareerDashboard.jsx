import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, Badge,Button, } from 'react-bootstrap';
import API from '../../../api';
import { API_BASE_URL } from '../../../api';
import {
   Container, Row, Col, Image, ListGroup, Accordion
} from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import requirePremium from '../../../utils/requirePremium';

const CareerDashboard = () => {
  const navigate = useNavigate();
    // Auth & premium guard (capture user)
    useEffect(() => {
      (async () => {
        const result = await requirePremium(navigate);
        if (result?.user) setUser(result.user);
      })();
    }, [navigate]);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [error, setError] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [showAllAssessments, setShowAllAssessments] = useState(false);
  const [showAllInterviews, setShowAllInterviews] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [callBookings, setCallBookings] = useState([]);
  const [loadingCallBookings, setLoadingCallBookings] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
     }
  
      setIsUploadingResume(true);
      setUploadProgress(0);
      setUploadStatus('Uploading resume...');
  
      const formData = new FormData();
      formData.append("resume", file);
  
      try {
        // Simulate progress stages
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
  
        setUploadStatus('Uploading resume...');
        const res = await fetch(`${API_BASE_URL}/api/resume/parser`, {
          method: "POST",
          body: formData,
        });
  
        clearInterval(progressInterval);
        setUploadProgress(95);
        setUploadStatus('Processing resume with AI...');
  
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }
  
        setUploadProgress(100);
        setUploadStatus('Resume processed successfully!');
  
        // Small delay to show success message
        await new Promise(resolve => setTimeout(resolve, 500));
  
        setShowModeModal(false);
        setIsUploadingResume(false);
  
        navigate("/update-profile-ai?mode=ai", {
          state: { parsedData: data, resumeFile: file }
        });
  
      } catch (err) {
        console.error("Resume upload failed", err);
        setUploadStatus('Upload failed. Please try again.');
        alert(`Resume upload failed: ${err.message}`);
        setIsUploadingResume(false);
        setUploadProgress(0);
      }
    };
  // Define the helper functions INSIDE the component
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-info text-white';
      case 'reviewed': return 'bg-primary text-white';
      case 'shortlisted': return 'bg-success text-white';
      case 'rejected': return 'bg-danger text-white';
      case 'hired': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Under Review';
      case 'reviewed': return 'In Process';
      case 'shortlisted': return 'Shortlisted';
      case 'rejected': return 'Not Selected';
      case 'hired': return 'Hired!';
      default: return status || 'Unknown Status';
    }
  };

  const cancelExamBooking = async (bookingId) => {
    if (!window.confirm('Cancel this assessment booking?')) return;
    try {
      await API.post(`/api/exams/booking/${bookingId}/cancel`);
      setBookings(prev => prev.filter(b => b._id !== bookingId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel assessment');
    }
  };

  const cancelInterview = async (interviewId) => {
    if (!window.confirm('Cancel this interview?')) return;
    try {
      await API.post(`/api/interview/bookings/${interviewId}/cancel`);
      setInterviews(prev => prev.filter(i => i._id !== interviewId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel interview');
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?._id) return;

      try {
        const res = await API.get(`/api/exams/booking/${user._id}`);
        // Sort bookings by createdAt date (newest first)
        const sortedBookings = res.data
          .filter(b => b.status !== 'Canceled')
          .sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBookings(sortedBookings);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      }
    };

    fetchBookings();
  }, [user]);

  const hasCompletedExam = bookings.some(
    booking => booking.status === 'Passed' || booking.status === 'Failed' || booking.status === 'Conducted' // adjust status check accordingly
  );

  const hasCompletedInterview = interviews.some(
    interview => interview.status === 'Completed' || interview.status === 'Conducted' // adjust based on your data
  );

  const canViewCourses = hasCompletedExam && hasCompletedInterview;

  // Debug logging
  console.log('View Courses conditions:', {
    hasCompletedExam,
    hasCompletedInterview,
    bookings: bookings.length,
    interviews: interviews.length,
    examStatuses: bookings.map(b => b.status),
    interviewStatuses: interviews.map(i => i.status)
  });

  // Removed separate fetchUser effect; user now provided by requirePremium


  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/profile/progress", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProgress(res.data.progress);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };

    fetchProgress();
  }, []);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const response = await API.get('/api/interview/my-interviews?includeCancelled=true');
        setInterviews(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch interviews");
      } finally {
        setLoadingInterviews(false);
      }
    };

    fetchInterviews();
  }, [user]);

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/jobs/applied", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API Response:", res.data); // Debug the actual response structure

        const transformed = res.data.appliedJobs.map((app) => ({
          applicationId: app._id, // Make sure this is the application ID
          jobId: app.job?._id,
          title: app.job?.jobTitle || 'N/A',
          company: app.job?.companyName || 'Unknown',
          status: app.status || 'pending', // Ensure this matches the API field name
          appliedDate: app.appliedAt,
          updatedAt: app.updatedAt // Add this for debugging
        }));

        console.log("Transformed data:", transformed); // Verify the transformation
        setAppliedJobs(transformed);
      } catch (err) {
        console.error("Failed to fetch applied jobs:", err);
      }
    };

    fetchAppliedJobs();
  }, []);

  useEffect(() => {
    const fetchCallBookings = async () => {
      try {
        setLoadingCallBookings(true);
        const token = localStorage.getItem("token");
        const res = await API.get("/api/bookings/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCallBookings(res.data.bookings); // Changed to access res.data.bookings
      } catch (err) {
        console.error("Failed to fetch call bookings:", err);
      } finally {
        setLoadingCallBookings(false);
      }
    };

    fetchCallBookings();
  }, []);

  const handleCancelCall = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.delete(`/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data;
    } catch (err) {
      console.error("Cancel error:", err.response?.data?.error);
      throw err;
    }
  };

  const convertTo24Hour = (time12h) => {
    if (!time12h) return '00:00';
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    // Ensure hours and minutes are strings
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };


  // Get today's date for comparison
  const today = new Date();
  const todayString = today.toDateString();

  // Get all events scheduled for today
  const todaysEvents = [
    // Assessments
    ...bookings
      .filter(b => b.date && b.time && ['Scheduled', 'In Progress'].includes(b.status))
      .map(b => {
        try {
          return {
            type: 'assessment',
            id: b._id,
            date: new Date(`${b.date}T${convertTo24Hour(b.time)}`),
            title: b.courseName || 'Assessment',
            time: b.time,
            meta: b.category,
            raw: b
          };
        } catch (e) {
          console.error("Invalid assessment date:", e);
          return null;
        }
      })
      .filter(Boolean),

    // Interviews - Updated handling for your data structure
    ...interviews
      .filter(i => {
        try {
          // Handle both date string formats (ISO or just date)
          const interviewDate = i.date ? new Date(i.date).toDateString() : null;
          return interviewDate === todayString &&
            ['Scheduled', 'In Progress'].includes(i.status);
        } catch (e) {
          console.error("Invalid interview date format:", i.date);
          return false;
        }
      })
      .map(i => {
        try {
          return {
            type: 'interview',
            id: i._id,
            date: i.date ? new Date(i.date) : new Date(), // Fallback to today if no date
            title: i.interviewType || 'Interview', // Using interviewType instead of company
            time: i.time || 'Unknown time',
            meta: i.interviewer?.name || 'Interviewer', // Show interviewer name
            duration: i.duration, // Include duration
            raw: i
          };
        } catch (e) {
          console.error("Error processing interview:", e);
          return null;
        }
      })
      .filter(Boolean)
  ]
    .sort((a, b) => {
      // Sort by time if available, otherwise by type
      const timeA = a.time ? convertTo24Hour(a.time) : '00:00';
      const timeB = b.time ? convertTo24Hour(b.time) : '00:00';
      return timeA.localeCompare(timeB);
    });

  const username = user?.username || "User";
  const avatar = user?.profile.avatarUrl|| "";


  // Calculate displayed items based on showAll states
  const displayedBookings = showAllAssessments ? bookings : bookings.slice(0, 5);
  const displayedInterviews = showAllInterviews ? interviews : interviews.slice(0, 5);
  const displayedJobs = showAllJobs ? appliedJobs : appliedJobs.slice(0, 5);

  // Show loading while checking premium status
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Checking access...</p>
        </div>
      </div>
    );
  }

  // Premium access already enforced by requirePremium; if user still null show loader above

  return (
    <>
      {/* Navbar */}
      <div className="bg-white position-sticky top-0 z-3 border-bottom"
        style={{
          zIndex: 1050,
          boxShadow: "0 2px 15px rgba(0,0,0,0.05)",
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255,255,255,0.85)"
        }}>
        <div className="container d-flex justify-content-between align-items-center py-2">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: "40px" }} />

          <div className="dropdown">
            <button
              className="btn p-0 border-0 bg-transparent position-relative"
              type="button"
              id="profileDropdownNav"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative">
                  {avatar ? (
                    <img
                      src={`${API_BASE_URL}${user?.profile.avatarUrl}`}
                      alt="Profile"
                      style={{
                        width: "clamp(32px, 8vw, 40px)",
                        height: "clamp(32px, 8vw, 40px)",
                        objectFit: "cover",
                        border: "2px solid #0d6efd",
                        borderRadius: "50%",
                        aspectRatio: "1 / 1",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                      }}
                    />
                  ) : (
                    <div
                      className="bg-primary bg-opacity-10 text-primary d-flex justify-content-center align-items-center"
                      style={{
                        width: "clamp(32px, 8vw, 40px)",
                        height: "clamp(32px, 8vw, 40px)",
                        fontWeight: "bold",
                        fontSize: "clamp(0.8rem, 2vw, 1rem)",
                        border: "2px dashed rgba(13, 110, 253, 0.3)",
                        borderRadius: "50%",
                        aspectRatio: "1 / 1"
                      }}
                    >
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="position-absolute bottom-0 end-0 translate-middle">
                    <span className="badge rounded-circle bg-success p-1 border border-2 border-white"></span>
                  </span>
                </div>
                <i className="bi bi-chevron-down text-muted" style={{ fontSize: "0.7rem" }}></i>
              </div>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2"
              style={{
                minWidth: "200px",
                border: "1px solid rgba(0,0,0,0.05)",
                transformOrigin: "top right",
                animation: "scaleIn 0.15s ease-out",
              }}
              aria-labelledby="profileDropdownNav">
              <li>
                <Link className="dropdown-item py-2 px-3 d-flex align-items-center gap-2" to="/profile">
                  <i className="bi bi-person fs-5 text-primary"></i>
                  <span>My Profile</span>
                </Link>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  localStorage.removeItem('username');
                  localStorage.removeItem('role');
                  navigate('/candidate/login');
                }}
                className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-danger border-0 bg-transparent w-100 text-start"
              >
                <i className="bi bi-box-arrow-right fs-5"></i>
                <span>Logout</span>
              </button>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container py-4 bg-light position-relative">
        {/* Welcome Section */}
        <section
          className="rounded-4 overflow-hidden p-4 mb-4 text-white position-relative"
          style={{
            background: "linear-gradient(135deg, #18cc60c4 0%, #3a0ca3 100%)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            border: "none",
            transition: "all 0.3s ease",
            zIndex: 1
          }}
        >
          <div
            className="position-absolute top-0 end-0 w-50 h-100"
            style={{
              background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)",
              zIndex: -1
            }}
          ></div>

          <div
            className="position-absolute bottom-0 start-0 w-100 h-30"
            style={{
              background: "linear-gradient(0deg, rgba(0,0,0,0.03) 0%, transparent 100%)",
              zIndex: -1
            }}
          ></div>

          <div className="row align-items-center">
            <div className="col-md-7 text-md-start text-center mb-3 mb-md-0">
              {/* Mobile: Show Premium badge above Welcome */}
              <div className="d-md-none d-flex justify-content-center justify-content-md-start mb-2">
                <Badge pill bg="primary" className="d-inline-flex align-items-center" style={{
                  background: "linear-gradient(135deg,rgb(255, 196, 0) 0%,rgb(255, 196, 0) 100%)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  padding: "0.25rem 0.5rem"
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    fill="white"
                    viewBox="0 0 16 16"
                    className="me-1"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                  </svg>
                  Premium
                </Badge>
              </div>
              <p
                className="mb-1 opacity-90 text-center text-md-start"
                style={{
                  fontSize: "1rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}
              >
                Welcome
              </p>
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                <h3 className="fw-bold mb-0" style={{ fontSize: "1.8rem", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  {username}!
                </h3>
                {/* Premium Badge */}
                <Badge pill bg="primary" className="d-none d-md-inline-flex align-items-center" style={{
                  background: "linear-gradient(135deg,rgb(255, 196, 0) 0%,rgb(255, 196, 0) 100%)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  padding: "0.25rem 0.5rem"
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    fill="white"
                    viewBox="0 0 16 16"
                    className="me-1"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                  </svg>
                  Premium
                </Badge>
              </div>
              <p
                className="fs-5 mb-0 opacity-90 text-center text-md-start"
                style={{
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  maxWidth: "90%",
                  marginLeft: "0%",
                  marginRight: "auto",
                  marginTop: "0.5rem"
                }}
              >
                You're one step closer to landing your dream job.
              </p>
            </div>

            <div className="col-md-5">
              <div
                className="text-white p-3 rounded-3"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(5px)",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <span style={{ fontSize: "1.1rem" }}>📊</span>
                    <span>Profile Completion</span>
                  </h6>
                  <span className="fw-bold" style={{ fontSize: "1.1rem" }}>{progress}%</span>
                </div>

                <div className="position-relative">
                  <div
                    className="progress rounded-pill overflow-hidden"
                    style={{
                      height: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.2)"
                    }}
                  >
                    <div
                      className="progress-bar rounded-pill"
                      role="progressbar"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #4cc9f0 0%, #10db80ff 100%)",
                        boxShadow: "0 2px 8px rgba(76,201,240,0.4)",
                        transition: "width 0.6s ease"
                      }}
                    ></div>
                  </div>

                  <div className="text-center mt-3">
                    <button
                      className="btn btn-sm btn-light rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1"
                      style={{
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        minHeight: "44px",
                        minWidth: "120px"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                      }}
                      onClick={() => setShowModeModal(true)} // OPEN MODAL
                    >
                      {progress < 70 ? "Complete Now" : "Update Now"}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile: Certificate and Premium Features below Complete Now */}
        <div className="d-block d-md-none">
          {/* Certificate Status (Mobile) */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">📜 Certificate</h5>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Courses</span>
                <Link to="/my-courses" className="text-decoration-none">My Courses</Link>
              </div>
            </div>
          </div>

          {/* Premium Features (Mobile) */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">🔓 Unlocked Premium Features</h5>
              {[
                {
                  title: "Exams",
                  desc: "Evaluate technical & soft skills",
                  color: "primary",
                  link: <Link to="/exam-booking" className="text-decoration-none">→ Book Exam Slot</Link>,
                },
                {
                  title: "Interview",
                  desc: "Schedule 1-to-1 mock interview",
                  color: "warning",
                  link: <Link to="/interview-booking" className="text-decoration-none">→ Book Interview</Link>,
                },
                {
                  title: "Campus Job Drives",
                  desc: "Apply to exclusive company roles",
                  color: "purple",
                  link: <Link to="/campus-job-drives" className="text-primary text-decoration-none">→ View Opportunities</Link>,
                },
                {
                  title: "AI Resume Builder",
                  desc: "Auto-generate resume from profile",
                  color: "success",
                  link: <Link to="/resume-builder" className="text-decoration-none">→ Build Resume</Link>,
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`mb-3 p-3 border-start border-${item.color} border-4`}
                  style={item.color === 'purple' ? { borderLeftColor: '#7c3aed' } : {}}
                >
                  <h6 className="fw-bold">{item.title}</h6>
                  <p className="mb-1 small">{item.desc}</p>
                  {item.link}
                </div>
              ))}
              <div className="mb-3 p-3 border-start border-4 border-dark">
                <h6 className="fw-bold" style={{ color: '#2b2d42' }}>Courses</h6>
                <p className="mb-1 small">Access all courses</p>
                <Link to="/career-certificate" className="text-decoration-none">→ View Courses</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Column */}
          <div className="col-md-8">
            {/* Next Steps Card */}
            <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="card-title mb-3 d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '1.25rem' }}>📝</span>
                  <span style={{ fontWeight: '600' }}>Your Next Steps</span>
                </h5>

                <ul className="list-unstyled">
                  <li className="d-flex align-items-start mb-3">
                    <div className="badge bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>1</div>
                    <div>
                      <h6 className="mb-1 fw-semibold">Take the Skill Assessment</h6>
                      <p className="mb-0 small text-muted">Evaluate your technical and soft skills</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <div className="badge bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>2</div>
                    <div>
                      <h6 className="mb-1 fw-semibold">Generate Your Resume</h6>
                      <p className="mb-0 small text-muted">AI-powered professional resume builder</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <div className="badge bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>3</div>
                    <div>
                      <h6 className="mb-1 fw-semibold">Schedule Interview</h6>
                      <p className="mb-0 small text-muted">1-on-1 mock interview session</p>
                    </div>
                  </li>
                </ul>

                <div className="alert alert-primary bg-primary bg-opacity-10 d-flex align-items-center mt-3 border-0">
                  <span className="badge bg-primary bg-opacity-25 text-primary rounded-circle p-2 me-3">💡</span>
                  <div>
                    <h6 className="mb-1 fw-semibold">Pro Tip</h6>
                    <p className="mb-0 small">Complete these steps to maximize your job opportunities!</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Career Progress Card */}
<div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
  <div className="card-body p-4">
    <h5 className="card-title mb-4 d-flex align-items-center">
      <span className="me-2" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>📈</span>
      <span style={{ fontWeight: '600', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>Your Career Progress</span>
    </h5>

    <div className="row g-3 justify-content-center" style={{
      margin: '0 auto',
      maxWidth: '100%'
    }}>
      {/* Registration - Always completed */}
      <div className="col-6 col-md-3 d-flex justify-content-center">
        <div className="p-3 rounded-circle bg-success-subtle d-flex flex-column align-items-center justify-content-center"
          style={{
            width: 'clamp(80px, 20vw, 120px)',
            height: 'clamp(80px, 20vw, 120px)',
            border: '4px solid #10b981',
            minWidth: '80px',
            minHeight: '80px'
          }}>
          <div className="text-center" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px'
          }}>
            <span className="text-success" style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)' }}>✅</span>
            <div className="fw-bold mt-1" style={{
              color: '#2d3748',
              fontSize: 'clamp(0.45rem, 1.3vw, 0.65rem)',
              lineHeight: '1',
              textAlign: 'center'
            }}>Registration</div>
            <div className="fw-bold text-success" style={{
              fontSize: 'clamp(0.5rem, 1.5vw, 0.7rem)',
              lineHeight: '1'
            }}>100%</div>
          </div>
        </div>
      </div>

      {/* Skill Test */}
      <div className="col-6 col-md-3 d-flex justify-content-center">
        <div className={`p-3 rounded-circle ${bookings.some(b => b.status === 'Passed') ? 'bg-success-subtle' :
          bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ? 'bg-warning-subtle' :
            bookings.some(b => ['Failed', 'Missed'].includes(b.status)) ? 'bg-danger-subtle' :
              'bg-secondary-subtle'
          } d-flex flex-column align-items-center justify-content-center`}
          style={{
            width: 'clamp(80px, 20vw, 120px)',
            height: 'clamp(80px, 20vw, 120px)',
            border: `4px solid ${bookings.some(b => b.status === 'Passed') ? '#10b981' :
              bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ? '#f59e0b' :
                bookings.some(b => ['Failed', 'Missed'].includes(b.status)) ? '#ef4444' :
                  '#6b7280'
              }`,
            minWidth: '80px',
            minHeight: '80px'
          }}>
          <div className="text-center" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px'
          }}>
            <span className={`${bookings.some(b => b.status === 'Passed') ? 'text-success' :
              bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ? 'text-warning' :
                bookings.some(b => ['Failed', 'Missed'].includes(b.status)) ? 'text-danger' :
                  'text-secondary'
              }`} style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)' }}>
              {bookings.some(b => b.status === 'Passed') ? '✅' :
                bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ? '🕒' :
                  bookings.some(b => ['Failed', 'Missed'].includes(b.status)) ? '❌' : '⚠️'}
            </span>
            <div className="fw-bold mt-1" style={{
              color: '#2d3748',
              fontSize: 'clamp(0.45rem, 1.3vw, 0.65rem)',
              lineHeight: '1',
              textAlign: 'center'
            }}>Skill Test</div>
            <div className={`fw-bold ${bookings.some(b => b.status === 'Passed') ? 'text-success' :
              bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ? 'text-warning' :
                bookings.some(b => ['Failed', 'Missed'].includes(b.status)) ? 'text-danger' :
                  'text-secondary'
              }`} style={{
                fontSize: 'clamp(0.5rem, 1.5vw, 0.7rem)',
                lineHeight: '1'
              }}>
              {bookings.some(b => b.status === 'Passed') ? '100%' :
                bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ? '50%' :
                  bookings.some(b => ['Failed', 'Missed'].includes(b.status)) ? '0%' : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Interview */}
      <div className="col-6 col-md-3 d-flex justify-content-center">
        <div className={`p-3 rounded-circle ${interviews.some(i => i.status === 'Completed') ? 'bg-success-subtle' :
          interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ? 'bg-warning-subtle' :
            interviews.some(i => ['No Show', 'Rejected'].includes(i.status)) ? 'bg-danger-subtle' :
              'bg-secondary-subtle'
          } d-flex flex-column align-items-center justify-content-center`}
          style={{
            width: 'clamp(80px, 20vw, 120px)',
            height: 'clamp(80px, 20vw, 120px)',
            border: `4px solid ${interviews.some(i => i.status === 'Completed') ? '#10b981' :
              interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ? '#f59e0b' :
                interviews.some(i => ['No Show', 'Rejected'].includes(i.status)) ? '#ef4444' :
                  '#6b7280'
              }`,
            minWidth: '80px',
            minHeight: '80px'
          }}>
          <div className="text-center" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px'
          }}>
            <span className={`${interviews.some(i => i.status === 'Completed') ? 'text-success' :
              interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ? 'text-warning' :
                interviews.some(i => ['No Show', 'Rejected'].includes(i.status)) ? 'text-danger' :
                  'text-secondary'
              }`} style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)' }}>
              {interviews.some(i => i.status === 'Completed') ? '✅' :
                interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ? '🕒' :
                  interviews.some(i => ['No Show', 'Rejected'].includes(i.status)) ? '❌' : '⚠️'}
            </span>
            <div className="fw-bold mt-1" style={{
              color: '#2d3748',
              fontSize: 'clamp(0.45rem, 1.3vw, 0.65rem)',
              lineHeight: '1',
              textAlign: 'center'
            }}>Interview</div>
            <div className={`fw-bold ${interviews.some(i => i.status === 'Completed') ? 'text-success' :
              interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ? 'text-warning' :
                interviews.some(i => ['No Show', 'Rejected'].includes(i.status)) ? 'text-danger' :
                  'text-secondary'
              }`} style={{
                fontSize: 'clamp(0.5rem, 1.5vw, 0.7rem)',
                lineHeight: '1'
              }}>
              {interviews.some(i => i.status === 'Completed') ? '100%' :
                interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ? '50%' :
                  interviews.some(i => ['No Show', 'Rejected'].includes(i.status)) ? '0%' : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Job Referral */}
      <div className="col-6 col-md-3 d-flex justify-content-center">
        <div className={`p-3 rounded-circle ${appliedJobs.some(j => j.status === 'hired') ? 'bg-success-subtle' :
          appliedJobs.some(j => ['shortlisted', 'interview'].includes(j.status)) ? 'bg-info-subtle' :
            appliedJobs.some(j => ['applied', 'pending', 'reviewed'].includes(j.status)) ? 'bg-primary-subtle' :
              'bg-secondary-subtle'
          } d-flex flex-column align-items-center justify-content-center`}
          style={{
            width: 'clamp(80px, 20vw, 120px)',
            height: 'clamp(80px, 20vw, 120px)',
            border: `4px solid ${appliedJobs.some(j => j.status === 'hired') ? '#10b981' :
              appliedJobs.some(j => ['shortlisted', 'interview'].includes(j.status)) ? '#3b82f6' :
                appliedJobs.some(j => ['applied', 'pending', 'reviewed'].includes(j.status)) ? '#2563eb' :
                  '#6b7280'
              }`,
            minWidth: '80px',
            minHeight: '80px'
          }}>
          <div className="text-center" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2px'
          }}>
            <span className={`${appliedJobs.some(j => j.status === 'hired') ? 'text-success' :
              appliedJobs.some(j => ['shortlisted', 'interview'].includes(j.status)) ? 'text-info' :
                appliedJobs.some(j => ['applied', 'pending', 'reviewed'].includes(j.status)) ? 'text-primary' :
                  'text-secondary'
              }`} style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)' }}>
              {appliedJobs.some(j => j.status === 'hired') ? '✅' :
                appliedJobs.some(j => ['shortlisted', 'interview'].includes(j.status)) ? '📩' :
                  appliedJobs.some(j => ['applied', 'pending', 'reviewed'].includes(j.status)) ? '📝' : '⚠️'}
            </span>
            <div className="fw-bold mt-1" style={{
              color: '#2d3748',
              fontSize: 'clamp(0.4rem, 1.2vw, 0.6rem)',
              lineHeight: '1',
              textAlign: 'center'
            }}>Job Referral</div>
            <div className={`fw-bold ${appliedJobs.some(j => j.status === 'hired') ? 'text-success' :
              appliedJobs.some(j => ['shortlisted', 'interview'].includes(j.status)) ? 'text-info' :
                appliedJobs.some(j => ['applied', 'pending', 'reviewed'].includes(j.status)) ? 'text-primary' :
                  'text-secondary'
              }`} style={{
                fontSize: 'clamp(0.5rem, 1.5vw, 0.7rem)',
                lineHeight: '1'
              }}>
              {appliedJobs.some(j => j.status === 'hired') ? '100%' :
                appliedJobs.some(j => ['shortlisted', 'interview'].includes(j.status)) ? '80%' :
                  appliedJobs.some(j => ['applied', 'pending', 'reviewed'].includes(j.status)) ? '20%' : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Updates Section */}
    <div className="mt-4">
      <h6 className="fw-semibold mb-3 d-flex align-items-center">
        <i className="bi bi-bell-fill text-warning me-2"></i>
        Recent Updates
      </h6>

      <div className="list-group">
        {/* Show all today's events */}
        {todaysEvents.length > 0 ? (
          todaysEvents.map(event => (
            <div
              key={`today-${event.type}-${event.id}`}
              className="list-group-item list-group-item-warning d-flex align-items-center"
            >
              <i className={`bi ${event.type === 'assessment' ? 'bi-clipboard-check' : 'bi-people'} me-2`}></i>
              <div>
                <strong>{event.type === 'assessment' ? 'Assessment' : 'Interview'} Today!</strong>
                <div className="small">
                  {event.title} at {event.time}
                  {event.meta && ` (${event.meta})`}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="list-group-item text-muted">
            <i className="bi bi-info-circle me-2"></i>
            No events scheduled for today
          </div>
        )}

        {(() => {
          const now = new Date();
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

          const recentUpdates = [...bookings, ...interviews, ...appliedJobs]
            .map(item => {
              // Pick the most recent timestamp
              const updateDate = new Date(item.updatedAt || item.createdAt);

              return {
                ...item,
                id: item._id || item.applicationId || item.jobId || Math.random(),
                updateDate,
                jobTitle: item.jobTitle || item.testName || item.courseName || item.company || item.interviewType || 'Your activity',
                type:
                  item.interviewType ? 'Interview'
                    : item.testName || item.courseName ? 'Assessment'
                      : 'Job Application',
                status: item.status
              };
            })
            .filter(item => {
              return item.updateDate instanceof Date && !isNaN(item.updateDate) && item.updateDate > twentyFourHoursAgo;
            })
            .sort((a, b) => b.updateDate - a.updateDate)
            .slice(0, 3);

          return recentUpdates.length > 0 ? (
            recentUpdates.map(item => {
              const diffMs = now - item.updateDate;
              const diffMinutes = Math.floor(diffMs / (1000 * 60));
              const diffHours = Math.floor(diffMinutes / 60);

              const updateTime =
                diffMinutes < 1 ? 'Just now'
                  : diffMinutes < 60 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
                    : diffHours === 1 ? '1 hour ago'
                      : `${diffHours} hours ago`;

              const statusClass =
                ['Passed', 'Completed', 'Hired', 'shortlisted'].includes(item.status) ? 'success' :
                  ['Failed', 'Rejected', 'No Show'].includes(item.status) ? 'danger' :
                    'info';

              const statusSymbol =
                statusClass === 'success' ? '✓' :
                  statusClass === 'danger' ? '✗' :
                    '↻';

              return (
                <div key={`update-${item.id}`} className="list-group-item">
                  <div className="d-flex align-items-center">
                    <div className={`badge bg-${statusClass} me-2`} style={{ width: '24px', height: '24px' }}>
                      {statusSymbol}
                    </div>
                    <div>
                      <strong>{item.jobTitle}</strong>
                      <div className="small">
                        {item.type} status changed to <span className="fw-bold">{item.status}</span> • {updateTime}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="list-group-item text-muted">
              <i className="bi bi-info-circle me-2"></i>
              No updates in the last 24 hours
            </div>
          );
        })()}

        {/* Only show "no updates" if there are truly no updates */}
        {![...bookings, ...interviews, ...appliedJobs].some(item => {
          try {
            const today = new Date();
            const itemDate = new Date(item.scheduledDate || item.scheduledTime || item.updatedAt);
            return itemDate.toDateString() === today.toDateString();
          } catch {
            return false;
          }
        }) && [...bookings, ...interviews, ...appliedJobs].filter(item => item.updatedAt).length === 0 && (
            <div className="list-group-item text-muted">
              <i className="bi bi-info-circle me-2"></i>
              No recent updates. Check back later for progress.
            </div>
          )}
      </div>
    </div>

    {/* Action Required Alert */}
    <div className="alert alert-warning bg-warning-subtle d-flex align-items-center mt-4 border-0"
      style={{
        borderLeft: '4px solid #f59e0b',
        borderRadius: '8px'
      }}>
      <span className="badge bg-warning bg-opacity-25 text-warning rounded-circle p-2 me-3">🔔</span>
      <div>
        <h6 className="mb-1 fw-semibold">Action Required</h6>
        <p className="mb-0 small">
          {!bookings.some(b => b.status === 'Passed') ?
            (bookings.some(b => ['Scheduled', 'In Progress'].includes(b.status)) ?
              'Complete your scheduled skill assessment!' :
              'Take your skill assessment to get started!') :
            !interviews.some(i => i.status === 'Completed') ?
              (interviews.some(i => ['Scheduled', 'In Progress'].includes(i.status)) ?
                'Attend your scheduled interview!' :
                'Schedule an interview to continue!') :
                !appliedJobs.some(j => j.status === 'Hired') ?
                  (appliedJobs.length > 0 ?
                    'Keep applying to more opportunities!' :
                    'Start applying to jobs to complete your journey!') :
                    'Congratulations on completing your career journey!'}
        </p>
      </div>
    </div>
  </div>
</div>

            {/* Scheduled Assessments */}
            <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="card-title mb-3 d-flex align-items-center">
                  <i className="bi bi-calendar-check me-2"></i>
                  Scheduled Exam
                </h5>

                {bookings.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    No assessments booked yet.
                    <Link to="/exam-booking" className="ms-2 text-primary">Book one now</Link>
                  </div>
                ) : (
                  <>
                    {/* Desktop/Laptop View (5 items) */}
                    <div className="d-none d-md-block">
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Category</th>
                              <th>Course</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(showAllAssessments ? bookings : bookings.slice(0, 5))
                              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                              .map(b => {
                                let badgeColor = "secondary";
                                if (b.status === "Passed") badgeColor = "success";
                                else if (b.status === "Failed") badgeColor = "danger";
                                else if (b.status === "Scheduled") badgeColor = "info";
                                else if (b.status === "Cancelled") badgeColor = "danger";

                                return (
                                  <tr key={b._id}>
                                    <td>{b.category}</td>
                                    <td>{b.courseName}</td>
                                    <td>{b.date}</td>
                                    <td>{b.time}</td>
                                    <td>
                                      <span className={`badge bg-${badgeColor}`}>
                                        {b.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="dropdown dropup position-static">
                                        <button
                                          className="btn btn-sm btn-outline-secondary p-1"
                                          type="button"
                                          data-bs-toggle="dropdown"
                                          aria-expanded="false"
                                          aria-label="Actions"
                                        >
                                          <i className="bi bi-three-dots"></i>
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end" data-bs-display="static" style={{ zIndex: 2000 }}>
                                          <li>
                                            <Link className="dropdown-item" to={`/exam-details/${b._id}`}>
                                              View Details
                                            </Link>
                                          </li>
                                          {b.status === 'Scheduled' && (
                                            <li>
                                              <button
                                                className="dropdown-item text-danger"
                                                onClick={() => cancelExamBooking(b._id)}
                                              >
                                                Cancel
                                              </button>
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile View (2 items) */}
                    <div className="d-md-none">
                      {(showAllAssessments ? bookings : bookings.slice(0, 2))
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map(b => {
                          let badgeColor = "secondary";
                          if (b.status === "Passed") badgeColor = "success";
                          else if (b.status === "Failed") badgeColor = "danger";
                          else if (b.status === "Scheduled") badgeColor = "info";
                          else if (b.status === "Cancelled") badgeColor = "danger";

                          return (
                            <div key={b._id} className="border-bottom pb-3 mb-3">
                              <div className="d-flex justify-content-between mb-2">
                                <strong>Category:</strong>
                                <span>{b.category}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <strong>Course:</strong>
                                <span>{b.courseName}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <strong>Date:</strong>
                                <span>{b.date}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <strong>Time:</strong>
                                <span>{b.time}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <strong>Status:</strong>
                                <span className={`badge bg-${badgeColor}`}>
                                  {b.status}
                                </span>
                              </div>
                              <div className="d-flex justify-content-end">
                                <div className="dropdown dropup position-static">
                                  <button
                                    className="btn btn-sm btn-outline-secondary p-1"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    aria-label="Actions"
                                  >
                                    <i className="bi bi-three-dots"></i>
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end" data-bs-display="static" style={{ zIndex: 2000 }}>
                                    <li>
                                      <Link className="dropdown-item" to={`/exam-details/${b._id}`}>
                                        View Details
                                      </Link>
                                    </li>
                                    {b.status === 'Scheduled' && (
                                      <li>
                                        <button
                                          className="dropdown-item text-danger"
                                          onClick={() => cancelExamBooking(b._id)}
                                        >
                                          Cancel
                                        </button>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* View All/Less Button */}
                    {bookings.length > (window.innerWidth >= 768 ? 5 : 2) && (
                      <div className="text-center mt-3">
                        <button
                          className="btn btn-sm btn-link"
                          onClick={() => setShowAllAssessments(!showAllAssessments)}
                        >
                          {showAllAssessments ? 'Show Less' : 'View All Assessments'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Scheduled Interviews */}
            <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="card-title mb-3 d-flex align-items-center">
                  <i className="bi bi-calendar2-event me-2"></i>
                  My Interviews
                </h5>

                {loadingInterviews ? (
                  <div className="text-center text-muted py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : interviews.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    You have no interviews yet.
                    <Link to="/interview-booking" className="ms-2 text-primary">Book one now</Link>
                  </div>
                ) : (
                  <>
                    {/* Desktop/Laptop View (Table) - Shows 5 items by default */}
                    <div className="d-none d-md-block">
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Type</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Interviewer</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(showAllInterviews ? interviews : interviews.slice(0, 5)).map((interview) => {
                              let badgeColor = "secondary";
                              if (interview.status === "Completed") badgeColor = "success";
                              else if (interview.status === "Cancelled") badgeColor = "danger";
                              else if (interview.status === "Scheduled") badgeColor = "info";
                              else if (interview.status === "Rescheduled") badgeColor = "warning";

                              return (
                                <tr key={interview._id}>
                                  <td>{interview.interviewType}</td>
                                  <td>{new Date(interview.date).toLocaleDateString()}</td>
                                  <td>{interview.time}</td>
                                  <td>{interview.interviewer?.name || "To be assigned"}</td>
                                  <td>
                                    <span className={`badge bg-${badgeColor}`}>
                                      {interview.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="dropdown dropup position-static">
                                      <button
                                        className="btn btn-sm btn-outline-secondary p-1"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                        aria-label="Actions"
                                      >
                                        <i className="bi bi-three-dots"></i>
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end" data-bs-display="static" style={{ zIndex: 2000 }}>
                                        <li>
                                          <Link className="dropdown-item" to={`/interview-details/${interview._id}`}>
                                            View Details
                                          </Link>
                                        </li>
                                        {interview.status === 'Scheduled' && (
                                          <li>
                                            <button
                                              className="dropdown-item text-danger"
                                              onClick={() => cancelInterview(interview._id)}
                                            >
                                              Cancel
                                            </button>
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile View (Cards) - Shows 2 items by default */}
                    <div className="d-md-none">
                      {(showAllInterviews ? interviews : interviews.slice(0, 2)).map((interview) => {
                        let badgeColor = "secondary";
                        if (interview.status === "Completed") badgeColor = "success";
                        else if (interview.status === "Cancelled") badgeColor = "danger";
                        else if (interview.status === "Scheduled") badgeColor = "info";
                        else if (interview.status === "Rescheduled") badgeColor = "warning";

                        return (
                          <div key={interview._id} className="border-bottom pb-3 mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Type:</strong>
                              <span>{interview.interviewType}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Date:</strong>
                              <span>{new Date(interview.date).toLocaleDateString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Time:</strong>
                              <span>{interview.time}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Interviewer:</strong>
                              <span>{interview.interviewer?.name || "To be assigned"}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <strong>Status:</strong>
                              <span className={`badge bg-${badgeColor}`}>
                                {interview.status}
                              </span>
                            </div>
                            <div className="d-flex justify-content-end">
                              <div className="dropdown dropup position-static">
                                <button
                                  className="btn btn-sm btn-outline-secondary p-1"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-label="Actions"
                                >
                                  <i className="bi bi-three-dots"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" data-bs-display="static" style={{ zIndex: 2000 }}>
                                  <li>
                                    <Link className="dropdown-item" to={`/interview-details/${interview._id}`}>
                                      View Details
                                    </Link>
                                  </li>
                                  {interview.status === 'Scheduled' && (
                                    <li>
                                      <button
                                        className="dropdown-item text-danger"
                                        onClick={() => cancelInterview(interview._id)}
                                      >
                                        Cancel
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* View All/Less Button - Shows only when needed */}
                    {interviews.length > (window.innerWidth >= 768 ? 5 : 2) && (
                      <div className="text-center mt-3">
                        <button
                          className="btn btn-sm btn-link"
                          onClick={() => setShowAllInterviews(!showAllInterviews)}
                        >
                          {showAllInterviews ? 'Show Less' : 'View All Interviews'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Job Applications */}
            <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <span className="me-2" style={{ fontSize: '1.25rem' }}>🏢</span>
                    <span style={{ fontWeight: '600' }}>Your Job Applications</span>
                  </h5>
                  {appliedJobs.length > 3 && (
                    <button
                      className="btn btn-sm btn-outline-primary d-flex align-items-center"
                      onClick={() => setShowAllJobs(!showAllJobs)}
                    >
                      {showAllJobs ? 'Show Less' : 'View All'}
                      <i className={`bi bi-chevron-${showAllJobs ? 'up' : 'down'} ms-1 d-none d-md-inline`}></i>
                    </button>
                  )}
                </div>

                {appliedJobs.length === 0 ? (
                  <div className="text-center py-3 py-md-4">
                    <p className="text-muted mb-3">You haven't applied to any jobs yet.</p>
                    <Link to="/campus-job-drives" className="btn btn-primary">
                      Browse Job Opportunities
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="d-none d-md-block">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead>
                            <tr>
                              <th style={{ fontWeight: '600', color: '#6c757d' }}>Company</th>
                              <th style={{ fontWeight: '600', color: '#6c757d' }}>Role</th>
                              <th style={{ fontWeight: '600', color: '#6c757d' }}>Applied On</th>
                              <th style={{ fontWeight: '600', color: '#6c757d' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedJobs.map((job) => (
                              <tr key={job._id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {job.companyLogo && (
                                      <img
                                        src={job.companyLogo}
                                        alt={job.company}
                                        className="rounded-circle me-2"
                                        style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                      />
                                    )}
                                    <span>{job.company}</span>
                                  </div>
                                </td>
                                <td>{job.title}</td>
                                <td>{new Date(job.appliedDate).toLocaleDateString()}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(job.status)}`}>
                                    {getStatusDisplayText(job.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="d-block d-md-none">
                      {displayedJobs.map((job) => (
                        <div key={job._id} className="card mb-3 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                          <div className="card-body p-3">
                            <div className="d-flex align-items-start">
                              {job.companyLogo && (
                                <img
                                  src={job.companyLogo}
                                  alt={job.company}
                                  className="rounded-circle me-3"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                              )}
                              <div className="flex-grow-1">
                                <h6 className="mb-1" style={{ fontWeight: '600' }}>{job.title}</h6>
                                <p className="mb-1 text-muted small">{job.company}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="small text-muted">
                                    {new Date(job.appliedDate).toLocaleDateString()}
                                  </span>
                                  <span className={`badge ${getStatusBadgeClass(job.status)}`}>
                                    {getStatusDisplayText(job.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {appliedJobs.length > 2 && !showAllJobs && (
                      <div className="text-center mt-3">
                        <button
                          className="btn btn-sm btn-link"
                          onClick={() => setShowAllJobs(true)}
                        >
                          View All Applications ({appliedJobs.length - 3} more)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-md-4">
            <div className="d-none d-md-block">
            {/* Certificate Status */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">📜 Certificate</h5>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Courses</span>
                  <Link to="/my-courses" className="text-decoration-none">My Courses</Link>
                </div>
              </div>
            </div>

            {/* Premium Features */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">🔓 Unlocked Premium Features</h5>
                {[
                  {
                    title: "Exams",
                    desc: "Evaluate technical & soft skills",
                    color: "primary",
                    link: <Link to="/exam-booking" className="text-decoration-none">→ Book Exam Slot</Link>,
                  },
                  {
                    title: "Interview",
                    desc: "Schedule 1-to-1 mock interview",
                    color: "warning",
                    link: <Link to="/interview-booking" className="text-decoration-none">→ Book Interview</Link>,
                  },
                  {
                    title: "Campus Job Drives",
                    desc: "Apply to exclusive company roles",
                    color: "purple",
                    link: <Link to="/campus-job-drives" className="text-primary text-decoration-none">
                      → View Opportunities
                    </Link>,
                  },
                  {
                    title: "AI Resume Builder",
                    desc: "Auto-generate resume from profile",
                    color: "success",
                    link: <Link to="/resume-builder" className="text-decoration-none">→ Build Resume</Link>,
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`mb-3 p-3 border-start border-${item.color} border-4`}
                    style={item.color === 'purple' ? { borderLeftColor: '#7c3aed' } : {}}
                  >
                    <h6 className="fw-bold">{item.title}</h6>
                    <p className="mb-1 small">{item.desc}</p>
                    {item.link}
                  </div>
                ))}
                <div className="mb-3 p-3 border-start border-4 border-dark">
                  <h6 className="fw-bold" style={{ color: '#2b2d42' }}>Courses</h6>
                  <p className="mb-1 small">Access all courses</p>
                  <Link to="/career-certificate" className="text-decoration-none">→ View Courses</Link>
                </div>
              </div>
            </div>
            </div>

            {/* Need Help */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">🙋 Need Help?</h5>
                <div className="d-flex align-items-start mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                    <span className="text-primary fs-4">✉️</span>
                  </div>
                  <div>
                    <small className="text-muted d-block">Email</small>
                    <span className="fw-bold">info@jobiliohr.com</span>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                    <span className="text-success fs-4">💬</span>
                  </div>
                  <div>
                    <small className="text-muted d-block">WhatsApp</small>
                    <span className="fw-bold">+91 74994 32816</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-5 pt-4 pb-3 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="d-flex flex-wrap gap-3">
                <Link
                  to="/about"
                  className="text-decoration-none text-dark hover-primary"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="text-decoration-none text-dark hover-primary"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  Contact
                </Link>
                <Link
                  to="/privacy"
                  className="text-decoration-none text-dark hover-primary"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-decoration-none text-dark hover-primary"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  Terms
                </Link>
              </div>
            </div>

            <div className="col-md-6 text-md-end">
              <div className="d-flex flex-column flex-md-row justify-content-md-end align-items-center gap-2">
                <div className="text-muted small">
                  © {new Date().getFullYear()} JobilioHR — Powered by
                  <Link
                    to="/robozo-tech"
                    className="text-decoration-none ms-1"
                    style={{ color: '#3b82f6' }}
                  >
                    Rokoso Technology Service Pvt Ltd.
                  </Link>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    to="#"
                    className="text-decoration-none text-dark"
                    aria-label="Facebook"
                  >
                    <i className="bi bi-facebook"></i>
                  </Link>
                  <Link
                    to="#"
                    className="text-decoration-none text-dark"
                    aria-label="LinkedIn"
                  >
                    <i className="bi bi-linkedin"></i>
                  </Link>
                  <Link
                    to="#"
                    className="text-decoration-none text-dark"
                    aria-label="Twitter"
                  >
                    <i className="bi bi-twitter-x"></i>
                  </Link>
                  <Link
                    to="#"
                    className="text-decoration-none text-dark"
                    aria-label="Instagram"
                  >
                    <i className="bi bi-instagram"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .navbar {
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .btn-outline-light {
          border-color: rgba(255,255,255,0.2);
          color: white;
        }
        .btn-outline-light:hover {
          background-color: rgba(255,255,255,0.1);
        }
        .card {
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: none;
        }
        .table {
          margin-bottom: 0;
        }
        .table th {
          border-top: none;
          font-weight: 600;
          color: #6c757d;
        }
        .badge {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      {showModeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="p-4"
            style={{
              background: "#fff",
              width: "90%",
              maxWidth: "900px",
              borderRadius: "20px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            {/* Loading Overlay */}
            {isUploadingResume && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 10,
                }}
              >
                <div className="mb-4">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "4rem", height: "4rem", borderWidth: "0.4rem" }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>

                <h4 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {uploadStatus}
                </h4>

                <div className="w-75 mb-3">
                  <div className="progress" style={{ height: "10px" }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{
                        width: `${uploadProgress}%`,
                        background: "linear-gradient(90deg, #4361ee 0%, #3a0ca3 100%)",
                      }}
                      aria-valuenow={uploadProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>

                <p className="text-muted text-center mb-2">
                  {uploadProgress}% complete
                </p>

                <div className="mt-3 text-center">
                  <div className="d-flex align-items-center justify-content-center gap-3 text-muted small">
                    <div className={uploadProgress > 0 ? "text-success" : ""}>
                      <i className={`bi ${uploadProgress > 0 ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                      Uploading
                    </div>
                    <div className={uploadProgress > 50 ? "text-success" : ""}>
                      <i className={`bi ${uploadProgress > 50 ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                      Processing
                    </div>
                    <div className={uploadProgress === 100 ? "text-success" : ""}>
                      <i className={`bi ${uploadProgress === 100 ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                      Complete
                    </div>
                  </div>
                </div>

                <p className="text-muted small mt-4 mb-0">
                  Please wait while we analyze your resume...
                </p>
              </div>
            )}

            <Container className="py-3">
              <div className="text-center mb-4">
                <h1 className="fw-bold mb-2">Choose Update Method</h1>
                <p className="text-muted fs-5">
                  Select how you want to complete your profile
                </p>
              </div>
      
              <Row className="g-4 justify-content-center">
                {/* AI-Based Upload */}
                <Col md={6} lg={5}>
                  <Card className="h-100 border-0 shadow-sm p-4 text-center">
                    <div
                      className="bg-primary bg-opacity-10 p-4 rounded-circle d-flex align-items-center justify-content-center mb-4 mx-auto"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <i className="bi bi-robot fs-1 text-primary"></i>
                    </div>
                    <Card.Body>
                      <Card.Title className="fw-bold fs-3 mb-3">
                        AI-Based Update
                      </Card.Title>
                      <Card.Text className="text-muted mb-4 fs-5">
                        Upload your resume and let AI fill your profile automatically.
                      </Card.Text>
      
                      <input
                        type="file"
                        id="resumeInput"
                        accept=".pdf,.doc,.docx"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                        disabled={isUploadingResume}
                      />
      
                      <Button
                        variant="primary"
                        size="lg"
                        className="px-4 py-2 rounded-pill"
                        onClick={() =>
                          document.getElementById("resumeInput").click()
                        }
                        disabled={isUploadingResume}
                      >
                        <i className="bi bi-cloud-upload me-2"></i>
                        Upload Resume
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
      
                {/* Manual Update */}
                <Col md={6} lg={5}>
                  <Card className="h-100 border-0 shadow-sm p-4 text-center">
                    <div
                      className="bg-success bg-opacity-10 p-4 rounded-circle d-flex align-items-center justify-content-center mb-4 mx-auto"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <i className="bi bi-pencil-square fs-1 text-success"></i>
                    </div>
                    <Card.Body>
                      <Card.Title className="fw-bold fs-3 mb-3">
                        Manual Update
                      </Card.Title>
                      <Card.Text className="text-muted mb-4 fs-5">
                        Fill out your profile details manually at your own pace comfortably.
                      </Card.Text>
      
                      <Button
                        variant="success"
                        size="lg"
                        className="px-4 py-2 rounded-pill"
                        onClick={() =>
                          navigate("/update-profile?mode=manual")
                        }
                        disabled={isUploadingResume}
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Continue Manually
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
      
              {/* Cancel */}
              <div className="text-center mt-4">
                <button
                  className="btn btn-light px-4 py-2 rounded-pill"
                  onClick={() => setShowModeModal(false)}
                  disabled={isUploadingResume}
                >
                  Cancel
                </button>
              </div>
            </Container>
          </div>
        </div>
      )}
    </>
  );
};

export default CareerDashboard