const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supplylink_secret_key_2026";

function requireAuth(req, res, next) {
    const header = String(req.headers.authorization || "").trim();

    if (!header.toLowerCase().startsWith("bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = header.slice(7).trim();
    if (!token) {
        return res.status(401).json({ error: "Missing bearer token" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.auth = {
            userId: decoded.id,
            role: decoded.role,
        };
        return next();
    } catch (_err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = {
    requireAuth,
};
