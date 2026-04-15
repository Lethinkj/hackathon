export function updatePrice(food) {
  const now = new Date()
  const timeLeft = (new Date(food.expiry_time) - now) / (1000 * 60 * 60)

  if (timeLeft < 1) return 0
  if (timeLeft < 2) return food.original_price * 0.4
  if (timeLeft < 4) return food.original_price * 0.7

  return food.original_price
}

export function withDynamicPrice(food) {
  const price = updatePrice(food)
  const original = Number(food.original_price || 0)
  return {
    ...food,
    price,
    discount: original > 0 ? Math.round(((original - price) / original) * 100) : 0,
  }
}
