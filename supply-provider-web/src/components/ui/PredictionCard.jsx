export default function PredictionCard({ item }) {
    return (
        <article className="prediction-card glass">
            <div className="prediction-head">
                <h4>{item.foodName}</h4>
                <span>{item.confidence}% confidence</span>
            </div>
            <dl className="prediction-grid">
                <div>
                    <dt>Qty</dt>
                    <dd>{item.qty}</dd>
                </div>
                <div>
                    <dt>Time</dt>
                    <dd>{item.availableTime}</dd>
                </div>
                <div>
                    <dt>Suggested Price</dt>
                    <dd>{item.suggestedPrice}</dd>
                </div>
                <div>
                    <dt>Category</dt>
                    <dd>{item.category}</dd>
                </div>
            </dl>
        </article>
    )
}
