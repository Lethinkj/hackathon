export function updatePrice(food) {
    const now = new Date()
    const timeLeft = (new Date(food.expiry_time) - now) / (1000 * 60 * 60)

    if (timeLeft < 1) return 0
    if (timeLeft < 2) return food.original_price * 0.4
    if (timeLeft < 4) return food.original_price * 0.7

    return food.original_price
}

export function applyDynamicPricing(foods) {
    return foods.map((food) => {
        const originalPrice = Number(food.original_price || 0)
        const price = Number(updatePrice(food))
        return {
            ...food,
            price,
            discount: originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
        }
    })
}
