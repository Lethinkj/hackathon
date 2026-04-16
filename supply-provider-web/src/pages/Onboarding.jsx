import { useState } from 'react'
import { saveProviderProfile } from '../lib/api'

export default function Onboarding({ user, onComplete }) {
    const [name, setName] = useState('')
    const [location, setLocation] = useState('')
    const [type, setType] = useState('restaurant')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')

        try {
            const profile = await saveProviderProfile({
                userId: user.id,
                name,
                location,
                type,
            })

            onComplete?.(profile)
        } catch (err) {
            setError(err.message || 'Unable to save onboarding details')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page active provider-onboard-shell">
            <div className="provider-auth-blur-shape provider-auth-shape-1" />
            <div className="provider-auth-blur-shape provider-auth-shape-2" />

            <div className="provider-onboard-wrap">
                <div className="provider-auth-page-title">Left2Lift</div>
                <div className="provider-onboard-card">
                    <div className="provider-onboard-title">Complete Profile</div>
                    <div className="provider-onboard-sub">Add your business details to start managing listings.</div>

                    <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label provider-auth-label">Business Name</label>
                        <input className="form-input provider-auth-input provider-onboard-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Golden Crust Bakery" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label provider-auth-label">Location</label>
                        <input className="form-input provider-auth-input provider-onboard-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Indiranagar, Bengaluru" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label provider-auth-label">Business Type</label>
                        <select className="form-select provider-auth-input provider-onboard-input" value={type} onChange={(event) => setType(event.target.value)}>
                            <option value="restaurant">Restaurant</option>
                            <option value="hotel">Hotel</option>
                            <option value="catering">Catering</option>
                        </select>
                    </div>

                    {error ? (
                        <div className="provider-auth-alert error" style={{ marginBottom: 12 }}>
                            {error}
                        </div>
                    ) : null}

                    <button className="btn-submit provider-auth-submit" type="submit" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Saving...' : 'Continue to Dashboard'}
                    </button>
                </form>
                </div>
            </div>
        </div>
    )
}