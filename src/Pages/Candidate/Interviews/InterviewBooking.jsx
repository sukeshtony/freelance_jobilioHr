import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaStar, FaRegStar, FaCalendarAlt, FaClock, FaHome } from "react-icons/fa";
import API from "../../../api";
import { format, parseISO } from "date-fns";
import { requireLogin } from '../../../utils/requireLogin';
import { requirePremium } from '../../../utils/requirePremium';

function InterviewBooking() {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [currentStep, setCurrentStep] = useState("selectType");
  const [selectedExpert, setSelectedExpert] = useState({
    type: null,
    id: null,
    name: "",
    avatar: "",
    title: "",
    skills: [],
    category: "",
    rating: 0,
    interviewCount: 0,
    availability: [],
    defaultSlots: []
  });
  const [availableExperts, setAvailableExperts] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState({
    experts: false,
    bookings: false,
    dates: false,
    slots: false
  });
  const [error, setError] = useState(null);

  // Helpers to prevent booking past timeslots (same logic as exam booking)
  const toMinutes = (t) => {
    if (!t) return 0;
    try {
      const [timePart, meridiem] = t.trim().split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    } catch {
      return 0;
    }
  };

  const isPastSlot = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr !== todayStr) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return toMinutes(timeStr) <= currentMinutes;
  };

  const fetchBookings = async () => {
    try {
      setLoading(prev => ({ ...prev, bookings: true }));
      const response = await API.get("/api/interview/bookings");
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  const fetchExperts = async (type) => {
    try {
      setLoading(prev => ({ ...prev, experts: true }));
      const response = await API.get(`/api/admin/interviewers/by-category?category=${type}`);
      setAvailableExperts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch experts");
    } finally {
      setLoading(prev => ({ ...prev, experts: false }));
    }
  };

  const fetchAvailableDates = async (expertId) => {
    try {
      setLoading(prev => ({ ...prev, dates: true }));
      const response = await API.get(`/api/admin/interviewers/${expertId}/availability`);
      
      if (response.data.availableDates && response.data.availableDates.length > 0) {
        setAvailableDates(response.data.availableDates);
      } 
      else if (response.data.availability && response.data.availability.length > 0) {
        const generatedDates = generateAvailableDates(response.data.availability);
        setAvailableDates(generatedDates);
      } else {
        setAvailableDates([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch available dates");
      setAvailableDates([]);
    } finally {
      setLoading(prev => ({ ...prev, dates: false }));
    }
  };

  const generateAvailableDates = (availableDays) => {
    const dates = [];
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i <= 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      
      if (availableDays.includes(dayName)) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  const fetchAvailableTimes = async (expertId, selectedDate) => {
    try {
      setLoading(prev => ({ ...prev, slots: true }));
      const response = await API.get(
        `/api/admin/interviewers/${expertId}/slots?date=${selectedDate}`
      );
      setAvailableTimes(response.data.timeSlots || selectedExpert.defaultSlots || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch available times");
      setAvailableTimes(selectedExpert.defaultSlots || []);
    } finally {
      setLoading(prev => ({ ...prev, slots: false }));
    }
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();

    if (!date || !time || !selectedExpert.id) {
      alert("Please select expert, date and time.");
      return;
    }

    // Prevent booking past times on the selected date
    if (isPastSlot(date, time)) {
      alert("Selected time has already passed. Please choose a future time.");
      return;
    }

    try {
      const bookingData = {
        interviewerId: selectedExpert.id,
        interviewType: selectedExpert.category,
        date,
        time
      };

      const response = await API.post("/api/interview/bookings", bookingData);
      setBookings([...bookings, response.data]);
      setCurrentStep("confirmation");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book interview");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedExpert.type) {
      fetchExperts(selectedExpert.type);
    }
  }, [selectedExpert.type]);

  useEffect(() => {
    if (selectedExpert.id) {
      fetchAvailableDates(selectedExpert.id);
    }
  }, [selectedExpert.id]);

  useEffect(() => {
    if (selectedExpert.id && date) {
      fetchAvailableTimes(selectedExpert.id, date);
    }
  }, [selectedExpert.id, date]);

  const renderStepIndicator = () => {
    const steps = [
      { id: "selectType", label: "Type" },
      { id: "selectExpert", label: "Expert" },
      { id: "chooseTime", label: "Schedule" },
      { id: "confirmation", label: "Confirmation" },
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="container-fluid py-3 py-md-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10">
            <div className="progress rounded-pill" style={{ height: "10px" }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${(currentIndex + 1) * 25}%` }}
              ></div>
            </div>
            <div className="d-flex justify-content-between mt-2 px-2 text-muted fw-semibold small">
              {steps.map(step => (
                <span
                  key={step.id}
                  className={step.id === currentStep ? "text-success fw-bold" : "text-muted"}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNavbar = () => (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-3 mb-md-4 w-100 position-sticky top-0 border-bottom px-0" style={{ zIndex: 1050, width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}>
      <div className="w-100 d-flex align-items-center px-2 px-md-4">
        <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px' }} className="img-fluid" />
        <div className="ms-auto">
          <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
            <FaHome className="me-1" />
            <span className="d-none d-sm-inline">Dashboard</span>
            <span className="d-inline d-sm-none">Home</span>
          </Link>
        </div>
      </div>
    </nav>
  );

  const renderAvailabilityCalendar = () => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
      <div className="mb-4">
        <h6 className="fw-bold mb-2 mb-md-3">
          <FaCalendarAlt className="me-2 text-primary" />
          Interviewer's Availability
        </h6>

        <div className="mb-3">
          <p className="small text-muted mb-1">
            Available on: {selectedExpert.availability?.join(", ") || "Not specified"}
          </p>
          <p className="small text-muted mb-2">
            Typical slots: {selectedExpert.defaultSlots?.join(", ") || "Not specified"}
          </p>
        </div>

        <h6 className="fw-bold mb-2 mb-md-3">Select a Date</h6>
        {loading.dates ? (
          <div className="text-center py-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : availableDates && availableDates.length > 0 ? (
          <div className="d-flex flex-wrap gap-1 gap-md-2">
            {availableDates.slice(0, 7).map((availDate) => {
              const dateObj = new Date(availDate);
              const dayName = dayNames[dateObj.getDay()];
              return (
                <button
                  key={availDate}
                  className={`btn btn-sm ${date === availDate ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDate(availDate)}
                >
                  <span className="d-none d-sm-inline">{dayName.substring(0, 3)} </span>
                  {dateObj.getDate()}
                </button>
              );
            })}
            {availableDates.length > 7 && (
              <span className="small text-muted align-self-center">
                +{availableDates.length - 7} more
              </span>
            )}
          </div>
        ) : (
          <div className="alert alert-warning small mb-0">
            This interviewer has no available dates in the next 30 days
          </div>
        )}
      </div>
    );
  };

  if (isAuthChecking) {
    return <div className="text-center py-5">Checking access...</div>;
  }

  const renderConfirmationStep = () => {
    const latestBooking = bookings[bookings.length - 1];
    const interviewerName = latestBooking?.interviewer?.name || selectedExpert.name;
    const interviewerInitial = interviewerName.charAt(0).toUpperCase();
    const interviewerAvatar = latestBooking?.interviewer?.avatar || selectedExpert.avatar;

    return (
      <>
        {renderNavbar()}
        <div className="container py-3 py-md-4">
        {renderStepIndicator()}

        <div className="card shadow-lg border-0 mb-4 mb-md-5">
          <div className="card-header bg-white py-3 py-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <h4 className="fw-bold text-success mb-2 mb-md-0 text-center text-md-start">
                <FaCheck className="me-2" />
                Interview Scheduled Successfully
              </h4>
              <span className="badge bg-success text-white px-3 py-2 rounded-pill">
                Confirmed
              </span>
            </div>
          </div>

          <div className="card-body px-3 px-md-4 py-4 py-md-5">
            <div className="text-center mb-3 mb-md-4">
              <div className="d-flex justify-content-center mb-3 mb-md-4">
                {interviewerAvatar ? (
                  <img
                    src={interviewerAvatar}
                    alt={interviewerName}
                    className="rounded-circle shadow-sm img-fluid"
                    style={{ width: "80px", height: "80px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                  >
                    {interviewerInitial}
                  </div>
                )}
              </div>

              <h3 className="fw-bold text-primary mb-3">
                Interview with {interviewerName}
              </h3>

              <div className="card shadow-sm mb-3 mb-md-4 mx-auto" style={{ maxWidth: "500px" }}>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6 col-md-6 mb-2 mb-md-3">
                      <h6 className="text-muted small mb-1">Interview Type</h6>
                      <p className="fw-bold small">{selectedExpert.category}</p>
                    </div>
                    <div className="col-6 col-md-6 mb-2 mb-md-3">
                      <h6 className="text-muted small mb-1">Date</h6>
                      <p className="fw-bold small">{latestBooking?.date && format(parseISO(latestBooking.date), "PPP")}</p>
                    </div>
                    <div className="col-6 col-md-6 mb-2 mb-md-3">
                      <h6 className="text-muted small mb-1">Time</h6>
                      <p className="fw-bold small">{latestBooking?.time}</p>
                    </div>
                    <div className="col-6 col-md-6 mb-2 mb-md-3">
                      <h6 className="text-muted small mb-1">Duration</h6>
                      <p className="fw-bold small">45 minutes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mx-auto small" style={{ maxWidth: "500px" }}>
                <FaClock className="me-2" />
                You'll receive a confirmation email with the meeting link or find it in your Interview Details page.
              </div>

              <div className="d-flex flex-column flex-md-row justify-content-center gap-2 gap-md-3 mt-3 mt-md-4">
                <Link to="/career-dashboard" className="btn btn-primary btn-lg rounded-pill px-3 px-md-4 shadow-sm">
                  <FaCalendarAlt className="me-2" />
                  View My Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  };

  if (currentStep === "selectType") {
    const interviewTypes = [
      {
        id: 1,
        name: "IT Interview",
        description: "Assess programming, problem-solving, and system design skills.",
        icon: "bi-code-slash",
        color: "primary"
      },
      {
        id: 2,
        name: "Non-IT Interview",
        description: "Evaluate communication, leadership, and cultural fit.",
        icon: "bi-people",
        color: "success"
      }
    ];

    return (
      <>
        {renderNavbar()}
        <div className="container py-3 py-md-4">
        <div className="p-3 p-md-4 rounded text-white mb-3 mb-md-4 text-center"
          style={{ background: "linear-gradient(135deg, #39f0a7 0%, #2563eb 100%)" }}>
          <h1 className="fw-bold mb-2 h4 h-md-2">Interview Booking Portal</h1>
          <p className="mb-0 small">Choose a category to schedule your interview</p>
        </div>
        {renderStepIndicator()}
        <div className="row g-3 g-md-4">
          {interviewTypes.map((type) => (
            <div key={type.id} className="col-12 col-md-6">
              <div
                className={`card h-100 shadow border-0`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedExpert({
                    ...selectedExpert,
                    type: type.id === 1 ? "IT" : "Non-IT"
                  });
                  setCurrentStep("selectExpert");
                }}
              >
                <div className="card-body text-center p-3 p-md-4">
                  <div
                    className={`bg-${type.color}-subtle text-${type.color} rounded-circle d-inline-flex justify-content-center align-items-center mb-2 mb-md-3`}
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className={`bi ${type.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold h6 h-md-5 mb-1 mb-md-2">{type.name}</h5>
                  <p className="text-muted small">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </>
    );
  }

  if (currentStep === "selectExpert") {
    return (
      <>
        {renderNavbar()}
        <div className="container py-3 py-md-4">
        <div className="p-3 p-md-4 rounded text-white mb-3 mb-md-4 text-center"
          style={{ background: "linear-gradient(135deg, #39f0a7 0%, #2563eb 100%)" }}>
          <h1 className="fw-bold mb-2 h4 h-md-2">Select Your Interviewer</h1>
          <p className="mb-0 small">Choose from our certified {selectedExpert.type} interviewers</p>
        </div>
        {renderStepIndicator()}
        <button
          className="btn btn-outline-secondary mb-3 mb-md-4 btn-sm"
          onClick={() => setCurrentStep("selectType")}
        >
          <FaArrowLeft className="me-1 me-md-2" /> Back
        </button>

        {loading.experts ? (
          <div className="text-center py-4 py-md-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mt-md-3 small">Loading interviewers...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger small">
            <FaRegStar className="me-2" />
            {error}
            <button className="btn btn-sm btn-outline-danger ms-2 ms-md-3" onClick={() => fetchExperts(selectedExpert.type)}>
              Retry
            </button>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {availableExperts.length > 0 ? (
              availableExperts.map((expert) => (
                <div key={expert._id} className="col-12 col-md-6">
                  <div
                    className={`card h-100 shadow-sm border-0 ${selectedExpert.id === expert._id ? "border-primary border-2" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedExpert({
                        ...selectedExpert,
                        id: expert._id,
                        name: expert.name,
                        avatar: expert.avatar,
                        title: expert.title,
                        skills: expert.skills,
                        category: expert.category,
                        rating: expert.rating,
                        interviewCount: expert.interviewCount,
                        availability: expert.availability,
                        defaultSlots: expert.defaultSlots
                      });
                      setCurrentStep("chooseTime");
                    }}
                  >
                    <div className="card-body p-3 p-md-4">
                      <div className="d-flex">
                        {expert.avatar ? (
                          <img
                            src={expert.avatar}
                            alt={expert.name}
                            className="rounded-circle me-2 me-md-3"
                            style={{ width: "60px", height: "60px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2 me-md-3"
                            style={{ width: "60px", height: "60px", fontSize: "1.2rem" }}
                          >
                            {expert.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}

                        <div>
                          <h5 className="mb-1 h6 h-md-5">{expert.name}</h5>
                          <p className="text-muted small mb-1 mb-md-2">{expert.title}</p>
                          <div className="d-flex align-items-center mb-1 mb-md-2">
                            {[...Array(5)].map((_, i) => (
                              i < Math.floor(expert.rating) ?
                                <FaStar key={i} className="text-warning me-1 small" /> :
                                <FaRegStar key={i} className="text-warning me-1 small" />
                            ))}
                            <span className="small text-muted ms-1 ms-md-2">
                              {expert.rating} ({expert.interviewCount} interviews)
                            </span>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {expert.skills.map((skill, i) => (
                              <span key={i} className="badge bg-light text-dark small">{skill}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-4 py-md-5">
                <FaRegStar className="text-muted" style={{ fontSize: "2.5rem" }} />
                <h5 className="mt-2 mt-md-3 h5">No interviewers available</h5>
                <p className="text-muted small">Please try again later</p>
              </div>
            )}
          </div>
        )}
      </div>
      </>
    );
  }

  if (currentStep === "chooseTime") {
    return (
      <>
        {renderNavbar()}
        <div className="container py-3 py-md-4">
        <div className="p-3 p-md-4 rounded text-white mb-3 mb-md-4 text-center"
          style={{ background: "linear-gradient(135deg, #39f0a7 0%, #2563eb 100%)" }}>
          <h1 className="fw-bold mb-2 h4 h-md-2">Schedule Interview</h1>
          <p className="mb-0 small">Choose a date and time that works best for you</p>
        </div>
        {renderStepIndicator()}

        <div className="row g-3 g-md-4">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-white py-2 py-md-3">
                <h6 className="mb-0 fw-bold text-primary small">
                  <FaStar className="me-1 me-md-2" /> Interview Summary
                </h6>
              </div>
              <div className="card-body p-3 p-md-4">
                <div className="d-flex align-items-center mb-2 mb-md-3">
                  {selectedExpert.avatar ? (
                    <img
                      src={selectedExpert.avatar}
                      alt={selectedExpert.name}
                      className="rounded-circle me-2 me-md-3"
                      style={{ width: "50px", height: "50px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2 me-md-3"
                      style={{ width: "50px", height: "50px", fontSize: "1rem" }}
                    >
                      {selectedExpert.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}

                  <div>
                    <h6 className="mb-0 small">{selectedExpert.name}</h6>
                    <small className="text-muted">{selectedExpert.title}</small>
                  </div>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item border-0 px-0 py-1 py-md-2">
                    <strong className="text-muted small">Type:</strong><br />
                    <span className="small">{selectedExpert.category}</span>
                  </li>
                  <li className="list-group-item border-0 px-0 py-1 py-md-2">
                    <strong className="text-muted small">Skills:</strong><br />
                    <span className="small">{selectedExpert.skills.join(", ")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-white py-2 py-md-3 d-flex flex-column flex-md-row justify-content-between align-items-center">
                <h4 className="fw-bold text-primary mb-2 mb-md-0 h5 h-md-4">
                  <FaCalendarAlt className="me-1 me-md-2" /> Book Your Slot
                </h4>
                <button
                  className="btn btn-sm btn-outline-secondary rounded-pill"
                  onClick={() => setCurrentStep("selectExpert")}
                >
                  <FaArrowLeft className="me-1" /> Back
                </button>
              </div>
              <div className="card-body p-3 p-md-4">
                {error && (
                  <div className="alert alert-warning mb-3 mb-md-4 small">
                    <FaRegStar className="me-1 me-md-2" />
                    {error}
                  </div>
                )}

                {renderAvailabilityCalendar()}

                <form onSubmit={handleBookSlot}>
                  <div className="row g-3 g-md-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small">Selected Date</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light border-0">
                          <FaCalendarAlt className="text-primary" />
                        </span>
                        <input
                          type="text"
                          className="form-control shadow-sm small"
                          value={date ? format(parseISO(date), "PPP") : "Not selected"}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted fw-semibold small">Select Time Slot</label>
                      {date && (
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Past time slots are disabled and shown in gray
                          </small>
                        </div>
                      )}
                      {date ? (
                        loading.slots ? (
                          <div className="text-center py-2 py-md-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-1 mt-md-2 small">Loading time slots...</p>
                          </div>
                        ) : availableTimes.length > 0 ? (
                          <div className="row g-1 g-md-2">
                            {availableTimes.map((slot) => (
                              <div key={slot} className="col-6 col-sm-4 col-md-6">
                                <button
                                  type="button"
                                  className={`btn w-100 py-1 py-md-2 rounded-pill shadow-sm ${
                                    time === slot 
                                      ? 'btn-primary' 
                                      : isPastSlot(date, slot) 
                                        ? 'btn-outline-secondary' 
                                        : 'btn-outline-primary'
                                  } small`}
                                  onClick={() => !isPastSlot(date, slot) && setTime(slot)}
                                  disabled={isPastSlot(date, slot)}
                                >
                                  <FaClock className="me-1" />
                                  {slot}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="col-12">
                            <div className="alert alert-warning mb-0 small">
                              No available slots for this date
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="alert alert-info small">
                          Please select an available date first
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="d-grid mt-3 mt-md-4">
                    <button
                      type="submit"
                      className="btn btn-success fw-bold py-2 py-md-3 shadow-sm"
                      disabled={!date || !time || !selectedExpert.id}
                    >
                      <FaCheck className="me-1 me-md-2" />
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (currentStep === "confirmation") {
    return renderConfirmationStep();
  }

  return null;
}

export default InterviewBooking;