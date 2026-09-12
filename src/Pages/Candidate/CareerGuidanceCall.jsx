import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import API from '../../api'

const CareerGuidanceCall = () => {
  const [bookingStage, setBookingStage] = useState('initial'); // initial, form, confirmed
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: null,
    time: '',
  });

  const availableTimes = [
    '9:00 AM', '10:30 AM', '12:00 PM',
    '2:00 PM', '3:30 PM', '5:00 PM'
  ];

  const expertSpecialties = [
    'Career Switching',
    'Interview Prep',
    'Resume Review',
    'Salary Negotiation',
    'Tech Careers',
    'Management Path'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token'); // Ensure the token is available
      if (!token) {
        alert('User not authenticated. Please log in.');
        return;
      }

      const payload = {
        ...formData,
        date: formData.date?.toISOString().split('T')[0], // Send date in 'YYYY-MM-DD' format
      };

      const res = await API.post('/api/bookings', payload, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Include the token
        },
      });

      console.log('Booking successful:', res.data);
      setBookingStage('confirmed');
    } catch (err) {
      console.error('Booking error:', err);
      const message =
        err.response?.data?.error || 'Something went wrong while booking.';
      alert(message);
    }
  };




  const renderInitialView = () => (
    <div className="bg-white rounded-4 p-4 shadow text-center">
      <h5 className="fw-bold mb-3">Schedule Your Session</h5>
      <p className="small text-muted mb-4">
        45-minute personalized consultation with industry experts
      </p>
      <button
        onClick={() => setBookingStage('form')}
        className="btn btn-primary btn-lg w-100 rounded-pill py-3 fw-bold hover-lift"
      >
        <i className="bi bi-calendar-plus me-2"></i>Book Now
      </button>
      <div className="d-flex align-items-center justify-content-center mt-3">
        <div className="avatar-group me-3">
          {[1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 20}.jpg`}
              className="avatar"
              alt={`Expert ${i}`}
            />
          ))}
        </div>
        <div className="text-start">
          <div className="fw-semibold small">12+ Career Experts</div>
          <div className="text-primary small">Specialized in various fields</div>
        </div>
      </div>
    </div>
  );

  const renderBookingForm = () => (
    <div className="bg-white rounded-4 p-4 shadow">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Schedule Your Session</h5>
        <button
          onClick={() => setBookingStage('initial')}
          className="btn btn-sm btn-link text-muted"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small">Full Name*</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label small">Email*</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label small">Phone*</label>
          <input
            type="Phone"
            name="phone"
            className="form-control"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <label className="form-label small">Date*</label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              minDate={new Date()}
              className="form-control"
              placeholderText="Select date"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Time*</label>
            <select
              name="time"
              className="form-select"
              value={formData.time}
              onChange={handleInputChange}
              required
            >
              <option value="">Select time</option>
              {availableTimes.map((time, i) => (
                <option key={i} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 rounded-pill py-2 fw-bold mb-2"
        >
          Confirm Booking
        </button>
      </form>
    </div>
  );

  const renderConfirmation = () => (
    <div className="bg-white rounded-4 p-4 shadow text-center">
      <div className="success-check mb-3">
        <i className="bi bi-check-circle-fill"></i>
      </div>
      <h5 className="fw-bold mb-2">Booking Confirmed!</h5>
      <p className="text-muted mb-4">
        We've sent the details to {formData.email}
      </p>
      <div className="confirmation-details bg-light rounded-3 p-3 mb-4 text-start">
        <div className="d-flex mb-2">
          <i className="bi bi-calendar-check text-primary me-2"></i>
          <div>
            <div className="small text-muted">Date & Time</div>
            <div>{formData.date?.toLocaleDateString()} at {formData.time}</div>
          </div>
        </div>
        <div className="d-flex">
          <i className="bi bi-person text-primary me-2"></i>
          <div>
            <div className="small text-muted">With</div>
            <div>Career Expert (Assigned Soon)</div>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          setBookingStage('initial');
          setFormData({
            name: '',
            email: '',
            date: null,
            time: '',
            topics: ''
          });
        }}
        className="btn btn-outline-primary w-100 rounded-pill"
      >
        <i className="bi bi-plus-circle me-2"></i>Book Another Session
      </button>
    </div>
  );

  return (
    <div className="container py-5">
      <div className="card border-0 rounded-4 overflow-hidden shadow-lg bg-gradient-career">
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center">
            <div className="col-lg-8 mb-4 mb-lg-0">
              <span className="badge bg-white text-primary mb-3 px-3 py-2 fw-semibold">
                <i className="bi bi-stars me-2"></i>Premium Service
              </span>
              <h2 className="display-6 fw-bold text-white mb-3">Personalized Career Guidance</h2>
              <p className="lead text-light mb-4">
                Get 1:1 expert advice to navigate your career path and make informed decisions.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <div className="d-flex align-items-center bg-white bg-opacity-10 rounded-pill px-3 py-1">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span className="text-white">Industry Experts</span>
                </div>
                <div className="d-flex align-items-center bg-white bg-opacity-10 rounded-pill px-3 py-1">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span className="text-white">Customized Advice</span>
                </div>
                <div className="d-flex align-items-center bg-white bg-opacity-10 rounded-pill px-3 py-1">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  <span className="text-white">Flexible Scheduling</span>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {bookingStage === 'initial' && renderInitialView()}
              {bookingStage === 'form' && renderBookingForm()}
              {bookingStage === 'confirmed' && renderConfirmation()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-gradient-career {
          background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%);
        }
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .rounded-4 {
          border-radius: 1rem !important;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          margin-left: -10px;
        }
        .avatar:first-child {
          margin-left: 0;
        }
        .avatar-group {
          display: flex;
        }
        .success-check {
          font-size: 4rem;
          color: #28a745;
          line-height: 1;
        }
        .confirmation-details div {
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default CareerGuidanceCall;