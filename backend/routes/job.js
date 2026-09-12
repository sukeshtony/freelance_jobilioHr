const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});



router.get('/resumes/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Resume not found' });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', 'inline'); // 👈 ensures browser renders it
  res.sendFile(filePath);
});


// Auth middleware function
const authMiddleware = (req, res, next) => {
  // Extract token from headers (common convention: `x-auth-token` or `Authorization: Bearer <token>`)
  const token = req.header('x-auth-token') || req.headers.authorization?.split(' ')[1];

  console.log('Token received:', token ? 'Present' : 'Missing');
  console.log('Headers:', req.headers);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify token and extract user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    const normalizedId = (decoded && (decoded.id || decoded._id || decoded.userId)) ? (decoded.id || decoded._id || decoded.userId).toString() : undefined;
    console.log('Token decoded successfully:', { id: normalizedId, role: decoded.role });
    req.user = { ...decoded, id: normalizedId }; // Normalize id onto req.user.id for consistency
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/jobs - Get jobs posted by the current user (requires auth)
router.get('/', authMiddleware, async (req, res) => {
  console.log('GET /api/jobs endpoint reached');
  console.log('User from token:', req.user);

  try {
    const userId = req.user.id;

    // 1. Get jobs posted by this user
    const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });

    // 2. Get all applications for these jobs
    const jobIds = jobs.map(job => job._id);

    const applications = await JobApplication.find({ jobId: { $in: jobIds } });

    // 3. Count stats
    const activeJobsCount = jobs.filter(job => job.status === 'active').length;
    const totalApplications = applications.length;
    const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;
    const hiredCount = applications.filter(app => app.status === 'hired').length;

    res.json({
      success: true,
      jobs,
      count: jobs.length,
      activeJobsCount,
      totalApplications,
      shortlistedCount,
      hiredCount
    });
  } catch (error) {
    console.error('Error fetching jobs and stats:', error);
    res.status(500).json({ message: 'Server error while fetching jobs and stats.' });
  }
});


// GET /api/jobs/public - Get all public jobs (no auth required)
router.get('/public', async (req, res) => {
  console.log('GET /api/jobs/public endpoint reached');

  try {
    const { status, limit = 20, jobType, location } = req.query;

    let query = {
      status: { $ne: 'closed' }  // ✅ Exclude closed jobs
    };

    if (status) {
      query.status = status; // Override if explicit filter is provided (optional)
    }

    if (jobType) {
      query.jobType = { $regex: jobType, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('postedBy', 'username email')
      .lean();

    // Map to include applyUrl and isExternal flags for frontend
    const mapped = jobs.map(j => ({
      ...j,
      isExternal: !!j.isExternalLink,
      applyUrl: j.isExternalLink ? (j.externalLink || null) : null
    }));

    res.json({
      success: true,
      data: mapped,
      count: mapped.length
    });
  } catch (error) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json({ message: 'Server error while fetching jobs.' });
  }
});


// POST /api/jobs (now properly protected)
router.post('/', authMiddleware, async (req, res) => {
  console.log('POST /api/jobs endpoint reached');
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);

  try {
    // Normalize incoming fields from client form into schema
    const {
      position,
      type,
      band,
      qualification,
      essentialHiringSkills,
      responsibility,
      shift,
      role,
      industryType,
      department,
      employmentType,
      roleCategory,
      education,
      keySkills,
      aboutCompany,
      jobTitle,
      jobType,
      location,
      description,
      requirements,
      companyName,
      applicationDeadline,
      vacancies,
      isFeatured,
      salary,
      experienceLevel
    } = req.body;

    const normalized = {
      jobTitle: jobTitle || position || '',
      jobType: jobType || type || '',
      location,
      department,
      salary,
      experienceLevel,
      description,
      requirements,
      companyName,
      applicationDeadline,
      vacancies,
      isFeatured,
      // External link flags from client
      isExternalLink: req.body.isExternalLink || false,
      externalLink: req.body.externalLink || '',
      // New fields
      position: position || jobTitle,
      band,
      qualification,
      essentialHiringSkills: Array.isArray(essentialHiringSkills)
        ? essentialHiringSkills
        : (essentialHiringSkills ? String(essentialHiringSkills).split(',').map(s => s.trim()).filter(Boolean) : []),
      responsibility,
      shift,
      role,
      industryType,
      employmentType,
      roleCategory,
      education,
      keySkills: Array.isArray(keySkills)
        ? keySkills
        : (keySkills ? String(keySkills).split(',').map(s => s.trim()).filter(Boolean) : []),
      aboutCompany,
      postedBy: req.user.id
    };

    console.log('Job data to save:', normalized);

    const newJob = new Job(normalized);
    await newJob.save();

    console.log('Job saved successfully:', newJob._id);
    res.status(201).json({ message: 'Job posted successfully!' });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ message: 'Server error while posting job.' });
  }
});

// PUT /api/jobs/:id/status - Update job status (requires auth)
router.put('/:id/status', authMiddleware, async (req, res) => {
  console.log('PUT /api/jobs/:id/status endpoint reached');
  console.log('Job ID:', req.params.id);
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);

  try {
    const { status } = req.body;
    
    if (!status || !['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Status must be active, paused, or closed.' 
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ 
        success: false,
        message: 'Job not found' 
      });
    }

    // Check if the user owns this job or is an admin
    const isOwner = job.postedBy.toString() === req.user.id;
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this job' 
      });
    }

    // Update the job status
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { 
        status: status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    console.log('Job status updated successfully:', updatedJob._id, 'New status:', status);
    
    res.json({
      success: true,
      message: `Job status updated to ${status} successfully!`,
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating job status.' 
    });
  }
});

// PUT /api/jobs/:id - Update job (requires auth)
router.put('/:id', authMiddleware, async (req, res) => {
  console.log('PUT /api/jobs/:id endpoint reached');
  console.log('Job ID:', req.params.id);
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user owns this job or is an admin
    const isOwner = job.postedBy.toString() === req.user.id;
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    // Normalize fields to support alternate names (position/type)
    const {
      position,
      type,
      band,
      qualification,
      essentialHiringSkills,
      responsibility,
      vacancies,
      shift,
      role,
      industryType,
      department,
      employmentType,
      roleCategory,
      education,
      keySkills,
      aboutCompany,
      jobTitle,
      jobType,
      location,
      description,
      requirements,
      companyName,
      salary,
      experienceLevel
    } = req.body;

    const normalizedJobTitle = (position && String(position).trim()) ? String(position).trim() : (jobTitle || '').trim();
    const normalizedJobType = (type && String(type).trim()) ? String(type).trim() : (jobType || '').trim();

    // Validate required fields
    if (!normalizedJobTitle || !normalizedJobType || !location || !description || !requirements || !companyName) {
      return res.status(400).json({ 
        message: 'Missing required fields. Please fill in all required fields.' 
      });
    }

    // Process the update data (including new extended fields)
    // Helper to parse comma-separated strings into arrays; empty string clears the field
    const parseList = (value, fallback) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return [];
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
      return fallback;
    };

    const updateData = {
      jobTitle: normalizedJobTitle,
      jobType: normalizedJobType,
      location,
      description,
      requirements,
      applicationDeadline: req.body.applicationDeadline,
      companyName,
      salary,
      vacancies,
      experienceLevel,
      department,
      // Extended
      position: (position && String(position).trim()) ? String(position).trim() : normalizedJobTitle,
      band,
      qualification,
      responsibility,
      shift,
      role,
      industryType,
      employmentType,
      roleCategory,
      education,
      aboutCompany,
      // External link flags
      isExternalLink: req.body.isExternalLink || false,
      externalLink: req.body.externalLink || '',
      // Arrays from string or array
      essentialHiringSkills: parseList(essentialHiringSkills, job.essentialHiringSkills),
      keySkills: parseList(keySkills, job.keySkills),
      updatedAt: Date.now()
    };

    // Handle date conversion for applicationDeadline, allow clearing it with empty string
    if (Object.prototype.hasOwnProperty.call(updateData, 'applicationDeadline')) {
      if (updateData.applicationDeadline === '' || updateData.applicationDeadline === null) {
        updateData.applicationDeadline = null;
      }
    }

    if (updateData.applicationDeadline) {
      console.log('Processing applicationDeadline:', updateData.applicationDeadline);
      console.log('Type of applicationDeadline:', typeof updateData.applicationDeadline);
      
      try {
        // Handle different date formats
        if (typeof updateData.applicationDeadline === 'string') {
          // If it's already a valid date string, create Date object
          const date = new Date(updateData.applicationDeadline);
          if (!isNaN(date.getTime())) {
            updateData.applicationDeadline = date;
            console.log('Successfully converted string to Date:', date);
          } else {
            console.error('Invalid date string:', updateData.applicationDeadline);
            return res.status(400).json({ 
              message: 'Invalid application deadline date format. Please use YYYY-MM-DD format.' 
            });
          }
        } else if (updateData.applicationDeadline instanceof Date) {
          // Already a Date object, validate it
          if (isNaN(updateData.applicationDeadline.getTime())) {
            console.error('Invalid Date object:', updateData.applicationDeadline);
            return res.status(400).json({ 
              message: 'Invalid application deadline date.' 
            });
          }
          console.log('Valid Date object:', updateData.applicationDeadline);
        } else {
          console.error('Unexpected date type:', typeof updateData.applicationDeadline);
          return res.status(400).json({ 
            message: 'Invalid application deadline format.' 
          });
        }
      } catch (error) {
        console.error('Error processing applicationDeadline:', error);
        return res.status(400).json({ 
          message: 'Error processing application deadline date.' 
        });
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Job status updated successfully:', updatedJob._id);
    res.json({
      success: true,
      message: 'Job updated successfully!',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating job.' });
  }
});

// DELETE /api/jobs/:id - Delete job (requires auth)
router.delete('/:id', authMiddleware, async (req, res) => {
  console.log('DELETE /api/jobs/:id endpoint reached');
  console.log('Job ID:', req.params.id);
  console.log('User from token:', req.user);

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user owns this job or is an admin
    const isOwner = job.postedBy.toString() === req.user.id;
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    console.log('Job deleted successfully:', req.params.id);
    res.json({
      success: true,
      message: 'Job deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error while deleting job.' });
  }
});


// POST /api/jobs/:id/apply - Apply for a job (requires auth)
router.post('/:id/apply', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('POST /api/jobs/:id/apply endpoint reached');
  console.log('Job ID:', req.params.id);
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  console.log('File:', req.file);

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // NOTE: Previously external jobs were blocked from accepting applications here
    // and the client was instructed to redirect. That prevented DB-stored external
    // jobs from recording applications. We now allow applications to be saved for
    // jobs that exist in our database (regardless of isExternalLink). For client
    // convenience the response will include `applyUrl` when an external link is present.

    // Auto-close job if deadline passed
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      if (job.status !== 'closed') {
        job.status = 'closed';
        await job.save();
      }
      return res.status(400).json({ message: 'The application deadline has passed.' });
    }

    // Block applications for paused or closed jobs
    if (job.status === 'paused') {
      return res.status(400).json({ message: 'This job is currently paused and not accepting applications.' });
    }

    if (job.status === 'closed') {
      return res.status(400).json({ message: 'This job is closed and no longer accepting applications.' });
    }

    // Do NOT cap applications by vacancies; vacancies represent hires, not application limit

    // Note: vacancies indicate number of hires, not an application cap

    // Block duplicate applications
    const existingApplication = await JobApplication.findOne({
      jobId: req.params.id,
      applicantId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    // Check if candidate has a complete profile (only for Candidate role)
    if (req.user.role === 'Candidate') {
      const { Profile } = require('../models/User');
      const profile = await Profile.findOne({ userId: req.user.id, isDraft: false });
      
      if (!profile) {
        return res.status(400).json({ 
          message: 'Please complete your profile before applying for jobs. Go to your profile page to finish setting up your profile.',
          code: 'INCOMPLETE_PROFILE'
        });
      }

      // Check profile completion percentage (70% required) - using same logic as /api/profile/progress
      let totalFields = 22;
      let completed = 0;

      if (profile.title) completed++;
      if (profile.name) completed++;
      if (profile.email) completed++;
      if (profile.phone) completed++;
      if (profile.dob) completed++;
      if (profile.gender) completed++;
      if (profile.address) completed++;
      if (profile.city) completed++;
      if (profile.state) completed++;
      if (profile.country) completed++;
      if (profile.zip) completed++;
      if (profile.linkedin) completed++;
      if (profile.experience) completed++;
      if (profile.objective) completed++;
      if (profile.jobType) completed++;
      if (profile.workMode) completed++;
      if (profile.expectedSalary) completed++;
      if (profile.noticePeriod) completed++;
      if (profile.skills?.length > 0) completed++;
      if (profile.certifications?.length > 0) completed++;
      if (profile.education?.length > 0) completed++;
      if (profile.companies?.length > 0) completed++;

      const progress = Math.floor((completed / totalFields) * 100);
      
      if (progress < 70) {
        return res.status(400).json({
          message: `Please complete your profile before applying for jobs. Your profile is currently ${progress}% complete. You need at least 70% completion to apply for jobs.`,
          code: 'INCOMPLETE_PROFILE',
          currentProgress: progress,
          requiredProgress: 70
        });
      }
    }

    // Prepare new application
    const applicationData = {
      jobId: req.params.id,
      applicantId: req.user.id,
      userName: req.body.userName,
      email: req.body.email
    };

    if (req.file) {
      applicationData.resume = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    const newApplication = new JobApplication(applicationData);
    await newApplication.save();

    // Create a lead for this job application
    try {
      const Lead = require('../models/Lead');
      
      const leadData = {
        name: req.body.userName,
        email: req.body.email,
        phone: req.user.phone || '', // Get phone from user profile if available
        source: 'job_application',
        jobId: req.params.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        applicationId: newApplication._id,
        status: 'new',
        priority: 'medium',
        score: 50, // Default score for job application leads
        tags: ['job_application', 'website_job']
      };

      // Add resume information if available
      if (req.file) {
        leadData.resume = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size
        };
      }

      const newLead = new Lead(leadData);
      await newLead.save();
      
      console.log('Lead created successfully for job application:', newLead._id);
    } catch (leadError) {
      console.error('Error creating lead:', leadError);
      // Don't fail the application if lead creation fails
    }

    // Increment application count
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { applications: 1 } },
      { new: true }
    );

    // Keep job open regardless of number of applications; closing is manual or by deadline

    console.log('Application submitted successfully:', newApplication._id);

    const responsePayload = {
      success: true,
      message: 'Application submitted successfully!',
      applicationId: newApplication._id
    };

    // If the job has an external link, include it so frontend can redirect if desired
    if (job.isExternalLink && job.externalLink) {
      responsePayload.applyUrl = job.externalLink;
    }

    res.status(201).json(responsePayload);

  } catch (error) {
    console.error('Error submitting application:', error);

    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({ message: 'Server error while submitting application.' });
  }
});


// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  }

  if (error.message.includes('Only PDF, DOC, and DOCX files are allowed')) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

// GET /api/jobs/:id/applications - Get applications for a specific job (requires auth, job owner only)
router.get('/:id/applications', authMiddleware, async (req, res) => {
  console.log('GET /api/jobs/:id/applications endpoint reached');
  console.log('Job ID:', req.params.id);
  console.log('User from token:', req.user);

  try {
    // Check if job exists and user owns it
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view applications for this job' });
    }

    // Get applications for this job
    const applications = await JobApplication.find({ jobId: req.params.id })
      .sort({ appliedAt: -1 })
      .populate('applicantId', 'username email isPremium');

    console.log(`Found ${applications.length} applications for job ${req.params.id}`);

    res.json({
      success: true,
      applications: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications.' });
  }
});

// GET /api/jobs/applied - Get jobs the current user has applied to
router.get('/applied', authMiddleware, async (req, res) => {
  console.log('GET /api/jobs/applied endpoint reached');
  console.log('User from token:', req.user);

  try {
    const applications = await JobApplication.find({ applicantId: req.user.id })
      .sort({ updatedAt: -1 }) // Optional: sort by latest updates
      .populate('jobId')
      .select('status appliedAt updatedAt resume jobId') // ✅ Include updatedAt
      .exec();

    const formattedApplications = applications.map(app => ({
      applicationId: app._id,
      status: app.status,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt, // ✅ Include in response
      resume: app.resume,
      job: app.jobId,
    }));

    res.json({
      success: true,
      appliedJobs: formattedApplications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({ message: 'Server error while fetching applied jobs.' });
  }
});



// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  next();
};

// GET /api/jobs/admin/jobs - Get all jobs posted by all clients (admin only)
router.get('/admin/jobs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .populate('postedBy', 'username email');

    res.json({
      success: true,
      jobs: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching all jobs for admin:', error);
    res.status(500).json({ message: 'Server error while fetching jobs.' });
  }
});

// GET /api/jobs/admin/jobs/client/:clientId - Get jobs posted by a specific client
router.get('/admin/jobs/client/:clientId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.params.clientId })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'username email');

    res.json({
      success: true,
      jobs: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching client jobs for admin:', error);
    res.status(500).json({ message: 'Server error while fetching client jobs.' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  console.log('GET /api/jobs endpoint reached');
  console.log('User from token:', req.user);

  try {
    const jobs = await Job.find({ postedBy: req.user.id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10); // Limit to 10 most recent jobs

    console.log(`Found ${jobs.length} jobs for user ${req.user.id}`);

    res.json({
      success: true,
      jobs: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error while fetching jobs.' });
  }
});

// GET /api/jobs/admin/applications/:jobId - Get candidates who applied to a specific job
router.get('/admin/applications/:jobId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .sort({ appliedAt: -1 })
      .populate('applicantId', 'username email');

    res.json({
      success: true,
      jobTitle: job.title,
      applications: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching job applications for admin:', error);
    res.status(500).json({ message: 'Server error while fetching applications.' });
  }
});


router.get('/:id/applications', authMiddleware, async (req, res) => {
  console.log('GET /api/jobs/:id/applications endpoint reached');
  console.log('Job ID:', req.params.id);
  console.log('User from token:', req.user);

  try {
    // Check if job exists and user owns it
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view applications for this job' });
    }

    // Get applications for this job
    const applications = await JobApplication.find({ jobId: req.params.id })
      .sort({ appliedAt: -1 })
      .populate('applicantId', 'username email');

    console.log(`Found ${applications.length} applications for job ${req.params.id}`);

    res.json({
      success: true,
      applications: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications.' });
  }
});

router.get('/activity', require('../middleware/auth'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent jobs posted by this client
    const jobs = await Job.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Get recent applications to this client's jobs
    const jobIds = jobs.map(j => j._id);
    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .sort({ appliedAt: -1 })
      .limit(5)
      .populate('jobId', 'jobTitle')
      .lean();
    
    // Format activities
    const jobActivities = jobs.map(job => {
      // Check if job was updated recently (within last 24 hours)
      const now = new Date();
      const updatedAt = new Date(job.updatedAt);
      const createdAt = new Date(job.createdAt);
      const isRecentlyUpdated = (now - updatedAt) < (24 * 60 * 60 * 1000) && updatedAt > createdAt;
      
      if (isRecentlyUpdated) {
        return {
          type: 'job_update',
          text: `Job updated: ${job.jobTitle}`,
          time: timeAgo(job.updatedAt),
          timeRaw: job.updatedAt
        };
      } else {
        return {
          type: 'job',
          text: `New job posted: ${job.jobTitle}`,
          time: timeAgo(job.createdAt),
          timeRaw: job.createdAt
        };
      }
    });
    
    const appActivities = applications.map(app => ({
      type: 'application',
      text: `${app.userName} applied for ${app.jobId && app.jobId.jobTitle ? app.jobId.jobTitle : 'a job'}`,
      time: timeAgo(app.appliedAt),
      timeRaw: app.appliedAt
    }));
    
    // Merge and sort by time (most recent first)
    const activities = [...jobActivities, ...appActivities]
      .sort((a, b) => {
        const timeA = new Date(a.timeRaw || a.time);
        const timeB = new Date(b.timeRaw || b.time);
        return timeB - timeA;
      })
      .slice(0, 10);
    
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity.' });
  }
});

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// Public: GET /api/jobs/:id - return job details by id (no auth required)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'username email');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    return res.json({ success: true, job });
  } catch (err) {
    console.error('Error fetching job by id:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching job.' });
  }
});

module.exports = router;