const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST /api/contact
router.post('/contact', async (req, res) => {
  try {
    const { fullName, mobile, email, message } = req.body;

    // Basic validation
    if (!fullName || !mobile || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Normalize and validate Indian mobile: +91 followed by 10 digits
    const digits = String(mobile || '').replace(/\D/g, '');
    let normalizedMobile = '';
    if (digits.length === 10) {
      normalizedMobile = `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      normalizedMobile = `+${digits}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile. Use 10 digits; will be saved as +91XXXXXXXXXX.'
      });
    }

    const newContact = new Contact({ fullName, mobile: normalizedMobile, email, message });
    await newContact.save();

    res.status(201).json({ 
      success: true, 
      message: 'Message received successfully!' 
    });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error.' 
    });
  }
});

// GET /api/contacts (optional - for admin view)
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;