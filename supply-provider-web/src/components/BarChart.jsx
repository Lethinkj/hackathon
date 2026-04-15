export default function BarChart({ title, subtitle, data = [], barColor = '#5D3FD3' }) {
    const max = Math.max(...data.map((item) => Number(item.value ?? 0)), 1)

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div>
                    <div className="chart-title">{title}</div>
                    {subtitle ? <div className="chart-subtitle">{subtitle}</div> : null}
                </div>
            </div>
            <div className="bar-chart">
                {data.length ? data.map((item) => {
                    const value = Number(item.value ?? 0)
                    const width = `${Math.max(6, Math.round((value / max) * 100))}%`
                    return (
                        <div className="bar-row" key={String(item.label)}>
                            <div className="bar-meta">
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </div>
                            <div className="bar-track">
                                <div className="bar-fill" style={{ width, background: item.color || barColor }} />
                            </div>
                        </div>
                    )
                }) : <div className="chart-empty">No festival data available</div>}
            </div>
        </div>
    )
}
