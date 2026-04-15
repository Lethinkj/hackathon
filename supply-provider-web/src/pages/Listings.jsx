import HistoryCard from '../components/HistoryCard'

function groupLabel(createdAt) {
    const now = new Date()
    const target = new Date(createdAt)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    const diffDays = Math.round((today - targetDay) / (24 * 60 * 60 * 1000))

    if (diffDays <= 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return 'Older'
}

export default function Listings({ foods }) {
    const grouped = foods.reduce((acc, food) => {
        const bucket = groupLabel(food.createdAt)
        if (!acc[bucket]) acc[bucket] = []
        acc[bucket].push(food)
        return acc
    }, { Today: [], Yesterday: [], Older: [] })

    return (
        <div className="page active">
            <div className="page-header">
                <h2 className="page-title">Listings History</h2>
                <p className="page-subtitle">Card-based history grouped into Today, Yesterday, and Older.</p>
            </div>

            <div className="history-stack" id="listing-grid">
                {Object.entries(grouped).map(([label, items]) => (
                    <section key={label} className="history-group">
                        <h3 className="history-group-title">{label}</h3>
                        <div className="history-grid-wrap">
                            {items.length ? items.map((food) => (
                                <HistoryCard key={food.id} food={food} />
                            )) : <div className="history-empty">No items in this group.</div>}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
