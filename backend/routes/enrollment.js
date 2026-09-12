const express = require('express');
const mongoose = require('mongoose'); // ✅ required for ObjectId checks
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');


// ✅ Enroll a student in a course (one-time only)

router.post('/', async (req, res) => {
    const { studentId, courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID format' });
    }

    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const existing = await Enrollment.findOne({ studentId, courseId });
        if (existing) return res.status(400).json({ message: 'Already enrolled in this course' });

        const enrollment = new Enrollment({ studentId, courseId });
        await enrollment.save();

        // Update course student count
        course.students += 1;
        await course.save();

        res.status(201).json({ message: 'Enrollment successful', enrollment });
    } catch (err) {
        res.status(500).json({ message: 'Server error', err });
    }
});

// ✅ Get all enrollments (admin purpose)
router.get('/', async (req, res) => {
    try {
        const enrollments = await Enrollment.find().populate('studentId courseId');
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ message: 'Server error', err });
    }
});

// Example in Express.js
router.get('/check/:studentId/:courseId', async (req, res) => {
    const { studentId, courseId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    try {
        const enrollment = await Enrollment.findOne({ studentId, courseId });
        res.json({ enrolled: !!enrollment });
    } catch (err) {
        console.error('Error checking enrollment:', err);
        res.status(500).json({ message: 'Server error', err });
    }
});

// Update progress for a specific lesson
router.post('/:id/progress', async (req, res) => {
    const { id: enrollmentId } = req.params;
    const { lessonId, progress } = req.body;

    try {
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        let progressValue = typeof progress === 'number' ? Math.max(0, Math.min(1, progress)) : 1;
        const progressItem = enrollment.progress.find(p => p.lessonId === lessonId);
        if (progressItem) {
            progressItem.progress = progressValue;
        } else {
            enrollment.progress.push({ lessonId, progress: progressValue });
        }

        await enrollment.save();
        res.json({ message: 'Progress updated successfully' });
    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get specific enrollment by studentId and courseId
router.get('/student/:studentId/course/:courseId', async (req, res) => {
    const { studentId, courseId } = req.params;

    try {
        const enrollment = await Enrollment.findOne({ studentId, courseId });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        res.json(enrollment);
    } catch (err) {
        console.error('Error fetching enrollment:', err);
        res.status(500).json({ message: 'Server error', err });
    }
});



// ✅ Get all courses a student is enrolled in
router.get('/student/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId }).populate('courseId');

        const data = enrollments
    .filter(e => e.courseId) // ✅ Only process if courseId is populated
    .map(e => ({
        _id: e.courseId._id,
        title: e.courseId.title,
        description: e.courseId.description,
        image: e.courseId.image,
        duration: e.courseId.duration,
        rating: e.courseId.rating,
        category: e.courseId.category,
        popular: e.courseId.popular,
        field: e.courseId.field,
        isPaused: e.courseId.isPaused,
        instructor: e.courseId.instructor,
        lessons: e.courseId.lessons,
        enrollmentId: e._id
    }));


        res.json(data);
    } catch (err) {
        console.error('🔥 Server error:', err); // Log full error to console for debugging
        res.status(500).json({
            message: 'Server error',
            error: err.message || 'Unknown error'
        });
    }
});


// ✅ Check if a student is enrolled in a course (for frontend checks)
router.get('/check/:studentId/:courseId', async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const exists = await Enrollment.findOne({ studentId, courseId });
        res.json({ enrolled: !!exists });
    } catch (err) {
        res.status(500).json({ message: 'Server error', err });
    }
});

// DELETE /api/enrollments/:id
router.delete('/:id', async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

        const course = await Course.findById(enrollment.courseId);

        // Delete enrollment first
        await Enrollment.findByIdAndDelete(req.params.id);

        if (course && course.students > 0) {
            course.students -= 1;
            await course.save();
        }

        res.json({ message: 'Unrolled successfully' });
    } catch (err) {
        console.error('Error deleting enrollment:', err.message);
        res.status(500).json({ error: 'Failed to unroll student' });
    }
});





// GET /api/enrollments/course/:courseId
router.get('/course/:courseId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ courseId: req.params.courseId })
            .populate('studentId', 'username email')  // Populate the studentId field with only username & email
            .exec();

        res.json(enrollments);
    } catch (err) {
        console.error('Error fetching enrollments by course:', err);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
});


module.exports = router;