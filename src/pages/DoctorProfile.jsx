import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import styles from './DoctorProfile.module.css'

const COLORS = ['#0891b2','#7c3aed','#059669','#d97706','#db2777']
function avatarColor(n) { let h=0; for(const c of n) h=c.charCodeAt(0)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return {
      iso:  d.toISOString().slice(0, 10),
      day:  d.toLocaleDateString('en-US', { weekday: 'short' }),
      num:  d.getDate(),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
    }
  })
}

export default function DoctorProfile() {
  const { id } = useParams()
  const nav    = useNavigate()
  const { user } = useAuth()

  const [doctor,    setDoctor]    = useState(null)
  const [reviews,   setReviews]   = useState([])
  const [slots,     setSlots]     = useState([])
  const [days]                    = useState(getNext7Days)
  const [selDay,    setSelDay]    = useState(days[0].iso)
  const [selSlot,   setSelSlot]   = useState('')
  const [consultT,  setConsultT]  = useState('in_person')
  const [reason,    setReason]    = useState('')
  const [booking,   setBooking]   = useState(false)
  const [booked,    setBooked]    = useState(null)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [slotsLoad, setSlotsLoad] = useState(false)

  useEffect(() => {
    Promise.all([api.doctors.get(id), api.doctors.reviews(id)])
      .then(([doc, rev]) => { setDoctor(doc); setReviews(rev) })
      .catch(() => setError('Doctor not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !selDay) return
    setSlotsLoad(true); setSelSlot('')
    api.doctors.availability(id, selDay)
      .then(res => setSlots(res.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoad(false))
  }, [id, selDay])

  const handleBook = async () => {
    if (!user) { nav('/login?redirect=/doctors/' + id); return }
    if (!selSlot) { setError('Please select a time slot'); return }
    setBooking(true); setError('')
    try {
      const appt = await api.appointments.book({
        doctor_id: id, date: selDay, time: selSlot,
        consult_type: consultT, reason,
      })
      setBooked(appt)
    } catch (e) {
      setError(e.message || 'Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />
  if (!doctor) return <div className="page"><div className="alert alert-error">Doctor not found</div></div>

  const color = avatarColor(doctor.first_name + doctor.last_name)
  const morning   = slots.filter(s => parseInt(s.time) < 12)
  const afternoon = slots.filter(s => parseInt(s.time) >= 12 && parseInt(s.time) < 17)
  const evening   = slots.filter(s => parseInt(s.time) >= 17)

  // ── Booking confirmation screen ──────────────────────────
  if (booked) {
    return (
      <div className={styles.confirmWrap}>
        <div className={styles.confirmIcon}>✓</div>
        <h2 className={styles.confirmTitle}>You're booked!</h2>
        <p className={styles.confirmSub}>
          Your appointment is confirmed. Reference: <strong>{booked.reference_code}</strong>
        </p>
        <div className="card" style={{ maxWidth: 440, margin: '0 auto 1.5rem', textAlign: 'left' }}>
          {[
            ['Doctor', `Dr. ${booked.doctor_first} ${booked.doctor_last}`],
            ['Specialty', booked.specialty],
            ['Date', new Date(booked.appt_date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
            ['Time', booked.start_time?.slice(0,5)],
            ['Type', booked.consult_type === 'in_person' ? 'In-person' : 'Teleconsult'],
            ['Location', booked.address],
          ].map(([k, v]) => (
            <div key={k} className={styles.confirmRow}>
              <span>{k}</span><span>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={() => nav('/search')}>Find another doctor</button>
          <button className="btn btn-primary" onClick={() => nav('/dashboard')}>My appointments →</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      {/* ── Left: Profile ─────────────────────────────── */}
      <div>
        {/* Header card */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className={styles.profileHeader}>
            <div className="avatar" style={{ width: 90, height: 90, fontSize: 28, background: color }}>
              {doctor.first_name[0]}{doctor.last_name[0]}
            </div>
            <div>
              <h1 className={styles.docName}>Dr. {doctor.first_name} {doctor.last_name}, MD</h1>
              <div className={styles.docSpecialty}>{doctor.specialty_icon} {doctor.specialty}</div>
              {doctor.rating_count > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:6, margin:'6px 0', fontSize:13 }}>
                  <span className="stars">{'★'.repeat(Math.round(doctor.rating_avg))}</span>
                  <strong>{Number(doctor.rating_avg).toFixed(1)}</strong>
                  <span style={{ color:'var(--muted)' }}>· {doctor.rating_count} reviews</span>
                </div>
              )}
              <div className={styles.docMeta}>
                📍 {doctor.address}, {doctor.neighborhood}, {doctor.city}<br/>
                🗣 {doctor.languages?.join(', ')}<br/>
                {doctor.consult_type !== 'in_person' && '📱 In-person & Teleconsult'}
                {doctor.is_accepting_new && <span className="badge badge-green" style={{marginLeft:8}}>✓ New patients</span>}
              </div>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div><label>Experience</label><p>{doctor.years_experience} years</p></div>
            <div><label>Medical school</label><p>{doctor.medical_school}</p></div>
            <div><label>Insurance</label><p>{doctor.insurances?.join(', ')}</p></div>
            <div><label>Consultation fee</label><p>${doctor.consultation_fee}</p></div>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className={styles.sectionLabel}>About Dr. {doctor.last_name}</div>
            <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.7 }}>{doctor.bio}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="card">
          <div className={styles.sectionLabel}>Patient reviews ({reviews.length})</div>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No reviews yet — be the first!</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewName}>{r.reviewer_name}</span>
                  <span style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, color:'var(--muted)' }}>
                    <span className="stars">{'★'.repeat(r.rating)}</span>
                    {new Date(r.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' })}
                  </span>
                </div>
                {r.comment && <p className={styles.reviewText}>{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Booking widget ─────────────────────── */}
      <div className={styles.bookingWidget}>
        <h3 className={styles.bookingTitle}>Book an appointment</h3>

        {/* Day picker */}
        <div className={styles.dayTabs}>
          {days.map(d => (
            <button key={d.iso}
              className={`${styles.dayTab} ${selDay === d.iso ? styles.dayTabActive : ''}`}
              onClick={() => setSelDay(d.iso)}>
              <div className={styles.dayLabel}>{d.label}</div>
              <div className={styles.dayNum}>{d.num}</div>
            </button>
          ))}
        </div>

        {/* Consult type */}
        {doctor.consult_type === 'both' && (
          <div style={{ display:'flex', gap:6, marginBottom:'1rem' }}>
            {[['in_person','In-person'],['teleconsult','Teleconsult']].map(([v,l]) => (
              <button key={v}
                className={`${styles.typeBtn} ${consultT === v ? styles.typeBtnActive : ''}`}
                onClick={() => setConsultT(v)}>{l}</button>
            ))}
          </div>
        )}

        {/* Slots */}
        {slotsLoad ? <div className="spinner" style={{ margin:'1rem auto', width:24, height:24 }} /> : (
          <>
            {[['Morning', morning], ['Afternoon', afternoon], ['Evening', evening]]
              .filter(([, s]) => s.length > 0)
              .map(([label, group]) => (
                <div key={label} style={{ marginBottom:'0.75rem' }}>
                  <div className={styles.slotLabel}>{label}</div>
                  <div className={styles.slotGrid}>
                    {group.map(s => (
                      <button key={s.time}
                        className={`slot-btn ${!s.available ? 'unavail' : ''} ${selSlot === s.time ? 'selected' : ''}`}
                        disabled={!s.available}
                        onClick={() => setSelSlot(s.time)}>
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            {slots.length === 0 && (
              <p style={{ fontSize:13, color:'var(--muted)', textAlign:'center', padding:'1rem 0' }}>
                No availability on this day
              </p>
            )}
          </>
        )}

        {/* Reason */}
        <div className="form-group" style={{ marginTop:'0.75rem' }}>
          <label>Reason for visit (optional)</label>
          <input className="form-control" placeholder="e.g. Annual checkup"
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          className="btn btn-primary btn-lg"
          style={{ width:'100%' }}
          disabled={booking || !selSlot}
          onClick={handleBook}>
          {booking ? 'Booking…' : user ? 'Confirm appointment →' : 'Sign in to book →'}
        </button>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:8 }}>
          Free cancellation up to 2 hours before
        </p>
      </div>
    </div>
  )
}
