import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaHome } from 'react-icons/fa';
import { format, parseISO } from "date-fns";
import API from "../../../api";
import { requireLogin } from '../../../utils/requireLogin';
import { requirePremium } from '../../../utils/requirePremium';
import {
  FaStar, FaRegStar, FaCalendarAlt, FaClock, FaUserTie,
  FaCheckCircle, FaTimesCircle
} from "react-icons/fa";

function InterviewDetails() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth guard - check login first, then premium access
  useEffect(() => {
    (async () => {
      const isAuthenticated = await requireLogin(navigate);
      if (!isAuthenticated) return;
      
      const user = await requirePremium(navigate);
      if (!user) return;
      
      setIsAuthChecking(false);
    })();
  }, [navigate]);

  const fetchInterviewDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get(`/api/interview/bookings/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterview(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch interview details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewDetails();
  }, [interviewId]);

  if (isAuthChecking || loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status" />
      <p className="mt-3">{isAuthChecking ? "Checking access..." : "Loading interview details..."}</p>
    </div>
  );

  if (error) return (
    <div className="container py-5 text-center">
      <div className="alert alert-danger">
        <h4>Error Loading Interview</h4>
        <p>{error}</p>
        <button className="btn btn-outline-primary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );

  if (!interview) return (
    <div className="container py-5 text-center">
      <div className="alert alert-info">
        <h4>Interview Not Found</h4>
        <Link to="/interviews" className="btn btn-outline-primary">
          View Your Interviews
        </Link>
      </div>
    </div>
  );

  const renderCombinedInterviewCard = () => (
    <div className="card shadow-sm mb-4 text-center">
      <div className="card-header bg-light">
        <h5 className="mb-0 d-flex align-items-center justify-content-center">
          <FaUserTie className="me-2" /> Interview Details
        </h5>
      </div>
      <div className="card-body">

        {/* Interviewer Avatar & Info */}
        <div className="d-flex flex-column align-items-center mb-4">
          {interview.interviewer?.avatar ? (
            <img
              src={interview.interviewer.avatar}
              alt={interview.interviewer.name}
              className="rounded-circle mb-3"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
          ) : (
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-3"
              style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}>
              {interview.interviewer?.name?.charAt(0) || 'I'}
            </div>
          )}
          <h4>{interview.interviewer?.name || "Not assigned"}</h4>
          <p className="text-muted">{interview.interviewer?.role || "Interviewer"}</p>
          <div className="d-flex justify-content-center mb-2">
            {[...Array(5)].map((_, i) => (
              i < Math.floor(interview.interviewer?.rating || 0) ?
                <FaStar key={i} className="text-warning me-1" /> :
                <FaRegStar key={i} className="text-warning me-1" />
            ))}
            <span className="small text-muted ms-2">
              {interview.interviewer?.rating?.toFixed(1) || "N/A"} ({interview.interviewer?.interviewCount || 0} interviews)
            </span>
          </div>
          {interview.interviewer?.expertise && (
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
              {interview.interviewer.expertise.split(',').map((skill, i) => (
                <span key={i} className="badge bg-light text-dark">{skill.trim()}</span>
              ))}
            </div>
          )}
        </div>

        {/* Interview Info */}
        <div className="row justify-content-center">
          <div className="col-md-6">
            <ul className="list-group list-group-flush text-start">
              <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                <span className="text-muted">Type:</span>
                <span className="fw-bold">{interview.interviewType}</span>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                <span className="text-muted">Meeting Link:</span>
                {interview.meetingLink ? (
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm fw-bold"
                    style={{ backgroundColor: '#28a745', color: 'white' }}
                  >
                    Join Meeting
                  </a>
                ) : (
                  <span className="text-muted">Not available</span>
                )}
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                <span className="text-muted">Status:</span>
                <span className={`badge bg-${getStatusColor(interview.status)}`}>
                  {interview.status}
                </span>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                <span className="text-muted"><FaCalendarAlt className="me-2" />Date:</span>
                <span className="fw-bold">{interview.date && format(parseISO(interview.date), "PPP")}</span>
              </li>
              <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                <span className="text-muted"><FaClock className="me-2" />Time:</span>
                <span className="fw-bold">{interview.time}</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );

  const renderResults = () => {
    if (interview.status !== "Completed") return null;
    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Interview Results</h5>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center mb-4">
            <div className={`rounded-circle ${interview.result.passed ? "bg-success" : "bg-danger"} text-white d-flex align-items-center justify-content-center me-3`}
              style={{ width: "60px", height: "60px" }}>
              {interview.result.passed ? (
                <FaCheckCircle size={28} />
              ) : (
                <FaTimesCircle size={28} />
              )}
            </div>
            <div>
              <h4 className="mb-1">
                {interview.result.passed ? "Passed" : "Needs Improvement"}
              </h4>
              <h2 className="mb-0">
                {interview.result.score}<small className="text-muted fs-6">/100</small>
              </h2>
            </div>
          </div>

          <div className="mb-4">
            <h6>Feedback</h6>
            <div className="card bg-light border-0 p-3">
              <p className="mb-0">{interview.result.feedback}</p>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <h6>Strengths</h6>
              <ul className="list-group list-group-flush mb-3">
                {interview.result.strengths.length > 0 ? (
                  interview.result.strengths.map((strength, i) => (
                    <li key={i} className="list-group-item px-0 py-1 border-0">
                      <span className="badge bg-success me-2">✓</span>
                      {strength}
                    </li>
                  ))
                ) : (
                  <li className="list-group-item px-0 py-1 border-0 text-muted">
                    No strengths noted
                  </li>
                )}
              </ul>
            </div>
            <div className="col-md-6">
              <h6>Areas to Improve</h6>
              <ul className="list-group list-group-flush mb-3">
                {interview.result.areasToImprove.length > 0 ? (
                  interview.result.areasToImprove.map((area, i) => (
                    <li key={i} className="list-group-item px-0 py-1 border-0">
                      <span className="badge bg-warning me-2">!</span>
                      {area}
                    </li>
                  ))
                ) : (
                  <li className="list-group-item px-0 py-1 border-0 text-muted">
                    No areas to improve noted
                  </li>
                )}
              </ul>
            </div>
          </div>

          {interview.result.recommendations.length > 0 && (
            <div>
              <h6>Recommendations</h6>
              <div className="card bg-light border-0 p-3">
                <ul className="mb-0">
                  {interview.result.recommendations.map((rec, i) => (
                    <li key={i} className="mb-1">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
        <div className="container-fluid px-3 px-md-4">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img src="/logo.jpeg" alt="Company Logo" style={{ height: "40px", marginRight: "10px" }} />
          </Link>
          <div className="ms-auto">
            <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
              <FaHome className="me-1" />
              <span className="d-none d-sm-inline">Dashboard</span>
              <span className="d-inline d-sm-none">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Interview Details</h2>
        </div>

        {renderCombinedInterviewCard()}
        {interview.status === "Completed" && renderResults()}

        {interview.status === "Scheduled" && (
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              className="btn btn-outline-danger"
              onClick={async () => {
                if (!window.confirm('Cancel this interview?')) return;
                try {
                  await API.post(`/api/interview/bookings/${interview._id}/cancel`);
                  navigate('/career-dashboard');
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to cancel interview');
                }
              }}
            >
              Cancel Interview
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'Completed': return 'success';
    case 'Cancelled': return 'danger';
    case 'Scheduled': return 'info';
    case 'Rescheduled': return 'warning';
    default: return 'secondary';
  }
}

export default InterviewDetails;
