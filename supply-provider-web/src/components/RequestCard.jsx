function reqTypeMeta(rtype) {function reqTypeMeta(rtype) {export default function RequestCard({ request, onAccept, onReject }) {









































































}    )        </div>            </div>                ) : null}                    </button>                        Initiate {selected === 'pickup' ? 'Pickup' : 'Dropoff'}                    <button className="btn-initiate" onClick={() => onInitiate(`${selected === 'pickup' ? 'Pickup' : 'Dropoff'} initiated! Driver assigned.`)}>                {selected !== 'self' ? (                <button className="btn-accept" onClick={() => onAccept(request.id)}>Accept Order</button>                <button className="btn-decline" onClick={() => onDecline(request.id)}>Decline</button>            <div className="req-actions">            </div>                ) : null}                    </div>                        📍 Distance: {request.dist}km · Delivery fee: <span className="distance-fee">₹{selected === 'drop' ? Math.round(fee * 1.3) : fee}</span> added to order                    <div className="distance-info">                {selected !== 'self' ? (                </div>                    </div>                        <div className="delivery-opt-price">+₹{Math.round(fee * 1.3)} ({request.dist}km)</div>                        <div className="delivery-opt-label">Drop Off</div>                        <span className="delivery-opt-icon">🚚</span>                    <div className={`delivery-opt ${selected === 'drop' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'drop')}>                    </div>                        <div className="delivery-opt-price">+₹{fee} ({request.dist}km)</div>                        <div className="delivery-opt-label">Initiate Pickup</div>                        <span className="delivery-opt-icon">🛵</span>                    <div className={`delivery-opt ${selected === 'pickup' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'pickup')}>                    </div>                        <div className="delivery-opt-price">No extra fee</div>                        <div className="delivery-opt-label">Self Pickup</div>                        <span className="delivery-opt-icon">🏪</span>                    <div className={`delivery-opt ${selected === 'self' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'self')}>                <div className="delivery-options">                <div className="form-label">Fulfillment Method</div>            <div className="req-delivery">            </div>                </div>                    ₹{request.food.price * request.qty}                <div style={{ marginLeft: 'auto', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--teal)' }}>                </div>                    <div className="req-item-qty">Qty requested: {request.qty} · ₹{request.food.price}/unit</div>                    <div className="req-item-name">{request.item}</div>                <div>                <span className="req-item-emoji">{request.food.emoji}</span>            <div className="req-item-row">            </div>                <div className="req-time">{request.time}</div>                </div>                    </div>                        <span className={`req-type-badge ${badgeClass}`}>{badgeLabel}</span>                        <div className="req-name">{request.name}</div>                    <div>                    <div className={`req-avatar ${avatarClass}`}>{request.initials}</div>                <div className="req-who">            <div className="req-top">        <div className="req-card">    return (    const fee = Number(distFee(request.dist))    const { avatarClass, badgeClass, badgeLabel } = reqTypeMeta(request.rtype)export default function RequestCard({ request, selected, onSelectDelivery, onAccept, onDecline, onInitiate, distFee }) {}    return { avatarClass: 'user', badgeClass: 'user-b', badgeLabel: 'User' }    if (rtype === 'corp') return { avatarClass: 'corp', badgeClass: 'corp-b', badgeLabel: 'Corporate' }    if (rtype === 'ngo') return { avatarClass: 'ngo', badgeClass: 'ngo-b', badgeLabel: 'NGO' }






































































}    )        </div>            </div>                ) : null}                    </button>                        Initiate {selected === 'pickup' ? 'Pickup' : 'Dropoff'}                    <button className="btn-initiate" onClick={() => onInitiate(`${selected === 'pickup' ? 'Pickup' : 'Dropoff'} initiated! Driver assigned.`)}>                {selected !== 'self' ? (                <button className="btn-accept" onClick={() => onAccept(request.id)}>Accept Order</button>                <button className="btn-decline" onClick={() => onDecline(request.id)}>Decline</button>            <div className="req-actions">            </div>                ) : null}                    </div>                        📍 Distance: {request.dist}km · Delivery fee: <span className="distance-fee">₹{selected === 'drop' ? Math.round(fee * 1.3) : fee}</span> added to order                    <div className="distance-info">                {selected !== 'self' ? (                </div>                    </div>                        <div className="delivery-opt-price">+₹{Math.round(fee * 1.3)} ({request.dist}km)</div>                        <div className="delivery-opt-label">Drop Off</div>                        <span className="delivery-opt-icon">🚚</span>                    <div className={`delivery-opt ${selected === 'drop' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'drop')}>                    </div>                        <div className="delivery-opt-price">+₹{fee} ({request.dist}km)</div>                        <div className="delivery-opt-label">Initiate Pickup</div>                        <span className="delivery-opt-icon">🛵</span>                    <div className={`delivery-opt ${selected === 'pickup' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'pickup')}>                    </div>                        <div className="delivery-opt-price">No extra fee</div>                        <div className="delivery-opt-label">Self Pickup</div>                        <span className="delivery-opt-icon">🏪</span>                    <div className={`delivery-opt ${selected === 'self' ? 'selected' : ''}`} onClick={() => onSelectDelivery(request.id, 'self')}>                <div className="delivery-options">                <div className="form-label">Fulfillment Method</div>            <div className="req-delivery">            </div>                <div style={{ marginLeft: 'auto', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--teal)' }}>₹{request.food.price * request.qty}</div>                </div>                    <div className="req-item-qty">Qty requested: {request.qty} · ₹{request.food.price}/unit</div>                    <div className="req-item-name">{request.item}</div>                <div>                <span className="req-item-emoji">{request.food.emoji}</span>            <div className="req-item-row">            </div>                <div className="req-time">{request.time}</div>                </div>                    </div>                        <span className={`req-type-badge ${badgeClass}`}>{badgeLabel}</span>                        <div className="req-name">{request.name}</div>                    <div>                    <div className={`req-avatar ${avatarClass}`}>{request.initials}</div>                <div className="req-who">            <div className="req-top">        <div className="req-card">    return (    const fee = Number(distFee(request.dist))    const { avatarClass, badgeClass, badgeLabel } = reqTypeMeta(request.rtype)export default function RequestCard({ request, selected, onSelectDelivery, onAccept, onDecline, onInitiate, distFee }) {}    return { avatarClass: 'user', badgeClass: 'user-b', badgeLabel: 'User' }    if (rtype === 'corp') return { avatarClass: 'corp', badgeClass: 'corp-b', badgeLabel: 'Corporate' }    if (rtype === 'ngo') return { avatarClass: 'ngo', badgeClass: 'ngo-b', badgeLabel: 'NGO' }    return (
        <div className="card request-card">
            <div className="request-top">
                <div>
                    <div className="request-name">{request.foodName}</div>
                    <div className="request-sub">{request.requestedBy}</div>
                </div>
                <span className={`status-pill request-${request.status}`}>{request.status.toUpperCase()}</span>
            </div>
            <div className="request-meta">{request.pickupType}</div>
            <div className="btn-row">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onAccept(request.id)} disabled={request.status !== 'pending'}>
                    Accept
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onReject(request.id)} disabled={request.status !== 'pending'}>
                    Reject
                </button>
            </div>
        </div>
    )
}
