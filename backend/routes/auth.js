const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const supabase = require("../supabaseClient");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supplylink_secret_key_2026";
const ALLOWED_ROLES = new Set(["consumer", "ngo"]);

function normalizePhone(phone) {
    return String(phone || "").trim().replace(/\s+/g, "");
}

function buildPhoneFallbackEmail(phone) {
    const digits = phone.replace(/\D/g, "") || Date.now().toString();
    return `phone_${digits}@phone.supplylink.local`;
}

function buildPhoneDisplayName(phone) {
    const last4 = phone.replace(/\D/g, "").slice(-4) || "user";
    return `User ${last4}`;
}

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, lat, lng, capacity } = req.body;
        const normalizedRole = role ? String(role).trim().toLowerCase() : "";

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "Name, email, password, and role are required" });
        }

        if (!ALLOWED_ROLES.has(normalizedRole)) {
            return res.status(400).json({ error: "Role must be consumer or ngo" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Check if user already exists
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle();

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
                email: normalizedEmail,
                password: hashedPassword,
                role: normalizedRole,
                lat: lat || 0,
                lng: lng || 0,
                capacity: normalizedRole === "ngo" ? capacity || 0 : 0,
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

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", normalizedEmail)
            .maybeSingle();

        if (error || !user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!ALLOWED_ROLES.has(String(user.role || "").toLowerCase())) {
            return res.status(403).json({ error: "Provider login is disabled" });
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

// Send phone OTP via Supabase Auth (Twilio-backed in Supabase dashboard).
router.post("/phone/send-otp", async (req, res) => {
    try {
        const { phone, channel } = req.body;
        const normalizedPhone = normalizePhone(phone);

        if (!normalizedPhone || !normalizedPhone.startsWith("+")) {
            return res.status(400).json({ error: "Phone must be in E.164 format, for example +15551234567" });
        }

        const { error } = await supabase.auth.signInWithOtp({
            phone: normalizedPhone,
            options: {
                channel: channel === "whatsapp" ? "whatsapp" : "sms",
                shouldCreateUser: true,
            },
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            ok: true,
            message: "OTP sent",
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify phone OTP, then map/create local app user and issue app JWT.
router.post("/phone/verify-otp", async (req, res) => {
    try {
        const { phone, token, type, name, role, lat, lng, capacity } = req.body;
        const normalizedPhone = normalizePhone(phone);
        const otpType = type || "sms";

        if (!normalizedPhone || !normalizedPhone.startsWith("+") || !token) {
            return res.status(400).json({ error: "Phone (E.164) and token are required" });
        }

        if (!["sms", "phone_change"].includes(otpType)) {
            return res.status(400).json({ error: "Invalid OTP type" });
        }

        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token,
            type: otpType,
        });

        if (otpError) {
            return res.status(400).json({ error: otpError.message || "Invalid OTP" });
        }

        const normalizedRole = role ? String(role).trim().toLowerCase() : "consumer";
        const parsedLat = Number.parseFloat(lat);
        const parsedLng = Number.parseFloat(lng);
        const parsedCapacity = Number.parseInt(capacity, 10);
        if (!ALLOWED_ROLES.has(normalizedRole)) {
            return res.status(400).json({ error: "Role must be consumer or ngo" });
        }

        const { data: existingUser, error: readError } = await supabase
            .from("users")
            .select("*")
            .eq("phone", normalizedPhone)
            .maybeSingle();

        if (readError) throw readError;

        let user = existingUser;

        if (!user) {
            const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

            const payload = {
                name: name || buildPhoneDisplayName(normalizedPhone),
                email: buildPhoneFallbackEmail(normalizedPhone),
                password: randomPasswordHash,
                phone: normalizedPhone,
                role: normalizedRole,
                lat: Number.isFinite(parsedLat) ? parsedLat : 0,
                lng: Number.isFinite(parsedLng) ? parsedLng : 0,
                capacity: Number.isInteger(parsedCapacity) ? parsedCapacity : 0,
            };

            const { data: insertedUser, error: insertError } = await supabase
                .from("users")
                .insert(payload)
                .select()
                .single();

            if (insertError) throw insertError;
            user = insertedUser;
        }

        const tokenJwt = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            token: tokenJwt,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                lat: user.lat,
                lng: user.lng,
            },
            supabase_session: otpData?.session || null,
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
            .select("id, name, email, phone, role, lat, lng, capacity, rating, created_at")
            .eq("id", decoded.id)
            .single();

        if (error || !user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

module.exports = router;
