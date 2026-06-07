import pool from './database.js';

export const initializeTables = async () => {
  try {
    if (pool.client === 'pg') {
      // Postgres-compatible schema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('lecturer', 'student', 'admin')),
          program VARCHAR(100),
          year INT,
          semester INT,
          department VARCHAR(100),
          primary_course VARCHAR(200),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS classrooms (
          id SERIAL PRIMARY KEY,
          room_name VARCHAR(50) UNIQUE NOT NULL,
          building VARCHAR(100),
          floor INT,
          capacity INT NOT NULL,
          has_projector BOOLEAN DEFAULT false,
          has_whiteboard BOOLEAN DEFAULT true,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS classroom_schedules (
          id SERIAL PRIMARY KEY,
          classroom_id INT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
          lecturer_id INT REFERENCES users(id) ON DELETE SET NULL,
          course_name VARCHAR(200) NOT NULL,
          course_code VARCHAR(20),
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          day_of_week VARCHAR(10),
          is_recurring BOOLEAN DEFAULT false,
          recurring_end_date DATE,
          status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT no_overlap CHECK (start_time < end_time)
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_name VARCHAR(200) NOT NULL,
          UNIQUE(user_id, course_name)
        )
      `);

      await pool.query(`
        CREATE OR REPLACE VIEW classroom_availability AS
        SELECT 
          c.id,
          c.room_name,
          c.building,
          c.floor,
          c.capacity,
          c.has_projector,
          c.has_whiteboard,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM classroom_schedules 
              WHERE classroom_id = c.id 
              AND status != 'cancelled'
              AND NOW() BETWEEN start_time AND end_time
            ) THEN 'occupied'
            ELSE 'available'
          END as status
        FROM classrooms c
      `);
    } else {
      // SQLite-compatible schema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          program TEXT,
          year INTEGER,
          semester INTEGER,
          department TEXT,
          primary_course TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // For existing databases, try to add missing columns (safe to run repeatedly)
      try {
        if (pool.client === 'pg') {
          await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS program VARCHAR(100)")
          await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS year INT")
          await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)")
          await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_course VARCHAR(200)")
        } else {
          // sqlite: ALTER TABLE ADD COLUMN will fail if exists; catch errors
          try { await pool.query("ALTER TABLE users ADD COLUMN program TEXT") } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN year INTEGER") } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN semester INTEGER") } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN department TEXT") } catch (e) {}
          try { await pool.query("ALTER TABLE users ADD COLUMN primary_course TEXT") } catch (e) {}
        }
      } catch (e) {
        console.error('Error ensuring user columns exist', e)
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS classrooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_name TEXT UNIQUE NOT NULL,
          building TEXT,
          floor INTEGER,
          capacity INTEGER NOT NULL,
          has_projector INTEGER DEFAULT 0,
          has_whiteboard INTEGER DEFAULT 1,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS classroom_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          classroom_id INTEGER NOT NULL,
          lecturer_id INTEGER,
          course_name TEXT NOT NULL,
          course_code TEXT,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          day_of_week TEXT,
          is_recurring INTEGER DEFAULT 0,
          recurring_end_date DATE,
          status TEXT DEFAULT 'scheduled',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          course_name TEXT NOT NULL,
          UNIQUE(user_id, course_name)
        )
      `);

      // Create simple availability view compatible with SQLite
      await pool.query(`
        CREATE VIEW IF NOT EXISTS classroom_availability AS
        SELECT 
          c.id,
          c.room_name,
          c.building,
          c.floor,
          c.capacity,
          c.has_projector,
          c.has_whiteboard,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM classroom_schedules cs
              WHERE classroom_id = c.id
              AND status != 'cancelled'
              AND DATETIME('now') BETWEEN start_time AND end_time
            ) THEN 'occupied'
            ELSE 'available'
          END as status
        FROM classrooms c
      `);
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
};
