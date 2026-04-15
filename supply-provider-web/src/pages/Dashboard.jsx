import { useState } from 'react'
import FoodCard from '../components/FoodCard'

export default function Dashboard({ foods, requestsCount, onAddFood, onEditFood, onDeleteFood, onAiAction }) {
    const [expandedId, setExpandedId] = useState(null)
    const predictedSurplus = foods.reduce((sum, food) => sum + Math.max(0, Number(food.qty || 0)), 0)
    const activeListings = foods.filter((food) => food.finalStatus === 'active').length

    return (
        <div className="page active" id="page-dashboard">
            <div className="page-title">Left2Lift</div>
            <div className="page-sub">AI-powered surplus prediction, live pricing & impact reporting</div>

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
                    <div className="stat-label">Items Live</div>
                    <div className="stat-val" style={{ color: 'var(--orange)' }}>{foods.length}</div>
                    <span className="stat-tag up">+2 today</span>
                </div>
                <div className="stat-card teal">
                    <div className="stat-label">Predicted Surplus</div>
                    <div className="stat-val" style={{ color: 'var(--teal)' }}>{predictedSurplus}</div>
                    <span className="stat-tag up">AI forecast</span>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-label">Active Listings</div>
                    <div className="stat-val" style={{ color: '#7a5a00' }}>{activeListings}</div>
                    <span className="stat-tag warn">Live inventory</span>
                </div>
                <div className="stat-card pink">
                    <div className="stat-label">Requests</div>
                    <div className="stat-val" style={{ color: '#9b3a5a' }}>{requestsCount}</div>
                    <span className="stat-tag warn">Needs action</span>
                </div>
            </div>

            <div className="section-header">
                <div className="section-title">Recent Food Listings</div>
                <button className="btn-add" onClick={onAddFood}>➕ Add Food</button>
            </div>

            <div className="food-list" id="food-list-home">
                {foods.map((food) => {
                    const remainingPct = Math.max(0, Math.min(100, Number(food.remainingPercent ?? 100)))
                    const remainingMins = Math.max(0, Number(food.remainingMinutes ?? 0))
                    const ngoThreshold = Math.max(0, Number(food.ngoTriggerMinutes ?? 30))
                    const discountPrice = Number(food.discountPreview ?? Math.round(Number(food.orig || 0) * 0.5))
                    const ngoTriggered = remainingMins <= ngoThreshold
                    const progressColor = remainingPct > 60 ? '#16a34a' : remainingPct >= 30 ? '#eab308' : '#dc2626'

                    return (
                        <div key={food.id} style={{ marginBottom: 10 }}>
                            <div
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
                                style={{ cursor: 'pointer' }}
                            >
                                <FoodCard food={food} onEditFood={onEditFood} onDeleteFood={onDeleteFood} />
                            </div>

                            {expandedId === food.id && (
                                <div
                                    className="food-expanded"
                                    style={{
                                        background: '#fff',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        marginTop: 8,
                                        padding: 12,
                                        boxShadow: '0 6px 16px rgba(15,23,42,0.06)',
                                        transition: 'all 220ms ease',
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
                                            <span style={{ textDecoration: 'line-through' }}>₹{food.orig}</span> → <strong>₹{food.price}</strong>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#4b5563' }}>₹{food.orig} → ₹{discountPrice} → ₹0</div>
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
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
