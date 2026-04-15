import BarChart from '../../components/BarChart'
import DonutChart from '../../components/DonutChart'
import MetricsCard from '../../components/MetricsCard'
import PredictionStatCard from '../../components/PredictionStatCard'
import TrendLineChart from '../../components/TrendLineChart'

function toChartPoints(rows, valueKey = 'value') {
    return rows.map((item) => ({
        label: item.label || item.weekday_name || item.month_name || item.food_name || item.festival_name,
        value: Number(item[valueKey] ?? item.avg_surplus ?? item.total_waste ?? item.predicted_surplus ?? 0),
        color: item.color,
    }))
}

export default function Impact({ foods, prediction, analytics, seasonal }) {
    const currentPrediction = prediction?.current_prediction || prediction || null
    const weeklyTrend = toChartPoints(analytics?.weeklyTrend || [], 'avg_surplus')
    const festivalAnalysis = toChartPoints(analytics?.festivalAnalysis || [], 'avg_surplus')
    const wasteCategories = toChartPoints(analytics?.topWaste || [], 'total_waste')
    const monthlyTrend = toChartPoints(seasonal?.monthlyTrend || [], 'avg_surplus')

    const lowDemandScore = currentPrediction?.feature_breakdown?.demand_factor
        ? Math.round((1 - currentPrediction.feature_breakdown.demand_factor / 1.2) * 100)
        : 0

    const wasteReductionScore = foods.length
        ? Math.min(100, Math.round((foods.filter((food) => food.status === 'sold' || food.status === 'donated').length / foods.length) * 100))
        : 0

    return (
        <>
            <div className="hero-strip">
                <div className="hero-greeting">AI surplus intelligence</div>
                <div className="hero-title">Forecast what will become waste tomorrow</div>
            </div>

            <div className="metrics-row">
                <MetricsCard value={`${currentPrediction?.prediction_date || '—'}`} label="Prediction date" dotColor="#5D3FD3" />
                <MetricsCard value={`${currentPrediction?.predicted_surplus ?? 0}`} label="Predicted surplus" />
                <MetricsCard value={`${currentPrediction?.confidence_score ?? 0}%`} label="Confidence" />
            </div>

            <div className="section" style={{ paddingTop: 14 }}>
                <div className="prediction-grid">
                    <PredictionStatCard
                        label="Suggested action"
                        value={currentPrediction?.suggested_action || 'Monitor Demand'}
                        hint="Auto generated from Node.js statistical model"
                        tone="indigo"
                    />
                    <PredictionStatCard
                        label="Waste reduction score"
                        value={`${wasteReductionScore}%`}
                        hint="Share of items already reduced through sell/donate flows"
                        tone="emerald"
                    />
                    <PredictionStatCard
                        label="Low demand alert"
                        value={`${lowDemandScore}%`}
                        hint="Higher means tomorrow’s demand is likely softer"
                        tone="amber"
                    />
                </div>
            </div>

            <div className="chart-grid">
                <TrendLineChart
                    title="Weekly surplus trend"
                    subtitle="7-day moving signal based on historical food logs"
                    data={weeklyTrend.length ? weeklyTrend : monthlyTrend}
                    color="#5D3FD3"
                />
                <BarChart
                    title="Festival surplus analysis"
                    subtitle="Average surplus around key Indian festivals"
                    data={festivalAnalysis.length ? festivalAnalysis : [
                        { label: 'Pongal', value: 12, color: '#5D3FD3' },
                        { label: 'Diwali', value: 28, color: '#EF9F27' },
                        { label: 'Ramzan', value: 14, color: '#1D9E75' },
                    ]}
                />
                <DonutChart
                    title="Top waste categories"
                    subtitle="Where surplus losses are concentrated"
                    data={wasteCategories.length ? wasteCategories.slice(0, 5) : [
                        { label: 'Rice', value: 8, color: '#5D3FD3' },
                        { label: 'Bakery', value: 5, color: '#EF9F27' },
                        { label: 'Snacks', value: 4, color: '#1D9E75' },
                    ]}
                />
            </div>

            <div className="section" style={{ paddingTop: 2 }}>
                <div className="section-header" style={{ padding: '0 0 8px' }}>
                    <span className="section-title">Suggested actions</span>
                </div>
                <div className="insight-stack">
                    <div className="insight-card">
                        <div className="insight-label">If predicted surplus &gt; 30</div>
                        <div className="insight-value">Offer Discount</div>
                    </div>
                    <div className="insight-card">
                        <div className="insight-label">If predicted surplus &gt; 50</div>
                        <div className="insight-value">Donate to NGO</div>
                    </div>
                    <div className="insight-card">
                        <div className="insight-label">If predicted surplus &gt; 80</div>
                        <div className="insight-value">Reduce Cooking Quantity</div>
                    </div>
                </div>
            </div>

            <div className="section" style={{ paddingTop: 0 }}>
                <div className="section-header" style={{ padding: '0 0 8px' }}>
                    <span className="section-title">Historical reports</span>
                </div>
                <div className="history-list">
                    {(analytics?.latestPredictions || seasonal?.latestPredictions || []).slice(0, 5).map((item) => (
                        <div className="history-row" key={`${item.supplier_id}-${item.prediction_date}-${item.created_at}`}>
                            <div>
                                <div className="history-title">{item.suggested_action}</div>
                                <div className="history-sub">{item.prediction_date} · {item.confidence_score}% confidence</div>
                            </div>
                            <strong>₹{Math.round(item.predicted_surplus || 0)}</strong>
                        </div>
                    ))}
                    {!(analytics?.latestPredictions || seasonal?.latestPredictions || []).length ? (
                        <div className="history-empty">Run a prediction to populate historical reports.</div>
                    ) : null}
                </div>
            </div>
        </>
    )
}
