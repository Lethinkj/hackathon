import { useEffect, useState } from 'react'
import FoodCard from '../components/FoodCard'
import { deleteFoodListing, getProviderFood, subscribeProviderFood } from '../lib/api'

export default function MyListings({ user }) {
    const [foods, setFoods] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => { fetchFoods() }, [])

    useEffect(() => {
        const channel = subscribeProviderFood(user.id, () => {
            fetchFoods()
        })

        return () => {
            channel.unsubscribe()
        }
    }, [user.id])

    const fetchFoods = async () => {
        setLoading(true)
        try {
            const data = await getProviderFood(user.id)
            setFoods(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Remove this listing?')) return
        await deleteFoodListing(id)
        fetchFoods()
    }

    const filtered = filter === 'all' ? foods : foods.filter(f => f.status === filter)

    const counts = {
        all: foods.length,
        available: foods.filter(f => f.status === 'available').length,
        sold: foods.filter(f => f.status === 'sold').length,
        donated: foods.filter(f => f.status === 'donated').length,
    }

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">🍱 My Listings</h2>
                <p className="page-subtitle">Manage all your food listings in one place.</p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {Object.entries(counts).map(([key, count]) => (
                    <button
                        key={key}
                        id={`filter-${key}`}
                        className={`btn ${filter === key ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                        onClick={() => setFilter(key)}
                    >
                        {key === 'all' ? '📋' : key === 'available' ? '🟢' : key === 'sold' ? '💰' : '🤝'}&nbsp;
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
                    </button>
                ))}
                <button id="refresh-listings-btn" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '8px 16px', marginLeft: 'auto' }} onClick={fetchFoods}>
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner" /> Loading listings...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No {filter === 'all' ? '' : filter} listings found</h3>
                    <p>Your {filter} food items will appear here.</p>
                </div>
            ) : (
                <div className="food-grid">
                    {filtered.map(food => (
                        <FoodCard key={food.id} food={food} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
