const express = require('express');
const router = express.Router();
const Requirement = require('../models/Requirements');
const SentCandidates = require('../models/SentCandidates');
const auth = require('../middleware/auth');


// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Requirements API is working',
    timestamp: new Date().toISOString()
  });
});

// GET all requirements
router.get('/', async (req, res) => {
  try {
    const requirements = await Requirement.find({ status: 'active' })
      .populate('clientId', 'username email')
      .sort({ createdAt: -1 });

    res.json(requirements);
  } catch (err) {
    console.error('Error fetching requirements:', err);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// GET client's own requirements (excluding deleted ones)
router.get('/my', auth, async (req, res) => {
  try {
    const requirements = await Requirement.find({
      clientId: req.user.id,
      status: { $ne: 'deleted' } // Exclude deleted requirements
    }).sort({ updatedAt: -1, createdAt: -1 });

    res.json(requirements);
  } catch (err) {
    console.error('Error fetching client requirements:', err);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// GET candidates matching a requirement (for clients)
router.get('/:id/candidates', auth, async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    if (requirement.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this requirement' });
    }

    const { User } = require('../models/User');
    const candidates = await User.find({ role: 'Candidate' })
      .populate('profile')
      .limit(200);

    const requiredSkills = Array.isArray(requirement.skills) ? requirement.skills : [];
    const requiredJobType = requirement.jobType ? String(requirement.jobType).toLowerCase() : null;
    const requiredLocation = requirement.location ? String(requirement.location).toLowerCase() : null;

    const matchingCandidates = candidates
      .filter(candidate => candidate.profile)
      .map(candidate => {
        const profile = candidate.profile;
        const candidateSkills = Array.isArray(profile.skills) ? profile.skills : [];
        const candidateJobType = profile.jobType ? String(profile.jobType).toLowerCase() : null;
        const candidateLocation = profile.city ? String(profile.city).toLowerCase() : null;

        // Calculate skill match (40% weight)
        let skillScore = 0;
        let matchedSkills = [];
        if (requiredSkills.length > 0) {
          matchedSkills = candidateSkills.filter(skill =>
            requiredSkills.some(reqSkill => {
              const skillLower = skill.toLowerCase();
              const reqSkillLower = reqSkill.toLowerCase();
              return skillLower.includes(reqSkillLower) ||
                reqSkillLower.includes(skillLower) ||
                skillLower.split(' ').some(word => reqSkillLower.includes(word)) ||
                reqSkillLower.split(' ').some(word => skillLower.includes(word));
            })
          );
          skillScore = (matchedSkills.length / requiredSkills.length) * 40;
        }

        // Calculate job type match (30% weight)
        let jobTypeScore = 0;
        if (requiredJobType && candidateJobType) {
          if (candidateJobType === requiredJobType) {
            jobTypeScore = 30; // Exact match
          } else if (candidateJobType.includes(requiredJobType) || requiredJobType.includes(candidateJobType)) {
            jobTypeScore = 20; // Partial match
          } else if (candidateJobType === 'full-time' && requiredJobType === 'part-time' ||
            candidateJobType === 'part-time' && requiredJobType === 'full-time') {
            jobTypeScore = 10; // Related types
          }
        }

        // Calculate location match (20% weight)
        let locationScore = 0;
        if (requiredLocation && candidateLocation) {
          if (candidateLocation === requiredLocation) {
            locationScore = 20; // Exact match
          } else if (candidateLocation.includes(requiredLocation) || requiredLocation.includes(candidateLocation)) {
            locationScore = 15; // Partial match
          } else if (candidateLocation.split(' ').some(word => requiredLocation.includes(word)) ||
            requiredLocation.split(' ').some(word => candidateLocation.includes(word))) {
            locationScore = 10; // Word overlap
          }
        }

        // Calculate experience match (10% weight)
        let experienceScore = 0;
        let experienceMatch = false;
        if (profile.experience !== undefined) {
          const candidateExp = parseInt(profile.experience) || 0;
          if (candidateExp >= requirement.experienceMin && candidateExp <= requirement.experienceMax) {
            experienceScore = 10; // Exact match
            experienceMatch = true;
          } else if (candidateExp >= requirement.experienceMin - 2 && candidateExp <= requirement.experienceMax + 2) {
            experienceScore = 7; // Close match
            experienceMatch = true;
          } else if (candidateExp >= requirement.experienceMin - 3 && candidateExp <= requirement.experienceMax + 3) {
            experienceScore = 3; // Acceptable range
            experienceMatch = true;
          }
        }

        // Calculate total match percentage
        const totalScore = skillScore + jobTypeScore + locationScore + experienceScore;
        const matchPercentage = Math.round(totalScore);
        const skillMatchPercentage = Math.round(skillScore * 2.5); // Convert to 0-100 scale

        return {
          _id: candidate._id,
          username: candidate.username,
          email: candidate.email,
          experience: profile.experience || 0,
          location: profile.city || 'Not specified',
          matchedSkills,
          skillMatchPercentage,
          experienceMatch,
          matchPercentage
        };
      })
      .filter(candidate => candidate.matchPercentage >= 30) // Only show candidates with at least 30% match
      .sort((a, b) => {
        // Primary sort: by total match percentage
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        // Secondary sort: by skill match
        if (b.skillMatchPercentage !== a.skillMatchPercentage) {
          return b.skillMatchPercentage - a.skillMatchPercentage;
        }
        // Final sort: by experience
        return b.experience - a.experience;
      });

    res.json(matchingCandidates);
  } catch (err) {
    console.error('Error fetching matching candidates:', err);
    res.status(500).json({ error: 'Failed to fetch matching candidates' });
  }
});

// GET candidates matching a requirement (for admins)
router.get('/:id/candidates/admin', async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    const { User } = require('../models/User');
    console.log('Fetching candidates for requirement:', req.params.id);

    const candidates = await User.find({ role: 'Candidate' })
      .populate('profile')
      .limit(200); // Increased limit to get more candidates

    console.log('Found candidates:', candidates.length);

    const candidatesWithProfiles = candidates.filter(candidate => candidate.profile);
    console.log('Candidates with profiles:', candidatesWithProfiles.length);

    const requiredSkills = Array.isArray(requirement.skills) ? requirement.skills.map(s => String(s).toLowerCase()) : [];
    const requiredJobType = requirement.jobType ? String(requirement.jobType).toLowerCase() : null;
    const requiredLocation = requirement.location ? String(requirement.location).toLowerCase() : null;

    // Calculate match scores for all candidates
    const candidatesWithScores = candidatesWithProfiles.map(candidate => {
      const profile = candidate.profile;
      const candidateSkills = Array.isArray(profile.skills) ? profile.skills.map(s => String(s).toLowerCase()) : [];
      const candidateJobType = profile.jobType ? String(profile.jobType).toLowerCase() : null;
      const candidateLocation = profile.city ? String(profile.city).toLowerCase() : null;

      // Calculate skill match (40% weight)
      let skillScore = 0;
      let matchedSkills = [];
      if (requiredSkills.length > 0) {
        matchedSkills = candidateSkills.filter(skill =>
          requiredSkills.some(reqSkill => {
            const skillLower = skill.toLowerCase();
            const reqSkillLower = reqSkill.toLowerCase();
            return skillLower.includes(reqSkillLower) ||
              reqSkillLower.includes(skillLower) ||
              skillLower.split(' ').some(word => reqSkillLower.includes(word)) ||
              reqSkillLower.split(' ').some(word => skillLower.includes(word));
          })
        );
        skillScore = (matchedSkills.length / requiredSkills.length) * 40;
      }

      // Calculate job type match (30% weight)
      let jobTypeScore = 0;
      if (requiredJobType && candidateJobType) {
        if (candidateJobType === requiredJobType) {
          jobTypeScore = 30; // Exact match
        } else if (candidateJobType.includes(requiredJobType) || requiredJobType.includes(candidateJobType)) {
          jobTypeScore = 20; // Partial match
        } else if (candidateJobType === 'full-time' && requiredJobType === 'part-time' ||
          candidateJobType === 'part-time' && requiredJobType === 'full-time') {
          jobTypeScore = 10; // Related types
        }
      }

      // Calculate location match (20% weight)
      let locationScore = 0;
      if (requiredLocation && candidateLocation) {
        if (candidateLocation === requiredLocation) {
          locationScore = 20; // Exact match
        } else if (candidateLocation.includes(requiredLocation) || requiredLocation.includes(candidateLocation)) {
          locationScore = 15; // Partial match
        } else if (candidateLocation.split(' ').some(word => requiredLocation.includes(word)) ||
          requiredLocation.split(' ').some(word => candidateLocation.includes(word))) {
          locationScore = 10; // Word overlap
        }
      }

      // Calculate experience match (10% weight)
      let experienceScore = 0;
      let experienceMatch = false;
      if (profile.experience !== undefined) {
        const candidateExp = parseInt(profile.experience) || 0;
        if (candidateExp >= requirement.experienceMin && candidateExp <= requirement.experienceMax) {
          experienceScore = 10; // Exact match
          experienceMatch = true;
        } else if (candidateExp >= requirement.experienceMin - 2 && candidateExp <= requirement.experienceMax + 2) {
          experienceScore = 7; // Close match
          experienceMatch = true;
        } else if (candidateExp >= requirement.experienceMin - 5 && candidateExp <= requirement.experienceMax + 5) {
          experienceScore = 3; // Acceptable range
          experienceMatch = true;
        }
      }

      // Calculate total match percentage
      const totalScore = skillScore + jobTypeScore + locationScore + experienceScore;
      const matchPercentage = Math.round(totalScore);

      return {
        _id: candidate._id,
        username: candidate.username,
        email: candidate.email,
        experience: profile.experience || 0,
        location: profile.city || 'Not specified',
        matchedSkills,
        skillMatchPercentage: Math.round(skillScore * 2.5), // Convert to 0-100 scale
        experienceMatch,
        matchPercentage,
        resume: candidate.profile?.resumeUrl || candidate.profile?.resume || null,
        // Add detailed scoring for debugging
        scoring: {
          skillScore: Math.round(skillScore),
          jobTypeScore: Math.round(jobTypeScore),
          locationScore: Math.round(locationScore),
          experienceScore: Math.round(experienceScore),
          totalScore: Math.round(totalScore)
        }
      };
    });

    // Filter candidates with at least 30% match and sort by match percentage
    const matchingCandidates = candidatesWithScores
      .filter(candidate => candidate.matchPercentage >= 30)
      .sort((a, b) => {
        // Primary sort: by total match percentage
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        // Secondary sort: by skill match
        if (b.skillMatchPercentage !== a.skillMatchPercentage) {
          return b.skillMatchPercentage - a.skillMatchPercentage;
        }
        // Tertiary sort: by job type match
        if (b.scoring.jobTypeScore !== a.scoring.jobTypeScore) {
          return b.scoring.jobTypeScore - a.scoring.jobTypeScore;
        }
        // Quaternary sort: by location match
        if (b.scoring.locationScore !== a.scoring.locationScore) {
          return b.scoring.locationScore - a.scoring.locationScore;
        }
        // Final sort: by experience
        return b.experience - a.experience;
      });

    console.log('Final matching candidates:', matchingCandidates.length);
    console.log('Match score distribution:', matchingCandidates.map(c => c.matchPercentage));

    res.json({
      candidates: matchingCandidates,
      count: matchingCandidates.length
    });
  } catch (err) {
    console.error('Error fetching matching candidates:', err);
    res.status(500).json({ error: 'Failed to fetch matching candidates' });
  }
});

// POST create new requirement
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating requirement with data:', req.body);

    const {
      jobTitle,
      jobType,
      skills,
      location,
      experienceMin,
      experienceMax,
      salaryBudget,
      applicantsCount,
      notes
    } = req.body;

    // Validate required fields
    if (!jobTitle || !skills || !location || experienceMin === undefined || experienceMax === undefined) {
      return res.status(400).json({
        error: 'Missing required fields. Please fill in all required fields.'
      });
    }

    // Validate experience range
    if (parseInt(experienceMin) > parseInt(experienceMax)) {
      return res.status(400).json({
        error: 'Minimum experience cannot be greater than maximum experience.'
      });
    }

    const requirement = new Requirement({
      clientId: req.user.id,
      jobTitle,
      jobType: jobType || 'Full-time',
      skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
      location,
      experienceMin: parseInt(experienceMin),
      experienceMax: parseInt(experienceMax),
      salaryBudget,
      applicantsCount: parseInt(applicantsCount) || 1,
      notes,
      status: 'active'
    });

    console.log('Saving requirement:', requirement);
    await requirement.save();
    console.log('Requirement saved successfully:', requirement._id);
    res.status(201).json(requirement);
  } catch (err) {
    console.error('Error creating requirement:', err);

    // Provide more specific error messages
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({ error: 'Failed to create requirement' });
  }
});

// PUT update requirement
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Requirement.findById(id);

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    if (requirement.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this requirement' });
    }

    const updatedRequirement = await Requirement.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedRequirement);
  } catch (err) {
    console.error('Error updating requirement:', err);
    res.status(500).json({ error: 'Failed to update requirement' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Requirement.findById(id);

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    // Complete deletion - remove from database
    await Requirement.findByIdAndDelete(id);

    res.json({ message: 'Requirement deleted successfully' });
  } catch (err) {
    console.error('Error deleting requirement:', err);
    res.status(500).json({ error: 'Failed to delete requirement' });
  }
});
// POST send candidates to client (admin route)
router.post('/:id/send-candidates', auth, async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    const { User } = require('../models/User');
    const { UserCredit } = require('../models/Credit');
    const candidates = await User.find({ role: 'Candidate' })
      .populate('profile')
      .limit(200);

    const candidatesWithProfiles = candidates.filter(candidate => candidate.profile);

    const requiredSkills = Array.isArray(requirement.skills) ? requirement.skills.map(s => String(s).toLowerCase()) : [];
    const requiredJobType = requirement.jobType ? String(requirement.jobType).toLowerCase() : null;
    const requiredLocation = requirement.location ? String(requirement.location).toLowerCase() : null;

    // Calculate match scores for all candidates using the same algorithm
    const candidatesWithScores = candidatesWithProfiles.map(candidate => {
      const profile = candidate.profile;
      const candidateSkills = Array.isArray(profile.skills) ? profile.skills.map(s => String(s).toLowerCase()) : [];
      const candidateJobType = profile.jobType ? String(profile.jobType).toLowerCase() : null;
      const candidateLocation = profile.city ? String(profile.city).toLowerCase() : null;

      // Calculate skill match (40% weight)
      let skillScore = 0;
      let matchedSkills = [];
      if (requiredSkills.length > 0) {
        matchedSkills = candidateSkills.filter(skill =>
          requiredSkills.some(reqSkill => {
            const skillLower = skill.toLowerCase();
            const reqSkillLower = reqSkill.toLowerCase();
            return skillLower.includes(reqSkillLower) ||
              reqSkillLower.includes(skillLower) ||
              skillLower.split(' ').some(word => reqSkillLower.includes(word)) ||
              reqSkillLower.split(' ').some(word => skillLower.includes(word));
          })
        );
        skillScore = (matchedSkills.length / requiredSkills.length) * 40;
      }

      // Calculate job type match (30% weight)
      let jobTypeScore = 0;
      if (requiredJobType && candidateJobType) {
        if (candidateJobType === requiredJobType) {
          jobTypeScore = 30; // Exact match
        } else if (candidateJobType.includes(requiredJobType) || requiredJobType.includes(candidateJobType)) {
          jobTypeScore = 20; // Partial match
        } else if (candidateJobType === 'full-time' && requiredJobType === 'part-time' ||
          candidateJobType === 'part-time' && requiredJobType === 'full-time') {
          jobTypeScore = 10; // Related types
        }
      }

      // Calculate location match (20% weight)
      let locationScore = 0;
      if (requiredLocation && candidateLocation) {
        if (candidateLocation === requiredLocation) {
          locationScore = 20; // Exact match
        } else if (candidateLocation.includes(requiredLocation) || requiredLocation.includes(candidateLocation)) {
          locationScore = 15; // Partial match
        } else if (candidateLocation.split(' ').some(word => requiredLocation.includes(word)) ||
          requiredLocation.split(' ').some(word => candidateLocation.includes(word))) {
          locationScore = 10; // Word overlap
        }
      }

      // Calculate experience match (10% weight)
      let experienceScore = 0;
      let experienceMatch = false;
      if (profile.experience !== undefined) {
        const candidateExp = parseInt(profile.experience) || 0;
        if (candidateExp >= requirement.experienceMin && candidateExp <= requirement.experienceMax) {
          experienceScore = 10; // Exact match
          experienceMatch = true;
        } else if (candidateExp >= requirement.experienceMin - 2 && candidateExp <= requirement.experienceMax + 2) {
          experienceScore = 7; // Close match
          experienceMatch = true;
        } else if (candidateExp >= requirement.experienceMin - 3 && candidateExp <= requirement.experienceMax + 3) {
          experienceScore = 3; // Acceptable range
          experienceMatch = true;
        }
      }

      // Calculate total match percentage
      const totalScore = skillScore + jobTypeScore + locationScore + experienceScore;
      const matchPercentage = Math.round(totalScore);

      return {
        candidateId: candidate._id,
        matchPercentage,
        skillMatchPercentage: Math.round(skillScore * 2.5), // Convert to 0-100 scale
        matchedSkills,
        experienceMatch,
        experience: profile.experience || 0,
        location: profile.city || 'Not specified',
        username: candidate.username,
        email: candidate.email
      };
    });

    // Filter candidates with at least 50% match and sort by match percentage
    const strictMatches = candidatesWithScores
      .filter(candidate => candidate.matchPercentage >= 50)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    const numberRequested = parseInt(requirement.applicantsCount) || 1;
    const numberAvailable = strictMatches.length;
    const toSend = strictMatches.slice(0, numberRequested);

    if (toSend.length === 0) {
      return res.status(400).json({
        error: 'NO_STRICT_MATCHES',
        message: 'No candidates found with at least 50% match score. Please check if there are candidates with matching skills, job type, location, and experience.'
      });
    }

    // Credits: deduct from CLIENT only; admin does not need credits
    let clientCredit = await UserCredit.findOne({ userId: requirement.clientId });
    if (!clientCredit) {
      clientCredit = new UserCredit({ userId: requirement.clientId, credits: 0, viewedResumes: [] });
      await clientCredit.save();
    }

    if (clientCredit.credits < toSend.length) {
      const sentCandidates = new SentCandidates({
        requirementId: requirement._id,
        clientId: requirement.clientId,
        adminId: req.user.id,
        candidates: [],
        totalCandidates: 0,
        requestedCount: numberRequested,
        creditIssue: true,
        message: 'Insufficient client credits. Please request credits to receive candidates.'
      });
      await sentCandidates.save();
      return res.status(400).json({
        error: 'CLIENT_NO_CREDITS',
        message: 'Client has insufficient credits to receive candidates. Please request credits first.',
        notificationCreated: true,
        recordId: sentCandidates._id
      });
    }

    clientCredit.credits -= toSend.length;
    await clientCredit.save();

    const sentCandidates = new SentCandidates({
      requirementId: requirement._id,
      clientId: requirement.clientId,
      adminId: req.user.id,
      candidates: toSend,
      totalCandidates: toSend.length,
      requestedCount: numberRequested
    });

    console.log('Saving sent candidates record:', {
      requirementId: requirement._id,
      clientId: requirement.clientId,
      adminId: req.user.id,
      totalCandidates: toSend.length,
      requestedCount: numberRequested
    });

    await sentCandidates.save();
    console.log('Sent candidates record saved successfully');

    res.json({
      message: `Successfully sent ${toSend.length} candidates to client` + (numberAvailable < numberRequested ? ` (only ${numberAvailable} available)` : ''),
      sentCandidates,
      totalSent: toSend.length,
      requested: numberRequested,
      availableMatches: numberAvailable,
      clientCreditsRemaining: clientCredit.credits
    });

  } catch (err) {
    console.error('Error sending candidates:', err);
    res.status(500).json({ error: 'Failed to send candidates' });
  }
});

// GET sent candidates for client
router.get('/sent-candidates', auth, async (req, res) => {
  try {
    const sentCandidates = await SentCandidates.find({ clientId: req.user.id })
      .populate('requirementId', 'jobTitle jobType location experienceMin experienceMax')
      .populate('adminId', 'username')
      .sort({ sentAt: -1 });

    res.json(sentCandidates);
  } catch (err) {
    console.error('Error fetching sent candidates:', err);
    res.status(500).json({ error: 'Failed to fetch sent candidates' });
  }
});

// GET specific sent candidates details
router.get('/sent-candidates/:id', auth, async (req, res) => {
  try {
    const sentCandidates = await SentCandidates.findById(req.params.id)
      .populate('requirementId', 'jobTitle jobType location experienceMin experienceMax skills')
      .populate('adminId', 'username');

    if (!sentCandidates) {
      return res.status(404).json({ error: 'Sent candidates not found' });
    }

    if (sentCandidates.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this record' });
    }

    if (!sentCandidates.isRead) {
      sentCandidates.isRead = true;
      await sentCandidates.save();
    }

    res.json(sentCandidates);
  } catch (err) {
    console.error('Error fetching sent candidates details:', err);
    res.status(500).json({ error: 'Failed to fetch sent candidates details' });
  }
});

// GET unread sent candidates count for client
router.get('/sent-candidates-count', auth, async (req, res) => {
  try {
    console.log('Fetching unread count for user:', req.user.id);
    console.log('User object:', req.user);

    const count = await SentCandidates.countDocuments({
      clientId: req.user.id,
      isRead: false
    });
    console.log('Unread count:', count);

    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Error fetching sent candidates count:', err);
    res.status(500).json({ error: 'Failed to fetch sent candidates count' });
  }
});

// Test route without auth to check if the issue is with authentication
router.get('/test-sent-candidates-count', async (req, res) => {
  try {
    console.log('Test route - no auth required');
    const count = await SentCandidates.countDocuments({
      isRead: false
    });
    console.log('Total unread count (all users):', count);

    res.json({
      unreadCount: count,
      message: 'Test route working - no auth required'
    });
  } catch (err) {
    console.error('Error in test route:', err);
    res.status(500).json({ error: 'Failed to fetch test count' });
  }
});

// Test route to create sample sent candidates data
router.post('/test-create-sent-candidates', auth, async (req, res) => {
  try {
    console.log('Creating test sent candidates data for user:', req.user.id);

    const requirement = await Requirement.findOne({ clientId: req.user.id });
    if (!requirement) {
      return res.status(404).json({ error: 'No requirement found for this user' });
    }

    const testCandidates = [
      {
        candidateId: req.user.id,
        matchPercentage: 85,
        skillMatchPercentage: 80,
        matchedSkills: ['React', 'JavaScript'],
        experienceMatch: true,
        experience: 5,
        location: 'Mumbai',
        username: 'Test Candidate 1',
        email: 'test1@example.com'
      },
      {
        candidateId: req.user.id,
        matchPercentage: 75,
        skillMatchPercentage: 70,
        matchedSkills: ['Node.js', 'MongoDB'],
        experienceMatch: true,
        experience: 3,
        location: 'Pune',
        username: 'Test Candidate 2',
        email: 'test2@example.com'
      }
    ];

    const sentCandidates = new SentCandidates({
      requirementId: requirement._id,
      clientId: req.user.id,
      adminId: req.user.id,
      candidates: testCandidates,
      totalCandidates: testCandidates.length,
      requestedCount: 3,
      isRead: false
    });

    await sentCandidates.save();
    console.log('Test sent candidates created successfully');

    res.json({
      message: 'Test sent candidates created successfully',
      sentCandidates
    });
  } catch (err) {
    console.error('Error creating test sent candidates:', err);
    res.status(500).json({ error: 'Failed to create test sent candidates' });
  }
});

module.exports = router;

