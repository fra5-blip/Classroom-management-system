import pool from './database.js'

const seedClassrooms = async () => {
  const rooms = ['room 166', 'ICE1', 'ICE2', 'mainhall', '106']
  if (pool.client === 'pg') {
    for (const name of rooms) {
      await pool.query(
        'INSERT INTO classrooms (room_name, building, floor, capacity) VALUES ($1,$2,$3,$4) ON CONFLICT (room_name) DO NOTHING',
        [name, null, null, 30]
      )
    }
    const res = await pool.query('SELECT id, room_name FROM classrooms WHERE room_name = ANY($1)', [rooms])
    const inserted = res.rows
    if (inserted && inserted.length > 0) {
      const now = new Date()
      const start = new Date(now.getTime() - 30 * 60 * 1000)
      const end = new Date(now.getTime() + 30 * 60 * 1000)
      const fmt = (d) => d.toISOString().replace('T', ' ').replace('Z', '')
      await pool.query(
        'INSERT INTO classroom_schedules (classroom_id, course_name, start_time, end_time, status) VALUES ($1,$2,$3,$4,$5)',
        [inserted[0].id, 'Demo Lecture', fmt(start), fmt(end), 'scheduled']
      )
    }
  } else {
    for (const name of rooms) {
      await pool.query('INSERT OR IGNORE INTO classrooms (room_name, building, floor, capacity) VALUES ($1,$2,$3,$4)', [name, null, null, 30])
    }
    const res = await pool.query('SELECT id, room_name FROM classrooms WHERE room_name IN ($1,$2,$3,$4,$5)', rooms)
    const inserted = res.rows || res
    if (inserted && inserted.length > 0) {
      const now = new Date()
      const start = new Date(now.getTime() - 30 * 60 * 1000)
      const end = new Date(now.getTime() + 30 * 60 * 1000)
      const fmt = (d) => {
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      }
      await pool.query('INSERT INTO classroom_schedules (classroom_id, course_name, start_time, end_time, status) VALUES ($1,$2,$3,$4,$5)', [inserted[0].id, 'Demo Lecture', fmt(start), fmt(end), 'scheduled'])
    }
  }
}

const seedUsersAndEnrollments = async () => {
  const bcryptModule = await import('bcryptjs')
  const bcrypt = bcryptModule.default || bcryptModule
  const hash = await bcrypt.hash('password', 10)
  if (pool.client === 'pg') {
    await pool.query("INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING", ['Admin', 'admin@example.com', hash, 'admin'])
    await pool.query("INSERT INTO users (name,email,password,role,department,primary_course) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING", ['Dr. Smith', 'lecturer@example.com', hash, 'lecturer', 'IT', 'Full Stack'])
    await pool.query("INSERT INTO users (name,email,password,role,program,year,semester) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (email) DO NOTHING", ['Student One', 'student@example.com', hash, 'student', 'Software Engineering', 3, 2])
  } else {
    await pool.query('INSERT OR IGNORE INTO users (name,email,password,role) VALUES ($1,$2,$3,$4)', ['Admin', 'admin@example.com', hash, 'admin'])
    await pool.query('INSERT OR IGNORE INTO users (name,email,password,role,department,primary_course) VALUES ($1,$2,$3,$4,$5,$6)', ['Dr. Smith', 'lecturer@example.com', hash, 'lecturer', 'IT', 'Full Stack'])
    await pool.query('INSERT OR IGNORE INTO users (name,email,password,role,program,year,semester) VALUES ($1,$2,$3,$4,$5,$6,$7)', ['Student One', 'student@example.com', hash, 'student', 'Software Engineering', 3, 2])
  }

  // enroll student in Demo Lecture
  const studentRes = await pool.query('SELECT id FROM users WHERE email = $1', ['student@example.com'])
  const student = (studentRes.rows || studentRes)[0]
  if (student) {
    if (pool.client === 'pg') {
      await pool.query('INSERT INTO enrollments (user_id, course_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [student.id, 'Demo Lecture'])
    } else {
      await pool.query('INSERT OR IGNORE INTO enrollments (user_id, course_name) VALUES ($1,$2)', [student.id, 'Demo Lecture'])
    }
  }
}

export const seedAll = async () => {
  try {
    await seedClassrooms()
    await seedUsersAndEnrollments()
    console.log('Seeding complete')
  } catch (e) {
    console.error('Seeding failed', e)
    throw e
  }
}

export default { seedAll }
