/**
 * NGO Matching Logic
 * Matches available food donations with the best NGO
 * Sorts by distance (ascending) and capacity (descending)
 */

function calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula for distance in km
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function matchNGO(food, ngos, foodLocation) {
    if (!ngos || ngos.length === 0) return null;

    const scored = ngos.map((ngo) => {
        const distance = calculateDistance(
            foodLocation.lat,
            foodLocation.lng,
            ngo.location.lat,
            ngo.location.lng
        );
        return { ...ngo.toObject ? ngo.toObject() : ngo, distance };
    });

    // Sort: nearest first, then highest capacity
    scored.sort((a, b) => a.distance - b.distance || b.capacity - a.capacity);

    return scored[0];
}

function matchNGOs(food, ngos, foodLocation, limit = 5) {
    if (!ngos || ngos.length === 0) return [];

    const scored = ngos.map((ngo) => {
        const distance = calculateDistance(
            foodLocation.lat,
            foodLocation.lng,
            ngo.location.lat,
            ngo.location.lng
        );
        return { ...ngo.toObject ? ngo.toObject() : ngo, distance };
    });

    scored.sort((a, b) => a.distance - b.distance || b.capacity - a.capacity);

    return scored.slice(0, limit);
}

module.exports = { matchNGO, matchNGOs, calculateDistance };
