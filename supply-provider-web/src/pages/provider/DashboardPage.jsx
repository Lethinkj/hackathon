import { useEffect, useState } from 'react'
import StatCard from '../../components/ui/StatCard'
import TrendBars from '../../components/ui/TrendBars'
import PredictionCard from '../../components/ui/PredictionCard'
import { getDashboardStats, getPredictionsToday } from '../../lib/api'

function formatMoney(value) {
    return `Rs ${Number(value || 0).toLocaleString()}`
}

export default function DashboardPage() {
    const [stats, setStats] = useState(null)
    const [predictions, setPredictions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true

        Promise.all([getDashboardStats(), getPredictionsToday()])
            .then(([statsRes, predictionRes]) => {
                if (!active) return
                setStats(statsRes)
                setPredictions(predictionRes.items || [])
            })
            .catch((err) => {
                if (!active) return
                setError(err.message || 'Failed to load dashboard')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    if (loading) return <div className="panel glass">Loading dashboard analytics...</div>
    if (error) return <div className="alert error">{error}</div>

    const cards = [
        { label: 'Total Listings', value: stats?.totalListings || 0, hint: 'All created listings' },
        { label: 'Predicted Surplus Today', value: `${stats?.predictedSurplusToday || 0} kg`, hint: 'AI forecast for today' },
        { label: 'Pre Orders', value: stats?.preOrders || 0, hint: 'Consumer reservations' },
        { label: 'Donated Count', value: stats?.donatedCount || 0, hint: 'NGO support delivered' },
        { label: 'Revenue Recovered', value: formatMoney(stats?.revenueRecovered || 0), hint: 'Discount + direct recovery' },
        { label: 'Waste Prevented', value: `${stats?.wastePrevented || 0} kg`, hint: 'Saved from disposal' },
    ]

    return (
        <section className="stack-lg">
            <div className="stats-grid">
                {cards.map((card) => <StatCard key={card.label} {...card} />)}
            </div>

            <div className="trend-grid">
                <TrendBars title="Weekly Surplus Trend" items={stats?.weeklySurplusTrend || []} />
                <TrendBars title="Orders Trend" items={stats?.ordersTrend || []} />
                <TrendBars title="Donations Trend" items={stats?.donationsTrend || []} />
            </div>

            <section className="panel glass">
                <div className="panel-head">
                    <h3>Predicted Food Availability</h3>
                </div>
                <div className="prediction-grid-wrap">
                    {predictions.length ? predictions.map((item, index) => (
                        <PredictionCard key={`${item.foodName}-${index}`} item={item} />
                    )) : <p className="muted">No predictions generated yet.</p>}
                </div>
            </section>
        </section>
    )
}
