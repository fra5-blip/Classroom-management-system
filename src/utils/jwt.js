export const decodeJwt = (token) => {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // base64 decode in browser or Node
    let jsonStr
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      jsonStr = decodeURIComponent(Array.prototype.map.call(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
    } else {
      // Node
      jsonStr = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    }
    return JSON.parse(jsonStr)
  } catch (e) {
    return null
  }
}

export default decodeJwt
