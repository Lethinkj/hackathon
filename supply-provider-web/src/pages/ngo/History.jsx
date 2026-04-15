export default function History({ foods }) {
    return (
        <>
            <div className="impact-strip" style={{ paddingTop: '14px' }}>
                <div className="impact-tile"><div className="it-val">67</div><div className="it-label">Pickups</div></div>
                <div className="impact-tile"><div className="it-val">28kg</div><div className="it-label">Food saved</div></div>
                <div className="impact-tile"><div className="it-val">210</div><div className="it-label">People fed</div></div>
            </div>
            <div className="section-header" style={{ padding: '4px 14px 8px' }}><span className="section-title">Recent donations</span></div>
            {foods.map((food) => (
                <div key={food.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-primary)' }}>{food.icon} {food.name}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{food.qty} units received</span>
                </div>
            ))}
        </>
    )
}
