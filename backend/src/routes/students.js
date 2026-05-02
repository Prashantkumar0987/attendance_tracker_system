const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent, getClasses
} = require('../controllers/studentController');

router.use(protect);

router.get('/classes', getClasses);
router.get('/', getStudents);
router.get('/:id', getStudent);
router.post('/', authorize('admin', 'teacher'), createStudent);
router.put('/:id', authorize('admin', 'teacher'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);

module.exports = router;
