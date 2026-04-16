export default function SidebarClean({ page, setPage, listingsCount, requestsCount, providerName = 'Provider' }) {
    return (
        <div className="sidebar">
            <div className="provider-info">
                <div className="provider-name">{providerName}</div>
                <div className="provider-status">⬤ Live inventory sync enabled</div>
            </div>

            <div className="nav-section-label">Navigation</div>

            <div className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
                <span className="nav-icon">🏠</span> Dashboard
            </div>

            <div className={`nav-item ${page === 'listings' ? 'active' : ''}`} onClick={() => setPage('listings')}>
                <span className="nav-icon">📋</span> Listings
                <span className="nav-badge">{listingsCount}</span>
            </div>

            <div className={`nav-item ${page === 'requests' ? 'active' : ''}`} onClick={() => setPage('requests')}>
                <span className="nav-icon">🔔</span> Requests
                <span className="nav-badge urgent">{requestsCount}</span>
            </div>
        </div>
    )
}
