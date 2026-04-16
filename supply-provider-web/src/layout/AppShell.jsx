import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'

export default function AppShell() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [incomingRequests, setIncomingRequests] = useState([])
    const providerId = user?.id

    useRealtimeOrders(providerId, (update) => {
        if (update.type === 'insert') {
            console.log('[AppShell] New incoming request:', update.data)
            setIncomingRequests((prev) => [update.data, ...prev.slice(0, 9)])

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Order Request', {
                    body: `Incoming ${update.data.requester_type} request`,
                    tag: `request-${update.data.id}`,
                })
            }

            try {
                const audio = new Audio('/notification.mp3')
                audio.volume = 0.3
                audio.play().catch(() => {})
            } catch (err) {
                console.log('Could not play notification sound:', err)
            }
        }
    })

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    const handleSignOut = async () => {
        await logout()
        navigate('/auth', { replace: true })
    }

    return (
        <div className="shell">
            <aside className="shell-sidebar glass">
                <h1 className="brand-title">Left2Lift</h1>
                <p className="brand-subtitle">Provider Console</p>
                <nav className="shell-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                    <NavLink to="/listings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Listings</NavLink>
                    <NavLink to="/predictions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>AI Predictions</NavLink>
                </nav>
                <div className="shell-profile">
                    <div className="avatar">{String(user?.name || 'P').slice(0, 1).toUpperCase()}</div>
                    <div>
                        <p className="profile-name">{user?.name || 'Provider'}</p>
                        <p className="profile-role">{user?.role || 'provider'}</p>
                    </div>
                </div>
                <button type="button" className="btn ghost" onClick={handleSignOut}>Sign out</button>
            </aside>
            <main className="shell-main">
                <header className="topbar glass">
                    <div>
                        <h2>Surplus Food Intelligence</h2>
                        <p>Live operations, pricing and donation optimization</p>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    )
}
