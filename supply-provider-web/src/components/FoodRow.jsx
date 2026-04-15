import { useState } from 'react'
import FoodLifecycleBar from './FoodLifecycleBar'

function minutesToLabel(minutes) {
    const safeMinutes = Math.max(0, Math.round(Number(minutes || 0)))
    const hours = Math.floor(safeMinutes / 60)
    const mins = safeMinutes % 60

    if (hours > 0 && mins > 0) return `${hours}h ${mins}m left`
    if (hours > 0) return `${hours}h left`
    return `${mins}m left`
}

function addedTimeLabel(minutesAgo) {
    const safeMinutes = Math.max(0, Math.round(Number(minutesAgo || 0)))
    if (safeMinutes < 60) return `${safeMinutes} min ago`
    return `${Math.floor(safeMinutes / 60)} hr ago`
}

export default function FoodRow({ food, onEditFood, onDeleteFood }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className={`food-row-card ${expanded ? 'open' : ''}`}>
            <div className="food-row-main">
                <div className="food-row-col food-name-col">
                    <span className="food-row-icon">{food.emoji || '🍽️'}</span>
                    <div>
                        <div className="food-row-name">{food.name}</div>
                        <div className="food-row-source">{food.source}</div>
                    </div>
                </div>
                <div className="food-row-col">₹{food.price}</div>
                <div className="food-row-col">{food.qty}</div>
                <div className="food-row-col">{addedTimeLabel(food.time)}</div>
                <div className="food-row-actions">
                    <button className="btn-edit" onClick={() => onEditFood(food)}>Edit</button>
                    <button className="btn-del" onClick={() => onDeleteFood(food.id)}>Delete</button>
                    <button className="btn-edit" onClick={() => setExpanded((prev) => !prev)}>{expanded ? 'Hide' : 'Details'}</button>
                </div>
            </div>

            <div className="food-row-expand" style={{ maxHeight: expanded ? 360 : 0 }}>
                <div className="food-row-expand-inner">
                    <FoodLifecycleBar
                        remainingPercent={food.remainingPercent}
                        remainingLabel={minutesToLabel(food.remainingMinutes)}
                    />

                    <div className="food-row-price-logic">
                        <div className="food-row-price-line">Original Price -> Discounted Price</div>
                        <div className="food-row-price-examples">
                            <span>2hr -> ₹{food.orig}</span>
                            <span>1hr -> ₹{food.discountPreview}</span>
                            <span>30min -> ₹0 (NGO only)</span>
                        </div>
                    </div>

                    {food.ngoAlertTriggered ? <div className="ngo-alert-badge">NGO ALERT TRIGGERED</div> : null}

                    <div className="visibility-row">
                        <div><strong>Consumer:</strong> {food.consumerVisibility}</div>
                        <div><strong>NGO:</strong> {food.ngoVisibility}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}