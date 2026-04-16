export default function StatCard({ label, value, hint }) {
    return (
        <article className="stat-card glass">
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
            <p className="stat-hint">{hint}</p>
        </article>
    )
}
