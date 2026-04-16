const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const supabase = require("../supabaseClient");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supplylink_secret_key_2026";
const ALLOWED_ROLES = new Set(["provider", "consumer", "ngo"]);

function normalizeIdentifier(value) {
    return String(value || "").trim().toLowerCase();
}

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
        const { name, email, username, phone, password, role, lat, lng, capacity, source_of_food_provider } = req.body;
        const normalizedRole = role ? String(role).trim().toLowerCase() : "";
        const normalizedPhone = normalizePhone(phone);
        const normalizedUsername = normalizeIdentifier(username);
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const hasProviderIdentifier = Boolean(normalizedPhone || normalizedUsername || normalizedEmail);

        if (!password || !role) {
            return res.status(400).json({ error: "Password and role are required" });
        }

        if (!ALLOWED_ROLES.has(normalizedRole)) {
            return res.status(400).json({ error: "Role must be provider, consumer, or ngo" });
        }

        if (normalizedRole === "provider" && !hasProviderIdentifier) {
            return res.status(400).json({ error: "Provider signup requires phone, username, or email" });
        }

        const finalName = String(name || normalizedUsername || normalizedPhone || "Provider").trim();
        const fallbackEmail = normalizedEmail || (normalizedUsername
            ? `provider_${normalizedUsername}@provider.left2lift.local`
            : normalizedPhone
                ? buildPhoneFallbackEmail(normalizedPhone)
                : `provider_${Date.now()}@provider.left2lift.local`);

        // Check if user already exists
        const matchers = [];
        if (fallbackEmail) matchers.push(`email.eq.${fallbackEmail}`);
        if (normalizedPhone) matchers.push(`phone.eq.${normalizedPhone}`);
        if (normalizedUsername) matchers.push(`username.eq.${normalizedUsername}`);

        let existing = null;
        if (matchers.length) {
            const lookup = await supabase
                .from("users")
                .select("id")
                .or(matchers.join(","))
                .maybeSingle();

            if (lookup.error && lookup.error.code !== "PGRST116") {
                throw lookup.error;
            }
            existing = lookup.data;
        }

        if (existing) {
            return res.status(400).json({ error: "Account already exists with this phone, username, or email" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: user, error } = await supabase
            .from("users")
            .insert({
                name: finalName,
                email: fallbackEmail,
                username: normalizedUsername || null,
                phone: normalizedPhone || null,
                password: hashedPassword,
                role: normalizedRole,
                lat: lat || 0,
                lng: lng || 0,
                capacity: normalizedRole === "ngo" ? capacity || 0 : 0,
                source_of_food_provider: normalizedRole === "provider" ? (source_of_food_provider || null) : null,
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
                username: user.username,
                phone: user.phone,
                role: user.role,
                lat: user.lat,
                lng: user.lng,
                source_of_food_provider: user.source_of_food_provider,
            },
        });
    } catch (err) {
        const message = String(err?.message || "");
        if (message.includes("column users.") && message.includes("does not exist")) {
            return res.status(500).json({
                error: "Database schema is outdated. Run backend/migrations/20260416_provider_credentials_and_source.sql and retry.",
                details: message,
            });
        }

        res.status(500).json({ error: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, identifier, phone, username, password } = req.body;
        const normalizedIdentifier = normalizeIdentifier(identifier || email || username || phone);
        const normalizedPhone = normalizePhone(phone || identifier);

        if (!normalizedIdentifier || !password) {
            return res.status(400).json({ error: "Phone or username and password are required" });
        }

        const matchers = [
            `email.eq.${normalizedIdentifier}`,
            `username.eq.${normalizedIdentifier}`,
        ];

        if (normalizedPhone && normalizedPhone.startsWith("+")) {
            matchers.push(`phone.eq.${normalizedPhone}`);
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .or(matchers.join(","))
            .maybeSingle();

        if (error || !user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!ALLOWED_ROLES.has(String(user.role || "").toLowerCase())) {
            return res.status(403).json({ error: "Role is not allowed" });
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
                username: user.username,
                phone: user.phone,
                role: user.role,
                lat: user.lat,
                lng: user.lng,
                source_of_food_provider: user.source_of_food_provider,
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
            return res.status(400).json({ error: "Role must be provider, consumer, or ngo" });
        }

        const lookupByPhone = await supabase.from("users").select("*").eq("phone", normalizedPhone).maybeSingle();
        if (lookupByPhone.error) {
            return res.status(400).json({
                error: lookupByPhone.error.message,
                details: lookupByPhone.error.details || null,
                hint: lookupByPhone.error.hint || null,
            });
        }

        const fallbackEmail = buildPhoneFallbackEmail(normalizedPhone);
        let user = lookupByPhone.data;

        if (!user) {
            const lookupByEmail = await supabase.from("users").select("*").eq("email", fallbackEmail).maybeSingle();

            if (lookupByEmail.error) {
                return res.status(400).json({
                    error: lookupByEmail.error.message,
                    details: lookupByEmail.error.details || null,
                    hint: lookupByEmail.error.hint || null,
                });
            }

            user = lookupByEmail.data;
        }

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

            if (insertError) {
                return res.status(400).json({
                    error: insertError.message,
                    details: insertError.details || null,
                    hint: insertError.hint || null,
                });
            }
            user = insertedUser;
        } else if (!user.phone) {
            const { data: updatedUser, error: updateError } = await supabase
                .from("users")
                .update({ phone: normalizedPhone })
                .eq("id", user.id)
                .select()
                .single();

            if (updateError) {
                return res.status(400).json({
                    error: updateError.message,
                    details: updateError.details || null,
                    hint: updateError.hint || null,
                });
            }

            user = updatedUser;
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
            .select("id, name, email, username, phone, role, lat, lng, capacity, rating, source_of_food_provider, created_at")
            .eq("id", decoded.id)
            .single();

        if (error || !user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

module.exports = router;
