export default function Tabs({ labels, activeTab, onTabChange }) {
    return (
        <div className="tab-bar">
            {labels.map((label, index) => (
                <div
                    key={label}
                    className={`tab${index === activeTab ? ' active' : ''}`}
                    onClick={() => onTabChange(index)}
                >
                    {label}
                </div>
            ))}
        </div>
    )
}
