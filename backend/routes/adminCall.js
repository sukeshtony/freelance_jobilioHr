const express = require('express');
const router = express.Router();
const CallBooking = require('../models/CallBooking');

router.get('/', async (req, res) => {
    try {
        const bookings = await CallBooking.find().sort({ date: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// PUT update a booking
router.put('/:id', async (req, res) => {
    try {
        const updated = await CallBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update booking' });
    }
});

// DELETE a booking
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await CallBooking.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }
        res.json({ success: true, message: 'Booking deleted' });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Failed to delete booking' });
    }
});

module.exports = router;
