import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Terms & Conditions</h2>
            </div>
            <div className="card-body">
              <h4>1. Acceptance of Terms</h4>
              <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
              
              <h4>2. Use License</h4>
              <p>Permission is granted to temporarily download one copy of the materials (information or software) on JobilioHR's website for personal, non-commercial transitory viewing only.</p>
              
              <h4>3. Disclaimer</h4>
              <p>The materials on JobilioHR's website are provided on an 'as is' basis. JobilioHR makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
              
              <h4>4. Limitations</h4>
              <p>In no event shall JobilioHR or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on JobilioHR's website.</p>
              
              <h4>5. Accuracy of Materials</h4>
              <p>The materials appearing on JobilioHR's website could include technical, typographical, or photographic errors. JobilioHR does not warrant that any of the materials on its website are accurate, complete or current.</p>
              
              <h4>6. Links</h4>
              <p>JobilioHR has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by JobilioHR of the site.</p>
              
              <h4>7. Modifications</h4>
              <p>JobilioHR may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms and Conditions of Use.</p>
              
              <div className="text-center mt-4">
                <button className="btn btn-primary" onClick={() => navigate(-1)}>Back </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms; 