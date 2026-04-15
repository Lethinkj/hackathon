const express = require("express");
const supabase = require("../supabaseClient");
const { matchNGOs } = require("../services/ngoMatch");

const router = express.Router();

// Create donation
router.post("/", async (req, res) => {
    try {
        const { foodId, ngoId } = req.body;

        // Mark food as donated
        await supabase.from("foods").update({ status: "donated", price: 0 }).eq("id", foodId);

        const { data: donation, error } = await supabase
            .from("donations")
            .insert({
                food_id: foodId,
                ngo_id: ngoId,
                volunteer_assigned: false,
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(donation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all donations
router.get("/", async (req, res) => {
    try {
        const { data: donations, error } = await supabase
            .from("donations")
            .select("*, foods(*), users!donations_ngo_id_fkey(name, email, lat, lng)")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json(donations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Match NGOs for a food item
router.get("/match/:foodId", async (req, res) => {
    try {
        const { data: food, error: foodErr } = await supabase
            .from("foods")
            .select("*, users!foods_provider_id_fkey(lat, lng)")
            .eq("id", req.params.foodId)
            .single();

        if (foodErr || !food) return res.status(404).json({ error: "Food not found" });

        const { data: ngos, error: ngoErr } = await supabase
            .from("users")
            .select("*")
            .eq("role", "ngo");

        if (ngoErr) throw ngoErr;

        const providerLocation = food.users
            ? { lat: food.users.lat, lng: food.users.lng }
            : { lat: 0, lng: 0 };

        // Map for ngoMatch service
        const ngosMapped = ngos.map((n) => ({
            ...n,
            location: { lat: n.lat, lng: n.lng },
        }));

        const matched = matchNGOs(food, ngosMapped, providerLocation);
        res.json(matched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
