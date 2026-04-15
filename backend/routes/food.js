const express = require("express");
const supabase = require("../supabaseClient");
const { applyDynamicPricing } = require("../services/pricing");

const router = express.Router();

// Add Food (Provider)
router.post("/add-food", async (req, res) => {
    try {
        const { providerId, foodName, quantity, type, price, originalPrice, expiryTime } = req.body;

        const { data: food, error } = await supabase
            .from("foods")
            .insert({
                provider_id: providerId,
                food_name: foodName,
                quantity: quantity || 1,
                type: type || "Veg",
                price: price || 0,
                original_price: originalPrice || price || 0,
                expiry_time: expiryTime,
                status: "available",
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(food);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all available food (with dynamic pricing)
router.get("/nearby-food", async (req, res) => {
    try {
        const { data: foods, error } = await supabase
            .from("foods")
            .select("*")
            .eq("status", "available")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Map Supabase column names to the pricing service expectations
        const mapped = foods.map((f) => ({
            ...f,
            originalPrice: f.original_price,
            expiryTime: f.expiry_time,
            foodName: f.food_name,
            providerId: f.provider_id,
        }));
        const pricedFoods = applyDynamicPricing(mapped);
        res.json(pricedFoods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get NGO Alerts (free food near expiry)
router.get("/ngo-alerts", async (req, res) => {
    try {
        const { data: foods, error } = await supabase
            .from("foods")
            .select("*")
            .eq("status", "available");

        if (error) throw error;

        const mapped = foods.map((f) => ({
            ...f,
            originalPrice: f.original_price,
            expiryTime: f.expiry_time,
            foodName: f.food_name,
            providerId: f.provider_id,
        }));
        const pricedFoods = applyDynamicPricing(mapped);
        const alerts = pricedFoods.filter((f) => f.price === 0 || f.discount >= 90);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single food item
router.get("/:id", async (req, res) => {
    try {
        const { data: food, error } = await supabase
            .from("foods")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (error) return res.status(404).json({ error: "Food not found" });

        const mapped = {
            ...food,
            originalPrice: food.original_price,
            expiryTime: food.expiry_time,
            foodName: food.food_name,
            providerId: food.provider_id,
        };
        const [pricedFood] = applyDynamicPricing([mapped]);
        res.json(pricedFood);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update food item
router.put("/:id", async (req, res) => {
    try {
        const updateData = {};
        if (req.body.foodName) updateData.food_name = req.body.foodName;
        if (req.body.quantity) updateData.quantity = req.body.quantity;
        if (req.body.type) updateData.type = req.body.type;
        if (req.body.price !== undefined) updateData.price = req.body.price;
        if (req.body.originalPrice) updateData.original_price = req.body.originalPrice;
        if (req.body.expiryTime) updateData.expiry_time = req.body.expiryTime;
        if (req.body.status) updateData.status = req.body.status;

        const { data: food, error } = await supabase
            .from("foods")
            .update(updateData)
            .eq("id", req.params.id)
            .select()
            .single();

        if (error) return res.status(404).json({ error: "Food not found" });
        res.json(food);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete food item
router.delete("/:id", async (req, res) => {
    try {
        const { error } = await supabase.from("foods").delete().eq("id", req.params.id);
        if (error) throw error;
        res.json({ message: "Food deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get provider's food listings
router.get("/provider/:providerId", async (req, res) => {
    try {
        const { data: foods, error } = await supabase
            .from("foods")
            .select("*")
            .eq("provider_id", req.params.providerId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped = foods.map((f) => ({
            ...f,
            originalPrice: f.original_price,
            expiryTime: f.expiry_time,
            foodName: f.food_name,
            providerId: f.provider_id,
        }));
        const pricedFoods = applyDynamicPricing(mapped);
        res.json(pricedFoods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get stats for provider dashboard
router.get("/stats/:providerId", async (req, res) => {
    try {
        const providerId = req.params.providerId;

        const { count: totalListings } = await supabase
            .from("foods")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", providerId);

        const { count: activeListings } = await supabase
            .from("foods")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", providerId)
            .eq("status", "available");

        const { count: soldItems } = await supabase
            .from("foods")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", providerId)
            .eq("status", "sold");

        const { count: donatedItems } = await supabase
            .from("foods")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", providerId)
            .eq("status", "donated");

        res.json({
            totalListings: totalListings || 0,
            activeListings: activeListings || 0,
            soldItems: soldItems || 0,
            donatedItems: donatedItems || 0,
            wasteReduced: (soldItems || 0) + (donatedItems || 0),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
