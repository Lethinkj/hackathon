function timeLabel(t) {
    if (t < 60) return `${t}m ago`
    return `${Math.round(t / 60)}h ago`
}

export default function FoodCard({ food, onEditFood, onDeleteFood }) {
    return (
        <div className="food-card" id={`fc-${food.id}`}>
            <div className="food-emoji">{food.emoji}</div>
            <div className="food-info">
                <div className="food-name">{food.name}</div>
                <div className="food-meta">Qty {food.qty} · {food.source}</div>
                <div className="food-tags">
                    <span className={`tag ${food.type === 'Veg' ? 'veg' : 'nonveg'}`}>{food.type}</span>
                    {food.mystery ? <span className="tag mystery">Mystery Box</span> : null}
                    <span className={`tag ${food.mode === 'discount' ? 'discount' : 'donate'}`}>{food.mode === 'discount' ? 'Discount' : 'Donate'}</span>
                </div>
            </div>
            <div className="food-price-block">
                <div className="food-price">₹{food.price}</div>
                <div className="food-price-orig">₹{food.orig}</div>
                <div className="food-time">{timeLabel(food.time)}</div>
            </div>
            <div className="food-actions">
                <button className="btn-edit" onClick={() => onEditFood(food)}>✏️ Edit</button>
                <button className="btn-del" onClick={() => onDeleteFood(food.id)}>🗑</button>
            </div>
        </div>
    )
}
