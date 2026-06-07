import { useState, useEffect } from 'react'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Classrooms from './pages/Classrooms'
import Admin from './pages/Admin'
import Student from './pages/Student'

function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch (e) { return null }
  })

  const onLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setPage('home')
  }

  // expose a safe global fallback navigator for pages (helps if prop isn't passed)
  useEffect(() => {
    window.__navigate = setPage
    return () => { if (window.__navigate === setPage) delete window.__navigate }
  }, [setPage])

  // Support hash-based fallback navigation: `#page=login` etc.
  useEffect(() => {
    const parseHash = () => {
      try {
        const m = window.location.hash.match(/#page=(\w+)/)
        if (m && m[1]) setPage(m[1])
      } catch (e) {}
    }
    parseHash()
    window.addEventListener('hashchange', parseHash)
    return () => window.removeEventListener('hashchange', parseHash)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <header className="flex flex-wrap gap-3 p-4 justify-center items-center bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 text-white">
        <div className="w-full flex items-center justify-between max-w-4xl mx-auto">
          <div className="font-semibold text-lg">Classroom Manager</div>
          <nav className="flex gap-3">
            <button className="px-3 py-1 rounded border border-white border-opacity-30 hover:bg-white/10" onClick={() => setPage('home')}>Home</button>
            {!user && <button className="px-3 py-1 rounded border border-white border-opacity-30 hover:bg-white/10" onClick={() => setPage('login')}>Login</button>}
            {!user && <button className="px-3 py-1 rounded border border-white border-opacity-30 hover:bg-white/10" onClick={() => setPage('register')}>Register</button>}
            <button className="px-3 py-1 rounded border border-white border-opacity-30 hover:bg-white/10" onClick={() => setPage('classrooms')}>Classrooms</button>
            {user && user.role === 'admin' && <button className="px-3 py-1 rounded border border-white border-opacity-30 hover:bg-white/10" onClick={() => setPage('admin')}>Admin</button>}
            {user && user.role === 'student' && <button className="px-3 py-1 rounded border border-white border-opacity-30 hover:bg-white/10" onClick={() => setPage('student')}>Student</button>}
          </nav>
          <div className="flex items-center gap-3">
            {user && <span className="ml-2 text-sm">Hello, {user.name}</span>}
            {user && <button className="ml-2 px-2 py-1 text-sm bg-white/20 hover:bg-white/30 text-white rounded" onClick={onLogout}>Logout</button>}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {page === 'home' && <Home onNavigate={setPage} />}
        {page === 'login' && <Login onSuccess={() => { const u = JSON.parse(localStorage.getItem('user')); setUser(u); if (u?.role === 'admin') setPage('admin'); else if (u?.role === 'student') setPage('student'); else setPage('classrooms') }} />}
        {page === 'register' && <Register onSuccess={() => { const u = JSON.parse(localStorage.getItem('user')); setUser(u); if (u?.role === 'admin') setPage('admin'); else if (u?.role === 'student') setPage('student'); else setPage('classrooms') }} />}
        {page === 'classrooms' && (
          localStorage.getItem('token') ? (
            <Classrooms />
          ) : (
            <Login onSuccess={() => { const u = JSON.parse(localStorage.getItem('user')); setUser(u); if (u?.role === 'admin') setPage('admin'); else if (u?.role === 'student') setPage('student'); else setPage('classrooms') }} />
          )
        )}
        {page === 'admin' && (
          user && user.role === 'admin' ? <Admin /> : <div className="p-4">Admin access required.</div>
        )}
        {page === 'student' && (
          user && user.role === 'student' ? <Student /> : <div className="p-4">Student access required.</div>
        )}
      </main>
    </div>
  )
}

export default App
