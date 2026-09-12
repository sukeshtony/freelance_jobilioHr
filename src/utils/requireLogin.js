import API from '../api';

/**
 * Ensures a user is authenticated before accessing a candidate-only page.
 * Redirects to candidate login if missing/invalid.
 * @param {Function} navigate react-router navigate function
 * @returns {Promise<boolean>} true if authenticated, false otherwise
 */
export const requireLogin = async (navigate) => {
  const token = localStorage.getItem('token');
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
  if (!token) {
    navigate('/candidate/login', { replace: true, state: { from: currentPath } });
    return false;
  }
  try {
    const res = await API.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data?.user?._id) {
      navigate('/candidate/login', { replace: true, state: { from: currentPath } });
      return false;
    }
    return true;
  } catch (err) {
    navigate('/candidate/login', { replace: true, state: { from: currentPath } });
    return false;
  }
};

export default requireLogin;
