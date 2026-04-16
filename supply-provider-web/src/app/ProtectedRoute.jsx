import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, ready } = useAuth()
    const location = useLocation()

    if (!ready) {
        return (
            <div className="loading-screen">
                <div className="loading-card">Loading your workspace...</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    return children
}
