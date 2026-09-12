const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CallBooking = require('../models/CallBooking');
const auth = require('../middleware/auth');

// GET /api/bookings/user
router.get('/user', auth, async (req, res) => {
  try {
    const bookings = await CallBooking.find({ user: req.user.id });
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: 'Failed to fetch call bookings' });
  }
});

// POST /api/bookings
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, date, time } = req.body;

    if (!name || !email || !phone || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    const booking = new CallBooking({
      name,
      email,
      phone,
      date: new Date(date),
      time,
      user: req.user.id, // ✅ Use .id instead of ._id
      status: 'scheduled',
    });


    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking confirmed',
      data: booking,
    });
  } catch (err) {
    console.error('Error booking session:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to book session',
    });
  }
});

// GET /api/bookings/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const booking = await CallBooking.findById(req.params.id).lean();

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Use req.user.id instead of req.user._id
    if (!booking.user || booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const formattedBooking = {
      ...booking,
      id: booking._id,
      date: booking.date.toISOString().split('T')[0],
    };

    delete formattedBooking._id;
    delete formattedBooking.__v;
    delete formattedBooking.createdAt;
    delete formattedBooking.updatedAt;

    res.json({ success: true, data: formattedBooking });
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});


// DELETE /api/bookings/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const booking = await CallBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!booking.user || booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await CallBooking.findByIdAndDelete(req.params.id); // ✅ remove from DB

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ success: false, error: 'Failed to delete booking' });
  }
});


module.exports = router;
