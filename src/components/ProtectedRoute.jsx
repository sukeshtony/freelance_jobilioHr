import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  // Get user role from localStorage (adjust if you store it elsewhere)
  const userRole = localStorage.getItem('role');

  if (!userRole) {
    // Not logged in
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Role not authorized
    if (userRole === 'Candidate' || userRole === 'Client') {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/Bingus" replace />;
  }

  return children;
};

export default ProtectedRoute;
