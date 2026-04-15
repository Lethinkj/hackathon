import AlertCard from '../../components/AlertCard'
import MetricsCard from '../../components/MetricsCard'
import { getUrgentFoods, getWatchFoods } from '../../utils/foodStats'

export default function Alerts({ foods }) {
    const urgentFoods = getUrgentFoods(foods)
    const watchFoods = getWatchFoods(foods)

    return (
        <>
            <div className="hero-strip">
                <div className="hero-greeting">Asha Foundation</div>
                <div className="hero-title">Real-time food alerts</div>
            </div>
            <div className="metrics-row">
                <MetricsCard value={urgentFoods.length} label="Urgent" />
                <MetricsCard value={watchFoods.length} label="Watch" />
                <MetricsCard value="2" label="Drivers ready" />
            </div>
            <div style={{ height: '10px' }} />
            {urgentFoods.length ? <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title" style={{ color: '#A32D2D' }}>Urgent — donate now</span></div> : null}
            {urgentFoods.map((food) => (
                <AlertCard
                    key={food.id}
                    tone="red"
                    title={food.name}
                    subtitle={`${food.prov} · ${food.qty} units · ${Math.max(0, Math.floor((food.expiresAt - Date.now()) / 1000 / 60))}m left`}
                    actions={<><button type="button" className="btn-xs btn-accept">Accept Pickup</button><button type="button" className="btn-xs btn-dec">Skip</button></>}
                />
            ))}
            {watchFoods.length ? <div className="section-header" style={{ padding: '8px 14px 8px' }}><span className="section-title" style={{ color: '#854F0B' }}>Watch — ending soon</span></div> : null}
            {watchFoods.map((food) => (
                <AlertCard
                    key={food.id}
                    tone="amber"
                    title={food.name}
                    subtitle={`${food.prov} · ${food.qty} units · ${Math.max(0, Math.floor((food.expiresAt - Date.now()) / 1000 / 60))}m left`}
                    actions={<button type="button" className="btn-xs btn-accept">Pre-alert team</button>}
                />
            ))}
            {!urgentFoods.length && !watchFoods.length ? <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-text-secondary)', fontSize: 13 }}>No alerts right now<br /><span style={{ fontSize: 11 }}>You'll be notified automatically</span></div> : null}
        </>
    )
}
