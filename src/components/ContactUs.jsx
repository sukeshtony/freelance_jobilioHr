import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaPaperPlane } from 'react-icons/fa';
import API from '../api';
function ContactUs() {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    message: '',
  });
  const navigate = useNavigate();
  const [responseMessage, setResponseMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Enforce +91 prefix and 10 digits for mobile input on the client side
    if (name === 'mobile') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      // Strip leading 91 if user pasted it; we will add +91 ourselves
      const withoutCountry = digits.startsWith('91') ? digits.slice(2) : digits;
      const tenDigits = withoutCountry.slice(0, 10);
      setFormData((prev) => ({ ...prev, mobile: `+91${tenDigits ? ' ' : ''}${tenDigits}` }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      // Normalize mobile to "+91" + 10 digits for backend
      const digits = formData.mobile.replace(/\D/g, '');
      const normalizedMobile = digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
      const payload = { ...formData, mobile: normalizedMobile };
      const res = await API.post('/api/contact/contact', payload);

      setResponseMessage(res.data.message);
      setFormData({ fullName: '', mobile: '', email: '', message: '' });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <img
            src="/logo.jpeg"
            alt="Company Logo"
            style={{ height: '35px', marginRight: '10px' }}
          />
          <button className="btn btn-outline-dark" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </nav>

      <div className="container my-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Get In Touch</h2>
          <p className="text-muted">
            We'd love to hear from you! Send us a message or visit our office.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body p-4 p-md-5">
                <h5 className="card-title mb-4 fw-bold">Send us a message</h5>

                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                {responseMessage && (
                  <div className="alert alert-success">{responseMessage}</div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      className="form-control"
                      placeholder="Jane Smith"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobile"
                        className="form-control"
                        placeholder="+91 9876543210"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="jane@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Your Message *</label>
                    <textarea
                      name="message"
                      className="form-control"
                      rows="4"
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body p-4 p-md-5">
                <h5 className="card-title mb-4 fw-bold">Contact Information</h5>

                <div className="d-flex mb-4">
                  <div className="me-3 text-primary">
                    <FaMapMarkerAlt size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold">Our Office</h6>
                    <p className="text-muted mb-0">

                      Magarpatta City, Hadapsar, <br />
                      Pune, Maharashtra - 411013
                    </p>
                  </div>
                </div>

                <div className="d-flex mb-4">
                  <div className="me-3 text-primary">
                    <FaPhone size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold">Phone / WhatsApp</h6>
                    <p className="text-muted mb-0">
                      <a href="tel:+917499432816" className="text-decoration-none">
                        +91 74994 32816
                      </a>
                    </p>
                  </div>
                </div>

                <div className="d-flex mb-4">
                  <div className="me-3 text-primary">
                    <FaEnvelope size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold">Email</h6>
                    <p className="text-muted mb-0">
                      <a href="mailto:info@jobiliohr.com" className="text-decoration-none">
                        info@jobiliohr.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="d-flex">
                  <div className="me-3 text-primary">
                    <FaClock size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold">Office Hours</h6>
                    <p className="text-muted mb-0">
                      Monday to Saturday<br />
                      9:00 AM – 7:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactUs;