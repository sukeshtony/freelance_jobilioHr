const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Interview = require('../models/Interview')
const Interviewer = require('../models/Interviewer');
const Candidate = require('../models/Candidate');

// GET all interviewers
router.get('/', async (req, res) => {
  try {
    const interviewers = await Interviewer.find().select('-password'); // exclude passwords
    res.json(interviewers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviewers' });
  }
});


router.get('/by-category', async (req, res) => {
  try {
    const { category } = req.query;

    if (!category || !['IT', 'Non-IT'].includes(category)) {
      return res.status(400).json({ message: 'Valid category (IT or Non-IT) is required' });
    }

    const interviewers = await Interviewer.find({ category });
    res.json(interviewers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new interviewer (with password hashing)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, title, skills, category, rating } = req.body;

    // Check if email already exists
    const existing = await Interviewer.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create interviewer
    const interviewer = new Interviewer({
      name,
      email,
      password: hashedPassword,
      title,
      skills,
      category,
      rating
    });

    await interviewer.save();
    const { password: _, ...interviewerData } = interviewer.toObject(); // exclude password
    res.status(201).json(interviewerData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update interviewer (with optional password hash)
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If password field is not empty, hash it; otherwise, remove it from update
    if (updateData.password && updateData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const interviewer = await Interviewer.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!interviewer)
      return res.status(404).json({ error: 'Interviewer not found' });

    const { password: _, ...interviewerData } = interviewer.toObject();
    res.json(interviewerData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// DELETE interviewer
router.delete('/:id', async (req, res) => {
  try {
    const result = await Interviewer.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Interviewer not found' });
    res.json({ message: 'Interviewer deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


const mongoose = require('mongoose');

router.get("/interviews/:id", async (req, res) => {
  try {
    const interviewerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(interviewerId)) {
      return res.status(400).json({ message: "Invalid interviewer ID" });
    }

    const interviews = await Interview.find({
      interviewer: interviewerId,
      status: { $ne: "Completed" } 
    })
      .populate({
        path: "candidate",
        select: "username name email"
      })
      .populate({
        path: "interviewer",
        select: "name email"
      });

    const formattedInterviews = interviews.map(interview => ({
      ...interview._doc,
      candidate: interview.candidate || null,
      interviewer: interview.interviewer || null
    }));

    res.status(200).json(formattedInterviews);
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({ message: "Error fetching interviews", error });
  }
});


// Get full interviewer profile with stats
router.get('/:id/profile', async (req, res) => {
  try {
    const interviewerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(interviewerId)) {
      return res.status(400).json({ error: 'Invalid interviewer ID' });
    }

    const interviewer = await Interviewer.findById(interviewerId)
      .select('-password')

    if (!interviewer) {
      return res.status(404).json({ error: 'Interviewer not found' });
    }

    const interviews = await Interview.find({ 'interviewer._id': interviewerId })
      .sort({ date: -1 })
      .lean();

    // Calculate average rating only if there are rated interviews
    const ratedInterviews = interviews.filter(i => i.result?.score);
    const averageRating = ratedInterviews.length > 0
      ? ratedInterviews.reduce((acc, i) => acc + i.result.score, 0) / ratedInterviews.length
      : 0;

    const response = {
      ...interviewer,
      stats: {
        totalInterviews: interviews.length,
        completedCount: interviews.filter(i => i.status === 'Completed').length,
        upcomingCount: interviews.filter(i => i.status === 'Scheduled').length,
        ratedInterviews: ratedInterviews.length,
        totalRating: ratedInterviews.reduce((acc, i) => acc + i.result.score, 0),
        averageRating: parseFloat(averageRating.toFixed(1)) // Round to 1 decimal place
      },
      recentInterviews: interviews.slice(0, 5)
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching interviewer profile:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});



router.delete("/interviews/orphan-candidates", async (req, res) => {
  try {
    const interviews = await Interview.find();
    const candidateIds = await Candidate.find().distinct("_id");

    const result = await Interview.deleteMany({
      candidate: { $nin: candidateIds },
    });

    res.status(200).json({
      message: "Deleted interviews with non-existent candidates.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting orphan interviews", error });
  }
});



router.get('/:id/availability', async (req, res) => {
  try {
    const interviewer = await Interviewer.findById(req.params.id);
    if (!interviewer) {
      return res.status(404).json({ message: 'Interviewer not found' });
    }

    // Return both availability days and default time slots
    res.json({
      availability: interviewer.availability || [],
      defaultSlots: interviewer.defaultSlots || [
        "09:00 AM",
        "10:00 AM",
        "11:00 AM",
        "01:00 PM",
        "02:00 PM",
        "03:00 PM"
      ]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/availability', async (req, res) => {
  try {
    const { availability, defaultSlots } = req.body;

    // Validate input
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: 'Invalid availability data' });
    }

    if (!defaultSlots || !Array.isArray(defaultSlots)) {
      return res.status(400).json({ message: 'Invalid time slots data' });
    }

    // Validate and convert each slot to AM/PM format
    const formattedSlots = defaultSlots.map(slot => {
      // If already in AM/PM format, keep it
      if (/(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)/i.test(slot)) {
        return slot.toUpperCase(); // Ensure uppercase (e.g., "am" → "AM")
      }

      // If in 24-hour format (e.g., "14:30"), convert to AM/PM
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot)) {
        const [hours, minutes] = slot.split(':');
        const hourInt = parseInt(hours, 10);
        const period = hourInt >= 12 ? 'PM' : 'AM';
        const twelveHour = hourInt % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${twelveHour}:${minutes} ${period}`;
      }

      // If invalid format, throw an error
      throw new Error(`Invalid time slot format: ${slot}. Use "HH:MM AM/PM" or "HH:MM" (24-hour).`);
    });

    const updatedInterviewer = await Interviewer.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          availability: availability,
          defaultSlots: formattedSlots // Save formatted slots
        }
      },
      { new: true }
    );

    if (!updatedInterviewer) {
      return res.status(404).json({ message: 'Interviewer not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      availability: updatedInterviewer.availability,
      defaultSlots: updatedInterviewer.defaultSlots
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get available time slots for specific date
router.get('/:id/slots', async (req, res) => {

  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const interviewer = await Interviewer.findById(req.params.id);
    if (!interviewer) {
      return res.status(404).json({ message: 'Interviewer not found' });
    }

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!interviewer.availability.includes(dayName)) {
      return res.json({ timeSlots: [] });
    }

    const bookedSlots = await Interview.find({
      interviewer: req.params.id,
      date: new Date(date)
    }).select('time');

    const availableSlots = interviewer.defaultSlots.filter(slot =>
      !bookedSlots.some(b => b.time === slot)
    );

    console.log("Booked Slots:", bookedSlots);
    console.log("Default Slots:", interviewer.defaultSlots);
    res.json({ timeSlots: availableSlots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    const interviewers = await Interviewer.find({
      _id: { $in: ids }
    }).select('-password');

    const interviewersMap = interviewers.reduce((map, interviewer) => {
      map[interviewer._id] = interviewer;
      return map;
    }, {});

    res.json({
      success: true,
      data: interviewersMap
    });
  } catch (error) {
    console.error('Error in batch interviewers endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interviewers'
    });
  }
});

module.exports = router;