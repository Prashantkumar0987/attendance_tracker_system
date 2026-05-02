const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// @desc    Mark attendance for a class (bulk)
// @route   POST /api/attendance
// @access  Private
const markAttendance = async (req, res) => {
  try {
    const { records, date, class: cls, section, subject } = req.body;
    // records: [{ studentId, status, remarks }]
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance records provided.' });
    }
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = records.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, date: attendanceDate, subject: subject || '' },
        update: {
          $set: {
            studentId: r.studentId,
            markedBy: req.user._id,
            date: attendanceDate,
            status: r.status || 'present',
            class: cls,
            section: section || 'A',
            subject: subject || '',
            remarks: r.remarks || ''
          }
        },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(operations);
    res.status(200).json({ success: true, message: `Attendance marked for ${records.length} students.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance for a class on a date
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { class: cls, section, date, studentId, startDate, endDate, subject } = req.query;
    const query = {};
    if (cls) query.class = cls;
    if (section) query.section = section;
    if (studentId) query.studentId = studentId;
    if (subject) query.subject = subject;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(date);
      dEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: dEnd };
    } else if (startDate && endDate) {
      const s = new Date(startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(endDate); e.setHours(23, 59, 59, 999);
      query.date = { $gte: s, $lte: e };
    }
    const attendance = await Attendance.find(query)
      .populate('studentId', 'name rollNumber email')
      .populate('markedBy', 'name email')
      .sort({ date: -1 });
    res.status(200).json({ success: true, count: attendance.length, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance report for a student
// @route   GET /api/attendance/report/:studentId
// @access  Private
const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const query = { studentId };
    if (startDate && endDate) {
      const s = new Date(startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(endDate); e.setHours(23, 59, 59, 999);
      query.date = { $gte: s, $lte: e };
    }
    const records = await Attendance.find(query).sort({ date: 1 });
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const halfDay = records.filter(r => r.status === 'half-day').length;
    const percentage = total > 0 ? ((present + late * 0.5 + halfDay * 0.5) / total * 100).toFixed(2) : 0;
    const student = await Student.findById(studentId);
    res.status(200).json({
      success: true,
      student,
      summary: { total, present, absent, late, halfDay, percentage: parseFloat(percentage) },
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get class-wide analytics
// @route   GET /api/attendance/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const { class: cls, section, startDate, endDate } = req.query;
    const matchQuery = {};
    if (cls) matchQuery.class = cls;
    if (section) matchQuery.section = section;
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Overall stats
    const overallStats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyTrend = await Attendance.aggregate([
      { $match: { ...matchQuery, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Top absent students
    const topAbsent = await Attendance.aggregate([
      { $match: { ...matchQuery, status: 'absent' } },
      { $group: { _id: '$studentId', absentCount: { $sum: 1 } } },
      { $sort: { absentCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $project: { absentCount: 1, 'student.name': 1, 'student.rollNumber': 1 } }
    ]);

    // Summary totals
    const totalStudents = await Student.countDocuments({ isActive: true, ...(cls && { class: cls }) });
    const totalRecords = await Attendance.countDocuments(matchQuery);

    res.status(200).json({
      success: true,
      totalStudents,
      totalRecords,
      overallStats,
      dailyTrend,
      topAbsent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update single attendance record
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.status(200).json({ success: true, message: 'Attendance updated.', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { markAttendance, getAttendance, getStudentReport, getAnalytics, updateAttendance };
