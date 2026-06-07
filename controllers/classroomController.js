import pool from '../config/database.js';

export const listClassrooms = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classroom_availability');
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error listing classrooms:', err);
    res.status(500).json({ error: 'Failed to list classrooms' });
  }
};

export const getSchedules = async (req, res) => {
  const classroomId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM classroom_schedules WHERE classroom_id = $1 ORDER BY start_time', [classroomId]);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error getting schedules:', err);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
};

export const createSchedule = async (req, res) => {
  const classroomId = req.params.id;
  const { lecturer_id, course_name, course_code, start_time, end_time, day_of_week, is_recurring, recurring_end_date } = req.body;
  // If authenticated, prefer the token's user id as lecturer_id
  const actorId = req.user?.id || lecturer_id || null;
  try {
    await pool.query(
      'INSERT INTO classroom_schedules (classroom_id, lecturer_id, course_name, course_code, start_time, end_time, day_of_week, is_recurring, recurring_end_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [classroomId, actorId, course_name, course_code || null, start_time, end_time, day_of_week || null, is_recurring ? 1 : 0, recurring_end_date || null]
    );
    res.status(201).json({ message: 'Schedule created' });
  } catch (err) {
    console.error('Error creating schedule:', err);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};
