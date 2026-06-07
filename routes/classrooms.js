import express from 'express';
import { listClassrooms, getSchedules, createSchedule } from '../controllers/classroomController.js';
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router();

router.get('/', listClassrooms);
router.get('/:id/schedules', getSchedules);
// Only lecturers or admins can create schedules
router.post('/:id/schedules', authenticate, authorize(['lecturer','admin']), createSchedule);

export default router;
