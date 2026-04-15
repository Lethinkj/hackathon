import { useEffect, useState } from 'react'
import { getProviderFood, getProviderStats, subscribeProviderFood } from '../lib/api'

export default function Analytics({ user }) {
    const [stats, setStats] = useState(null)
    const [foods, setFoods] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()

        const channel = subscribeProviderFood(user.id, () => {
            fetchData()
        })

        return () => {
            channel.unsubscribe()
        }
    }, [user.id])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statsData, fData] = await Promise.all([
                getProviderStats(user.id),
                getProviderFood(user.id),
            ])
            setStats(statsData)
            setFoods(Array.isArray(fData) ? fData : [])
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    // Derived analytics
    const totalRevenue = foods
        .filter(f => f.status === 'sold')
        .reduce((sum, f) => sum + (f.original_price || 0), 0)

    const savedRevenue = foods
        .filter(f => f.status === 'sold')
        .reduce((sum, f) => sum + (f.price || 0), 0)

    const wastePct = stats?.totalListings > 0
        ? Math.round(((stats.soldItems + stats.donatedItems) / stats.totalListings) * 100)
        : 0

    const vegCount = foods.filter(f => f.type === 'Veg').length
    const nonVegCount = foods.filter(f => f.type === 'Non-Veg').length

    const BAR_MAX = Math.max(stats?.soldItems || 0, stats?.donatedItems || 0, stats?.activeListings || 0, 1)
    const bar = (val) => `${Math.round((val / BAR_MAX) * 100)}%`

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">📊 Analytics</h2>
                <p className="page-subtitle">Track your impact — waste reduced, food saved, revenue earned.</p>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner" /> Loading analytics...</div>
            ) : (
                <>
                    {/* Impact Cards */}
                    <div className="stats-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card green">
                            <div className="stat-icon">♻️</div>
                            <div className="stat-value">{stats?.wasteReduced ?? 0}</div>
                            <div className="stat-label">Items Waste-Reduced</div>
                            <div className="stat-change">↑ {wastePct}% utilisation rate</div>
                        </div>
                        <div className="stat-card indigo">
                            <div className="stat-icon">💰</div>
                            <div className="stat-value">₹{savedRevenue.toLocaleString()}</div>
                            <div className="stat-label">Revenue Recovered</div>
                        </div>
                        <div className="stat-card cyan">
                            <div className="stat-icon">🤝</div>
                            <div className="stat-value">{stats?.donatedItems ?? 0}</div>
                            <div className="stat-label">Meals Donated to NGOs</div>
                        </div>
                        <div className="stat-card amber">
                            <div className="stat-icon">🌱</div>
                            <div className="stat-value">{Math.round((stats?.wasteReduced ?? 0) * 0.4)} kg</div>
                            <div className="stat-label">CO₂ Emissions Prevented</div>
                            <div className="stat-change">≈ 0.4 kg CO₂ per meal</div>
                        </div>
                    </div>

                    {/* Bar Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                        {/* Status Distribution */}
                        <div className="card">
                            <h3 className="section-title" style={{ marginBottom: 20 }}>📋 Listing Status</h3>
                            {[
                                { label: 'Available', value: stats?.activeListings ?? 0, color: 'var(--success)' },
                                { label: 'Sold', value: stats?.soldItems ?? 0, color: 'var(--primary)' },
                                { label: 'Donated', value: stats?.donatedItems ?? 0, color: 'var(--accent)' },
                            ].map(item => (
                                <div key={item.label} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text2)' }}>{item.label}</span>
                                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: bar(item.value),
                                            background: item.color, borderRadius: 8,
                                            transition: 'width 1s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Food Type Distribution */}
                        <div className="card">
                            <h3 className="section-title" style={{ marginBottom: 20 }}>🥦 Food Type Mix</h3>
                            {[
                                { label: '🟢 Vegetarian', value: vegCount, color: 'var(--success)' },
                                { label: '🔴 Non-Vegetarian', value: nonVegCount, color: 'var(--danger)' },
                            ].map(item => (
                                <div key={item.label} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text2)' }}>{item.label}</span>
                                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.value}</span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.round((item.value / Math.max(foods.length, 1)) * 100)}%`,
                                            background: item.color, borderRadius: 8, transition: 'width 1s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}

                            {/* Donut-style display */}
                            <div style={{ marginTop: 24, textAlign: 'center' }}>
                                <div style={{
                                    width: 120, height: 120, borderRadius: '50%',
                                    background: `conic-gradient(var(--success) ${Math.round((vegCount / Math.max(foods.length, 1)) * 360)}deg, var(--danger) 0deg)`,
                                    margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                                }}>
                                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>{foods.length}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text2)' }}>total</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Listings Table */}
                    <div className="card">
                        <h3 className="section-title" style={{ marginBottom: 16 }}>🕐 Recent Listings</h3>
                        {foods.length === 0 ? (
                            <div className="empty-state" style={{ padding: '30px 0' }}>
                                <p>No listings yet. Add food to see analytics.</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Food Item</th>
                                            <th>Type</th>
                                            <th>Qty</th>
                                            <th>Original</th>
                                            <th>Listed At</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {foods.slice(0, 10).map(f => (
                                            <tr key={f.id}>
                                                <td style={{ fontWeight: 600 }}>{f.food_name}</td>
                                                <td>
                                                    <span className={`food-type-badge ${f.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                                                        {f.type}
                                                    </span>
                                                </td>
                                                <td>{f.quantity}</td>
                                                <td>₹{f.original_price}</td>
                                                <td style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>
                                                    {new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td><span className={`status-badge ${f.status}`}><span className="status-dot" />{f.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
