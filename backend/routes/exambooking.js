const express = require('express');
const router = express.Router();
const ExamBooking = require('../models/ExamBooking');
const Test = require('../models/Test');

const moment = require('moment');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Exam booking API is working',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to check database directly
router.get('/debug', async (req, res) => {
    try {
        console.log('=== DEBUG ENDPOINT CALLED ===');
        
        // Check if model is working
        console.log('ExamBooking model:', typeof ExamBooking);
        console.log('ExamBooking model name:', ExamBooking.modelName);
        
        const totalBookings = await ExamBooking.countDocuments();
        console.log(`Total exam bookings in database: ${totalBookings}`);
        
        const sampleBookings = await ExamBooking.find().limit(5);
        console.log(`Sample bookings found: ${sampleBookings.length}`);
        
        if (sampleBookings.length > 0) {
            console.log('First booking details:', {
                _id: sampleBookings[0]._id,
                username: sampleBookings[0].username,
                courseName: sampleBookings[0].courseName,
                date: sampleBookings[0].date,
                time: sampleBookings[0].time,
                status: sampleBookings[0].status
            });
        }
        
        res.json({
            totalBookings,
            sampleBookings: sampleBookings.map(b => ({
                _id: b._id,
                username: b.username,
                courseName: b.courseName,
                date: b.date,
                time: b.time,
                status: b.status
            })),
            message: 'Database check completed',
            modelInfo: {
                modelName: ExamBooking.modelName,
                collectionName: ExamBooking.collection.name
            }
        });
    } catch (err) {
        console.error('Debug endpoint error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ error: 'Debug failed', details: err.message });
    }
});

const markMissedExams = async () => {
    const now = new Date();
    console.log('Checking for missed exams at:', now.toISOString());

    const allBookings = await ExamBooking.find({
        attended: false,
        status: 'Scheduled'
    });
    
    console.log(`Found ${allBookings.length} scheduled exams to check for missed status`);

    let markedAsMissed = 0;
    for (const booking of allBookings) {
        const examDate = booking.date;
        const examTime = booking.time;

        try {
            // Convert exam date + time string into actual Date object
            const examStartTime = moment(`${examDate} ${examTime}`, 'YYYY-MM-DD hh:mm A').toDate();
            
            // Add 45 minutes to get exam end time
            const examEndTime = new Date(examStartTime.getTime() + 45 * 60 * 1000);

            // Only mark missed if current time is past the end time
            if (examEndTime < now) {
                console.log(`Marking exam as missed: ${booking.username} - ${examDate} ${examTime}`);
                booking.status = 'Missed';
                await booking.save();
                markedAsMissed++;
            }
        } catch (err) {
            console.error(`Error processing exam ${booking._id}:`, err);
            console.error('Exam data:', { examDate, examTime, username: booking.username });
        }
    }
    
    console.log(`Marked ${markedAsMissed} exams as missed`);
};


// 📌 BOOK a new exam
router.post('/book', async (req, res) => {
    const { userId, username, category, courseId, courseName, date, time } = req.body;

    try {
        const existing = await ExamBooking.findOne({ userId, date, time });
        if (existing) {
            return res.status(400).json({ error: "You already have a booking at this time." });
        }

        const newBooking = new ExamBooking({
            userId,
            username,
            category,
            courseId,
            courseName,
            date,
            time
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        res.status(500).json({ error: 'Booking failed', details: err.message });
    }
});

// 📌 GET booking details by booking ID
router.get('/booking-details/:id', async (req, res) => {
    try {

        await markMissedExams();

        const booking = await ExamBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch booking details', details: err.message });
    }
});

// 📌 GET all bookings OR filter by userId
router.get('/bookings', async (req, res) => {
    const { userId, includeCanceled } = req.query;
    const baseFilter = userId ? { userId } : {};
    const filter = includeCanceled === 'true' ? baseFilter : { ...baseFilter, status: { $ne: 'Canceled' } };

    try {
        console.log('=== EXAM BOOKINGS DEBUG START ===');
        console.log('Admin fetching exam bookings with filter:', filter);
        console.log('Request headers:', req.headers);
        
        await markMissedExams();
        
        // First, let's check if there are any exam bookings at all
        const totalBookings = await ExamBooking.countDocuments();
        console.log(`Total exam bookings in database: ${totalBookings}`);
        
        if (totalBookings === 0) {
            console.log('No exam bookings found in database');
            return res.json([]);
        }
        
        // Check status distribution before filtering
        const statusCounts = await ExamBooking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('Status distribution:', statusCounts);
        
        const bookings = await ExamBooking.find(filter).sort({ date: 1, time: 1 });
        console.log(`Found ${bookings.length} exam bookings matching filter`);
        
        // Check if any bookings have missing required fields
        const invalidBookings = bookings.filter(b => !b.username || !b.courseName || !b.date || !b.time);
        if (invalidBookings.length > 0) {
            console.log(`Found ${invalidBookings.length} bookings with missing fields:`, invalidBookings.map(b => ({
                _id: b._id,
                username: b.username,
                courseName: b.courseName,
                date: b.date,
                time: b.time
            })));
        }
        
        if (bookings.length > 0) {
            console.log('Sample booking:', {
                _id: bookings[0]._id,
                username: bookings[0].username,
                courseName: bookings[0].courseName,
                date: bookings[0].date,
                time: bookings[0].time,
                status: bookings[0].status
            });
        }
        
        // Check the difference
        const difference = totalBookings - bookings.length;
        if (difference > 0) {
            console.log(`⚠️  DISCREPANCY DETECTED: ${difference} bookings missing!`);
            console.log(`Database total: ${totalBookings}, Found: ${bookings.length}`);
            
            // Find the missing bookings
            const allIds = (await ExamBooking.find({}, '_id')).map(b => b._id.toString());
            const foundIds = bookings.map(b => b._id.toString());
            const missingIds = allIds.filter(id => !foundIds.includes(id));
            
            if (missingIds.length > 0) {
                console.log('Missing booking IDs:', missingIds);
                const missingBookings = await ExamBooking.find({ _id: { $in: missingIds } });
                console.log('Missing booking details:', missingBookings.map(b => ({
                    _id: b._id,
                    username: b.username,
                    courseName: b.courseName,
                    date: b.date,
                    time: b.time,
                    status: b.status
                })));
            }
        }
        
        console.log('=== EXAM BOOKINGS DEBUG END ===');
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching exam bookings:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
    }
});

// 📌 GET bookings by user ID
router.get('/booking/:id', async (req, res) => {
    try {
        const bookings = await ExamBooking.find({ userId: req.params.id }).sort({ date: 1, time: 1 });
        if (!bookings.length) return res.status(404).json({ message: 'No bookings found for this user' });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
    }
});

// 📌 DELETE a booking
router.delete('/booking/:id', async (req, res) => {
    try {
        const deleted = await ExamBooking.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Booking not found' });
        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete booking', details: err.message });
    }
});

// 📌 CANCEL a booking (soft cancel -> mark status Canceled)
router.post('/booking/:id/cancel', async (req, res) => {
    try {
        const booking = await ExamBooking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (['Passed', 'Failed', 'Conducted'].includes(booking.status)) {
            return res.status(400).json({ error: 'Completed exams cannot be canceled' });
        }

        booking.status = 'Canceled';
        await booking.save();
        res.json({ message: 'Booking canceled successfully', booking });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel booking', details: err.message });
    }
});

// ✅ GET test by booking ID
router.get('/test-by-booking/:bookingId', async (req, res) => {
    try {
        const booking = await ExamBooking.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const test = await Test.findOne({ courseId: booking.courseId });
        if (!test) return res.status(404).json({ error: 'Test not found for this course' });

        const questions = test.questions.map(({ questionText, options }) => ({
            questionText,
            options
        }));

        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch test', details: err.message });
    }
});



// ✅ Submit exam and update score
router.post('/submit/:bookingId', async (req, res) => {
    const { answers } = req.body;

    try {
        const booking = await ExamBooking.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const test = await Test.findOne({ courseId: booking.courseId });
        if (!test) return res.status(404).json({ message: 'Test not found' });

        let score = 0;
        const total = test.questions.length;

        test.questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) score++;
        });

        booking.score = score;
        booking.totalMarks = total;
        booking.status = 'Conducted';
        booking.attended = true;
        await booking.save();

        res.json({ message: 'Exam submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Submission failed', details: err.message });
    }
});

module.exports = router;
