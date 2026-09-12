const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Instructor = require('../models/Instructor');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Ensure upload folders exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDir('uploads/images');
ensureDir('uploads/videos');

// Set up Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isVideo = file.mimetype.startsWith('video/');
    cb(null, isVideo ? 'uploads/videos' : 'uploads/images');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Unique filename
  }
});

const upload = multer({ storage });

// 📌 CREATE a new course with image and lessons (optional videos)
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'videos' }
]), async (req, res) => {
  try {
    const {
      title, description, duration, students, rating,
      category, popular, field, isPaused, price,
      lessons, // JSON stringified array
      instructorId // Added: Instructor ID reference
    } = req.body;

    // 1. Validate required fields
    if (!title || !description || !duration || !category || !field || !instructorId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
     
    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    // 2. Find or create instructor
    let instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    // 3. Handle file uploads
    const imagePath = req.files?.image?.[0]
      ? `/uploads/images/${req.files.image[0].filename}`
      : null;

    // 4. Process lessons with videos
    let parsedLessons = [];
    if (lessons) {
      try {
        const videoFiles = req.files?.videos || [];
        const lessonList = JSON.parse(lessons);

        parsedLessons = lessonList.map((lesson, index) => {
          const videoPath = videoFiles[index]
            ? `/uploads/videos/${videoFiles[index].filename}`
            : '';
          return {
            title: lesson.title,
            duration: lesson.duration,
            videoUrl: videoPath,
            watched: false
          };
        });
      } catch (e) {
        console.error('Error parsing lessons:', e);
        return res.status(400).json({ error: 'Invalid lessons format' });
      }
    }

    // 5. Create new course with instructor reference
    const newCourse = new Course({
      title,
      description,
      duration,
      students: students || 0,
      rating: rating || 0,
      category,
      popular: popular === 'true',
      field,
      price,
      isPaused: isPaused === 'true',
      image: imagePath,
      instructor: instructor._id, // Reference to instructor
      instructorDetails: { // Denormalized data for quick access
        name: instructor.name,
        email: instructor.email,
        title: instructor.title,
        about: instructor.about
      },
      lessons: parsedLessons
    });

    // 6. Save course and update instructor
    const savedCourse = await newCourse.save();

    // Update instructor's courses array
    await Instructor.findByIdAndUpdate(
      instructor._id,
      { $addToSet: { courses: savedCourse._id } },
      { new: true }
    );

    // 7. Return response with populated instructor data
    const responseCourse = await Course.findById(savedCourse._id)
      .populate('instructor', 'name email title about');

    res.status(201).json(responseCourse);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({
      error: 'Error creating course',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 📌 GET all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate({
      path: 'instructor',
      select: 'name title image about email' 
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Updated GET /:id route
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'instructor',
        model: 'Instructor', // Explicitly declare the model
        select: 'name title image about email'
      })
      .exec(); // Important: always use exec() with populate

    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('Population error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 GET per-course availability/settings
router.get('/:id/availability', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select('availability defaultSlots examDuration instructor');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({
      availability: course.availability || [],
      defaultSlots: course.defaultSlots || [],
      examDuration: course.examDuration || '60 minutes',
      instructor: course.instructor
    });
  } catch (err) {
    console.error('Error getting course availability:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 UPDATE per-course availability/settings
router.put('/:id/availability', async (req, res) => {
  try {
    const { availability, defaultSlots, examDuration } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: 'Invalid availability data' });
    }
    if (!Array.isArray(defaultSlots)) {
      return res.status(400).json({ message: 'Invalid default slots data' });
    }
    if (examDuration && typeof examDuration !== 'string') {
      return res.status(400).json({ message: 'Invalid exam duration' });
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const invalidDays = availability.filter(day => !validDays.includes(day));
    if (invalidDays.length) {
      return res.status(400).json({ message: `Invalid days: ${invalidDays.join(', ')}` });
    }

    const timeSlotRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    const invalidSlots = defaultSlots.filter(slot => !timeSlotRegex.test(slot));
    if (invalidSlots.length) {
      return res.status(400).json({ message: `Invalid time slots: ${invalidSlots.join(', ')}` });
    }

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          availability,
          defaultSlots,
          examDuration: examDuration || '60 minutes'
        }
      },
      { new: true }
    ).select('availability defaultSlots examDuration');

    if (!updated) return res.status(404).json({ message: 'Course not found' });

    res.json({
      message: 'Course availability updated successfully',
      availability: updated.availability,
      defaultSlots: updated.defaultSlots,
      examDuration: updated.examDuration
    });
  } catch (err) {
    console.error('Error updating course availability:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 UPDATE course (with optional new image/lessons)
router.put('/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'videos' }
]), async (req, res) => {
  try {
    const {
      title, description, duration, students, rating,
      category, popular, field, isPaused, imagePath, lessons, price
    } = req.body;

    const instructorDetails = {
      name: req.body['instructor_name'],
      email: req.body['instructor_email'],
      title: req.body['instructor_title'],
      about: req.body['instructor_about']
    };

    // If you're using a real instructor reference, parse ObjectId:
    const instructorId = req.body['instructor_id']; // Assume you send this from the frontend
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }
    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    // Handle videos
    const videoFiles = req.files?.videos || [];
    let videoIndex = 0;

    const updatedLessons = lessons ? JSON.parse(lessons).map(lesson => {
      const hasNewVideo = lesson.videoUrl === '' || !lesson.videoUrl;
      const videoUrl = hasNewVideo && videoFiles[videoIndex]
        ? `/uploads/videos/${videoFiles[videoIndex++].filename}`
        : lesson.videoUrl;

      return {
        title: lesson.title,
        duration: lesson.duration,
        videoUrl,
        watched: lesson.watched || false
      };
    }) : undefined;

    // Prepare updates
    const updates = {
      title,
      description,
      duration,
      students,
      rating,
      price,
      category,
      popular,
      field,
      isPaused,
      instructor: instructorId, // must be a valid ObjectId
      instructorDetails, // embedded object
      image: req.files?.image?.[0] ? `/uploads/images/${req.files.image[0].filename}` : imagePath
    };

    if (updatedLessons) updates.lessons = updatedLessons;

    const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating course', details: err.message });
  }
});


// 📌 PAUSE a course
router.put('/:id/pause', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { isPaused: true }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course paused', course });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
});

// 📌 DELETE course
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
});

// 📌 GET courses by field (IT or Non-IT)
router.get('/field/:field', async (req, res) => {
  try {
    const field = req.params.field;
    const courses = await Course.find({ field });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
});

module.exports = router;