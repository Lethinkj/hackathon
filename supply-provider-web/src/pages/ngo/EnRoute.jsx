import AlertCard from '../../components/AlertCard'

export default function EnRoute() {
    return (
        <>
            <div style={{ height: '12px' }} />
            <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title">En route</span></div>
            <AlertCard
                tone="blue"
                title="Event Snack Platter — en route"
                subtitle="Driver: Ravi K. · ETA 12 min"
                actions={<button type="button" className="btn-xs btn-accept">Track</button>}
            />
        </>
    )
}
