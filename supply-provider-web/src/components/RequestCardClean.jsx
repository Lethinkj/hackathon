export default function RequestCardClean({ request, onAccept, onDecline }) {
    const requesterType = String(request.requester_type || request.requesterType || 'consumer').toUpperCase()
    const pickupType = String(request.pickup_type || request.pickupType || 'self').toUpperCase()
    const status = String(request.status || 'pending').toUpperCase()

    return (
        <div className="req-card">
            <div className="req-top">
                <div className="req-who">
                    <div className="req-avatar user">{requesterType.slice(0, 2)}</div>
                    <div>
                        <div className="req-name">{request.food_name || 'Food request'}</div>
                        <span className="req-type-badge user-b">{requesterType}</span>
                    </div>
                </div>
                <div className="req-time">{new Date(request.created_at || Date.now()).toLocaleString()}</div>
            </div>

            <div className="req-item-row">
                <span className="req-item-emoji">🍱</span>
                <div>
                    <div className="req-item-name">Pickup Type: {pickupType}</div>
                    <div className="req-item-qty">Status: {status} · Qty: {request.food_quantity || request.quantity || 0}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--teal)' }}>
                    ₹{request.food_price || request.current_price || 0}
                </div>
            </div>

            <div className="req-actions">
                <button className="btn-decline" onClick={() => onDecline(request.id)}>Reject</button>
                <button className="btn-accept" onClick={() => onAccept(request.id)}>Accept</button>
            </div>
        </div>
    )
}
