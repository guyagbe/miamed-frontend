import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = async () => {
    await logout()
    nav('/')
  }

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        Mia<span>Med</span>
      </Link>

      <div className={styles.links}>
        <Link to="/search" className={styles.link}>Find a doctor</Link>
        {user ? (
          <>
            <Link to="/dashboard" className={styles.link}>My appointments</Link>
            <div className={styles.userMenu}>
              <div className={styles.avatar}>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <span className={styles.userName}>{user.first_name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.link}>Sign in</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 50 }}>
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
