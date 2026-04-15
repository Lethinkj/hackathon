import StatusBadge from './StatusBadge'

function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatClock(value) {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryCard({ food }) {
    return (
        <article className="history-card">
            <div className="history-card-top">
                <h4 className="history-food-name">{food.name}</h4>
                <StatusBadge status={food.finalStatus} />
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