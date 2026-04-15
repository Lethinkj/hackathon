import FoodCard from '../../components/FoodCard'
import MetricsCard from '../../components/MetricsCard'
import { getAverageSavings, getMarketRate, getTotalQuantity } from '../../utils/foodStats'

export default function ConsumerHome({ foods, liveSurplus, prediction }) {
    const marketRate = getMarketRate(foods)
    const totalQuantity = getTotalQuantity(foods)
    const averageSaved = getAverageSavings(foods)
    const currentPrediction = prediction?.current_prediction || prediction?.latest_prediction || null
    const liveCount = liveSurplus?.count ?? foods.length

    return (
        <>
            <div className="hero-strip">
                <div className="hero-greeting">Good evening, Arjun</div>
                <div className="hero-title">What's available near you?</div>
            </div>
            <div className="prediction-banner">
                <div>
                    <div className="prediction-banner-label">AI prediction for tomorrow</div>
                    <div className="prediction-banner-value">
                        {currentPrediction?.suggested_action || 'Monitor Demand'} · {currentPrediction?.predicted_surplus ?? 0} surplus units
                    </div>
                </div>
                <div className="prediction-banner-score">{currentPrediction?.confidence_score ?? 0}% confidence</div>
            </div>
            <div className="metrics-row metrics">
                <MetricsCard value={`${marketRate}%`} label="Good Rate" dotColor="#5D3FD3" />
                <MetricsCard value={Math.max(totalQuantity, liveCount)} label="Items live" />
                <MetricsCard value={`₹${averageSaved}`} label="Avg saved" />
            </div>
            <div className="filter-row" style={{ paddingTop: '4px' }}>
                <span className="filter-chip active">All</span>
                <span className="filter-chip">Veg</span>
                <span className="filter-chip">Under ₹80</span>
                <span className="filter-chip">Mystery Box</span>
                <span className="filter-chip">Expiring soon</span>
            </div>
            <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title">Hot picks</span><span className="see-all">See all</span></div>
            <div className="cards-grid">{foods.map((food) => <FoodCard key={food.id} food={food} />)}</div>
        </>
    )
}
