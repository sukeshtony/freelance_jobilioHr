const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin')
const { User, Profile } = require('../models/User');
const Interview = require('../models/Interview');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 🔹 GET: All Users (Basic Info)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username email role mobile createdAt');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


const verifyAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// GET /admin/me → returns current admin profile
router.get('/me', verifyAdmin, async (req, res) => {
  try {
    // We already have req.admin from verifyAdmin
    res.json({
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      role: req.admin.role,
      createdAt: req.admin.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put("/update", verifyAdmin, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const updates = {};

    const admin = await Admin.findById(req.admin._id).select("+password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // If changing password, verify current password
    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) updates.username = name;
    if (email) updates.email = email;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Admin updated successfully", admin: updatedAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 GET /api/admin/candidates - All registered users with role "Candidate"
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await User.find({ role: 'Candidate' })
      .select('username email mobile isPremium createdAt profile')
      .populate({
        path: 'profile',
        select: 'title experience phone city isDraft resumeUrl avatarUrl'
      });

    res.json({ success: true, data: candidates });
  } catch (err) {
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});




// 🔹 GET: Specific User with Full Profile, Companies, Education
router.get('/users/:id', async (req, res) => {
  try {
    const user = await Profile.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'profile',
        populate: [
          { path: 'companies', model: 'Company' },
          { path: 'education', model: 'Education' }
        ]
      });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});


router.delete('/candidates/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete associated profile if exists
    if (user.profile) {
      await Profile.findByIdAndDelete(user.profile);
    }

    // Then delete user
    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User and profile deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete user and profile' });
  }
});


// PUT update candidate
router.put('/candidates/:id', async (req, res) => {
  const { username, email, mobile } = req.body;
  const updated = await User.findByIdAndUpdate(req.params.id, { username, email, mobile }, { new: true });
  res.json(updated);
});



// GET: /api/admin/interviews
router.get('/interviews', async (req, res) => {
  try {
    const interviews = await Interview.find({});
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});



module.exports = router;