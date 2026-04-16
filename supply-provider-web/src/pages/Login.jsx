import { useEffect, useState } from 'react'
import BrandLogo from '../components/BrandLogo'
import { signIn, signUpProvider } from '../lib/api'

const FOOD_SOURCE_OPTIONS = [
    'Weddings and Parties',
    'Restaurants and Cafes',
    'Corporate Offices & Canteens',
    'Caterers & Hotels',
    'Schools & Institutions',
]

const REMEMBER_KEY = 'left2lift_provider_identifier'

export default function Login({ onAuthenticated }) {
    const [mode, setMode] = useState('login')
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    const [username, setUsername] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [source, setSource] = useState(FOOD_SOURCE_OPTIONS[0])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const savedIdentifier = localStorage.getItem(REMEMBER_KEY)
        if (savedIdentifier) {
            setIdentifier(savedIdentifier)
            setRememberMe(true)
        }
    }, [])

    const handleLogin = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            const user = await signIn({ identifier, password })
            if (rememberMe) {
                localStorage.setItem(REMEMBER_KEY, identifier)
            } else {
                localStorage.removeItem(REMEMBER_KEY)
            }
            onAuthenticated?.(user)
        } catch (err) {
            setError(err.message || 'Unable to login. Check phone/username and password.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAccount = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            const user = await signUpProvider({
                name: username,
                username,
                phone: phoneNumber,
                password,
                role: 'provider',
                source_of_food_provider: source,
            })

            onAuthenticated?.(user)
        } catch (err) {
            setError(err.message || 'Unable to create account.')
        } finally {
            setLoading(false)
        }
    }

    const isLogin = mode === 'login'

    return (
        <div className="page active provider-auth-shell">
            <div className="provider-auth-blur-shape provider-auth-shape-1" />
            <div className="provider-auth-blur-shape provider-auth-shape-2" />

            <div className="provider-auth-layout provider-auth-layout-centered">
                <section className="provider-auth-right">
                    <div className="provider-auth-logo-wrap">
                        <BrandLogo size={120} className="provider-auth-logo" title="Provider portal logo" />
                    </div>
                    <div className="provider-auth-card">
                        <div className="provider-auth-header">
                            <h2>{isLogin ? 'Welcome Back to Login' : 'Create New Account'}</h2>
                            <p>{isLogin ? 'Sign in using your phone number or username' : 'Create your new account to start managing food listings'}</p>
                        </div>

                        {isLogin ? (
                            <form onSubmit={handleLogin} className="auth-form provider-auth-form">
                                <div className="form-group">
                                    <label className="form-label provider-auth-label">Phone Number / Username</label>
                                    <div className="provider-auth-input-wrap">
                                        <span className="provider-auth-input-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                                                <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.314 0-6 2.239-6 5v1h12v-1c0-2.761-2.686-5-6-5zM5.5 5h3v2h-3v3h-2V7h-3V5h3V2h2z" />
                                            </svg>
                                        </span>
                                        <input
                                            className="form-input provider-auth-input"
                                            value={identifier}
                                            onChange={(event) => setIdentifier(event.target.value)}
                                            placeholder="e.g. +91 99999 99999 or acmefoods"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label provider-auth-label">Password</label>
                                    <div className="provider-auth-input-wrap">
                                        <span className="provider-auth-input-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                                                <path d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4z" />
                                            </svg>
                                        </span>
                                        <input
                                            className="form-input provider-auth-input provider-auth-input-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="provider-auth-pass-toggle"
                                            onClick={() => setShowPassword((value) => !value)}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div className="provider-auth-row-meta">
                                    <label className="provider-auth-remember">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(event) => setRememberMe(event.target.checked)}
                                        />
                                        <span>Remember me</span>
                                    </label>
                                    <button type="button" className="provider-auth-forgot-link">Forgot password?</button>
                                </div>

                                {error ? (
                                    <div className="provider-auth-alert error">
                                        {error}
                                    </div>
                                ) : null}

                                {message ? (
                                    <div className="provider-auth-alert info">
                                        {message}
                                    </div>
                                ) : null}

                                <button className="btn-submit provider-auth-submit" type="submit" disabled={loading}>
                                    {loading ? (
                                        <span className="provider-auth-loading-inline">
                                            <span className="provider-auth-spinner" />
                                            Signing in...
                                        </span>
                                    ) : 'Login'}
                                </button>

                                <button
                                    type="button"
                                    className="provider-auth-secondary-btn"
                                    onClick={() => {
                                        setMode('signup')
                                        setError('')
                                        setMessage('')
                                    }}
                                >
                                    Create New Account
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateAccount} className="auth-form provider-auth-form">
                                <div className="form-group">
                                    <label className="form-label provider-auth-label">Username</label>
                                    <div className="provider-auth-input-wrap">
                                        <span className="provider-auth-input-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                                                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
                                            </svg>
                                        </span>
                                        <input
                                            className="form-input provider-auth-input"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            placeholder="Choose a username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label provider-auth-label">Phone Number</label>
                                    <div className="provider-auth-input-wrap">
                                        <span className="provider-auth-input-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                                                <path d="M6.62 10.79a15.535 15.535 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.03-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.49a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.03z" />
                                            </svg>
                                        </span>
                                        <input
                                            className="form-input provider-auth-input"
                                            value={phoneNumber}
                                            onChange={(event) => setPhoneNumber(event.target.value)}
                                            placeholder="+91 99999 99999"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label provider-auth-label">Password</label>
                                    <div className="provider-auth-input-wrap">
                                        <span className="provider-auth-input-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                                                <path d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4z" />
                                            </svg>
                                        </span>
                                        <input
                                            className="form-input provider-auth-input provider-auth-input-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Create a secure password"
                                            minLength={6}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="provider-auth-pass-toggle"
                                            onClick={() => setShowPassword((value) => !value)}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label provider-auth-label">Source of Food Providing</label>
                                    <select
                                        className="form-select provider-auth-input"
                                        value={source}
                                        onChange={(event) => setSource(event.target.value)}
                                    >
                                        {FOOD_SOURCE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                {error ? (
                                    <div className="provider-auth-alert error">
                                        {error}
                                    </div>
                                ) : null}

                                {message ? (
                                    <div className="provider-auth-alert info">
                                        {message}
                                    </div>
                                ) : null}

                                <button className="btn-submit provider-auth-submit" type="submit" disabled={loading}>
                                    {loading ? (
                                        <span className="provider-auth-loading-inline">
                                            <span className="provider-auth-spinner" />
                                            Creating account...
                                        </span>
                                    ) : 'Create Account'}
                                </button>

                                <button
                                    type="button"
                                    className="provider-auth-secondary-btn"
                                    onClick={() => {
                                        setMode('login')
                                        setError('')
                                        setMessage('')
                                    }}
                                >
                                    Back to Login
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}