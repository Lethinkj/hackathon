import { useEffect, useMemo, useState } from 'react'
import {
    closeListing,
    createListing,
    deleteListing,
    getFoodLogHistory,
    getListings,
    updateFoodLogHistory,
    updateListing,
} from '../../lib/api'
import { useAuth } from '../../app/AuthContext'
import { useRealtimeFoods } from '../../hooks/useRealtimeFoods'

const INITIAL_FORM = {
    image: '',
    foodName: '',
    category: 'Meals',
    originalPrice: '100',
    maxDiscountPrice: '40',
    quantity: '10',
    distributionStartTime: '',
    expiryHours: '5',
    autoHourlyReduction: true,
    donationPriority: false,
    notes: '',
}

function toForm(row) {
    return {
        image: row.image || '',
        foodName: row.foodName || '',
        category: row.category || 'Meals',
        originalPrice: String(row.originalPrice || 0),
        maxDiscountPrice: String(row.maxDiscountPrice || 0),
        quantity: String(row.quantity || 1),
        distributionStartTime: row.distributionStartTime || '',
        expiryHours: String(row.expiryHours || 5),
        autoHourlyReduction: Boolean(row.autoHourlyReduction),
        donationPriority: Boolean(row.donationPriority),
        notes: row.notes || '',
    }
}

export default function ListingsPage() {
    const [rows, setRows] = useState([])
    const [historyRows, setHistoryRows] = useState([])
    const [historyMeta, setHistoryMeta] = useState({
        source: '',
        loggedInProviderName: '',
        providerBusinessName: '',
        providerSourceOfFood: '',
        predictionForSupplierName: '',
        matchedSupplierNames: [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [historySavingId, setHistorySavingId] = useState('')
    const [form, setForm] = useState(INITIAL_FORM)
    const [editingId, setEditingId] = useState('')
    const [saving, setSaving] = useState(false)

    const reload = async () => {
        setLoading(true)
        setError('')
        try {
            const [result, history] = await Promise.all([getListings(), getFoodLogHistory()])
            setRows(result.items || [])
            setHistoryRows(history.items || [])
            setHistoryMeta({
                source: history.source || '',
                loggedInProviderName: history.loggedInProviderName || '',
                providerBusinessName: history.providerBusinessName || history.loggedInProviderName || '',
                providerSourceOfFood: history.providerSourceOfFood || '',
                predictionForSupplierName: history.predictionForSupplierName || '',
                matchedSupplierNames: history.matchedSupplierNames || [],
            })
        } catch (err) {
            setError(err.message || 'Failed to fetch listings')
        } finally {
            setLoading(false)
        }
    }

    const { user } = useAuth()
    const providerId = user?.id
    
    // Use real-time hook to auto-update listings
    const { foods: realtimeFoods, loading: realtimeLoading, error: realtimeError, refreshFoods } = useRealtimeFoods(providerId)
    
    useEffect(() => {
        if (realtimeFoods.length > 0) {
            setRows(realtimeFoods)
        }
    }, [realtimeFoods])
    
    useEffect(() => {
        if (providerId) {
            void refreshFoods()
        }
    }, [providerId, refreshFoods])

    const heading = useMemo(() => (editingId ? 'Edit Listing' : 'Add Food Listing'), [editingId])

    const onSubmit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError('')

        const payload = {
            image: form.image,
            foodName: form.foodName,
            category: form.category,
            originalPrice: Number(form.originalPrice),
            maxDiscountPrice: Number(form.maxDiscountPrice),
            quantity: Number(form.quantity),
            distributionStartTime: form.distributionStartTime,
            expiryHours: Number(form.expiryHours),
            autoHourlyReduction: form.autoHourlyReduction,
            donationPriority: form.donationPriority,
            notes: form.notes,
        }

        try {
            if (editingId) {
                await updateListing(editingId, payload)
            } else {
                await createListing(payload)
            }
            setForm(INITIAL_FORM)
            setEditingId('')
            await reload()
        } catch (err) {
            setError(err.message || 'Failed to save listing')
        } finally {
            setSaving(false)
        }
    }

    const onEdit = (row) => {
        setEditingId(row.id)
        setForm(toForm(row))
    }

    const onDelete = async (id) => {
        try {
            await deleteListing(id)
            await reload()
        } catch (err) {
            setError(err.message || 'Delete failed')
        }
    }

    const onClose = async (id) => {
        try {
            await closeListing(id)
            await reload()
        } catch (err) {
            setError(err.message || 'Close failed')
        }
    }

    const onHistoryCellChange = (id, key, value) => {
        setHistoryRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)))
    }

    const onHistorySave = async (row) => {
        try {
            setHistorySavingId(row.id)
            await updateFoodLogHistory(row.id, {
                prepared_qty: Number(row.preparedQty || 0),
                sold_qty: Number(row.soldQty || 0),
                price: Number(row.price || 0),
            })
            await reload()
        } catch (err) {
            setError(err.message || 'Failed to update food log')
        } finally {
            setHistorySavingId('')
        }
    }

    return (
        <section className="stack-lg">
            <form className="panel glass listing-form" onSubmit={onSubmit}>
                <div className="panel-head"><h3>{heading}</h3></div>
                <div className="grid-2">
                    <label>Food Image/Icon URL<input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
                    <label>Food Name<input value={form.foodName} onChange={(e) => setForm({ ...form, foodName: e.target.value })} required /></label>
                    <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></label>
                    <label>Original Price<input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} required /></label>
                    <label>Max Discount Price<input type="number" min="0" value={form.maxDiscountPrice} onChange={(e) => setForm({ ...form, maxDiscountPrice: e.target.value })} required /></label>
                    <label>Quantity<input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></label>
                    <label>Distribution Start Time<input type="datetime-local" value={form.distributionStartTime} onChange={(e) => setForm({ ...form, distributionStartTime: e.target.value })} required /></label>
                    <label>Expiry Hours<input type="number" min="1" max="24" value={form.expiryHours} onChange={(e) => setForm({ ...form, expiryHours: e.target.value })} required /></label>
                </div>

                <div className="toggles">
                    <label><input type="checkbox" checked={form.autoHourlyReduction} onChange={(e) => setForm({ ...form, autoHourlyReduction: e.target.checked })} />Auto hourly price reduction</label>
                    <label><input type="checkbox" checked={form.donationPriority} onChange={(e) => setForm({ ...form, donationPriority: e.target.checked })} />Donation priority</label>
                </div>

                <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></label>

                <div className="actions-row">
                    <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Update Listing' : 'Add Listing')}</button>
                    {editingId ? (
                        <button type="button" className="btn ghost" onClick={() => { setEditingId(''); setForm(INITIAL_FORM) }}>
                            Cancel Edit
                        </button>
                    ) : null}
                </div>
                {error ? <div className="alert error">{error}</div> : null}
            </form>

            <section className="panel glass">
                <div className="panel-head"><h3>Active Listings</h3></div>
                {loading ? <p>Loading listings...</p> : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Food</th>
                                    <th>Qty Left</th>
                                    <th>Original Price</th>
                                    <th>Current Price</th>
                                    <th>Orders</th>
                                    <th>Reserved</th>
                                    <th>Status</th>
                                    <th>Start Time</th>
                                    <th>Expiry</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.foodName}</td>
                                        <td>{row.quantityLeft}</td>
                                        <td>{row.originalPrice}</td>
                                        <td>{row.currentPrice}</td>
                                        <td>{row.orders}</td>
                                        <td>{row.reserved}</td>
                                        <td><span className={`pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
                                        <td>{row.startTime}</td>
                                        <td>{row.expiry}</td>
                                        <td className="actions-cell">
                                            <button type="button" className="btn mini" onClick={() => onEdit(row)}>Edit</button>
                                            <button type="button" className="btn mini" onClick={() => onClose(row.id)}>Close</button>
                                            <button type="button" className="btn mini danger" onClick={() => onDelete(row.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {!rows.length ? (
                                    <tr><td colSpan={10} className="muted">No listings created yet.</td></tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="panel glass">
                <div className="panel-head">
                    <h3>Food Log History (Used for Prediction)</h3>
                </div>
                <p className="muted" style={{ marginTop: 0 }}>
                    Provider: <strong>{historyMeta.providerBusinessName || historyMeta.loggedInProviderName || 'Unknown'}</strong>
                    {' '}| Business Type: <strong>{historyMeta.providerSourceOfFood || 'Unknown'}</strong>
                    {' '}| Predicting for: <strong>{historyMeta.predictionForSupplierName || 'Unknown'}</strong>
                    {' '}| Source: <strong>{historyMeta.source || 'none'}</strong>
                </p>
                {historyMeta.matchedSupplierNames.length ? (
                    <p className="muted" style={{ marginTop: -4 }}>
                        Matched suppliers: <strong>{historyMeta.matchedSupplierNames.join(', ')}</strong>
                    </p>
                ) : null}
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Food</th>
                                <th>Prepared</th>
                                <th>Sold</th>
                                <th>Surplus</th>
                                <th>Price</th>
                                <th>Demand</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyRows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.createdDate}</td>
                                    <td>{row.foodName}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.preparedQty}
                                            onChange={(e) => onHistoryCellChange(row.id, 'preparedQty', e.target.value)}
                                            style={{ width: 90 }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            value={row.soldQty}
                                            onChange={(e) => onHistoryCellChange(row.id, 'soldQty', e.target.value)}
                                            style={{ width: 90 }}
                                        />
                                    </td>
                                    <td>{row.surplusQty}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={row.price}
                                            onChange={(e) => onHistoryCellChange(row.id, 'price', e.target.value)}
                                            style={{ width: 100 }}
                                        />
                                    </td>
                                    <td>{row.demandScore}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn mini"
                                            onClick={() => onHistorySave(row)}
                                            disabled={historySavingId === row.id}
                                        >
                                            {historySavingId === row.id ? 'Saving...' : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!historyRows.length ? (
                                <tr><td colSpan={8} className="muted">No food log rows found for this provider/supplier.</td></tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    )
}
