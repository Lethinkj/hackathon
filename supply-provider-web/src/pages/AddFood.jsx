import { useEffect, useMemo, useState } from 'react'

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
    return {
        name: food.name || '',
        qty: food.qty || '',
        type: food.type || 'Veg',
        orig: food.orig || '',
        expiryMinutes: food.expiryMinutes || 120,
        discountTriggerMinutes: food.discountTriggerMinutes || 60,
        ngoTriggerMinutes: food.ngoTriggerMinutes || 30,
        cat: 'Bakery',
        mode: food.mode || 'discount',
        mystery: Boolean(food.mystery),
        ngo: true,
        auto: true,
        bulk: false,
        allergy: false,
        self: false,
    }
}

function normalizeFood(form) {
    return {
        name: form.name.trim(),
        qty: Number(form.qty || 1),
        type: form.type,
        orig: Number(form.orig || 10),
        price: Number(form.orig || 10),
        basePrice: Number(form.orig || 10),
        expiryMinutes: Number(form.expiryMinutes || 120),
        discountTriggerMinutes: Number(form.discountTriggerMinutes || 60),
        ngoTriggerMinutes: Number(form.ngoTriggerMinutes || 30),
        mode: form.mode === 'both' ? 'discount' : form.mode,
        mystery: form.mystery,
    }
}

export default function AddFood({ inPage = false, initialFood = null, onSubmitFood, onClose }) {
    const [form, setForm] = useState(() => toFormState(initialFood))

    useEffect(() => {
        setForm(toFormState(initialFood))
    }, [initialFood])

    const isEdit = useMemo(() => Boolean(initialFood), [initialFood])

    const submit = () => {
        if (!form.name.trim()) return

        onSubmitFood(normalizeFood(form))
        if (!isEdit) {
            setForm(initialFormState)
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
                <button className="btn-submit" onClick={submit}>{isEdit ? 'Save Changes' : '🚀 Publish Listing'}</button>
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
