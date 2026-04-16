import StatusBadge from './StatusBadge'

function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatClock(value) {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryCard({ food }) {
    const status = String(food.status || food.finalStatus || 'SELL').toUpperCase()
    const displayStatus = status === 'DONATE' ? 'donated' : status === 'EXPIRED' ? 'wasted' : 'active'
    const createdAt = food.created_at || food.createdAt
    const expiredAt = food.expiredAt || food.expiry_time || food.expiryTime

    return (
        <article className="history-card">
            <div className="history-card-top">
                <div className="history-food-left">
                    <div className="food-emoji history-emoji">{food.emoji || '🍱'}</div>
                    <div>
                        <h4 className="history-food-name">{food.name}</h4>
                        <div className="food-meta">{food.source || 'Provider listing'}</div>
                        <div className="food-tags" style={{ marginTop: 4 }}>
                            <span className={`tag ${String(food.type || food.food_type || 'Veg') === 'Veg' ? 'veg' : 'nonveg'}`}>{food.type || food.food_type || 'Veg'}</span>
                            <span className={`tag ${String(food.mode || food.listing_mode || 'discount') === 'discount' ? 'discount' : 'donate'}`}>
                                {String(food.mode || food.listing_mode || 'discount') === 'discount' ? 'Discount' : 'Donate'}
                            </span>
                        </div>
                    </div>
                </div>
                <StatusBadge status={displayStatus} />
            </div>
            <div className="history-grid">
                <div className="history-cell">
                    <span className="history-label">Quantity</span>
                    <span className="history-value">{food.qty ?? food.quantity}</span>
                </div>
                <div className="history-cell">
                    <span className="history-label">Date Added</span>
                    <span className="history-value">{createdAt ? formatDate(createdAt) : '-'}</span>
                </div>
                <div className="history-cell">
                    <span className="history-label">Time Expired</span>
                    <span className="history-value">{expiredAt ? formatClock(expiredAt) : '-'}</span>
                </div>
            </div>
        </article>
    )
}