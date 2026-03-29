import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import styles from './Dashboard.module.css'

const STATUS_COLORS = {
  confirmed:  { bg: '#ecfdf5', color: '#15803d', border: '#bbf7d0' },
  pending:    { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  cancelled:  { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  completed:  { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  no_show:    { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: 50, fontSize: 12, fontWeight: 500,
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [tab, setTab]                   = useState('upcoming')
  const [cancelling, setCancelling]     = useState(null)

  useEffect(() => {
    if (!user) { nav('/login'); return }
    api.appointments.list()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, nav])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    setCancelling(id)
    try {
      await api.appointments.cancel(id, 'Patient requested cancellation')
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    } catch (e) {
      alert(e.message || 'Could not cancel appointment')
    } finally { setCancelling(null) }
  }

  const now = new Date().toISOString().slice(0, 10)
  const upcoming  = appointments.filter(a => a.appt_date >= now && !['cancelled','completed'].includes(a.status))
  const past      = appointments.filter(a => a.appt_date < now  || ['cancelled','completed'].includes(a.status))
  const shown     = tab === 'upcoming' ? upcoming : past

  return (
    <div className="page">
      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My appointments</h1>
          <p className={styles.sub}>Welcome back, {user?.first_name} 👋</p>
        </div>
        <Link to="/search" className="btn btn-primary">+ Book appointment</Link>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total bookings', val: appointments.length },
          { label: 'Upcoming',       val: upcoming.length },
          { label: 'Completed',      val: appointments.filter(a => a.status === 'completed').length },
          { label: 'Cancelled',      val: appointments.filter(a => a.status === 'cancelled').length },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statVal}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'upcoming' ? styles.tabActive : ''}`}
          onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`${styles.tab} ${tab === 'past' ? styles.tabActive : ''}`}
          onClick={() => setTab('past')}>
          Past & cancelled ({past.length})
        </button>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="spinner" /> : shown.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {tab === 'upcoming' ? '📅' : '📋'}
          </div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
          {tab === 'upcoming' && (
            <Link to="/search" className="btn btn-primary" style={{ marginTop: 8 }}>
              Find a doctor →
            </Link>
          )}
        </div>
      ) : (
        <div className="fade-up">
          {shown.map(a => (
            <div key={a.id} className={styles.apptCard}>
              <div className={styles.apptLeft}>
                <div className={styles.apptDate}>
                  <div className={styles.apptDay}>
                    {new Date(a.appt_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={styles.apptNum}>
                    {new Date(a.appt_date + 'T12:00:00').getDate()}
                  </div>
                  <div className={styles.apptMonth}>
                    {new Date(a.appt_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              </div>

              <div className={styles.apptInfo}>
                <div className={styles.apptDoctor}>
                  Dr. {a.doctor_first} {a.doctor_last}
                </div>
                <div className={styles.apptSpecialty}>{a.specialty}</div>
                <div className={styles.apptMeta}>
                  🕐 {a.start_time?.slice(0,5)} &nbsp;·&nbsp;
                  📍 {a.neighborhood || a.address} &nbsp;·&nbsp;
                  {a.consult_type === 'in_person' ? '🏥 In-person' : '📱 Teleconsult'}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
                  Ref: {a.reference_code}
                </div>
              </div>

              <div className={styles.apptRight}>
                <StatusBadge status={a.status} />
                {a.status === 'confirmed' && a.appt_date >= now && (
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: 12, padding: '5px 12px', marginTop: 8 }}
                    disabled={cancelling === a.id}
                    onClick={() => handleCancel(a.id)}>
                    {cancelling === a.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
                {a.status === 'completed' && (
                  <Link to={`/doctors/${a.doctor_id}`}
                    className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px', marginTop: 8 }}>
                    Book again
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
