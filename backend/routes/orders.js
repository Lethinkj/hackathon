const express = require("express");
const supabase = require("../supabaseClient");

const router = express.Router();

async function updateFoodStatus(foodId, status) {
    const primary = await supabase.from("food").update({ status }).eq("id", foodId);
    if (!primary.error) return;

    const fallback = await supabase.from("foods").update({ status }).eq("id", foodId);
    if (fallback.error) {
        throw fallback.error;
    }
}

async function getOrdersWithFood(userId) {
    const primary = await supabase
        .from("orders")
        .select("*, food(*)")
        .eq("user_id", userId)
        .order("pickup_time", { ascending: true });

    if (!primary.error) return primary.data || [];

    const fallback = await supabase
        .from("orders")
        .select("*, foods(*)")
        .eq("user_id", userId)
        .order("pickup_time", { ascending: true });

    if (fallback.error) throw fallback.error;

    return (fallback.data || []).map((item) => ({
        ...item,
        food: item.food || item.foods || null,
    }));
}

// Create order
router.post("/", async (req, res) => {
    try {
        const { foodId, userId, pickupTime } = req.body;

        if (!foodId || !userId || !pickupTime) {
            return res.status(400).json({ error: "foodId, userId and pickupTime are required" });
        }

        const { data: order, error } = await supabase
            .from("orders")
            .insert({
                food_id: foodId,
                user_id: userId,
                pickup_time: pickupTime,
                status: "pending",
            })
            .select()
            .single();

        if (error) throw error;

        await updateFoodStatus(foodId, "sold");

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders by user
router.get("/:userId", async (req, res) => {
    try {
        const orders = await getOrdersWithFood(req.params.userId);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
router.put("/:id", async (req, res) => {
    try {
        const { data: order, error } = await supabase
            .from("orders")
            .update({ status: req.body.status })
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
