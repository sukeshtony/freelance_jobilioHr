import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter password", 
  name = "password",
  className = "form-control",
  required = false,
  label = "Password"
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div className="position-relative">
        <input
          type={showPassword ? "text" : "password"}
          className={className}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3"
          onClick={togglePasswordVisibility}
          style={{ zIndex: 10, border: 'none', background: 'none' }}
        >
          {showPassword ? (
            <FaEyeSlash className="text-muted" />
          ) : (
            <FaEye className="text-muted" />
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput; 