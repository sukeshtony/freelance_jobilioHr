const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ExamBooking = require("../models/ExamBooking");
const Interview = require("../models/Interview");
const { User } = require("../models/User");
const Feedbacker = require('../models/Feedbacker');


router.get("/conducted-candidates", async (req, res) => {
  try {
    console.log("Fetching conducted candidates...");

    const [exams, interviews] = await Promise.all([
      ExamBooking.find({ status: "Conducted" }),
      Interview.find({ status: "Conducted" }),
    ]);

    // Collect user IDs from exams and interviews
    const examUserIds = new Set(exams.map(exam => exam.userId?.toString()).filter(Boolean));
    const interviewUserIds = new Set(interviews.map(interview => interview.candidate?.toString()).filter(Boolean));

    // Get only users who have BOTH exam and interview conducted
    const bothConductedUserIds = [...examUserIds].filter(id => interviewUserIds.has(id));

    console.log("Users with BOTH conducted exam and interview:", bothConductedUserIds);

    const users = await User.find({ _id: { $in: bothConductedUserIds } })
      .populate("assignedFeedbacker");

    const response = users.map(user => {
      const userExams = exams.filter(exam => exam.userId?.toString() === user._id.toString());
      const userInterviews = interviews.filter(interview => interview.candidate?.toString() === user._id.toString());

      return {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          assignedFeedbacker: user.assignedFeedbacker
            ? {
              _id: user.assignedFeedbacker._id,
              name: user.assignedFeedbacker.name,
              email: user.assignedFeedbacker.email,
            }
            : null,
        },
        exams: userExams,
        interviews: userInterviews,
      };
    });

    res.json({ success: true, data: response });

  } catch (err) {
    console.error("Error in /conducted-candidates:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});



// Add this to your routes file
router.get("/conducted-candidates/:id", async (req, res) => {
  try {
    const candidateId = req.params.id;

    // Find exams for this candidate
    const exams = await ExamBooking.find({
      userId: candidateId,
      status: "Conducted"
    });

    // Find interviews for this candidate
    const interviews = await Interview.find({
      candidate: candidateId,
      status: "Conducted"
    });

    // Get user details
    const user = await User.findById(candidateId);

    res.json({
      success: true,
      data: [{
        user,
        exams,
        interviews
      }]
    });

  } catch (err) {
    console.error("Error fetching candidate details:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post('/assign-feedbacker', async (req, res) => {
  const { candidateId, feedbackerId } = req.body;

  try {
    const candidate = await User.findById(candidateId);
    const feedbacker = await Feedbacker.findById(feedbackerId);

    if (!candidate || !feedbacker) {
      return res.status(404).json({ msg: 'Candidate or Feedbacker not found' });
    }

    candidate.assignedFeedbacker = feedbackerId;
    await candidate.save();

    res.json({ msg: 'Feedbacker assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// routes/users.js
router.put('/:userId/complete', async (req, res) => {
  try {
    const { userId } = req.params;
    const { feedbackerId } = req.body;

    // 1. Update exams
    const exams = await ExamBooking.find({ userId });
    for (const exam of exams) {
      if (exam.status === 'Conducted') {
        exam.status = exam.score / exam.totalMarks >= 0.4 ? 'Passed' : 'Failed';
        await exam.save();
      }
    }

    // 2. Update interviews
    await Interview.updateMany(
      { candidate: userId, status: 'Conducted' },
      { $set: { status: 'Completed' } }
    );

    // 3. Unassign feedbacker and increment count
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $set: { assignedFeedbacker: null }
      }),
      Feedbacker.findByIdAndUpdate(feedbackerId, {
        $inc: { completedFeedbacks: 1 }
      })
    ]);

    res.json({
      success: true,
      message: 'User marked as complete and unassigned',
      data: {
        userId,
        feedbackerId,
        updatedExams: exams.length,
        updatedInterviews: await Interview.countDocuments({
          candidate: userId,
          status: 'Completed'
        })
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete feedback',
      error: error.message
    });
  }
});


module.exports = router;
