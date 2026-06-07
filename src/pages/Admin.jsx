import React, { useEffect, useState, useRef } from 'react'
import api from '../utils/api'

export default function Admin() {
  const [classrooms, setClassrooms] = useState([])
  const [studentId, setStudentId] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [users, setUsers] = useState([])
  const [lastDeleted, setLastDeleted] = useState(null) // { user, timer }

  const roles = ['student', 'lecturer', 'admin']

  useEffect(() => {
    api.get('/classrooms').then(setClassrooms).catch(console.error)
    api.get('/admin/users').then(setUsers).catch(console.error)
  }, [])

  const enroll = async () => {
    try {
      await api.post('/student/enroll', { student_id: studentId, classroom_id: classroomId })
      alert('Enrolled')
    } catch (e) {
      alert(e.message || 'Failed')
    }
  }

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch (e) { return null } })()

  // Delay deletion to allow undo
  const scheduleDelete = (u) => {
    // remove from UI immediately
    setUsers(prev => prev.filter(x => x.id !== u.id))
    // schedule API call
    const timer = setTimeout(async () => {
      try {
        await api.delete(`/admin/users/${u.id}`)
      } catch (err) {
        console.error('delete failed', err)
        // restore on failure
        setUsers(prev => [...prev, u].sort((a,b)=>a.id-b.id))
      } finally {
        setLastDeleted(null)
      }
    }, 8000)
    setLastDeleted({ user: u, timer })
  }

  const undoDelete = () => {
    if (!lastDeleted) return
    clearTimeout(lastDeleted.timer)
    setUsers(prev => [...prev, lastDeleted.user].sort((a,b)=>a.id-b.id))
    setLastDeleted(null)
  }

  const createUser = async (payload) => {
    try {
      const created = await api.post('/admin/users', payload)
      setUsers(prev => [...prev, created])
      alert('User created')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      <section className="mb-6">
        <h3 className="font-medium">Enroll Student</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="Student ID" className="border px-2 py-1 rounded" />
          <select value={classroomId} onChange={e=>setClassroomId(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">Select classroom</option>
            {classrooms.map(c=> <option key={c.id} value={c.id}>{c.room_name}</option>)}
          </select>
          <button onClick={enroll} className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white px-3 py-2 rounded">Enroll</button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium">Classrooms</h3>
        <ul className="mt-2 space-y-2">
          {classrooms.map(c => (
            <li key={c.id} className="border p-2 rounded bg-gray-50 dark:bg-gray-700">{c.room_name} — {c.status}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-medium mb-2">Users</h3>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
          <CreateUserForm onCreate={createUser} roles={roles} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left"><th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">
                    <select defaultValue={u.role} onChange={async (e) => {
                      const newRole = e.target.value
                      try {
                        await api.patch(`/admin/users/${u.id}/role`, { role: newRole })
                        setUsers(users.map(x => x.id === u.id ? { ...x, role: newRole } : x))
                        alert('Role updated')
                      } catch (err) {
                        console.error(err)
                        alert(err.message || 'Failed')
                      }
                    }} className="border px-2 py-1 rounded">
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button onClick={async () => {
                      if (!confirm(`Reset password for ${u.email}? This will set password to 'password'.`)) return
                      try {
                        await api.post(`/admin/reset-password`, { user_id: u.id })
                        alert('Password reset')
                      } catch (err) {
                        console.error(err)
                        alert('Failed')
                      }
                    }} className="px-2 py-1 bg-gray-200 rounded">Reset Password</button>
                    <button disabled={currentUser && currentUser.id === u.id} onClick={async () => {
                      if (!confirm(`Delete user ${u.email}?`)) return
                      scheduleDelete(u)
                    }} className="px-2 py-1 bg-red-200 text-red-800 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {lastDeleted && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 max-w-md bg-white dark:bg-gray-800 border rounded p-3 shadow">
          <div className="flex items-center justify-between">
            <div className="text-sm">Deleted user <strong>{lastDeleted.user.email}</strong></div>
            <div className="flex gap-2">
              <button onClick={undoDelete} className="px-3 py-1 bg-gray-200 rounded">Undo</button>
              <div className="text-xs text-gray-500">Auto deleting in 8s</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function CreateUserForm({ onCreate, roles }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password')
  const [role, setRole] = useState(roles[0] || 'student')
  const [error, setError] = useState(null)

  const validate = () => {
    if (!name || name.trim().length === 0) return 'Name required'
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Valid email required'
    if (!password || password.length < 6) return 'Password must be >= 6 chars'
    if (!role) return 'Role required'
    return null
  }

  const submit = async () => {
    const v = validate()
    setError(v)
    if (v) return
    await onCreate({ name: name.trim(), email: email.trim(), password, role })
    setName('')
    setEmail('')
    setPassword('password')
    setRole(roles[0] || 'student')
    setError(null)
  }

  return (
    <div className="p-3 border rounded bg-gray-50 dark:bg-gray-800">
      <h4 className="font-medium mb-2">Create user</h4>
      {error && <div className="mb-2 text-sm text-red-500">{error}</div>}
      <input className="w-full mb-2 p-2 border rounded" value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
      <input className="w-full mb-2 p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input className="w-full mb-2 p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
      <select className="w-full mb-2 p-2 border rounded" value={role} onChange={e=>setRole(e.target.value)}>
        {roles.map(r=> <option key={r} value={r}>{r}</option>)}
      </select>
      <button onClick={submit} className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white py-2 rounded">Create</button>
    </div>
  )
}
