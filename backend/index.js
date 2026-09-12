require('dotenv').config();
console.log("Dotenv loaded SMTP_EMAIL =", process.env.SMTP_EMAIL);
console.log("Current working directory =", process.cwd());


const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/googleOAuth');
const app = express();


const allowedOrigins = [
  'https://api.jobiliohr.xyz',
  'https://jobiliohr.xyz',
  'https://www.jobiliohr.xyz',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  // Ensure there is NO unique index on username (username should NOT be unique)
  (async () => {
    try {
      const usersCollection = mongoose.connection.db.collection('users');
      const indexes = await usersCollection.indexes();
      const usernameIndexes = indexes.filter(ix => ix.key && ix.key.username === 1 && ix.unique);
      for (const idx of usernameIndexes) {
        try {
          await usersCollection.dropIndex(idx.name);
          console.log(`Dropped unique index on username: ${idx.name}`);
        } catch (dropErr) {
          console.error('Failed to drop username index:', dropErr.message || dropErr);
        }
      }
    } catch (idxErr) {
      console.error('Error checking/dropping username indexes:', idxErr.message || idxErr);
    }
  })();
});
const resumeParser = require('./routes/resume_parser');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const ProfileRoutes = require('./routes/profile');
const candidateRoutes = require('./routes/candidate');
const requirementsRoutes = require('./routes/requirements');
const examRoutes = require('./routes/exambooking');
const CourseRoutes = require('./routes/course');
const TestRoutes = require('./routes/test');
const InterviewerRoutes = require('./routes/interviewer');
const InterviewRoutes = require('./routes/interview');
const Enrollment = require('./routes/enrollment');
const CallBookingRoutes = require('./routes/callbookings');
const AdminCallBooking = require('./routes/adminCall');
const CompanyRoutes = require('./routes/company');
const JobRoutes = require('./routes/job');
const AdminClients = require('./routes/adminClients')
const ApplicationsRoutes = require('./routes/applications');

const PaymentRoutes = require('./routes/payment');
const AdminInstructor = require('./routes/instructor');
const PendingFeedback = require('./routes/pendingFeedback');
const Feedbacker = require('./routes/feedbacker');
const contactRoutes = require('./routes/contactRoutes');
const creditsRoutes = require('./routes/credits');
const externalJobsRoutes = require('./routes/externalJobs');

app.use('/uploads', express.static('uploads'));
app.use('/api/resume', resumeParser);
app.use('/api/auth', authRoutes);
app.use('/api/profile', ProfileRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/requirements', requirementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/courses', CourseRoutes);
app.use('/api/enrollments', Enrollment);
app.use('/api/admin/tests', TestRoutes);
app.use('/api/admin/interviewers', InterviewerRoutes);
app.use('/api/interview', InterviewRoutes);
app.use('/api/bookings', CallBookingRoutes);
app.use('/api/admin/bookings', AdminCallBooking);
app.use('/api/company', CompanyRoutes);
app.use('/api/jobs', JobRoutes);
app.use('/api/admin/clients', AdminClients)
app.use('/api/applications', ApplicationsRoutes);

app.use('/api/payment', PaymentRoutes);
app.use('/api/admin/instructors', AdminInstructor);
app.use('/api', PendingFeedback);
app.use('/api/feedbackers', Feedbacker);
app.use('/api/contact', contactRoutes);
app.use('/api', creditsRoutes);
app.use('/api/external-jobs', externalJobsRoutes);

// Import and use leads routes
const leadsRoutes = require('./routes/leads');
app.use('/api/leads', leadsRoutes);


app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
