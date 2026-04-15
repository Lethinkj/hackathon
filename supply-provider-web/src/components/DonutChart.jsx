export default function DonutChart({ title, subtitle, data = [] }) {
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)
    const size = 180
    const radius = 64
    const strokeWidth = 18
    const circumference = 2 * Math.PI * radius
    let accumulated = 0

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div>
                    <div className="chart-title">{title}</div>
                    {subtitle ? <div className="chart-subtitle">{subtitle}</div> : null}
                </div>
            </div>
            {total ? (
                <div className="donut-wrap">
                    <svg viewBox={`0 0 ${size} ${size}`} className="donut-svg" aria-label={title}>
                        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                            {data.map((item) => {
                                const value = Number(item.value || 0)
                                const dash = (value / total) * circumference
                                const dashArray = `${dash} ${circumference - dash}`
                                const dashOffset = -accumulated
                                accumulated += dash

                                return (
                                    <circle
                                        key={item.label}
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        fill="none"
                                        stroke={item.color || '#5D3FD3'}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={dashArray}
                                        strokeDashoffset={dashOffset}
                                        strokeLinecap="round"
                                    />
                                )
                            })}
                        </g>
                    </svg>
                    <div className="donut-center">
                        <strong>{total}</strong>
                        <span>records</span>
                    </div>
                </div>
            ) : (
                <div className="chart-empty">No waste data available</div>
            )}
            <div className="donut-legend">
                {data.map((item) => (
                    <div className="donut-legend-item" key={item.label}>
                        <span className="legend-dot" style={{ background: item.color || '#5D3FD3' }} />
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </div>
                ))}
            </div>
        </div>
    )
}
