import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, createUser } from '../models/userModel.js';
import pool from '../config/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, program, year, semester, department, primary_course } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['lecturer', 'student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // role-specific validation
    if (role === 'student') {
      if (!program || !year || !semester) return res.status(400).json({ error: 'Students must provide program, year and semester' });
    }
    if (role === 'lecturer') {
      if (!department || !primary_course) return res.status(400).json({ error: 'Lecturers must provide department and primary_course' });
    }

    // Check if user exists
    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user with optional fields
    const user = await createUser({ name, email, password: hashedPassword, role, program, year, semester, department, primary_course });

    // If student provided courses array, insert enrollments
    if (role === 'student' && Array.isArray(req.body.courses) && req.body.courses.length > 0) {
      const courses = req.body.courses.slice(0, 9) // limit to 9
      try {
        if (pool.client === 'pg') {
          for (const cName of courses) {
            await pool.query('INSERT INTO enrollments (user_id, course_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, cName])
          }
        } else {
          for (const cName of courses) {
            await pool.query('INSERT OR IGNORE INTO enrollments (user_id, course_name) VALUES ($1,$2)', [user.id, cName])
          }
        }
      } catch (e) {
        console.error('Failed to insert enrollments during registration', e)
      }
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ message: 'User registered successfully', user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
