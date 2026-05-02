const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by (teacher) is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: [true, 'Status is required'],
    default: 'present'
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    trim: true,
    default: 'A'
  },
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters'],
    default: ''
  }
}, { timestamps: true });

// Compound index to prevent duplicate attendance (same student, same date, same subject)
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
