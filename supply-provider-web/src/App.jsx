import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import AddFood from './pages/AddFood'
import Analytics from './pages/Analytics'
import MyListings from './pages/MyListings'
import Sidebar from './components/Sidebar'
import { getSessionUser, signOut } from './lib/api'

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true
        ;(async () => {
            try {
                const sessionUser = await getSessionUser()
                if (active) setUser(sessionUser)
            } catch (err) {
                console.error(err)
            } finally {
                if (active) setLoading(false)
            }
        })()

        return () => {
            active = false
        }
    }, [])

    const login = (userData) => {
        setUser(userData)
    }

    const logout = async () => {
        await signOut()
        setUser(null)
    }

    if (loading) {
        return (
            <div className="auth-page">
                <div className="loading"><div className="spinner" /> Checking session...</div>
            </div>
        )
    }

    if (!user) return <AuthPage onLogin={login} />

    return (
        <BrowserRouter>
            <div className="app-layout">
                <Sidebar user={user} onLogout={logout} />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard user={user} />} />
                        <Route path="/add-food" element={<AddFood user={user} />} />
                        <Route path="/listings" element={<MyListings user={user} />} />
                        <Route path="/analytics" element={<Analytics user={user} />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}
