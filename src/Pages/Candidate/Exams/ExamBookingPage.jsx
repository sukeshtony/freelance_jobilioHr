import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaArrowLeft, FaCheck, FaCalendarAlt, FaClock, FaStar, FaRegStar } from 'react-icons/fa';
import { format, parseISO } from "date-fns";
import API from "../../../api";
import { requireLogin } from '../../../utils/requireLogin';
import { requirePremium } from '../../../utils/requirePremium';

function ExamBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [currentStep, setCurrentStep] = useState("selectCategory");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState({
    courses: false,
    bookings: false,
    dates: false,
    slots: false
  });
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  // instructorId can be provided via query (?instructorId=...), or fallback to a stored one
  const searchParams = new URLSearchParams(location.search);
  const queryInstructorId = searchParams.get('instructorId');
  const storedInstructorId = localStorage.getItem('instructorId');
  const effectiveInstructorId = queryInstructorId || storedInstructorId || '689f734406792a1e8b95e42b';

  const steps = [
    { id: "selectCategory", label: "Category" },
    { id: "selectCourse", label: "Course" },
    { id: "chooseTime", label: "Schedule" },
    { id: "confirmation", label: "Confirm" }
  ];

  const stepIndex = steps.findIndex(step => step.id === currentStep);

  const [availableTimes, setAvailableTimes] = useState([]);
  const [instructorDuration, setInstructorDuration] = useState('60 minutes'); // will reflect course duration once selected
  const [instructorDays, setInstructorDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]); // will reflect course days once selected

  // Helpers to prevent booking past timeslots
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

  const examRules = [
    "Arrive at least 10 minutes before your scheduled time",
    "Bring a valid photo ID for verification",
    "No calculators or external devices allowed",
    "The exam will be automatically submitted when time expires",
    "Results are available immediately after completion",
    "You cannot pause the exam once started",
    "The testing environment will be monitored"
  ];

  const categories = [
    { id: 1, name: "IT", icon: "bi-code-slash", description: "Development, software, technical", color: "primary" },
    { id: 2, name: "Non-IT", icon: "bi-people-fill", description: "HR, business, marketing", color: "success" }
  ];

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

  const fetchAvailableDates = async () => {
    try {
      setLoading(prev => ({ ...prev, dates: true }));
      const generatedDates = generateAvailableDates(instructorDays);
      setAvailableDates(generatedDates);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch available dates");
      setAvailableDates([]);
    } finally {
      setLoading(prev => ({ ...prev, dates: false }));
    }
  };

  const fetchCourseAvailability = async (courseId) => {
    try {
      if (!courseId) return;
      const res = await API.get(`/api/courses/${courseId}/availability`);
      const { availability, defaultSlots, examDuration } = res.data || {};
      if (Array.isArray(availability) && availability.length) setInstructorDays(availability);
      if (Array.isArray(defaultSlots) && defaultSlots.length) setAvailableTimes(defaultSlots);
      if (typeof examDuration === 'string' && examDuration.trim()) setInstructorDuration(examDuration);
      // regenerate dates based on the (possibly) updated days
      const generatedDates = generateAvailableDates(availability && availability.length ? availability : instructorDays);
      setAvailableDates(generatedDates);
    } catch (err) {
      console.error('Failed to fetch course availability:', err);
      // keep previous values; ensure at least defaults
      if (!availableTimes.length) {
        setAvailableTimes(["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"]);
      }
      if (!instructorDays.length) {
        setInstructorDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
      }
      setInstructorDuration(prev => prev || '60 minutes');
      const generatedDates = generateAvailableDates(instructorDays);
      setAvailableDates(generatedDates);
    }
  };

  const fetchInstructorAvailability = async () => {
    try {
      if (!effectiveInstructorId) return;
      const res = await API.get(`/api/admin/instructors/${effectiveInstructorId}/availability`);
      const { availability, defaultSlots, examDuration } = res.data || {};
      if (Array.isArray(availability) && availability.length) setInstructorDays(availability);
      if (Array.isArray(defaultSlots) && defaultSlots.length) setAvailableTimes(defaultSlots);
      if (typeof examDuration === 'string' && examDuration.trim()) setInstructorDuration(examDuration);
    } catch (err) {
      console.error("Failed to fetch instructor availability:", err);
      // fall back defaults
      setAvailableTimes([
        "09:00 AM", "10:00 AM", "11:00 AM",
        "01:00 PM", "02:00 PM", "03:00 PM",
        "04:00 PM", "05:00 PM", "06:00 PM",
        "07:00 PM"
      ]);
      setInstructorDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
      setInstructorDuration('60 minutes');
    }
  };

  const fetchAvailableTimes = async (selectedDate) => {
    try {
      setLoading(prev => ({ ...prev, slots: true }));
      // already set from instructor defaultSlots; keep as-is
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch available times");
      // keep previous or fallback minimal set
      if (!availableTimes.length) {
        setAvailableTimes(["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"]);
      }
    } finally {
      setLoading(prev => ({ ...prev, slots: false }));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    const loadBookings = async () => {
      if (!userId) return;
      try {
        setLoading(prev => ({ ...prev, bookings: true }));
        const res = await API.get(`/api/exams/bookings`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) setBookings(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load bookings");
        console.error("Failed to load bookings:", err);
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    };

    const loadCourses = async () => {
      try {
        setLoading(prev => ({ ...prev, courses: true }));
        const res = await API.get("/api/courses");
        if (Array.isArray(res.data)) setCourses(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch courses");
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    loadBookings();
    loadCourses();
    fetchInstructorAvailability().then(fetchAvailableDates);
  }, [userId, effectiveInstructorId]);

  useEffect(() => {
    if (date) {
      fetchAvailableTimes(date);
    }
  }, [date]);

  const handleBookSlot = async e => {
    e.preventDefault();
    if (!date || !time) return alert("Please select both date and time.");
    if (!selectedCategory || !selectedCourse) return alert("Please select category and course.");

    // Prevent booking past times on the selected date
    if (isPastSlot(date, time)) {
      alert("Selected time has already passed. Please choose a future time.");
      return;
    }

    try {
      const res = await API.post("/api/exams/book", {
        userId,
        username,
        category: selectedCategory.name,
        courseId: selectedCourse._id,
        courseName: selectedCourse.title,
        date,
        time
      });

      setBookings(prev => [...prev, res.data]);
      setCurrentStep("confirmation");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to book exam.");
      console.error(err);
    }
  };

  const handleCancelExam = async id => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await API.post(`/api/exams/booking/${id}/cancel`);
      setBookings(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel exam.");
      console.error(err);
    }
  };

  const renderStepIndicator = () => {
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
          Assessment Center Availability
        </h6>

        <div className="mb-3">
          <p className="small text-muted mb-1">
            Available on: 
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
            No available dates in the next 30 days
          </div>
        )}
      </div>
    );
  };

  if (isAuthChecking) {
    return <div className="text-center py-5">Checking access...</div>;
  }

  if (currentStep === "selectCategory") {
    return (
      <>
        {renderNavbar()}
        <div className="container py-3 py-md-4">
        <div className="p-3 p-md-4 rounded text-white mb-3 mb-md-4 text-center"
          style={{ background: "linear-gradient(135deg, #39f0a7 0%, #2563eb 100%)" }}>
          <h1 className="fw-bold mb-2 h4 h-md-2">Skill Assessment Portal</h1>
          <p className="mb-0 small">Choose a field to schedule your exam</p>
        </div>
        {renderStepIndicator()}
        <div className="row g-3 g-md-4">
          {categories.map(cat => (
            <div key={cat.id} className="col-12 col-md-6">
              <div
                className={`card h-100 shadow border-0`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedCourse(null);
                  setCurrentStep("selectCourse");
                }}
              >
                <div className="card-body text-center p-3 p-md-4">
                  <div
                    className={`bg-${cat.color}-subtle text-${cat.color} rounded-circle d-inline-flex justify-content-center align-items-center mb-2 mb-md-3`}
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className={`bi ${cat.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold h6 h-md-5 mb-1 mb-md-2">{cat.name}</h5>
                  <p className="text-muted small">{cat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </>
    );
  }

  if (currentStep === "selectCourse") {
    const filteredCourses = selectedCategory
      ? courses.filter(c => c.field === selectedCategory.name)
      : [];

    return (
      <>
        {renderNavbar()}
        <div className="container py-3 py-md-4">
        <div className="p-3 p-md-4 rounded text-white mb-3 mb-md-4 text-center"
          style={{ background: "linear-gradient(135deg, #39f0a7 0%, #2563eb 100%)" }}>
          <h1 className="fw-bold mb-2 h4 h-md-2">Select Your Assessment Course</h1>
          <p className="mb-0 small">Choose from our {selectedCategory?.name} assessment courses</p>
        </div>
        {renderStepIndicator()}
        <button
          className="btn btn-outline-secondary mb-3 mb-md-4 btn-sm"
          onClick={() => setCurrentStep("selectCategory")}
        >
          <FaArrowLeft className="me-1 me-md-2" /> Back
        </button>

        {loading.courses ? (
          <div className="text-center py-4 py-md-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mt-md-3 small">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger small">
            <FaRegStar className="me-2" />
            {error}
            <button className="btn btn-sm btn-outline-danger ms-2 ms-md-3" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, i) => (
                <div key={i} className="col-12 col-md-6">
                  <div
                    className={`card h-100 shadow-sm border-0`}
                    style={{ cursor: "pointer" }}
                    onClick={async () => {
                      setSelectedCourse(course);
                      await fetchCourseAvailability(course._id);
                      setCurrentStep("chooseTime");
                    }}
                  >
                    <div className="card-body p-3 p-md-4">
                      <div className="d-flex">
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2 me-md-3"
                          style={{ width: "60px", height: "60px", fontSize: "1.2rem" }}
                        >
                          <i className="bi bi-book"></i>
                        </div>

                        <div>
                          <h5 className="mb-1 h6 h-md-5">{course.title}</h5>
                          <div className="d-flex align-items-center mb-1 mb-md-2">
                            <span className="small text-muted">
                              <i className="bi bi-clock me-1"></i>
                              Duration: {course.examDuration || instructorDuration}
                            </span>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            <span className="badge bg-primary small">{selectedCategory?.name}</span>
                            <span className="badge bg-light text-dark small">Assessment</span>
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
                <h5 className="mt-2 mt-md-3 h5">No courses available</h5>
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
          <h1 className="fw-bold mb-2 h4 h-md-2">Schedule Assessment</h1>
          <p className="mb-0 small">Choose a date and time that works best for you</p>
        </div>
        {renderStepIndicator()}

        <div className="row g-3 g-md-4">
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-white py-2 py-md-3">
                <h6 className="mb-0 fw-bold text-primary small">
                  <FaStar className="me-1 me-md-2" /> Assessment Summary
                </h6>
              </div>
              <div className="card-body p-3 p-md-4">
                <div className="text-center mb-2 mb-md-3">
                  <div
                    className="bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center mb-2 mb-md-3"
                    style={{ width: "50px", height: "50px", fontSize: "1.2rem" }}
                  >
                    <i className="bi bi-book"></i>
                  </div>
                  <h6 className="mb-0 small">{selectedCourse?.title}</h6>
                  <small className="text-muted">{selectedCategory?.name}</small>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item border-0 px-0 py-1 py-md-2">
                    <strong className="text-muted small">Category:</strong><br />
                    <span className="small">{selectedCategory?.name}</span>
                  </li>
                  <li className="list-group-item border-0 px-0 py-1 py-md-2">
                    <strong className="text-muted small">Course:</strong><br />
                    <span className="small">{selectedCourse?.title}</span>
                  </li>
                  <li className="list-group-item border-0 px-0 py-1 py-md-2">
                    <strong className="text-muted small">Duration:</strong><br />
                    <span className="small">{instructorDuration}</span>
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
                  onClick={() => setCurrentStep("selectCourse")}
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
                      disabled={!date || !time || !selectedCategory || !selectedCourse}
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
    const latestBooking = bookings[bookings.length - 1];

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
                Assessment Scheduled Successfully
              </h4>
              <span className="badge bg-success text-white px-3 py-2 rounded-pill">
                Confirmed
              </span>
            </div>
          </div>

          <div className="card-body px-3 px-md-4 py-4 py-md-5">
            <div className="text-center mb-3 mb-md-4">
              <div className="d-flex justify-content-center mb-3 mb-md-4">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                >
                  <i className="bi bi-book"></i>
                </div>
              </div>

              <h3 className="fw-bold text-primary mb-3">
                Assessment for {latestBooking?.courseName}
              </h3>

              <div className="card shadow-sm mb-3 mb-md-4 mx-auto" style={{ maxWidth: "500px" }}>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6 col-md-6 mb-2 mb-md-3">
                      <h6 className="text-muted small mb-1">Category</h6>
                      <p className="fw-bold small">{latestBooking?.category}</p>
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
                      <p className="fw-bold small">{instructorDuration}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mx-auto small" style={{ maxWidth: "500px" }}>
                <FaClock className="me-2" />
                Please arrive at least 10 minutes early. The system will auto-submit your answers when time expires.
              </div>

              <div className="d-flex flex-column flex-md-row justify-content-center gap-2 gap-md-3 mt-3 mt-md-4">
                <Link to="/career-dashboard" className="btn btn-primary btn-lg rounded-pill px-3 px-md-4 shadow-sm">
                  <FaCalendarAlt className="me-2" />
                  View My Schedule
                </Link>
                <button 
                  className="btn btn-outline-primary btn-lg rounded-pill px-3 px-md-4 shadow-sm"
                  onClick={() => setCurrentStep("selectCategory")}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Book Another Assessment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Rules Section */}
        <div className="row g-3 g-md-4">
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-gradient text-dark py-2 py-md-3" style={{ backgroundImage: "linear-gradient(135deg, #39f0a7, #2563eb)" }}>
                <h6 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i> Exam Rules
                </h6>
              </div>
              <div className="card-body small">
                <ul className="list-unstyled ps-2 mb-0">
                  {examRules.map((rule, i) => (
                    <li key={i} className="mb-2 d-flex align-items-start">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-list-check me-2"></i> Scheduled Assessments
                </h6>
              </div>
              <div className="card-body p-0">
                {loading.bookings ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 small">Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center text-muted py-4">No assessments booked</div>
                ) : (
                  <>
                    {/* Desktop/Laptop View (Table) */}
                    <div className="d-none d-md-block">
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
                          {bookings.map(booking => (
                            <tr key={booking._id}>
                              <td>{booking.category}</td>
                              <td>{booking.courseName}</td>
                              <td>{booking.date}</td>
                              <td>{booking.time}</td>
                              <td>
                                <span className={`badge ${booking.status === 'Scheduled' ? 'bg-success' : 'bg-secondary'}`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td>
                                {booking.status === 'Scheduled' && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleCancelExam(booking._id)}
                                    title="Cancel"
                                  >
                                    <i className="bi bi-x-circle"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="d-md-none">
                      {bookings.map(booking => (
                        <div key={booking._id} className="border-bottom p-3">
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Category:</strong>
                            <span>{booking.category}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Course:</strong>
                            <span>{booking.courseName}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Date:</strong>
                            <span>{booking.date}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Time:</strong>
                            <span>{booking.time}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Status:</strong>
                            <span className={`badge ${booking.status === 'Scheduled' ? 'bg-success' : 'bg-secondary'}`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.status === 'Scheduled' && (
                            <div className="d-flex justify-content-end mt-2">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleCancelExam(booking._id)}
                              >
                                <i className="bi bi-x-circle me-1"></i> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </>
    );
  }

  return null;
}

export default ExamBookingPage;