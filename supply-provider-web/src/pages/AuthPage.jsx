import { useState } from 'react'
import { signIn, signUpProvider } from '../lib/api'

export default function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'consumer', lat: '', lng: ''
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
        <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff5f5', padding: 16 }}>
            <div className="auth-card" style={{ width: '100%', maxWidth: 520, background: '#ffffff', border: '1px solid #fecaca', borderRadius: 14, padding: 24, boxShadow: '0 8px 28px rgba(220, 38, 38, 0.08)' }}>
                <div className="auth-logo">
                    <div className="logo-icon">🔗</div>
                    <h1 style={{ color: '#b91c1c' }}>Left2Lift</h1>
                    <p style={{ color: '#991b1b' }}>Community Dashboard — Reduce Waste, Feed Communities</p>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: 16, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, padding: '10px 12px' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit} id="auth-form">
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label>Login Type</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['consumer', 'ngo'].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => set('role', role)}
                                            style={{
                                                flex: 1,
                                                border: '1px solid #fca5a5',
                                                borderRadius: 8,
                                                padding: '10px 12px',
                                                background: form.role === role ? '#dc2626' : '#ffffff',
                                                color: form.role === role ? '#ffffff' : '#1a1a1a',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {role === 'consumer' ? 'Consumer' : 'NGO'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="auth-name">{form.role === 'ngo' ? 'Organization Name' : 'Name'}</label>
                                <input
                                    id="auth-name" type="text" placeholder={form.role === 'ngo' ? 'e.g. Helping Hands Foundation' : 'e.g. Andrea B'}
                                    value={form.name} onChange={e => set('name', e.target.value)} required
                                    style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', background: '#ffffff' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label htmlFor="auth-lat">Latitude</label>
                                    <input id="auth-lat" type="number" placeholder="12.9716" step="any"
                                        value={form.lat} onChange={e => set('lat', e.target.value)} style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', background: '#ffffff' }} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="auth-lng">Longitude</label>
                                    <input id="auth-lng" type="number" placeholder="77.5946" step="any"
                                        value={form.lng} onChange={e => set('lng', e.target.value)} style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', background: '#ffffff' }} />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label htmlFor="auth-email">Email Address</label>
                        <input id="auth-email" type="email" placeholder="you@restaurant.com"
                            value={form.email} onChange={e => set('email', e.target.value)} required style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', background: '#ffffff' }} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="auth-password">Password</label>
                        <input id="auth-password" type="password" placeholder="••••••••"
                            value={form.password} onChange={e => set('password', e.target.value)} required style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', background: '#ffffff' }} />
                    </div>
                    <button id="auth-submit-btn" className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ width: '100%', background: '#dc2626', color: '#ffffff', border: '1px solid #dc2626', borderRadius: 10, padding: '11px 14px', fontWeight: 700 }}>
                        {loading ? '⏳ Please wait...' : isLogin ? '🚀 Sign In' : '🎉 Create Account'}
                    </button>
                </form>

                <div className="auth-toggle" style={{ marginTop: 16, color: '#7f1d1d' }}>
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button id="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError('') }} style={{ marginLeft: 8, border: 'none', background: 'transparent', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>
                        {isLogin ? 'Register' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    )
}
