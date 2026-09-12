const Course = require('../models/Course');

exports.createCourse = async (req, res) => {
  try {
    // req.body holds text fields; req.files holds uploaded files (multer .fields expected)
    const {
      title, description, duration, price, rating,
      category, field, popular, discountPrice, isPaused,
      instructorId,
      instructorName, instructorEmail, instructorTitle, instructorAbout,
      lessons: lessonsRaw
    } = req.body;

    // Basic required-field checks with clear messages
    const missing = [];
    if (!title) missing.push('title');
    if (!description) missing.push('description');
    if (!req.files || !req.files.image || req.files.image.length === 0) missing.push('image');
    if (!duration) missing.push('duration');
    if (price == null) missing.push('price');
    if (rating == null) missing.push('rating');
    if (!category) missing.push('category');
    if (!field) missing.push('field');
    if (!instructorId) missing.push('instructorId');
    if (!instructorName) missing.push('instructorName');
    if (!instructorEmail) missing.push('instructorEmail');
    if (!instructorTitle) missing.push('instructorTitle');
    if (!instructorAbout) missing.push('instructorAbout');

    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Image file path
    const imageFile = req.files.image[0];
    const imagePath = `/uploads/${imageFile.filename}`;

    // Parse lessons JSON if provided; fields within lessons are optional
    let lessonsInput = [];
    try {
      lessonsInput = lessonsRaw ? JSON.parse(lessonsRaw) : [];
      if (!Array.isArray(lessonsInput)) lessonsInput = [];
    } catch (e) {
      // invalid JSON -> ignore and continue with empty
      lessonsInput = [];
    }

    // Multer field name for lesson videos assumed 'lessonVideos' (array). Fall back if absent.
    const uploadedLessonVideos = Array.isArray(req.files.lessonVideos) ? req.files.lessonVideos : (req.files.lessonVideos ? [req.files.lessonVideos] : []);

    const lessonsToSave = lessonsInput.map((l = {}, idx) => ({
      title: (l.title || '').trim(),
      duration: (l.duration || '').trim(),
      videoUrl: uploadedLessonVideos[idx] ? `/uploads/${uploadedLessonVideos[idx].filename}` : (l.videoUrl || null)
    }));

    const course = new Course({
      title,
      description,
      image: imagePath,
      duration,
      students: 0,
      price: parseFloat(price) || 0,
      discountPrice: parseFloat(discountPrice) || 0,
      rating: parseFloat(rating) || 0,
      category,
      popular: popular === 'true' || popular === true,
      field,
      isPaused: isPaused === 'true' || isPaused === true,
      instructor: instructorId,
      instructorDetails: {
        name: instructorName,
        email: instructorEmail,
        title: instructorTitle,
        about: instructorAbout
      },
      lessons: lessonsToSave
    });

    await course.save();
    return res.status(201).json(course);
  } catch (err) {
    // Return mongoose validation messages if present
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('createCourse error:', err);
    return res.status(500).json({ error: 'Server error creating course' });
  }
};