const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { CreditRequest, UserCredit } = require('../models/Credit');
const { User } = require('../models/User');

// GET /api/user/credits - Get user's current credits and viewed resumes
router.get('/user/credits', auth, async (req, res) => {
  try {
    let userCredit = await UserCredit.findOne({ userId: req.user.id });
    
    // If no credit record exists, create one with default credits
    if (!userCredit) {
      userCredit = new UserCredit({
        userId: req.user.id,
        credits: 5,
        viewedResumes: []
      });
      await userCredit.save();
    }
    
    res.json({
      credits: userCredit.credits,
      viewedResumes: userCredit.viewedResumes || []
    });
  } catch (err) {
    console.error('Error fetching user credits:', err);
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
});

// GET /api/credits/balance - Get user's credit balance
router.get('/balance', auth, async (req, res) => {
  try {
    let userCredit = await UserCredit.findOne({ userId: req.user.id });
    
    // If no credit record exists, create one with default credits
    if (!userCredit) {
      userCredit = new UserCredit({
        userId: req.user.id,
        credits: 5,
        viewedResumes: []
      });
      await userCredit.save();
    }
    
    res.json({
      credits: userCredit.credits
    });
  } catch (err) {
    console.error('Error fetching credit balance:', err);
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
});

// POST /api/user/deduct-credit - Deduct credit when viewing non-applied candidate resume
router.post('/user/deduct-credit', auth, async (req, res) => {
  try {
    const { candidateId } = req.body;
    
    if (!candidateId) {
      return res.status(400).json({ error: 'Candidate ID is required' });
    }
    
    let userCredit = await UserCredit.findOne({ userId: req.user.id });
    
    // If no credit record exists, create one
    if (!userCredit) {
      userCredit = new UserCredit({
        userId: req.user.id,
        credits: 5,
        viewedResumes: []
      });
    }
    
    // Check if user has enough credits
    if (userCredit.credits <= 0) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    
    // Deduct credit and add to viewed resumes
    userCredit.credits -= 1;
    if (!userCredit.viewedResumes.includes(candidateId)) {
      userCredit.viewedResumes.push(candidateId);
    }
    userCredit.lastUpdated = new Date();
    
    await userCredit.save();
    
    res.json({
      success: true,
      remainingCredits: userCredit.credits,
      message: 'Credit deducted successfully'
    });
  } catch (err) {
    console.error('Error deducting credit:', err);
    res.status(500).json({ error: 'Failed to deduct credit' });
  }
});

// POST /api/credits/request - Submit credit request
router.post('/credits/request', auth, async (req, res) => {
  try {
    const { phone, reason, creditsRequested } = req.body;
    
    if (!phone || !reason) {
      return res.status(400).json({ error: 'Phone and reason are required' });
    }
    
    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create credit request
    const creditRequest = new CreditRequest({
      userId: req.user.id,
      userEmail: user.email,
      phone,
      reason,
      creditsRequested: creditsRequested || 10,
      status: 'pending'
    });
    
    await creditRequest.save();
    
    res.json({
      success: true,
      message: 'Credit request submitted successfully',
      requestId: creditRequest._id
    });
  } catch (err) {
    console.error('Error submitting credit request:', err);
    res.status(500).json({ error: 'Failed to submit credit request' });
  }
});

// GET /api/credits/user-requests - Get user's credit requests
router.get('/credits/user-requests', auth, async (req, res) => {
  try {
    const creditRequests = await CreditRequest.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    
    res.json(creditRequests);
  } catch (err) {
    console.error('Error fetching user credit requests:', err);
    res.status(500).json({ error: 'Failed to fetch credit requests' });
  }
});

// ===== ADMIN ROUTES =====

// GET /api/admin/credit-requests - Get all credit requests
router.get('/admin/credit-requests', auth, async (req, res) => {
  try {
    const creditRequests = await CreditRequest.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(creditRequests);
  } catch (err) {
    console.error('Error fetching credit requests:', err);
    res.status(500).json({ error: 'Failed to fetch credit requests' });
  }
});

// PUT /api/admin/credit-requests/:id - Update credit request status
router.put('/admin/credit-requests/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    const creditRequest = await CreditRequest.findById(id);
    if (!creditRequest) {
      return res.status(404).json({ error: 'Credit request not found' });
    }
    
    // Update status and admin notes
    creditRequest.status = status;
    if (adminNotes !== undefined) {
      creditRequest.adminNotes = adminNotes;
    }
    
    // If approved, add credits to user
    if (status === 'approved') {
      let userCredit = await UserCredit.findOne({ userId: creditRequest.userId });
      if (!userCredit) {
        userCredit = new UserCredit({
          userId: creditRequest.userId,
          credits: 0,
          viewedResumes: []
        });
      }
      userCredit.credits += creditRequest.creditsRequested;
      userCredit.lastUpdated = new Date();
      await userCredit.save();
    }
    
    // Update the updatedAt timestamp
    creditRequest.updatedAt = new Date();
    await creditRequest.save();
    
    res.json({
      success: true,
      message: 'Credit request updated successfully',
      creditRequest
    });
  } catch (err) {
    console.error('Error updating credit request:', err);
    res.status(500).json({ error: 'Failed to update credit request' });
  }
});

// GET /api/admin/user-credits - Get all user credits
router.get('/admin/user-credits', auth, async (req, res) => {
  try {
    const userCredits = await UserCredit.find()
      .populate('userId', 'username email role')
      .sort({ lastUpdated: -1 });
    
    res.json(userCredits);
  } catch (err) {
    console.error('Error fetching user credits:', err);
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
});

// PUT /api/admin/user-credits/:id - Update user credits
router.put('/admin/user-credits/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { credits } = req.body;
    
    if (typeof credits !== 'number' || credits < 0) {
      return res.status(400).json({ error: 'Credits must be a non-negative number' });
    }
    
    const userCredit = await UserCredit.findById(id);
    if (!userCredit) {
      return res.status(404).json({ error: 'User credit record not found' });
    }
    
    userCredit.credits = credits;
    userCredit.lastUpdated = new Date();
    await userCredit.save();
    
    res.json({
      success: true,
      message: 'User credits updated successfully',
      userCredit
    });
  } catch (err) {
    console.error('Error updating user credits:', err);
    res.status(500).json({ error: 'Failed to update user credits' });
  }
});

module.exports = router;
