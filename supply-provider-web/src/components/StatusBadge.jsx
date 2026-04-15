const STATUS_MAP = {
    sold: { label: 'SOLD', className: 'sold' },
    donated: { label: 'DONATED', className: 'donated' },
    wasted: { label: 'WASTED', className: 'wasted' },
}

export default function StatusBadge({ status }) {
    const normalized = String(status || '').toLowerCase()
    const config = STATUS_MAP[normalized] || { label: 'ACTIVE', className: 'active' }

    return <span className={`status-badge ${config.className}`}>{config.label}</span>
}