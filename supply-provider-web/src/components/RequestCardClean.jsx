function reqTypeMeta(rtype) {
    if (rtype === 'ngo') return { avatarClass: 'ngo', badgeClass: 'ngo-b', badgeLabel: 'NGO' }
    if (rtype === 'corp') return { avatarClass: 'corp', badgeClass: 'corp-b', badgeLabel: 'Corporate' }
    return { avatarClass: 'user', badgeClass: 'user-b', badgeLabel: 'User' }
}

export default function RequestCardClean({ request, selected, onSelectDelivery, onAccept, onDecline, onInitiate, distFee }) {
    const { avatarClass, badgeClass, badgeLabel } = reqTypeMeta(request.rtype)
    const fee = Number(distFee(request.dist))

    return (
        <div className="req-card">
            <div className="req-top">
                <div className="req-who">
                    <div className={`req-avatar ${avatarClass}`}>{request.initials}</div>
                    <div>
                        <div className="req-name">{request.name}</div>
                        <span className={`req-type-badge ${badgeClass}`}>{badgeLabel}</span>
                    </div>
                </div>
                <div className="req-time">{request.time}</div>
            </div>

            <div className="req-item-row">
                <span className="req-item-emoji">{request.food.emoji}</span>
                <div>
                    <div className="req-item-name">{request.item}</div>
                    <div className="req-item-qty">Qty requested: {request.qty} · ₹{request.food.price}/unit</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--teal)' }}>
                    ₹{request.food.price * request.qty}
                </div>
            </div>

            <div className="req-delivery">
                <div className="form-label">Fulfillment Method</div>
                <div className="delivery-options">
                    <div className={`delivery-opt ${selected === 'self' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'self')}>
                        <span className="delivery-opt-icon">🏪</span>
                        <div className="delivery-opt-label">Self Pickup</div>
                        <div className="delivery-opt-price">No extra fee</div>
                    </div>
                    <div className={`delivery-opt ${selected === 'pickup' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'pickup')}>
                        <span className="delivery-opt-icon">🛵</span>
                        <div className="delivery-opt-label">Initiate Pickup</div>
                        <div className="delivery-opt-price">+₹{fee} ({request.dist}km)</div>
                    </div>
                    <div className={`delivery-opt ${selected === 'drop' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'drop')}>
                        <span className="delivery-opt-icon">🚚</span>
                        <div className="delivery-opt-label">Drop Off</div>
                        <div className="delivery-opt-price">+₹{Math.round(fee * 1.3)} ({request.dist}km)</div>
                    </div>
                </div>

                {selected !== 'self' ? (
                    <div className="distance-info">
                        📍 Distance: {request.dist}km · Delivery fee: <span className="distance-fee">₹{selected === 'drop' ? Math.round(fee * 1.3) : fee}</span> added to order
                    </div>
                ) : null}
            </div>

            <div className="req-actions">
                <button className="btn-decline" onClick={() => onDecline(request.id)}>Decline</button>
                <button className="btn-accept" onClick={() => onAccept(request.id)}>Accept Order</button>
                {selected !== 'self' ? (
                    <button className="btn-initiate" onClick={() => onInitiate(`${selected === 'pickup' ? 'Pickup' : 'Dropoff'} initiated! Driver assigned.`)}>
                        Initiate {selected === 'pickup' ? 'Pickup' : 'Dropoff'}
                    </button>
                ) : null}
            </div>
        </div>
    )
}
