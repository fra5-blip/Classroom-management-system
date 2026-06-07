import jwt from 'jsonwebtoken'
import { findById } from '../models/userModel.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await findById(payload.id)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' })
  if (roles.length === 0 || roles.includes(req.user.role)) return next()
  return res.status(403).json({ error: 'Forbidden' })
}

export default authenticate
