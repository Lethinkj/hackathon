function timeLabel(food) {
    if (food.created_at || food.createdAt) {
        const createdAt = new Date(food.created_at || food.createdAt).getTime()
        const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000))
        if (minutes < 60) return `${minutes}m ago`
        return `${Math.round(minutes / 60)}h ago`
    }

    const minutes = Number(food.remainingMinutes ?? food.time ?? 0)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.round(minutes / 60)}h ago`
}

export default function FoodCard({ food, onEditFood, onDeleteFood }) {
    return (
        <div className="food-card" id={`fc-${food.id}`}>
            <div className="food-emoji">{food.emoji}</div>
            <div className="food-info">
                <div className="food-name">{food.name}</div>
                <div className="food-meta">Qty {food.qty ?? food.quantity} · {food.source || food.provider_name || 'Provider listing'}</div>
                <div className="food-tags">
                    <span className={`tag ${String(food.type || food.food_type || 'Veg') === 'Veg' ? 'veg' : 'nonveg'}`}>{food.type || food.food_type || 'Veg'}</span>
                    {food.mystery ? <span className="tag mystery">Mystery Box</span> : null}
                    <span className={`tag ${String(food.status || '').toUpperCase() === 'DONATE' ? 'donate' : 'discount'}`}>
                        {String(food.status || '').toUpperCase() === 'DONATE' ? 'Donate' : 'Discount'}
                    </span>
                </div>
            </div>
            <div className="food-price-block">
                <div className="food-price">₹{food.price ?? food.current_price}</div>
                <div className="food-price-orig">₹{food.orig ?? food.base_price}</div>
                <div className="food-time">{timeLabel(food)}</div>
            </div>
            <div className="food-actions">
                <button className="btn-edit" onClick={() => onEditFood(food)}>✏️ Edit</button>
                <button className="btn-del" onClick={() => onDeleteFood(food.id)}>🗑</button>
            </div>
        </div>
    )
}
