function timeClass(t) {
    if (t <= 10) return 'urgent'
    if (t <= 25) return 'low'
    if (t <= 45) return 'mid'
    return 'fresh'
}

function timeLabel(t) {
    if (t < 60) return `${t}m ago`
    return `${Math.round(t / 60)}h ago`
}

function timePercent(t) {
    return Math.max(5, 100 - (t / 120) * 100)
}

function earnEstimate(price, qty) {
    return (price * qty * 0.85).toFixed(0)
}

export default function ListingCard({ food }) {
    const tc = timeClass(food.time)
    const pct = timePercent(food.time)

    return (
        <div className={`listing-card ${tc === 'urgent' ? 'urgent-l' : tc === 'low' ? 'expiring' : 'active-l'}`}>
            <div className="listing-top">
                <span className="listing-emoji">{food.emoji}</span>
                <span className={`listing-status-badge ${tc === 'urgent' || tc === 'low' ? 'exp' : 'live'}`}>
                    {tc === 'urgent' ? 'Urgent' : tc === 'low' ? 'Expiring' : 'Live'}
                </span>
            </div>
            <div className="listing-name">{food.name}</div>
            <div className="listing-source">{food.source}</div>
            <div className="time-progress">
                <div className="time-bar-bg"><div className={`time-bar-fill ${tc}`} style={{ width: `${pct}%` }} /></div>
                <div className="time-label"><span>Added {timeLabel(food.time)}</span><span>Qty: {food.qty}</span></div>
            </div>
            <div className="listing-stats">
                <div className="listing-stat">
                    <div className="listing-stat-val" style={{ color: 'var(--teal)' }}>₹{food.price}</div>
                    <div className="listing-stat-label">Listed</div>
                </div>
                <div className="listing-stat">
                    <div className="listing-stat-val" style={{ color: 'var(--text-3)' }}>₹{food.orig}</div>
                    <div className="listing-stat-label">Original</div>
                </div>
                <div className="listing-stat">
                    <div className="listing-stat-val" style={{ color: 'var(--orange)' }}>{Math.round((1 - food.price / food.orig) * 100)}%</div>
                    <div className="listing-stat-label">Off</div>
                </div>
            </div>
            <div className="hourly-earn">
                <span className="hourly-earn-label">Est. gain if sold this hour</span>
                <span className="hourly-earn-val">₹{earnEstimate(food.price, food.qty)}</span>
            </div>
        </div>
    )
}
