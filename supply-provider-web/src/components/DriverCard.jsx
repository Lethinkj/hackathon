export default function DriverCard({ name, subtitle, pill, routeStart, routeEnd, routeStartColor = '#1D9E75', routeEndColor = '#E24B4A', children }) {
    return (
        <div className="driver-card">
            <div className="dc-top">
                <div>
                    <div className="dc-name">{name}</div>
                    <div className="dc-sub">{subtitle}</div>
                </div>
                <span className={pill.className}>{pill.label}</span>
            </div>
            <div className="route-row">
                <div className="rdot" style={{ background: routeStartColor }} />
                <span>{routeStart}</span>
                <div className="rline" />
                <div className="rdot" style={{ background: routeEndColor }} />
                <span>{routeEnd}</span>
            </div>
            {children}
        </div>
    )
}
