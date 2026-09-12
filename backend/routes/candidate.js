const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const { Profile, User } = require('../models/User');
const auth = require('../middleware/auth');

// GET all candidates (non-applied only)
router.get('/', auth, async (req, res) => {
  try {
    // Get the current client's ID from the authenticated request
    const clientId = req.user.id;
    
    // Get all job requirements for this client
    const Requirements = require('../models/Requirements');
    const clientRequirements = await Requirements.find({ 
      clientId: clientId,
      status: { $ne: 'deleted' } // Exclude deleted requirements
    });
    
    // Get all candidates that have been sent by admin for this client's requirements
    const SentCandidates = require('../models/SentCandidates');
    const sentCandidatesRecords = await SentCandidates.find({
      requirementId: { $in: clientRequirements.map(req => req._id) }
    }).populate('candidates.candidateId');
    
    // Get IDs of candidates who have been sent by admin for this client's requirements
    const sentCandidateIds = new Set();
    sentCandidatesRecords.forEach(record => {
      record.candidates.forEach(candidate => {
        sentCandidateIds.add(candidate.candidateId._id.toString());
      });
    });
    
    console.log(`Client ${clientId} has ${clientRequirements.length} requirements`);
    console.log(`Found ${sentCandidatesRecords.length} sent candidates records`);
    console.log(`Total candidates sent by admin: ${sentCandidateIds.size}`);

    // Get all admin-approved candidates (users with role "Candidate")
    const adminCandidates = await User.find({ role: 'Candidate' }).select('_id email username mobile');
    const adminCandidateIds = adminCandidates.map(c => c._id.toString());
    const adminCandidateEmails = adminCandidates.map(c => c.email);

    console.log('Admin candidates found:', adminCandidates.length);

    // Get all submitted profiles (non-draft) from Profile collection
    const allProfiles = await Profile.find({ isDraft: false }).populate({
      path: 'userId',
      select: 'username email mobile role'
    });

    console.log('Total profiles found:', allProfiles.length);
    
    // Filter profiles to include only candidates who have completed their profiles
    const validProfiles = allProfiles.filter(profile => {
      const profileUserId = profile.userId?._id?.toString();
      const userRole = profile.userId?.role;
      
      // Include profiles that have:
      // 1. A valid userId reference (not null/undefined)
      // 2. The user has the correct role (Candidate)
      // 3. Profile is not a draft
      const hasValidUserId = profileUserId && profile.userId;
      const hasCorrectRole = userRole === 'Candidate';
      const isNotDraft = !profile.isDraft;
      
      return hasValidUserId && hasCorrectRole && isNotDraft;
    });

    console.log('Valid profiles (completed profiles with valid user references):', validProfiles.length);
    
    // Separate sent and non-sent profiles
    const sentProfiles = validProfiles.filter(profile => {
      const profileUserId = profile.userId?._id?.toString();
      // Show as sent if admin has already sent this candidate for this client's requirements
      return sentCandidateIds.has(profileUserId);
    });

    const nonSentProfiles = validProfiles.filter(profile => {
      const profileUserId = profile.userId?._id?.toString();
      // Show as non-sent if admin hasn't sent this candidate for this client's requirements
      return !sentCandidateIds.has(profileUserId);
    });

    console.log('Sent profiles (by admin for this client\'s requirements):', sentProfiles.length);
    console.log('Non-sent profiles (available for admin to send):', nonSentProfiles.length);

    // Only return non-sent candidates for the client portal
    const transformedCandidates = nonSentProfiles.map(profile => ({
      id: profile._id,
      userId: profile.userId?._id?.toString(),
      name: profile.name || profile.userId?.username || 'Candidate',
      email: profile.email || profile.userId?.email,
      title: profile.title || 'Professional',
      skills: profile.skills || [],
      experience: profile.experience || 0,
      location: profile.city || profile.address || 'Not specified',
      phone: profile.phone || profile.userId?.mobile,
      objective: profile.objective,
      jobType: profile.jobType,
      workMode: profile.workMode,
      expectedSalary: profile.expectedSalary,
      noticePeriod: profile.noticePeriod,
      type: 'nonSent',
      status: 'available',
      resumeUrl: null, // No resume for non-sent candidates
      companies: profile.companies || [],
      education: profile.education || [],
      certifications: profile.certifications || [],
      // Additional profile fields
      dob: profile.dob,
      gender: profile.gender,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      zip: profile.zip,
      linkedin: profile.linkedin
    }));

    console.log(`Returning ${transformedCandidates.length} non-sent candidates for client ${clientId}`);
    
    res.json(transformedCandidates);
  } catch (err) {
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update candidate status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Find the profile to get the email
    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Find and update the job application status
    const JobApplication = require('../models/JobApplication');
    const profileEmail = profile.userId?.email || profile.email;
    const jobApplication = await JobApplication.findOneAndUpdate(
      { email: profileEmail },
      { status },
      { new: true }
    );
    
    if (!jobApplication) {
      return res.status(404).json({ message: 'Job application not found for this candidate' });
    }
    
    res.json({ success: true, jobApplication });
  } catch (err) {
    console.error('Error updating candidate status:', err);
    res.status(500).json({ message: 'Server error while updating candidate status' });
  }
});

// GET generate resume for candidate
router.get('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the profile
    const profile = await Profile.findById(id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Get job applications to check if this candidate has applied
    const JobApplication = require('../models/JobApplication');
    const profileEmail = profile.userId?.email || profile.email;
    const jobApplication = await JobApplication.findOne({ 
      email: profileEmail 
    }).populate('jobId');
    
    // If candidate has applied and has a resume
    if (jobApplication && jobApplication.resume) {
      // Return the actual uploaded resume file
      return res.json({ 
        success: true, 
        resumeUrl: `/uploads/resume/${jobApplication.resume.filename}`,
        resumeData: {
          name: jobApplication.userName,
          email: jobApplication.email,
          appliedJob: jobApplication.jobId?.title || 'Unknown Job',
          appliedAt: jobApplication.appliedAt,
          status: jobApplication.status,
          resumeFile: jobApplication.resume
        }
      });
    }
    
    // Fallback: Generate resume data from profile
    const resumeData = {
      name: profile.name || profile.userId?.username || 'Candidate',
      email: profileEmail,
      phone: profile.phone || profile.userId?.mobile,
      title: profile.title || 'Professional',
      objective: profile.objective,
      skills: profile.skills || [],
      experience: profile.experience,
      location: profile.city || profile.address || 'Not specified',
      jobType: profile.jobType,
      workMode: profile.workMode,
      expectedSalary: profile.expectedSalary,
      noticePeriod: profile.noticePeriod,
      companies: profile.companies || [],
      education: profile.education || [],
      certifications: profile.certifications || []
    };
    
    res.json({ success: true, resumeData });
  } catch (err) {
    console.error('Error generating resume:', err);
    res.status(500).json({ message: 'Server error while generating resume' });
  }
});

// Temporary debug endpoint to check job applications
router.get('/debug/applications', async (req, res) => {
  try {
    const JobApplication = require('../models/JobApplication');
    const applications = await JobApplication.find().populate('jobId');
    res.json({ 
      count: applications.length, 
      applications: applications.map(app => ({
        id: app._id,
        email: app.email,
        userName: app.userName,
        jobTitle: app.jobId?.jobTitle || 'Unknown',
        status: app.status,
        appliedAt: app.appliedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to check profile filtering
router.get('/debug/profiles', async (req, res) => {
  try {
    // Get all admin-approved candidates
    const adminCandidates = await User.find({ role: 'Candidate' }).select('_id email username mobile');
    const adminCandidateIds = adminCandidates.map(c => c._id.toString());
    
    // Get all profiles without population first
    const allProfilesRaw = await Profile.find({ isDraft: false });
    
    // Get all profiles with population
    const allProfiles = await Profile.find({ isDraft: false }).populate({
      path: 'userId',
      select: 'username email mobile role'
    });
    
    // Check which profiles are being filtered out
    const validProfiles = allProfiles.filter(profile => {
      const profileUserId = profile.userId?._id?.toString();
      const userRole = profile.userId?.role;
      return profileUserId && userRole === 'Candidate' && !profile.isDraft;
    });
    
    const invalidProfiles = allProfiles.filter(profile => {
      const profileUserId = profile.userId?._id?.toString();
      const userRole = profile.userId?.role;
      return !profileUserId || userRole !== 'Candidate' || profile.isDraft;
    });
    
    // Check profiles with userId but no populated user (orphaned profiles)
    const orphanedProfiles = allProfilesRaw.filter(profile => {
      return profile.userId && !allProfiles.find(p => p._id.toString() === profile._id.toString() && p.userId);
    });
    
    // Check profiles without userId
    const profilesWithoutUserId = allProfilesRaw.filter(profile => !profile.userId);
    
    // Check if there are any users that should have profiles but don't
    const usersWithoutProfiles = adminCandidates.filter(user => {
      return !allProfilesRaw.find(profile => profile.userId && profile.userId.toString() === user._id.toString());
    });
    
    res.json({
      adminCandidates: {
        count: adminCandidates.length,
        ids: adminCandidateIds,
        sample: adminCandidates.slice(0, 3)
      },
      allProfilesRaw: {
        count: allProfilesRaw.length,
        sample: allProfilesRaw.slice(0, 3).map(p => ({
          id: p._id,
          userId: p.userId,
          name: p.name,
          email: p.email,
          isDraft: p.isDraft
        }))
      },
      allProfiles: {
        count: allProfiles.length,
        sample: allProfiles.slice(0, 3).map(p => ({
          id: p._id,
          userId: p.userId?._id,
          name: p.name,
          email: p.email,
          isDraft: p.isDraft
        }))
      },
      validProfiles: {
        count: validProfiles.length,
        sample: validProfiles.slice(0, 3).map(p => ({
          id: p._id,
          userId: p.userId?._id,
          name: p.name,
          email: p.email
        }))
      },
      invalidProfiles: {
        count: invalidProfiles.length,
        sample: invalidProfiles.slice(0, 3).map(p => ({
          id: p._id,
          userId: p.userId?._id,
          name: p.name,
          email: p.email,
          reason: !p.userId?._id ? 'No userId' : 
                  p.userId?.role !== 'Candidate' ? 'Wrong role' :
                  p.isDraft ? 'Is draft' : 'Unknown'
        }))
      },
      orphanedProfiles: {
        count: orphanedProfiles.length,
        sample: orphanedProfiles.slice(0, 3).map(p => ({
          id: p._id,
          userId: p.userId,
          name: p.name,
          email: p.email
        }))
      },
      profilesWithoutUserId: {
        count: profilesWithoutUserId.length,
        sample: profilesWithoutUserId.slice(0, 3).map(p => ({
          id: p._id,
          name: p.name,
          email: p.email
        }))
      },
      usersWithoutProfiles: {
        count: usersWithoutProfiles.length,
        sample: usersWithoutProfiles.slice(0, 3).map(u => ({
          id: u._id,
          username: u.username,
          email: u.email
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// DELETE orphan profiles whose userId doesn't exist
router.delete('/cleanup/orphan-profiles', async (req, res) => {
  try {
    // Step 1: Get all valid user IDs
    const validUserIds = await User.distinct('_id');

    // Step 2: Delete all profiles whose userId is NOT in validUserIds
    const result = await Profile.deleteMany({
      userId: { $nin: validUserIds }
    });

    res.json({
      message: `✅ Deleted ${result.deletedCount} orphan profile(s).`,
    });
  } catch (error) {
    console.error('Error deleting orphan profiles:', error);
    res.status(500).json({
      error: '❌ Server error while deleting orphan profiles.',
    });
  }
});

// POST endpoint to fix profiles without userId by matching email
router.post('/fix-profiles', async (req, res) => {
  try {
    // Get all profiles without userId
    const profilesWithoutUserId = await Profile.find({ 
      isDraft: false,
      userId: { $exists: false }
    });

    let fixedCount = 0;
    const errors = [];

    for (const profile of profilesWithoutUserId) {
      try {
        // Try to find a user with matching email
        const user = await User.findOne({ 
          email: profile.email,
          role: 'Candidate'
        });

        if (user) {
          // Update the profile with the correct userId
          await Profile.findByIdAndUpdate(profile._id, {
            userId: user._id
          });
          fixedCount++;
        } else {
          errors.push(`No user found for profile ${profile._id} with email ${profile.email}`);
        }
      } catch (err) {
        errors.push(`Error fixing profile ${profile._id}: ${err.message}`);
      }
    }

    res.json({
      message: `✅ Fixed ${fixedCount} profile(s) with valid userId references.`,
      fixedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error fixing profiles:', error);
    res.status(500).json({
      error: '❌ Server error while fixing profiles.',
    });
  }
});



// GET candidate resume with credit deduction
router.get('/:id/resume', auth, async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    // Check if user has enough credits
    const { UserCredit } = require('../models/Credit');
    const userCredits = await UserCredit.findOne({ userId: req.user.id });
    
    if (!userCredits || userCredits.credits < 1) {
      return res.status(402).json({ 
        error: 'Insufficient credits. Please request more credits from admin.' 
      });
    }

    // Get candidate profile
    const candidate = await User.findById(candidateId).populate('profile');
    if (!candidate || candidate.role !== 'Candidate') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!candidate.profile || !candidate.profile.resume) {
      return res.status(404).json({ error: 'Resume not found for this candidate' });
    }

    // Deduct 1 credit
    await UserCredit.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { credits: -1 } },
      { upsert: true }
    );

    // Return resume URL
    res.json({
      resumeUrl: candidate.profile.resume,
      message: '1 credit deducted for viewing resume'
    });
  } catch (err) {
    console.error('Error viewing candidate resume:', err);
    res.status(500).json({ error: 'Failed to view resume' });
  }
});

module.exports = router;
