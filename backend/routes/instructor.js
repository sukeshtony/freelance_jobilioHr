// routes/instructorRoutes.js
const express = require('express');
const router = express.Router();
const Instructor = require('../models/Instructor');
const  auth  = require('../middleware/auth');
const mongoose = require('mongoose');
const Course = require('../models/Course');

// Get all instructors with populated courses
router.get('/', async (req, res) => {
  try {
    const instructors = await Instructor.find().select('-password').populate('courses', 'title code');
    res.json(instructors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new instructor (without courses)
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, title, about, field, password } = req.body;

    // Check if email already exists
    const existingInstructor = await Instructor.findOne({ email });
    if (existingInstructor) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const instructor = new Instructor({
      name,
      email,
      title,
      about,
      field,
      password
    });

    await instructor.save();
    res.status(201).json({ message: 'Instructor created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Assign courses to instructor
router.post('/:id/courses', auth, async (req, res) => {
  try {
    const { courseIds } = req.body;

    const instructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { courses: { $each: courseIds } } },
      { new: true }
    ).populate('courses', 'name code');

    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    res.json(instructor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update instructor (excluding courses)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, title, about, field, password } = req.body;

    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    instructor.name = name;
    instructor.title = title;
    instructor.about = about;
    instructor.field = field;

    if (password) {
      instructor.password = password; // Will trigger pre-save hashing
    }

    await instructor.save(); // ✅ only use save to trigger password hashing

    const populatedInstructor = await Instructor.findById(req.params.id)
      .select('-password')
      .populate('courses', 'name code');

    res.json(populatedInstructor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Delete instructor
router.delete('/:id', auth, async (req, res) => {
  try {
    await Instructor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Instructor deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.post('/batch', async (req, res) => {
  try {
    const instructors = await Instructor.find({
      _id: { $in: req.body.ids }
    }).select('name title image about email');

    res.json(instructors);
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get('/:id/courses', auth, async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).populate('courses');

    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    res.json(instructor.courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/profile', async (req, res) => {
  try {
    const instructorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }

    const instructor = await Instructor.findById(instructorId).select('-password');
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    const courses = await Course.find({ instructor: instructorId }).select('title description');

    res.json({
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      title: instructor.title,
      about: instructor.about,
      field: instructor.field,
      courses,
      availability: instructor.availability || [],
      defaultSlots: instructor.defaultSlots || [],
      examDuration: instructor.examDuration || '60 minutes'
    });
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    res.status(500).json({ error: 'Server error while fetching instructor profile' });
  }
});

// Get instructor availability
router.get('/:id/availability', async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).select('availability defaultSlots examDuration');
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    // Return both availability days and default time slots
    res.json({
      availability: instructor.availability || [],
      defaultSlots: instructor.defaultSlots || [],
      examDuration: instructor.examDuration || '60 minutes'
    });
  } catch (error) {
    console.error('Error fetching instructor availability:', error);
    res.status(500).json({ error: 'Server error while fetching instructor availability' });
  }
});

// Update instructor availability
router.put('/:id/availability', async (req, res) => {
  try {
    const { availability, defaultSlots, examDuration } = req.body;

    // Validate availability data
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: 'Invalid availability data' });
    }

    if (!defaultSlots || !Array.isArray(defaultSlots)) {
      return res.status(400).json({ message: 'Invalid default slots data' });
    }

    if (!examDuration || typeof examDuration !== 'string') {
      return res.status(400).json({ message: 'Invalid exam duration data' });
    }

    // Validate days
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = availability.filter(day => !validDays.includes(day));
    if (invalidDays.length > 0) {
      return res.status(400).json({ message: `Invalid days: ${invalidDays.join(', ')}` });
    }

    // Validate time slots format (HH:MM AM/PM)
    const timeSlotRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    const invalidSlots = defaultSlots.filter(slot => !timeSlotRegex.test(slot));
    if (invalidSlots.length > 0) {
      return res.status(400).json({ message: `Invalid time slots: ${invalidSlots.join(', ')}` });
    }

    const updatedInstructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      {
        availability: availability,
        defaultSlots: defaultSlots,
        examDuration: examDuration
      },
      { new: true }
    ).select('-password');

    if (!updatedInstructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      availability: updatedInstructor.availability,
      defaultSlots: updatedInstructor.defaultSlots,
      examDuration: updatedInstructor.examDuration
    });
  } catch (error) {
    console.error('Error updating instructor availability:', error);
    res.status(500).json({ error: 'Server error while updating instructor availability' });
  }
});

module.exports = router;