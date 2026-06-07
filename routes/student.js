import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import pool from '../config/database.js'

const router = express.Router()

// Enroll current student in a course (body: { course_name })
router.post('/enroll', authenticate, authorize(['student']), async (req, res) => {
  const userId = req.user.id
  const { course_name } = req.body
  if (!course_name) return res.status(400).json({ error: 'Missing course_name' })
  try {
    if (pool.client === 'pg') {
      await pool.query('INSERT INTO enrollments (user_id, course_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, course_name])
    } else {
      await pool.query('INSERT OR IGNORE INTO enrollments (user_id, course_name) VALUES ($1,$2)', [userId, course_name])
    }
    res.json({ message: 'Enrolled' })
  } catch (e) {
    console.error('Enroll error', e)
    res.status(500).json({ error: 'Enroll failed' })
  }
})

// Get classrooms that match student's enrolled courses
router.get('/my/classrooms', authenticate, authorize(['student']), async (req, res) => {
  try {
    const userId = req.user.id
    const rows = await pool.query('SELECT course_name FROM enrollments WHERE user_id = $1', [userId])
    const courses = (rows.rows || rows).map(r => r.course_name)
    if (!courses || courses.length === 0) return res.json([])
    // return classrooms that have schedules for these courses, and include the next schedule (course + start/end)
    const placeholders = courses.map((_,i) => `$${i+1}`).join(',')
    if (pool.client === 'pg') {
      const sql = `
        SELECT DISTINCT c.*, 
          (SELECT cs2.course_name FROM classroom_schedules cs2 WHERE cs2.classroom_id = c.id AND cs2.course_name IN (${placeholders}) AND cs2.start_time >= NOW() ORDER BY cs2.start_time LIMIT 1) AS next_course_name,
          (SELECT cs2.start_time FROM classroom_schedules cs2 WHERE cs2.classroom_id = c.id AND cs2.course_name IN (${placeholders}) AND cs2.start_time >= NOW() ORDER BY cs2.start_time LIMIT 1) AS next_start_time,
          (SELECT cs2.end_time FROM classroom_schedules cs2 WHERE cs2.classroom_id = c.id AND cs2.course_name IN (${placeholders}) AND cs2.start_time >= NOW() ORDER BY cs2.start_time LIMIT 1) AS next_end_time
        FROM classrooms c
        WHERE EXISTS (SELECT 1 FROM classroom_schedules cs WHERE cs.classroom_id = c.id AND cs.course_name IN (${placeholders}))
      `;
      const result = await pool.query(sql, [...courses, ...courses, ...courses])
      res.json(result.rows || result)
    } else {
      // SQLite uses DATETIME('now')
      const sql = `
        SELECT DISTINCT c.*, 
          (SELECT cs2.course_name FROM classroom_schedules cs2 WHERE cs2.classroom_id = c.id AND cs2.course_name IN (${placeholders}) AND DATETIME(cs2.start_time) >= DATETIME('now') ORDER BY DATETIME(cs2.start_time) LIMIT 1) AS next_course_name,
          (SELECT cs2.start_time FROM classroom_schedules cs2 WHERE cs2.classroom_id = c.id AND cs2.course_name IN (${placeholders}) AND DATETIME(cs2.start_time) >= DATETIME('now') ORDER BY DATETIME(cs2.start_time) LIMIT 1) AS next_start_time,
          (SELECT cs2.end_time FROM classroom_schedules cs2 WHERE cs2.classroom_id = c.id AND cs2.course_name IN (${placeholders}) AND DATETIME(cs2.start_time) >= DATETIME('now') ORDER BY DATETIME(cs2.start_time) LIMIT 1) AS next_end_time
        FROM classrooms c
        WHERE EXISTS (SELECT 1 FROM classroom_schedules cs WHERE cs.classroom_id = c.id AND cs.course_name IN (${placeholders}))
      `;
      const result = await pool.query(sql, [...courses, ...courses, ...courses])
      res.json(result.rows || result)
    }
  } catch (e) {
    console.error('my classrooms error', e)
    res.status(500).json({ error: 'Failed' })
  }
})

// Return enrollments for the current student
router.get('/enrollments', authenticate, authorize(['student']), async (req, res) => {
  try {
    const userId = req.user.id
    const rows = await pool.query('SELECT id, user_id, course_name FROM enrollments WHERE user_id = $1', [userId])
    const enrollments = (rows.rows || rows)
    res.json(enrollments)
  } catch (e) {
    console.error('enrollments error', e)
    res.status(500).json({ error: 'Failed' })
  }
})

export default router

