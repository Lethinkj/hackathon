import BrandLogo from './BrandLogo'

export default function Header({ providerName = 'Provider', onSignOut }) {
    return (
        <div className="header">
            <div className="header-brand">
                <BrandLogo size={40} className="header-logo" title="Provider portal logo" />
            </div>
            <div className="header-right">
                <div className="live-badge"><span className="live-dot" /> Live sync</div>
                <div className="header-avatar" title={providerName}>{providerName.slice(0, 2).toUpperCase()}</div>
                {onSignOut ? (
                    <button type="button" onClick={onSignOut} style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', borderRadius: 999, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                        Sign out
                    </button>
                ) : null}
            </div>
        </div>
    )
}
