const express = require('express');
const authMiddleware = require('../middleware/auth');
const Lead = require('../models/Lead');
const Job = require('../models/Job');
const User = require('../models/User');

const router = express.Router();

// Test endpoint to check Lead model
router.get('/test', async (req, res) => {
  try {
    const Lead = require('../models/Lead');
    const leadCount = await Lead.countDocuments();
    res.json({ 
      success: true, 
      message: 'Lead model is working', 
      totalLeads: leadCount,
      modelExists: !!Lead 
    });
  } catch (error) {
    console.error('Lead model test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lead model test failed', 
      error: error.message 
    });
  }
});

// POST /api/leads - Create a new lead (authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('POST /api/leads - Creating new lead');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const {
      name,
      email,
      phone,
      source,
      jobId,
      jobTitle,
      companyName,
      status = 'new',
      priority = 'medium',
      score = 50,
      tags = [],
      externalJobUrl,
      notes,
      applicationId
    } = req.body;

    // Validate required fields
    if (!name || !email || !jobTitle || !companyName) {
      console.log('Missing required fields:', { name, email, jobTitle, companyName });
      return res.status(400).json({ 
        message: 'Missing required fields: name, email, jobTitle, companyName' 
      });
    }

    const leadData = {
      name,
      email,
      phone: phone || '',
      source: source || 'external_job_application',
      jobId: jobId || null,
      jobTitle,
      companyName,
      status,
      priority,
      score,
      tags,
      externalJobUrl: externalJobUrl || null,
      notes: notes ? [{ note: notes, addedBy: req.user.id, addedAt: new Date() }] : [],
      applicationId: applicationId || null
    };

    console.log('Lead data to save:', leadData);

    const newLead = new Lead(leadData);
    console.log('New lead instance created:', newLead);

    await newLead.save();
    console.log('Lead saved successfully with ID:', newLead._id);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully.',
      lead: newLead
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Server error while creating lead.' });
  }
});

// GET /api/leads - Get all leads (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const {
      page = 1,
      limit = 20,
      status,
      priority,
      source,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (source) {
      filter.source = source;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch leads with pagination
    const leads = await Lead.find(filter)
      .populate('jobId', 'jobTitle companyName')
      .populate('assignedTo', 'username email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLeads = await Lead.countDocuments(filter);

    res.json({
      success: true,
      leads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLeads / parseInt(limit)),
        totalLeads,
        hasNextPage: skip + leads.length < totalLeads,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Server error while fetching leads.' });
  }
});

// GET /api/leads/stats - Get lead statistics (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const stats = await Lead.aggregate([
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          newLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          contactedLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] }
          },
          qualifiedLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] }
          },
          closedWonLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
          },
          closedLostLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_lost'] }, 1, 0] }
          },
          highPriorityLeads: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          urgentLeads: {
            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
          }
        }
      }
    ]);

    const leadStats = stats[0] || {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      qualifiedLeads: 0,
      closedWonLeads: 0,
      closedLostLeads: 0,
      highPriorityLeads: 0,
      urgentLeads: 0
    };

    // Get leads by source
    const sourceStats = await Lead.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLeads = await Lead.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        ...leadStats,
        recentLeads,
        conversionRate: leadStats.totalLeads > 0 
          ? ((leadStats.closedWonLeads / leadStats.totalLeads) * 100).toFixed(2)
          : 0
      },
      sourceStats
    });

  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ message: 'Server error while fetching lead statistics.' });
  }
});

// GET /api/leads/:id - Get single lead (admin only)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const lead = await Lead.findById(req.params.id)
      .populate('jobId', 'jobTitle companyName description requirements')
      .populate('applicationId', 'userName email resume')
      .populate('assignedTo', 'username email')
      .populate('notes.addedBy', 'username email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    res.json({
      success: true,
      lead
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Server error while fetching lead.' });
  }
});

// PUT /api/leads/:id - Update lead (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const {
      status,
      priority,
      assignedTo,
      notes,
      nextFollowUp,
      followUpNotes,
      score,
      qualification,
      tags
    } = req.body;

    const updateData = {};
    
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (nextFollowUp) updateData.nextFollowUp = nextFollowUp;
    if (followUpNotes) updateData.followUpNotes = followUpNotes;
    if (score !== undefined) updateData.score = score;
    if (qualification) updateData.qualification = qualification;
    if (tags) updateData.tags = tags;

    // Add note if provided
    if (notes) {
      updateData.$push = {
        notes: {
          note: notes,
          addedBy: req.user.id,
          addedAt: new Date()
        }
      };
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'username email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    res.json({
      success: true,
      message: 'Lead updated successfully.',
      lead
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Server error while updating lead.' });
  }
});

// DELETE /api/leads/:id - Delete lead (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully.'
    });

  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Server error while deleting lead.' });
  }
});

module.exports = router;
