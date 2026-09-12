import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-success text-white">
              <h2 className="mb-0">Privacy Policy</h2>
            </div>
            <div className="card-body">
              <h4>1. Information We Collect</h4>
              <p>We collect information you provide directly to us, such as when you create an account, apply for jobs, or contact us. This may include your name, email address, phone number, and other personal information.</p>
              
              <h4>2. How We Use Your Information</h4>
              <p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience.</p>
              
              <h4>3. Information Sharing</h4>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
              
              <h4>4. Data Security</h4>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
              
              <h4>5. Cookies and Tracking</h4>
              <p>We use cookies and similar tracking technologies to enhance your experience on our website and to analyze how our services are used.</p>
              
              <h4>6. Third-Party Services</h4>
              <p>We may use third-party services that collect, monitor, and analyze user data. These services have their own privacy policies.</p>
              
              <h4>7. Your Rights</h4>
              <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.</p>
              
              <h4>8. Changes to This Policy</h4>
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
              
              <h4>9. Contact Us</h4>
              <p>If you have any questions about this privacy policy, please contact us at privacy@jobiliohr.com</p>
              
              <div className="text-center mt-4">
                <button className="btn btn-success" onClick={() => navigate(-1)}>Back </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy; 