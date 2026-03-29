const BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('miamed_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data })
  }
  return data
}

// ── Auth ──────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    refresh: (refresh_token) => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  },

  // ── Specialties ────────────────────────────────────────
  specialties: {
    list: () => request('/specialties'),
  },

  // ── Doctors ────────────────────────────────────────────
  doctors: {
    search: (params = {}) => {
      const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v))
      return request(`/doctors?${q}`)
    },
    get: (id) => request(`/doctors/${id}`),
    availability: (id, date) => request(`/doctors/${id}/availability?date=${date}`),
    reviews: (id) => request(`/doctors/${id}/reviews`),
  },

  // ── Appointments ───────────────────────────────────────
  appointments: {
    book: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
    list: (params = {}) => {
      const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v))
      return request(`/appointments?${q}`)
    },
    get: (id) => request(`/appointments/${id}`),
    cancel: (id, reason) => request(`/appointments/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  },

  // ── Reviews ────────────────────────────────────────────
  reviews: {
    create: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    mine: () => request('/reviews/me'),
  },
}
