const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { User, Profile } = require('../models/User');
const Interviewer = require("../models/Interviewer");
const Admin = require('../models/Admin');
const { body, validationResult } = require('express-validator');
const Feedbacker = require('../models/Feedbacker');
const Instructor = require('../models/Instructor');
const passport = require('../config/googleOAuth');
const router = express.Router();

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET ||
    'supersecretkey', (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });
      req.user = decoded;
      next();
    });
};

const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(user, code) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, 
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: 'JobilioHR <info@jobiliohr.com>',
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <h3>Hello ${user.username || user.email},</h3>
        <p>You requested a password reset. Your verification code is:</p>
        <h2>${code}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn’t request this, you can ignore this email.</p>
        <br>
        <p>Regards,<br>JobilioHR Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent.');
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}



// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('profile', 'avatarUrl'); // only bring profileImage field
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, mobile } = req.body;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['Candidate', 'Client'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Start session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create and save user
      const user = new User({
        username,
        email,
        password: hashed,
        role,
        mobile: mobile || ''
      });

      const savedUser = await user.save({ session });

      // Create profile if candidate
      let profile = null;
      if (role === 'Candidate') {
        profile = new Profile({
          userId: savedUser._id,
          name: username,
          email: email,
          phone: mobile || '',
          title: '',
          experience: 0,
          isDraft: true,
          skills: [],
          companies: [],
          education: []
        });

        await profile.save({ session });

        // Update user with profile reference
        savedUser.profile = profile._id;
        await savedUser.save({ session });
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Generate JWT token
      const token = jwt.sign(
        { id: savedUser._id, role: savedUser.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1d' }
      );

      // Prepare response
      const response = {
        message: 'Registration successful',
        token,
        user: {
          id: savedUser._id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
          mobile: savedUser.mobile
        }
      };

      // Add profile info if candidate
      if (role === 'Candidate') {
        response.user.hasProfile = true;
        response.user.profileId = profile._id;
      }

      res.status(201).json(response);

    } catch (err) {
      // If error occurs, abort transaction
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

  } catch (err) {
    console.error('Registration error:', err);
    // Handle duplicate key errors just in case
    if (err && err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (err.keyPattern && err.keyPattern.username) {
        // If this triggers, there is likely a unique index on username in DB. Username is not intended to be unique.
        return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(400).json({ message: 'Duplicate value' });
    }
    res.status(500).json({
      message: 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1d' }
    );

    // ✅ Add isPremium to response
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium  // <-- Add this line
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Update Profile
router.put('/update-profile/:id', async (req, res) => {
  try {
    console.log('Received update payload:', req.body);
    const { username, mobile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, mobile },
      { new: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change Password
router.put('/change-password/:id', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch)
    return res.status(400).json({ message: 'Incorrect current password' });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

// Admin
router.put('/change-password/admin/:id', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.params.id).select('+password');

  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch)
    return res.status(400).json({ message: 'Incorrect current password' });

  const hashed = await bcrypt.hash(newPassword, 10);
  admin.password = hashed;
  await admin.save();

  res.json({ message: 'Password updated successfully' });
});

// Instructor
router.put('/change-password/instructor/:id', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const instructor = await Instructor.findById(req.params.id).select('+password');

  if (!instructor)
    return res.status(404).json({ message: 'Instructor not found' });

  const isMatch = await bcrypt.compare(currentPassword, instructor.password);
  if (!isMatch)
    return res.status(400).json({ message: 'Incorrect current password' });

  instructor.password = newPassword;
  await instructor.save();

  res.json({ message: 'Password updated successfully' });
});

// Interviewer
router.put('/change-password/interviewer/:id', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const interviewer = await Interviewer.findById(req.params.id).select('+password');

  if (!interviewer)
    return res.status(404).json({ message: 'Interviewer not found' });

  const isMatch = await bcrypt.compare(currentPassword, interviewer.password);
  if (!isMatch)
    return res.status(400).json({ message: 'Incorrect current password' });

  const hashed = await bcrypt.hash(newPassword, 10);
  interviewer.password = hashed;
  await interviewer.save();

  res.json({ message: 'Password updated successfully' });
});

router.put('/change-password/feedbacker/:id', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const feedbacker = await Feedbacker.findById(req.params.id).select('+password');
    if (!feedbacker) {
      return res.status(404).json({ message: 'Feedbacker not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, feedbacker.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // ❌ don't hash here — let the pre-save hook do it
    feedbacker.password = newPassword;
    await feedbacker.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.put('/update-profile', auth, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (email) user.email = email;
    if (username) user.username = username;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// General Google OAuth callback (for backward compatibility)
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user) => {
    try {
      const state = req.query.state || '';
      let mode = 'register';
      let requestedRole;

      if (state.includes(':')) {
        const [m, r] = state.split(':');
        mode = (m || 'register').toLowerCase();
        requestedRole = r;
      } else if (state) {
        requestedRole = state;
      }

      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (err) {
        if (err.name === 'USER_NOT_FOUND') {
          const roleParam = requestedRole && ['Candidate', 'Client'].includes(requestedRole)
            ? `&role=${requestedRole}` : '';
          return res.redirect(`${frontendBase}/oauth-callback?error=user_not_found${roleParam}`);
        }
        return res.redirect(`${frontendBase}/oauth-callback?error=oauth_failed`);
      }

      if (!user) {
        return res.redirect(`${frontendBase}/oauth-callback?error=oauth_failed`);
      }

      if (mode === 'login' && requestedRole && ['Candidate', 'Client'].includes(requestedRole) && user.role !== requestedRole) {
        return res.redirect(`${frontendBase}/oauth-callback?error=wrong_role&expected=${requestedRole}&actual=${user.role}`);
      }

      if (mode === 'register' && requestedRole && ['Candidate', 'Client'].includes(requestedRole) && user.role !== requestedRole) {
        const rolePath = requestedRole === 'Client' ? '/client/register' : '/candidate/register';
        return res.redirect(`${frontendBase}${rolePath}?error=email_exists_in_other_role&existingRole=${user.role}`);
      }

      // ✅ FIXED JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1d' }
      );

      const responseData = {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isGoogleUser: user.isGoogleUser,
          isPremium: user.isPremium || false
        }
      };

      // ✅ FIXED Candidate profile
      if (user.role === 'Candidate' && user.profile) {
        responseData.user.hasProfile = true;
        responseData.user.profileId = user.profile;
      }

      // ✅ Single Client check
      if (user.role === 'Client') {
        try {
          const Company = require('../models/Company');
          const company = await Company.findOne({ userId: user._id });
          if (company) {
            responseData.user.hasCompanyDetails = true;
            responseData.user.companyId = company._id;
          } else {
            responseData.user.hasCompanyDetails = false;
          }
        } catch (companyError) {
          console.error('Error checking company details:', companyError);
          responseData.user.hasCompanyDetails = false;
        }
      }

      // ✅ Only one redirectUrl
      const redirectUrl = `${frontendBase}/oauth-callback?data=${encodeURIComponent(JSON.stringify(responseData))}`;
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendBase}/oauth-callback?error=oauth_failed`);
    }
  })(req, res, next);
});


// Google OAuth login with role selection
router.get('/google/register/:role', (req, res, next) => {
  const { role } = req.params;
  if (!['Candidate', 'Client'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: `register:${role}`
  })(req, res, next);
});

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working' });
});

// Google OAuth login initiation with role selection (no auto-registration)
// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working' });
});

// Google OAuth login initiation with role selection (no auto-registration)
router.get('/google/login/:role', (req, res, next) => {
  const { role } = req.params;
  console.log('Google login route hit:', req.path, 'Role:', role);
  console.log('Google login route hit:', req.path, 'Role:', role);
  if (!['Candidate', 'Client'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: `login:${role}`
  })(req, res, next);
});

// Removed legacy callback/initiation routes in favor of unified /google/callback with state-driven flow

// Removed legacy callback/initiation routes in favor of unified /google/callback with state-driven flow









// --------------------------forget
// Forgot Password - Send verification code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code in user document (you might want to create a separate collection for this)
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send email with verification code
    const emailSent = await sendPasswordResetEmail(user, verificationCode);

    if (!emailSent) {
      // For development/testing, you can log the code instead of sending email
      console.log('Verification code for testing:', verificationCode);
      // Uncomment the line below to require email setup
      // return res.status(500).json({ message: 'Failed to send email. Please check email configuration.' });
    }

    res.json({ message: 'Verification code sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify Code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, verificationCode, role } = req.body;

    if (!email || !verificationCode || !role) {
      return res.status(400).json({ message: 'Email, verification code, and role are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const storedCode = user.resetPasswordCode?.toString().trim();
    const receivedCode = verificationCode?.toString().trim();

    if (!storedCode || storedCode !== receivedCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    res.json({ message: 'Code verified successfully' });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, verificationCode, newPassword, role } = req.body;

    if (!email || !verificationCode || !newPassword || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/Commonlogin", async (req, res) => {
  const { email, password } = req.body;

  const userTypes = [
    { model: Instructor, role: "instructor" },
    { model: Interviewer, role: "interviewer" },
    { model: Feedbacker, role: "feedbacker" },
    { model: Admin, role: "admin" },
  ];

  for (const userType of userTypes) {
    const user = await userType.model.findOne({ email }).select('+password');
    if (user) {
      if (!user.password) {
        return res.status(500).json({ success: false, message: "User has no password set" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user._id, role: userType.role },       // payload
        process.env.JWT_SECRET || 'supersecretkey',  // secret
        { expiresIn: "1d" }                          // options
      );
      
      

      return res.json({
        success: true,
        token,
        role: userType.role,
        id: user._id,
        name: user.name,
      });
    }
  }


  res.status(404).json({ success: false, message: "User not found" });
});


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// Store verification codes in memory (in production, use Redis)
const verificationCodes = new Map();

// Generate random 6-digit code
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Email availability check (no side effects)
router.post('/check-email', [
  body('email').isEmail().withMessage('Invalid email format')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ exists: true, existingRole: existingUser.role });
    }
    return res.json({ exists: false });
  } catch (err) {
    console.error('check-email error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Client Registration
router.post('/clientRegister', [
  body('username').notEmpty().trim().withMessage('Username is required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required')
], async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        existingRole: existingUser.role,
        field: 'email'
      });
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new unverified user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      isVerified: false
    });
    await user.save();

    // Generate verification code
    const verificationCode = generateVerificationCode();
    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt: Date.now() + 3600000, // 1 hour expiry
      userId: user._id
    });

    // Send verification email
    try {
      await transporter.sendMail({
        from: 'JobilioHR <info@jobiliohr.com>',
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email Verification</h2>
            <p>Hello ${username},</p>
            <p>Please use the following verification code to complete your registration:</p>
            <div style="background: #f3f4f6; padding: 10px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; letter-spacing: 3px;">${verificationCode}</h3>
            </div>
            <p>This code will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Rollback user creation if email fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        error: 'Failed to send verification email',
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    // Generate JWT token (limited permissions until verified)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        isVerified: false // Frontend can check this
      },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      token,
      requiresVerification: true
    });

  } catch (err) {
    console.error('Registration error:', err);
    // Handle duplicate key errors from database
    if (err && err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({
          error: 'Email already exists',
          field: 'email'
        });
      }
      if (err.keyPattern && err.keyPattern.username) {
        // If this triggers, there is a unique index on username that should be removed.
        return res.status(400).json({
          error: 'Username already exists',
          field: 'username'
        });
      }
      return res.status(400).json({ error: 'Duplicate value' });
    }
    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Send Verification Email

router.post('/send-verification',
  [
    body('email').isEmail().withMessage('Invalid email format')
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      // Check for recent verification request (rate limiting)
      const existingCode = verificationCodes.get(email);
      if (existingCode && existingCode.expiresAt > Date.now() - 300000) { // 5 minute cooldown
        return res.status(429).json({
          message: 'Please wait before requesting a new code',
          retryAfter: Math.ceil((existingCode.expiresAt - (Date.now() - 300000)) / 1000)
        });
      }

      // Generate and store new code
      const verificationCode = generateVerificationCode();
      verificationCodes.set(email, {
        code: verificationCode,
        expiresAt: Date.now() + 3600000, // 1 hour expiry
        attempts: 0 // Track verification attempts
      });

      // Send email
      const mailOptions = {
        from: 'JobilioHR <info@jobiliohr.com>',
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <h2>Email Verification</h2>
          <p>Please use the following verification code to complete your registration:</p>
          <h3>${verificationCode}</h3>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });

    } catch (err) {
      console.error('Verification email error:', err.message);
      res.status(500).json({
        message: 'Failed to send verification code',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// Verify Email
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const storedCode = verificationCodes.get(email);
    if (!storedCode || storedCode.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Clean up
    verificationCodes.delete(email);

    res.json({ verified: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Resend Verification Code
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Check if there's a recent code
    const existingCode = verificationCodes.get(email);
    if (existingCode && (Date.now() - existingCode.expiresAt) < -300000) { // 5 minute cooldown
      return res.status(429).json({ message: 'Please wait before requesting a new code' });
    }

    // Generate and send new code
    const verificationCode = generateVerificationCode();
    verificationCodes.set(email, { code: verificationCode, expiresAt: Date.now() + 3600000 });

    const mailOptions = {
      from: 'JobilioHR <info@jobiliohr.com>',
      to: email,
      subject: 'New Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Verification Code</h2>
          <p>Hello ${user.username},</p>
          <p>Here's your new verification code:</p>
          <div style="background: #f3f4f6; padding: 10px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; letter-spacing: 3px;">${verificationCode}</h3>
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} JobilioHR. All rights reserved.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'New verification code sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;