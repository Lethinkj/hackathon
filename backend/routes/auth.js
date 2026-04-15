const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const supabase = require("../supabaseClient");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supplylink_secret_key_2026";

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, lat, lng, capacity } = req.body;

        // Check if user already exists
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: user, error } = await supabase
            .from("users")
            .insert({
                name,
                email,
                password: hashedPassword,
                role,
                lat: lat || 0,
                lng: lng || 0,
                capacity: capacity || 0,
            })
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                lat: user.lat,
                lng: user.lng,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                lat: user.lat,
                lng: user.lng,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current user
router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "No token provided" });

        const decoded = jwt.verify(token, JWT_SECRET);

        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, role, lat, lng, capacity, rating, created_at")
            .eq("id", decoded.id)
            .single();

        if (error || !user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

module.exports = router;
