import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FoodCard from '../components/FoodCard'
import { deleteFoodListing, getProviderFood, getProviderStats, subscribeProviderFood } from '../lib/api'

export default function Dashboard({ user }) {
    const [stats, setStats] = useState(null)
    const [foods, setFoods] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()

        const channel = subscribeProviderFood(user.id, () => {
            fetchData()
        })

        return () => {
            channel.unsubscribe()
        }
    }, [user.id])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statsData, foodsData] = await Promise.all([
                getProviderStats(user.id),
                getProviderFood(user.id),
            ])
            setStats(statsData)
            setFoods(Array.isArray(foodsData) ? foodsData : [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Remove this listing?')) return
        await deleteFoodListing(id)
        fetchData()
    }

    const activeListings = foods.filter(f => f.status === 'available')

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Welcome back, {user.name?.split(' ')[0]} 👋</h2>
                <p className="page-subtitle">Here's your food surplus overview for today.</p>
            </div>

            <div className="pitch-banner">
                <strong>"SupplyLink</strong> transforms surplus food into opportunity by connecting providers,
                consumers, and NGOs in real-time — reducing waste while feeding communities."
            </div>

            {/* Stats */}
            {loading ? (
                <div className="loading"><div className="spinner" /> Loading stats...</div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-card indigo">
                        <div className="stat-icon">📋</div>
                        <div className="stat-value">{stats?.totalListings ?? 0}</div>
                        <div className="stat-label">Total Listings</div>
                    </div>
                    <div className="stat-card cyan">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{stats?.activeListings ?? 0}</div>
                        <div className="stat-label">Active Now</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{stats?.soldItems ?? 0}</div>
                        <div className="stat-label">Items Sold</div>
                    </div>
                    <div className="stat-card amber">
                        <div className="stat-icon">🤝</div>
                        <div className="stat-value">{stats?.donatedItems ?? 0}</div>
                        <div className="stat-label">Donated to NGOs</div>
                    </div>
                </div>
            )}

            {/* Quick Action */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <button id="quick-add-food-btn" className="btn btn-primary" onClick={() => navigate('/add-food')}>
                    ➕ Add Food Listing
                </button>
                <button id="refresh-btn" className="btn btn-secondary" onClick={fetchData}>
                    🔄 Refresh
                </button>
            </div>

            {/* Active Listings */}
            <div className="section-header">
                <h3 className="section-title">🟢 Active Listings ({activeListings.length})</h3>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner" /> Loading listings...</div>
            ) : activeListings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🍱</div>
                    <h3>No active listings</h3>
                    <p>Add surplus food to start reducing waste and earning.</p>
                    <button id="empty-add-btn" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/add-food')}>
                        ➕ Add Your First Listing
                    </button>
                </div>
            ) : (
                <div className="food-grid">
                    {activeListings.map(food => (
                        <FoodCard key={food.id} food={food} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
