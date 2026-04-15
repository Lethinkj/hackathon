const supabase = require("./supabaseClient");

async function addFood(newFood) {
    return supabase.from("food").insert([newFood]).select().single();
}

async function getNearbyFood() {
    return supabase.from("food").select("*").eq("status", "available");
}

async function getNgoAlerts() {
    return supabase
        .from("food")
        .select("*")
        .eq("price", 0)
        .eq("status", "available");
}

async function createOrder(order) {
    return supabase.from("orders").insert([order]).select().single();
}

async function createDonation(donation) {
    return supabase.from("donations").insert([donation]).select().single();
}

module.exports = {
    addFood,
    getNearbyFood,
    getNgoAlerts,
    createOrder,
    createDonation,
};
