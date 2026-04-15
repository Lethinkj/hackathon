import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addFoodListing } from '../lib/api'

// Preset quick-add items for speed (hackathon demo)
const PRESETS = [
    { foodName: 'Biryani', type: 'Non-Veg', price: 80, originalPrice: 200 },
    { foodName: 'Paneer Butter Masala', type: 'Veg', price: 60, originalPrice: 150 },
    { foodName: 'Dal Tadka', type: 'Veg', price: 40, originalPrice: 100 },
    { foodName: 'Grilled Chicken', type: 'Non-Veg', price: 100, originalPrice: 250 },
]

export default function AddFood({ user }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    // Default expiry = 4 hours from now
    const defaultExpiry = () => {
        const d = new Date(Date.now() + 4 * 3600 * 1000)
        return d.toISOString().slice(0, 16)
    }

    const [form, setForm] = useState({
        foodName: '', quantity: 1, type: 'Veg',
        price: '', originalPrice: '', expiryTime: defaultExpiry()
    })

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const applyPreset = (preset) => {
        setForm(f => ({ ...f, ...preset, expiryTime: defaultExpiry(), quantity: 5 }))
        setSuccess(''); setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setSuccess(''); setLoading(true)
        try {
            await addFoodListing({
                provider_id: user.id,
                food_name: form.foodName,
                quantity: Number(form.quantity),
                type: form.type,
                price: Number(form.price),
                original_price: Number(form.originalPrice) || Number(form.price),
                expiry_time: new Date(form.expiryTime).toISOString(),
                status: 'available',
            })

            setSuccess('✅ Food listing added successfully!')
            setForm({ foodName: '', quantity: 1, type: 'Veg', price: '', originalPrice: '', expiryTime: defaultExpiry() })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">➕ Add Food Listing</h2>
                <p className="page-subtitle">List surplus food in under 30 seconds. Reduce waste. Earn more.</p>
            </div>

            {/* Quick Presets */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 className="section-title" style={{ marginBottom: 14 }}>⚡ Quick Presets</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {PRESETS.map((p, i) => (
                        <button
                            key={i}
                            id={`preset-btn-${i}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.82rem' }}
                            onClick={() => applyPreset(p)}
                        >
                            {p.type === 'Veg' ? '🟢' : '🔴'} {p.foodName}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-card">
                {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}
                {success && <div className="success-msg" style={{ marginBottom: 20 }}>{success}</div>}

                <form id="add-food-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full">
                            <label htmlFor="food-name">Food Name *</label>
                            <input
                                id="food-name" type="text" placeholder="e.g. Vegetable Biryani (10 portions)"
                                value={form.foodName} onChange={e => set('foodName', e.target.value)} required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="food-qty">Quantity (portions) *</label>
                            <input
                                id="food-qty" type="number" min="1" placeholder="5"
                                value={form.quantity} onChange={e => set('quantity', e.target.value)} required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="food-type">Type *</label>
                            <select id="food-type" value={form.type} onChange={e => set('type', e.target.value)}>
                                <option value="Veg">🟢 Vegetarian</option>
                                <option value="Non-Veg">🔴 Non-Vegetarian</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="food-original-price">Original Price (₹) *</label>
                            <input
                                id="food-original-price" type="number" min="0" placeholder="200"
                                value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="food-price">Discounted Price (₹) *</label>
                            <input
                                id="food-price" type="number" min="0" placeholder="80"
                                value={form.price} onChange={e => set('price', e.target.value)} required
                            />
                        </div>

                        <div className="form-group full">
                            <label htmlFor="food-expiry">Expiry Date &amp; Time *</label>
                            <input
                                id="food-expiry" type="datetime-local"
                                value={form.expiryTime} onChange={e => set('expiryTime', e.target.value)} required
                            />
                        </div>
                    </div>

                    {/* Live Discount Preview */}
                    {form.price && form.originalPrice && Number(form.originalPrice) > 0 && (
                        <div style={{
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 'var(--radius-sm)', padding: '16px', margin: '20px 0',
                            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
                        }}>
                            <span style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>📊 Listing Preview:</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '1.2rem' }}>₹{form.price}</span>
                            <span style={{ color: 'var(--text3)', textDecoration: 'line-through' }}>₹{form.originalPrice}</span>
                            <span className="discount-badge">
                                {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% OFF
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button
                            id="submit-food-btn"
                            className="btn btn-primary"
                            type="submit"
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Adding...' : '🚀 List Food Now'}
                        </button>
                        <button
                            id="view-dashboard-btn"
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/')}
                        >
                            📋 Dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
