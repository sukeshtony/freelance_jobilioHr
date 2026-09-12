const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Profile } = require('../models/User');
const jwt = require('jsonwebtoken');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
//const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
  passReqToCallback: true,
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Parse state for mode and role. Supported formats:
    // - 'Candidate' (backward compat, treated as register for Candidate)
    // - 'register:Candidate'
    // - 'login:Client'
    let state = req.query.state || 'register:Candidate';
    let mode = 'register';
    let requestedRole = 'Candidate';
    if (state.includes(':')) {
      const parts = state.split(':');
      mode = (parts[0] || 'register').toLowerCase();
      requestedRole = parts[1] || 'Candidate';
    } else {
      requestedRole = state || 'Candidate';
      mode = 'register';
    }

    const email = profile.emails[0].value;

    console.log('--- GOOGLE CALLBACK DEBUG ---');
    console.log('Mode from state:', mode);
    console.log('Requested role from state:', requestedRole);
    console.log('Google profile email:', email);

    let user = await User.findOne({ email });

    if (user) {
      // Mark in session that this OAuth attempt matched an existing user
      req.session = req.session || {};
      req.session.oauthExistingUser = true;
      return done(null, user);
    }

    // If this was a login-only flow and no user exists, signal error
    if (mode === 'login') {
      const err = new Error('USER_NOT_FOUND');
      err.name = 'USER_NOT_FOUND';
      return done(err, null);
    }

    // Create new user (register flow only)
    const newUser = new User({
      username: profile.displayName,
      email,
      googleId: profile.id,
      role: requestedRole,
      isGoogleUser: true
    });

    const savedUser = await newUser.save();
    // Mark in session that this OAuth attempt created a new user
    req.session = req.session || {};
    req.session.oauthExistingUser = false;

    // Create profile if role is Candidate
    if (requestedRole === 'Candidate') {
      const profileData = new Profile({
        userId: savedUser._id,
        name: profile.displayName,
        email,
        phone: '',
        title: '',
        experience: 0,
        isDraft: true,
        skills: [],
        companies: [],
        education: []
      });

      await profileData.save();

      savedUser.profile = profileData._id;
      await savedUser.save();
    }

    return done(null, savedUser);

  } catch (error) {
    console.error('OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
