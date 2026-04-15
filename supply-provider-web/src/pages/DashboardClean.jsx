import FoodCard from '../components/FoodCard'

export default function DashboardClean({ foods, requestsCount, onAddFood, onEditFood, onDeleteFood, onAiAction }) {
    const totalSaved = foods.reduce((sum, food) => sum + Math.max(0, food.orig - food.price) * food.qty, 0)

    return (
        <div className="page active" id="page-dashboard">
            <div className="page-title">Left2Lift</div>
            <div className="page-sub">AI-powered surplus prediction, live pricing & impact reporting</div>

            <div className="ai-banner">
                <div className="ai-banner-left">
                    <div className="ai-label">✦ AI Insight</div>
                    <div className="ai-headline">Tomorrow&apos;s surplus forecast: 42 units expected</div>
                    <div className="ai-body">
                        Based on your Friday patterns, you&apos;ll likely have 18 croissants, 12 sourdough loaves,
                        and 12 assorted pastries left. Consider early discount pricing to maximise recovery before 6pm.
                    </div>
                    <div className="forecast-actions" style={{ marginTop: 12 }}>
                        <button className="action-pill orange" onClick={() => onAiAction('Discount campaign activated!')}>
                            Offer Discount
                        </button>
                        <button className="action-pill teal" onClick={() => onAiAction('NGO partner notified!')}>
                            Donate to NGO
                        </button>
                        <button className="action-pill pink" onClick={() => onAiAction('Quantities adjusted!')}>
                            Reduce Cooking
                        </button>
                    </div>
                </div>
                <div className="ai-img-box">
                    <div className="ai-shimmer" />
                    <div className="ai-img-icon">🤖</div>
                    <div className="ai-img-label">AI-generated insight</div>
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-card orange">
                    <div className="stat-label">Items Live</div>
                    <div className="stat-val" style={{ color: 'var(--orange)' }}>{foods.length}</div>
                    <span className="stat-tag up">+2 today</span>
                </div>
                <div className="stat-card teal">
                    <div className="stat-label">Total Saved</div>
                    <div className="stat-val" style={{ color: 'var(--teal)' }}>₹{totalSaved}</div>
                    <span className="stat-tag up">↑ this week</span>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-label">Active Listings</div>
                    <div className="stat-val" style={{ color: '#7a5a00' }}>{foods.length}</div>
                    <span className="stat-tag warn">2 expiring</span>
                </div>
                <div className="stat-card pink">
                    <div className="stat-label">Requests</div>
                    <div className="stat-val" style={{ color: '#9b3a5a' }}>{requestsCount}</div>
                    <span className="stat-tag warn">Needs action</span>
                </div>
            </div>

            <div className="section-header">
                <div className="section-title">Recent Food Listings</div>
                <button className="btn-add" onClick={onAddFood}>➕ Add Food</button>
            </div>

            <div className="food-list" id="food-list-home">
                {foods.map((food) => (
                    <FoodCard key={food.id} food={food} onEditFood={onEditFood} onDeleteFood={onDeleteFood} />
                ))}
            </div>
        </div>
    )
}
