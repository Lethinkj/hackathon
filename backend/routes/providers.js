const express = require("express");
const supabase = require("../supabaseClient");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_PROVIDER_TYPES = new Set(["restaurant", "hotel", "catering"]);

const LEGACY_PROVIDER_TYPE_BY_APP_TYPE = {
    restaurant: "Cafe",
    hotel: "Hotel",
    catering: "Catering Services",
};

function normalizeProviderProfile(row) {
    if (!row) return null;

    const mappedType = String(row.type || row.provider_type || "restaurant").toLowerCase();

    return {
        ...row,
        name: row.name || row.business_name || "Provider",
        business_name: row.business_name || row.name || "Provider",
        type: ALLOWED_PROVIDER_TYPES.has(mappedType) ? mappedType : "restaurant",
        location: row.location || row.address || "Not set",
    };
}

function buildProviderPayload(input, userId) {
    const displayName = String(input?.business_name || input?.name || "My Business").trim() || "My Business";
    const latitude = Number.isFinite(Number(input?.latitude ?? input?.lat)) ? Number(input?.latitude ?? input?.lat) : 0;
    const longitude = Number.isFinite(Number(input?.longitude ?? input?.lng)) ? Number(input?.longitude ?? input?.lng) : 0;

    const payload = {
        user_id: userId,
        name: displayName,
        business_name: displayName,
        type: String(input?.type || "restaurant").trim().toLowerCase() || "restaurant",
        provider_type: LEGACY_PROVIDER_TYPE_BY_APP_TYPE[String(input?.type || "restaurant").trim().toLowerCase()] || "Cafe",
        latitude,
        longitude,
    };

    if (!ALLOWED_PROVIDER_TYPES.has(payload.type)) {
        payload.type = "restaurant";
    }

    return payload;
}

function isMissingColumnError(error) {
    const lower = String(error?.message || "").toLowerCase();
    return error?.code === "PGRST204" || lower.includes("does not exist") || lower.includes("could not find");
}

function pickFields(payload, allowedFields) {
    return Object.fromEntries(Object.entries(payload).filter(([field]) => allowedFields.includes(field)));
}

async function upsertProviderProfile(userId, payload) {
    const existing = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (existing.error) throw existing.error;

    const candidates = [
        ["user_id", "business_name", "provider_type", "type", "name", "latitude", "longitude"],
        ["user_id", "business_name", "type", "name", "latitude", "longitude"],
        ["user_id", "name", "type", "latitude", "longitude"],
        ["user_id", "business_name", "provider_type", "type", "name"],
        ["user_id", "business_name", "type", "name"],
        ["user_id", "name", "type"],
    ];

    let lastError;
    for (const fields of candidates) {
        const candidatePayload = pickFields(payload, fields);
        if (!candidatePayload.user_id) candidatePayload.user_id = userId;

        let response;
        if (existing.data?.id) {
            response = await supabase
                .from("providers")
                .update(candidatePayload)
                .eq("id", existing.data.id)
                .select("*")
                .single();
        } else {
            response = await supabase
                .from("providers")
                .insert(candidatePayload)
                .select("*")
                .single();
        }

        if (!response.error) {
            return response.data;
        }

        if (isMissingColumnError(response.error)) {
            lastError = response.error;
            continue;
        }

        throw response.error;
    }

    throw lastError || new Error("Unable to upsert provider profile");
}

router.get("/me", requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("providers")
            .select("*")
            .eq("user_id", req.auth.userId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        return res.json({ profile: normalizeProviderProfile(data) });
    } catch (err) {
        return res.status(500).json({ error: err.message || "Failed to fetch provider profile" });
    }
});

router.put("/me", requireAuth, async (req, res) => {
    try {
        const payload = buildProviderPayload(req.body, req.auth.userId);

        const data = await upsertProviderProfile(req.auth.userId, payload);
        return res.json({ profile: normalizeProviderProfile(data) });
    } catch (err) {
        const lower = String(err?.message || "").toLowerCase();
        if (err?.code === "23502" && lower.includes("business_name")) {
            return res.status(500).json({
                error: "providers.business_name is required by your schema. Backend now maps name -> business_name; restart backend and retry.",
            });
        }

        return res.status(500).json({ error: err.message || "Failed to save provider profile" });
    }
});

module.exports = router;
