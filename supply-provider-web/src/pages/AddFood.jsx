import { useEffect, useMemo, useState } from 'react'
import { insertFoodListing, updateFoodListing } from '../lib/api'

const initialFormState = {
    name: '',
    qty: '',
    type: 'Veg',
    orig: '',
    expiryMinutes: 120,
    discountTriggerMinutes: 60,
    ngoTriggerMinutes: 30,
    cat: 'Bakery',
    mode: 'discount',
    mystery: false,
    ngo: true,
    auto: true,
    bulk: false,
    allergy: false,
    self: false,
}

function toFormState(food) {
    if (!food) return initialFormState

    const expiryTime = food.expiry_time || food.expiryTime
    const createdAt = food.created_at || food.createdAt
    const expiryMinutes = expiryTime && createdAt ? Math.max(1, Math.round((new Date(expiryTime).getTime() - new Date(createdAt).getTime()) / 60000)) : food.expiryMinutes || 120

    return {
        name: food.name || '',
        qty: food.qty || food.quantity || '',
        type: food.type || food.food_type || 'Veg',
        orig: food.orig || food.base_price || food.basePrice || '',
        expiryMinutes,
        discountTriggerMinutes: food.discountTriggerMinutes || food.discount_time || 60,
        ngoTriggerMinutes: food.ngoTriggerMinutes || food.ngo_time || 30,
        cat: 'Bakery',
        mode: food.mode || food.listing_mode || 'discount',
        mystery: Boolean(food.mystery),
        ngo: true,
        auto: true,
        bulk: false,
        allergy: false,
        self: false,
    }
}

function normalizeFood(form) {
    const basePrice = Number(form.orig || 10)
    const expiryMinutes = Number(form.expiryMinutes || 120)
    const discountTriggerMinutes = Number(form.discountTriggerMinutes || 60)
    const ngoTriggerMinutes = Number(form.ngoTriggerMinutes || 30)

    return {
        name: form.name.trim(),
        quantity: Number(form.qty || 1),
        food_type: form.type,
        base_price: basePrice,
        current_price: basePrice,
        expiry_time: new Date(Date.now() + expiryMinutes * 60000).toISOString(),
        discount_time: discountTriggerMinutes,
        ngo_time: ngoTriggerMinutes,
        listing_mode: form.mode === 'both' ? 'discount' : form.mode,
        status: 'SELL',
    }
}

export default function AddFood({ inPage = false, providerId, initialFood = null, onSaved, onClose }) {
    const [form, setForm] = useState(() => toFormState(initialFood))
    const [loading, setLoading] = useState(false)
    const isEdit = useMemo(() => Boolean(initialFood), [initialFood])

    useEffect(() => {
        setForm(toFormState(initialFood))
    }, [initialFood])

    const submit = async () => {
        if (!form.name.trim()) return

        const payload = normalizeFood(form)
        setLoading(true)

        try {
            if (isEdit && initialFood?.id) {
                await updateFoodListing(initialFood.id, {
                    name: payload.name,
                    quantity: payload.quantity,
                    food_type: payload.food_type,
                    base_price: payload.base_price,
                    current_price: payload.base_price,
                    expiry_time: payload.expiry_time,
                    discount_time: payload.discount_time,
                    ngo_time: payload.ngo_time,
                    listing_mode: payload.listing_mode,
                    status: 'SELL',
                })
            } else {
                await insertFoodListing({
                    ...payload,
                    provider_id: providerId,
                })
            }

            onSaved?.(payload)
            if (!isEdit) {
                setForm(initialFormState)
            }
        } finally {
            setLoading(false)
        }
    }

    const formBody = (
        <>
            <div className="modal-header" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div className="modal-title">{isEdit ? '✏️ Edit Food Item' : '➕ Add Food Item'}</div>
            </div>
            <div style={{ marginTop: 16 }}>
                <div className="form-group">
                    <label className="form-label">Item Name</label>
                    <input className="form-input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Sourdough Loaf" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Quantity</label>
                        <input className="form-input" type="number" value={form.qty} onChange={(event) => setForm((prev) => ({ ...prev, qty: event.target.value }))} placeholder="e.g. 10" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-select" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                            <option>Veg</option>
                            <option>Non-veg</option>
                            <option>Vegan</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Base Price (₹)</label>
                        <input className="form-input" type="number" value={form.orig} onChange={(event) => setForm((prev) => ({ ...prev, orig: event.target.value }))} placeholder="₹" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Expiry Time (minutes)</label>
                        <input className="form-input" type="number" value={form.expiryMinutes} onChange={(event) => setForm((prev) => ({ ...prev, expiryMinutes: event.target.value }))} placeholder="e.g. 120" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Discount Trigger Time (minutes)</label>
                        <input className="form-input" type="number" value={form.discountTriggerMinutes} onChange={(event) => setForm((prev) => ({ ...prev, discountTriggerMinutes: event.target.value }))} placeholder="e.g. 60" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">NGO Trigger Time (minutes)</label>
                        <input className="form-input" type="number" value={form.ngoTriggerMinutes} onChange={(event) => setForm((prev) => ({ ...prev, ngoTriggerMinutes: event.target.value }))} placeholder="e.g. 30" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.cat} onChange={(event) => setForm((prev) => ({ ...prev, cat: event.target.value }))}>
                        <option>Bakery</option>
                        <option>Rice/Biryani</option>
                        <option>Snacks</option>
                        <option>Beverages</option>
                        <option>Meals</option>
                        <option>Sweets</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Listing Mode</label>
                    <select className="form-select" value={form.mode} onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}>
                        <option value="discount">Discount Sale</option>
                        <option value="donate">Donate to NGO</option>
                        <option value="both">Both</option>
                    </select>
                </div>
                <div className="price-pool-info">
                    💡 <strong>Price Pooling:</strong> Set your listed price. Our AI adjusts dynamically as time passes to maximise sell-through. You keep 85% of sale.
                </div>
                <div className="section-divider">Options & Toggles</div>
                <div className="toggle-row">
                    <div className="toggle-info">
                        <div className="toggle-title">Mystery Box</div>
                        <div className="toggle-desc">Hide exact contents — often boosts conversion</div>
                    </div>
                    <label className="switch"><input type="checkbox" checked={form.mystery} onChange={(event) => setForm((prev) => ({ ...prev, mystery: event.target.checked }))} /><span className="slider-sw" /></label>
                </div>
                <div className="toggle-row">
                    <div className="toggle-info">
                        <div className="toggle-title">Allow NGO Pickup</div>
                        <div className="toggle-desc">Let NGO partners claim this listing</div>
                    </div>
                    <label className="switch"><input type="checkbox" checked={form.ngo} onChange={(event) => setForm((prev) => ({ ...prev, ngo: event.target.checked }))} /><span className="slider-sw" /></label>
                </div>
                <div className="toggle-row">
                    <div className="toggle-info">
                        <div className="toggle-title">Auto Price Drop</div>
                        <div className="toggle-desc">AI reduces price as expiry approaches</div>
                    </div>
                    <label className="switch"><input type="checkbox" checked={form.auto} onChange={(event) => setForm((prev) => ({ ...prev, auto: event.target.checked }))} /><span className="slider-sw" /></label>
                </div>
                <div className="toggle-row">
                    <div className="toggle-info">
                        <div className="toggle-title">Bulk Order Allowed</div>
                        <div className="toggle-desc">Enable quantity-based discounts</div>
                    </div>
                    <label className="switch"><input type="checkbox" checked={form.bulk} onChange={(event) => setForm((prev) => ({ ...prev, bulk: event.target.checked }))} /><span className="slider-sw" /></label>
                </div>
                <div className="toggle-row">
                    <div className="toggle-info">
                        <div className="toggle-title">Allergen Alert</div>
                        <div className="toggle-desc">Flag this item for common allergens</div>
                    </div>
                    <label className="switch"><input type="checkbox" checked={form.allergy} onChange={(event) => setForm((prev) => ({ ...prev, allergy: event.target.checked }))} /><span className="slider-sw" /></label>
                </div>
                <div className="toggle-row">
                    <div className="toggle-info">
                        <div className="toggle-title">Self Pickup Only</div>
                        <div className="toggle-desc">No delivery — customer must collect</div>
                    </div>
                    <label className="switch"><input type="checkbox" checked={form.self} onChange={(event) => setForm((prev) => ({ ...prev, self: event.target.checked }))} /><span className="slider-sw" /></label>
                </div>
                <button className="btn-submit" onClick={submit} disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Save Changes' : '🚀 Publish Listing'}</button>
            </div>
        </>
    )

    if (inPage) {
        return (
            <div className="page active" id="page-add">
                <div className="page-title">Add Food</div>
                <div className="page-sub" style={{ marginBottom: 20 }}>List surplus items with smart pricing & options</div>
                <div className="addpage" id="add-form-inline">
                    <div className="modal">{formBody}</div>
                </div>
            </div>
        )
    }

    return (
        <>
            {formBody}
            <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
        </>
    )
}
