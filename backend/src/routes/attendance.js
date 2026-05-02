const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  markAttendance, getAttendance, getStudentReport, getAnalytics, updateAttendance
} = require('../controllers/attendanceController');

router.use(protect);

router.post('/', markAttendance);
router.get('/', getAttendance);
router.get('/analytics', getAnalytics);
router.get('/report/:studentId', getStudentReport);
router.put('/:id', updateAttendance);

module.exports = router;
