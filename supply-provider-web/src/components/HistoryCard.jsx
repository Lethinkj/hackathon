import StatusBadge from './StatusBadge'

function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatClock(value) {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryCard({ food }) {
    const status = food.finalStatus === 'donated' ? 'donated' : food.finalStatus === 'wasted' ? 'wasted' : 'sold'

    return (
        <article className="history-card">
            <div className="history-card-top">
                <div className="history-food-left">
                    <div className="food-emoji history-emoji">{food.emoji || '🍱'}</div>
                    <div>
                        <h4 className="history-food-name">{food.name}</h4>
                        <div className="food-meta">{food.source || 'Provider listing'}</div>
                        <div className="food-tags" style={{ marginTop: 4 }}>
                            <span className={`tag ${food.type === 'Veg' ? 'veg' : 'nonveg'}`}>{food.type || 'Veg'}</span>
                            <span className={`tag ${food.mode === 'discount' ? 'discount' : 'donate'}`}>
                                {food.mode === 'discount' ? 'Discount' : 'Donate'}
                            </span>
                        </div>
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>
            <div className="history-grid">
                <div className="history-cell">
                    <span className="history-label">Quantity</span>
                    <span className="history-value">{food.qty}</span>
                </div>
                <div className="history-cell">
                    <span className="history-label">Date Added</span>
                    <span className="history-value">{formatDate(food.createdAt)}</span>
                </div>
                <div className="history-cell">
                    <span className="history-label">Time Expired</span>
                    <span className="history-value">{food.expiredAt ? formatClock(food.expiredAt) : '-'}</span>
                </div>
            </div>
        </article>
    )
}