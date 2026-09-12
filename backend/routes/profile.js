const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { User, Profile } = require('../models/User');
const auth = require("../middleware/auth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const profileImagesDir = path.join(__dirname, '../uploads/profile_images');
const resumeDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

// Combined storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Route profile pictures to profile_images directory
    if (file.fieldname === 'profilePicture') {
      cb(null, profileImagesDir);
    } else if (file.fieldname === 'resume') {
      // Route resumes to main uploads directory
      cb(null, resumeDir);
    } else {
      cb(null, resumeDir); // Default fallback
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (file.fieldname === 'resume') {
      cb(null, 'resume-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    } else {
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
    }
  }
});

// Combined Multer instance for both file types
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'profilePicture') {
      // Profile picture validation
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile picture'));
      }
    } else if (file.fieldname === 'resume') {
      // Resume validation
      const allowedTypes = /pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed for resume'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

function isValidArrayOfObjects(arr) {
  if (!arr) return true; // Allow null/undefined arrays
  if (!Array.isArray(arr)) return false;
  return arr.every(item => typeof item === "object" && item !== null);
}
//  Submit Final Profile
router.post("/submit", auth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    // Helper to safely remove a file if it exists
    const safeUnlink = (filePath) => {
      try {
        if (!filePath) return;
        const absolutePath = path.join(__dirname, '..', filePath.startsWith('/') ? filePath.substring(1) : filePath);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (_) {
        // ignore file delete errors
      }
    };

    const {
      title,
      name,
      email,
      phone,
      dob,
      gender,
      address,
      city,
      state,
      country,
      experience,
      zip,
      linkedin,
      objective,
      jobType,
      workMode,
      expectedSalary,
      noticePeriod,
      companies,
      education,
      skills,
      languages,
      certifications,
    } = req.body;

    // Removal flags from client (could be 'true' string from FormData)
    const profilePictureRemoved = req.body.profilePictureRemoved === 'true' || req.body.profilePictureRemoved === true;
    const resumeRemoved = req.body.resumeRemoved === 'true' || req.body.resumeRemoved === true;

    // Read existing final profile first so we can clean up files if necessary
    const existingFinal = await Profile.findOne({ userId: req.user.id, isDraft: false });

    // Handle uploaded files and/or removals
    let avatarUrl = req.body.avatarUrl;
    let resumeUrl = req.body.resumeUrl;
    
    if (req.files && req.files.profilePicture) {
      avatarUrl = `/uploads/profile_images/${req.files.profilePicture[0].filename}`;
    } else if (profilePictureRemoved) {
      // Clear avatarUrl and delete old file if we had one
      if (existingFinal?.avatarUrl) safeUnlink(existingFinal.avatarUrl);
      avatarUrl = "";
    }
    
    if (req.files && req.files.resume) {
      resumeUrl = `/uploads/${req.files.resume[0].filename}`;
    } else if (resumeRemoved) {
      // Clear resumeUrl and delete old file if we had one
      if (existingFinal?.resumeUrl) safeUnlink(existingFinal.resumeUrl);
      resumeUrl = "";
    }

    // Debug log for companies
    console.log('companies:', companies, typeof companies);
    // Parse arrays if they are sent as JSON strings (from multipart/form-data)
    let parsedCompanies = companies;
    let parsedEducation = education;
    let parsedSkills = skills;
    let parsedLanguages = languages;
    let parsedCertifications = certifications;
    try {
      if (typeof companies === 'string') parsedCompanies = JSON.parse(companies);
    } catch (e) { parsedCompanies = []; }
    try {
      if (typeof education === 'string') parsedEducation = JSON.parse(education);
    } catch (e) { parsedEducation = []; }
    try {
      if (typeof skills === 'string') parsedSkills = JSON.parse(skills);
    } catch (e) { parsedSkills = []; }
    try {
      if (typeof languages === 'string') parsedLanguages = JSON.parse(languages);
    } catch (e) { parsedLanguages = []; }
    try {
      if (typeof certifications === 'string') parsedCertifications = JSON.parse(certifications);
    } catch (e) { parsedCertifications = []; }

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (!isValidArrayOfObjects(parsedCompanies)) {
      return res.status(400).json({ error: "Invalid company format" });
    }
    if (!isValidArrayOfObjects(parsedEducation)) {
      return res.status(400).json({ error: "Invalid education format" });
    }

    const profileData = {
      userId: req.user.id,
      title,
      name,
      email,
      phone,
      dob,
      experience,
      gender,
      address,
      city,
      state,
      country,
      zip,
      linkedin,
      objective,
      jobType,
      workMode,
      expectedSalary,
      noticePeriod,
      companies: parsedCompanies || [],
      education: parsedEducation || [],
      skills: parsedSkills || [],
      languages: parsedLanguages || [],
      certifications: parsedCertifications || [],
      avatarUrl,
      resumeUrl,
      isDraft: false,
    };

    // Delete old final profile
    await Profile.deleteMany({ userId: req.user.id, isDraft: false });

    // Save final profile
    const profile = new Profile(profileData);
    await profile.save();

    const user = await User.findById(req.user.id);
    if (user) {
      if (phone) user.mobile = phone;
      await user.save();
    }
    // ⏬ Save/update draft version too
    await Profile.findOneAndUpdate(
      { userId: req.user.id, isDraft: true },
      { ...profileData, isDraft: true },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Profile submitted successfully", profile });
  } catch (err) {
    console.error("Submit profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



// ✅ Save Draft
router.post("/save-draft", auth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    // Helper to safely remove a file if it exists
    const safeUnlink = (filePath) => {
      try {
        if (!filePath) return;
        const absolutePath = path.join(__dirname, '..', filePath.startsWith('/') ? filePath.substring(1) : filePath);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      } catch (_) {
        // ignore file delete errors
      }
    };

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      title,
      name,
      email,
      phone,
      dob,
      gender,
      address,
      city,
      state,
      country,
      experience,
      zip,
      linkedin,
      objective,
      jobType,
      workMode,
      expectedSalary,
      noticePeriod,
      companies,
      education,
      skills,
      languages,
      certifications,
    } = req.body;

    // Removal flags from client
    const profilePictureRemoved = req.body.profilePictureRemoved === 'true' || req.body.profilePictureRemoved === true;
    const resumeRemoved = req.body.resumeRemoved === 'true' || req.body.resumeRemoved === true;

    // Read existing draft to be able to delete files if needed
    const existingDraft = await Profile.findOne({ userId: req.user.id, isDraft: true });

    // Allow overriding from uploaded files below
    let avatarUrl = req.body.avatarUrl;
    let resumeUrl = req.body.resumeUrl;

    // Handle uploaded files
    if (req.files && req.files.profilePicture) {
      avatarUrl = `/uploads/profile_images/${req.files.profilePicture[0].filename}`;
    } else if (profilePictureRemoved) {
      if (existingDraft?.avatarUrl) safeUnlink(existingDraft.avatarUrl);
      avatarUrl = "";
    }
    
    if (req.files && req.files.resume) {
      resumeUrl = `/uploads/${req.files.resume[0].filename}`;
    } else if (resumeRemoved) {
      if (existingDraft?.resumeUrl) safeUnlink(existingDraft.resumeUrl);
      resumeUrl = "";
    }

    // Parse arrays if sent as JSON strings (from multipart/form-data)
    let parsedCompanies = companies;
    let parsedEducation = education;
    let parsedSkills = skills;
    let parsedLanguages = languages;
    let parsedCertifications = certifications;
    try {
      if (typeof companies === 'string') parsedCompanies = JSON.parse(companies);
    } catch (e) { parsedCompanies = []; }
    try {
      if (typeof education === 'string') parsedEducation = JSON.parse(education);
    } catch (e) { parsedEducation = []; }
    try {
      if (typeof skills === 'string') parsedSkills = JSON.parse(skills);
    } catch (e) { parsedSkills = []; }
    try {
      if (typeof languages === 'string') parsedLanguages = JSON.parse(languages);
    } catch (e) { parsedLanguages = []; }
    try {
      if (typeof certifications === 'string') parsedCertifications = JSON.parse(certifications);
    } catch (e) { parsedCertifications = []; }

    // Validate arrays
    if (!isValidArrayOfObjects(parsedCompanies)) {
      return res.status(400).json({ error: "Invalid company format" });
    }
    if (!isValidArrayOfObjects(parsedEducation)) {
      return res.status(400).json({ error: "Invalid education format" });
    }

    if (phone && phone !== user.mobile) user.mobile = phone;
    await user.save();


    const draftData = {
      userId: user._id,
      title: title || "",
      name: name || "",
      email: email || "",
      phone: phone || "",
      dob: dob || "",
      gender: gender || "",
      experience: experience || 0,
      address: address || "",
      city: city || "",
      state: state || "",
      country: country || "",
      zip: zip || "",
      linkedin: linkedin || "",
      objective: objective || "",
      jobType: jobType || "",
      workMode: workMode || "",
      expectedSalary: expectedSalary || "",
      noticePeriod: noticePeriod || "",
      companies: parsedCompanies || [],
      education: parsedEducation || [],
      skills: parsedSkills || [],
      languages: parsedLanguages || [],
      certifications: parsedCertifications || [],
      avatarUrl: avatarUrl || "",
      resumeUrl: resumeUrl || "",
      isDraft: true,
    };

    let profile = await Profile.findOne({ userId: user._id, isDraft: true });

    if (profile) {
      profile.set(draftData);
      await profile.save();
    } else {
      profile = new Profile(draftData);
      await profile.save();
    }

    res.status(200).json({ message: "Draft saved successfully!", profile });

  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({ error: "Failed to save draft.", details: error.message });
  }
});



// ✅ Get Draft Profile
router.get("/draft", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id, isDraft: true });
    if (!profile) {
      return res.status(404).json({ message: "Draft profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching draft profile:", error);
    res.status(500).json({ error: "Failed to fetch draft profile." });
  }
});

// ✅ Get Final Profile
router.get("/final", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id, isDraft: false });
    if (!profile) {
      return res.status(404).json({ message: "Final profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching final profile:", error);
    res.status(500).json({ error: "Failed to fetch final profile." });
  }
});

// ✅ Get Profile Completion Progress
router.get("/progress", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id, isDraft: false });
    if (!profile) return res.json({ progress: 0 });

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
    res.json({ progress });
  } catch (err) {
    console.error("Error in progress route:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


router.get('/by-user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching profile for user ID:', userId);

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid user ID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Convert to ObjectId safely
    const objectId = new mongoose.Types.ObjectId(userId);
    console.log('Converted to ObjectId:', objectId);

    // Fetch the profile linked to this userId
    const profile = await Profile.findOne({ userId: objectId });
    console.log('Profile found:', profile ? 'Yes' : 'No');

    if (!profile) {
      console.log('Profile not found for user ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        attemptedId: userId
      });
    }

    console.log('Sending profile data successfully');
    // ✅ Send full profile data
    res.json({
      success: true,
      profile
    });

  } catch (err) {
    console.error('Error fetching profile by user ID:', err);
    console.error('Error stack:', err.stack);
    
    // Provide more specific error messages
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});




module.exports = router;