import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { formatDateTime, isBefore } from '../utils/date'

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([])
  const [selected, setSelected] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [role, setRole] = useState(() => { try { return JSON.parse(localStorage.getItem('user'))?.role } catch (e) { return null } })
  const [courseName, setCourseName] = useState('Demo Lecture')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    const userRole = role
    if (userRole === 'student') {
      api.get('/student/my/classrooms')
        .then(setClassrooms)
        .catch((e) => console.error(e))
    } else {
      api.get('/classrooms')
        .then(setClassrooms)
        .catch((e) => console.error(e))
    }
  }, [role])

  const open = (c) => {
    setSelected(c)
    api.get(`/classrooms/${c.id}/schedules`)
      .then(setSchedules)
      .catch((e) => { console.error(e); setSchedules([]) })
  }

  const book = async (classroomId) => {
    // client-side validation
    if (!courseName || courseName.trim().length === 0) return alert('Course name required')
    if (!startTime || !endTime) return alert('Start and end times are required')
    if (!isBefore(startTime, endTime)) return alert('Start time must be before end time')
    try {
      await api.post(`/classrooms/${classroomId}/schedules`, { course_name: courseName, start_time: startTime, end_time: endTime })
      alert('Booked')
      // refresh
      open(classrooms.find(c=>c.id===classroomId))
      api.get('/classrooms').then(setClassrooms)
    } catch (e) {
      alert(e.message || 'Booking failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 bg-clip-text text-transparent">Classrooms</h2>
      <div className="flex gap-6">
        <div className="w-1/3">
          <ul>
            {classrooms.map(c => (
              <li key={c.id} className="mb-2">
                <button className="text-left w-full px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => open(c)}>{c.room_name} — <span className="text-sm text-gray-500">{c.status}</span></button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-2/3 bg-white dark:bg-gray-800 p-4 rounded shadow">
          {selected ? (
            <div>
              <h3 className="text-xl font-medium">{selected.room_name} — <span className="text-sm text-gray-500">{selected.status}</span></h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Building: {selected.building} • Floor: {selected.floor} • Capacity: {selected.capacity}</p>
              <h4 className="mt-4 font-semibold">Schedules</h4>
              <ul className="mt-2 space-y-2">
                {schedules.length === 0 && <li className="text-sm text-gray-500">No schedules</li>}
                {schedules.map(s => (
                  <li key={s.id} className="text-sm border p-2 rounded bg-gray-50 dark:bg-gray-700">{s.course_name} — {formatDateTime(s.start_time)} to {formatDateTime(s.end_time)} <span className="text-xs text-gray-500">({s.status || 'scheduled'})</span></li>
                ))}
              </ul>
              {/* If lecturer, show booking form for available classrooms */}
              {role === 'lecturer' && selected && selected.status === 'available' && (
                <div className="mt-4">
                  <h5 className="font-medium">Book this classroom</h5>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <input className="border px-2 py-1 rounded" value={courseName} onChange={(e)=>setCourseName(e.target.value)} placeholder="Course name" />
                    <input className="border px-2 py-1 rounded" type="datetime-local" value={startTime} onChange={(e)=>setStartTime(e.target.value)} />
                    <input className="border px-2 py-1 rounded" type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} />
                    <button className="mt-2 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white px-3 py-2 rounded" onClick={()=>book(selected.id)}>Book Classroom</button>
                  </div>
                </div>
              )}
              {/* If student, show enroll option if schedule/course exists */}
              {role === 'student' && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400">Students see classrooms for their enrolled courses.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Select a classroom to view schedules</div>
          )}
        </div>
      </div>
    </div>
  )
}
