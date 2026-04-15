export default function RoleSwitcher({ role, onRoleChange }) {
    const roles = ['provider', 'consumer', 'ngo', 'driver']
    const labels = ['Provider', 'User', 'NGO', 'Driver']

    return (
        <div className="role-switcher">
            {roles.map((nextRole, index) => (
                <button
                    key={nextRole}
                    type="button"
                    className={`role-btn${role === nextRole ? ' active' : ''}`}
                    onClick={() => onRoleChange(nextRole)}
                >
                    {labels[index]}
                </button>
            ))}
        </div>
    )
}
