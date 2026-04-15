import { NavLink } from 'react-router-dom'

const NAV = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/add-food', icon: '➕', label: 'Add Food' },
    { to: '/listings', icon: '🍱', label: 'My Listings' },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
]

export default function Sidebar({ user, onLogout }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🔗</div>
                <div>
                    <h1>SupplyLink</h1>
                    <div className="role-badge">PROVIDER PORTAL</div>
                </div>
            </div>

            <div className="nav-section-label">Menu</div>
            {NAV.map((n) => (
                <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === '/'}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-icon">{n.icon}</span>
                    {n.label}
                </NavLink>
            ))}

            <div style={{ marginTop: 'auto' }} />
            <div className="sidebar-footer">
                <div className="provider-name">🍽️ {user?.name || 'Restaurant'}</div>
                <div style={{ fontSize: '0.75rem', marginBottom: '10px', color: 'var(--text2)' }}>
                    {user?.email}
                </div>
                <button
                    id="logout-btn"
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                    onClick={onLogout}
                >
                    🚪 Sign Out
                </button>
            </div>
        </aside>
    )
}
