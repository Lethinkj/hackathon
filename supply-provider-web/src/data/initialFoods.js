import { getFoodIconBackground } from '../utils/foodTheme'

export function createInitialFoods(seedTime = Date.now()) {
    return [
        { id: 1, name: 'Bakery Surprise Box', prov: 'Golden Crust Bakery', base: 120, qty: 8, maxT: 7200, elapsed: 5100, veg: true, type: 'mystery', icon: '🥐' },
        { id: 2, name: 'Biryani Tray (full)', prov: 'Spice Route Hostel', base: 200, qty: 4, maxT: 3600, elapsed: 2900, veg: false, type: 'meal', icon: '🍛' },
        { id: 3, name: 'Idli + Sambar Pack', prov: 'Saravana Bhavan', base: 80, qty: 12, maxT: 5400, elapsed: 2600, veg: true, type: 'meal', icon: '🥣' },
        { id: 4, name: 'Event Snack Platter', prov: 'Grand Hall Events', base: 350, qty: 2, maxT: 7200, elapsed: 6800, veg: true, type: 'snack', icon: '🍱' },
        { id: 5, name: 'Fresh Juice Bottles', prov: 'Wellness Café', base: 60, qty: 20, maxT: 3600, elapsed: 1100, veg: true, type: 'bev', icon: '🧃' },
    ].map((food) => ({
        ...food,
        iconBg: getFoodIconBackground(food.type),
        status: 'available',
        expiresAt: seedTime + Math.max(0, food.maxT - food.elapsed) * 1000,
    }))
}
