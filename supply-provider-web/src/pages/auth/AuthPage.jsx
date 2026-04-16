import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/AuthContext'
import { signIn, signUpProvider } from '../../lib/api'

const BUSINESS_TYPES = [
    'Weddings and Parties',
    'Restaurants and Cafes',
    'Corporate Offices & Canteens',
    'Caterers & Hotels',
    'Schools & Institutions',
]

export default function AuthPage() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [mode, setMode] = useState('login')
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [businessType, setBusinessType] = useState(BUSINESS_TYPES[1])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isLogin = mode === 'login'

    const onSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        try {
            let user
            if (isLogin) {
                user = await signIn({ identifier, password })
            } else {
                user = await signUpProvider({
                    name: businessName,
                    username: businessName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30),
                    phone,
                    password,
                    role: 'provider',
                    source_of_food_provider: businessType,
                })
            }
            login(user)
            navigate('/dashboard', { replace: true })
        } catch (err) {
            setError(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-card glass">
                <h1>{isLogin ? 'Provider Login' : 'Create Provider Account'}</h1>
                <p>AI-powered surplus management for daily operations.</p>
                <form onSubmit={onSubmit} className="auth-form">
                    {isLogin ? (
                        <label>
                            Phone or Username
                            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                        </label>
                    ) : (
                        <>
                            <label>
                                Phone Number
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9999999999" required />
                            </label>
                            <label>
                                Business Name
                                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                            </label>
                            <label>
                                Business Type
                                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                                    {BUSINESS_TYPES.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}

                    <label>
                        Password
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                    </label>

                    {error ? <div className="alert error">{error}</div> : null}

                    <button type="submit" className="btn primary" disabled={loading}>
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>
                <button type="button" className="btn ghost" onClick={() => setMode(isLogin ? 'signup' : 'login')}>
                    {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
            </div>
        </div>
    )
}
