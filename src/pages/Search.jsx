import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import styles from './Search.module.css'

const NEIGHBORHOODS = ['Brickell','Coral Gables','Miami Beach','Wynwood','Kendall','Doral','Coconut Grove']
const LANGUAGES     = ['English','Spanish','French','French Creole','Portuguese','Mandarin']
const INSURANCES    = ['BCBS','Aetna','Cigna','UnitedHealth','Humana']
const COLORS        = ['#0891b2','#7c3aed','#059669','#d97706','#db2777','#0284c7']

function avatarColor(name) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function initials(first, last) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
}

function StarRating({ avg, count }) {
  const full = Math.round(avg)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
      <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <strong>{Number(avg).toFixed(1)}</strong>
      <span style={{ color: 'var(--muted)' }}>({count})</span>
    </span>
  )
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()

  const [doctors,  setDoctors]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [specialties, setSpecialties] = useState([])

  // Filter state (controlled)
  const [filters, setFilters] = useState({
    specialty:    params.get('specialty')    || '',
    neighborhood: params.get('neighborhood') || '',
    language:     params.get('language')     || '',
    insurance:    params.get('insurance')    || '',
    consult_type: params.get('consult_type') || '',
    sort:         params.get('sort')         || 'rating',
  })

  useEffect(() => { api.specialties.list().then(setSpecialties).catch(() => {}) }, [])

  const fetchDoctors = useCallback(async (f) => {
    setLoading(true); setError('')
    try {
      const res = await api.doctors.search(Object.fromEntries(Object.entries(f).filter(([,v]) => v)))
      setDoctors(res.doctors)
      setTotal(res.total)
    } catch (e) {
      setError(e.message || 'Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDoctors(filters) }, [filters, fetchDoctors])

  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  return (
    <div className={styles.layout}>
      {/* ── Filters sidebar ────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.filterTitle}>Specialty</div>
        <select className="form-control" value={filters.specialty} onChange={e => set('specialty', e.target.value)}>
          <option value="">All specialties</option>
          {specialties.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>

        <div className={styles.filterTitle}>Neighborhood</div>
        <select className="form-control" value={filters.neighborhood} onChange={e => set('neighborhood', e.target.value)}>
          <option value="">All Miami</option>
          {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className={styles.filterTitle}>Language</div>
        <div className={styles.chipGroup}>
          {LANGUAGES.map(l => (
            <button
              key={l}
              className={`${styles.chip} ${filters.language === l ? styles.chipActive : ''}`}
              onClick={() => set('language', filters.language === l ? '' : l)}
            >{l}</button>
          ))}
        </div>

        <div className={styles.filterTitle}>Insurance</div>
        <div className={styles.chipGroup}>
          {INSURANCES.map(i => (
            <button
              key={i}
              className={`${styles.chip} ${filters.insurance === i ? styles.chipActive : ''}`}
              onClick={() => set('insurance', filters.insurance === i ? '' : i)}
            >{i}</button>
          ))}
        </div>

        <div className={styles.filterTitle}>Consultation type</div>
        <div className={styles.chipGroup}>
          {[['', 'All'], ['in_person', 'In-person'], ['teleconsult', 'Teleconsult']].map(([v, l]) => (
            <button
              key={v}
              className={`${styles.chip} ${filters.consult_type === v ? styles.chipActive : ''}`}
              onClick={() => set('consult_type', v)}
            >{l}</button>
          ))}
        </div>

        <button className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}
          onClick={() => setFilters({ specialty:'',neighborhood:'',language:'',insurance:'',consult_type:'',sort:'rating' })}>
          Clear filters
        </button>
      </aside>

      {/* ── Results ────────────────────────────────────── */}
      <div className={styles.results}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsCount}>
            {loading ? 'Searching…' : <><strong>{total}</strong> doctors found in Miami</>}
          </div>
          <select className="form-control" style={{ width: 'auto' }}
            value={filters.sort} onChange={e => set('sort', e.target.value)}>
            <option value="rating">Best rated</option>
            <option value="availability">Soonest available</option>
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="spinner" />
        ) : doctors.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>No doctors found</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Try adjusting your filters</div>
          </div>
        ) : (
          <div className="fade-up">
            {doctors.map(doc => (
              <DoctorCard key={doc.id} doc={doc} onBook={() => nav(`/doctors/${doc.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DoctorCard({ doc, onBook }) {
  const color = avatarColor(doc.first_name + doc.last_name)

  return (
    <div className={styles.docCard} onClick={onBook}>
      <div className="avatar" style={{ width: 72, height: 72, fontSize: 22, background: color }}>
        {initials(doc.first_name, doc.last_name)}
      </div>

      <div className={styles.docInfo}>
        <div className={styles.docName}>Dr. {doc.first_name} {doc.last_name}</div>
        <div className={styles.docSpecialty}>{doc.specialty_icon} {doc.specialty}</div>
        <div className={styles.docLocation}>📍 {doc.address}, {doc.neighborhood}</div>

        <div className={styles.tagRow}>
          {doc.insurances?.slice(0,3).map(i => <span key={i} className="badge badge-gray">{i}</span>)}
          {doc.languages?.slice(0,2).map(l => <span key={l} className="badge badge-gray">{l}</span>)}
          {doc.is_accepting_new && <span className="badge badge-green">✓ New patients</span>}
          {doc.consult_type !== 'in_person' && <span className="badge badge-coral">📱 Teleconsult</span>}
        </div>

        {doc.rating_count > 0 && (
          <StarRating avg={doc.rating_avg} count={doc.rating_count} />
        )}
      </div>

      <div className={styles.docRight}>
        <div className={styles.fee}>${doc.consultation_fee}</div>
        <div className={styles.feeLabel}>per visit</div>
        <button className="btn btn-primary" style={{ marginTop: 8, fontSize: 13 }}
          onClick={e => { e.stopPropagation(); onBook() }}>
          Book →
        </button>
      </div>
    </div>
  )
}
