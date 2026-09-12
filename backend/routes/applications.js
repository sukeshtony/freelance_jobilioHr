const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const auth = require('../middleware/auth');
const mongoose = require("mongoose");

// GET /api/applications/company - Get all applications for jobs posted by the current user (company)
// In your backend route (/company)
router.get('/company', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }, '_id');
    const jobIds = jobs.map(j => j._id);

    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'jobTitle companyName location')
      .populate('applicantId', 'username email isPremium') // Add this to get premium status
      .sort({ appliedAt: -1 });

    // Map applications to include premium status
    const enrichedApplications = applications.map(app => ({
      ...app.toObject(),
      userName: app.applicantId.username,
      email: app.applicantId.email,
      isPremium: app.applicantId.isPremium || false
    }));

    res.json({ success: true, applications: enrichedApplications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error while fetching applications.' });
  }
});

// In your routes file
router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    // Validate status
    const allowedStatuses = ['shortlisted', 'rejected', 'hired'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowedStatuses
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('applicantId', 'name email');  // Changed from 'user' to 'applicantId'

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);

  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({
      error: 'Server error',
      details: err.message
    });
  }
});

// PUT /api/applications/:id/status - Update application status (PUT method for frontend compatibility)
router.put('/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid application ID'
      });
    }

    // Validate status
    const allowedStatuses = ['shortlisted', 'rejected', 'hired', 'pending'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        allowedStatuses
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('applicantId', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: `Application status updated to ${status} successfully!`,
      application
    });

  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: err.message
    });
  }
});

module.exports = router;