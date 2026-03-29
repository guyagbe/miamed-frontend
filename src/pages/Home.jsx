import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import styles from './Home.module.css'

const NEIGHBORHOODS = ['Brickell','Coral Gables','Miami Beach','Wynwood','Kendall','Doral','Coconut Grove']

export default function Home() {
  const [specialties, setSpecialties] = useState([])
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation]   = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.specialties.list().then(setSpecialties).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (specialty) params.set('specialty', specialty)
    if (location)  params.set('neighborhood', location)
    nav(`/search?${params}`)
  }

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}>✦ Miami's #1 healthcare booking platform</div>
        <h1 className={styles.heroTitle}>
          Find a doctor,<br /><em>book in seconds.</em>
        </h1>
        <p className={styles.heroSub}>
          Over 1,400 verified healthcare professionals across Miami-Dade, Broward & Palm Beach.
          No phone calls. No hold music.
        </p>

        <form className={styles.searchBar} onSubmit={handleSearch}>
          <select
            className={styles.searchSelect}
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
          >
            <option value="">All specialties</option>
            {specialties.map(s => (
              <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
            ))}
          </select>
          <select
            className={styles.searchSelect}
            value={location}
            onChange={e => setLocation(e.target.value)}
          >
            <option value="">All Miami</option>
            {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
            Search doctors →
          </button>
        </form>
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className={styles.stats}>
        {[
          { num: '1,400+', label: 'Verified doctors' },
          { num: '48h',    label: 'Avg. wait time' },
          { num: '95k+',   label: 'Appointments booked' },
          { num: '4.8★',   label: 'Patient satisfaction' },
        ].map(s => (
          <div key={s.label} className={styles.statItem}>
            <div className={styles.statNum}>{s.num}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Specialties ──────────────────────────────────── */}
      <div className="page">
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Browse by specialty</div>
          <div className="section-sub">Real-time availability from your live backend</div>
        </div>

        <div className={styles.specialtyGrid}>
          {specialties.map(s => (
            <div
              key={s.slug}
              className={styles.specialtyCard}
              onClick={() => nav(`/search?specialty=${s.slug}`)}
            >
              <div className={styles.specIcon}>{s.icon}</div>
              <div className={styles.specName}>{s.name}</div>
              <div className={styles.specCount}>{s.doctor_count} doctors</div>
            </div>
          ))}
        </div>

        {/* ── How it works ─────────────────────────────── */}
        <div className={styles.howSection}>
          <div className="section-title" style={{ textAlign: 'center' }}>How MiaMed works</div>
          <div className={styles.howGrid}>
            {[
              { n: '1', title: 'Search', desc: 'Filter by specialty, language, insurance & neighborhood.' },
              { n: '2', title: 'Choose a slot', desc: 'Pick from real-time availability pulled from your backend.' },
              { n: '3', title: 'Confirmed instantly', desc: 'Get your booking reference. No phone calls needed.' },
            ].map(s => (
              <div key={s.n} className={styles.howStep}>
                <div className={styles.howNum}>{s.n}</div>
                <div className={styles.howTitle}>{s.title}</div>
                <div className={styles.howDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
