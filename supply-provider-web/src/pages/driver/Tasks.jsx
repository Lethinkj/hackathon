import DriverCard from '../../components/DriverCard'
import MetricsCard from '../../components/MetricsCard'

export default function Tasks() {
    return (
        <>
            <div className="hero-strip">
                <div className="hero-greeting">Hey Ravi, ready to roll?</div>
                <div className="hero-title">3 pickups available near you</div>
            </div>
            <div className="metrics-row">
                <MetricsCard value="₹180" label="Today" />
                <MetricsCard value="4.9" label="Rating" />
                <MetricsCard value="3" label="Open tasks" />
            </div>
            <div style={{ height: '10px' }} />
            <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title">Available pickups</span></div>
            <DriverCard
                name="Event Snack Platter"
                subtitle="NGO delivery · 1.8 km · Asha Foundation"
                pill={{ className: 'earn-pill', label: '+₹60' }}
                routeStart="Grand Hall Events, Anna Nagar"
                routeEnd="Asha Foundation"
            >
                <div className="btn-row"><button type="button" className="btn-xs btn-accept">Accept</button><button type="button" className="btn-xs btn-dec">Skip</button></div>
            </DriverCard>
            <DriverCard
                name="Biryani Tray — restaurant"
                subtitle="Consumer order · 2.2 km via Rapido"
                pill={{ className: 'rapido-pill', label: 'Rapido' }}
                routeStart="Spice Route Hostel"
                routeEnd="Customer, T. Nagar"
            >
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Rapido linked · +₹45 bonus on delivery</div>
                <div className="btn-row"><button type="button" className="btn-xs btn-accept">Accept via Rapido</button><button type="button" className="btn-xs btn-dec">Skip</button></div>
            </DriverCard>
            <DriverCard
                name="Bakery Surprise Box ×8"
                subtitle="Consumer order · 0.9 km"
                pill={{ className: 'earn-pill', label: '+₹35' }}
                routeStart="Golden Crust Bakery"
                routeEnd="Customer, Adyar"
            >
                <div className="btn-row"><button type="button" className="btn-xs btn-accept">Accept</button><button type="button" className="btn-xs btn-dec">Skip</button></div>
            </DriverCard>
        </>
    )
}
