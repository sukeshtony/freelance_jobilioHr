import API from '../api';
import requireLogin from './requireLogin';

/**
 * Ensures user is authenticated AND premium.
 * Redirects to candidate dashboard if authenticated but not premium.
 * Redirects to candidate login if not authenticated / error.
 * @param {Function} navigate react-router navigate function
 * @returns {Promise<{user: object} | null>} user object if premium, otherwise null
 */
export const requirePremium = async (navigate) => {
  const authed = await requireLogin(navigate);
  if (!authed) return null;
  try {
    const token = localStorage.getItem('token');
    const res = await API.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = res.data?.user;
    if (!user?.isPremium) {
      navigate('/dashboard/candidate', { replace: true });
      return null;
    }
    return { user };
  } catch (e) {
    navigate('/candidate/login', { replace: true });
    return null;
  }
};

export default requirePremium;
