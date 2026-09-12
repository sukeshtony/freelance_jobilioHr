const express = require('express');
const router = express.Router();
const Interviewer = require('../models/Interviewer');
const Interview = require('../models/Interview');
const auth = require("../middleware/auth");


// ✅ Get available interviewers by category
router.get('/experts', async (req, res) => {
    try {
        const { type } = req.query;
        const interviewers = await Interviewer.find({ category: type });
        res.json(interviewers);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get all interviews
router.get('/bookings/:id', auth, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('interviewer', 'name avatar role rating interviewCount expertise')
            .populate('candidate', 'name email');

        if (!interview) return res.status(404).json({ message: "Interview not found" });

        res.json(interview);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch interview', error: err.message });
    }
});


// ✅ Book an interview without token (pass userId directly)

router.post('/bookings', auth, async (req, res) => {
    const { interviewerId, date, time, interviewType } = req.body;

    try {
        const existing = await Interview.findOne({
            candidate: req.user.id,
            date,
            time,
        });

        if (existing) {
            return res.status(400).json({ error: "You already have a booking at this time." });
        }

        const newInterview = new Interview({
            candidate: req.user.id, 
            interviewer: interviewerId,
            date,
            time,
            interviewType,
            status: 'Scheduled',
        });

        const savedInterview = await newInterview.save();
        res.status(201).json(savedInterview);
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).json({ error: 'Interview booking failed', details: err.message });
    }
});


// ✅ PATCH /api/interview/bookings/:id
router.patch('/bookings/:id', async (req, res) => {
  try {
    const { status, result, meetingLink } = req.body;

    const updateFields = {};

    if (status !== undefined) updateFields.status = status;
    if (meetingLink !== undefined) updateFields.meetingLink = meetingLink;
    if (result !== undefined) {
      updateFields.result = {
        passed: result.passed,
        score: result.score,
        feedback: result.feedback,
        topics: result.topics,
        strengths: result.strengths,
        areasToImprove: result.areasToImprove,
        recommendations: result.recommendations
      };
    }

    // Step 1: Fetch the existing interview to compare status
    const existingInterview = await Interview.findById(req.params.id);
    if (!existingInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const previousStatus = existingInterview.status;

    // Step 2: Update the interview
    const updatedInterview = await Interview.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    // Step 3: If status changed from Scheduled → Completed, increment count
    if (
      previousStatus === 'Scheduled' &&
      updatedInterview.status === 'Conducted'
    ) {
      const interviewer = await Interviewer.findById(updatedInterview.interviewer);
      if (interviewer) {
        interviewer.interviewCount = (interviewer.interviewCount || 0) + 1;
        await interviewer.save();
      }
    }

    res.json(updatedInterview);
  } catch (err) {
    console.error('Update interview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




// ✅ Cancel interview
router.delete('/bookings/:id', async (req, res) => {
    try {
        const interview = await Interview.findByIdAndDelete(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        res.json({ message: 'Interview deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// ✅ Get available time slots for an expert on a given date
router.get('/availability', async (req, res) => {
    try {
        const { expertId, date } = req.query;

        if (!expertId || !date) {
            return res.status(400).json({ message: 'Missing expertId or date' });
        }

        // You can implement custom logic here. For now, just mock some data:
        const mockTimeSlots = [
            '10:00 AM',
            '11:00 AM',
            '2:00 PM',
            '3:00 PM',
            '10:40 PM'
        ];

        res.json({ date, timeSlots: mockTimeSlots });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get interviews for the currently authenticated user
router.get('/my-interviews', auth, async (req, res) => {
    try {
        const { includeCancelled } = req.query;
        const baseFilter = { candidate: req.user.id };
        const filter = includeCancelled === 'true' ? baseFilter : { ...baseFilter, status: { $ne: 'Cancelled' } };

        const interviews = await Interview.find(filter)
            .populate('interviewer', 'name avatar role expertise')
            .sort({ date: -1, time: -1 }); // Sort by most recent first

        res.json(interviews);
    } catch (err) {
        res.status(500).json({
            message: 'Error fetching your interviews',
            error: err.message
        });
    }
});

// ✅ Get all interviews (admin only - consider adding admin auth middleware)
router.get('/bookings',  async (req, res) => {
    try {
        const { includeCancelled } = req.query;
        const filter = includeCancelled === 'true' ? {} : { status: { $ne: 'Cancelled' } };

        const interviews = await Interview.find(filter)
            .populate('interviewer', 'name avatar role expertise')
            .populate('candidate', 'username email');
        res.json(interviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Cancel interview (soft cancel)
router.post('/bookings/:id/cancel', auth, async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Allow cancel if candidate owns it or user is admin
        const isOwner = String(interview.candidate) === String(req.user.id);
        const isAdmin = req.user.role === 'Admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to cancel this interview' });
        }

        if (['Completed', 'Conducted'].includes(interview.status)) {
            return res.status(400).json({ message: 'Completed interviews cannot be cancelled' });
        }

        interview.status = 'Cancelled';
        await interview.save();
        res.json({ message: 'Interview cancelled successfully', interview });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;