function toneClass(remainingPercent) {
    if (remainingPercent <= 33) return 'critical'
    if (remainingPercent <= 66) return 'mid'
    return 'fresh'
}

export default function FoodLifecycleBar({ remainingPercent, remainingLabel }) {
    const width = Math.max(0, Math.min(100, Number(remainingPercent || 0)))
    const tone = toneClass(width)

    return (
        <div className="lifecycle-wrap">
            <div className="lifecycle-head">
                <span>Time Remaining</span>
                <span>{Math.round(width)}%</span>
            </div>
            <div className="lifecycle-track">
                <div className={`lifecycle-fill ${tone}`} style={{ width: `${width}%` }} />
            </div>
            <div className="lifecycle-foot">{remainingLabel}</div>
        </div>
    )
}