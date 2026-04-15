export default function PredictionStatCard({ label, value, hint, tone = 'indigo' }) {
    return (
        <div className={`prediction-stat ${tone}`}>
            <div className="prediction-stat-label">{label}</div>
            <div className="prediction-stat-value">{value}</div>
            {hint ? <div className="prediction-stat-hint">{hint}</div> : null}
        </div>
    )
}
