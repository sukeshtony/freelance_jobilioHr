import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../../api";
import { FaCalendarAlt, FaClock, FaUser, FaCheckCircle, FaTimesCircle, FaPhone } from "react-icons/fa";
import { parseISO, format } from "date-fns";

function CallDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCall = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/api/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCall(res.data.data);
      } catch (err) {
        setError("Failed to fetch call details");
      } finally {
        setLoading(false);
      }
    };

    fetchCall();
  }, [id]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" />
      <p className="mt-3">Loading call details...</p>
    </div>
  );

  if (error) return (
    <div className="container py-5 text-center">
      <div className="alert alert-danger">
        <h4>Error</h4>
        <p>{error}</p>
        <button className="btn btn-outline-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
        <div className="container-fluid px-4">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img src="/logo.jpeg" alt="Logo" style={{ height: "40px", marginRight: "10px" }} />
          </Link>
          <div className="d-flex">
            <button onClick={() => navigate(-1)} className="btn btn-outline-dark">Dashboard</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-4">
        <h2 className="mb-4">Call Booking Details</h2>

        <div className="card shadow-sm text-center">
          <div className="card-header bg-light">
            <h5 className="mb-0 d-flex align-items-center justify-content-center">
              <FaPhone className="me-2" /> Career Guidance Call
            </h5>
          </div>
          <div className="card-body">
            {/* Caller Info */}
            <div className="d-flex flex-column align-items-center mb-4">
              <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center mb-3"
                style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}>
                {call.name?.charAt(0) || "U"}
              </div>
              <h4>{call.name}</h4>
              <p className="text-muted">{call.email}</p>
              <span className="badge bg-secondary">{call.phone}</span>
            </div>

            {/* Call Info */}
            <div className="row justify-content-center">
              <div className="col-md-6">
                <ul className="list-group list-group-flush text-start">
                  <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                    <span className="text-muted"><FaCalendarAlt className="me-2" />Date:</span>
                    <span className="fw-bold">{format(parseISO(call.date), "PPP")}</span>
                  </li>
                  <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                    <span className="text-muted"><FaClock className="me-2" />Time:</span>
                    <span className="fw-bold">{call.time}</span>
                  </li>
                  <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                    <span className="text-muted">Status:</span>
                    <span className={`badge bg-${getStatusColor(call.status)}`}>{call.status}</span>
                  </li>
                  <li className="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
                    <span className="text-muted">Expert:</span>
                    <span>{call.expert || "To be assigned"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "completed": return "success";
    case "cancelled": return "danger";
    case "scheduled": return "info";
    default: return "secondary";
  }
}

export default CallDetails;
