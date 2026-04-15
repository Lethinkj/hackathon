import useTimer from '../hooks/useTimer'
import { calculatePrice, formatRemainingTime, getTimeRatio } from '../utils/pricing'
import { decideAction, getTimerColor } from '../utils/decisionEngine'

export default function FoodListCard({ food }) {
    const remainingSeconds = useTimer(food.expiresAt)
    const ratio = getTimeRatio(remainingSeconds, food.maxT)
    const price = calculatePrice(food.base, remainingSeconds, food.maxT)
    const action = decideAction(ratio)

    return (
        <div className="list-card">
            <div className="lc-icon" style={{ background: food.iconBg || 'transparent' }}>{food.icon}</div>
            <div>
                <div className="lc-name">{food.name}</div>
                <div className="lc-sub">{food.prov} · {food.qty} left · {food.veg ? 'Veg' : 'Non-veg'}</div>
            </div>
            <div className="lc-right">
                <div className="lc-price">₹{price}</div>
                <div className="lc-timer-wrap">
                    <div className="lc-bar">
                        <div className="lc-bar-fill" style={{ width: `${Math.round(ratio * 100)}%`, background: getTimerColor(ratio) }} />
                    </div>
                    <span className="lc-timeleft">{formatRemainingTime(remainingSeconds)}</span>
                </div>
                <div className="sr-only">{action}</div>
            </div>
        </div>
    )
}
