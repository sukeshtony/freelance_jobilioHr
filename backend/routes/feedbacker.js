const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const Feedbacker = require('../models/Feedbacker');
const { check, validationResult } = require('express-validator');
const { User } = require('../models/User');
const ExamBooking = require('../models/ExamBooking');
const Interview = require('../models/Interview');

// @route   GET /api/feedbackers
router.get('/', async (req, res) => {
    try {
        const feedbackers = await Feedbacker.find().populate('assignedCount').lean();

        res.json({
            success: true,
            data: feedbackers
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});


// @route   POST /api/feedbackers
router.post(
    '/',
    [
        [
            check('name', 'Name is required').not().isEmpty(),
            check('email', 'Please include a valid email').isEmail(),
            check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let feedbacker = await Feedbacker.findOne({ email });

            if (feedbacker) {
                return res.status(400).json({ errors: [{ msg: 'Feedbacker already exists' }] });
            }

            feedbacker = new Feedbacker({
                name,
                email,
                password
            });

            await feedbacker.save();

            const feedbackerObj = feedbacker.toObject();
            delete feedbackerObj.password;

            res.json(feedbackerObj);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   PUT /api/feedbackers/:id
router.put(
    '/:id',
    [
        [
            check('name', 'Name is required').not().isEmpty(),
            check('email', 'Please include a valid email').isEmail()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        const updateFields = { name, email };

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        }

        try {
            let feedbacker = await Feedbacker.findById(req.params.id);

            if (!feedbacker) {
                return res.status(404).json({ msg: 'Feedbacker not found' });
            }

            feedbacker = await Feedbacker.findByIdAndUpdate(
                req.params.id,
                { $set: updateFields },
                { new: true }
            ).select('-password');

            res.json(feedbacker);
        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Feedbacker not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);


// @route   DELETE /api/feedbackers/:id
router.delete('/:id', async (req, res) => {
    try {
        const feedbacker = await Feedbacker.findById(req.params.id);

        if (!feedbacker) {
            return res.status(404).json({ msg: 'Feedbacker not found' });
        }

        await Feedbacker.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Feedbacker removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Feedbacker not found' });
        }
        res.status(500).send('Server Error');
    }
});

// GET /api/feedbackers/:id/with-users-results
router.get('/:id/with-users-results', async (req, res) => {
    try {
        const fb = await Feedbacker.findById(req.params.id).lean();
        if (!fb) return res.status(404).json({ success: false, message: 'Feedbacker not found' });

        const users = await User.find({ assignedFeedbacker: fb._id }).lean();

        const usersWithResults = await Promise.all(
            (users || []).map(async (user) => {
                const exams = await ExamBooking.find({ userId: user._id }).lean() || [];
                const interviews = await Interview.find({ candidate: user._id }).lean() || [];

                return {
                    _id: user._id || null,
                    username: user.username || "N/A",
                    email: user.email || "N/A",
                    mobile: user.mobile || "N/A",
                    exams,
                    interviews
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                feedbacker: {
                    _id: fb._id,
                    name: fb.name || "N/A",
                    email: fb.email || "N/A"
                },
                assignedUsers: usersWithResults
            }
        });
    } catch (err) {
        console.error('Error fetching feedbacker with results:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// routes/feedbackerRoutes.js
router.get('/:id/profile', async (req, res) => {
    try {
        const feedbacker = await Feedbacker.findById(req.params.id)
            .select('-password -__v')
            .populate('assignedCount') // populate the virtual
            .lean();

        if (!feedbacker) {
            return res.status(404).json({ error: 'Feedbacker not found' });
        }

        res.json({
            _id: feedbacker._id,
            name: feedbacker.name,
            email: feedbacker.email,
            completedFeedbacks: feedbacker.completedFeedbacks || 0,
            assignedCount: feedbacker.assignedCount || 0, // use populated virtual
            createdAt: feedbacker.createdAt,
            updatedAt: feedbacker.updatedAt
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});



module.exports = router;