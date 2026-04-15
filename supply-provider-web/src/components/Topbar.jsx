export default function Topbar({ title, subtitle }) {
    return (
        <div className="topbar">
            <div className="logo-wrap">
                <div className="logo-icon">
                    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="9" cy="9" r="7" fill="#5D3FD3" />
                        <path d="M5 9.5 Q9 5 13 9.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <circle cx="9" cy="12" r="1.5" fill="#fff" />
                    </svg>
                </div>
                <div>
                    <div className="logo-text">Left2Lift</div>
                    <div className="logo-sub">Provider dashboard</div>
                </div>
            </div>
            <div className="topbar-copy">
                <div className="topbar-title">{title}</div>
                <div className="topbar-subtitle">{subtitle}</div>
            </div>
        </div>
    )
}
