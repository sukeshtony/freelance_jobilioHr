import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const dataParam = searchParams.get('data');
        if (dataParam) {
          const oauthData = JSON.parse(decodeURIComponent(dataParam));

          // Normalize premium flag across potential mismatched keys (isPremier vs isPremium)
          const normalizedUser = { ...oauthData.user };
          const premiumFlag = Boolean(normalizedUser?.isPremium || normalizedUser?.isPremier);
          normalizedUser.isPremium = premiumFlag;
          normalizedUser.isPremier = premiumFlag;

          // Store user data in localStorage
          if (oauthData.token) {
            localStorage.setItem('token', oauthData.token);
            localStorage.setItem('role', normalizedUser.role);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('username', normalizedUser.username);
            localStorage.setItem('userId', normalizedUser.id);

            // Redirect based on role and premium status
            if (normalizedUser.role === 'Candidate') {
              if (normalizedUser.isPremium) {
                navigate('/career-dashboard');
              } else {
                navigate('/dashboard/candidate');
              }
            } else if (normalizedUser.role === 'Client') {
              // Check if client has company details before redirecting to dashboard
              if (normalizedUser.hasCompanyDetails) {
                // Client has company details, redirect to dashboard
                navigate('/naukri-client-portal');
              } else {
                // Client doesn't have company details, redirect to company details form
                navigate('/client/company-details');
              }
            } else {
              navigate('/');
            }
          }
        } else {
          // Handle error case
          const error = searchParams.get('error');
          const existingRole = searchParams.get('existingRole');
          const wrongRoleExpected = searchParams.get('expected');
          const wrongRoleActual = searchParams.get('actual');
          const role = searchParams.get('role');
          if (error === 'email_exists_in_other_role') {
            navigate(`/login?error=email_exists_in_other_role&existingRole=${existingRole || ''}`);
          } else if (error === 'user_not_found') {
            // Show a clean message on the respective login pages
            if (role === 'Client') {
              navigate('/client/login?error=user_not_found');
            } else {
              navigate('/candidate/login?error=user_not_found');
            }
          } else if (error === 'wrong_role') {
            if (wrongRoleExpected === 'Client') {
              navigate(`/client/login?error=wrong_role&actual=${wrongRoleActual || ''}`);
            } else {
              navigate(`/candidate/login?error=wrong_role&actual=${wrongRoleActual || ''}`);
            }
          } else if (error) {
            console.error('OAuth error:', error);
            navigate('/login?error=oauth_failed');
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Processing your login...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;