import { calculatePrice, getTimeRatio } from './pricing'

export function getMarketRate(foods) {
    const totalTime = foods.reduce((sum, food) => {
        const remainingSeconds = Math.max(0, Math.floor((food.expiresAt - Date.now()) / 1000))
        return sum + remainingSeconds
    }, 0)

    return Math.min(94, Math.max(42, Math.round(68 + ((totalTime - 13000) / 13000) * 18)))
}

export function getTotalQuantity(foods) {
    return foods.reduce((sum, food) => sum + Number(food.qty || 0), 0)
}

export function getAverageSavings(foods) {
    if (!foods.length) return 0

    const totalSaved = foods.reduce((sum, food) => {
        const remainingSeconds = Math.max(0, Math.floor((food.expiresAt - Date.now()) / 1000))
        const price = calculatePrice(food.base, remainingSeconds, food.maxT)
        return sum + Math.max(0, Number(food.base || 0) - price)
    }, 0)

    return Math.round(totalSaved / foods.length)
}

export function getUrgentFoods(foods) {
    return foods.filter((food) => getTimeRatio(Math.max(0, Math.floor((food.expiresAt - Date.now()) / 1000)), food.maxT) <= 0.2)
}

export function getWatchFoods(foods) {
    return foods.filter((food) => {
        const ratio = getTimeRatio(Math.max(0, Math.floor((food.expiresAt - Date.now()) / 1000)), food.maxT)
        return ratio > 0.2 && ratio <= 0.5
    })
}
