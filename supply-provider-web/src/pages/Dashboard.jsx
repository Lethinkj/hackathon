import { useState } from 'react'
import BrandLogo from '../components/BrandLogo'

function timeSinceAdded(food) {
    const createdAt = new Date(food.created_at || food.createdAt || Date.now()).getTime()
    const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000))

    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m ago`
}

function lifecycleColor(remainingPct) {
    if (remainingPct > 60) return '#16a34a'
    if (remainingPct >= 30) return '#eab308'
    return '#dc2626'
}

export default function Dashboard({ foods, requestsCount, onAddFood, onEditFood, onDeleteFood, onAiAction }) {
    const [expandedId, setExpandedId] = useState(null)
    const todayFoods = foods.filter((food) => {
        const createdAt = new Date(food.created_at || food.createdAt || 0)
        const today = new Date()
        return createdAt.toDateString() === today.toDateString()
    })
    const predictedSurplus = todayFoods.reduce((sum, food) => sum + Math.max(0, Number(food.qty || food.quantity || 0)), 0)
    const donatedCount = todayFoods.filter((food) => String(food.status || food.finalStatus || '').toUpperCase() === 'DONATE').length
    const activeListings = todayFoods.filter((food) => String(food.status || food.finalStatus || 'SELL').toUpperCase() !== 'EXPIRED').length

    return (
        <div className="page active" id="page-dashboard">
            <div className="dashboard-brand-wrap">
                <BrandLogo size={72} className="dashboard-brand-logo" title="Provider dashboard logo" />
            </div>
            <div className="page-sub page-sub-centered">AI-powered surplus prediction, live pricing & impact reporting</div>

            <div className="ai-banner">
                <div className="ai-banner-left">
                    <div className="ai-label">AI Insight</div>
                    <div className="ai-headline">Tomorrow&apos;s surplus forecast</div>
                    <div className="ai-body">
                        Based on your weekly patterns, tomorrow may see excess bakery and meal inventory around evening hours.
                        Consider applying early discounts and NGO outreach to maximize recovery.
                    </div>
                    <div className="forecast-actions" style={{ marginTop: 12 }}>
                        <button className="action-pill orange" onClick={() => onAiAction?.('Discount campaign activated!')}>
                            Offer Discount
                        </button>
                        <button className="action-pill teal" onClick={() => onAiAction?.('NGO partner notified!')}>
                            Donate to NGO
                        </button>
                        <button className="action-pill pink" onClick={() => onAiAction?.('Cooking quantity adjusted!')}>
                            Reduce Cooking
                        </button>
                    </div>
                </div>
                <div className="ai-img-box">
                    <div className="ai-shimmer" />
                    <div className="ai-img-icon">🤖</div>
                    <div className="ai-img-label">AI-generated insight</div>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card orange">
                    <div className="stat-label">Predicted Surplus</div>
                    <div className="stat-val" style={{ color: 'var(--orange)' }}>{predictedSurplus}</div>
                    <span className="stat-tag up">Today</span>
                </div>
                <div className="stat-card teal">
                    <div className="stat-label">Surplus Requests</div>
                    <div className="stat-val" style={{ color: 'var(--teal)' }}>{requestsCount}</div>
                    <span className="stat-tag up">Incoming</span>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-label">Donated</div>
                    <div className="stat-val" style={{ color: '#7a5a00' }}>{donatedCount}</div>
                    <span className="stat-tag warn">NGO flow</span>
                </div>
                <div className="stat-card pink">
                    <div className="stat-label">Active Listings</div>
                    <div className="stat-val" style={{ color: '#9b3a5a' }}>{activeListings}</div>
                    <span className="stat-tag warn">Live inventory</span>
                </div>
            </div>

            <div className="section-header">
                <div className="section-title">Recent Food Listings</div>
                <button className="btn-add" onClick={onAddFood}>➕ Add Food</button>
            </div>

            <div className="food-list" id="food-list-home">
                {todayFoods.map((food) => {
                    const remainingPct = Math.max(0, Math.min(100, Number(food.remainingPercent ?? 100)))
                    const remainingMins = Math.max(0, Number(food.remainingMinutes ?? 0))
                    const ngoThreshold = Math.max(0, Number(food.ngoTriggerMinutes ?? 30))
                    const discountPrice = Number(food.discountPreview ?? Math.round(Number(food.orig || 0) * 0.5))
                    const ngoTriggered = remainingMins <= ngoThreshold
                    const progressColor = lifecycleColor(remainingPct)
                    const isExpanded = expandedId === food.id
                    const lifecycleBg = ngoTriggered ? '#fff1f2' : '#fffdf9'
                    const lifecycleBorder = ngoTriggered ? '#fecdd3' : 'var(--border)'

                    return (
                        <div key={food.id} style={{ marginBottom: 12 }}>
                            <div
                                className="food-card"
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                    if (event.target.closest('button')) return
                                    setExpandedId(food.id === expandedId ? null : food.id)
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        setExpandedId(food.id === expandedId ? null : food.id)
                                    }
                                }}
                                style={{
                                    cursor: 'pointer',
                                    display: 'grid',
                                    gridTemplateColumns: '1.7fr 1.2fr 0.8fr 0.8fr auto',
                                    alignItems: 'center',
                                    gap: 12,
                                    boxShadow: isExpanded ? '0 10px 22px rgba(15,23,42,0.09)' : undefined,
                                    transition: 'box-shadow 180ms ease, transform 180ms ease',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                    <div className="food-emoji">{food.emoji || '🍱'}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="food-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name}</div>
                                        <div className="food-meta">{food.source || food.provider_name || 'Provider listing'}</div>
                                        <div className="food-tags">
                                            <span className={`tag ${String(food.type || food.food_type || 'Veg') === 'Veg' ? 'veg' : 'nonveg'}`}>{food.type || food.food_type || 'Veg'}</span>
                                            <span className={`tag ${String(food.status || '').toUpperCase() === 'DONATE' ? 'donate' : 'discount'}`}>
                                                {String(food.status || '').toUpperCase() === 'DONATE' ? 'Donate' : 'Discount'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div className="food-price" style={{ fontSize: 20 }}>₹{food.price ?? food.current_price}</div>
                                    <div className="food-price-orig">₹{food.orig ?? food.base_price}</div>
                                </div>

                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                                    Qty {food.qty ?? food.quantity}
                                </div>

                                <div className="food-time" style={{ fontSize: 12 }}>{timeSinceAdded(food)}</div>

                                <div className="food-actions" style={{ justifySelf: 'end' }}>
                                    <button
                                        className="btn-edit"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            onEditFood(food)
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn-del"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            onDeleteFood(food.id)
                                        }}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    maxHeight: isExpanded ? 260 : 0,
                                    opacity: isExpanded ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 280ms ease, opacity 220ms ease',
                                }}
                            >
                                <div
                                    className="food-expanded"
                                    style={{
                                        background: lifecycleBg,
                                        border: `1px solid ${lifecycleBorder}`,
                                        borderRadius: '12px',
                                        marginTop: 8,
                                        padding: 12,
                                        boxShadow: '0 8px 18px rgba(15,23,42,0.07)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Time Remaining</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{Math.round(remainingPct)}%</div>
                                    </div>
                                    <div style={{ width: '100%', height: 10, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', marginBottom: 10 }}>
                                        <div
                                            style={{
                                                width: `${remainingPct}%`,
                                                height: '100%',
                                                background: progressColor,
                                                transition: 'width 320ms ease',
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                                            <span style={{ textDecoration: 'line-through' }}>₹{food.orig ?? food.base_price}</span> → <strong>₹{food.price ?? food.current_price}</strong>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#4b5563', fontWeight: 700 }}>₹{food.orig ?? food.base_price} → ₹{discountPrice} → ₹0</div>
                                    </div>

                                    {ngoTriggered && (
                                        <div
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                background: '#fee2e2',
                                                color: '#b91c1c',
                                                border: '1px solid #fecaca',
                                                borderRadius: 999,
                                                padding: '6px 10px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: 0.3,
                                            }}
                                        >
                                            NGO ALERT TRIGGERED
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
