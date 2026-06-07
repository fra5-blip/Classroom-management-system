import pool from '../config/database.js';

export const findByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return (res.rows && res.rows[0]) || (res && res[0]) || null;
};

export const createUser = async ({ name, email, password, role, program = null, year = null, semester = null, department = null, primary_course = null }) => {
  // Insert user; some adapters (e.g., SQLite) may not support RETURNING,
  // so insert then select by email to return the created row.
  const cols = ['name','email','password','role']
  const vals = [name, email, password, role]
  if (program !== null) { cols.push('program'); vals.push(program) }
  if (year !== null) { cols.push('year'); vals.push(year) }
  if (semester !== null) { cols.push('semester'); vals.push(semester) }
  if (department !== null) { cols.push('department'); vals.push(department) }
  if (primary_course !== null) { cols.push('primary_course'); vals.push(primary_course) }

  const placeholders = vals.map((_,i) => `$${i+1}`).join(',')
  const sql = `INSERT INTO users (${cols.join(',')}) VALUES (${placeholders})`;
  await pool.query(sql, vals);

  const res = await pool.query('SELECT id, name, email, role, program, year, semester, department, primary_course FROM users WHERE email = $1', [email]);
  return (res.rows && res.rows[0]) || (res && res[0]) || null;
};

export const findById = async (id) => {
  const res = await pool.query('SELECT id, name, email, role, program, year, semester, department, primary_course FROM users WHERE id = $1', [id]);
  return (res.rows && res.rows[0]) || (res && res[0]) || null;
};
