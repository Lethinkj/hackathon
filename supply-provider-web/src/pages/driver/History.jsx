export default function DriverHistory({ foods }) {
    return (
        <>
            <div style={{ height: '12px' }} />
            <div className="section-header" style={{ padding: '0 14px 8px' }}><span className="section-title">Completed deliveries</span></div>
            {foods.map((food) => (
                <div key={food.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <span style={{ fontSize: 16 }}>{food.icon}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{food.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{food.prov}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>Delivered</span>
                </div>
            ))}
        </>
    )
}
