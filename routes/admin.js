import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

// List users (id, name, email, role)
router.get('/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id')
    return res.json(result.rows || result)
  } catch (e) {
    console.error('admin list users error', e)
    return res.status(500).json({ error: 'Failed to list users' })
  }
})

// Change user role
router.patch('/users/:id/role', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params
  const { role } = req.body
  if (!role) return res.status(400).json({ error: 'Missing role' })
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id])
    const updated = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id])
    return res.json(updated.rows ? updated.rows[0] : updated)
  } catch (e) {
    console.error('admin change role error', e)
    return res.status(500).json({ error: 'Failed to change role' })
  }
})

// Reset a user's password to a default value (admin only)
router.post('/reset-password', authenticate, authorize(['admin']), async (req, res) => {
  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' })
  try {
    const hash = await bcrypt.hash('password', 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user_id])
    return res.json({ message: 'Password reset' })
  } catch (e) {
    console.error('reset password error', e)
    return res.status(500).json({ error: 'Failed to reset password' })
  }
})

// Create a new user (admin only)
router.post('/users', authenticate, authorize(['admin']), async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' })
  try {
    const hash = await bcrypt.hash(password, 10)
    await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', [name, email, hash, role])
    const created = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', [email])
    return res.json(created.rows ? created.rows[0] : created)
  } catch (e) {
    console.error('admin create user error', e)
    return res.status(500).json({ error: 'Failed to create user' })
  }
})

// Delete a user (admin only)
router.delete('/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    return res.json({ message: 'Deleted' })
  } catch (e) {
    console.error('admin delete user error', e)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
