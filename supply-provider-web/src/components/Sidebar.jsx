export default function Sidebar({ page, setPage, listingsCount, requestsCount }) {export default function Sidebar({ page, setPage, listingsCount, requestsCount }) {export default function Sidebar({ page, setPage, listingsCount, requestsCount }) {const NAV = [


























}    )        </div>            </div>                <span className="nav-badge urgent">{requestsCount}</span>                <span className="nav-icon">🔔</span> Requests            <div className={`nav-item ${page === 'requests' ? 'active' : ''}`} onClick={() => setPage('requests')}>            </div>                <span className="nav-badge">{listingsCount}</span>                <span className="nav-icon">📋</span> Listings            <div className={`nav-item ${page === 'listings' ? 'active' : ''}`} onClick={() => setPage('listings')}>            </div>                <span className="nav-icon">🏠</span> Dashboard            <div className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>            <div className="nav-section-label">Navigation</div>            </div>                <div className="provider-status">⬤ Live inventory sync enabled</div>                <div className="provider-name">Golden Crust Bakery</div>            <div className="provider-info">        <div className="sidebar">    return (





























}    )        </div>            </div>                <span className="nav-badge urgent">{requestsCount}</span>                <span className="nav-icon">🔔</span> Requests            <div className={`nav-item ${page === 'requests' ? 'active' : ''}`} onClick={() => setPage('requests')}>            </div>                <span className="nav-badge">{listingsCount}</span>                <span className="nav-icon">📋</span> Listings            <div className={`nav-item ${page === 'listings' ? 'active' : ''}`} onClick={() => setPage('listings')}>            </div>                <span className="nav-icon">➕</span> Add Food            <div className={`nav-item ${page === 'add' ? 'active' : ''}`} onClick={() => setPage('add')}>            </div>                <span className="nav-icon">🏠</span> Dashboard            <div className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>            <div className="nav-section-label">Navigation</div>            </div>                <div className="provider-status">⬤ Live inventory sync enabled</div>                <div className="provider-name">Golden Crust Bakery</div>            <div className="provider-info">        <div className="sidebar">    return (
























}    )        </div>            </div>                <span className="nav-badge urgent">{requestsCount}</span>                <span className="nav-icon">🔔</span> Requests            <div className={`nav-item ${page === 'requests' ? 'active' : ''}`} onClick={() => setPage('requests')}>            </div>                <span className="nav-badge">{listingsCount}</span>                <span className="nav-icon">📋</span> Listings            <div className={`nav-item ${page === 'listings' ? 'active' : ''}`} onClick={() => setPage('listings')}>            </div>                <span className="nav-icon">➕</span> Add Food            <div className={`nav-item ${page === 'add' ? 'active' : ''}`} onClick={() => setPage('add')}>            </div>                <span className="nav-icon">🏠</span> Dashboard            <div className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>            <div className="nav-section-label">Navigation</div>            </div>                <div className="provider-status">⬤ Live inventory sync enabled</div>                <div className="provider-name">Golden Crust Bakery</div>            <div className="provider-info">        <div className="sidebar">    return (    { key: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { key: 'addFood', icon: '➕', label: 'Add Food' },
    { key: 'listings', icon: '🍱', label: 'Listings' },
    { key: 'requests', icon: '📩', label: 'Requests' },
]

export default function Sidebar({ page, onPageChange }) {
    return (
        <aside className="sidebar">
            <div>
                <div className="sidebar-logo">
                    <div className="logo-icon">🔗</div>
                    <div>
                        <h1>Left2Lift</h1>
                        <div className="role-badge">PROVIDER DASHBOARD</div>
                    </div>
                </div>
                <div className="nav-section-label">Navigation</div>
                <nav className="sidebar-nav">
                    {NAV.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={`nav-item${page === item.key ? ' active' : ''}`}
                            onClick={() => onPageChange(item.key)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="sidebar-footer">
                <div className="provider-name">Golden Crust Bakery</div>
                <div>Live inventory sync enabled</div>
            </div>
        </aside>
    )
}
