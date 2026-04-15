/**
 * Dynamic Pricing Service
 * Price drops as food approaches expiry time
 */

function updatePrice(food) {
    const now = new Date();
    const timeLeft = (new Date(food.expiryTime || food.expiry_time) - now) / (1000 * 60 * 60); // hours

    const originalPrice = food.originalPrice || food.original_price || 0;

    if (timeLeft <= 0) return 0;
    if (timeLeft < 1) return Math.round(originalPrice * 0.1);
    if (timeLeft < 2) return Math.round(originalPrice * 0.4);
    if (timeLeft < 4) return Math.round(originalPrice * 0.7);
    if (timeLeft < 6) return Math.round(originalPrice * 0.85);

    return originalPrice;
}

/**
 * Apply dynamic pricing to a list of food items
 */
function applyDynamicPricing(foods) {
    return foods.map((food) => {
        const originalPrice = food.originalPrice || food.original_price || 0;
        const dynamicPrice = updatePrice(food);
        const discount = originalPrice > 0
            ? Math.round(((originalPrice - dynamicPrice) / originalPrice) * 100)
            : 0;
        return {
            ...(food.toObject ? food.toObject() : food),
            price: dynamicPrice,
            discount,
        };
    });
}

module.exports = { updatePrice, applyDynamicPricing };
