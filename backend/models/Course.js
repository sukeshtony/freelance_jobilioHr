const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  duration: { type: String, trim: true, default: '' },
  videoUrl: { type: String, default: null }
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  duration: { type: String, required: true },
  students: { type: Number, default: 0 },
  price: { type: Number, required: true, min: 0, default: 0 },
  discountPrice: { type: Number, min: 0, default: 0 },
  rating: { type: Number, required: true },
  category: { type: String, required: true },
  popular: { type: Boolean, default: false },
  field: { type: String, enum: ['IT', 'Non-IT'], required: true },
  isPaused: { type: Boolean, default: false },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  instructorDetails: { 
    name: { type: String, required: true },
    email: { type: String, required: true },
    title: { type: String, required: true },
    about: { type: String, required: true }
  },
  // Per-course availability settings (editable by instructor per assigned course)
  availability: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: []
  },
  defaultSlots: {
    type: [String],
    default: []
  },
  examDuration: {
    type: String,
    default: '60 minutes'
  },
  lessons: [LessonSchema]
}, { timestamps: true });

// Middleware to update instructor's courses array when a course is created
CourseSchema.post('save', async function (doc) {
  await mongoose.model('Instructor').findByIdAndUpdate(
    doc.instructor,
    { $addToSet: { courses: doc._id } }
  );
});

// Middleware to remove course reference from instructor when deleted
CourseSchema.post('remove', async function (doc) {
  await mongoose.model('Instructor').findByIdAndUpdate(
    doc.instructor,
    { $pull: { courses: doc._id } }
  );
});

module.exports = mongoose.model('Course', CourseSchema);