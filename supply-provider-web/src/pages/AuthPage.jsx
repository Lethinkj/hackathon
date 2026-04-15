import { useState } from 'react'
import { signIn, signUpProvider } from '../lib/api'

export default function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'provider', lat: '', lng: ''
    })

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            const user = isLogin
                ? await signIn({ email: form.email, password: form.password })
                : await signUpProvider({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                    lat: parseFloat(form.lat) || 12.9716,
                    lng: parseFloat(form.lng) || 77.5946,
                    capacity: form.role === 'ngo' ? 20 : null,
                })

            onLogin(user)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon">🔗</div>
                    <h1>SupplyLink</h1>
                    <p>Provider Dashboard — Reduce Waste, Feed Communities</p>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit} id="auth-form">
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label htmlFor="auth-name">Restaurant / Business Name</label>
                                <input
                                    id="auth-name" type="text" placeholder="e.g. The Green Kitchen"
                                    value={form.name} onChange={e => set('name', e.target.value)} required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="auth-role">Role</label>
                                <select id="auth-role" value={form.role} onChange={e => set('role', e.target.value)}>
                                    <option value="provider">Provider (Restaurant)</option>
                                    <option value="consumer">Consumer</option>
                                    <option value="ngo">NGO</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label htmlFor="auth-lat">Latitude</label>
                                    <input id="auth-lat" type="number" placeholder="12.9716" step="any"
                                        value={form.lat} onChange={e => set('lat', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="auth-lng">Longitude</label>
                                    <input id="auth-lng" type="number" placeholder="77.5946" step="any"
                                        value={form.lng} onChange={e => set('lng', e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label htmlFor="auth-email">Email Address</label>
                        <input id="auth-email" type="email" placeholder="you@restaurant.com"
                            value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="auth-password">Password</label>
                        <input id="auth-password" type="password" placeholder="••••••••"
                            value={form.password} onChange={e => set('password', e.target.value)} required />
                    </div>
                    <button id="auth-submit-btn" className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? '⏳ Please wait...' : isLogin ? '🚀 Sign In' : '🎉 Create Account'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button id="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError('') }}>
                        {isLogin ? 'Register' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    )
}
