function buildPoints(values, width, height, padding) {
    if (!values.length) return ''

    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const range = max - min || 1

    return values
        .map((value, index) => {
            const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
            const y = height - padding - ((value - min) / range) * (height - padding * 2)
            return `${x},${y}`
        })
        .join(' ')
}

export default function TrendLineChart({ title, subtitle, data = [], color = '#5D3FD3' }) {
    const values = data.map((item) => Number(item.value ?? item.y ?? 0))
    const labels = data.map((item) => String(item.label ?? item.date ?? item.weekday_name ?? ''))
    const width = 640
    const height = 220
    const padding = 28
    const points = buildPoints(values, width, height, padding)

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div>
                    <div className="chart-title">{title}</div>
                    {subtitle ? <div className="chart-subtitle">{subtitle}</div> : null}
                </div>
            </div>
            <div className="chart-wrap">
                {values.length ? (
                    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
                        <defs>
                            <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.04" />
                            </linearGradient>
                        </defs>
                        <polyline fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
                        <polyline fill="url(#trend-fill)" stroke="none" points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`} />
                        {points.split(' ').map((point, index) => {
                            const [x, y] = point.split(',').map(Number)
                            return <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="5" fill={color} />
                        })}
                    </svg>
                ) : (
                    <div className="chart-empty">No trend data available</div>
                )}
            </div>
            <div className="chart-label-row">
                {labels.slice(0, 6).map((label) => (
                    <span key={label}>{label}</span>
                ))}
            </div>
        </div>
    )
}
