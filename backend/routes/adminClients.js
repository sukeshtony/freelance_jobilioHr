const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const Company = require('../models/Company');

// Helper function to clean mobile number
const cleanMobileNumber = (number) => {
  if (!number) return '';
  // Remove all non-digit characters and then remove leading 91 if present
  return number.replace(/\D/g, '').replace(/^91/, '');
};

// Helper function to format mobile number for display
const formatMobileNumber = (number) => {
  if (!number) return '';
  const cleaned = cleanMobileNumber(number);
  return cleaned ? `+91${cleaned}` : '';
};

// 🔹 GET all clients with their company info
router.get('/', async (req, res) => {
  try {
    const clients = await User.find({ role: 'Client' }).select('username email mobile createdAt');
    const companies = await Company.find({});

    // Join companies with their user (using userId)
    const clientList = clients.map(client => {
      const company = companies.find(c => c.userId && c.userId.toString() === client._id.toString());
      return {
        userId: client._id,
        username: client.username,
        email: client.email,
        mobile: formatMobileNumber(client.mobile),
        createdAt: client.createdAt,
        company: company ? {
          ...company.toObject(),
          mobileNumber: formatMobileNumber(company.mobileNumber)
        } : null
      };
    });

    res.json({ success: true, data: clientList });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// 🔹 PUT update client info + company info
router.put('/:userId', async (req, res) => {
  try {
    const {
      username,
      email,
      mobile,
      companyName,
      hrName,
      pan,
      gst,
      mobileNumber
    } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user || user.role !== 'Client') {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update user (clean mobile number before saving)
    user.username = username || user.username;
    user.email = email || user.email;
    user.mobile = mobile ? cleanMobileNumber(mobile) : user.mobile;
    await user.save();

    // Find company by userId
    let company = await Company.findOne({ userId: user._id });

    // If company not found, create new one
    if (!company) {
      company = new Company({ 
        userId: user._id,
        companyName: companyName || '',
        hrName: hrName || '',
        mobileNumber: mobileNumber ? cleanMobileNumber(mobileNumber) : '',
        pan: pan || '',
        gst: gst || ''
      });
    } else {
      // Update existing company
      company.companyName = companyName || company.companyName;
      company.hrName = hrName || company.hrName;
      company.pan = pan ? pan.toUpperCase() : company.pan;
      company.gst = gst || company.gst;
      company.mobileNumber = mobileNumber ? cleanMobileNumber(mobileNumber) : company.mobileNumber;
    }

    await company.save();

    // Return formatted mobile numbers in response
    res.json({ 
      success: true, 
      message: 'Client and company updated', 
      user: {
        ...user.toObject(),
        mobile: formatMobileNumber(user.mobile)
      }, 
      company: {
        ...company.toObject(),
        mobileNumber: formatMobileNumber(company.mobileNumber)
      }
    });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      error: 'Failed to update client', 
      message: err.message,
      ...(err.errors && { errors: err.errors })
    });
  }
});

// 🔹 DELETE client and their company
router.delete('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== 'Client') {
      return res.status(404).json({ error: 'Client not found' });
    }

    await User.findByIdAndDelete(req.params.userId);
    await Company.deleteOne({ userId: user._id });

    res.json({ success: true, message: 'Client and company deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete client and company' });
  }
});

module.exports = router;