import Countdown from './Countdown'

export default function FoodCard({ food, onDelete }) {
    const hoursLeft = ((new Date(food.expiry_time || food.expiryTime) - new Date()) / 3600000)
    const originalPrice = food.original_price || food.originalPrice || 0
    const currentPrice = food.price || 0
    const discount = originalPrice > 0
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0

    return (
        <div className="food-card">
            <div className="food-card-header">
                <div>
                    <div className="food-name">{food.food_name || food.foodName}</div>
                    <div style={{ marginTop: 6 }}>
                        <span className={`food-type-badge ${food.type === 'Veg' ? 'veg' : 'non-veg'}`}>
                            {food.type === 'Veg' ? '🟢' : '🔴'} {food.type}
                        </span>
                    </div>
                </div>
                <span className={`status-badge ${food.status}`}>
                    <span className="status-dot" />
                    {food.status}
                </span>
            </div>

            <div className="food-meta">
                <span className="food-meta-item">📦 Qty: <strong>{food.quantity}</strong></span>
                <span className="food-meta-item">
                    <Countdown expiryTime={food.expiry_time || food.expiryTime} />
                </span>
            </div>

            <div className="food-price-row">
                <span className="food-price">₹{currentPrice}</span>
                {discount > 0 && (
                    <>
                        <span className="food-original-price">₹{originalPrice}</span>
                        <span className="discount-badge">{discount}% OFF</span>
                    </>
                )}
            </div>

            {onDelete && food.status === 'available' && (
                <button
                    className="btn btn-danger"
                    style={{ width: '100%', marginTop: 14, fontSize: '0.8rem', padding: '8px' }}
                    onClick={() => onDelete(food.id)}
                >
                    🗑️ Remove
                </button>
            )}
        </div>
    )
}
