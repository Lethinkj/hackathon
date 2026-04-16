function maxValue(items) {
    return items.reduce((max, item) => Math.max(max, Number(item.value) || 0), 1)
}

export default function TrendBars({ title, items }) {
    const peak = maxValue(items)

    return (
        <section className="panel glass">
            <div className="panel-head">
                <h3>{title}</h3>
            </div>
            <div className="bars">
                {items.map((item) => {
                    const value = Number(item.value) || 0
                    const height = Math.max(8, Math.round((value / peak) * 100))
                    return (
                        <div key={`${title}-${item.label}`} className="bar-col">
                            <div className="bar" style={{ height: `${height}%` }} title={`${item.label}: ${value}`} />
                            <span>{item.label}</span>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
