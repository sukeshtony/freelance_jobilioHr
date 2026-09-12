const express = require('express');
const router = express.Router();
const Test = require('../models/Test');

// GET test by course ID
router.get('/:courseId', async (req, res) => {
  try {
    const test = await Test.findOne({ courseId: req.params.courseId });
    if (!test) {
      return res.status(404).json({ message: 'No test found' });
    }
    res.json(test);
  } catch (err) {
    console.error('Error fetching test:', err);
    res.status(500).json({ error: 'Server error while fetching test' });
  }
});

// POST create test
router.post('/', async (req, res) => {
  try {
    const { courseId, questions } = req.body;

    if (!courseId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'courseId and valid questions are required' });
    }

    const existing = await Test.findOne({ courseId });
    if (existing) {
      return res.status(400).json({ message: 'Test already exists for this course' });
    }

    const test = await Test.create({ courseId, questions });
    res.status(201).json(test);
  } catch (err) {
    console.error('Error creating test:', err);
    res.status(500).json({ error: 'Server error while creating test' });
  }
});

// PUT update test
router.put('/:courseId', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Valid questions array is required' });
    }

    const test = await Test.findOneAndUpdate(
      { courseId: req.params.courseId },
      { questions },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json(test);
  } catch (err) {
    console.error('Error updating test:', err);
    res.status(500).json({ error: 'Server error while updating test' });
  }
});

// DELETE test (optional)
router.delete('/:courseId', async (req, res) => {
  try {
    const deleted = await Test.findOneAndDelete({ courseId: req.params.courseId });
    if (!deleted) {
      return res.status(404).json({ message: 'Test not found to delete' });
    }
    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    console.error('Error deleting test:', err);
    res.status(500).json({ error: 'Server error while deleting test' });
  }
});

module.exports = router;
