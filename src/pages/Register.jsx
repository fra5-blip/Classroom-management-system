import React, { useState } from 'react'
import api from '../utils/api'

export default function Register({ onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [program, setProgram] = useState('Software Engineering')
  const [year, setYear] = useState(3)
  const [semester, setSemester] = useState(2)
  const [courses, setCourses] = useState([''])
  const [department, setDepartment] = useState('IT')
  const [primaryCourse, setPrimaryCourse] = useState('Full Stack')
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    // client-side validation
    if (!name || name.trim().length === 0) return setMsg('Name is required')
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setMsg('Valid email required')
    if (!password || password.length < 6) return setMsg('Password must be at least 6 characters')
    if (role === 'student') {
      const filled = courses.map(c => (c||'').trim()).filter(Boolean)
      if (filled.length === 0) return setMsg('Students must select at least one course')
      if (filled.length > 9) return setMsg('You can select up to 9 courses')
    }
    try {
      const payload = { name, email, password, role }
      if (role === 'student') Object.assign(payload, { program, year, semester })
      if (role === 'student') Object.assign(payload, { courses: courses.map(c => c.trim()).filter(Boolean) })
      if (role === 'lecturer') Object.assign(payload, { department, primary_course: primaryCourse })
      const res = await api.post('/auth/register', payload)
      setMsg('Registered')
      // store auth token and user if returned
      if (res.token) localStorage.setItem('token', res.token)
      if (res.user) localStorage.setItem('user', JSON.stringify(res.user))
      onSuccess && onSuccess()
    } catch (err) {
      setMsg(err?.message || 'Registration failed')
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-xl font-medium mb-4">Register</h2>
      {msg && <div className="mb-2 text-sm text-red-500">{msg}</div>}
      <div className="mb-3 text-left">
        <label className="block text-sm mb-1">Name</label>
        <input className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mb-3 text-left">
        <label className="block text-sm mb-1">Email</label>
        <input className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="mb-3 text-left">
        <label className="block text-sm mb-1">Password</label>
        <input className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="mb-4 text-left">
        <label className="block text-sm mb-1">Role</label>
        <select className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
        </select>
      </div>

      {role === 'student' && (
        <>
          <div className="mb-3 text-left">
            <label className="block text-sm mb-1">Program</label>
            <select value={program} onChange={(e) => setProgram(e.target.value)} className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700">
              <optgroup label="IT">
                <option>Software Engineering</option>
                <option>Cyber Security</option>
                <option>Computer Science</option>
              </optgroup>
              <optgroup label="Engineering">
                <option>Telecommunication</option>
                <option>Electrical and Electronics</option>
              </optgroup>
            </select>
          </div>
          <div className="mb-3 text-left grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700">
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Semester</label>
              <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700">
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>
          <div className="mb-3 text-left">
            <label className="block text-sm mb-1">Courses (1–9)</label>
            <div className="space-y-2">
              {courses.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input value={c} onChange={e => setCourses(cs => cs.map((v,i) => i===idx?e.target.value:v))} className="flex-1 border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" />
                  <button type="button" onClick={() => setCourses(cs => cs.filter((_,i) => i!==idx))} className="px-3 py-2 bg-red-500 text-white rounded">−</button>
                </div>
              ))}
              <div>
                <button type="button" onClick={() => setCourses(cs => cs.length < 9 ? [...cs, ''] : cs)} className="mt-2 px-3 py-2 bg-green-500 text-white rounded">Add course</button>
              </div>
            </div>
          </div>
        </>
      )}

      {role === 'lecturer' && (
        <>
          <div className="mb-3 text-left">
            <label className="block text-sm mb-1">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700">
              <option>IT</option>
              <option>Engineering</option>
              <option>Business</option>
            </select>
          </div>
          <div className="mb-3 text-left">
            <label className="block text-sm mb-1">Primary Course</label>
            <input className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" value={primaryCourse} onChange={(e) => setPrimaryCourse(e.target.value)} />
          </div>
        </>
      )}

      <button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white py-2 rounded hover:opacity-95" type="submit">Register</button>
    </form>
  )
}
