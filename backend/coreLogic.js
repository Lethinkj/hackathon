function updatePrice(food) {
    const now = new Date();
    const timeLeft = (new Date(food.expiry_time) - now) / (1000 * 60 * 60);

    if (timeLeft < 1) return 0;
    if (timeLeft < 2) return food.original_price * 0.4;
    if (timeLeft < 4) return food.original_price * 0.7;

    return food.original_price;
}

function matchNGO(food, ngos) {
    return ngos.sort((a, b) => a.distance - b.distance || b.capacity - a.capacity)[0];
}

module.exports = { updatePrice, matchNGO };
