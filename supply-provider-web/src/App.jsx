import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import SidebarClean from './components/SidebarClean'
import Modal from './components/Modal'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Listings from './pages/Listings'
import RequestsClean from './pages/RequestsClean'
import AddFood from './pages/AddFood'

const initialFoods = [
    { id: 1, emoji: '🥐', name: 'Bakery Surprise Box', qty: 8, type: 'Veg', price: 31, orig: 120, mode: 'discount', time: 30, source: 'Golden Crust Bakery', mystery: true },
    { id: 2, emoji: '🍛', name: 'Biryani Tray (full)', qty: 4, type: 'Non-veg', price: 25, orig: 200, mode: 'donate', time: 7, source: 'Spice Route Hostel', mystery: false },
    { id: 3, emoji: '🥣', name: 'Idli + Sambar Pack', qty: 12, type: 'Veg', price: 38, orig: 80, mode: 'discount', time: 42, source: 'Saravana Bhavan', mystery: false },
    { id: 4, emoji: '🎁', name: 'Event Snack Platter', qty: 2, type: 'Veg', price: 18, orig: 350, mode: 'donate', time: 2, source: 'Grand Hall Events', mystery: false },
    { id: 5, emoji: '🍞', name: 'Sourdough Loaf Batch', qty: 6, type: 'Veg', price: 45, orig: 150, mode: 'discount', time: 55, source: 'Golden Crust Bakery', mystery: false },
]

const initialRequests = [
    { id: 1, name: 'Ramya S.', initials: 'RS', rtype: 'user', item: 'Bakery Surprise Box', qty: 2, time: '2 min ago', dist: 3.2, food: initialFoods[0] },
    { id: 2, name: 'Anbumani Foundation', initials: 'AF', rtype: 'ngo', item: 'Biryani Tray (full)', qty: 4, time: '15 min ago', dist: 8.1, food: initialFoods[1] },
    { id: 3, name: 'Zomato Corp Lunch', initials: 'ZC', rtype: 'corp', item: 'Idli + Sambar Pack', qty: 10, time: '38 min ago', dist: 5.5, food: initialFoods[2] },
]

function distFee(dist) {
    return (dist * 2.5 + 15).toFixed(0)
}

function toMinutes(value, fallback) {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function determineFinalStatus(food) {
    if (food.mode === 'donate') return 'donated'
    if (food.ngoAlertTriggered) return 'donated'
    if (food.id % 3 === 0) return 'sold'
    if (food.id % 2 === 0) return 'wasted'
    return 'sold'
}

function applyLifecycle(food, nextTime, now = Date.now()) {
    const expiryMinutes = toMinutes(food.expiryMinutes, 120)
    const discountTriggerMinutes = toMinutes(food.discountTriggerMinutes, 60)
    const ngoTriggerMinutes = toMinutes(food.ngoTriggerMinutes, 30)
    const originalPrice = Number(food.orig ?? food.basePrice ?? 0)
    const remainingMinutes = Math.max(0, expiryMinutes - nextTime)
    const remainingPercent = expiryMinutes > 0 ? (remainingMinutes / expiryMinutes) * 100 : 0
    const ngoAlertTriggered = remainingMinutes <= ngoTriggerMinutes

    let discountedPrice = originalPrice
    if (remainingMinutes <= ngoTriggerMinutes) {
        discountedPrice = 0
    } else if (remainingMinutes <= discountTriggerMinutes) {
        discountedPrice = Math.max(0, Math.round(originalPrice * 0.5))
    }

    let finalStatus = food.finalStatus || 'active'
    let expiredAt = food.expiredAt || null

    if (remainingMinutes <= 0 && finalStatus === 'active') {
        finalStatus = determineFinalStatus({ ...food, ngoAlertTriggered })
        expiredAt = now
    }

    return {
        ...food,
        time: nextTime,
        expiryMinutes,
        discountTriggerMinutes,
        ngoTriggerMinutes,
        remainingMinutes,
        remainingPercent,
        ngoAlertTriggered,
        consumerVisibility: ngoAlertTriggered ? 'Expired' : 'Visible',
        ngoVisibility: ngoAlertTriggered ? 'Available for donation' : 'Waiting',
        discountPreview: Math.max(0, Math.round(originalPrice * 0.5)),
        price: discountedPrice,
        currentPrice: discountedPrice,
        orig: originalPrice,
        basePrice: originalPrice,
        finalStatus,
        expiredAt,
    }
}

function hydrateFood(food, now = Date.now()) {
    const expiryMinutes = toMinutes(food.expiryMinutes, 120)
    const createdAt = food.createdAt || now - Number(food.time || 0) * 60 * 1000
    const nextFood = {
        ...food,
        createdAt,
        finalStatus: food.finalStatus || 'active',
        expiryMinutes,
        discountTriggerMinutes: toMinutes(food.discountTriggerMinutes, Math.min(60, expiryMinutes)),
        ngoTriggerMinutes: toMinutes(food.ngoTriggerMinutes, Math.min(30, expiryMinutes)),
    }

    return applyLifecycle(nextFood, Number(food.time || 0), now)
}

export default function App() {
    const [page, setPage] = useState('dashboard')
    const [foods, setFoods] = useState(() => initialFoods.map((food) => hydrateFood(food)))
    const [requests, setRequests] = useState(initialRequests)
    const [selectedDelivery, setSelectedDelivery] = useState({})
    const [modalOpen, setModalOpen] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        const interval = setInterval(() => {
            setFoods((prev) =>
                prev.map((food) => ({
                    ...applyLifecycle(food, food.time + 1),
                })),
            )
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!toast) return undefined
        const timeout = setTimeout(() => setToast(null), 3000)
        return () => clearTimeout(timeout)
    }, [toast])

    const addFood = (nextFood) => {
        const now = Date.now()
        const hydrated = hydrateFood({
            ...nextFood,
            id: now,
            source: 'Golden Crust Bakery',
            time: 0,
            emoji: '🍱',
            createdAt: now,
            finalStatus: 'active',
            expiredAt: null,
        }, now)

        setFoods((prev) => [hydrated, ...prev])
        setToast('🎉 Listing published successfully!')
        setModalOpen(false)
    }

    const updateFood = (updatedFood) => {
        setFoods((prev) => prev.map((food) => {
            if (food.id !== editTarget?.id) return food
            return hydrateFood({
                ...food,
                ...updatedFood,
                finalStatus: 'active',
                expiredAt: null,
                time: 0,
                createdAt: Date.now(),
            })
        }))
        setToast('✅ Changes saved!')
        setEditTarget(null)
        setModalOpen(false)
    }

    const deleteFood = (id) => {
        setFoods((prev) => prev.filter((food) => food.id !== id))
        setToast('Item removed.')
    }

    const acceptRequest = (id) => {
        setRequests((prev) => prev.filter((request) => request.id !== id))
        setToast('Order accepted! Notifying customer.')
    }

    const declineRequest = (id) => {
        setRequests((prev) => prev.filter((request) => request.id !== id))
        setToast('Request declined.')
    }

    const selectDelivery = (requestId, delivery) => {
        setSelectedDelivery((prev) => ({ ...prev, [`del-${requestId}`]: delivery }))
    }

    const triggerAiAction = (message) => {
        setToast(message)
    }

    const urgentRequests = requests.length

    const content = useMemo(() => {
        if (page === 'listings') {
            return <Listings foods={foods} />
        }

        if (page === 'requests') {
            return (
                <RequestsClean
                    requests={requests}
                    selectedDelivery={selectedDelivery}
                    onSelectDelivery={selectDelivery}
                    onAccept={acceptRequest}
                    onDecline={declineRequest}
                    onInitiate={(message) => setToast(message)}
                    distFee={distFee}
                />
            )
        }

        if (page === 'add') {
            return <AddFood inPage onSubmitFood={addFood} />
        }

        return (
            <Dashboard
                foods={foods}
                requestsCount={urgentRequests}
                onAddFood={() => {
                    setEditTarget(null)
                    setModalOpen(true)
                }}
                onEditFood={(food) => {
                    setEditTarget(food)
                    setModalOpen(true)
                }}
                onDeleteFood={deleteFood}
                onAiAction={triggerAiAction}
            />
        )
    }, [foods, page, requests, selectedDelivery, urgentRequests])

    return (
        <>
            <Header />
            <div className="app">
                <SidebarClean page={page} setPage={setPage} listingsCount={foods.length} requestsCount={urgentRequests} />
                <div className="main">{content}</div>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false)
                    setEditTarget(null)
                }}
            >
                <AddFood
                    initialFood={editTarget}
                    onSubmitFood={editTarget ? updateFood : addFood}
                    onClose={() => {
                        setModalOpen(false)
                        setEditTarget(null)
                    }}
                />
            </Modal>

            <Toast message={toast || ''} visible={Boolean(toast)} />
        </>
    )
}
