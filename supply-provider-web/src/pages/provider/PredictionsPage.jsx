import { useEffect, useState } from 'react'
import PredictionCard from '../../components/ui/PredictionCard'
import { getPredictionsToday, recalculatePredictions } from '../../lib/api'

export default function PredictionsPage() {
    const [items, setItems] = useState([])
    const [meta, setMeta] = useState({
        loggedInProviderName: null,
        predictionForSupplierName: null,
        historicalSource: null,
        matchedSupplierName: null,
    })
    const [loading, setLoading] = useState(true)
    const [working, setWorking] = useState(false)
    const [error, setError] = useState('')

    const load = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await getPredictionsToday()
            setItems(data.items || [])
            setMeta({
                loggedInProviderName: data.loggedInProviderName || null,
                predictionForSupplierName: data.predictionForSupplierName || null,
                historicalSource: data.historicalSource || null,
                matchedSupplierName: data.matchedSupplierName || null,
            })
        } catch (err) {
            setError(err.message || 'Unable to load predictions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    const onRecalculate = async () => {
        setWorking(true)
        setError('')
        try {
            const result = await recalculatePredictions()
            setItems(result.items || [])
            setMeta({
                loggedInProviderName: result.loggedInProviderName || null,
                predictionForSupplierName: result.predictionForSupplierName || null,
                historicalSource: result.historicalSource || null,
                matchedSupplierName: result.matchedSupplierName || null,
            })
        } catch (err) {
            setError(err.message || 'Recalculation failed')
        } finally {
            setWorking(false)
        }
    }

    const totalPredictedQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0)

    const sourceLabelMap = {
        food_logs_provider_specific: 'Provider-specific historical logs',
        food_logs_by_business_type: 'Business-type historical logs (fallback)',
        provider_listings: 'Recent provider listings (fallback)',
    }

    const sourceLabel = sourceLabelMap[meta.historicalSource] || 'Unknown source'

    return (
        <section className="panel glass stack-lg">
            <div className="panel-head spread">
                <h3>Prediction Engine</h3>
                <button type="button" className="btn primary" onClick={onRecalculate} disabled={working}>
                    {working ? 'Recalculating...' : 'Recalculate'}
                </button>
            </div>
            {loading ? <p>Generating AI predictions...</p> : null}
            {error ? <div className="alert error">{error}</div> : null}
            {!loading && !error ? (
                <div className="muted" style={{ marginBottom: 12 }}>
                    Logged in as: <strong>{meta.loggedInProviderName || 'Unknown Provider'}</strong>
                    {' '}| Predicting for: <strong>{meta.predictionForSupplierName || meta.matchedSupplierName || 'Unknown Supplier'}</strong>
                    {' '}| Source: <strong>{sourceLabel}</strong>
                    {' '}| Total predicted surplus qty: <strong>{totalPredictedQty}</strong>
                </div>
            ) : null}
            <div className="prediction-grid-wrap">
                {!loading && !items.length ? <p className="muted">No predictions available.</p> : null}
                {items.map((item, index) => <PredictionCard key={`${item.foodName}-${index}`} item={item} />)}
            </div>
        </section>
    )
}
