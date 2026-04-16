const supabase = require("./supabaseClient");

// Subscribe to food listings (new, updates, deletions)
function subscribeFoodUpdates(onFoodChange) {
    return supabase
        .channel("food-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "food" },
            (payload) => onFoodChange(payload)
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "foods" },
            (payload) => onFoodChange(payload)
        )
        .subscribe();
}

// Subscribe to orders (new orders, status updates)
function subscribeOrderUpdates(onOrderChange) {
    return supabase
        .channel("order-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            (payload) => onOrderChange(payload)
        )
        .subscribe();
}

// Subscribe to requests (consumer/NGO requests)
function subscribeRequestUpdates(onRequestChange) {
    return supabase
        .channel("request-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "requests" },
            (payload) => onRequestChange(payload)
        )
        .subscribe();
}

// Subscribe to donations
function subscribeDonationUpdates(onDonationChange) {
    return supabase
        .channel("donation-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "donations" },
            (payload) => onDonationChange(payload)
        )
        .subscribe();
}

// Subscribe to user updates (ratings, status)
function subscribeUserUpdates(onUserChange) {
    return supabase
        .channel("user-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "users" },
            (payload) => onUserChange(payload)
        )
        .subscribe();
}

// Comprehensive subscription setup
function setupRealtimeListeners({
    onFoodChange,
    onOrderChange,
    onRequestChange,
    onDonationChange,
    onUserChange,
}) {
    const channels = [];

    if (onFoodChange) {
        channels.push(subscribeFoodUpdates(onFoodChange));
    }
    if (onOrderChange) {
        channels.push(subscribeOrderUpdates(onOrderChange));
    }
    if (onRequestChange) {
        channels.push(subscribeRequestUpdates(onRequestChange));
    }
    if (onDonationChange) {
        channels.push(subscribeDonationUpdates(onDonationChange));
    }
    if (onUserChange) {
        channels.push(subscribeUserUpdates(onUserChange));
    }

    return channels;
}

// Unsubscribe from all channels
function unsubscribeAll(channels) {
    channels.forEach((channel) => {
        supabase.removeAllChannels(channel);
    });
}

module.exports = {
    subscribeFoodUpdates,
    subscribeOrderUpdates,
    subscribeRequestUpdates,
    subscribeDonationUpdates,
    subscribeUserUpdates,
    setupRealtimeListeners,
    unsubscribeAll,
};
