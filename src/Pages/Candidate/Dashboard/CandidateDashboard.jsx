import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Modal, Button, Form, Spinner, Badge, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Building,
  Briefcase,
  GeoAlt,
  CashStack,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  FileEarmark,
  Star,
  X
} from 'react-bootstrap-icons';

import loadRazorpay from '../../../utils/loadRazorpay';
import { requireLogin } from '../../../utils/requireLogin';
import API from "../../../api";
import { API_BASE_URL } from '../../../api';
import {
   Container, Row, Col, Image, ListGroup, Accordion
} from 'react-bootstrap';

import { FaRupeeSign } from 'react-icons/fa';



const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Auth guard - check login and block premium users
  useEffect(() => {
    (async () => {
      const isAuthenticated = await requireLogin(navigate);
      if (!isAuthenticated) return;
      
      // Check if user is premium and redirect them
      try {
        const token = localStorage.getItem('token');
        const res = await API.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = res.data?.user;
        if (userData?.isPremium) {
          // Premium users should use CareerDashboard instead
          navigate('/career-dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Error checking user status:', err);
      }
      
      setIsAuthChecking(false);
    })();
  }, [navigate]);

  const [openFAQ, setOpenFAQ] = useState(null);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);
  // Remove: const [avatar] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [appliedExternalJobs, setAppliedExternalJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentJobsLoading, setRecentJobsLoading] = useState(true);
  const [recentJobsError, setRecentJobsError] = useState("");

  // External jobs (Jooble + Remotive + Adzuna)
  const [externalJobs, setExternalJobs] = useState([]);
  const [externalJobsLoading, setExternalJobsLoading] = useState(true);
  const [externalJobsError, setExternalJobsError] = useState("");

  // External jobs search and filter
  const [externalSearchQuery, setExternalSearchQuery] = useState("developer");
  const [externalLocation, setExternalLocation] = useState("India");
  const [externalJobType, setExternalJobType] = useState("all");

  // Combined jobs (website + external)
  const [combinedJobs, setCombinedJobs] = useState([]);
  const [combinedJobsLoading, setCombinedJobsLoading] = useState(true);

  // Inline Recent Job modals state
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationData, setApplicationData] = useState({ userName: "", email: "", resume: null });
  const [applicationMessage, setApplicationMessage] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
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
  // This will be derived from the user state
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data.user);
        // Prefill application data when user is known
        setApplicationData((prev) => ({
          ...prev,
          userName: res.data.user?.username || "",
          email: res.data.user?.email || "",
          avatarUrl: res.data.user?.profile?.avatarUrl || "",
        }));
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/profile/progress", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProgress(res.data.progress);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };

    fetchProgress();
  }, []);

  // Fetch external jobs from backend aggregator
  // Fetch external jobs with current search/filter parameters
  const fetchExternalJobs = async () => {
    try {
      setExternalJobsLoading(true);
      setExternalJobsError("");

      const params = {
        query: externalSearchQuery || 'developer',
        limit: 12
      };

      if (externalLocation) {
        params.location = externalLocation;
      }

      const res = await API.get('/api/external-jobs', { params });

      if (res.data?.success) {
        let jobs = res.data.jobs || [];

        // Apply client-side filtering for job type only (source filter removed)
        if (externalJobType !== 'all') {
          jobs = jobs.filter(job => {
            if (!job.type) return false;

            const normalizedJobType = job.type.toLowerCase().trim();
            const normalizedFilterType = externalJobType.toLowerCase().trim();

            // Exact match or contains the filter type as a whole word
            return normalizedJobType === normalizedFilterType ||
              normalizedJobType.split(/[\s-,]+/).includes(normalizedFilterType);
          });
        }

        setExternalJobs(jobs);
      } else {
        setExternalJobsError(res.data?.error || 'Failed to load external jobs');
      }
    } catch (err) {
      setExternalJobsError('Network error while loading external jobs');
    } finally {
      setExternalJobsLoading(false);
    }
  };

  // Search handler for external jobs
  const handleExternalSearch = () => {
    fetchExternalJobs();
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchExternalJobs();
  }, [externalSearchQuery, externalLocation, externalJobType]);

  // Combine and randomize jobs when both website and external jobs are loaded
  useEffect(() => {
    const combineAndRandomizeJobs = () => {
      const websiteJobs = recentJobs.map(job => ({
        ...job,
        source: 'Website',
        isExternal: false,
        applyUrl: null // Website jobs use internal application flow
      }));

      const externalJobsNormalized = externalJobs.map(job => {
        const normalized = {
          ...job,
          isExternal: true,
          _id: job.id, // Normalize ID for consistency
          jobTitle: job.title,
          companyName: job.company,
          jobType: job.type,
          applicationDeadline: null // External jobs don't have deadlines
        };
        console.log('Normalizing external job:', normalized.jobTitle, 'ID:', normalized._id, 'isExternal:', normalized.isExternal);
        return normalized;
      });

      // Combine all jobs
      const allJobs = [...websiteJobs, ...externalJobsNormalized];

      // Randomize the order
      const shuffled = allJobs.sort(() => Math.random() - 0.5);

      setCombinedJobs(shuffled);
      setCombinedJobsLoading(false);
    };

    if (!recentJobsLoading && !externalJobsLoading) {
      combineAndRandomizeJobs();
    }
  }, [recentJobs, externalJobs, recentJobsLoading, externalJobsLoading]);

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleApplyClick = (job) => {
    if (!user) {
      setApplicationMessage({ type: "danger", message: "Please login to apply for this job" });
      return;
    }

    // Check if profile is complete before allowing application
    if (progress < 70) { // Using 70% as threshold for essential fields
      setShowProfileCompletionModal(true);
      return;
    }

    setSelectedJob(job);
    setApplicationMessage({ type: "", message: "" });
    setShowApplyModal(true);
  };

  // Handle external job application - create lead then redirect
  const handleExternalJobApply = async (job) => {
    try {
      console.log('Starting external job application process for:', job);

      // Check if user is logged in
      if (!user) {
        setApplicationMessage({ type: "danger", message: "Please login to apply for this job" });
        return;
      }

      // Check if profile is complete before allowing application
      if (progress < 70) { // Using 70% as threshold for essential fields
        setShowProfileCompletionModal(true);
        return;
      }

      // Get user profile data for lead creation
      const userProfile = await API.get('/api/profile/progress');
      const profileData = userProfile.data.data;

      console.log('User profile data:', profileData);
      console.log('Profile data structure:', JSON.stringify(profileData, null, 2));

      // Extract user info from profile data - handle different possible structures
      const userName = profileData?.name || profileData?.userName || user?.username || 'External Job Applicant';
      const userEmail = profileData?.email || user?.email || 'external@job.com';
      const userPhone = profileData?.phone || profileData?.contact || '';

      console.log('Extracted user info:', { userName, userEmail, userPhone });

      const leadData = {
        name: userName,
        email: userEmail,
        phone: userPhone,
        source: 'external_job_application',
        jobId: null, // External jobs don't have internal job IDs
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        status: 'new',
        priority: 'medium',
        score: 40, // Lower score for external job applications
        tags: ['external_job', 'job_application'],
        externalJobUrl: job.applyUrl,
        notes: `External job application - Source: ${job.source || 'External API'}`
      };

      console.log('Lead data to send:', leadData);

      // Create a lead for external job application
      console.log('Sending lead creation request to /api/leads with data:', leadData);
      const leadResponse = await API.post('/api/leads', leadData);

      console.log('Lead creation response:', leadResponse.data);
      console.log('Lead created successfully for external job application');
      console.log('Lead ID:', leadResponse.data.lead?._id);

      // Mark external job as applied
      setAppliedExternalJobs(prev => [...prev, {
        jobId: job._id,
        appliedAt: new Date(),
        jobTitle: job.jobTitle,
        companyName: job.companyName
      }]);

      // Show success message
      setApplicationMessage({
        type: "success",
        message: `Application submitted successfully! Lead created for ${job.companyName} - ${job.jobTitle}`
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setApplicationMessage({ type: "", message: "" });
      }, 5000);

      // Redirect to external job URL
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');

    } catch (error) {
      console.error('Error creating lead for external job:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);

      // Show error message to user
      setApplicationMessage({
        type: "danger",
        message: `Failed to create lead: ${error.message || 'Unknown error'}`
      });

      // Still redirect even if lead creation fails
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleApplicationChange = (e) => {
    const { name, value, files } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setApplicationMessage({ type: "danger", message: "Please login to apply" });
      return;
    }

    setIsSubmitting(true);
    setApplicationMessage({ type: "", message: "" });

    // If this is an external-aggregator job delegate to lead+redirect flow
    if (selectedJob?.isExternal) {
      await handleExternalJobApply(selectedJob);
      setIsSubmitting(false);
      return;
    }

    const fd = new FormData();
    fd.append("userName", applicationData.userName);
    fd.append("email", applicationData.email);
    if (applicationData.resume) {
      fd.append("resume", applicationData.resume);
    }

    try {
      const resp = await API.post(`/api/jobs/${selectedJob?._id}/apply`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type must NOT be set; browser will add multipart boundary
        }
      });

      setApplicationMessage({
        type: "success",
        message: resp.data?.message || "Application submitted successfully!"
      });

      // Update in-memory applied jobs
      setAppliedJobs((prev) => {
        const already = prev.some((app) => app.jobId === selectedJob?._id);
        if (already) return prev;
        return [
          ...prev,
          { jobId: selectedJob?._id, status: 'pending', appliedDate: new Date().toISOString() }
        ];
      });

      // Determine redirect URL (prefer server-provided URL so it can include user-specific data)
      const redirectUrl =
        resp.data?.redirectUrl ||
        resp.data?.applyUrl ||
        selectedJob?.externalLink ||
        selectedJob?.applyUrl;

      if (redirectUrl) {
        const finalUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }

      setTimeout(() => {
        setShowApplyModal(false);
        setSelectedJob(null);
        setApplicationData((prev) => ({ ...prev, resume: null }));
        setApplicationMessage({ type: "", message: "" });
      }, 1500);
    } catch (error) {
      console.error("Error submitting application:", error);

      if (error.response) {
        if (error.response.data?.code === 'INCOMPLETE_PROFILE') {
          setApplicationMessage({
            type: "warning",
            message: error.response.data.message || "Please complete your profile before applying for jobs."
          });
        } else {
          setApplicationMessage({
            type: "danger",
            message: error.response.data?.message || "Failed to submit application"
          });
        }

        // Fallback: if server returns a redirect/apply URL with the error, still try to open it
        const fallbackUrl = error.response.data?.redirectUrl || error.response.data?.applyUrl;
        if (fallbackUrl) {
          const finalUrl = fallbackUrl.startsWith('http') ? fallbackUrl : `https://${fallbackUrl}`;
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }
      } else if (error.request) {
        setApplicationMessage({
          type: "danger",
          message: "Network error. Please check your connection and try again."
        });
      } else {
        setApplicationMessage({
          type: "danger",
          message: "An unexpected error occurred. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
    const fetchRecentJobs = async () => {
      try {
        setRecentJobsLoading(true);
        setRecentJobsError("");
        const res = await API.get('/api/jobs/public', { params: { limit: 6 } });
        if (res.data?.success) {
          setRecentJobs(res.data.data || []);
        } else {
          setRecentJobsError(res.data?.message || 'Failed to load recent jobs');
        }
      } catch (err) {
        setRecentJobsError('Network error while loading recent jobs');
      } finally {
        setRecentJobsLoading(false);
      }
    };
    fetchRecentJobs();
  }, []);

  const username = user?.username || "User";
  const avatar = user?.profile?.avatarUrl;
  const token = localStorage.getItem("token");
  console.log("Token:", token);

  // Logout handler: clear client state, optionally call backend, navigate home
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      // Attempt to notify backend (best-effort)
      if (token) {
        try {
          await API.post('/api/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          // ignore backend logout errors
          console.debug('backend logout failed', e?.message);
        }
      }
    } finally {
      // Clear local session storage/state
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('isPremium');
      setUser(null);
      // Redirect to home and reload to reset app state
      navigate('/');
      window.location.reload();
    }
  };

  const handleUpgradePayment = async () => {
    try {
      // Create order from backend
      const orderRes = await API.post('/api/payment/create-order', {
        amount: 499, // Explicitly send the amount
        userId: localStorage.getItem("userId"),
        feature: "premium"
      });

      const { orderId, amount, key, isMockOrder, paymentMode, mockReason } = orderRes.data;

      console.log('Payment order response:', { orderId, isMockOrder, paymentMode, mockReason });

      // If using mock payments, handle directly without Razorpay popup
      if (isMockOrder) {
        try {
          console.log('Processing mock payment...');

          // Verify mock payment directly
          const verifyResponse = await API.post('/api/payment/verify', {
            orderId,
            userId: localStorage.getItem("userId"),
            feature: "premium",
            isMockOrder: true
          });

          console.log('Mock payment verification response:', verifyResponse.data);

          if (verifyResponse.data.success) {
            alert(`Payment successful! (${paymentMode || 'Test'} Mode)`);
            localStorage.setItem("isPremium", true);
            window.location.href = "/career-dashboard";
          } else {
            throw new Error(verifyResponse.data.error || 'Payment verification failed');
          }
        } catch (error) {
          console.error('Mock payment verification failed:', error);
          alert(`Payment verification failed: ${error.response?.data?.error || error.message}`);
        }
        return;
      }

      // For real Razorpay payments, load SDK first
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load");
        return;
      }

      const options = {
        key,
        amount,
        currency: "INR",
        name: "JobilioHR",
        description: "Upgrade to Premium",
        order_id: orderId,
        handler: async function (response) {
          try {
            console.log('Processing real payment verification...');

            const verifyResponse = await API.post('/api/payment/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
              userId: localStorage.getItem("userId"),
              feature: "premium",
              isMockOrder: false
            });

            console.log('Real payment verification response:', verifyResponse.data);

            if (verifyResponse.data.success) {
              alert("Payment successful!");
              localStorage.setItem("isPremium", true);
              window.location.href = "/career-dashboard";
            } else {
              throw new Error(verifyResponse.data.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert(`Payment verification failed: ${error.response?.data?.error || error.message}`);
          }
        },
        theme: {
          color: "#3a0ca3"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      if (error.response?.status === 400) {
        alert(`Payment error: ${error.response.data.error || 'Invalid request'}`);
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    }
  };

  // Campus Job Drives data
  const campusJobDrives = {
    title: "Campus Job Drives",
    desc: "Apply to exclusive company roles",
    color: "purple",
    link: <Link to="/campus-job-drives" className="text-primary text-decoration-none">
      → View Opportunities
    </Link>,
  };

  if (isAuthChecking) {
    return <div className="text-center py-5">Checking access...</div>;
  }

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

        <div className="container d-flex justify-content-between align-items-center py-2 px-3">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: "35px" }} className="responsive-img" />

          <div className="dropdown">
            <button
              className="btn p-0 border-0 bg-transparent position-relative touch-target"
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
                      className="responsive-img"
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
                <i className="bi bi-chevron-down text-muted d-none d-sm-inline" style={{ fontSize: "0.7rem" }}></i>
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
                type="button"
                onClick={handleLogout}
                className="dropdown-item py-2 px-3 d-flex align-items-center gap-2 text-danger"
              >
                <i className="bi bi-box-arrow-right fs-5"></i>
                <span>Logout</span>
              </button>
            </ul>
          </div>
        </div>
      </div>


      {/* Main Container */}
      <div className="container py-3 py-md-4 bg-light position-relative">
        {/* Welcome Section */}
        <section
          className="rounded-4 overflow-hidden p-3 p-md-4 mb-3 mb-md-4 text-white position-relative"
          style={{
            background: "linear-gradient(135deg, #18cc60c4 0%, #3a0ca3 100%)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            border: "none",
            transition: "all 0.3s ease",
            zIndex: 1
          }}
        >
          {/* Decorative elements */}
          <div
            className="position-absolute top-0 end-0 w-50 h-100 d-none d-md-block"
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
            {/* Left Content */}
            <div className="col-12 col-md-7 text-center text-md-start mb-3 mb-md-0">
              <h3 className="fw-bold mb-2" style={{
                fontSize: "clamp(1.5rem, 4vw, 1.8rem)",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                lineHeight: "1.2"
              }}>
                Welcome {username}!
              </h3>
              <p
                className="fs-6 fs-md-5 mb-0 opacity-90"
                style={{
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  maxWidth: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: "0.5rem"
                }}
              >
                You're one step closer to landing your dream job.
              </p>
            </div>

            {/* Right Content */}
            <div className="col-12 col-md-5">
              <div
                className="text-white p-3 rounded-3"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(5px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  maxWidth: "400px",
                  margin: "0 auto"
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                  <h6 className="mb-0 d-flex align-items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: "1.1rem" }}>📊</span>
                    <span className="d-none d-sm-inline">Profile Completion</span>
                    <span className="d-inline d-sm-none">Progress</span>
                  </h6>
                  <span className="fw-bold" style={{ fontSize: "1.1rem" }}>{progress}%</span>
                </div>

                {/* Progress Container */}
                <div className="position-relative">
                  {/* Progress Bar */}
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

                  {/* Complete Now Link */}
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

        {/* Success/Error Alert for External Job Applications */}
        {applicationMessage.message && (
          <div className={`alert alert-${applicationMessage.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
            <i className={`bi ${applicationMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {applicationMessage.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setApplicationMessage({ type: "", message: "" })}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Profile Completion Success Message */}
        {progress === 100 && !user?.isPremium && (
          <section className="card mb-4 border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="text-center">
                <div className="mb-3">
                  <span className="display-4 text-success">🎉</span>
                </div>
                <h4 className="text-success mb-3">Profile Completed Successfully!</h4>
                <p className="text-muted mb-4">
                  Congratulations! Your profile is now 100% complete. To unlock premium features and access the career dashboard,
                  please complete your payment of ₹499.
                </p>
                <div className="d-flex flex-column align-items-center gap-2">
                  <button
                    className="btn btn-primary px-4 py-2 rounded-pill fw-medium d-inline-flex align-items-center"
                    style={{
                      background: "linear-gradient(135deg, #ee9043ff 0%, #3a0ca3 100%)",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(67, 97, 238, 0.3)",
                      transition: "all 0.3s ease",
                      minHeight: "44px",
                      fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                      textDecoration: "line-through"
                    }}
                  >
                    Unlock Premium Access for ₹999
                  </button>
                  <button
                    onClick={handleUpgradePayment}
                    className="btn btn-primary px-4 py-2 rounded-pill fw-medium d-inline-flex align-items-center"
                    style={{
                      background: "linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(67, 97, 238, 0.3)",
                      transition: "all 0.3s ease",
                      minHeight: "44px",
                      fontSize: "clamp(0.875rem, 2.5vw, 1rem)"
                    }}
                  >
                    Offer Price ₹499
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Most Recent Jobs - Combined (Website + External) */}
        <section className="card mb-4 border-0 shadow-sm recent-jobs-section">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold" style={{ color: "#2b2d42" }}>Most Recent Jobs</h5>
              </div>
              <Link to="/campus-job-drives" className="text-primary text-decoration-none d-flex align-items-center gap-1">
                View all <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {/* Search and Filter Controls */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search jobs..."
                    value={externalSearchQuery}
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleExternalSearch()}
                  />
                  <button
                    className="btn btn-outline-primary position-absolute end-0 top-0 h-100 border-0"
                    onClick={handleExternalSearch}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Location (optional)"
                  value={externalLocation}
                  onChange={(e) => setExternalLocation(e.target.value)}
                />
              </div>

              {/* Source filter removed per request */}

              <div className="col-12 col-md-3">
                <select
                  className="form-select"
                  value={externalJobType}
                  onChange={(e) => setExternalJobType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            {combinedJobsLoading && (
              <div className="row g-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="col-12 col-md-6 col-lg-4">
                    <div className="recent-card skeleton-card">
                      <div className="skeleton-line w-50 mb-2"></div>
                      <div className="skeleton-line w-25 mb-3"></div>
                      <div className="skeleton-line w-75 mb-2"></div>
                      <div className="skeleton-line w-50 mb-2"></div>
                      <div className="skeleton-line w-60 mb-3"></div>
                      <div className="d-flex justify-content-between">
                        <div className="skeleton-pill w-25"></div>
                        <div className="skeleton-pill w-25"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!combinedJobsLoading && (recentJobsError || externalJobsError) && (
              <div className="alert alert-danger mb-0" role="alert">
                {recentJobsError || externalJobsError}
              </div>
            )}

            {!combinedJobsLoading && combinedJobs.length === 0 && (
              <div className="d-flex align-items-center gap-2 text-muted">
                <i className="bi bi-briefcase"></i>
                <span>No jobs available right now.</span>
              </div>
            )}

            {!combinedJobsLoading && combinedJobs.length > 0 && (
              <div className="row g-3">
                {combinedJobs.map((job) => {
                  // Check if user has already applied to this job
                  const hasApplied = appliedJobs.some(appliedJob => appliedJob.jobId === job._id);

                  return (
                    <div key={job._id} className="col-12 col-md-6 col-lg-4">
                      <div className="recent-card h-100 position-relative">
                        {job.isFeatured && (
                          <span className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark d-flex align-items-center gap-1">
                            <i className="bi bi-star-fill"></i> Featured
                          </span>
                        )}

                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="me-2">
                            <div className="fw-semibold recent-title">{job.jobTitle}</div>
                            <div className="text-primary small fw-medium">{job.companyName}</div>
                            <div className="mt-1">
                              {!job.isExternal && (
                                <span className="badge badge-sm bg-primary" style={{ fontSize: '0.65rem' }}>
                                  Website
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className="badge rounded-pill bg-light text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-briefcase"></i> {job.jobType}
                          </span>
                          <span className="badge rounded-pill bg-light text-muted d-flex align-items-center gap-1">
                            <i className="bi bi-geo-alt"></i> {job.location}
                          </span>
                          {job.applicationDeadline && (
                            <span className="badge rounded-pill bg-light text-muted d-flex align-items-center gap-1">
                              <i className="bi bi-clock"></i>
                              {new Date(job.applicationDeadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {job.salary && (
                            <span className="badge rounded-pill bg-success-subtle text-success-emphasis d-flex align-items-center gap-1">
                              <i className="bi bi-cash-stack"></i> {job.salary}
                            </span>
                          )}
                        </div>
                        <div className="mt-auto d-flex justify-content-between align-items-center">
                          {/* View details (for both website and external) */}
                          <button
                            onClick={() => navigate(`/jobs/${job._id || job.id}`, { state: { job } })}
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1"
                          >
                            View details <i className="bi bi-arrow-right"></i>
                          </button>

                          {/* Apply button */}
                          {job.isExternal ? (
                            (() => {
                              console.log('External job detected:', job.jobTitle, 'ID:', job._id, 'isExternal:', job.isExternal);
                              const hasAppliedExternal = appliedExternalJobs.some(appliedJob => appliedJob.jobId === job._id);
                              return hasAppliedExternal ? (
                                <button className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1" disabled>
                                  <i className="bi bi-check-circle"></i> Applied
                                </button>
                              ) : progress < 70 ? (
                                <button
                                  onClick={() => setShowProfileCompletionModal(true)}
                                  className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                                  title="Complete your profile to apply for jobs"
                                >
                                  <i className="bi bi-box-arrow-up-right"></i> Apply
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    console.log('External job apply clicked:', job);
                                    handleExternalJobApply(job);
                                  }}
                                  className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                                >
                                  <i className="bi bi-box-arrow-up-right"></i> Apply
                                </button>
                              );
                            })()
                          ) : (
                            hasApplied ? (
                              <button className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1" disabled>
                                <i className="bi bi-check-circle"></i> Applied
                              </button>
                            ) : progress < 70 ? (
                              <button
                                onClick={() => setShowProfileCompletionModal(true)}
                                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                                title="Complete your profile to apply for jobs"
                              >
                                <i className="bi bi-send"></i> Apply
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  console.log('Internal job apply clicked:', job.jobTitle, 'ID:', job._id, 'isExternal:', job.isExternal);
                                  handleApplyClick(job);
                                }}
                                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                              >
                                <i className="bi bi-send"></i> Apply
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        {/* Career Certification Program Section */}
        <section className="card mb-4 border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold" style={{ color: "#2b2d42" }}>Career Certification Programs</h5>
              </div>
              <Link to="/career-certificate" className="text-primary text-decoration-none d-flex align-items-center gap-1">
                View all <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <div
                  className="p-4 rounded-3 position-relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white"
                  }}
                >
                  {/* Decorative elements */}
                  <div
                    className="position-absolute top-0 end-0 w-50 h-100 d-none d-md-block"
                    style={{
                      background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)",
                      zIndex: 0
                    }}
                  ></div>

                  <div className="row align-items-center position-relative" style={{ zIndex: 1 }}>
                    <div className="col-md-8">
                      <h4 className="fw-bold mb-3">
                        <i className="bi bi-award me-2"></i>
                        Boost Your Career with Industry-Ready Certifications
                      </h4>
                      <p className="mb-3 opacity-90">
                        Choose from IT and Non-Technical tracks. Get certified and stand out in the job market with our comprehensive courses.
                      </p>
                      <div className="d-flex flex-wrap gap-3 mb-3">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <span>Expert-led Courses</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <span>Flexible Learning</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <span>Industry Certificates</span>
                        </div>
                      </div>
                      <Link
                        to="/career-certificate"
                        className="btn btn-light rounded-pill px-4 py-2 fw-medium d-inline-flex align-items-center"
                        style={{
                          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                        }}
                      >
                        Explore Courses
                        <i className="bi bi-arrow-right ms-2"></i>
                      </Link>
                    </div>
                    <div className="col-md-4 d-none d-md-flex justify-content-center">
                      <div className="text-center">
                        <i className="bi bi-mortarboard" style={{ fontSize: "5rem", opacity: 0.9 }}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Inline Job Details Modal */}
        <Modal show={showJobDetails} onHide={() => setShowJobDetails(false)} size="lg" fullscreen="md-down" centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <div className="d-flex align-items-start">
              <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 flex-shrink-0">
                <Building size={32} className="text-primary" />
              </div>
              <div>
                <Modal.Title className="fw-bold mb-1" style={{ fontSize: '1.5rem', color: '#2c3e50' }}>
                  {selectedJob?.jobTitle}
                </Modal.Title>
                {selectedJob?.companyName && (
                  <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>{selectedJob.companyName}</p>
                )}

                {/* Applied badge in modal header */}
                {selectedJob && appliedJobs.some(appliedJob => appliedJob.jobId === selectedJob._id) && (
                  <span className="badge bg-success mt-2 d-inline-flex align-items-center gap-1">
                    <i className="bi bi-check-circle-fill"></i> Applied
                  </span>
                )}
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="pt-4">
            {selectedJob && (
              <>
                {/* Key Details Ribbon */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                    <Briefcase className="text-primary me-2" size={16} />
                    <span className="fw-medium">{selectedJob.jobType}</span>
                  </div>
                  <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                    <GeoAlt className="text-primary me-2" size={16} />
                    <span className="fw-medium">{selectedJob.location}</span>
                  </div>
                  {selectedJob.salary && (
                    <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                      <CashStack className="text-primary me-2" size={16} />
                      <span className="fw-medium text-success">{selectedJob.salary}</span>
                    </div>
                  )}
                  <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                    <Clock className="text-primary me-2" size={16} />
                    <span className="fw-medium">Apply by {formatDate(selectedJob.applicationDeadline)}</span>
                  </div>
                </div>

                {/* Job Information Section */}
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <FileText size={18} className="text-primary" />
                    </span>
                    Job Information
                  </h4>

                  <div className="ps-4 ms-3">
                    <div className="mb-3">
                      <div className="mb-2">
                        <span className="fw-medium me-2">Department:</span>
                        <span>{selectedJob.department || 'Not specified'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="fw-medium me-2">Experience Level:</span>
                        <span>{selectedJob.experienceLevel || 'Any'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="fw-medium me-2">Employment Type:</span>
                        <span>{selectedJob.employmentType || 'Not specified'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="fw-medium me-2">Industry Type:</span>
                        <span>{selectedJob.industryType || 'Not specified'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="fw-medium me-2">Role:</span>
                        <span>{selectedJob.role || 'Not specified'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="fw-medium me-2">Role Category:</span>
                        <span>{selectedJob.roleCategory || 'Not specified'}</span>
                      </div>
                      {selectedJob.band && (
                        <div className="mb-2">
                          <span className="fw-medium me-2">Band:</span>
                          <span>{selectedJob.band}</span>
                        </div>
                      )}
                      {selectedJob.qualification && (
                        <div className="mb-2">
                          <span className="fw-medium me-2">Qualification:</span>
                          <span>{selectedJob.qualification}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <Calendar size={18} className="text-primary" />
                    </span>
                    Additional Information
                  </h4>

                  <div className="ps-4 ms-3">
                    <div className="mb-2">
                      <span className="fw-medium me-2">Posted On:</span>
                      <span>{formatDate(selectedJob.createdAt)}</span>
                    </div>
                    <div className="mb-2">
                      <span className="fw-medium me-2">Application Deadline:</span>
                      <span>{formatDate(selectedJob.applicationDeadline)}</span>
                    </div>
                    {selectedJob.shift && (
                      <div className="mb-2">
                        <span className="fw-medium me-2">Shift:</span>
                        <span>{selectedJob.shift}</span>
                      </div>
                    )}
                    {(selectedJob.vacancies || selectedJob.maxApplications) && (
                      <div className="mb-2">
                        <span className="fw-medium me-2">Vacancies:</span>
                        <span>{selectedJob.vacancies ?? selectedJob.maxApplications}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <FileText size={18} className="text-primary" />
                    </span>
                    Job Description
                  </h4>
                  <div className="bg-light p-4 rounded-3">
                    {selectedJob.description || 'No description provided.'}
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <Layers size={18} className="text-primary" />
                    </span>
                    Responsibilities
                  </h4>
                  <div className="bg-light p-4 rounded-3">
                    {selectedJob.responsibility ? (
                      <ul className="mb-0">
                        {selectedJob.responsibility.split('\n').map((item, index) => (
                          item.trim() && <li key={index} className="mb-2">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      'No responsibilities provided.'
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h4 className="mb-3 d-flex align-items-center">
                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                      <FileEarmark size={18} className="text-primary" />
                    </span>
                    Requirements
                  </h4>
                  <div className="bg-light p-4 rounded-3">
                    {selectedJob.requirements ? (
                      <ul className="mb-0">
                        {selectedJob.requirements.split('\n').map((item, index) => (
                          item.trim() && <li key={index} className="mb-2">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      'No specific requirements listed.'
                    )}
                  </div>
                </div>

                {/* Skills */}
                {selectedJob.essentialHiringSkills?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-3 d-flex align-items-center">
                      <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                        <Star size={18} className="text-primary" />
                      </span>
                      Essential Hiring Skills
                    </h4>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedJob.essentialHiringSkills.map((s, idx) => (
                        <Badge key={`ess-${idx}`} bg="primary" pill className="px-3 py-2">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.keySkills?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-3 d-flex align-items-center">
                      <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                        <Layers size={18} className="text-primary" />
                      </span>
                      Key Skills
                    </h4>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedJob.keySkills.map((s, idx) => (
                        <Badge key={`key-${idx}`} bg="info" pill className="px-3 py-2">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* About Company */}
                {selectedJob.aboutCompany && (
                  <div className="mb-4">
                    <h4 className="mb-3 d-flex align-items-center">
                      <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                        <Building size={18} className="text-primary" />
                      </span>
                      About Company
                    </h4>
                    <div className="bg-light p-4 rounded-3">
                      {selectedJob.aboutCompany}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex justify-content-between gap-3 pt-4 border-top">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowJobDetails(false)}
                    className="rounded-pill px-4 py-2 d-flex align-items-center"
                  >
                    <X className="me-2" size={18} />
                    Close
                  </Button>

                  {/* Conditional Apply Button */}
                  {appliedJobs.some(appliedJob => appliedJob.jobId === selectedJob._id) ? (
                    <Button
                      variant="success"
                      className="rounded-pill px-4 py-2 d-flex align-items-center"
                      disabled
                    >
                      <CheckCircle className="me-2" size={18} />
                      Applied
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowJobDetails(false);
                        handleApplyClick(selectedJob);
                      }}
                      className="rounded-pill px-4 py-2 d-flex align-items-center"
                    >
                      <Briefcase className="me-2" size={18} />
                      Apply
                    </Button>
                  )}
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>

        {/* Inline Apply Modal */}
        <Modal show={showApplyModal} onHide={() => setShowApplyModal(false)} size="lg" centered>
          <Modal.Header className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              Apply for {selectedJob?.jobTitle} at {selectedJob?.companyName}
            </Modal.Title>
            <Button variant="link" onClick={() => setShowApplyModal(false)} className="p-1 rounded-circle">
              <i className="bi bi-x-lg" />
            </Button>
          </Modal.Header>
          <Modal.Body className="pt-0">
            {selectedJob && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body className="p-3">
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2"><i className="bi bi-building me-2 text-muted" /> <span className="fw-medium">Company:</span> {selectedJob.companyName}</p>
                      <p className="mb-2"><i className="bi bi-geo-alt me-2 text-muted" /> <span className="fw-medium">Location:</span> {selectedJob.location}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2"><i className="bi bi-briefcase me-2 text-muted" /> <span className="fw-medium">Type:</span> {selectedJob.jobType}</p>
                      {selectedJob.salary && (
                        <p className="mb-2"><i className="bi bi-cash-stack me-2 text-muted" /> <span className="fw-medium">Salary:</span> {selectedJob.salary}</p>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {applicationMessage.message && (
              <div className={`alert alert-${applicationMessage.type} rounded-3`} role="alert">{applicationMessage.message}</div>
            )}

            <Form onSubmit={handleApplicationSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center fw-medium"><i className="bi bi-person me-2" /> Full Name</Form.Label>
                <Form.Control type="text" name="userName" value={applicationData.userName} onChange={handleApplicationChange} placeholder="Your full name" required className="py-2 rounded-3" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center fw-medium"><i className="bi bi-envelope me-2" /> Email Address</Form.Label>
                <Form.Control type="email" name="email" value={applicationData.email} onChange={handleApplicationChange} placeholder="Your email address" required className="py-2 rounded-3" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center fw-medium"><i className="bi bi-file-earmark me-2" /> Resume/CV</Form.Label>
                <Form.Control type="file" name="resume" onChange={handleApplicationChange} accept=".pdf,.doc,.docx" required className="py-2 rounded-3" />
                <Form.Text className="text-muted small">PDF, DOC, or DOCX files (Max 5MB)</Form.Text>
              </Form.Group>
              <div className="d-flex justify-content-end gap-2 pt-2">
                <Button variant="outline-secondary" onClick={() => setShowApplyModal(false)} disabled={isSubmitting} className="rounded-pill px-4">Cancel</Button>
                <Button variant="primary" type="submit" disabled={isSubmitting} className="rounded-pill px-4">
                  {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Submitting...</>) : (<>Submit Application</>)}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Profile Completion Modal */}
        <Modal show={showProfileCompletionModal} onHide={() => setShowProfileCompletionModal(false)} centered>
          <Modal.Header className="border-0 pb-0">
            <Modal.Title className="fw-bold text-warning">
              <i className="bi bi-star me-2"></i>
              Complete Your Profile
            </Modal.Title>
            <Button
              variant="link"
              onClick={() => setShowProfileCompletionModal(false)}
              className="p-1 rounded-circle"
            >
              <i className="bi bi-x-lg" />
            </Button>
          </Modal.Header>

          <Modal.Body className="pt-0">
            <div className="text-center mb-4">
              <div className="mb-3">
                <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-star text-warning" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
              <h5 className="fw-bold mb-3">Profile Completion Required</h5>
              <p className="text-muted mb-4">
                Your profile is currently <strong>{progress}% complete</strong>.
                To apply for jobs, you need to complete your profile first.
              </p>
            </div>

            <Card className="border-warning bg-warning bg-opacity-5 mb-4">
              <Card.Body className="p-3">
                <h6 className="fw-bold mb-3 text-warning">
                  <i className="bi bi-check2 me-2"></i>
                  What you need to complete:
                </h6>
                <ul className="list-unstyled mb-0 small">
                  <li className="mb-2">
                    <i className="bi bi-check2 me-2 text-success"></i>
                    Personal information (Name, Email, Phone)
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check2 me-2 text-success"></i>
                    Professional title and objective
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check2 me-2 text-success"></i>
                    Skills and certifications
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check2 me-2 text-success"></i>
                    Work experience and education
                  </li>
                  <li className="mb-0">
                    <i className="bi bi-check2 me-2 text-success"></i>
                    Resume upload
                  </li>
                </ul>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="outline-secondary"
                onClick={() => setShowProfileCompletionModal(false)}
                className="rounded-pill px-4"
              >
                Maybe Later
              </Button>
              <Button
                variant="warning"
                onClick={() => {
                  setShowProfileCompletionModal(false);
                  setShowModeModal(true);
                }}
                className="rounded-pill px-4 d-flex align-items-center"
              >
                <i className="bi bi-star me-2"></i>
                Complete Profile
              </Button>
            </div>
          </Modal.Body>
        </Modal>

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

        <style>{`
          .recent-jobs-section {
            border-radius: 16px;
            overflow: hidden;
          }
          .recent-burst { filter: hue-rotate(10deg); font-size: 1.1rem; }
          .recent-card {
            background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
            border: 1px solid rgba(13,110,253,0.08);
            border-radius: 14px;
            padding: 16px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
          }
          .recent-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 24px rgba(0,0,0,0.08);
            border-color: rgba(13,110,253,0.18);
          }
          .recent-title { color: #2b2d42; }
          .skeleton-card {
            border-radius: 14px;
            padding: 16px;
            background: #fff;
            border: 1px solid rgba(0,0,0,0.05);
          }
          .skeleton-line {
            height: 12px;
            background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
            background-size: 400% 100%;
            animation: shimmer 1.2s ease-in-out infinite;
            border-radius: 6px;
          }
          .skeleton-pill {
            height: 28px;
            background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
            background-size: 400% 100%;
            animation: shimmer 1.2s ease-in-out infinite;
            border-radius: 999px;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .container {
              padding-left: 15px;
              padding-right: 15px;
            }
            
            .recent-card {
              padding: 12px;
              margin-bottom: 1rem;
            }
            
            .recent-title {
              font-size: 1rem;
              line-height: 1.3;
            }
            
            .badge {
              font-size: 0.75rem;
              padding: 0.25rem 0.5rem;
            }
            
            .btn-sm {
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
            }
            
            .d-flex.flex-wrap.gap-2 {
              gap: 0.5rem !important;
            }
            
            .d-flex.flex-wrap.gap-2 .badge {
              margin-bottom: 0.25rem;
            }
            
            .mt-auto.d-flex.justify-content-between.align-items-center {
              flex-direction: column;
              gap: 0.75rem;
              align-items: stretch !important;
            }
            
            .mt-auto.d-flex.justify-content-between.align-items-center .btn {
              width: 100%;
              margin-bottom: 0.5rem;
            }
            
            .mt-auto.d-flex.justify-content-between.align-items-center .btn:last-child {
              margin-bottom: 0;
            }
          }
          
          @media (max-width: 576px) {
            .recent-card {
              padding: 10px;
            }
            
            .recent-title {
              font-size: 0.95rem;
            }
            
            .badge {
              font-size: 0.7rem;
              padding: 0.2rem 0.4rem;
            }
            
            .btn-sm {
              padding: 0.25rem 0.5rem;
              font-size: 0.8rem;
            }
            
            .d-flex.flex-wrap.gap-2 {
              gap: 0.25rem !important;
            }
          }
          
          @media (max-width: 480px) {
            .recent-card {
              padding: 8px;
            }
            
            .recent-title {
              font-size: 0.9rem;
            }
            
            .badge {
              font-size: 0.65rem;
              padding: 0.15rem 0.3rem;
            }
            
            .btn-sm {
              padding: 0.2rem 0.4rem;
              font-size: 0.75rem;
            }
            
            /* Premium features section mobile optimization */
            .card-body {
              padding: 1rem !important;
            }
            
            .d-flex.justify-content-between.align-items-start {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            
            .d-flex.justify-content-between.align-items-start > div {
              width: 100% !important;
              text-align: center !important;
            }
            
            .badge.position-relative {
              align-self: center !important;
              margin-top: 1rem !important;
            }
            
            .row.g-3 > div {
              margin-bottom: 0.75rem !important;
            }
            
            .p-3.rounded.d-flex.align-items-center {
              padding: 0.75rem !important;
              min-height: 70px !important;
            }
            
            .me-3.flex-shrink-0 {
              width: 35px !important;
              height: 35px !important;
            }
            
            .bi.fs-5 {
              font-size: 1rem !important;
            }
          }
        `}</style>

        {/* Locked Features */}
        <section className="card mb-4 border-0" style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)",
          boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
          borderRadius: "12px",
          overflow: "hidden"
        }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap">
              <div className="mb-3 mb-md-0">
                <h4 className="fw-bold mb-2" style={{ color: "#2b2d42", fontSize: "clamp(1.25rem, 3vw, 1.5rem)" }}>Unlock Premium Features</h4>
                <p className="text-muted mb-0" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>Upgrade to continue your career journey with advanced tools</p>
              </div>
              <span className="badge position-relative overflow-hidden py-2 px-3 rounded-pill fw-medium"
                style={{
                  background: 'rgba(255, 193, 7, 0.12)',
                  color: '#ffc107',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                  letterSpacing: '0.03em',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(255, 193, 7, 0.1)',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                {/* Shimmer effect overlay */}
                <span className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transform: 'translateX(-100%)',
                    animation: 'shimmer 2.5s infinite'
                  }}></span>

                <i className="bi bi-stars me-1" style={{
                  textShadow: '0 0 6px rgba(255, 193, 7, 0.4)',
                  animation: 'pulse 2s infinite alternate'
                }}></i>
                <span>Premium Access</span>
              </span>
            </div>

            <div className="row g-3">
              {[
                { icon: "bi-clipboard-check", text: "Online Skill Assessment Test", color: "#4361ee" },
                { icon: "bi-file-earmark-person", text: "AI Resume Builder", color: "#3a0ca3" },
                { icon: "bi-calendar-check", text: "Interview Slot Booking", color: "#4895ef" },
                { icon: "bi-building", text: "Campus Job Drives", color: "#4cc9f0" },
                { icon: "bi-person-lines-fill", text: "Career Guidance Call", color: "#7209b7" },
                { icon: "bi-award", text: "Career Readiness Certificate", color: "#f72585" },
              ].map((item, idx) => (
                <div className="col-12 col-md-6" key={idx}>
                  <div className="p-3 rounded d-flex align-items-center" style={{
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                    height: "100%",
                    minHeight: "80px"
                  }}>
                    <div className="me-3 flex-shrink-0" style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: `${item.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <i className={`bi ${item.icon} fs-5`} style={{ color: item.color }}></i>
                    </div>
                    <span className="fw-medium" style={{ color: "#2b2d42", fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-4 pt-2">
              <div className="d-flex flex-column align-items-center gap-2">
                <button

                  className="btn btn-primary px-4 py-2 rounded-pill fw-medium d-inline-flex align-items-center"
                  style={{
                    background: "linear-gradient(135deg, #ee9043ff 0%, #3a0ca3 100%)",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(67, 97, 238, 0.3)",
                    transition: "all 0.3s ease",
                    minHeight: "44px",
                    fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                    textDecoration: "line-through"
                  }}
                >
                  Unlock Premium Access for ₹999
                </button>
                <button
                  onClick={handleUpgradePayment}
                  className="btn btn-primary px-4 py-2 rounded-pill fw-medium d-inline-flex align-items-center"
                  style={{
                    background: "linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(67, 97, 238, 0.3)",
                    transition: "all 0.3s ease",
                    minHeight: "44px",
                    fontSize: "clamp(0.875rem, 2.5vw, 1rem)"
                  }}
                >
                  Offer Price ₹499
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-white text-black pt-5 pb-4 border-top">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-3">
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    <img src="/logo.jpeg" alt="JobilioHR Logo" style={{ height: '40px', objectFit: 'contain' }} />
                  </div>
                  <span className="fs-5 fw-bold"></span>
                </div>
                <div className="mb-4">
                  <p className="mb-1 d-flex align-items-center">
                    <i className="bi bi-geo-alt me-2"></i> Magarpatta City, Hadapsar, Pune, Maharashtra - 411013
                  </p>
                  <p className="mb-0 d-flex align-items-center">
                    <i className="bi bi-clock me-2"></i> Mon–Sat, 9am–7pm
                  </p>
                </div>


              </div>
              <div className="col-lg-2 col-md-4">
                <h6 className="fw-bold mb-3">Quick Links</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <Link
                      to="/about"
                      className="text-dark text-decoration-none opacity-75 hover-opacity-100"
                    >
                      About us
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link
                      to="/contact"
                      className="text-dark text-decoration-none opacity-75 hover-opacity-100"
                    >
                      Contact us
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-lg-2 col-md-4">
                <h6 className="fw-bold mb-3">Legal</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <Link to="/privacy" className="text-dark text-decoration-none opacity-75 hover-opacity-100">
                      Privacy policy
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/terms" className="text-dark text-decoration-none opacity-75 hover-opacity-100">
                      Terms & conditions
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-lg-2 col-md-4">
                <h6 className="fw-bold mb-3">Connect With Us</h6>
                <ul className="list-unstyled">
                  <li className="mb-2 d-flex align-items-center">
                    <i className="bi bi-envelope me-2"></i>
                    info@jobiliohr.com
                  </li>
                  <li className="mb-2 d-flex align-items-center">
                    <i className="bi bi-telephone me-2"></i>
                    +91 74994 32816
                  </li>

                </ul>
              </div>
              <div className="col-lg-3 col-md-4">
                <h6 className="fw-bold mb-3">Follow Us</h6>
                <div className="d-flex gap-3">
                  <a
                    href="https://www.facebook.com/JobioHR"
                    className="text-decoration-none text-dark"
                    aria-label="JobioHR on Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-facebook fs-5"></i>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/jobiohr"
                    className="text-decoration-none text-dark"
                    aria-label="JobioHR on LinkedIn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-linkedin fs-5"></i>
                  </a>
                  <a
                    href="https://twitter.com/JobioHR"
                    className="text-decoration-none text-dark"
                    aria-label="JobioHR on Twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-twitter-x fs-5"></i>
                  </a>
                  <a
                    href="https://www.instagram.com/jobiliohr?igsh=MTYyc2k4NDkwaXhmZQ=="
                    className="text-decoration-none text-dark"
                    aria-label="JobioHR on Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-instagram fs-5"></i>
                  </a>
                </div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="text-center text-secondary">
              <p className="mb-0">JobilioHR © {new Date().getFullYear()}.All rights reserved.Powered by Rokoso Technology Service Pvt Ltd.</p>

            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CandidateDashboard;