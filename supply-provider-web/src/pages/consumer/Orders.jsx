import MetricsCard from '../../components/MetricsCard'
import AlertCard from '../../components/AlertCard'

export default function Orders() {
    return (
        <>
            <div className="metrics-row" style={{ paddingTop: '14px' }}>
                <MetricsCard value="₹340" label="Saved" dotColor="#5D3FD3" />
                <MetricsCard value="4" label="Orders" />
                <MetricsCard value="1.2kg" label="Waste cut" />
            </div>
            <div className="section-header" style={{ padding: '12px 14px 8px' }}><span className="section-title">Active order</span></div>
            <AlertCard
                tone="blue"
                title="Idli + Sambar Pack — Reserved"
                subtitle="Pickup ready · Saravana Bhavan · 8:45 PM"
                actions={<button type="button" className="btn-xs btn-accept">View QR</button>}
            />
        </>
    )
}
