import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider } from './app/AuthContext'
import ProtectedRoute from './app/ProtectedRoute'
import AppShell from './layout/AppShell'
import AuthPage from './pages/auth/AuthPage'
import DashboardPage from './pages/provider/DashboardPage'
import ListingsPage from './pages/provider/ListingsPage'
import PredictionsPage from './pages/provider/PredictionsPage'

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                        element={(
                            <ProtectedRoute>
                                <AppShell />
                            </ProtectedRoute>
                        )}
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/listings" element={<ListingsPage />} />
                        <Route path="/predictions" element={<PredictionsPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}
