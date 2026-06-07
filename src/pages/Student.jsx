import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { formatDateTime } from '../utils/date'

export default function Student() {
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState([])

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch (e) { return null } })()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // student-specific endpoint
        const data = await api.get('/student/my/classrooms')
        setClassrooms(data || [])
        // fetch enrollments separately for display
        try { const e = await api.get('/student/enrollments'); setEnrollments(e || []) } catch (err) { console.error('enrollments fetch', err) }
      } catch (e) {
        console.error(e)
        // fallback
        try { const all = await api.get('/classrooms'); setClassrooms(all || []) } catch (err) { console.error(err) }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const open = async (c) => {
    setSelectedClassroom(c)
    setSelectedSchedule(null)
    try {
      const s = await api.get(`/classrooms/${c.id}/schedules`)
      setSchedules(s || [])
    } catch (e) {
      console.error(e)
      setSchedules([])
    }
  }

  const enroll = async () => {
    if (!user) return alert('Please login as a student')
    try {
      if (!selectedClassroom) return alert('Select a classroom first')
      const schedule = selectedSchedule || schedules[0]
      if (!schedule) return alert('Select a schedule to enroll')
      await api.post('/student/enroll', { classroom_id: selectedClassroom.id, course_name: schedule.course_name })
      alert('Enrolled in ' + schedule.course_name)
    } catch (e) {
      console.error(e)
      alert(e.message || 'Failed')
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Student</h2>
      <div className="mb-4">
        <h4 className="font-medium mb-2">Your Enrollments</h4>
        {enrollments.length === 0 ? <div className="text-sm text-gray-500">No enrolled courses yet.</div> : (
          <ul className="space-y-1">
            {enrollments.map(en => (
              <li key={en.id} className="text-sm">{en.course_name}</li>
            ))}
          </ul>
        )}
      </div>
      {classrooms.length === 0 && <p className="text-sm text-gray-500">You have no enrolled courses yet.</p>}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h4 className="font-medium mb-2">Your Classrooms / Enrolled Courses</h4>
          <ul className="space-y-2">
            {classrooms.map(c => (
              <li key={c.id}>
                <button className="w-full text-left px-3 py-2 border rounded flex flex-col items-start" onClick={() => open(c)}>
                  <span className="font-medium">{c.room_name} — {c.status}</span>
                  {c.next_course_name ? (
                    <span className="text-sm text-gray-600">{c.next_course_name} — {formatDateTime(c.next_start_time)} to {formatDateTime(c.next_end_time)}</span>
                  ) : (
                    <span className="text-sm text-gray-500">No upcoming schedule</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          {selectedClassroom ? (
            <div>
              <h4 className="font-medium">{selectedClassroom.room_name} — Schedules</h4>
              <ul className="mt-2 space-y-2">
                {schedules.length === 0 && <li className="text-sm text-gray-500">No schedules</li>}
                {schedules.map(s => (
                  <li key={s.id} className={`border p-2 rounded bg-gray-50 dark:bg-gray-700 ${selectedSchedule && selectedSchedule.id === s.id ? 'ring-2 ring-indigo-300' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{s.course_name}</div>
                        <div className="text-sm text-gray-600">{formatDateTime(s.start_time)} to {formatDateTime(s.end_time)}</div>
                      </div>
                      <div>
                        <button onClick={() => setSelectedSchedule(s)} className="px-3 py-1 text-sm bg-indigo-500 text-white rounded">Select</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <button onClick={enroll} className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white px-3 py-2 rounded">Enroll in this course</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Select a classroom to view schedules.</div>
          )}
        </div>
      </div>
    </div>
  )
}
