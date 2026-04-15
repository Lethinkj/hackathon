export default function MetricsCard({ value, label, icon, valueClassName = '' }) {
    return (
        <div className="card mc">
            {icon ? <div className="mc-icon">{icon}</div> : null}
            <div className={`mc-val${valueClassName ? ` ${valueClassName}` : ''}`}>{value}</div>
            <div className="mc-label">
                {label}
            </div>
        </div>
    )
}
