export default function AddListing() {
    return (
        <>
            <div className="hero-strip">
                <div className="hero-greeting">Golden Crust Bakery</div>
                <div className="hero-title">List your surplus in 30 seconds</div>
            </div>
            <div className="metrics-row">
                <div className="mc"><div className="mc-val" style={{ color: '#5D3FD3' }}>68%</div><div className="mc-label">Market rate</div></div>
                <div className="mc"><div className="mc-val" style={{ color: '#1D9E75' }}>₹3.2k</div><div className="mc-label">Revenue</div></div>
                <div className="mc"><div className="mc-val">42kg</div><div className="mc-label">Saved</div></div>
            </div>
            <div style={{ height: '10px' }} />
            <div className="form-card">
                <label className="form-label">Food name</label>
                <input className="form-input" placeholder="e.g. Bread, Biryani, Snack box" />
                <div className="form-row">
                    <div>
                        <label className="form-label">Quantity</label>
                        <input className="form-input" type="number" placeholder="20" />
                    </div>
                    <div>
                        <label className="form-label">Base price (₹)</label>
                        <input className="form-input" type="number" placeholder="150" />
                    </div>
                </div>
                <label className="form-label">Expires at</label>
                <input className="form-input" type="time" value="21:30" readOnly />
                <div className="price-preview">
                    <div className="pp-title">Smart pricing preview</div>
                    <div className="pp-row"><span>2h left</span><span>₹150</span></div>
                    <div className="pp-row"><span>1h left</span><span>₹100</span></div>
                    <div className="pp-row"><span>30 min left</span><span>₹55</span></div>
                    <div className="pp-row"><span>10 min left</span><span style={{ color: '#A32D2D' }}>Auto-donate</span></div>
                </div>
            </div>
            <div className="form-card" style={{ marginTop: 0 }}>
                <div className="toggle-row" style={{ border: 'none', paddingTop: 0 }}>
                    <div><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Mystery Box mode</div><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Bundle randomly, lower price</div></div>
                    <label className="toggle"><input type="checkbox" /><span className="sl" /></label>
                </div>
                <div className="toggle-row">
                    <div><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>NGO auto-alert</div><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Notify NGOs when critical</div></div>
                    <label className="toggle"><input type="checkbox" defaultChecked /><span className="sl" /></label>
                </div>
                <div className="toggle-row">
                    <div><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Enable Rapido pickup</div><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>For restaurant-size orders</div></div>
                    <label className="toggle"><input type="checkbox" /><span className="sl" /></label>
                </div>
            </div>
            <div style={{ padding: '0 14px 16px' }}><button type="button" className="cta-btn">List Surplus Now ↗</button></div>
        </>
    )
}
