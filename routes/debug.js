import express from 'express'
import pool from '../config/database.js'

const router = express.Router()

// Only available in non-production
router.get('/status', async (req, res) => {
  try {
    const c = await pool.query('SELECT COUNT(*) as count FROM classrooms')
    const s = await pool.query('SELECT COUNT(*) as count FROM classroom_schedules')
    const u = await pool.query('SELECT COUNT(*) as count FROM users')
    const classrooms = await pool.query('SELECT id, room_name FROM classrooms LIMIT 10')
    return res.json({ classrooms: classrooms.rows || classrooms, counts: { classrooms: (c.rows||c)[0].count, schedules: (s.rows||s)[0].count, users: (u.rows||u)[0].count } })
  } catch (e) {
    console.error('debug status error', e)
    return res.status(500).json({ error: 'Failed' })
  }
})

export default router
