export default function Header() {
    return (
        <div className="header">
            <div className="header-brand">
                <div className="brand-icon">🌱</div>
                <div>
                    <div className="brand-name">Left2Lift</div>
                    <div className="brand-sub">Provider Portal</div>
                </div>
            </div>
            <div className="header-right">
                <div className="live-badge"><span className="live-dot" /> Live sync</div>
                <div className="header-avatar">GC</div>
            </div>
        </div>
    )
}
