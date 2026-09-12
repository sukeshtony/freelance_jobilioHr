import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'bootstrap/dist/css/bootstrap.min.css';

const Certificate = ({ onClose = () => {}, onShare = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const certRef = useRef();

  // Safely parse user data from localStorage
  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem('user')) || {};
  } catch (error) {
    console.warn('Failed to parse user from localStorage');
    storedUser = {};
  }

  // Get certificate data from navigation state or localStorage
  const {
    name = storedUser.name || "Student Name",
    course = "Course Name",
    director = "Director Name",
    mentor = "Mentor Name",
    gender = storedUser.gender || "male",
    startDate = location.state?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 3)).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    endDate = location.state?.endDate || new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  } = location.state || {};

  const pronouns = {
    male: { subject: 'he', possessive: 'his' },
    female: { subject: 'she', possessive: 'her' },
    other: { subject: 'they', possessive: 'their' }
  };

  const selectedPronoun = pronouns[gender.toLowerCase()] || pronouns.other;

  const downloadPDF = () => {
    html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${name.replace(/ /g, '_')}_certificate.pdf`);
    });
  };

  const shareCertificate = async () => {
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'certificate.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare) {
          try {
            await navigator.share({
              title: `${name}'s Certificate`,
              text: `Check out my certificate for completing ${course}!`,
              files: [file]
            });
          } catch (err) {
            console.error('Error sharing:', err);
            onShare(canvas.toDataURL('image/png'));
          }
        } else {
          onShare(canvas.toDataURL('image/png'));
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating share image:', error);
      onShare();
    }
  };

  const handleClose = () => {
    navigate(-1);
    onClose();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
        <div className="container d-flex justify-content-between align-items-center">
          <img src="/logo.jpeg" alt="Company Logo" style={{ height: '35px' }} />
          <button onClick={handleClose} className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
            <FaHome className="me-1" />
            <span className="d-none d-sm-inline">Dashboard</span>
            <span className="d-inline d-sm-none">Home</span>
          </button>
        </div>
      </nav>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        margin: '0 auto'
      }}>
        <div
          ref={certRef}
          style={{
            width: '800px',
            height: '500px',
            position: 'relative',
            fontFamily: "'Times New Roman', serif",
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            backgroundColor: 'white'
          }}
        >
          {/* Background Image */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            backgroundImage: 'url(/java.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }} />

          {/* Certificate Content */}
          <div style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.5', fontFamily: "'Italianno', cursive", marginTop: '4vh' }}>
                {name}
              </div>

              <div style={{ fontSize: '1.3rem', margin: 1, marginLeft: '50px', marginRight: '60px' }}>
                From {startDate} to {endDate}, {selectedPronoun.subject} gained hands-on experience in {course} and contributed to live projects under our guidance at JobilioHR. We found {selectedPronoun.possessive} performance to be satisfactory.
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'auto', width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>{mentor}</p>
                <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto' }}></div>
                <p>Mentor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          width: '100%',
          maxWidth: '1000px',
          marginTop: '30px'
        }}>
          <button onClick={downloadPDF} style={{
            flex: 1,
            backgroundColor: '#2e7d32',
            color: 'white',
            border: 'none',
            padding: '15px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Download Certificate
          </button>
          <button onClick={shareCertificate} style={{
            flex: 1,
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '15px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Share Certificate
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
