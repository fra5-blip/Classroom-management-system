const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

const wrap = async (res) => {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || data.message || 'Request failed')
    err.status = res.status
    throw err
  }
  return res.json().catch(() => ({}))
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const headers = (extra = {}) => ({ 'Content-Type': 'application/json', ...getAuthHeader(), ...extra })

export default {
  get: (path) => fetch(`${API_BASE}${path}`, { headers: headers() }).then(wrap),
  post: (path, body) => fetch(`${API_BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(wrap),
  patch: (path, body) => fetch(`${API_BASE}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(wrap),
  put: (path, body) => fetch(`${API_BASE}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(wrap),
  delete: (path) => fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: headers() }).then(wrap),
}
