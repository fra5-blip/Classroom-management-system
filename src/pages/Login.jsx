import React, { useState, useCallback, useRef, useEffect } from 'react'
import api from '../utils/api'
import Robot from '../components/Robot'

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [cursor, setCursor] = useState({ x: -9999, y: -9999 })
  const [idle, setIdle] = useState(false)
  const idleTimer = useRef(null)

  const handleMouseMove = useCallback((e) => {
    setCursor({ x: e.clientX, y: e.clientY })
    setIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), 2500)
  }, [])

  useEffect(() => {
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    // simple validation
    if (!email || !password) return setMsg('Email and password are required')
    try {
      const res = await api.post('/auth/login', { email, password })
      setMsg('Login successful')
      localStorage.setItem('token', res.token)
      if (res.user) localStorage.setItem('user', JSON.stringify(res.user))
      // prefer app-level handler, fallback to global navigator or hash
      if (onSuccess) {
        onSuccess()
      } else {
        const u = res.user || (() => { try { return JSON.parse(localStorage.getItem('user')) } catch (e) { return null } })()
        if (u?.role === 'admin') {
          if (window.__navigate) window.__navigate('admin')
          else window.location.hash = '#page=admin'
        } else if (u?.role === 'student') {
          if (window.__navigate) window.__navigate('student')
          else window.location.hash = '#page=student'
        } else {
          if (window.__navigate) window.__navigate('classrooms')
          else window.location.hash = '#page=classrooms'
        }
      }
    } catch (err) {
      setMsg(err?.message || 'Login failed')
    }
  }

  return (
    <div onMouseMove={handleMouseMove} className="relative min-h-[60vh] flex items-center justify-center">
      <Robot target={cursor} idle={idle} />
      <form onSubmit={submit} className="z-10 max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 className="text-xl font-medium mb-4">Login</h2>
      {msg && <div className="mb-2 text-sm text-red-500">{msg}</div>}
      <div className="mb-3 text-left">
        <label className="block text-sm mb-1">Email</label>
        <input className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="mb-4 text-left">
        <label className="block text-sm mb-1">Password</label>
        <input className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-700" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white py-2 rounded hover:opacity-95">Login</button>
      </form>
    </div>
  )
}
