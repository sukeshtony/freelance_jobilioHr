const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Public: check PAN availability without creating/updating anything
router.post('/check-pan', async (req, res) => {
  try {
    const { pan } = req.body;
    if (!pan || typeof pan !== 'string') {
      return res.status(400).json({ message: 'PAN is required' });
    }
    const existingCompany = await Company.findOne({ pan: pan.toUpperCase().trim() });
    return res.json({ exists: !!existingCompany });
  } catch (error) {
    console.error('check-pan error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/company - Submit company details (with user association)
router.post('/', auth, async (req, res) => {
  try {
    const {
      companyName,
      hrName,
      mobileNumber,
      pan,
      gst
    } = req.body;

    // Check if company with same PAN already exists
    const existingCompany = await Company.findOne({ pan: pan.toUpperCase() });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'PAN number already exists'
      });
    }

    // Create new company with user association
    const company = new Company({
      companyName: companyName.trim(),
      hrName: hrName.trim(),
      mobileNumber: mobileNumber.trim(),
      pan: pan.toUpperCase().trim(),
      gst: gst ? gst.toUpperCase().trim() : '',
      userId: req.user.id // Associate with the registered user
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company details submitted successfully',
      data: {
        id: company._id,
        companyName: company.companyName,
        hrName: company.hrName,
        createdAt: company.createdAt
      }
    });

  } catch (error) {
    console.error('Error submitting company details:', error);
    // Handle duplicate key errors (e.g., unique index on pan)
    if (error && error.code === 11000) {
      if (error.keyPattern && error.keyPattern.pan) {
        return res.status(400).json({ success: false, message: 'PAN number already exists' });
      }
      if (error.keyPattern && error.keyPattern.mobileNumber) {
        return res.status(400).json({ success: false, message: 'Mobile number already exists' });
      }
      if (error.keyPattern && error.keyPattern.userId) {
        return res.status(400).json({ success: false, message: 'Company already submitted for this user' });
      }
      return res.status(400).json({ success: false, message: 'Duplicate value' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/company - Get all companies (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({})
      .select('companyName hrName pan createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/company/my - Get current user's company details
router.get('/my', auth, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.user.id });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company details not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/company/:id - Get specific company details
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/company/:id - Update company details
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      companyName,
      hrName,
      mobileNumber,
      pan,
      gst
    } = req.body;

    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user owns this company
    if (company.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this company'
      });
    }

    // Check for duplicate PAN (excluding current company)
    if (pan && pan.toUpperCase() !== company.pan) {
      const existingCompany = await Company.findOne({ 
        pan: pan.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this PAN number already exists'
        });
      }
    }

    // Update company details
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      {
        companyName: companyName ? companyName.trim() : company.companyName,
        hrName: hrName ? hrName.trim() : company.hrName,
        mobileNumber: mobileNumber ? mobileNumber.trim() : company.mobileNumber,
        pan: pan ? pan.toUpperCase().trim() : company.pan,
        gst: gst !== undefined ? (gst ? gst.toUpperCase().trim() : '') : company.gst,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Company details updated successfully',
      data: updatedCompany
    });

  } catch (error) {
    console.error('Error updating company:', error);
    if (error && error.code === 11000) {
      if (error.keyPattern && error.keyPattern.pan) {
        return res.status(400).json({ success: false, message: 'PAN number already exists' });
      }
      if (error.keyPattern && error.keyPattern.mobileNumber) {
        return res.status(400).json({ success: false, message: 'Mobile number already exists' });
      }
      return res.status(400).json({ success: false, message: 'Duplicate value' });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/company/:id - Delete company
router.delete('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user owns this company
    if (company.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this company'
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;