const express = require("express");
const supabase = require("../supabaseClient");

const router = express.Router();

// Create order
router.post("/", async (req, res) => {
    try {
        const { foodId, userId, pickupTime } = req.body;

        // Mark food as sold
        await supabase.from("foods").update({ status: "sold" }).eq("id", foodId);

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
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders by user
router.get("/:userId", async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from("orders")
            .select("*, foods(*)")
            .eq("user_id", req.params.userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
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
