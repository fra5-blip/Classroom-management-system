import React from 'react'

export default function Home() {
  let user = null
  try { user = JSON.parse(localStorage.getItem('user')) } catch (e) { user = null }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "linear-gradient(rgba(4,6,23,0.45), rgba(4,6,23,0.45)), url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md px-6 py-10 bg-white/90 dark:bg-gray-800/85 rounded-xl shadow-lg text-center backdrop-blur-sm">
        <h1 className="text-3xl font-semibold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 bg-clip-text text-transparent">Welcome{user ? `, ${user.name}` : ''}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Classroom management system</p>

        {user && <p className="mt-6 text-sm text-gray-500 dark:text-gray-300">Your role: <strong>{user.role}</strong></p>}
      </div>
    </div>
  )
}
