import { useMemo, useState } from 'react'
import HistoryCard from '../components/HistoryCard'

export default function Listings({ foods }) {
    const [filterDate, setFilterDate] = useState('')
    const [filterTime, setFilterTime] = useState('')

    const visibleFoods = useMemo(() => {
        const sorted = [...foods].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))

        return sorted.filter((food) => {
            const createdAt = new Date(food.createdAt)
            if (filterDate) {
                const dayValue = createdAt.toISOString().slice(0, 10)
                if (dayValue !== filterDate) return false
            }

            if (filterTime) {
                const [hours, minutes] = filterTime.split(':').map(Number)
                const selectedMinutes = hours * 60 + minutes
                const foodMinutes = createdAt.getHours() * 60 + createdAt.getMinutes()
                if (foodMinutes < selectedMinutes) return false
            }

            return true
        })
    }, [foods, filterDate, filterTime])

    return (
        <div className="page active">
            <div className="page-header">
                <h2 className="page-title">Listings History</h2>
                <p className="page-subtitle">Card-based history sorted by date and time.</p>
            </div>

            <div className="listing-filter-bar">
                <div className="listing-filter-field">
                    <label className="listing-filter-label">Date</label>
                    <input
                        className="listing-filter-input"
                        type="date"
                        value={filterDate}
                        onChange={(event) => setFilterDate(event.target.value)}
                    />
                </div>
                <div className="listing-filter-field">
                    <label className="listing-filter-label">Time</label>
                    <input
                        className="listing-filter-input"
                        type="time"
                        value={filterTime}
                        onChange={(event) => setFilterTime(event.target.value)}
                    />
                </div>
                <button
                    type="button"
                    className="btn-add"
                    style={{ marginLeft: 'auto', height: 42 }}
                    onClick={() => {
                        setFilterDate('')
                        setFilterTime('')
                    }}
                >
                    Clear Filters
                </button>
            </div>

            <div className="history-stack" id="listing-grid">
                <div className="history-grid-wrap">
                    {visibleFoods.length ? visibleFoods.map((food) => (
                        <HistoryCard key={food.id} food={food} />
                    )) : <div className="history-empty">No items match the selected date and time filters.</div>}
                </div>
            </div>
        </div>
    )
}
