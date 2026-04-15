export default function Earnings() {
    return (
        <>
            <div className="impact-strip" style={{ paddingTop: '14px' }}>
                <div className="impact-tile"><div className="it-val">₹1,240</div><div className="it-label">This week</div></div>
                <div className="impact-tile"><div className="it-val">23</div><div className="it-label">Deliveries</div></div>
                <div className="impact-tile"><div className="it-val">18kg</div><div className="it-label">Food saved</div></div>
            </div>
            <div className="section-header" style={{ padding: '4px 14px 8px' }}><span className="section-title">Breakdown</span></div>
            {[
                ['NGO pickups (12)', '₹540', '#1D9E75'],
                ['Consumer deliveries (8)', '₹480', '#5D3FD3'],
                ['Rapido bonus (3)', '₹220', '#BA7517'],
            ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                    <span style={{ color, fontWeight: 500 }}>{value}</span>
                </div>
            ))}
        </>
    )
}
